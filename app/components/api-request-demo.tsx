"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";

/** Matches the Postman-style example; the live API expects `url` (see playground after sign-in). */
const DEFAULT_PAYLOAD = `{
  "githubUrl": "https://github.com/assafelovic/gpt-researcher"
}`;

const DOCS_HREF = "https://docs.example.com";

/** Illustrative 200 response shape from `POST /api/github-summarizer` (values are representative). */
const DEMO_RESPONSE_EXAMPLE = {
  url: "https://github.com/assafelovic/gpt-researcher",
  owner: "assafelovic",
  repo: "gpt-researcher",
  defaultBranch: "main",
  stars: 26385,
  license: {
    key: "apache-2.0",
    name: "Apache License 2.0",
    spdxId: "Apache-2.0",
  },
  latestRelease: {
    tag: "v3.4.3",
    name: "v3.4.3",
    publishedAt: "2026-03-13T14:06:38Z",
  },
  summary:
    "GPT Researcher is an open deep research agent that facilitates web and local research, generating detailed, factual, and unbiased reports with citations. It offers customization options for creating domain-specific research agents and aims to provide accurate information through AI, addressing issues like misinformation and token limitations in existing LLMs.",
  cool_facts: [
    "GPT Researcher can generate reports exceeding 2,000 words and aggregate information from over 20 sources for objective conclusions.",
    "It supports inline image generation using AI, automatically embedding relevant illustrations in research reports.",
    "The tool includes a 'Deep Research' feature that allows for advanced recursive exploration of topics, enabling a tree-like research approach with configurable depth and breadth.",
  ],
  summarySource: "llm",
  llm_status: "ok",
  remaining: 181,
};

export function ApiRequestDemo() {
  const router = useRouter();
  const { status } = useSession();

  const [origin, setOrigin] = useState("");
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const endpoint = "/api/github-summarizer";

  const handleTryItOut = () => {
    if (status === "loading") return;
    if (status === "authenticated") {
      router.replace("/playground");
      return;
    }
    router.replace("/login");
  };

  return (
    <section
      id="api-playground"
      className="border-t border-border bg-card/30 px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              API request demo
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Example <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">POST</code> body for
              the GitHub summarizer. Edit the JSON to explore the shape of the request, then use{" "}
              <span className="font-medium text-foreground">Try it out</span>—signed-in users go to the API
              playground; everyone else is sent to sign in first.
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-2 border-border" asChild>
            <Link href={DOCS_HREF} target="_blank" rel="noopener noreferrer">
              <BookOpen className="h-4 w-4" />
              Documentation
            </Link>
          </Button>
        </div>

        <div className="mt-10 rounded-xl border border-border bg-background p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4 font-mono text-sm">
            <span className="rounded bg-accent/15 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              POST
            </span>
            <span className="text-muted-foreground break-all">
              {origin ? `${origin}${endpoint}` : endpoint}
            </span>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="flex min-h-0 flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Demo request</h3>
              <div className="flex min-h-0 flex-1 flex-col">
                <label htmlFor="demo-payload" className="mb-2 block text-sm font-medium text-foreground">
                  Request body (JSON)
                </label>
                <textarea
                  id="demo-payload"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  spellCheck={false}
                  rows={12}
                  className="min-h-[min(40vh,18rem)] w-full flex-1 resize-y rounded-lg border border-input bg-card p-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-h-[22rem]"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleTryItOut}
                  disabled={status === "loading"}
                  className="gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Try it out
                </Button>
                <Button type="button" variant="secondary" onClick={() => setPayload(DEFAULT_PAYLOAD)}>
                  Reset payload
                </Button>
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-3 border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
              <h3 className="text-sm font-semibold text-foreground">Example response</h3>
              <pre className="min-h-[min(40vh,18rem)] flex-1 overflow-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground lg:min-h-[22rem]">
                {JSON.stringify(DEMO_RESPONSE_EXAMPLE, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
