"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Clock, LogOut, Menu, Search, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { SidebarContent } from "./sidebar";
import { AddLeadButton } from "@/components/leads/add-lead-button";
import { LeadAvatar } from "@/components/shared/lead-avatar";
import { useCrmStore } from "@/store/use-crm-store";
import { useCommandMenu } from "@/store/use-command-menu";
import { categorizeFollowUps } from "@/lib/follow-up/follow-up";
import { formatRelative } from "@/lib/format";
import { APP_CONFIG } from "@/lib/config/app-config";
import { useSession, signOut } from "@/lib/supabase/use-session";
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

/** ⌘K trigger — replaces a traditional search box. */
function CommandTrigger() {
  const setOpen = useCommandMenu((s) => s.setOpen);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border-input text-muted-foreground hover:bg-accent hover:text-foreground hidden h-9 w-full max-w-xs cursor-pointer items-center gap-2 rounded-md border bg-transparent px-3 text-sm shadow-xs transition-colors sm:flex"
      >
        <Search className="size-4" />
        Search leads, actions…
        <kbd className="bg-muted text-muted-foreground pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium select-none">
          ⌘K
        </kbd>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground sm:hidden"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
      </Button>
    </>
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

/** Account menu — only rendered on the Supabase backend with a session. */
function UserMenu() {
  const session = useSession();
  if (APP_CONFIG.storage.backend !== "supabase" || !session) return null;

  const email = session.user.email ?? "Account";
  const initial = email[0]?.toUpperCase() ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <User className="size-4" />
          <span className="truncate">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  return (
    <header className="bg-background/70 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4 backdrop-blur sm:px-6">
      <MobileNav />
      <CommandTrigger />
      <div className="ml-auto flex items-center gap-1">
        <FollowUpBell />
        <ThemeToggle />
        <UserMenu />
        <AddLeadButton className="ml-1 hidden sm:inline-flex" />
        <AddLeadButton className="ml-1 sm:hidden" iconOnly />
      </div>
    </header>
  );
}
