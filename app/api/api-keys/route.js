import { NextResponse } from "next/server";
import { getApiKeysRestContext } from "@/lib/server/apiKeysRestAuth";
import { mapDbToApiKey } from "@/lib/utils/apiKeyUtils";

const FIXED_MONTHLY_LIMIT = 200;

export async function GET() {
  const ctx = await getApiKeysRestContext();
  if (ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { supabase, userId } = ctx;
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(mapDbToApiKey) });
}

export async function POST(request) {
  const ctx = await getApiKeysRestContext();
  if (ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body?.name?.trim();
  const key = body?.key?.trim();
  if (!name || !key) {
    return NextResponse.json(
      { error: "name and key are required" },
      { status: 400 }
    );
  }

  const type = body?.type === "production" ? "production" : "development";
  const description = body?.description?.trim() || null;

  const { supabase, userId } = ctx;
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: userId,
      name,
      key,
      description,
      type,
      limit_monthly_usage: true,
      monthly_usage_limit: FIXED_MONTHLY_LIMIT,
      usage_count: 0,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: mapDbToApiKey(data) }, { status: 201 });
}

