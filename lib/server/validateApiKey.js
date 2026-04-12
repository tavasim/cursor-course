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

function joinSupabaseErrorFields(error) {
  if (!error) return "";
  const parts = [error.message, error.details, error.hint].filter(
    (x) => typeof x === "string" && x.trim()
  );
  return parts.join("\n");
}

/**
 * supabase-js often returns PostgREST failures as { message: "TypeError: fetch failed", details: "Caused by: ..." }
 * when Node cannot complete HTTPS (proxy, TLS inspection, firewall).
 */
function humanizeSupabaseNetworkError(rawMessage) {
  const msg = rawMessage ?? "";
  const lower = msg.toLowerCase();

  if (
    msg.includes("SELF_SIGNED_CERT_IN_CHAIN") ||
    lower.includes("self-signed certificate in certificate chain")
  ) {
    return (
      "TLS inspection: Node does not trust your corporate HTTPS certificate. " +
      "Add your organization root CA as a PEM file and set NODE_EXTRA_CA_CERTS to its full path in .env.local, then restart yarn dev. " +
      "IT can provide the root CA, or export it from the browser certificate chain for an HTTPS site. " +
      "Dev-only workaround (insecure): NODE_TLS_REJECT_UNAUTHORIZED=0 — never in production. " +
      `Underlying: ${msg.slice(0, 800)}`
    );
  }

  const looksNetwork =
    msg.includes("fetch failed") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("EAI_AGAIN") ||
    lower.includes("certificate") ||
    lower.includes("ssl") ||
    lower.includes("tls") ||
    lower.includes("self signed");
  if (!looksNetwork) {
    return msg;
  }
  return (
    "Cannot reach Supabase from this environment (proxy/TLS/firewall). " +
    "For corporate networks: set HTTPS_PROXY and HTTP_PROXY before starting Node, " +
    "or set NODE_EXTRA_CA_CERTS to your organization root CA bundle (.pem). " +
    `Underlying: ${msg.slice(0, 800)}`
  );
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
      return {
        valid: false,
        error: humanizeSupabaseNetworkError(joinSupabaseErrorFields(error)),
      };
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
    return {
      valid: false,
      error: humanizeSupabaseNetworkError(message),
    };
  }
}

/**
 * Increment usage when the caller already has the row from authorizeApiKeyForSummarizer (one UPDATE, no SELECT).
 * @param {string} rawKey
 * @param {{ id: string, usage_count?: number | null }} row
 */
export async function incrementApiKeyUsageWithRow(rawKey, row) {
  const key = typeof rawKey === "string" ? rawKey.trim() : "";
  if (!key || !row?.id) return;

  try {
    const supabase = createSupabaseFromEnv();
    const nextCount = (row.usage_count ?? 0) + 1;
    const { error: updateError } = await supabase
      .from("api_keys")
      .update({
        usage_count: nextCount,
        last_used: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      console.error("incrementApiKeyUsageWithRow update error:", updateError);
    }
  } catch (err) {
    if (
      (err?.message ?? "").includes(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
      )
    ) {
      return;
    }
    console.error("incrementApiKeyUsageWithRow unexpected error:", err);
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
      return {
        allowed: false,
        error: humanizeSupabaseNetworkError(joinSupabaseErrorFields(error)),
        remaining: 0,
      };
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
 * Single Supabase read for github-summarizer: key exists + monthly cap (replaces validate + rate-limit round trips).
 * @param {string} [rawKey]
 * @returns {Promise<
 *   | { ok: true; remaining: number | null; row: { id: string; usage_count: number } }
 *   | { ok: false; error: string; remaining: number; httpStatus: number }
 * >}
 */
export async function authorizeApiKeyForSummarizer(rawKey) {
  const key = typeof rawKey === "string" ? rawKey.trim() : "";
  if (!key) {
    return {
      ok: false,
      error: "API key is required",
      remaining: 0,
      httpStatus: 200,
    };
  }

  try {
    const supabase = createSupabaseFromEnv();
    const { data, error } = await supabase
      .from("api_keys")
      .select("id,usage_count,limit_monthly_usage,monthly_usage_limit")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("authorizeApiKeyForSummarizer Supabase error:", error);
      return {
        ok: false,
        error: humanizeSupabaseNetworkError(joinSupabaseErrorFields(error)),
        remaining: 0,
        httpStatus: 200,
      };
    }

    if (!data?.id) {
      return {
        ok: false,
        error: "Invalid API key",
        remaining: 0,
        httpStatus: 200,
      };
    }

    const used = Number(data.usage_count ?? 0);

    if (!data.limit_monthly_usage) {
      return {
        ok: true,
        remaining: null,
        row: { id: data.id, usage_count: used },
      };
    }

    const limit = Number(data.monthly_usage_limit ?? 0);
    const remaining = Math.max(limit - used, 0);

    if (!limit || used >= limit) {
      return {
        ok: false,
        error: "Rate limit exceeded for this API key",
        remaining: 0,
        httpStatus: 429,
      };
    }

    return {
      ok: true,
      remaining,
      row: { id: data.id, usage_count: used },
    };
  } catch (err) {
    const message = err?.message ?? "Authorization failed";
    if (message.includes("Missing NEXT_PUBLIC_SUPABASE_URL")) {
      console.error(
        "authorizeApiKeyForSummarizer: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
      return {
        ok: false,
        error: "Server configuration error: Supabase env vars not set",
        remaining: 0,
        httpStatus: 200,
      };
    }
    console.error("authorizeApiKeyForSummarizer error:", err);
    return {
      ok: false,
      error: humanizeSupabaseNetworkError(message),
      remaining: 0,
      httpStatus: 200,
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
