"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_KEY_STORAGE = "api_key";

export default function PlaygroundPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const key = apiKey.trim();
    if (!key) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: {
          "x-api-key": key,
        },
      });

      const data = await res.json();
      if (!data?.valid) {
        setError(data?.error || "Invalid API key");
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(API_KEY_STORAGE, key);
      }
      router.push("/protected");
    } catch (err) {
      setError(err?.message || "Could not validate API key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] bg-gray-100/80 flex items-start pt-8">
      <div className="max-w-xl w-full">
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
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading || !apiKey.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Redirecting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
