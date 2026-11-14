import * as core from "@actions/core";
import { getOctokit } from "@actions/github";

const GIST_ID = "1f9bc2a382e30218714a71282106887e";
const GIST_FILE = "pr-conflicts.md";
const SEARCH_QUERY = "is:pr is:open author:@me";
const MERGEABLE_BATCH_SIZE = 20;

const token = process.env.GITHUB_TOKEN;
if (!token) {
  throw new Error("GITHUB_TOKEN is not set");
}

const octokit = getOctokit(token);

async function listOpenPullRequests() {
  const pullRequests = [];
  let cursor = null;

  do {
    const { search } = await octokit.graphql(
      `query ($query: String!, $cursor: String) {
        search(query: $query, type: ISSUE, first: 100, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            ... on PullRequest {
              id
              number
              title
              url
              isDraft
              updatedAt
              repository { nameWithOwner }
            }
          }
        }
      }`,
      { query: SEARCH_QUERY, cursor },
    );

    pullRequests.push(...search.nodes);
    cursor = search.pageInfo.hasNextPage ? search.pageInfo.endCursor : null;
  } while (cursor);

  return pullRequests;
}

async function queryMergeability(ids) {
  const mergeability = new Map();

  for (let offset = 0; offset < ids.length; offset += MERGEABLE_BATCH_SIZE) {
    const batch = ids.slice(offset, offset + MERGEABLE_BATCH_SIZE);
    const fields = batch
      .map(
        (id, index) =>
          `pr${index}: node(id: ${JSON.stringify(id)}) { ... on PullRequest { mergeable } }`,
      )
      .join("\n");

    const data = await octokit.graphql(`query { ${fields} }`);
    batch.forEach((id, index) => {
      mergeability.set(id, data[`pr${index}`]?.mergeable ?? "UNKNOWN");
    });
  }

  return mergeability;
}

async function resolveMergeability(pullRequests) {
  const mergeability = await queryMergeability(
    pullRequests.map((pr) => pr.id),
  );

  // GitHub 偶尔还没算完 mergeability，等一会儿再查 UNKNOWN 的部分
  for (let attempt = 0; attempt < 3; attempt++) {
    const unknown = [...mergeability]
      .filter(([, value]) => value === "UNKNOWN")
      .map(([id]) => id);
    if (unknown.length === 0) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    const retried = await queryMergeability(unknown);
    for (const [id, value] of retried) {
      mergeability.set(id, value);
    }
  }

  return mergeability;
}

function escapeCell(text) {
  return text.replaceAll("|", "\\|");
}

function formatDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function renderReport(pullRequests, mergeability) {
  const conflicts = pullRequests.filter(
    (pr) => mergeability.get(pr.id) === "CONFLICTING",
  );
  const unknown = pullRequests.filter(
    (pr) => mergeability.get(pr.id) === "UNKNOWN",
  );
  const checkedAt = new Date().toISOString().slice(0, 16).replace("T", " ");

  const lines = [
    "# Open PR conflicts",
    "",
    `Checked at ${checkedAt} UTC · ${pullRequests.length} open PRs · ${conflicts.length} conflicting${unknown.length > 0 ? ` · ${unknown.length} unknown` : ""}`,
    "",
  ];

  if (conflicts.length === 0) {
    lines.push("No conflicting pull requests.", "");
  } else {
    lines.push(
      "| Repository | Pull request | Title | Updated |",
      "| --- | --- | --- | --- |",
      ...conflicts.map(
        (pr) =>
          `| ${pr.repository.nameWithOwner} | [#${pr.number}](${pr.url}) | ${escapeCell(pr.title)} | ${formatDate(pr.updatedAt)} |`,
      ),
      "",
    );
  }

  if (unknown.length > 0) {
    lines.push(
      "## Mergeability unknown",
      "",
      "| Repository | Pull request | Title |",
      "| --- | --- | --- |",
      ...unknown.map(
        (pr) =>
          `| ${pr.repository.nameWithOwner} | [#${pr.number}](${pr.url}) | ${escapeCell(pr.title)} |`,
      ),
      "",
    );
  }

  return lines.join("\n");
}

async function updateGist(report) {
  const { data: gist } = await octokit.request("GET /gists/{gist_id}", {
    gist_id: GIST_ID,
  });

  const files = { [GIST_FILE]: { content: report } };
  for (const filename of Object.keys(gist.files)) {
    if (filename !== GIST_FILE) {
      files[filename] = null;
    }
  }

  await octokit.request("PATCH /gists/{gist_id}", {
    gist_id: GIST_ID,
    files,
  });
}

async function main() {
  const pullRequests = await listOpenPullRequests();
  core.info(`found ${pullRequests.length} open pull requests`);

  const mergeability = await resolveMergeability(pullRequests);
  const report = renderReport(pullRequests, mergeability);

  await updateGist(report);
  core.info(`updated gist ${GIST_ID}`);
}

main().catch((error) => {
  core.setFailed(error);
});
