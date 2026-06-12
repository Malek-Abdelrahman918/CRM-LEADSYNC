import { NextResponse } from "next/server";

import { AIError, complete, type ChatMessage } from "@/lib/server/ai";

export const dynamic = "force-dynamic";

const ROLES = new Set(["system", "user", "assistant"]);
const MAX_MESSAGES = 40;
const MAX_CONTENT_CHARS = 24_000;

/** POST /api/ai/complete — generic chat completion (powers AIProvider.complete). */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const raw = body?.messages;
    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json(
        { error: "Request must include a non-empty `messages` array." },
        { status: 400 },
      );
    }

    const messages: ChatMessage[] = [];
    for (const m of raw.slice(0, MAX_MESSAGES)) {
      if (!m || !ROLES.has(m.role) || typeof m.content !== "string") {
        return NextResponse.json(
          { error: "Each message needs a valid `role` and string `content`." },
          { status: 400 },
        );
      }
      messages.push({ role: m.role, content: m.content.slice(0, MAX_CONTENT_CHARS) });
    }

    const text = await complete(messages, {
      maxTokens:
        typeof body.maxTokens === "number" ? body.maxTokens : undefined,
    });
    return NextResponse.json({ text });
  } catch (err) {
    if (err instanceof AIError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
