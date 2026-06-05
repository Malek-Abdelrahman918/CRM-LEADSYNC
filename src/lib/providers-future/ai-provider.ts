/**
 * AIProvider — Phase 2/3 abstraction for LLM-powered features.
 *
 * Concrete implementation targets: **OpenAI API** and **Claude API**. NOT
 * implemented in Phase 1 — interface only.
 *
 * Keeping a thin `complete()` primitive plus a few task-shaped helpers means UI
 * surfaces (e.g. "Draft outreach", "Summarise lead") depend on the capability,
 * not the vendor — swapping OpenAI ↔ Claude is a registry change.
 */

import type { Activity, Lead } from "@/lib/types";

export type AIRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIRole;
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  readonly id: string;

  /** Low-level chat completion primitive. */
  complete(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;

  /** Draft a personalised outreach message for a lead. */
  draftOutreach(lead: Lead, context?: string): Promise<string>;

  /** Summarise a lead from its profile + recent activity. */
  summarizeLead(lead: Lead, activities: Activity[]): Promise<string>;

  /** Optional: an AI-assisted score that can blend with the rule engine. */
  suggestScore?(lead: Lead): Promise<number>;
}
