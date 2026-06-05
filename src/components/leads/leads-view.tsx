"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  Globe,
  Link2,
  MoreHorizontal,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadAvatar } from "@/components/shared/lead-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  LeadStatusBadge,
  ScorePill,
  SourceBadge,
} from "@/components/leads/lead-badges";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { ImportDialog } from "@/components/leads/import-dialog";
import { AddLeadButton } from "@/components/leads/add-lead-button";
import { useCrmStore } from "@/store/use-crm-store";
import { getFollowUpInfo } from "@/lib/follow-up/follow-up";
import { exportLeadsCsv } from "@/lib/csv/csv";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PAGE_SIZE,
  INDUSTRIES,
  INDUSTRY_MAP,
  LEAD_SOURCES,
  PAGE_SIZE_OPTIONS,
  PIPELINE_STAGES,
} from "@/lib/constants";
import type {
  Industry,
  Lead,
  LeadSortField,
  LeadSource,
  PipelineStage,
  SortDirection,
} from "@/lib/types";

const TEXT_SORT_FIELDS: LeadSortField[] = ["fullName", "company", "status", "source"];

function compareLeads(a: Lead, b: Lead, field: LeadSortField): number {
  switch (field) {
    case "score":
      return a.score - b.score;
    case "status":
      return (
        PIPELINE_STAGES.findIndex((s) => s.id === a.status) -
        PIPELINE_STAGES.findIndex((s) => s.id === b.status)
      );
    case "createdAt":
    case "lastContactedAt":
    case "nextFollowUpAt": {
      const av = a[field] ?? "";
      const bv = b[field] ?? "";
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return av.localeCompare(bv);
    }
    default:
      return (a[field] ?? "").localeCompare(b[field] ?? "");
  }
}

export function LeadsView() {
  const searchParams = useSearchParams();
  const leads = useCrmStore((s) => s.leads);
  const deleteLead = useCrmStore((s) => s.deleteLead);
  const deleteLeads = useCrmStore((s) => s.deleteLeads);
  const bulkUpdateStatus = useCrmStore((s) => s.bulkUpdateStatus);

  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = React.useState<PipelineStage[]>([]);
  const [sourceFilter, setSourceFilter] = React.useState<LeadSource[]>([]);
  const [industryFilter, setIndustryFilter] = React.useState<Industry[]>([]);
  const [scoreMin, setScoreMin] = React.useState(0);

  const [sortField, setSortField] = React.useState<LeadSortField>("score");
  const [sortDir, setSortDir] = React.useState<SortDirection>("desc");

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [editingLead, setEditingLead] = React.useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = React.useState<Lead | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  React.useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  // Reset to first page whenever the result set changes shape.
  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sourceFilter, industryFilter, scoreMin, pageSize]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (q) {
        const haystack =
          `${lead.fullName} ${lead.company} ${lead.email ?? ""} ${lead.role}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (statusFilter.length && !statusFilter.includes(lead.status)) return false;
      if (sourceFilter.length && !sourceFilter.includes(lead.source)) return false;
      if (industryFilter.length && (!lead.industry || !industryFilter.includes(lead.industry)))
        return false;
      if (lead.score < scoreMin) return false;
      return true;
    });
  }, [leads, search, statusFilter, sourceFilter, industryFilter, scoreMin]);

  const sorted = React.useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => compareLeads(a, b, sortField) * dir);
  }, [filtered, sortField, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageLeads = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const activeFilters =
    statusFilter.length +
    sourceFilter.length +
    industryFilter.length +
    (scoreMin > 0 ? 1 : 0);

  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));
  const someSelected = filtered.some((l) => selected.has(l.id));
  const selectedLeads = leads.filter((l) => selected.has(l.id));

  function toggleSort(field: LeadSortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(TEXT_SORT_FIELDS.includes(field) ? "asc" : "desc");
    }
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      if (filtered.every((l) => prev.has(l.id))) {
        const next = new Set(prev);
        filtered.forEach((l) => next.delete(l.id));
        return next;
      }
      return new Set([...prev, ...filtered.map((l) => l.id)]);
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setStatusFilter([]);
    setSourceFilter([]);
    setIndustryFilter([]);
    setScoreMin(0);
  }

  async function handleBulkStatus(status: PipelineStage) {
    const ids = [...selected];
    await bulkUpdateStatus(ids, status);
    toast.success(`Moved ${ids.length} lead${ids.length === 1 ? "" : "s"}`);
    setSelected(new Set());
  }

  if (leads.length === 0) {
    return (
      <>
        <EmptyState
          icon={Users}
          title="No leads yet"
          description="Add your first lead or import an Apollo CSV export to get started."
          action={
            <div className="flex gap-2">
              <AddLeadButton />
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="size-4" /> Import CSV
              </Button>
            </div>
          }
        />
        <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, email…"
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterPopover
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sourceFilter={sourceFilter}
            setSourceFilter={setSourceFilter}
            industryFilter={industryFilter}
            setIndustryFilter={setIndustryFilter}
            scoreMin={scoreMin}
            setScoreMin={setScoreMin}
            activeFilters={activeFilters}
            onClear={clearFilters}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportLeadsCsv(sorted)}
          >
            <Download className="size-4" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" /> Import
          </Button>
          <AddLeadButton size="sm" />
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-accent/50 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Separator orientation="vertical" className="h-4" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Set status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PIPELINE_STAGES.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => handleBulkStatus(s.id)}
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportLeadsCsv(selectedLeads, "leadsync-selected.csv")}
          >
            <Download className="size-4" /> Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setSelected(new Set())}
          >
            <X className="size-4" /> Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={
                      allSelected ? true : someSelected ? "indeterminate" : false
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <SortHeader label="Score" field="score" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Name" field="fullName" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Company" field="company" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <Th>Role</Th>
                <Th>Email</Th>
                <Th className="text-center">Links</Th>
                <Th>Industry</Th>
                <Th>Location</Th>
                <Th>Size</Th>
                <SortHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Source" field="source" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Date Added" field="createdAt" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Last Contacted" field="lastContactedAt" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Next Follow Up" field="nextFollowUpAt" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="w-10 px-2" />
              </tr>
            </thead>
            <tbody>
              {pageLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={cn(
                    "hover:bg-accent/40 border-b transition-colors last:border-0",
                    selected.has(lead.id) && "bg-accent/30",
                  )}
                >
                  <td className="px-3 py-2.5">
                    <Checkbox
                      checked={selected.has(lead.id)}
                      onCheckedChange={() => toggleSelect(lead.id)}
                      aria-label={`Select ${lead.fullName}`}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <ScorePill score={lead.score} />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex items-center gap-2.5"
                    >
                      <LeadAvatar name={lead.fullName} className="size-8" />
                      <span className="font-medium whitespace-nowrap hover:underline">
                        {lead.fullName || "Unnamed"}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{lead.company}</td>
                  <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                    {lead.role || "—"}
                  </td>
                  <td className="text-muted-foreground max-w-[200px] truncate px-3 py-2.5">
                    {lead.email || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <IconLink href={lead.linkedinUrl} icon={Link2} label="LinkedIn" />
                      <IconLink href={lead.companyWebsite} icon={Globe} label="Website" />
                    </div>
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                    {lead.industry ? INDUSTRY_MAP[lead.industry] : "—"}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                    {lead.location || "—"}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                    {lead.companySize ?? "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <SourceBadge source={lead.source} />
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                    {formatDate(lead.createdAt)}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                    {formatDate(lead.lastContactedAt)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <FollowUpCell lead={lead} />
                  </td>
                  <td className="px-2 py-2.5">
                    <RowMenu
                      lead={lead}
                      onEdit={() => setEditingLead(lead)}
                      onDelete={() => setDeletingLead(lead)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sorted.length === 0 && (
          <div className="text-muted-foreground p-10 text-center text-sm">
            No leads match your filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger size="sm" className="w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {sorted.length === 0
              ? "0 of 0"
              : `${(currentPage - 1) * pageSize + 1}–${Math.min(
                  currentPage * pageSize,
                  sorted.length,
                )} of ${sorted.length}`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-muted-foreground px-1 tabular-nums">
              {currentPage} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage >= pageCount}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <LeadFormDialog
        open={!!editingLead}
        onOpenChange={(o) => !o && setEditingLead(null)}
        lead={editingLead ?? undefined}
      />
      <ConfirmDialog
        open={!!deletingLead}
        onOpenChange={(o) => !o && setDeletingLead(null)}
        title="Delete lead?"
        description={`This permanently removes ${deletingLead?.fullName} and their activity. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deletingLead) {
            await deleteLead(deletingLead.id);
            toast.success("Lead deleted");
          }
        }}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selected.size} leads?`}
        description="This permanently removes the selected leads and their activity."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          const ids = [...selected];
          await deleteLeads(ids);
          toast.success(`Deleted ${ids.length} leads`);
          setSelected(new Set());
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "text-muted-foreground px-3 py-2.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {children}
    </th>
  );
}

function SortHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  label: string;
  field: LeadSortField;
  sortField: LeadSortField;
  sortDir: SortDirection;
  onSort: (field: LeadSortField) => void;
}) {
  const active = sortField === field;
  return (
    <th className="px-3 py-2.5">
      <button
        onClick={() => onSort(field)}
        className={cn(
          "text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap transition-colors",
          active && "text-foreground",
        )}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ArrowDown className="size-3.5" />
          )
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-40" />
        )}
      </button>
    </th>
  );
}

function IconLink({
  href,
  icon: Icon,
  label,
}: {
  href?: string;
  icon: typeof Globe;
  label: string;
}) {
  if (!href) return <span className="text-muted-foreground/40 text-xs">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-7 items-center justify-center rounded-md transition-colors"
    >
      <Icon className="size-4" />
    </a>
  );
}

function FollowUpCell({ lead }: { lead: Lead }) {
  const info = getFollowUpInfo(lead);
  if (info.state === "none") {
    return <span className="text-muted-foreground/60">—</span>;
  }
  const tone =
    info.state === "overdue"
      ? "text-destructive"
      : info.state === "due_today"
        ? "text-amber-400"
        : "text-muted-foreground";
  return (
    <span className={cn("font-medium", tone)}>{formatDate(info.date)}</span>
  );
}

function RowMenu({
  lead,
  onEdit,
  onDelete,
}: {
  lead: Lead;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/leads/${lead.id}`}>View details</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilterPopover({
  statusFilter,
  setStatusFilter,
  sourceFilter,
  setSourceFilter,
  industryFilter,
  setIndustryFilter,
  scoreMin,
  setScoreMin,
  activeFilters,
  onClear,
}: {
  statusFilter: PipelineStage[];
  setStatusFilter: React.Dispatch<React.SetStateAction<PipelineStage[]>>;
  sourceFilter: LeadSource[];
  setSourceFilter: React.Dispatch<React.SetStateAction<LeadSource[]>>;
  industryFilter: Industry[];
  setIndustryFilter: React.Dispatch<React.SetStateAction<Industry[]>>;
  scoreMin: number;
  setScoreMin: (n: number) => void;
  activeFilters: number;
  onClear: () => void;
}) {
  function toggle<T>(value: T, setter: React.Dispatch<React.SetStateAction<T[]>>) {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="size-4" /> Filters
          {activeFilters > 0 && (
            <Badge className="ml-1 size-5 rounded-full px-0 tabular-nums">
              {activeFilters}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[70vh] w-72 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Filters</p>
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={onClear}
              >
                Clear all
              </Button>
            )}
          </div>

          <FilterSection title="Minimum score">
            <div className="flex gap-1.5">
              {[
                { label: "All", value: 0 },
                { label: "40+", value: 40 },
                { label: "70+", value: 70 },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant={scoreMin === opt.value ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setScoreMin(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Status">
            {PIPELINE_STAGES.map((s) => (
              <CheckRow
                key={s.id}
                label={s.label}
                checked={statusFilter.includes(s.id)}
                onChange={() => toggle(s.id, setStatusFilter)}
              />
            ))}
          </FilterSection>

          <FilterSection title="Source">
            {LEAD_SOURCES.map((s) => (
              <CheckRow
                key={s.value}
                label={s.label}
                checked={sourceFilter.includes(s.value)}
                onChange={() => toggle(s.value, setSourceFilter)}
              />
            ))}
          </FilterSection>

          <FilterSection title="Industry">
            {INDUSTRIES.map((s) => (
              <CheckRow
                key={s.value}
                label={s.label}
                checked={industryFilter.includes(s.value)}
                onChange={() => toggle(s.value, setIndustryFilter)}
              />
            ))}
          </FilterSection>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium">{title}</p>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}
