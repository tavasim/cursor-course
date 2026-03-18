import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      console.error("Validate key: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
      return NextResponse.json(
        { valid: false, error: "Server configuration error: Supabase env vars not set" },
        { status: 200 }
      );
    }

    const supabase = createClient(url, anonKey);

    const { data, error } = await supabase
      .from("api_keys")
      .select("id")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("Validate key Supabase error:", error);
      return NextResponse.json(
        { valid: false, error: error.message },
        { status: 200 }
      );
    }

    if (data) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false });
  } catch (err) {
    console.error("Validate key error:", err);
    return NextResponse.json(
      { valid: false, error: err.message ?? "Validation failed" },
      { status: 200 }
    );
  }
}
