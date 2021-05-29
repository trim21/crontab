const github = require('@actions/github')

async function run () {
  const github_token = process.env.GITHUB_TOKEN
  const github_context = JSON.parse(process.env.GITHUB_CONTEXT)
  const pull_number = github_context.event.pull_request.pull_number
  console.log(github_context.event)
  const octokit = github.getOctokit(github_token)
  const [repo, owner] = github_context.repository.split('/')
  console.log(repo, owner, github_context)
  const { data: pullRequest } = await octokit.rest.pulls.get({
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
