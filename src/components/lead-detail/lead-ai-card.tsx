"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  StickyNote,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAIProvider } from "@/lib/providers-future";
import { useIntegrationStatus } from "@/hooks/use-integration-status";
import { useCrmStore } from "@/store/use-crm-store";
import type { Activity, Lead } from "@/lib/types";

type Kind = "draft" | "summary";

const LABELS: Record<Kind, string> = {
  draft: "Outreach draft",
  summary: "Lead summary",
};

export function LeadAICard({
  lead,
  activities,
}: {
  lead: Lead;
  activities: Activity[];
}) {
  const status = useIntegrationStatus();
  const addNote = useCrmStore((s) => s.addNote);

  const [busy, setBusy] = React.useState<Kind | null>(null);
  const [result, setResult] = React.useState<{ kind: Kind; text: string } | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function run(kind: Kind) {
    const ai = getAIProvider();
    if (!ai) return;
    setBusy(kind);
    try {
      const text =
        kind === "draft"
          ? await ai.draftOutreach(lead)
          : await ai.summarizeLead(lead, activities);
      setResult({ kind, text });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }

  async function saveAsNote() {
    if (!result) return;
    await addNote(lead.id, `🤖 ${LABELS[result.kind]}\n\n${result.text}`);
    toast.success("Saved to notes");
  }

  const configured = status?.ai ?? false;
  const loadingStatus = status === null;

  return (
    <Card className="border-primary/20 from-primary/[0.06] bg-gradient-to-b to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="text-primary size-4" />
          AI Assistant
          {!loadingStatus && !configured && (
            <Badge variant="outline" className="ml-auto font-normal">
              Not configured
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!loadingStatus && !configured ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Add <code className="text-foreground text-xs">ANTHROPIC_API_KEY</code> or{" "}
            <code className="text-foreground text-xs">OPENAI_API_KEY</code> to the
            server environment to enable outreach drafting and lead summaries. See{" "}
            <code className="text-foreground text-xs">.env.example</code>.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!configured || busy !== null}
                onClick={() => run("draft")}
              >
                {busy === "draft" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Draft outreach
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!configured || busy !== null}
                onClick={() => run("summary")}
              >
                {busy === "summary" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileText className="size-4" />
                )}
                Summarize
              </Button>
            </div>

            {result && (
              <div className="space-y-2">
                <div className="bg-card/80 max-h-72 overflow-y-auto rounded-lg border p-3">
                  <p className="text-muted-foreground mb-1.5 text-[11px] font-medium tracking-wide uppercase">
                    {LABELS[result.kind]}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{result.text}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button variant="ghost" size="sm" onClick={copy}>
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" onClick={saveAsNote}>
                    <StickyNote className="size-3.5" /> Save as note
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => run(result.kind)}
                  >
                    <RefreshCw className="size-3.5" /> Regenerate
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
