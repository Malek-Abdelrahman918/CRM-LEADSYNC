"use client";

import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCrmStore } from "@/store/use-crm-store";
import { getFollowUpInfo, suggestFollowUpDate } from "@/lib/follow-up/follow-up";
import { PIPELINE_STAGES, STAGE_MAP } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead, PipelineStage } from "@/lib/types";

export function LeadStatusCard({ lead }: { lead: Lead }) {
  const updateLeadStatus = useCrmStore((s) => s.updateLeadStatus);
  const scheduleFollowUp = useCrmStore((s) => s.scheduleFollowUp);

  const info = getFollowUpInfo(lead);
  const [date, setDate] = React.useState(
    lead.nextFollowUpAt ? lead.nextFollowUpAt.slice(0, 10) : "",
  );

  React.useEffect(() => {
    setDate(lead.nextFollowUpAt ? lead.nextFollowUpAt.slice(0, 10) : "");
  }, [lead.nextFollowUpAt]);

  async function changeStatus(status: PipelineStage) {
    await updateLeadStatus(lead.id, status);
    toast.success(`Moved to ${STAGE_MAP[status].label}`);
  }

  async function schedule(iso: string | undefined) {
    await scheduleFollowUp(lead.id, iso);
  }

  const StateIcon =
    info.state === "overdue"
      ? AlertTriangle
      : info.state === "due_today"
        ? Clock
        : CalendarClock;
  const stateTone =
    info.state === "overdue"
      ? "text-destructive"
      : info.state === "due_today"
        ? "text-amber-400"
        : "text-muted-foreground";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status & Follow-up</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs">Pipeline status</p>
          <Select
            value={lead.status}
            onValueChange={(v) => changeStatus(v as PipelineStage)}
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
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">Next follow-up</p>
            {info.state !== "none" && (
              <span
                className={cn("flex items-center gap-1 text-xs font-medium", stateTone)}
              >
                <StateIcon className="size-3" />
                {formatRelative(info.date)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={async () => {
                if (!date) return;
                await schedule(new Date(`${date}T09:00:00`).toISOString());
                toast.success("Follow-up scheduled");
              }}
            >
              Set
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const iso = suggestFollowUpDate(3);
                setDate(iso.slice(0, 10));
                await schedule(iso);
                toast.success("Follow-up in 3 days");
              }}
            >
              +3 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const iso = suggestFollowUpDate(7);
                setDate(iso.slice(0, 10));
                await schedule(iso);
                toast.success("Follow-up in 7 days");
              }}
            >
              +1 week
            </Button>
            {lead.nextFollowUpAt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setDate("");
                  await schedule(undefined);
                  toast.success("Follow-up cleared");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {lead.lastContactedAt && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="size-3.5" />
            Last contacted {formatDate(lead.lastContactedAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
