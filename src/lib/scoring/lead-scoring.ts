/**
 * Lead Scoring Engine (0–100).
 *
 * Transparent, rule-based and data-driven so it can later be augmented (or
 * replaced) by an AIProvider without changing call-sites. Every rule returns a
 * labelled contribution, which the Lead Detail page renders as a "why this
 * score" breakdown.
 *
 * Headline rules (per product spec):
 *   Founder +20 · Co-Founder +15 · Real Estate +15 · Dubai +15
 *   Company size 10–100 +10 · Valid email +10 · LinkedIn +5
 */

import type { CompanySize, Lead, ScoreResult, ScoreBreakdownItem } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email?: string): boolean {
  return !!email && EMAIL_RE.test(email.trim());
}

/** Role tiers — highest single match wins (no double counting). */
const ROLE_RULES: { test: RegExp; label: string; points: number }[] = [
  { test: /\bfounder\b/i, label: "Founder", points: 20 },
  { test: /co[-\s]?founder/i, label: "Co-Founder", points: 15 },
  { test: /\b(ceo|chief executive)\b/i, label: "CEO", points: 18 },
  { test: /\bowner|proprietor\b/i, label: "Owner", points: 15 },
  { test: /\b(cto|cfo|coo|cmo|cpo|chief)\b/i, label: "C-Level", points: 14 },
  { test: /\b(vp|vice president)\b/i, label: "VP", points: 10 },
  { test: /\b(director|head of|partner)\b/i, label: "Director / Head", points: 8 },
  { test: /\bmanager\b/i, label: "Manager", points: 5 },
];

const INDUSTRY_POINTS: Partial<Record<NonNullable<Lead["industry"]>, number>> = {
  real_estate: 15,
  construction: 8,
  hospitality: 6,
  finance: 6,
};

/** Location tiers — highest single match wins. */
const LOCATION_RULES: { test: RegExp; label: string; points: number }[] = [
  { test: /\bdubai\b/i, label: "Dubai", points: 15 },
  { test: /\babu dhabi\b/i, label: "Abu Dhabi", points: 12 },
  { test: /\b(uae|united arab emirates|sharjah|ajman|fujairah)\b/i, label: "UAE", points: 10 },
  {
    test: /\b(riyadh|jeddah|saudi|ksa|doha|qatar|kuwait|bahrain|manama|muscat|oman)\b/i,
    label: "GCC",
    points: 6,
  },
];

const SIZE_POINTS: Record<CompanySize, number> = {
  "1-10": 4,
  "11-50": 10,
  "51-200": 10,
  "201-500": 7,
  "501-1000": 4,
  "1001-5000": 3,
  "5000+": 3,
};

function bestMatch(
  value: string | undefined,
  rules: { test: RegExp; label: string; points: number }[],
): ScoreBreakdownItem | null {
  if (!value) return null;
  let best: ScoreBreakdownItem | null = null;
  for (const rule of rules) {
    if (rule.test.test(value) && (!best || rule.points > best.points)) {
      best = { label: rule.label, points: rule.points };
    }
  }
  return best;
}

/**
 * Compute a lead's score together with its breakdown.
 * Pure function — safe to call from repositories, the store, or React.
 */
export function scoreLead(
  lead: Pick<
    Lead,
    | "role"
    | "industry"
    | "location"
    | "companySize"
    | "email"
    | "linkedinUrl"
    | "phone"
    | "companyWebsite"
  >,
): ScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];

  const role = bestMatch(lead.role, ROLE_RULES);
  if (role) breakdown.push(role);

  if (lead.industry && INDUSTRY_POINTS[lead.industry]) {
    breakdown.push({
      label: prettyIndustry(lead.industry),
      points: INDUSTRY_POINTS[lead.industry]!,
    });
  }

  const location = bestMatch(lead.location, LOCATION_RULES);
  if (location) breakdown.push(location);

  if (lead.companySize) {
    breakdown.push({
      label: `Company size ${lead.companySize}`,
      points: SIZE_POINTS[lead.companySize],
    });
  }

  if (isValidEmail(lead.email)) {
    breakdown.push({ label: "Valid email", points: 10 });
  }
  if (lead.linkedinUrl?.trim()) {
    breakdown.push({ label: "LinkedIn profile", points: 5 });
  }
  if (lead.phone?.trim()) {
    breakdown.push({ label: "Phone on file", points: 4 });
  }
  if (lead.companyWebsite?.trim()) {
    breakdown.push({ label: "Company website", points: 3 });
  }

  const raw = breakdown.reduce((sum, item) => sum + item.points, 0);
  const score = Math.max(0, Math.min(100, raw));

  return { score, breakdown };
}

/** Convenience wrapper when only the number is needed. */
export function calculateLeadScore(lead: Parameters<typeof scoreLead>[0]): number {
  return scoreLead(lead).score;
}

export type ScoreTier = "hot" | "warm" | "cold";

export function scoreTier(score: number): ScoreTier {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

function prettyIndustry(industry: NonNullable<Lead["industry"]>): string {
  return industry
    .split("_")
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}
