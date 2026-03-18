import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const body = await request.json();
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
      return NextResponse.json(
        { valid: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, anonKey);

    const { data, error } = await supabase
      .from("api_keys")
      .select("id")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("Validate key error:", error);
      return NextResponse.json(
        { valid: false, error: error.message },
        { status: 500 }
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
      { status: 500 }
    );
  }
}
