const exec = require('@actions/exec').exec
const assert = require('assert')

const path = require('path')
const fs = require('fs')

async function main () {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN
  assert(ACCESS_TOKEN.length !== 0, 'no access token given')
  const cwd = process.cwd()
  const repos = {
    'main': 'https://github.com/ScoopInstaller/Main',
  }

  for (const [repoName, url] of Object.entries(repos)) {
    const repoDir = path.join(cwd, 'repos', repoName)
    if (!fs.existsSync(repoDir)) {
      await exec(`git clone ${url} ${repoDir}`)
      await exec(
        `git remote add gitea https://${ACCESS_TOKEN}@gitee.com/scoop-bucket/${repoName}.git`,
        null,
        { cwd: repoDir },
      )
    } else {
      await exec('git', ['pull'], { cwd: repoDir })
    }

    await exec('git', ['push', 'gitea'], { cwd: repoDir })
  }
}

main().catch((e) => {
  console.log(e)
  process.exit(1)
})
