const github = require('@actions/github')
const core = require('@actions/core')
const exec = require('@actions/exec')

async function run () {
  // This should be a token with access to your repository scoped in as a secret.
  // The YML workflow will need to set myToken with the GitHub Secret Token
  // myToken: ${{ secrets.GITHUB_TOKEN }}
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
  const myToken = process.env.PERSONAL_GITHUB_TOKEN
  const owner = process.env.REPO.split('/')[0]
  const repo = process.env.REPO.split('/')[1]
  const branch = process.env.BRANCH
  const octokit = new github.GitHub(myToken)
  const newBranch = 'chore/update-pre-commit'
  let shouldCreatePR = false
  await exec.exec('pre-commit autoupdate')

  try {
    await exec.exec('git diff --exit-code',)
  } catch {
    shouldCreatePR = true
  }

  if (shouldCreatePR) {
    try {
      await exec.exec('pre-commit run --all-files', undefined, { silent: true })
    } catch {
      await exec.exec('git diff', undefined, { silent: true })
    }

    await exec.exec('git config --global user.email "i@trim21.me"', undefined, { silent: true })
    await exec.exec('git config --global user.name "Trim21"')

    await exec.exec('git add .')
    await exec.exec(`git checkout -b ${newBranch}`)
    await exec.exec(`git commit -m "chore: update pre-commit config"`)

    try {
      await exec.exec(`git diff ${newBranch} origin/${newBranch} --exit-code`)
      shouldCreatePR = false
    } catch {
      await exec.exec(`git push origin ${newBranch} -f`)
    }
  }

  if (shouldCreatePR) {
    const result = await octokit.pulls.list({
      repo,
      owner,
      base: branch,
      head: `${owner}:${newBranch}`,
    })
    if (result.data.length === 0) {
      await octokit.pulls.create({
        repo,
        owner,
        base: branch,
        head: newBranch,
        title: 'update pre-commit config',
      })
    }
  }
}

run().catch((e) => {
  console.log(e)
  process.exit(1)
})
