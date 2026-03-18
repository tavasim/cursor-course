/**
 * Generate a random API key with prefix.
 * @param {string} [prefix='moshe-dev'] - Key prefix
 * @param {number} [length=32] - Random segment length
 * @returns {string}
 */
export function generateApiKey(prefix = "moshe-dev", length = 32) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

/**
 * Map database row (snake_case) to app format (camelCase).
 * @param {object} row - Row from api_keys table
 * @returns {object}
 */
export function mapDbToApiKey(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    key: row.key,
    description: row.description,
    type: row.type,
    limitMonthlyUsage: row.limit_monthly_usage,
    monthlyUsageLimit: row.monthly_usage_limit,
    usageCount: row.usage_count ?? 0,
    lastUsed: row.last_used,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
