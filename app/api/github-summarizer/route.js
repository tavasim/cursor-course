import { NextResponse } from "next/server";
import {
  validateApiKey,
  getApiKeyFromRequest,
} from "@/lib/server/validateApiKey";
import {
  parseGithubRepositoryUrl,
  getReadmeMarkdownFromGithubUrl,
} from "@/lib/server/githubReadme";
import { summarizeReadmeFromMarkdown } from "@/lib/server/chain";

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

function readmeToExcerpt(content, maxChars = 1200) {
  if (!content) return "";
  const cleaned = content.replace(/\s+/g, " ").trim();
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

  const parsed = parseGithubRepositoryUrl(body?.url);
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

    const readmeResult = await getReadmeMarkdownFromGithubUrl(repositoryUrl, {
      token,
    });
    const readmeContent =
      !readmeResult.error && readmeResult.content ? readmeResult.content : "";
    const readmeExcerpt = readmeToExcerpt(readmeContent);

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

    const fallbackSummary =
      parts.join(" ") ||
      `Public repository ${owner}/${repo} (no description or README text returned).`;

    let summary = fallbackSummary;
    let cool_facts = [];
    let summarySource = "metadata";

    if (readmeContent && process.env.OPENAI_API_KEY?.trim()) {
      try {
        const llmResult = await summarizeReadmeFromMarkdown(readmeContent);
        cool_facts = llmResult.cool_facts ?? [];
        if (llmResult.Summary?.trim()) {
          summary = llmResult.Summary.trim();
          summarySource = "llm";
        }
      } catch (llmErr) {
        console.error("github-summarizer LLM:", llmErr);
      }
    }

    return NextResponse.json({
      url: html_url ?? repositoryUrl,
      owner,
      repo,
      defaultBranch: default_branch ?? null,
      summary,
      cool_facts,
      summarySource,
    });
  } catch (err) {
    console.error("github-summarizer:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to summarize repository" },
      { status: 502 }
    );
  }
}
