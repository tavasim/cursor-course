import { Buffer } from "node:buffer";

const DEFAULT_USER_AGENT = "cursor-course-github-get-info";

/**
 * Parse a github.com repository URL into owner and repo.
 * @param {string} rawUrl
 * @returns {{ owner: string, repo: string, repositoryUrl: string } | { error: string }}
 */
export function parseGithubRepositoryUrl(rawUrl) {
  const raw = typeof rawUrl === "string" ? rawUrl.trim() : "";
  if (!raw) {
    return {
      error:
        'url is required: send a JSON body with "url" set to the GitHub repository URL (e.g. https://github.com/vercel/next.js)',
    };
  }

  try {
    const u = new URL(raw);
    if (u.hostname.toLowerCase() !== "github.com") {
      return { error: "url must be a github.com repository URL" };
    }

    const segments = u.pathname
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean);
    if (segments.length < 2) {
      return {
        error:
          "url must include the repository path: https://github.com/<owner>/<repository>",
      };
    }

    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/, "");
    const repositoryUrl = `https://github.com/${owner}/${repo}`;

    return { owner, repo, repositoryUrl };
  } catch {
    return { error: "Invalid url" };
  }
}

/**
 * Fetch the repository default README file content (e.g. README.md) via the GitHub API.
 * @param {string} repositoryUrl - Full GitHub repo URL (https://github.com/owner/repo)
 * @param {{ token?: string, userAgent?: string }} [options] - Optional GITHUB_TOKEN for private repos / rate limits
 * @returns {Promise<
 *   | { content: string; path: string; name: string }
 *   | { error: string; status?: number }
 * >}
 */
export async function getReadmeMarkdownFromGithubUrl(repositoryUrl, options = {}) {
  const parsed = parseGithubRepositoryUrl(repositoryUrl);
  if (parsed.error) {
    return { error: parsed.error };
  }

  const { owner, repo } = parsed;
  const token = (options.token ?? process.env.GITHUB_TOKEN ?? "").trim();
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": options.userAgent ?? DEFAULT_USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`;
  const res = await fetch(apiUrl, { headers, next: { revalidate: 0 } });

  if (res.status === 404) {
    return { error: "No README found for this repository", status: 404 };
  }
  if (!res.ok) {
    return { error: `GitHub API error: ${res.status}`, status: res.status };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { error: "Invalid README response from GitHub", status: 502 };
  }

  if (data.encoding !== "base64" || typeof data.content !== "string") {
    return { error: "Unexpected README payload from GitHub", status: 502 };
  }

  const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString(
    "utf8"
  );
  const name = data.name ?? "README.md";
  const path = data.path ?? name;

  return { content, path, name };
}

/**
 * Latest published release version (tag) for a repo, or nulls if none.
 * Uses /releases/latest, then the newest item from /releases (GitHub returns recent first).
 * @param {string} owner
 * @param {string} repo
 * @param {{ token?: string, userAgent?: string }} [options]
 * @returns {Promise<{ version: string | null, releaseName: string | null, publishedAt: string | null }>}
 */
export async function getLatestRepoVersion(owner, repo, options = {}) {
  const token = (options.token ?? process.env.GITHUB_TOKEN ?? "").trim();
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": options.userAgent ?? DEFAULT_USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  const mapRelease = (d) => ({
    version: typeof d?.tag_name === "string" ? d.tag_name : null,
    releaseName: typeof d?.name === "string" ? d.name : null,
    publishedAt: typeof d?.published_at === "string" ? d.published_at : null,
  });

  const latestRes = await fetch(`${base}/releases/latest`, {
    headers,
    next: { revalidate: 0 },
  });
  if (latestRes.ok) {
    try {
      const d = await latestRes.json();
      return mapRelease(d);
    } catch {
      return { version: null, releaseName: null, publishedAt: null };
    }
  }

  if (latestRes.status === 404) {
    const listRes = await fetch(`${base}/releases?per_page=1`, {
      headers,
      next: { revalidate: 0 },
    });
    if (listRes.ok) {
      try {
        const arr = await listRes.json();
        if (Array.isArray(arr) && arr[0]) {
          return mapRelease(arr[0]);
        }
      } catch {
        /* fall through */
      }
    }
  }

  return { version: null, releaseName: null, publishedAt: null };
}
