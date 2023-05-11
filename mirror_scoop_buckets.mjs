import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert";

import * as core from "@actions/core";
import { exec as _exec, getExecOutput } from "@actions/exec";
import { simpleGit, CleanOptions } from "simple-git";

const cwd = process.cwd();
const repoName = process.env.NAME;
const repoDir = path.join(cwd, "repos", repoName);
const options = { cwd: repoDir };

async function exec(cmd, args, opt) {
  const buf = [];

  await _exec(cmd, args, {
    ...opt,
    listeners: {
      stderr(b) {
        buf.push(b);
      },
      stdout(b) {
        buf.push(b);
      },
    },
  });

  let out = `### ${cmd} ${args.join(" ")}\n`;
  if (buf.length) {
    out += `
\`\`\`\`\`\`text
${Buffer.concat(buf).toString().trim()}
\`\`\`\`\`\`

`;
  }

  return out;
}

async function main() {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
  const url = process.env.URL;
  assert(ACCESS_TOKEN.length !== 0, "no access token given");

  let out = "";
  if (!fs.existsSync(repoDir)) {
    const remote = `https://trim21:${ACCESS_TOKEN}@gitee.com/scoop-bucket/${repoName}.git`;
    out += await exec("git", ["clone", url, repoDir]);
    out += await exec("git", ["remote", "add", "gitee", remote], options);
  } else {
    out += await exec("git", ["fetch", "origin"], options);
  }

  const repo = simpleGit(repoDir);

  out += await exec("git", ["remote", "prune", "origin"], options);
  out += await exec("git", ["fetch", "gitee"], options);
  const oldHead = await repo.revparse("gitee/master");
  out += await exec("git", ["reset", "--hard"], options);
  out += await exec("git", ["checkout", "master"], options);
  out += await exec("git", ["reset", "--hard", "origin/master"], options);
  out += await exec("git", ["push", "--force", "gitee", "master"], options);
  const newHead = await repo.revparse("gitee/master");
  out += await exec("git", ["gc"], options);

  if (oldHead !== newHead) {
    const logs = await getExecOutput(
      `git log ${oldHead}..${newHead} --graph --pretty=format:'%h%C(auto)%d %s <%an> %ad' --date=short-local`,
      null,
      options
    );
    await core.summary.addCodeBlock(logs.stdout).addRaw(out, true).write();
  }
}

await main();
