/** Generate a collision-resistant id (uuid when available). */
export function generateId(prefix = ""): string {
  let id: string;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    id = crypto.randomUUID();
  } else {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
  return prefix ? `${prefix}_${id}` : id;
}

/** Current timestamp as an ISO-8601 string. */
export function nowIso(): string {
  return new Date().toISOString();
}
