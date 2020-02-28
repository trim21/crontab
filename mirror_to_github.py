import subprocess
import os

ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
assert ACCESS_TOKEN
CWD = os.path.abspath(os.getcwd())


def main():
    repos = {"mit-6.824": "https://e.coding.net/Trim21/mit-6.824.git"}
    for repo_name, remote in repos.items():
        repo_dir = os.path.join(CWD, repo_name)
        if os.path.exists(repo_dir):
            os.chdir(repo_dir)
            call(f"git fetch origin")
            call("git fetch github")
        else:
            call(f"git clone --mirror {remote} {repo_dir}")
            os.chdir(repo_dir)
            call(
                f"git remote add --mirror=push github https://Trim21:{ACCESS_TOKEN}@github.com/Trim21/{repo_name}.git"
            )

        call("git push github")


def call(cmd, exit_on_error=True) -> bool:
    code = subprocess.run(cmd.split(" ")).returncode
    if exit_on_error and (code != 0):
        exit(code)
    return code != 0


if __name__ == "__main__":
    main()
