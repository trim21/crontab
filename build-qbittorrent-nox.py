import contextlib
import shlex
import subprocess
from pathlib import Path

libtorrent_path = Path("libtorrent").resolve()

with contextlib.chdir(libtorrent_path):
    subprocess.check_call(
        shlex.split(
            """
            cmake -B build -G Ninja -D CMAKE_BUILD_TYPE=RelWithDebInfo -D deprecated-functions=OFF \
                -D CMAKE_C_COMPILER_LAUNCHER=ccache -D CMAKE_CXX_COMPILER_LAUNCHER=ccache
            """
        )
    )
    subprocess.check_call(shlex.split("cmake --build build"))
    subprocess.check_call(shlex.split("sudo cmake --install build"))

subprocess.check_call(shlex.split("""
    cmake -B build -G Ninja -D BUILD_SHARED_LIBS=OFF -D CMAKE_BUILD_TYPE=RelWithDebInfo \
    -D TESTING=OFF -D QT6=ON -D GUI=OFF \
    -D CMAKE_C_COMPILER_LAUNCHER=ccache -D CMAKE_CXX_COMPILER_LAUNCHER=ccache
"""))

subprocess.check_call(shlex.split("cmake --build build"))
