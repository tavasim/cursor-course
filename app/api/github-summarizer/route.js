import { NextResponse } from "next/server";
import {
  validateApiKey,
  getApiKeyFromRequest,
} from "@/lib/server/validateApiKey";

function parseGithubInput(body) {
  const owner = body?.owner?.trim();
  const repo = body?.repo?.trim();
  if (owner && repo) {
    return { owner, repo };
  }
  const url = body?.url?.trim();
  if (url) {
    try {
      const u = new URL(url);
      if (!u.hostname.includes("github.com")) {
        return { error: "url must be a github.com repository URL" };
      }
      const parts = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
      }
    } catch {
      return { error: "Invalid url" };
    }
    return { error: "Could not parse owner/repo from url" };
  }
  return { error: "Provide owner and repo, or a github.com url" };
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
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const apiKey = getApiKeyFromRequest(request, body);
  const authResult = await validateApiKey(apiKey);

  if (!authResult.valid) {
    return NextResponse.json(
      {
        error: authResult.error ?? "Invalid or missing API key",
      },
      { status: 401 }
    );
  }

  const parsed = parseGithubInput(body);
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { owner, repo } = parsed;
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
      owner,
      repo,
      url: html_url ?? `https://github.com/${owner}/${repo}`,
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
