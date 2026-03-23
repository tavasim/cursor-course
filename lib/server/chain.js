import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const summarizationPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert assistant. Summarize the following Github repository based on its README content.
Return an object with the following fields:
- "Summary": a single concise paragraph summarizing the repository and its purpose.
- "cool_facts": a list of 3–5 interesting, unique, or surprising details or features found in the README.
README Content: {readme_content}
Respond only with valid JSON for the object described, no prose or surrounding text.`,
  ],
  ["human", "Summarize this github repository from this readme file content."],
]);

const DEFAULT_MODEL = "gpt-3.5-turbo";
const MAX_README_CHARS = 14000;

function createSummarizationChain(apiKey) {
  const envModel = process.env["OPENAI_CHAT_MODEL"];
  const model =
    (typeof envModel === "string" ? envModel.trim() : "") || DEFAULT_MODEL;
  const llm = new ChatOpenAI({
    model,
    temperature: 0.3,
    apiKey,
  });
  return summarizationPrompt.pipe(llm);
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
  const response = await chain.invoke({ readme_content: truncated });

  try {
    let raw =
      typeof response?.content === "string"
        ? response.content
        : Array.isArray(response?.content)
          ? response.content
              .map((p) => (typeof p === "string" ? p : p?.text ?? ""))
              .join("")
          : "";

    raw = raw.trim();
    const fence = raw.match(/^```(?:json)?\s*([\s\S]*?)```$/im);
    if (fence) {
      raw = fence[1].trim();
    }

    const structured = JSON.parse(raw);
    return {
      Summary: structured?.Summary ?? "",
      cool_facts: Array.isArray(structured?.cool_facts)
        ? structured.cool_facts.filter((x) => typeof x === "string")
        : [],
    };
  } catch (e) {
    console.error("Failed to parse LLM response as JSON", e, response);
    return { Summary: "", cool_facts: [] };
  }
}
