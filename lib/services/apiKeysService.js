import { supabase } from "@/lib/supabase";
import { mapDbToApiKey } from "@/lib/utils/apiKeyUtils";

const FIXED_MONTHLY_LIMIT = 200;

/**
 * Fetch all API keys from the database, ordered by created_at desc.
 * @returns {Promise<object[]>} Mapped API key objects
 */
export async function fetchApiKeys() {
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapDbToApiKey);
}

/**
 * Create a new API key.
 * @param {object} payload - { name, key, description?, type, limit_monthly_usage, monthly_usage_limit }
 * @returns {Promise<object>} Created row (mapped)
 */
export async function createApiKey(payload) {
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      name: payload.name,
      key: payload.key,
      description: payload.description || null,
      type: payload.type,
      limit_monthly_usage: true,
      monthly_usage_limit: FIXED_MONTHLY_LIMIT,
      usage_count: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToApiKey(data);
}

/**
 * Update an existing API key by id.
 * @param {string} id - API key id
 * @param {object} payload - Same shape as create
 * @returns {Promise<object>} Updated row (mapped)
 */
export async function updateApiKey(id, payload) {
  const { data, error } = await supabase
    .from("api_keys")
    .update({
      name: payload.name,
      key: payload.key,
      description: payload.description || null,
      type: payload.type,
      limit_monthly_usage: true,
      monthly_usage_limit: FIXED_MONTHLY_LIMIT,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToApiKey(data);
}

/**
 * Delete an API key by id.
 * @param {string} id - API key id
 */
export async function deleteApiKey(id) {
  const { error } = await supabase.from("api_keys").delete().eq("id", id);
  if (error) throw error;
}
