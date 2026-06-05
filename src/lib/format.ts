import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/** 1.2K / 3.4M compact notation for stat cards & axes. */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

export function formatDate(value?: string | null, fallback = "—"): string {
  const d = toDate(value);
  return d ? format(d, "MMM d, yyyy") : fallback;
}

export function formatDateTime(value?: string | null, fallback = "—"): string {
  const d = toDate(value);
  return d ? format(d, "MMM d, yyyy · h:mm a") : fallback;
}

export function formatRelative(value?: string | null, fallback = "—"): string {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : fallback;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
