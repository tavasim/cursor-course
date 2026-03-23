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

function createSummarizationChain() {
  const model = process.env.OPENAI_CHAT_MODEL?.trim() || DEFAULT_MODEL;
  const llm = new ChatOpenAI({
    model,
    temperature: 0.3,
  });
  return summarizationPrompt.pipe(llm);
}

/**
 * Run the LangChain summarization over README markdown.
 * @param {string} readmeContent
 * @returns {Promise<{ Summary: string, cool_facts: string[] }>}
 */
export async function summarizeReadmeFromMarkdown(readmeContent) {
  const text = typeof readmeContent === "string" ? readmeContent.trim() : "";
  if (!text) {
    return { Summary: "", cool_facts: [] };
  }

  const truncated =
    text.length > MAX_README_CHARS
      ? `${text.slice(0, MAX_README_CHARS)}\n\n[truncated]`
      : text;

  const chain = createSummarizationChain();
  const response = await chain.invoke({ readme_content: truncated });

  try {
    let structured;
    if (typeof response?.content === "string") {
      structured = JSON.parse(response.content);
    } else {
      structured = response;
    }
    return {
      Summary: structured?.Summary ?? "",
      cool_facts: Array.isArray(structured?.cool_facts)
        ? structured.cool_facts
        : [],
    };
  } catch (e) {
    console.error("Failed to parse LLM response as JSON", e, response);
    return { Summary: "", cool_facts: [] };
  }
}
