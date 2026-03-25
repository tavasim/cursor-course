import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

const readmeSummarySchema = z.object({
  Summary: z
    .string()
    .describe(
      "A single concise paragraph summarizing the repository and its purpose."
    ),
  cool_facts: z
    .array(z.string())
    .describe(
      "3–5 interesting, unique, or surprising details or features found in the README."
    ),
});

const summarizationPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert assistant. Summarize the GitHub repository using only the README content below.

README content:
{readme_content}`,
  ],
  [
    "human",
    "Produce the structured summary and cool facts from this README.",
  ],
]);

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_README_CHARS = 12000;

function createSummarizationChain(apiKey) {
  const envModel = process.env["OPENAI_CHAT_MODEL"];
  const model =
    (typeof envModel === "string" ? envModel.trim() : "") || DEFAULT_MODEL;

  const llm = new ChatOpenAI({
    model,
    temperature: 0.3,
    apiKey,
    maxRetries: 2,
    timeout: 120_000,
  });

  const modelWithStructure = llm.withStructuredOutput(readmeSummarySchema, {
    name: "readme_summary",
  });

  return summarizationPrompt.pipe(modelWithStructure);
}

/**
 * Run the LangChain summarization over README markdown.
 * @param {string} readmeContent
 * @param {{ apiKey: string }} options - OpenAI API key (pass from server; do not expose to client)
 * @returns {Promise<{ Summary: string, cool_facts: string[] }>}
 */
export async function summarizeReadmeFromMarkdown(readmeContent, options) {
  const apiKey = typeof options?.apiKey === "string" ? options.apiKey.trim() : "";
  const text = typeof readmeContent === "string" ? readmeContent.trim() : "";
  if (!text || !apiKey) {
    return { Summary: "", cool_facts: [] };
  }

  const truncated =
    text.length > MAX_README_CHARS
      ? `${text.slice(0, MAX_README_CHARS)}\n\n[truncated]`
      : text;

  const chain = createSummarizationChain(apiKey);
  const structured = await chain.invoke({ readme_content: truncated });

  if (!structured || typeof structured !== "object") {
    return { Summary: "", cool_facts: [] };
  }

  return {
    Summary:
      typeof structured.Summary === "string" ? structured.Summary.trim() : "",
    cool_facts: Array.isArray(structured.cool_facts)
      ? structured.cool_facts.filter((x) => typeof x === "string")
      : [],
  };
}
