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

  let output = `$ ${cmd} ${args.join(' ')}\n`;

  options.silent = true;
  options.outStream = null;
  options.errStream = null;
  options.listeners = {
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
    scoop: "https://github.com/ScoopInstaller/Scoop",
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
      out += await exec("git", ["reset", "--hard"], options);
      out += await exec("git", ["checkout", "master"], options);
      out += await exec("git", ["reset", "--hard", "origin/master"], options);
      out += await exec("git", ["push", "--force", "gitee", "master"], options);
      return out;
    })
    .map((fn) => fn());

  Promise.all(promises)
    .then((output) => {
      output.forEach((value, index) => {
        const [repoName, _] = Array.from(Object.entries(repos))[index]
        console.group(`log for ${repoName}:`)
        console.log(value)
        console.groupEnd()
      })
    })
    .catch((err) => {
      console.log(err)

      process.exit(1);
    });
}

main();
