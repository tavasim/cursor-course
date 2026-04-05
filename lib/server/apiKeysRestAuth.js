import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";

function getSupabaseServerClient() {
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
 * Resolve authenticated REST context:
 * - verifies next-auth session
 * - resolves users.id by session email
 */
export async function getApiKeysRestContext() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim();
  if (!email) {
    return { error: "Unauthorized", status: 401 };
  }

  const supabase = getSupabaseServerClient();
  const { data: userRow, error } = await supabase
    .from("users")
    .select("id,email")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return { error: error.message, status: 500 };
  }
  if (!userRow?.id) {
    return { error: "Authenticated user not found in users table", status: 403 };
  }

  return { supabase, userId: userRow.id, email };
}

