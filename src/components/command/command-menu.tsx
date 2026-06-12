"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Download, Moon, Plus, Sun, Upload } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { LeadAvatar } from "@/components/shared/lead-avatar";
import { ScorePill } from "@/components/leads/lead-badges";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { ImportDialog } from "@/components/leads/import-dialog";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { useCommandMenu } from "@/store/use-command-menu";
import { useCrmStore } from "@/store/use-crm-store";
import { exportLeadsCsv } from "@/lib/csv/csv";
import type { Lead } from "@/lib/types";

function matches(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query.toLowerCase().trim());
}

/**
 * Global ⌘K command palette — Linear-style. Navigation, quick actions and
 * instant lead search from anywhere in the app.
 */
export function CommandMenu() {
  const router = useRouter();
  const { open, setOpen, toggle } = useCommandMenu();
  const { resolvedTheme, setTheme } = useTheme();
  const leads = useCrmStore((s) => s.leads);

  const [query, setQuery] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  // ⌘K / Ctrl+K
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const leadResults: Lead[] = React.useMemo(() => {
    if (!query.trim()) {
      return [...leads].sort((a, b) => b.score - a.score).slice(0, 5);
    }
    return leads
      .filter((l) =>
        matches(`${l.fullName} ${l.company} ${l.email ?? ""} ${l.role}`, query),
      )
      .slice(0, 8);
  }, [leads, query]);

  const navResults = NAV_ITEMS.filter(
    (item) => !query.trim() || matches(item.title, query),
  );

  const actions = [
    {
      id: "add-lead",
      label: "Add new lead",
      icon: Plus,
      run: () => setAddOpen(true),
    },
    {
      id: "import",
      label: "Import leads from CSV",
      icon: Upload,
      run: () => setImportOpen(true),
    },
    {
      id: "export",
      label: "Export all leads to CSV",
      icon: Download,
      run: () => exportLeadsCsv(leads),
    },
    {
      id: "theme",
      label: `Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`,
      icon: resolvedTheme === "light" ? Moon : Sun,
      run: () => setTheme(resolvedTheme === "light" ? "dark" : "light"),
    },
  ].filter((a) => !query.trim() || matches(a.label, query));

  function pick(run: () => void) {
    setOpen(false);
    // Let the dialog close before any navigation/dialog-open for smoothness.
    setTimeout(run, 10);
  }

  const empty =
    leadResults.length === 0 && navResults.length === 0 && actions.length === 0;

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Search leads, pages, actions…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {empty && <CommandEmpty>No results found.</CommandEmpty>}

          {leadResults.length > 0 && (
            <CommandGroup heading={query.trim() ? "Leads" : "Top leads"}>
              {leadResults.map((lead) => (
                <CommandItem
                  key={lead.id}
                  value={`lead-${lead.id}`}
                  onSelect={() => pick(() => router.push(`/leads/${lead.id}`))}
                >
                  <LeadAvatar name={lead.fullName} className="size-6" />
                  <span className="truncate">{lead.fullName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {lead.company}
                  </span>
                  <span className="ml-auto">
                    <ScorePill score={lead.score} />
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {navResults.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Go to">
                {navResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.href}
                      value={`nav-${item.href}`}
                      onSelect={() => pick(() => router.push(item.href))}
                    >
                      <Icon />
                      {item.title}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}

          {actions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Actions">
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <CommandItem
                      key={action.id}
                      value={`action-${action.id}`}
                      onSelect={() => pick(action.run)}
                    >
                      <Icon />
                      {action.label}
                      {action.id === "add-lead" && (
                        <CommandShortcut>N</CommandShortcut>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>

      <LeadFormDialog open={addOpen} onOpenChange={setAddOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
