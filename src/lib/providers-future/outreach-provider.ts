/**
 * OutreachProvider — Phase 3 abstraction for automated outreach + TRACKING.
 *
 * Concrete implementation target: **n8n Webhooks** (sending via email/LinkedIn
 * sequences and ingesting open/click/reply events). NOT implemented in Phase 1.
 *
 * Inbound tracking events normalise to `OutreachEvent`, which the app converts
 * into `Activity` records and status transitions (e.g. reply → `replied`).
 */

export type OutreachChannel = "email" | "linkedin" | "sms";

export type OutreachEventType =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "replied"
  | "bounced"
  | "unsubscribed";

export interface OutreachMessage {
  leadId: string;
  channel: OutreachChannel;
  subject?: string;
  body: string;
  /** Reference to a saved sequence / template, if any. */
  templateId?: string;
}

export interface OutreachResult {
  id: string;
  status: "queued" | "sent" | "failed";
  sentAt?: string;
  error?: string;
}

export interface OutreachEvent {
  type: OutreachEventType;
  leadId: string;
  channel: OutreachChannel;
  at: string;
  metadata?: Record<string, unknown>;
}

export interface OutreachProvider {
  readonly id: string;
  send(message: OutreachMessage): Promise<OutreachResult>;
  /** Normalise a raw webhook payload (e.g. from n8n) into an OutreachEvent. */
  parseWebhook(payload: unknown): OutreachEvent | null;
}
