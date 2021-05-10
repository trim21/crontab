const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { exec } = require('@actions/exec')

async function main () {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN
  assert(ACCESS_TOKEN.length !== 0, 'no access token given')
  const cwd = process.cwd()
  const repos = {
    'cactbot': {
      upstream: 'https://github.com/quisquous/cactbot.git',
      branch: 'main'
    },
  }
  for (const [repoName, info] of Object.entries(repos)) {
    const repoDir = path.join(cwd, repoName)
    if (fs.existsSync(repoDir)) {
      fs.rmdirSync(repoDir, { recursive: true })
    }
    await exec(`git clone https://${ACCESS_TOKEN}@github.com/Trim21/${repoName}.git ${repoDir}`
    )
    process.chdir(repoDir)
    await exec(`git remote add upstream  --mirror ${info.upstream}`)
    await exec('git fetch upstream ')
    await exec('git push origin --tags')

  }
}

main().catch((e) => {
  console.log(e)
  process.exit(1)
})
