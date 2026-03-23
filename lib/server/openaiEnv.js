/**
 * Read OpenAI key at request time. Bracket access avoids some Next.js
 * compile-time replacements of process.env.* that can yield undefined in serverless.
 */
export function getOpenAiApiKey() {
  const v = process.env["OPENAI_API_KEY"];
  return typeof v === "string" ? v.trim() : "";
}
