import { NextResponse } from "next/server";
import { getApiKeysRestContext } from "@/lib/server/apiKeysRestAuth";
import { mapDbToApiKey } from "@/lib/utils/apiKeyUtils";

const FIXED_MONTHLY_LIMIT = 200;

async function getIdFromContext(context) {
  const params = await Promise.resolve(context?.params);
  const raw = params?.id;
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw) && raw.length > 0) return String(raw[0]).trim();
  return "";
}

export async function GET(_request, context) {
  const id = await getIdFromContext(context);
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const ctx = await getApiKeysRestContext();
  if (ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { supabase, userId } = ctx;
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: mapDbToApiKey(data) });
}

export async function PUT(request, context) {
  const id = await getIdFromContext(context);
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

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
    .update({
      name,
      key,
      description,
      type,
      limit_monthly_usage: true,
      monthly_usage_limit: FIXED_MONTHLY_LIMIT,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: mapDbToApiKey(data) });
}

export async function DELETE(_request, context) {
  const id = await getIdFromContext(context);
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const ctx = await getApiKeysRestContext();
  if (ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { supabase, userId } = ctx;
  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

