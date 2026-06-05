import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  GitBranch,
  Inbox,
  ListChecks,
  Pencil,
  Phone,
  Send,
  Sparkles,
  StickyNote,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { TONE_BADGE, type Tone } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/lib/types";

export const ACTIVITY_META: Record<ActivityType, { icon: LucideIcon; tone: Tone }> = {
  created: { icon: UserPlus, tone: "violet" },
  imported: { icon: Download, tone: "blue" },
  status_change: { icon: GitBranch, tone: "indigo" },
  note_added: { icon: StickyNote, tone: "amber" },
  email_sent: { icon: Send, tone: "blue" },
  email_received: { icon: Inbox, tone: "cyan" },
  call: { icon: Phone, tone: "emerald" },
  meeting: { icon: CalendarCheck, tone: "indigo" },
  follow_up_scheduled: { icon: Clock, tone: "amber" },
  task_created: { icon: ListChecks, tone: "slate" },
  task_completed: { icon: CheckCircle2, tone: "emerald" },
  enriched: { icon: Sparkles, tone: "fuchsia" },
  field_updated: { icon: Pencil, tone: "slate" },
};

export function ActivityIcon({
  type,
  className,
}: {
  type: ActivityType;
  className?: string;
}) {
  const meta = ACTIVITY_META[type] ?? ACTIVITY_META.field_updated;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border",
        TONE_BADGE[meta.tone],
        className,
      )}
    >
      <Icon className="size-3.5" />
    </span>
  );
}
