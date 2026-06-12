import { NextResponse } from "next/server";

import { AIError, complete } from "@/lib/server/ai";
import { buildSummarizeMessages } from "@/lib/server/prompts";

export const dynamic = "force-dynamic";

/** POST /api/ai/summarize — summarise a lead from profile + activity + notes. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const lead = body?.lead;
    if (!lead || typeof lead !== "object" || !lead.fullName) {
      return NextResponse.json(
        { error: "Request must include a `lead` object with at least a fullName." },
        { status: 400 },
      );
    }

    const text = await complete(
      buildSummarizeMessages({
        lead,
        activities: Array.isArray(body.activities) ? body.activities : [],
        notes: Array.isArray(body.notes) ? body.notes : [],
      }),
    );
    return NextResponse.json({ text });
  } catch (err) {
    if (err instanceof AIError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
