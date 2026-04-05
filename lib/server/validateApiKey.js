import { createClient } from "@supabase/supabase-js";

function createSupabaseFromEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, anonKey);
}

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

  try {
    const supabase = createSupabaseFromEnv();
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
    const message = err?.message ?? "Validation failed";
    if (message.includes("Missing NEXT_PUBLIC_SUPABASE_URL")) {
      console.error(
        "validateApiKey: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
      return {
        valid: false,
        error: "Server configuration error: Supabase env vars not set",
      };
    }
    console.error("validateApiKey error:", err);
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
 * Increment usage counters for a valid API key.
 * - usage_count + 1
 * - last_used = now()
 * This is best-effort and should not block API responses.
 * @param {string} [rawKey]
 */
export async function incrementApiKeyUsage(rawKey) {
  const key = typeof rawKey === "string" ? rawKey.trim() : "";
  if (!key) return;

  try {
    const supabase = createSupabaseFromEnv();
    const { data, error } = await supabase
      .from("api_keys")
      .select("id,usage_count")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("incrementApiKeyUsage select error:", error);
      return;
    }
    if (!data?.id) return;

    const nextCount = (data.usage_count ?? 0) + 1;
    const { error: updateError } = await supabase
      .from("api_keys")
      .update({
        usage_count: nextCount,
        last_used: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (updateError) {
      console.error("incrementApiKeyUsage update error:", updateError);
    }
  } catch (err) {
    if (
      (err?.message ?? "").includes(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
      )
    ) {
      // Keep this silent-ish in runtime paths; validation already surfaces env config issues.
      return;
    }
    console.error(
      "incrementApiKeyUsage unexpected error:",
      err
    );
  }
}

/**
 * Check monthly usage limits for an API key.
 * Uses api_keys.limit_monthly_usage + monthly_usage_limit + usage_count.
 * @param {string} [rawKey]
 * @returns {Promise<{ allowed: true, remaining: number | null } | { allowed: false, error: string, remaining: number }>}
 */
export async function checkApiKeyRateLimit(rawKey) {
  const key = typeof rawKey === "string" ? rawKey.trim() : "";
  if (!key) {
    return { allowed: false, error: "API key is required", remaining: 0 };
  }

  try {
    const supabase = createSupabaseFromEnv();
    const { data, error } = await supabase
      .from("api_keys")
      .select("id,limit_monthly_usage,monthly_usage_limit,usage_count")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("checkApiKeyRateLimit select error:", error);
      return { allowed: false, error: error.message, remaining: 0 };
    }
    if (!data?.id) {
      return { allowed: false, error: "Invalid API key", remaining: 0 };
    }

    if (!data.limit_monthly_usage) {
      return { allowed: true, remaining: null };
    }

    const limit = Number(data.monthly_usage_limit ?? 0);
    const used = Number(data.usage_count ?? 0);
    const remaining = Math.max(limit - used, 0);

    if (!limit || used >= limit) {
      return {
        allowed: false,
        error: "Rate limit exceeded for this API key",
        remaining: 0,
      };
    }

    return { allowed: true, remaining };
  } catch (err) {
    const message = err?.message ?? "Rate-limit check failed";
    console.error("checkApiKeyRateLimit unexpected error:", err);
    return { allowed: false, error: message, remaining: 0 };
  }
}

/**
 * Resolve API key from the x-api-key header.
 * @param {Request} request
 */
export function getApiKeyFromRequest(request) {
  return request.headers.get("x-api-key")?.trim() ?? "";
}
