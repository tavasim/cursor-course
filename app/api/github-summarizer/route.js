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
import { getOpenAiApiKey } from "@/lib/server/openaiEnv";
import { getLlmErrorMessageForClient } from "@/lib/server/llmError";

/** Allow time for GitHub + OpenAI on Vercel (plan may still cap lower on Hobby). */
export const maxDuration = 60;

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
    let llm_status = "skipped_no_readme";
    let llm_error = null;
    const openAiKey = getOpenAiApiKey();

    if (!readmeContent) {
      llm_status = "skipped_no_readme";
    } else if (!openAiKey) {
      llm_status = "skipped_no_openai_key";
    } else {
      try {
        const llmResult = await summarizeReadmeFromMarkdown(readmeContent, {
          apiKey: openAiKey,
        });
        cool_facts = llmResult.cool_facts ?? [];
        if (llmResult.Summary?.trim()) {
          summary = llmResult.Summary.trim();
          summarySource = "llm";
        }
        llm_status = "ok";
      } catch (llmErr) {
        console.error("github-summarizer LLM:", llmErr);
        llm_status = "error";
        llm_error = getLlmErrorMessageForClient(llmErr);
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
      llm_status,
      ...(llm_error ? { llm_error } : {}),
    });
  } catch (err) {
    console.error("github-summarizer:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to summarize repository" },
      { status: 502 }
    );
  }
}
