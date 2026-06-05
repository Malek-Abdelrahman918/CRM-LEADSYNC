"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, Clock, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { SidebarContent } from "./sidebar";
import { AddLeadButton } from "@/components/leads/add-lead-button";
import { LeadAvatar } from "@/components/shared/lead-avatar";
import { useCrmStore } from "@/store/use-crm-store";
import { categorizeFollowUps } from "@/lib/follow-up/follow-up";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

function MobileNav() {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-sidebar w-64 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/leads?search=${encodeURIComponent(q.trim())}`);
      }}
      className="relative hidden w-full max-w-xs sm:block"
    >
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search leads…"
        className="h-9 pl-8"
      />
    </form>
  );
}

function FollowUpBell() {
  const leads = useCrmStore((s) => s.leads);
  const { overdue, dueToday } = React.useMemo(
    () => categorizeFollowUps(leads),
    [leads],
  );
  const items = [...overdue, ...dueToday];
  const count = items.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground relative"
          aria-label="Follow-up alerts"
        >
          <Bell className="size-4" />
          {count > 0 && (
            <span className="bg-destructive absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full text-[9px] font-semibold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">Follow-ups</p>
          <p className="text-muted-foreground text-xs">
            {count > 0
              ? `${overdue.length} overdue · ${dueToday.length} due today`
              : "You're all caught up 🎉"}
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">
              No follow-ups need attention.
            </p>
          )}
          {items.map((lead) => {
            const isOverdue = overdue.includes(lead);
            return (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="hover:bg-accent flex items-center gap-3 px-4 py-2.5 transition-colors"
              >
                <LeadAvatar name={lead.fullName} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{lead.fullName}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {lead.company}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    isOverdue ? "text-destructive" : "text-amber-400",
                  )}
                >
                  {isOverdue ? (
                    <AlertTriangle className="size-3" />
                  ) : (
                    <Clock className="size-3" />
                  )}
                  {formatRelative(lead.nextFollowUpAt)}
                </span>
              </Link>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function Topbar() {
  return (
    <header className="bg-background/70 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4 backdrop-blur sm:px-6">
      <MobileNav />
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1">
        <FollowUpBell />
        <ThemeToggle />
        <AddLeadButton className="ml-1 hidden sm:inline-flex" />
        <AddLeadButton className="ml-1 sm:hidden" iconOnly />
      </div>
    </header>
  );
}
