/**
 * ApiAIProvider — the first concrete Phase 2 provider implementation.
 *
 * Implements the `AIProvider` interface declared in Phase 1
 * (src/lib/providers-future/ai-provider.ts) by calling our own /api/ai/*
 * route handlers, which hold the vendor API keys server-side. The UI consumes
 * this through the provider registry, exactly as the architecture promised.
 */

import type {
  AICompletionOptions,
  AIMessage,
  AIProvider,
} from "@/lib/providers-future";
import type { Activity, Lead } from "@/lib/types";

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the server.");
  }
  const json = (await res.json().catch(() => ({}))) as {
    text?: string;
    error?: string;
  };
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  if (!json.text) throw new Error("Empty response from the AI service.");
  return json as T;
}

export class ApiAIProvider implements AIProvider {
  readonly id = "leadsync-api";

  constructor(private readonly getAgencyName?: () => string | undefined) {}

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions,
  ): Promise<string> {
    const { text } = await post<{ text: string }>("/api/ai/complete", {
      messages,
      maxTokens: options?.maxTokens,
    });
    return text;
  }

  async draftOutreach(lead: Lead, context?: string): Promise<string> {
    const { text } = await post<{ text: string }>("/api/ai/draft", {
      lead: leadPayload(lead),
      context,
      agencyName: this.getAgencyName?.(),
    });
    return text;
  }

  async summarizeLead(lead: Lead, activities: Activity[]): Promise<string> {
    const { text } = await post<{ text: string }>("/api/ai/summarize", {
      lead: leadPayload(lead),
      activities: activities.slice(0, 15).map((a) => ({
        type: a.type,
        title: a.title,
        description: a.description,
        createdAt: a.createdAt,
      })),
    });
    return text;
  }
}

/** Send only the fields the prompts need — keeps payloads small and stable. */
function leadPayload(lead: Lead) {
  return {
    fullName: lead.fullName,
    role: lead.role,
    company: lead.company,
    industry: lead.industry,
    location: lead.location,
    companySize: lead.companySize,
    email: lead.email,
    status: lead.status,
    score: lead.score,
    tags: lead.tags,
  };
}
