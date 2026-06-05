"use client";

import { toast } from "sonner";
import { CalendarCheck, History, Phone, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActivityIcon } from "@/components/shared/activity-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { useCrmStore } from "@/store/use-crm-store";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Activity, ActivityType } from "@/lib/types";

const QUICK: { type: ActivityType; label: string; icon: typeof Send }[] = [
  { type: "email_sent", label: "Email", icon: Send },
  { type: "call", label: "Call", icon: Phone },
  { type: "meeting", label: "Meeting", icon: CalendarCheck },
];

export function LeadActivityTimeline({
  leadId,
  activities,
}: {
  leadId: string;
  activities: Activity[];
}) {
  const logTouchpoint = useCrmStore((s) => s.logTouchpoint);

  async function log(type: ActivityType, label: string) {
    await logTouchpoint({ leadId, type, title: `Logged ${label.toLowerCase()}` });
    toast.success(`${label} logged`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => {
          const Icon = q.icon;
          return (
            <Button
              key={q.type}
              variant="outline"
              size="sm"
              onClick={() => log(q.type, q.label)}
            >
              <Icon className="size-4" /> {q.label}
            </Button>
          );
        })}
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Log your first touchpoint with the buttons above."
          className="border-0 py-8"
        />
      ) : (
        <ul>
          {activities.map((activity, i) => {
            const isLast = i === activities.length - 1;
            return (
              <li key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <ActivityIcon type={activity.type} />
                  {!isLast && <span className="bg-border my-1 w-px flex-1" />}
                </div>
                <div className={cn("flex-1", !isLast && "pb-4")}>
                  <p className="text-sm font-medium">{activity.title}</p>
                  {activity.description && (
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {activity.description}
                    </p>
                  )}
                  <p
                    className="text-muted-foreground mt-0.5 text-xs"
                    title={formatDateTime(activity.createdAt)}
                  >
                    {formatRelative(activity.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
