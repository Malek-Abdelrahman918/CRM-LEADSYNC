"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Database,
  Download,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useCrmStore } from "@/store/use-crm-store";
import { useIntegrationStatus } from "@/hooks/use-integration-status";
import { downloadFile } from "@/lib/download";
import { cn } from "@/lib/utils";

const CURRENCIES = ["USD", "AED", "EUR", "GBP", "SAR", "INR"];

const INTEGRATIONS = [
  { key: "supabase", label: "Supabase", desc: "Database & realtime sync", phase: 2 },
  { key: "openai", label: "OpenAI", desc: "AI drafting & summaries", phase: 2 },
  { key: "anthropic", label: "Claude", desc: "AI drafting & scoring", phase: 2 },
  { key: "apollo", label: "Apollo", desc: "Lead sourcing & enrichment", phase: 2 },
  { key: "n8n", label: "n8n", desc: "Outreach automation & tracking", phase: 3 },
] as const;

export function SettingsView() {
  const settings = useCrmStore((s) => s.settings);
  const updateSettings = useCrmStore((s) => s.updateSettings);
  const resetSettings = useCrmStore((s) => s.resetSettings);
  const exportData = useCrmStore((s) => s.exportData);
  const importData = useCrmStore((s) => s.importData);
  const clearData = useCrmStore((s) => s.clearData);
  const loadSampleData = useCrmStore((s) => s.loadSampleData);
  const integrationStatus = useIntegrationStatus();

  const [form, setForm] = React.useState(settings);
  const [saving, setSaving] = React.useState(false);
  const [clearOpen, setClearOpen] = React.useState(false);
  const [sampleOpen, setSampleOpen] = React.useState(false);
  const importRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setForm(settings), [settings]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const num = (v: string) => Math.max(0, Number(v) || 0);

  async function save() {
    setSaving(true);
    try {
      await updateSettings({
        agencyName: form.agencyName.trim() || "LeadSync Agency",
        brandColor: form.brandColor,
        currency: form.currency,
        monthlyLeadGoal: form.monthlyLeadGoal,
        monthlyRevenueGoal: form.monthlyRevenueGoal,
        pipelineValueGoal: form.pipelineValueGoal,
        averageDealValue: form.averageDealValue,
        defaultFollowUpDays: form.defaultFollowUpDays,
      });
      toast.success("Settings saved");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    const bundle = await exportData();
    downloadFile(
      `leadsync-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(bundle, null, 2),
      "application/json",
    );
    toast.success("Backup downloaded");
  }

  async function handleImportFile(file: File) {
    try {
      const data = JSON.parse(await file.text());
      await importData(data);
      toast.success("Data imported");
    } catch {
      toast.error("That doesn't look like a valid LeadSync backup");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your agency, goals and data."
      >
        <Button onClick={save} disabled={saving}>
          Save changes
        </Button>
      </PageHeader>

      {/* Agency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agency</CardTitle>
          <CardDescription>Branding shown across the app.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Agency name</Label>
            <Input
              value={form.agencyName}
              onChange={(e) => set("agencyName", e.target.value)}
              placeholder="Your agency"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Brand color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.brandColor ?? "#7c5cff"}
                onChange={(e) => set("brandColor", e.target.value)}
                className="border-input size-9 cursor-pointer rounded-md border bg-transparent"
                aria-label="Brand color"
              />
              <Input
                value={form.brandColor ?? ""}
                onChange={(e) => set("brandColor", e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(v) => set("currency", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Goals & assumptions</CardTitle>
          <CardDescription>
            Power the dashboard targets and pipeline value.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Monthly lead goal</Label>
            <Input
              type="number"
              value={form.monthlyLeadGoal}
              onChange={(e) => set("monthlyLeadGoal", num(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Monthly revenue goal ({form.currency})</Label>
            <Input
              type="number"
              value={form.monthlyRevenueGoal}
              onChange={(e) => set("monthlyRevenueGoal", num(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Pipeline value goal ({form.currency})</Label>
            <Input
              type="number"
              value={form.pipelineValueGoal}
              onChange={(e) => set("pipelineValueGoal", num(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Average deal value ({form.currency})</Label>
            <Input
              type="number"
              value={form.averageDealValue}
              onChange={(e) => set("averageDealValue", num(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Default follow-up (days)</Label>
            <Input
              type="number"
              value={form.defaultFollowUpDays}
              onChange={(e) => set("defaultFollowUpDays", num(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data</CardTitle>
          <CardDescription>
            Stored locally in your browser
            <Badge variant="secondary" className="ml-2 font-normal">
              <Database className="size-3" /> LocalStorage
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" /> Export data
            </Button>
            <Button variant="outline" onClick={() => importRef.current?.click()}>
              <Upload className="size-4" /> Import data
            </Button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => setSampleOpen(true)}>
              <RotateCcw className="size-4" /> Load sample data
            </Button>
          </div>
          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm">
              Permanently delete all leads, activity, notes and tasks.
            </p>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setClearOpen(true)}
            >
              <Trash2 className="size-4" /> Clear all data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Phase 2 integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="text-primary size-4" />
            Integrations
          </CardTitle>
          <CardDescription>
            Phase 2 & 3 connectors. The app is already wired to accept these —
            enable them when you are ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y py-0">
          {INTEGRATIONS.map((it) => {
            const enabled = integrationStatus?.[it.key] ?? false;
            const checking = integrationStatus === null;
            return (
              <div key={it.key} className="flex items-center gap-3 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{it.label}</p>
                  <p className="text-muted-foreground text-xs">{it.desc}</p>
                </div>
                <Badge variant="outline" className="font-normal">
                  Phase {it.phase}
                </Badge>
                <span
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-xs font-medium",
                    enabled
                      ? "border-emerald-400/25 bg-emerald-500/15 text-emerald-300"
                      : "text-muted-foreground",
                  )}
                >
                  {checking ? "Checking…" : enabled ? "Connected" : "Not configured"}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={async () => {
            await resetSettings();
            toast.success("Settings reset to defaults");
          }}
        >
          Reset to defaults
        </Button>
        <Button onClick={save} disabled={saving}>
          Save changes
        </Button>
      </div>

      <ConfirmDialog
        open={sampleOpen}
        onOpenChange={setSampleOpen}
        title="Load sample data?"
        description="This replaces all current data with the Dubai real-estate sample dataset."
        confirmLabel="Load sample data"
        onConfirm={async () => {
          await loadSampleData();
          toast.success("Sample data loaded");
        }}
      />
      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear all data?"
        description="This permanently deletes every lead, activity, note and task. This cannot be undone."
        confirmLabel="Delete everything"
        destructive
        onConfirm={async () => {
          await clearData();
          toast.success("All data cleared");
        }}
      />
    </div>
  );
}
