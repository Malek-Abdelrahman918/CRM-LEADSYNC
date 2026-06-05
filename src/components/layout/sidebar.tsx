"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NAV_ITEMS } from "./nav-config";

function Phase2Card() {
  return (
    <div className="border-primary/20 from-primary/10 rounded-lg border bg-gradient-to-br to-transparent p-3">
      <div className="flex items-center gap-2 text-xs font-medium">
        <Sparkles className="text-primary size-3.5" />
        Phase 2 ready
      </div>
      <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
        Apollo enrichment, AI drafting & n8n outreach plug in without a rewrite.
      </p>
    </div>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <div className="px-2 py-3">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Phase2Card />
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="bg-sidebar sticky top-0 hidden h-dvh w-64 shrink-0 border-r lg:block">
      <SidebarContent />
    </aside>
  );
}
