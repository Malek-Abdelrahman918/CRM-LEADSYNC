"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScorePill } from "@/components/leads/lead-badges";
import { useCrmStore } from "@/store/use-crm-store";
import { scoreLead } from "@/lib/scoring/lead-scoring";
import {
  COMPANY_SIZES,
  INDUSTRIES,
  LEAD_SOURCES,
  PIPELINE_STAGES,
} from "@/lib/constants";
import type {
  CompanySize,
  Industry,
  Lead,
  LeadSource,
  PipelineStage,
} from "@/lib/types";

const NONE = "none";

interface FormState {
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  companyWebsite: string;
  industry: Industry | typeof NONE;
  companySize: CompanySize | typeof NONE;
  location: string;
  status: PipelineStage;
  source: LeadSource;
  dealValue: string;
  tags: string;
}

function fromLead(lead?: Lead): FormState {
  return {
    firstName: lead?.firstName ?? "",
    lastName: lead?.lastName ?? "",
    role: lead?.role ?? "",
    company: lead?.company ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    linkedinUrl: lead?.linkedinUrl ?? "",
    companyWebsite: lead?.companyWebsite ?? "",
    industry: lead?.industry ?? NONE,
    companySize: lead?.companySize ?? NONE,
    location: lead?.location ?? "",
    status: lead?.status ?? "new",
    source: lead?.source ?? "manual",
    dealValue: lead?.dealValue?.toString() ?? "",
    tags: lead?.tags?.join(", ") ?? "",
  };
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
  onSaved?: (lead: Lead) => void;
}) {
  const addLead = useCrmStore((s) => s.addLead);
  const updateLead = useCrmStore((s) => s.updateLead);
  const isEdit = !!lead;

  const [form, setForm] = React.useState<FormState>(() => fromLead(lead));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) setForm(fromLead(lead));
  }, [open, lead]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const liveScore = React.useMemo(
    () =>
      scoreLead({
        role: form.role,
        industry: form.industry === NONE ? undefined : form.industry,
        location: form.location,
        companySize: form.companySize === NONE ? undefined : form.companySize,
        email: form.email,
        linkedinUrl: form.linkedinUrl,
        phone: form.phone,
        companyWebsite: form.companyWebsite,
      }).score,
    [form],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() && !form.lastName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!form.company.trim()) {
      toast.error("Please enter a company");
      return;
    }

    setSaving(true);
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      role: form.role.trim(),
      company: form.company.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      linkedinUrl: form.linkedinUrl.trim() || undefined,
      companyWebsite: form.companyWebsite.trim() || undefined,
      industry: form.industry === NONE ? undefined : form.industry,
      companySize: form.companySize === NONE ? undefined : form.companySize,
      location: form.location.trim() || undefined,
      status: form.status,
      source: form.source,
      dealValue: form.dealValue ? Number(form.dealValue) : undefined,
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };

    try {
      if (isEdit && lead) {
        await updateLead(lead.id, payload);
        toast.success("Lead updated");
      } else {
        const created = await addLead(payload);
        toast.success("Lead added");
        onSaved?.(created);
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit lead" : "Add a new lead"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this lead."
              : "Capture a new lead. The score updates live as you fill in the details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Section title="Profile">
            <Field label="First name">
              <Input
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="Jane"
              />
            </Field>
            <Field label="Last name">
              <Input
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="Doe"
              />
            </Field>
            <Field label="Role / Title">
              <Input
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                placeholder="Founder"
              />
            </Field>
            <Field label="Company">
              <Input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Prime Estates"
              />
            </Field>
          </Section>

          <Section title="Contact">
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="jane@company.com"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+971 50 000 0000"
              />
            </Field>
            <Field label="LinkedIn URL">
              <Input
                value={form.linkedinUrl}
                onChange={(e) => set("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/in/…"
              />
            </Field>
            <Field label="Website">
              <Input
                value={form.companyWebsite}
                onChange={(e) => set("companyWebsite", e.target.value)}
                placeholder="https://company.com"
              />
            </Field>
          </Section>

          <Section title="Company & segmentation">
            <Field label="Industry">
              <Select
                value={form.industry}
                onValueChange={(v) => set("industry", v as FormState["industry"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unspecified</SelectItem>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Company size">
              <Select
                value={form.companySize}
                onValueChange={(v) =>
                  set("companySize", v as FormState["companySize"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unspecified</SelectItem>
                  {COMPANY_SIZES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label} employees
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Dubai, UAE"
              />
            </Field>
            <Field label="Deal value">
              <Input
                type="number"
                min={0}
                value={form.dealValue}
                onChange={(e) => set("dealValue", e.target.value)}
                placeholder="5000"
              />
            </Field>
          </Section>

          <Section title="Pipeline">
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as PipelineStage)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Source">
              <Select
                value={form.source}
                onValueChange={(v) => set("source", v as LeadSource)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tags" full>
              <Input
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="high-intent, inbound (comma separated)"
              />
            </Field>
          </Section>

          <DialogFooter className="items-center gap-3 sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Live score</span>
              <ScorePill score={liveScore} />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {isEdit ? "Save changes" : "Add lead"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
