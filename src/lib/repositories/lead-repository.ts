import { BaseRepository } from "./base-repository";
import type { StorageProvider } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { generateId, nowIso } from "@/lib/id";
import { scoreLead } from "@/lib/scoring/lead-scoring";
import type { Lead, NewLeadInput, PipelineStage } from "@/lib/types";

/** Fields that, when changed, require the lead score to be recomputed. */
const SCORING_FIELDS: (keyof Lead)[] = [
  "role",
  "industry",
  "location",
  "companySize",
  "email",
  "linkedinUrl",
  "phone",
  "companyWebsite",
];

export class LeadRepository extends BaseRepository<Lead> {
  constructor(storage: StorageProvider) {
    super(storage, STORAGE_KEYS.leads);
  }

  /** Pure builder — turns partial input into a fully-formed, scored Lead. */
  buildLead(input: NewLeadInput): Lead {
    const firstName = (input.firstName ?? "").trim();
    const lastName = (input.lastName ?? "").trim();
    const now = nowIso();

    const base: Lead = {
      id: input.id ?? generateId("lead"),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      role: input.role ?? "",
      avatarUrl: input.avatarUrl,
      company: input.company ?? "",
      companyWebsite: input.companyWebsite,
      industry: input.industry,
      companySize: input.companySize,
      location: input.location,
      email: input.email,
      phone: input.phone,
      linkedinUrl: input.linkedinUrl,
      status: input.status ?? "new",
      source: input.source ?? "manual",
      score: 0,
      tags: input.tags ?? [],
      dealValue: input.dealValue,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
      lastContactedAt: input.lastContactedAt,
      nextFollowUpAt: input.nextFollowUpAt,
      closedAt: input.closedAt ?? (input.status === "client" ? now : undefined),
      enriched: input.enriched,
      enrichmentSource: input.enrichmentSource,
      enrichmentData: input.enrichmentData,
    };

    base.score = input.score ?? scoreLead(base).score;
    return base;
  }

  async create(input: NewLeadInput): Promise<Lead> {
    return this.insert(this.buildLead(input));
  }

  async createMany(inputs: NewLeadInput[]): Promise<Lead[]> {
    return this.insertMany(inputs.map((i) => this.buildLead(i)));
  }

  async update(id: string, changes: Partial<Lead>): Promise<Lead | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const merged: Lead = { ...existing, ...changes, id, updatedAt: nowIso() };

    // Keep derived fields consistent.
    if (changes.firstName !== undefined || changes.lastName !== undefined) {
      merged.fullName = `${merged.firstName} ${merged.lastName}`.trim();
    }
    const touchedScoring = SCORING_FIELDS.some((f) => f in changes);
    if (touchedScoring && changes.score === undefined) {
      merged.score = scoreLead(merged).score;
    }
    if (changes.status === "client" && !merged.closedAt) {
      merged.closedAt = nowIso();
    }

    return this.patch(id, merged);
  }

  async updateStatus(id: string, status: PipelineStage): Promise<Lead | null> {
    return this.update(id, { status });
  }

  /** Recompute and persist a lead's score (e.g. after enrichment). */
  async recomputeScore(id: string): Promise<Lead | null> {
    const lead = await this.getById(id);
    if (!lead) return null;
    return this.patch(id, { score: scoreLead(lead).score, updatedAt: nowIso() });
  }
}
