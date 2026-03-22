import { NextResponse } from "next/server";
import {
  validateApiKey,
  getApiKeyFromRequest,
} from "@/lib/server/validateApiKey";

/**
 * @param {object} body
 * @returns {{ owner: string, repo: string, repositoryUrl: string } | { error: string }}
 */
function parseRepositoryUrl(body) {
  const raw = typeof body?.url === "string" ? body.url.trim() : "";
  if (!raw) {
    return {
      error:
        "url is required: send a JSON body with \"url\" set to the GitHub repository URL (e.g. https://github.com/vercel/next.js)",
    };
  }

  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (host !== "github.com") {
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

async function fetchRepoMeta(owner, repo, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "cursor-course-github-summarizer",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { headers, next: { revalidate: 0 } }
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

async function fetchReadmeExcerpt(owner, repo, token, maxChars = 1200) {
  const headers = {
    Accept: "application/vnd.github.raw",
    "User-Agent": "cursor-course-github-summarizer",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
    { headers, next: { revalidate: 0 } }
  );
  if (!res.ok) {
    return "";
  }
  const text = await res.text();
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > maxChars ? `${cleaned.slice(0, maxChars)}…` : cleaned;
}

export async function POST(request) {
  const apiKey = getApiKeyFromRequest(request);
  if (!apiKey) {
    return NextResponse.json(
      { error: "x-api-key header is required" },
      { status: 200 }
    );
  }

  const authResult = await validateApiKey(apiKey);

  if (!authResult.valid) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 200 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = parseRepositoryUrl(body);
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { owner, repo, repositoryUrl } = parsed;
  const token = process.env.GITHUB_TOKEN?.trim() || "";

  try {
    const meta = await fetchRepoMeta(owner, repo, token);
    if (meta.error) {
      return NextResponse.json(
        { error: meta.error },
        { status: meta.status >= 400 ? meta.status : 502 }
      );
    }

    const { description, html_url, default_branch, stargazers_count, language } =
      meta.data;
    const readmeExcerpt = await fetchReadmeExcerpt(owner, repo, token);

    const parts = [];
    if (description) {
      parts.push(description);
    }
    if (language) {
      parts.push(`Primary language: ${language}.`);
    }
    if (typeof stargazers_count === "number") {
      parts.push(`Stars: ${stargazers_count}.`);
    }
    if (readmeExcerpt) {
      parts.push(`README excerpt: ${readmeExcerpt}`);
    }

    const summary =
      parts.join(" ") ||
      `Public repository ${owner}/${repo} (no description or README text returned).`;

    return NextResponse.json({
      url: html_url ?? repositoryUrl,
      owner,
      repo,
      defaultBranch: default_branch ?? null,
      summary,
    });
  } catch (err) {
    console.error("github-summarizer:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to summarize repository" },
      { status: 502 }
    );
  }
}
