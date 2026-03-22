import { createClient } from "@supabase/supabase-js";

/**
 * Check API key against Supabase api_keys table (same source as /api/validate-key).
 * @param {string} [rawKey]
 * @returns {Promise<{ valid: true } | { valid: false, error?: string }>}
 */
export async function validateApiKey(rawKey) {
  const key = typeof rawKey === "string" ? rawKey.trim() : "";

  if (!key) {
    return { valid: false, error: "API key is required" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      "validateApiKey: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    return {
      valid: false,
      error: "Server configuration error: Supabase env vars not set",
    };
  }

  try {
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase
      .from("api_keys")
      .select("id")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("validateApiKey Supabase error:", error);
      return { valid: false, error: error.message };
    }

    if (data) {
      return { valid: true };
    }

    return { valid: false };
  } catch (err) {
    console.error("validateApiKey error:", err);
    const message = err?.message ?? "Validation failed";
    const isNetwork =
      message.includes("fetch failed") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ETIMEDOUT");
    return {
      valid: false,
      error: isNetwork
        ? "Cannot reach Supabase (network/proxy). Check .env.local and proxy settings."
        : message,
    };
  }
}

/**
 * Resolve API key from the x-api-key header.
 * @param {Request} request
 */
export function getApiKeyFromRequest(request) {
  return request.headers.get("x-api-key")?.trim() ?? "";
}
