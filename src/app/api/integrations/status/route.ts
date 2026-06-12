import { NextResponse } from "next/server";

import { aiConfigured } from "@/lib/server/ai";

export const dynamic = "force-dynamic";

/**
 * Reports which integrations are configured — booleans only, never values.
 * Lets the client (Settings panel, AI card) reflect real server-side env state
 * without shipping secrets to the browser.
 */
export async function GET() {
  return NextResponse.json({
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    apollo: Boolean(process.env.APOLLO_API_KEY),
    n8n: Boolean(process.env.N8N_WEBHOOK_BASE_URL),
    /** True when at least one AI vendor is usable. */
    ai: aiConfigured(),
  });
}
