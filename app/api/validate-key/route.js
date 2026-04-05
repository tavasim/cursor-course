import { NextResponse } from "next/server";
import {
  validateApiKey,
  getApiKeyFromRequest,
  checkApiKeyRateLimit,
} from "@/lib/server/validateApiKey";

export async function POST(request) {
  try {
    const key = getApiKeyFromRequest(request);

    if (!key) {
      return NextResponse.json(
        { valid: false, error: "x-api-key header is required" },
        { status: 400 }
      );
    }

    const result = await validateApiKey(key);

    if (result.valid) {
      const rateLimit = await checkApiKeyRateLimit(key);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            valid: false,
            error: rateLimit.error,
            remaining: rateLimit.remaining,
          },
          { status: 429 }
        );
      }

      return NextResponse.json({
        valid: true,
        ...(rateLimit.remaining !== null ? { remaining: rateLimit.remaining } : {}),
      });
    }

    return NextResponse.json({
      valid: false,
      ...(result.error ? { error: result.error } : {}),
    });
  } catch (err) {
    console.error("Validate key error:", err);
    const message = err?.message ?? "Validation failed";
    return NextResponse.json({ valid: false, error: message }, { status: 200 });
  }
}
