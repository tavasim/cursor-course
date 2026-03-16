"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PlaygroundPage() {
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
      setVerified(!!data);
    } catch (err) {
      console.error("Error checking API key:", err);
      setVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setApiKey("");
    setVerified(null);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">API Playground</h1>
      <p className="text-sm text-gray-600 mb-8">
        Enter your API key to access the protected API area.
      </p>

      {verified === null && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !apiKey.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Verifying...
              </>
            ) : (
              "Verify API Key"
            )}
          </button>
        </form>
      )}

      {verified === true && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-lg font-medium text-green-800">This is a protected API area</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 text-sm text-green-700 hover:text-green-900 underline"
          >
            Use a different API key
          </button>
        </div>
      )}

      {verified === false && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-lg font-medium text-red-800">API key does not exist</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 text-sm text-red-700 hover:text-red-900 underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
