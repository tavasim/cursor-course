"use client";

import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import Toast from "@/app/dashboards/components/Toast";

export default function PlaygroundPage() {
  const { toast, showToast } = useToast(4000);
  const [apiKey, setApiKey] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const key = apiKey.trim();
    const url = githubUrl.trim();
    if (!key || !url) return;

    setResult(null);

    try {
      setLoading(true);

      const res = await fetch("/api/github-summarizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
        },
        body: JSON.stringify({ url }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: "Invalid JSON response from server" };
      }

      setResult({ status: res.status, body: data });

      if (res.status === 429) {
        showToast(data?.error || "Rate limit exceeded", "error");
      } else if (data?.error && res.status === 200) {
        showToast(data.error, "error");
      } else if (!res.ok && !data?.error) {
        showToast(`Request failed (${res.status})`, "error");
      } else if (!data?.error) {
        showToast("Summary loaded successfully");
      }
    } catch (err) {
      const message = err?.message || "Request failed";
      setResult({ status: 0, body: { error: message } });
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = apiKey.trim() && githubUrl.trim();

  return (
    <div className="min-h-[60vh] bg-gray-100/80 flex items-start pt-8 px-4 pb-12">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">API Playground</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="api-key"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              API Key
            </label>
            <input
              id="api-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full rounded border border-blue-500 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <div>
            <label
              htmlFor="github-url"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              GitHub repository URL
            </label>
            <input
              id="github-url"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full rounded border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Calling API…
              </>
            ) : (
              "Submit"
            )}
          </button>
        </form>

        {result ? (
          <div className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2">
              <h2 className="text-sm font-semibold text-gray-900">Response</h2>
              <span
                className={`text-xs font-mono font-medium ${
                  result.status === 429
                    ? "text-amber-700"
                    : result.status >= 200 &&
                        result.status < 300 &&
                        !result.body?.error
                      ? "text-green-700"
                      : "text-red-700"
                }`}
              >
                HTTP {result.status || "—"}
              </span>
            </div>
            <pre className="max-h-[min(70vh,32rem)] overflow-auto p-4 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
              {JSON.stringify(result.body, null, 2)}
            </pre>
          </div>
        ) : null}

        <Toast toast={toast} />
      </div>
    </div>
  );
}
