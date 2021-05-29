const github = require('@actions/github')

async function run () {
  const github_token = process.env.GITHUB_TOKEN
  const github_context = JSON.parse(process.env.GITHUB_CONTEXT)
  const pull_number = github_context.event.pull_request.pull_number

  const octokit = github.getOctokit(github_token)
  const [repo, owner] = github_context.repository.split('/')
  const { data: pullRequest } = await octokit.pulls.get({
    repo,
    owner,
    pull_number
  })
  console.log(pullRequest)
}

run().catch((e) => {
  console.log(e)
  process.exit(1)
})
