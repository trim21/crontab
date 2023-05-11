import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert";

import * as core from '@actions/core';
import { getExecOutput } from "@actions/exec";

async function exec(cmd, args) {
  const o = await getExecOutput(cmd, args)
  if (o.exitCode) {
    return `${JSON.stringify([cmd, args])}\n

stdout
\`\`\`\`\`\`text
${o.stdout}
\`\`\`\`\`\`

stderr
\`\`\`\`\`\`text
${o.stderr}
\`\`\`\`\`\`
`
  }

  return ''
}


async function main() {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
  const repoName = process.env.NAME;
  const url = process.env.URL;
  assert(ACCESS_TOKEN.length !== 0, "no access token given");
  const cwd = process.cwd();

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

  out += await exec("git", ["remote", "prune", "origin"], options)
  out += await exec("git", ["fetch", "gitee"], options);
  out += await exec("git", ["reset", "--hard"], options);
  out += await exec("git", ["checkout", "master"], options);
  out += await exec("git", ["reset", "--hard", "origin/master"], options);
  out += await exec("git", ["push", "--force", "gitee", "master"], options);
  out += await exec("git", ["gc"], options);

  if (out) {
    await core.summary
      .addRaw(out, true)
      .write()
  }

  return out;
}

await main();
