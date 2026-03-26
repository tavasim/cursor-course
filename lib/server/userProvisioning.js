import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

const USERS_TABLE = process.env.SUPABASE_USERS_TABLE || "users";

/**
 * Create the user row on first login and update last_login_at every login.
 */
export async function ensureUserRecord({ user, account, profile }) {
  const email = user?.email || profile?.email || null;
  if (!email) return;

  const provider = account?.provider || "google";
  const providerUserId = account?.providerAccountId || profile?.sub || null;
  const displayName = user?.name || profile?.name || null;
  const avatarUrl = user?.image || profile?.picture || null;

  const supabase = getSupabaseAdmin();

  const { data: existing, error: selectError } = await supabase
    .from(USERS_TABLE)
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (selectError) throw selectError;

  if (!existing) {
    const { error: insertError } = await supabase.from(USERS_TABLE).insert({
      email,
      full_name: displayName,
      avatar_url: avatarUrl,
      auth_provider: provider,
      auth_provider_user_id: providerUserId,
      first_login_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;
    return;
  }

  const { error: updateError } = await supabase
    .from(USERS_TABLE)
    .update({
      full_name: displayName,
      avatar_url: avatarUrl,
      auth_provider: provider,
      auth_provider_user_id: providerUserId,
      last_login_at: new Date().toISOString(),
    })
    .eq("email", email);

  if (updateError) throw updateError;
}