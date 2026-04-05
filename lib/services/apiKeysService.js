async function readJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const body = await readJsonSafe(response);
  if (!response.ok) {
    const message =
      body?.error ||
      `Request failed (${response.status})${response.statusText ? `: ${response.statusText}` : ""}`;
    throw new Error(message);
  }

  return body;
}

/**
 * Fetch all API keys from the database, ordered by created_at desc.
 * @returns {Promise<object[]>} Mapped API key objects
 */
export async function fetchApiKeys() {
  const body = await request("/api/api-keys", { method: "GET" });
  return body?.data ?? [];
}

/**
 * Create a new API key.
 * @param {object} payload - { name, key, description?, type, limit_monthly_usage, monthly_usage_limit }
 * @returns {Promise<object>} Created row (mapped)
 */
export async function createApiKey(payload) {
  const body = await request("/api/api-keys", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      key: payload.key,
      description: payload.description || null,
      type: payload.type,
    }),
  });
  return body?.data;
}

/**
 * Update an existing API key by id.
 * @param {string} id - API key id
 * @param {object} payload - Same shape as create
 * @returns {Promise<object>} Updated row (mapped)
 */
export async function updateApiKey(id, payload) {
  const body = await request(`/api/api-keys/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: payload.name,
      key: payload.key,
      description: payload.description || null,
      type: payload.type,
    }),
  });
  return body?.data;
}

/**
 * Delete an API key by id.
 * @param {string} id - API key id
 */
export async function deleteApiKey(id) {
  await request(`/api/api-keys/${id}`, { method: "DELETE" });
}
