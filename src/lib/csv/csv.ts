/**
 * CSV layer — Apollo-aware import (with column mapping) and table export.
 *
 * Import flow:
 *   parseCsvFile() → { headers, rows }  →  user maps columns  →
 *   rowsToLeadInputs(rows, mapping)     →  leadRepository.createMany()
 *
 * The mapping is column → target field; auto-detection pre-fills it from common
 * Apollo / LinkedIn export header names.
 */

import Papa from "papaparse";
import type {
  CompanySize,
  Industry,
  Lead,
  LeadSource,
  NewLeadInput,
  PipelineStage,
} from "@/lib/types";
import { downloadFile } from "@/lib/download";
import {
  COMPANY_SIZES,
  INDUSTRIES,
  LEAD_SOURCES,
  PIPELINE_STAGES,
  STAGE_MAP,
  SOURCE_MAP,
  INDUSTRY_MAP,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/*  Parsing                                                                    */
/* -------------------------------------------------------------------------- */

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsvText(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  return {
    headers: (result.meta.fields ?? []).filter(Boolean),
    rows: result.data,
  };
}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (result) =>
        resolve({
          headers: (result.meta.fields ?? []).filter(Boolean),
          rows: result.data,
        }),
      error: (err) => reject(err),
    });
  });
}

/* -------------------------------------------------------------------------- */
/*  Column mapping                                                             */
/* -------------------------------------------------------------------------- */

export type TargetKey =
  | "ignore"
  | "firstName"
  | "lastName"
  | "fullName"
  | "role"
  | "company"
  | "email"
  | "phone"
  | "linkedinUrl"
  | "companyWebsite"
  | "industry"
  | "companySize"
  | "location"
  | "status"
  | "source"
  | "tags";

export interface TargetField {
  key: TargetKey;
  label: string;
  aliases: string[];
}

/** Mapping targets + alias header names for auto-detection. */
export const TARGET_FIELDS: TargetField[] = [
  { key: "firstName", label: "First Name", aliases: ["first name", "firstname", "given name"] },
  { key: "lastName", label: "Last Name", aliases: ["last name", "lastname", "surname", "family name"] },
  { key: "fullName", label: "Full Name", aliases: ["name", "full name", "contact name", "lead name"] },
  { key: "role", label: "Role / Title", aliases: ["title", "job title", "role", "position", "headline"] },
  { key: "company", label: "Company", aliases: ["company", "company name", "organization", "employer", "account"] },
  { key: "email", label: "Email", aliases: ["email", "email address", "work email", "e-mail"] },
  { key: "phone", label: "Phone", aliases: ["phone", "mobile phone", "work direct phone", "corporate phone", "phone number"] },
  { key: "linkedinUrl", label: "LinkedIn", aliases: ["linkedin", "linkedin url", "person linkedin url", "linkedin profile"] },
  { key: "companyWebsite", label: "Website", aliases: ["website", "company website", "url", "domain"] },
  { key: "industry", label: "Industry", aliases: ["industry", "industries", "sector", "vertical"] },
  { key: "companySize", label: "Company Size", aliases: ["company size", "# employees", "employees", "headcount", "size"] },
  { key: "location", label: "Location", aliases: ["location", "city", "state", "country", "region", "address"] },
  { key: "status", label: "Status", aliases: ["status", "stage", "pipeline stage"] },
  { key: "source", label: "Source", aliases: ["source", "lead source"] },
  { key: "tags", label: "Tags", aliases: ["tags", "labels", "keywords"] },
];

export type ColumnMapping = Record<string, TargetKey>;

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[_\-.]/g, " ").replace(/\s+/g, " ").trim();
}

/** Pre-fill a mapping by matching CSV headers to target aliases. */
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<TargetKey>();

  for (const header of headers) {
    const norm = normalizeHeader(header);
    let match: TargetKey = "ignore";
    for (const field of TARGET_FIELDS) {
      if (used.has(field.key) && field.key !== "location") continue;
      if (field.aliases.includes(norm) || norm === field.key.toLowerCase()) {
        match = field.key;
        break;
      }
    }
    mapping[header] = match;
    if (match !== "ignore") used.add(match);
  }
  return mapping;
}

/* -------------------------------------------------------------------------- */
/*  Value normalisers                                                          */
/* -------------------------------------------------------------------------- */

export function normalizeIndustry(value?: string): Industry | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  const direct = INDUSTRIES.find(
    (i) => i.value === v || i.label.toLowerCase() === v,
  );
  if (direct) return direct.value;
  if (v.includes("real estate") || v.includes("property") || v.includes("realty")) return "real_estate";
  if (v.includes("construct")) return "construction";
  if (v.includes("hospitality") || v.includes("hotel") || v.includes("tourism")) return "hospitality";
  if (v.includes("financ") || v.includes("bank") || v.includes("invest")) return "finance";
  if (v.includes("health") || v.includes("medical") || v.includes("pharma")) return "healthcare";
  if (v.includes("tech") || v.includes("software") || v.includes("saas") || v.includes("it ")) return "technology";
  if (v.includes("retail") || v.includes("ecommerce") || v.includes("commerce")) return "retail";
  if (v.includes("consult")) return "consulting";
  if (v.includes("market") || v.includes("advertis") || v.includes("agency")) return "marketing";
  if (v.includes("manufactur") || v.includes("industrial")) return "manufacturing";
  if (v.includes("educat") || v.includes("school") || v.includes("universit")) return "education";
  if (v.includes("legal") || v.includes("law")) return "legal";
  return "other";
}

export function normalizeCompanySize(value?: string): CompanySize | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase().replace(/,/g, "");
  const direct = COMPANY_SIZES.find((s) => s.value === v);
  if (direct) return direct.value;

  // Range like "11-50" / "51 - 200"
  const range = v.match(/(\d+)\s*[-–to]+\s*(\d+)/);
  const single = v.match(/^(\d+)\+?$/);
  const n = range ? Number(range[2]) : single ? Number(single[1]) : NaN;
  if (Number.isNaN(n)) return undefined;

  if (n <= 10) return "1-10";
  if (n <= 50) return "11-50";
  if (n <= 200) return "51-200";
  if (n <= 500) return "201-500";
  if (n <= 1000) return "501-1000";
  if (n <= 5000) return "1001-5000";
  return "5000+";
}

export function normalizeStatus(value?: string): PipelineStage | undefined {
  if (!value) return undefined;
  const v = normalizeHeader(value);
  const byId = PIPELINE_STAGES.find((s) => s.id === v.replace(/ /g, "_"));
  if (byId) return byId.id;
  const byLabel = PIPELINE_STAGES.find((s) => s.label.toLowerCase() === v);
  return byLabel?.id;
}

export function normalizeSource(value?: string): LeadSource | undefined {
  if (!value) return undefined;
  const v = normalizeHeader(value).replace(/ /g, "_");
  const match = LEAD_SOURCES.find(
    (s) => s.value === v || s.label.toLowerCase() === normalizeHeader(value),
  );
  return match?.value;
}

/* -------------------------------------------------------------------------- */
/*  Row → Lead input                                                           */
/* -------------------------------------------------------------------------- */

/** Convert parsed rows into lead inputs using a column mapping. */
export function rowsToLeadInputs(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  defaults: { source?: LeadSource } = {},
): NewLeadInput[] {
  const entries = Object.entries(mapping).filter(([, t]) => t !== "ignore");

  return rows
    .map((row) => {
      // Gather values per target (supports multiple columns → one target).
      const collected: Partial<Record<TargetKey, string[]>> = {};
      for (const [col, target] of entries) {
        const raw = (row[col] ?? "").toString().trim();
        if (!raw) continue;
        (collected[target] ??= []).push(raw);
      }

      const first = (k: TargetKey) => collected[k]?.[0];
      const joined = (k: TargetKey) =>
        collected[k] ? Array.from(new Set(collected[k])).join(", ") : undefined;

      let firstName = first("firstName") ?? "";
      let lastName = first("lastName") ?? "";
      const fullName = first("fullName");
      if ((!firstName || !lastName) && fullName) {
        const parts = fullName.split(/\s+/);
        firstName = firstName || parts[0] || "";
        lastName = lastName || parts.slice(1).join(" ") || "";
      }

      const tags = collected.tags
        ? collected.tags.flatMap((t) => t.split(/[,;]/).map((s) => s.trim())).filter(Boolean)
        : undefined;

      const input: NewLeadInput = {
        firstName,
        lastName,
        company: first("company") ?? "",
        role: first("role") ?? "",
        email: first("email"),
        phone: first("phone"),
        linkedinUrl: first("linkedinUrl"),
        companyWebsite: first("companyWebsite"),
        industry: normalizeIndustry(first("industry")),
        companySize: normalizeCompanySize(first("companySize")),
        location: joined("location"),
        status: normalizeStatus(first("status")) ?? "new",
        source: normalizeSource(first("source")) ?? defaults.source ?? "csv_import",
        tags,
      };
      return input;
    })
    .filter((l) => l.firstName || l.lastName || l.company || l.email);
}

/** A small preview of how rows will import, for the mapping UI. */
export function previewLeadInputs(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  limit = 5,
): NewLeadInput[] {
  return rowsToLeadInputs(rows.slice(0, limit), mapping);
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                     */
/* -------------------------------------------------------------------------- */

const EXPORT_COLUMNS: { header: string; get: (l: Lead) => string | number }[] = [
  { header: "Lead Score", get: (l) => l.score },
  { header: "Name", get: (l) => l.fullName },
  { header: "Company", get: (l) => l.company },
  { header: "Role", get: (l) => l.role },
  { header: "Email", get: (l) => l.email ?? "" },
  { header: "LinkedIn", get: (l) => l.linkedinUrl ?? "" },
  { header: "Website", get: (l) => l.companyWebsite ?? "" },
  { header: "Industry", get: (l) => (l.industry ? INDUSTRY_MAP[l.industry] : "") },
  { header: "Location", get: (l) => l.location ?? "" },
  { header: "Company Size", get: (l) => l.companySize ?? "" },
  { header: "Status", get: (l) => STAGE_MAP[l.status].label },
  { header: "Source", get: (l) => SOURCE_MAP[l.source] },
  { header: "Date Added", get: (l) => l.createdAt },
  { header: "Last Contacted", get: (l) => l.lastContactedAt ?? "" },
  { header: "Next Follow Up", get: (l) => l.nextFollowUpAt ?? "" },
];

export function leadsToCsv(leads: Lead[]): string {
  const data = leads.map((l) => {
    const row: Record<string, string | number> = {};
    for (const col of EXPORT_COLUMNS) row[col.header] = col.get(l);
    return row;
  });
  return Papa.unparse({
    fields: EXPORT_COLUMNS.map((c) => c.header),
    data: data as unknown as Record<string, unknown>[],
  });
}

export function exportLeadsCsv(leads: Lead[], filename = "leadsync-leads.csv"): void {
  downloadFile(filename, leadsToCsv(leads), "text/csv;charset=utf-8");
}
