"use client";

import * as React from "react";
import Link from "next/link";
import { Database, Settings2, Upload, UserPlus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddLeadButton } from "@/components/leads/add-lead-button";
import { ImportDialog } from "@/components/leads/import-dialog";
import { useCrmStore } from "@/store/use-crm-store";
import { toast } from "sonner";

/**
 * Shown on the dashboard when the workspace is empty — a focused "get started"
 * panel instead of a wall of zeroed-out charts.
 */
export function OnboardingCard() {
  const agencyName = useCrmStore((s) => s.settings.agencyName);
  const loadSampleData = useCrmStore((s) => s.loadSampleData);
  const [importOpen, setImportOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  return (
    <>
      <Card className="border-primary/20 from-primary/[0.07] bg-gradient-to-br to-transparent">
        <CardContent className="flex flex-col gap-6 py-2 sm:py-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Welcome to {agencyName} 👋
            </h2>
            <p className="text-muted-foreground max-w-xl text-sm">
              Your workspace is empty. Get your pipeline moving in under a minute:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Step
              icon={UserPlus}
              title="Add your first lead"
              description="Capture a prospect manually — scoring kicks in instantly."
              action={<AddLeadButton size="sm" variant="outline" label="Add lead" />}
            />
            <Step
              icon={Upload}
              title="Import a CSV"
              description="Drop in an Apollo export and map the columns."
              action={
                <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                  <Upload className="size-4" /> Import
                </Button>
              }
            />
            <Step
              icon={Settings2}
              title="Set your goals"
              description="Lead and revenue targets power the dashboard."
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings">Open settings</Link>
                </Button>
              }
            />
          </div>

          <button
            className="text-muted-foreground hover:text-foreground inline-flex w-fit cursor-pointer items-center gap-1.5 text-xs transition-colors"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await loadSampleData();
                toast.success("Sample data loaded");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Database className="size-3.5" />
            …or explore with sample data first
          </button>
        </CardContent>
      </Card>
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}

function Step({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof UserPlus;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="bg-card/60 flex flex-col gap-2 rounded-lg border p-4">
      <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md">
        <Icon className="size-4" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground flex-1 text-xs leading-relaxed">
        {description}
      </p>
      <div>{action}</div>
    </div>
  );
}
