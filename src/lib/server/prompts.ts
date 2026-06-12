/**
 * Prompt builders for the AI endpoints. Kept separate from transport so prompts
 * can be tuned without touching vendor code.
 */

import "server-only";

import type { ChatMessage } from "./ai";

interface LeadPayload {
  fullName?: string;
  role?: string;
  company?: string;
  industry?: string;
  location?: string;
  companySize?: string;
  email?: string;
  status?: string;
  score?: number;
  tags?: string[];
}

interface ActivityPayload {
  type?: string;
  title?: string;
  description?: string;
  createdAt?: string;
}

interface NotePayload {
  content?: string;
  createdAt?: string;
}

function leadProfile(lead: LeadPayload): string {
  const lines = [
    `Name: ${lead.fullName ?? "Unknown"}`,
    lead.role && `Role: ${lead.role}`,
    lead.company && `Company: ${lead.company}`,
    lead.industry && `Industry: ${lead.industry}`,
    lead.location && `Location: ${lead.location}`,
    lead.companySize && `Company size: ${lead.companySize} employees`,
    lead.status && `Pipeline stage: ${lead.status}`,
    lead.score !== undefined && `Lead score: ${lead.score}/100`,
    lead.tags?.length ? `Tags: ${lead.tags.join(", ")}` : undefined,
  ].filter(Boolean);
  return lines.join("\n");
}

export function buildDraftMessages(input: {
  lead: LeadPayload;
  agencyName?: string;
  context?: string;
}): ChatMessage[] {
  const { lead, agencyName, context } = input;
  return [
    {
      role: "system",
      content:
        `You are a senior SDR at ${agencyName || "an automation agency"} that builds AI and workflow automation for businesses. ` +
        "Write concise, personalised cold/follow-up outreach emails. " +
        "Rules: subject line first on its own line (prefixed 'Subject: '), then the body. " +
        "Keep the body under 130 words, reference the lead's role/company/industry naturally, " +
        "lead with a concrete pain point you can solve, end with one low-friction call to action. " +
        "No placeholders like [Name] — use the data given. No emoji, no hype words. " +
        "Respond with the email only — no preamble or commentary.",
    },
    {
      role: "user",
      content:
        `Draft an outreach email to this lead:\n\n${leadProfile(lead)}` +
        (context ? `\n\nExtra context from me:\n${context}` : ""),
    },
  ];
}

export function buildSummarizeMessages(input: {
  lead: LeadPayload;
  activities?: ActivityPayload[];
  notes?: NotePayload[];
}): ChatMessage[] {
  const { lead, activities = [], notes = [] } = input;

  const timeline = activities
    .slice(0, 15)
    .map((a) => `- [${a.createdAt?.slice(0, 10) ?? "?"}] ${a.title}${a.description ? ` — ${a.description}` : ""}`)
    .join("\n");
  const noteLines = notes
    .slice(0, 5)
    .map((n) => `- ${n.content}`)
    .join("\n");

  return [
    {
      role: "system",
      content:
        "You are a sales operations analyst. Summarise leads crisply for a busy founder. " +
        "Output exactly three short sections, each with a bold heading: " +
        "**Where this deal stands** (2-3 sentences), **Key signals** (2-4 bullets), " +
        "**Recommended next step** (1-2 sentences, specific and actionable). " +
        "Respond with the summary only — no preamble.",
    },
    {
      role: "user",
      content:
        `Summarise this lead:\n\n${leadProfile(lead)}` +
        (timeline ? `\n\nRecent activity (newest first):\n${timeline}` : "\n\nNo activity logged yet.") +
        (noteLines ? `\n\nMy notes:\n${noteLines}` : ""),
    },
  ];
}
