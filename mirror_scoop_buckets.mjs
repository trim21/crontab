import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert";

import { exec as _exec } from "@actions/exec";

const cwd = process.cwd();
const repoName = process.env.NAME;
const repoDir = path.join(cwd, "repos", repoName);
const options = { cwd: repoDir };

async function exec(cmd, args, opt) {
  await _exec(cmd, args, { ...opt });
}

async function main() {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
  const url = process.env.URL;
  assert(ACCESS_TOKEN.length !== 0, "no access token given");

  if (!fs.existsSync(repoDir)) {
    const remote = `https://trim21:${ACCESS_TOKEN}@gitee.com/scoop-bucket/${repoName}.git`;
    await exec("git", ["clone", url, repoDir]);
    await exec("git", ["remote", "add", "gitee", remote], options);
  } else {
    await exec("git", ["fetch", "origin"], options);
  }

  await exec("git", ["remote", "prune", "origin"], options);
  await exec("git", ["fetch", "gitee"], options);
  await exec("git", ["reset", "--hard"], options);
  await exec("git", ["checkout", "master"], options);
  await exec("git", ["reset", "--hard", "origin/master"], options);
  await exec("git", ["push", "--force", "gitee"], options);
}

await main();
