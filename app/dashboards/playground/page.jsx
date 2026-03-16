"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const API_KEY_STORAGE = "api_key";

export default function PlaygroundPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [verified, setVerified] = useState(null); // null = not checked, true = exists, false = not found
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const key = apiKey.trim();
    if (!key) return;

    setLoading(true);
    setVerified(null);

    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id")
        .eq("key", key)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        if (typeof window !== "undefined") sessionStorage.setItem(API_KEY_STORAGE, key);
        router.push("/protected");
        return;
      }
      setVerified(false);
    } catch (err) {
      console.error("Error checking API key:", err);
      setVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const dismissError = () => setVerified(null);

  return (
    <div className="min-h-[60vh] bg-gray-100/80 flex items-start pt-8">
      <div className="max-w-xl w-full">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">API Playground</h1>
          {verified === false && (
            <div className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-white font-bold shrink-0">
              <button
                type="button"
                onClick={dismissError}
                className="p-0.5 rounded hover:bg-red-500 transition-colors"
                aria-label="Dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 101.06 1.06L10 11.06l2.72 2.72a.75.75 0 101.06-1.06L11.06 10l2.72-2.72a.75.75 0 00-1.06-1.06L10 8.94 7.28 6.22z" />
                </svg>
              </button>
              <span>Invalid API Key</span>
              <button
                type="button"
                onClick={dismissError}
                className="p-0.5 rounded hover:bg-red-500 transition-colors"
                aria-label="Dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 101.06 1.06L10 11.06l2.72 2.72a.75.75 0 101.06-1.06L11.06 10l2.72-2.72a.75.75 0 00-1.06-1.06L10 8.94 7.28 6.22z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-900 mb-2">
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
          <button
            type="submit"
            disabled={loading || !apiKey.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Verifying...
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
