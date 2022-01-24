const _exec = require("@actions/exec");
const assert = require("assert");

const fs = require("fs");
const path = require("path");

/**
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {object?} options
 * @returns {Promise<string>}
 */
async function exec(cmd, args, options) {
  if (!options) {
    options = {}
  }

  let output = '';

  options.listeners = {
    outStream: null,
    errStream: null,

    stdout: (data) => {
      output += data.toString();
    },
    stderr: (data) => {
      output += data.toString();
    }
  };

  await _exec.exec(cmd, args, options);

  return output
}

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
      let out = "";
      const repoDir = path.join(cwd, "repos", repoName);
      const options = { cwd: repoDir };
      if (!fs.existsSync(repoDir)) {
        const remote = `https://trim21:${ACCESS_TOKEN}@gitee.com/scoop-bucket/${repoName}.git`;
        out += await exec("git", ["clone", url, repoDir]);
        out += await exec("git", ["remote", "add", "gitee", remote], options);
      } else {
        out += await exec("git", ["fetch", "origin"], options);
      }

      out += await exec("git", ["fetch", "gitee"], options);
      out += await exec("git", ["checkout", "origin/master"], options);
      out += await exec("git", ["push", "--force", "gitee", "master"], options);
      return out;
    })
    .map((fn) => fn());

  Promise.all(promises)
    .then((output) => {
      output.forEach(console.log)
    })
    .catch((err) => {
      console.log(err)

      process.exit(1);
    });
}

main();
