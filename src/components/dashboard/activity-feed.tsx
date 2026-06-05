import Link from "next/link";

import { ActivityIcon } from "@/components/shared/activity-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Activity as ActivityIconLucide } from "lucide-react";
import type { Activity, Lead } from "@/lib/types";

export function ActivityFeed({
  activities,
  leadsById,
  limit = 8,
}: {
  activities: Activity[];
  leadsById: Record<string, Lead>;
  limit?: number;
}) {
  const items = activities.slice(0, limit);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ActivityIconLucide}
        title="No activity yet"
        description="Lead activity will appear here as you work your pipeline."
        className="border-0 py-8"
      />
    );
  }

  return (
    <ul>
      {items.map((activity, i) => {
        const lead = leadsById[activity.leadId];
        const isLast = i === items.length - 1;
        return (
          <li key={activity.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <ActivityIcon type={activity.type} />
              {!isLast && <span className="bg-border my-1 w-px flex-1" />}
            </div>
            <div className={cn("flex-1", !isLast && "pb-4")}>
              <p className="text-sm leading-snug">
                <span className="font-medium">{activity.title}</span>
                {lead && (
                  <>
                    {" · "}
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-primary hover:underline"
                    >
                      {lead.fullName}
                    </Link>
                  </>
                )}
              </p>
              {activity.description && (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {activity.description}
                </p>
              )}
              <p className="text-muted-foreground mt-0.5 text-xs">
                {formatRelative(activity.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
