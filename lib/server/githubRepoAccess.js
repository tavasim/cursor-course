import {
  getReadmeMarkdownFromGithubUrl,
  getLatestRepoVersion,
} from "@/lib/server/githubGetInfo";

const USER_AGENT = "cursor-course-github-summarizer";

function githubHeaders(token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * GET /repos/{owner}/{repo} — metadata (description, stars, default branch, etc.)
 * @param {string} owner
 * @param {string} repo
 * @param {string} [token]
 * @returns {Promise<{ data: object } | { error: string, status: number }>}
 */
export async function fetchGithubRepoMetadata(owner, repo, token = "") {
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { headers: githubHeaders(token), next: { revalidate: 0 } }
  );
  if (res.status === 404) {
    return { error: "Repository not found", status: 404 };
  }
  if (!res.ok) {
    return { error: `GitHub API error: ${res.status}`, status: res.status };
  }
  const data = await res.json();
  return { data };
}

/**
 * Load repo metadata, README, and latest release in parallel (GitHub API).
 * @param {string} owner
 * @param {string} repo
 * @param {string} repositoryUrl - canonical https://github.com/owner/repo
 * @param {string} [token] - GITHUB_TOKEN
 */
export async function fetchGithubRepositoryData(
  owner,
  repo,
  repositoryUrl,
  token = ""
) {
  const t = typeof token === "string" ? token : "";
  const [meta, readmeResult, latestRelease] = await Promise.all([
    fetchGithubRepoMetadata(owner, repo, t),
    getReadmeMarkdownFromGithubUrl(repositoryUrl, {
      token: t,
      userAgent: USER_AGENT,
    }),
    getLatestRepoVersion(owner, repo, { token: t, userAgent: USER_AGENT }),
  ]);
  return { meta, readmeResult, latestRelease };
}
