/**
 * Safe message for API clients (no secrets). Truncates and strips sk-* substrings.
 * @param {unknown} err
 * @returns {string}
 */
export function getLlmErrorMessageForClient(err) {
  let msg =
    err && typeof err === "object" && "message" in err && typeof err.message === "string"
      ? err.message
      : String(err ?? "Unknown error");

  msg = msg.replace(/sk-[a-zA-Z0-9_-]{10,}/g, "[redacted]");
  if (msg.length > 400) {
    msg = `${msg.slice(0, 400)}…`;
  }
  return msg;
}
