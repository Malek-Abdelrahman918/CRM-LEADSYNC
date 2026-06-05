"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadAvatar } from "@/components/shared/lead-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LeadStatusBadge, ScorePill } from "@/components/leads/lead-badges";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { LeadScoreCard } from "./lead-score-card";
import { ContactInfoCard, CompanyInfoCard } from "./lead-info-cards";
import { LeadActivityTimeline } from "./lead-activity-timeline";
import { LeadNotes } from "./lead-notes";
import { LeadTasks } from "./lead-tasks";
import { LeadStatusCard } from "./lead-status-card";
import { useCrmStore } from "@/store/use-crm-store";

export function LeadDetailView({ id }: { id: string }) {
  const router = useRouter();
  const lead = useCrmStore((s) => s.leads.find((l) => l.id === id));
  const activities = useCrmStore((s) => s.activities);
  const notes = useCrmStore((s) => s.notes);
  const tasks = useCrmStore((s) => s.tasks);
  const deleteLead = useCrmStore((s) => s.deleteLead);

  const leadActivities = React.useMemo(
    () => activities.filter((a) => a.leadId === id),
    [activities, id],
  );
  const leadNotes = React.useMemo(
    () => notes.filter((n) => n.leadId === id),
    [notes, id],
  );
  const leadTasks = React.useMemo(
    () => tasks.filter((t) => t.leadId === id),
    [tasks, id],
  );
  const openTasks = leadTasks.filter((t) => !t.completed).length;

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  if (!lead) {
    return (
      <EmptyState
        icon={Users}
        title="Lead not found"
        description="This lead may have been deleted or never existed."
        action={
          <Button asChild>
            <Link href="/leads">Back to leads</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground -ml-2 mb-2"
        >
          <Link href="/leads">
            <ArrowLeft className="size-4" /> Back to leads
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <LeadAvatar name={lead.fullName} className="size-14 text-base" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">
                  {lead.fullName || "Unnamed lead"}
                </h1>
                <ScorePill score={lead.score} />
              </div>
              <p className="text-muted-foreground text-sm">
                {[lead.role, lead.company].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-2">
                <LeadStatusBadge status={lead.status} />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <Tabs defaultValue="activity">
                <TabsList>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="notes">
                    Notes{leadNotes.length ? ` (${leadNotes.length})` : ""}
                  </TabsTrigger>
                  <TabsTrigger value="tasks">
                    Tasks{openTasks ? ` (${openTasks})` : ""}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="activity" className="pt-4">
                  <LeadActivityTimeline leadId={id} activities={leadActivities} />
                </TabsContent>
                <TabsContent value="notes" className="pt-4">
                  <LeadNotes leadId={id} notes={leadNotes} />
                </TabsContent>
                <TabsContent value="tasks" className="pt-4">
                  <LeadTasks leadId={id} tasks={leadTasks} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <LeadScoreCard lead={lead} />
          <LeadStatusCard lead={lead} />
          <ContactInfoCard lead={lead} />
          <CompanyInfoCard lead={lead} />
        </div>
      </div>

      <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete lead?"
        description={`This permanently removes ${lead.fullName} and all related activity, notes and tasks.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deleteLead(lead.id);
          toast.success("Lead deleted");
          router.push("/leads");
        }}
      />
    </div>
  );
}
