import { NextResponse } from "next/server";
import {
  validateApiKey,
  getApiKeyFromRequest,
  incrementApiKeyUsage,
  checkApiKeyRateLimit,
} from "@/lib/server/validateApiKey";
import { parseGithubRepositoryUrl } from "@/lib/server/githubGetInfo";
import { fetchGithubRepositoryData } from "@/lib/server/githubRepoAccess";
import { summarizeReadmeFromMarkdown } from "@/lib/server/chain";
import { getOpenAiApiKey } from "@/lib/server/openaiEnv";
import { getLlmErrorMessageForClient } from "@/lib/server/llmError";

/** Allow time for GitHub + OpenAI on Vercel (plan may still cap lower on Hobby). */
export const maxDuration = 60;

function readmeToExcerpt(content, maxChars = 1200) {
  if (!content) return "";
  const cleaned = content.replace(/\s+/g, " ").trim();
  return cleaned.length > maxChars ? `${cleaned.slice(0, maxChars)}…` : cleaned;
}

function normalizeRepoWebsiteUrl(homepage) {
  const raw = typeof homepage === "string" ? homepage.trim() : "";
  return raw || null;
}

function normalizeRepoLicense(license) {
  if (!license || typeof license !== "object") {
    return null;
  }
  const name = typeof license.name === "string" ? license.name.trim() : "";
  const spdxId =
    typeof license.spdx_id === "string" ? license.spdx_id.trim() : "";
  const key = typeof license.key === "string" ? license.key.trim() : "";
  if (!name && !spdxId && !key) {
    return null;
  }
  return {
    ...(key ? { key } : {}),
    ...(name ? { name } : {}),
    ...(spdxId ? { spdxId } : {}),
  };
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
    return NextResponse.json(
      {
        error: authResult.error || "Invalid API key",
      },
      { status: 200 }
    );
  }
  const rateLimit = await checkApiKeyRateLimit(apiKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: rateLimit.error,
        remaining: rateLimit.remaining,
      },
      { status: 429 }
    );
  }
  await incrementApiKeyUsage(apiKey);

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
    const { meta, readmeResult, latestRelease } =
      await fetchGithubRepositoryData(owner, repo, repositoryUrl, token);

    if (meta.error) {
      return NextResponse.json(
        { error: meta.error },
        { status: meta.status >= 400 ? meta.status : 502 }
      );
    }

    const {
      description,
      html_url,
      default_branch,
      stargazers_count,
      language,
      homepage,
      license: licenseRaw,
    } = meta.data;

    const websiteUrl = normalizeRepoWebsiteUrl(homepage);
    const license = normalizeRepoLicense(licenseRaw);
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
    if (latestRelease.version) {
      parts.push(`Latest release: ${latestRelease.version}.`);
    }
    if (websiteUrl) {
      parts.push(`Website: ${websiteUrl}.`);
    }
    if (license) {
      const label = license.name || license.spdxId;
      parts.push(`License: ${label}.`);
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
      stars: typeof stargazers_count === "number" ? stargazers_count : null,
      license,
      ...(latestRelease.version ||
        latestRelease.releaseName ||
        latestRelease.publishedAt
        ? {
            latestRelease: {
              ...(latestRelease.version ? { tag: latestRelease.version } : {}),
              ...(latestRelease.releaseName
                ? { name: latestRelease.releaseName }
                : {}),
              ...(latestRelease.publishedAt
                ? { publishedAt: latestRelease.publishedAt }
                : {}),
            },
          }
        : {}),
      summary,
      cool_facts,
      summarySource,
      llm_status,
      ...(rateLimit.remaining !== null
        ? { remaining: Math.max(rateLimit.remaining - 1, 0) }
        : {}),
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
