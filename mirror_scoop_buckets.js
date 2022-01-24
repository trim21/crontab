const { getExecOutput } = require("@actions/exec");
const assert = require("assert");

const fs = require("fs");
const path = require("path");

function main() {
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

  const promises = Object.entries(repos)
    .map(([repoName, url]) => async () => {
      let out = [];
      const repoDir = path.join(cwd, "repos", repoName);
      const options = { cwd: repoDir, silent: true };
      if (!fs.existsSync(repoDir)) {
        const remote = `https://trim21:${ACCESS_TOKEN}@gitee.com/scoop-bucket/${repoName}.git`;
        out.push(await getExecOutput("git", ["clone", url, repoDir]));
        out.push(await getExecOutput("git", ["remote", "add", "gitee", remote], options));
      } else {
        out.push(await getExecOutput("git", ["fetch", "origin"], options));
      }

      out.push(await getExecOutput("git", ["fetch", "gitee"], options));
      out.push(await getExecOutput("git", ["checkout", "origin/master"], options));
      out.push(await getExecOutput("git", ["push", "--force", "gitee", "master"], options));
      return out;
    })
    .map((fn) => fn());

  Promise.all(promises)
    .then((output) => {
      console.log(output.reduce((p, c) => p.stdout + p.stderr + c.stdout + c.stderr));
    })
    .catch((err) => {
      console.log(err)

      process.exit(1);
    });
}

main();
