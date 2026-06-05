import Link from "next/link";
import { AlertTriangle, CalendarCheck2, CalendarClock, Clock } from "lucide-react";

import { LeadAvatar } from "@/components/shared/lead-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { categorizeFollowUps } from "@/lib/follow-up/follow-up";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export function FollowUpPanel({
  leads,
  upcomingLimit = 5,
}: {
  leads: Lead[];
  upcomingLimit?: number;
}) {
  const { overdue, dueToday, upcoming } = categorizeFollowUps(leads);

  const groups = [
    {
      key: "overdue",
      label: "Overdue",
      icon: AlertTriangle,
      tone: "text-destructive",
      items: overdue,
    },
    {
      key: "today",
      label: "Due today",
      icon: Clock,
      tone: "text-amber-400",
      items: dueToday,
    },
    {
      key: "upcoming",
      label: "Upcoming",
      icon: CalendarClock,
      tone: "text-muted-foreground",
      items: upcoming.slice(0, upcomingLimit),
    },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck2}
        title="No follow-ups due"
        description="You are all caught up. Schedule follow-ups from any lead."
        className="border-0 py-8"
      />
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const GroupIcon = group.icon;
        return (
          <div key={group.key} className="space-y-1.5">
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium",
                group.tone,
              )}
            >
              <GroupIcon className="size-3.5" />
              {group.label}
              <span className="text-muted-foreground">({group.items.length})</span>
            </div>
            <div className="space-y-0.5">
              {group.items.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="hover:bg-accent -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <LeadAvatar name={lead.fullName} className="size-8" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{lead.fullName}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {lead.company}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-medium", group.tone)}>
                      {formatRelative(lead.nextFollowUpAt)}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {formatDate(lead.nextFollowUpAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
