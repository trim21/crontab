const exec = require("@actions/exec").exec;
const assert = require("assert");

const path = require("path");
const fs = require("fs");

async function main() {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
  assert(ACCESS_TOKEN.length !== 0, "no access token given");
  const cwd = process.cwd();
  const repos = {
    main: "https://github.com/ScoopInstaller/Main",
    dorado: "https://github.com/chawyehsu/dorado.git",
    everyx: "https://github.com/everyx/scoop-bucket",
    extras: "https://github.com/lukesampson/scoop-extras",
    "github-gh": "https://github.com/cli/scoop-gh",
    "nerd-fonts": "https://github.com/matthewjberger/scoop-nerd-fonts",
    versions: "https://github.com/ScoopInstaller/Versions",
  };

  for (const [repoName, url] of Object.entries(repos)) {
    const repoDir = path.join(cwd, "repos", repoName);
    const options = { cwd: repoDir };
    if (!fs.existsSync(repoDir)) {
      const remote = `https://trim21:${ACCESS_TOKEN}@gitee.com/scoop-bucket/${repoName}.git`;
      await exec("git", ["clone", url, repoDir]);
      await exec("git", ["remote", "add", "gitea", remote], options);
    } else {
      await exec("git", ["pull"], options);
    }

    await exec("git", ["push", "--force", "gitea"], options);
  }
}

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
