"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUpRight } from "lucide-react";

import { LeadAvatar } from "@/components/shared/lead-avatar";
import { ScorePill } from "@/components/leads/lead-badges";
import { useCrmStore } from "@/store/use-crm-store";
import { getFollowUpInfo } from "@/lib/follow-up/follow-up";
import { PIPELINE_STAGES, STAGE_MAP, TONE_DOT } from "@/lib/constants";
import { formatCompactCurrency, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead, PipelineStage } from "@/lib/types";

function CardBody({ lead, currency }: { lead: Lead; currency: string }) {
  const info = getFollowUpInfo(lead);
  const followTone =
    info.state === "overdue"
      ? "text-destructive"
      : info.state === "due_today"
        ? "text-amber-400"
        : "text-muted-foreground";

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <LeadAvatar name={lead.fullName} className="size-7" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">
              {lead.fullName || "Unnamed"}
            </p>
            <p className="text-muted-foreground truncate text-xs">{lead.company}</p>
          </div>
        </div>
        <ScorePill score={lead.score} />
      </div>
      <div className="flex items-center justify-between text-xs">
        {lead.dealValue ? (
          <span className="text-muted-foreground font-medium">
            {formatCompactCurrency(lead.dealValue, currency)}
          </span>
        ) : (
          <span />
        )}
        {info.state !== "none" && (
          <span className={cn("font-medium", followTone)}>
            {formatRelative(info.date)}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ lead, currency }: { lead: Lead; currency: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "group bg-card relative rounded-lg border p-3 shadow-sm transition-shadow",
        isDragging && "opacity-40",
      )}
    >
      {/* Drag handle covers the card body */}
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing"
      >
        <CardBody lead={lead} currency={currency} />
      </div>
      <Link
        href={`/leads/${lead.id}`}
        onPointerDown={(e) => e.stopPropagation()}
        className="text-muted-foreground hover:text-foreground hover:bg-accent absolute top-2 right-2 flex size-6 items-center justify-center rounded-md opacity-0 transition group-hover:opacity-100"
        aria-label="Open lead"
      >
        <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  );
}

function KanbanColumn({
  stage,
  leads,
  currency,
}: {
  stage: (typeof PIPELINE_STAGES)[number];
  leads: Lead[];
  currency: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const value = leads.reduce((sum, l) => sum + (l.dealValue ?? 0), 0);

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={cn("size-2 rounded-full", TONE_DOT[stage.tone])} />
        <span className="text-sm font-medium">{stage.label}</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {leads.length}
        </span>
        {value > 0 && (
          <span className="text-muted-foreground ml-auto text-xs">
            {formatCompactCurrency(value, currency)}
          </span>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "bg-muted/30 flex-1 space-y-2 rounded-xl border border-transparent p-2 transition-colors",
          isOver && "border-primary/40 bg-primary/5",
        )}
      >
        {leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} currency={currency} />
        ))}
        {leads.length === 0 && (
          <div className="text-muted-foreground/50 flex h-20 items-center justify-center rounded-lg border border-dashed text-xs">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const leads = useCrmStore((s) => s.leads);
  const updateLeadStatus = useCrmStore((s) => s.updateLeadStatus);
  const currency = useCrmStore((s) => s.settings.currency);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byStage = React.useMemo(() => {
    const map = Object.fromEntries(
      PIPELINE_STAGES.map((s) => [s.id, [] as Lead[]]),
    ) as Record<PipelineStage, Lead[]>;
    for (const lead of leads) map[lead.status]?.push(lead);
    return map;
  }, [leads]);

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const overId = event.over?.id as PipelineStage | undefined;
    if (!overId) return;
    const lead = leads.find((l) => l.id === event.active.id);
    if (lead && lead.status !== overId) {
      void updateLeadStatus(lead.id, overId);
      toast.success(`${lead.fullName} → ${STAGE_MAP[overId].label}`);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={byStage[stage.id]}
            currency={currency}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? (
          <div className="bg-card w-72 rotate-2 rounded-lg border p-3 shadow-lg">
            <CardBody lead={activeLead} currency={currency} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
