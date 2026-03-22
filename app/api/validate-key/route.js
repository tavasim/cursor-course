import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/server/validateApiKey";

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { valid: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const key = body?.key?.trim();

    if (!key) {
      return NextResponse.json(
        { valid: false, error: "API key is required" },
        { status: 400 }
      );
    }

    const result = await validateApiKey(key);

    if (result.valid) {
      return NextResponse.json({ valid: true });
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
