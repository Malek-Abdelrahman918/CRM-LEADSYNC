/**
 * Server-side AI engine (Phase 2).
 *
 * Runs ONLY in route handlers — API keys never reach the browser. Supports two
 * vendors behind one `complete()` function:
 *
 *   - Anthropic (Claude) via the official SDK — preferred when both are set
 *   - OpenAI via REST
 *
 * Select explicitly with AI_PROVIDER=anthropic|openai, otherwise auto-detected
 * from whichever API key is present.
 */

import "server-only";

import Anthropic from "@anthropic-ai/sdk";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompleteOptions {
  maxTokens?: number;
}

export class AIError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
  ) {
    super(message);
    this.name = "AIError";
  }
}

type Vendor = "anthropic" | "openai";

export function resolveVendor(): Vendor | null {
  const forced = process.env.AI_PROVIDER as Vendor | undefined;
  if (forced === "anthropic" || forced === "openai") return forced;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export function aiConfigured(): boolean {
  return resolveVendor() !== null;
}

/** Short-form tasks (emails, summaries) — deliberately bounded output. */
const DEFAULT_MAX_TOKENS = 2048;
const MAX_TOKENS_CEILING = 8192;

export async function complete(
  messages: ChatMessage[],
  options: CompleteOptions = {},
): Promise<string> {
  const vendor = resolveVendor();
  if (!vendor) {
    throw new AIError(
      "No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY on the server.",
      503,
    );
  }

  const maxTokens = Math.min(
    options.maxTokens ?? DEFAULT_MAX_TOKENS,
    MAX_TOKENS_CEILING,
  );

  return vendor === "anthropic"
    ? anthropicComplete(messages, maxTokens)
    : openaiComplete(messages, maxTokens);
}

/* -------------------------------------------------------------------------- */
/*  Anthropic (Claude)                                                         */
/* -------------------------------------------------------------------------- */

let anthropicClient: Anthropic | null = null;

function getAnthropic(): Anthropic {
  anthropicClient ??= new Anthropic(); // reads ANTHROPIC_API_KEY
  return anthropicClient;
}

async function anthropicComplete(
  messages: ChatMessage[],
  maxTokens: number,
): Promise<string> {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const turns = messages
    .filter((m): m is ChatMessage & { role: "user" | "assistant" } => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    const response = await getAnthropic().messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8",
      max_tokens: maxTokens,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" }, // short, routine drafting/summarising tasks
      ...(system ? { system } : {}),
      messages: turns,
    });

    if (response.stop_reason === "refusal") {
      throw new AIError("The model declined this request.", 422);
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    if (!text) throw new AIError("The model returned an empty response.", 502);
    return text.trim();
  } catch (err) {
    if (err instanceof AIError) throw err;
    if (err instanceof Anthropic.APIError) {
      throw new AIError(`Claude API error: ${err.message}`, err.status ?? 502);
    }
    throw new AIError("Could not reach the Claude API.", 502);
  }
}

/* -------------------------------------------------------------------------- */
/*  OpenAI                                                                     */
/* -------------------------------------------------------------------------- */

async function openaiComplete(
  messages: ChatMessage[],
  maxTokens: number,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o",
        max_tokens: maxTokens,
        temperature: 0.7,
        messages,
      }),
    });
  } catch {
    throw new AIError("Could not reach the OpenAI API.", 502);
  }

  const json = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  } | null;

  if (!res.ok) {
    throw new AIError(
      `OpenAI API error: ${json?.error?.message ?? res.statusText}`,
      res.status === 401 ? 502 : res.status,
    );
  }

  const text = json?.choices?.[0]?.message?.content;
  if (!text) throw new AIError("The model returned an empty response.", 502);
  return text.trim();
}
