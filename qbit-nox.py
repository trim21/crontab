import os
import shlex
import shutil
import subprocess
from pathlib import Path

import httpx
from contextlib import chdir as chdir_ctx

project_base_path = Path(__file__, "../src/").resolve()

qt_version = "6.8.0"
# qt_version = "6.7.2"

libtorrent_path = project_base_path.joinpath("libtorrent").resolve()
qbittorrent_path = project_base_path.joinpath("qBittorrent").resolve()
boost_path = project_base_path.joinpath("boost").resolve()
qt6_src_path = project_base_path.joinpath(f"qt").resolve()

CCACHE_DIR = project_base_path.parent.joinpath(".ccache")
archive_path = project_base_path.joinpath("archive").resolve()

cmake_prefix_path = project_base_path.parent.joinpath("include").resolve()
build_path = project_base_path.parent.joinpath("build").resolve()

project_base_path.mkdir(exist_ok=True, parents=True)
archive_path.mkdir(exist_ok=True)

build_path.mkdir(exist_ok=True, parents=True)
CCACHE_DIR.mkdir(exist_ok=True)


def ccache_env(p: str):
    return {}
    t = CCACHE_DIR.parent.joinpath(".cache-per-project", p).resolve()
    t.mkdir(exist_ok=True, parents=True)
    t.joinpath("ccache.conf").write_text("\n".join(["max-files=0", "max-size=0"]))
    return {
        "CMAKE_CXX_COMPILER_LAUNCHER": "ccache",
        "CMAKE_C_COMPILER_LAUNCHER": "ccache",
        "CCACHE_DIR": t.as_posix(),
    }


COMMON_ENVIRON = {
    "CMAKE_INSTALL_PREFIX": cmake_prefix_path.as_posix(),
}


def compile_qt():
    with chdir_ctx(qt6_src_path):
        qt_build_path = build_path.joinpath(f"qt-{qt_version}")
        if not qt_build_path.exists():
            qt_build_path.mkdir(exist_ok=True)
            with chdir_ctx(qt_build_path):
                subprocess.check_call(
                    [
                        qt6_src_path.joinpath("configure").as_posix(),
                        *shlex.split(
                            f"""
                        -submodules qtbase,qttools
                        -prefix '{cmake_prefix_path}'
                        """,
                        ),
                        "-static",
                        # "-shared",
                    ],
                    env=os.environ | COMMON_ENVIRON,
                )
        with chdir_ctx(qt_build_path):
            subprocess.check_call(
                shlex.split("cmake --build ."),
                env=os.environ | COMMON_ENVIRON,
            )
            subprocess.check_call(shlex.split("cmake --install ."))


def ensure_boost():
    with chdir_ctx(boost_path):
        build_boost_path = build_path.joinpath("boost")
        build_boost_path.mkdir(exist_ok=True)
        with chdir_ctx(build_boost_path):
            for shared in [
                # "ON",
                "OFF",
            ]:
                subprocess.check_call(
                    [
                        "cmake",
                        boost_path,
                        "-D",
                        f"BUILD_SHARED_LIBS={shared}",
                        "-D",
                        "BUILD_TESTING=OFF",
                    ],
                    env=os.environ | COMMON_ENVIRON,
                )
                subprocess.check_call(
                    shlex.split("cmake --build . --config RelWithDebInfo"),
                    env=os.environ | COMMON_ENVIRON,
                )
                subprocess.check_call(
                    shlex.split(
                        f"""
                        cmake --install .
                          --config RelWithDebInfo
                          --prefix '{cmake_prefix_path}'
                    """
                    )
                )


# lib_torrent_version = "v2.0.10"
lib_torrent_version = "v1.2.19"


def ensure_libtorrent():
    with chdir_ctx(libtorrent_path):
        expected_version = subprocess.check_output(
            ["git", "rev-parse", lib_torrent_version]
        )
        if expected_version != subprocess.check_output(["git", "rev-parse", "HEAD"]):
            subprocess.check_call(["git", "checkout", "--force", lib_torrent_version])
            subprocess.check_call(shlex.split("git clean -fd"))
            subprocess.check_call(["git", "submodule", "update", "--init"])
            subprocess.check_call(shlex.split("git submodule foreach git clean -fd"))

    build_path.joinpath("libtorrent").mkdir(exist_ok=True)
    with chdir_ctx(libtorrent_path):
        for shared in [
            # "ON",
            "OFF",
        ]:
            subprocess.check_call(
                shlex.split(
                    f"""
                    cmake -B {build_path.joinpath("libtorrent")} -G Ninja
                        -D CMAKE_CXX_FLAGS='-march=native'
                        -D CMAKE_BUILD_TYPE=RelWithDebInfo
                        -D deprecated-functions=OFF
                        -D BUILD_SHARED_LIBS={shared}
                        -D BOOST_ROOT={cmake_prefix_path}
                        -D CMAKE_INSTALL_PREFIX={cmake_prefix_path}
                        -D CMAKE_INCLUDE_PATH={cmake_prefix_path / "include"}
                        -D CMAKE_LIBRARY_PATH={cmake_prefix_path / "lib"}
                        -D CMAKE_INSTALL_LIBDIR=lib
                    """,
                ),
                env=os.environ | COMMON_ENVIRON,
            )
            subprocess.check_call(
                shlex.split(f"""cmake --build {build_path / "libtorrent"}"""),
                env=os.environ | COMMON_ENVIRON,
            )
            subprocess.check_call(
                shlex.split(
                    f"""cmake --install {build_path / "libtorrent"} --prefix {cmake_prefix_path}"""
                ),
                env=os.environ | COMMON_ENVIRON,
            )


def compile_qb():
    subprocess.check_call(
        [
            "git",
            "clone",
            "--recurse-submodules",
            "--branch",
            os.environ["QB_VERSION"],
            "https://github.com/qbittorrent/qBittorrent.git",
            qbittorrent_path.as_posix(),
        ],
    )
    with chdir_ctx(qbittorrent_path):
        shutil.rmtree(build_path.joinpath("qb"), ignore_errors=True)
        # build_path.joinpath("qb").joinpath("CMakeCache.txt").unlink(missing_ok=True)
        subprocess.check_call(
            [
                "cmake",
                *["-B", build_path.joinpath("qb").as_posix()],
                *["-G", "Ninja"],
                *["-D", "TESTING=OFF", "-D", "GUI=OFF"],
                *["-D", "CMAKE_BUILD_TYPE=RelWithDebInfo"],
                *["-D", f"BOOST_ROOT={cmake_prefix_path}"],
                *["-D", f"CMAKE_PREFIX_PATH={cmake_prefix_path}"],
                *["-D", f"CMAKE_INCLUDE_PATH={cmake_prefix_path / 'include'}"],
                *["-D", f"CMAKE_LIBRARY_PATH={cmake_prefix_path / 'lib'}"],
                "-DCMAKE_CXX_FLAGS='-march=native -Werror -Wno-error=deprecated-declarations'",
                "-DBoost_USE_STATIC_LIBS=ON",
                # *shlex.split("-D CMAKE_FIND_LIBRARY_SUFFIXES=.so;.a"),
                # *shlex.split("-D CMAKE_EXE_LINKER_FLAGS='-static -shared-libgcc'"),
                # *shlex.split("-D ZLIB_USE_STATIC_LIBS=ON"),
                # *shlex.split("-D ZLIB_LIBRARY=/usr/lib/x86_64-linux-gnu/libz.a"),
                # *shlex.split("-D OPENSSL_USE_STATIC_LIBS=true"),
            ],
            env=os.environ | COMMON_ENVIRON | ccache_env("qb"),
        )

        subprocess.check_call(
            shlex.split(f"cmake --build {build_path / 'qb'}"),
            env=os.environ | COMMON_ENVIRON,
        )


ensure_boost()
ensure_libtorrent()
compile_qt()
compile_qb()
