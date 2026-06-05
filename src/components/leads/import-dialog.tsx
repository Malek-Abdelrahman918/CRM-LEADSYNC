"use client";

import * as React from "react";
import { toast } from "sonner";
import { FileSpreadsheet, UploadCloud } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCrmStore } from "@/store/use-crm-store";
import {
  autoDetectMapping,
  parseCsvFile,
  previewLeadInputs,
  rowsToLeadInputs,
  TARGET_FIELDS,
  type ColumnMapping,
  type ParsedCsv,
  type TargetKey,
} from "@/lib/csv/csv";
import { cn } from "@/lib/utils";

function FileDrop({ onFile }: { onFile: (file: File) => void }) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "hover:bg-accent/50",
      )}
    >
      <div className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full">
        <UploadCloud className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Drop your CSV here, or click to browse</p>
        <p className="text-muted-foreground text-xs">
          Works with Apollo exports — Name, Company, Email, Title, LinkedIn, Industry, Location.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,application/vnd.ms-excel,text/plain"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const importLeads = useCrmStore((s) => s.importLeads);
  const [parsed, setParsed] = React.useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = React.useState<ColumnMapping>({});
  const [fileName, setFileName] = React.useState("");
  const [importing, setImporting] = React.useState(false);

  function reset() {
    setParsed(null);
    setMapping({});
    setFileName("");
  }

  async function handleFile(file: File) {
    try {
      const result = await parseCsvFile(file);
      if (result.headers.length === 0) {
        toast.error("No columns found in that file");
        return;
      }
      setParsed(result);
      setMapping(autoDetectMapping(result.headers));
      setFileName(file.name);
    } catch {
      toast.error("Could not parse that CSV file");
    }
  }

  const preview = React.useMemo(
    () => (parsed ? previewLeadInputs(parsed.rows, mapping, 4) : []),
    [parsed, mapping],
  );
  const validCount = React.useMemo(
    () => (parsed ? rowsToLeadInputs(parsed.rows, mapping).length : 0),
    [parsed, mapping],
  );

  async function handleImport() {
    if (!parsed) return;
    setImporting(true);
    try {
      const inputs = rowsToLeadInputs(parsed.rows, mapping);
      if (inputs.length === 0) {
        toast.error("Nothing to import — check your column mapping");
        return;
      }
      const count = await importLeads(inputs, "CSV import");
      toast.success(`Imported ${count} lead${count === 1 ? "" : "s"}`);
      onOpenChange(false);
      reset();
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import leads from CSV</DialogTitle>
          <DialogDescription>
            Upload an export and map each column to a lead field. Detected columns
            are pre-mapped for you.
          </DialogDescription>
        </DialogHeader>

        {!parsed ? (
          <FileDrop onFile={handleFile} />
        ) : (
          <div className="space-y-5">
            <div className="bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <FileSpreadsheet className="text-muted-foreground size-4" />
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground">
                · {parsed.rows.length} rows
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={reset}
              >
                Choose another file
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Column mapping
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {parsed.headers.map((header) => (
                  <div
                    key={header}
                    className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
                  >
                    <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
                      {header}
                    </span>
                    <Select
                      value={mapping[header] ?? "ignore"}
                      onValueChange={(v) =>
                        setMapping((m) => ({ ...m, [header]: v as TargetKey }))
                      }
                    >
                      <SelectTrigger size="sm" className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ignore">Ignore</SelectItem>
                        {TARGET_FIELDS.map((f) => (
                          <SelectItem key={f.key} value={f.key}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {preview.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Preview
                </p>
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground text-xs">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Name</th>
                        <th className="px-3 py-2 text-left font-medium">Company</th>
                        <th className="px-3 py-2 text-left font-medium">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((lead, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">
                            {`${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "—"}
                          </td>
                          <td className="px-3 py-2">{lead.company || "—"}</td>
                          <td className="text-muted-foreground px-3 py-2">
                            {lead.email || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {validCount === 0 && (
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                No rows are ready to import yet. Using the dropdowns above, map a{" "}
                <strong>First name</strong> / <strong>Last name</strong> (or a single{" "}
                <strong>Full name</strong>) column, plus <strong>Company</strong> or{" "}
                <strong>Email</strong>.
              </div>
            )}

            <DialogFooter className="items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                <span className="text-foreground font-medium">{validCount}</span>{" "}
                lead{validCount === 1 ? "" : "s"} ready to import
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={importing || validCount === 0}>
                  Import {validCount > 0 ? validCount : ""}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
