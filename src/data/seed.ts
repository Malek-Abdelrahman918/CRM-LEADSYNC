/**
 * Seed data — realistic Dubai real-estate leads for first-run.
 *
 * Dates are computed relative to `now` so the dashboard charts, follow-up alerts
 * and "recent activity" always look alive regardless of when the app is opened.
 * Activities are generated from each lead's pipeline path so the timeline and
 * funnel are internally consistent.
 */

import { subDays, addDays } from "date-fns";
import { scoreLead } from "@/lib/scoring/lead-scoring";
import { SOURCE_MAP } from "@/lib/constants";
import type {
  Activity,
  ActivityType,
  CompanySize,
  Industry,
  Lead,
  LeadSource,
  Note,
  PipelineStage,
  Task,
} from "@/lib/types";

interface LeadSpec {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  domain: string;
  size: CompanySize;
  location: string;
  status: PipelineStage;
  source: LeadSource;
  createdAgo: number; // days
  lastContactedAgo?: number; // days
  followUpInDays?: number; // negative = overdue, 0 = today
  closedAgo?: number; // days (client)
  dealValue?: number;
  tags?: string[];
}

const INDUSTRY: Industry = "real_estate";

const SPECS: LeadSpec[] = [
  {
    id: "seed-1",
    firstName: "Venu",
    lastName: "Rehan",
    role: "Founder",
    company: "Prime Estates Dubai",
    domain: "primeestates.ae",
    size: "11-50",
    location: "Dubai, UAE",
    status: "proposal_sent",
    source: "referral",
    createdAgo: 145,
    lastContactedAgo: 6,
    followUpInDays: 2,
    dealValue: 12000,
    tags: ["high-intent", "decision-maker"],
  },
  {
    id: "seed-2",
    firstName: "Azad",
    lastName: "Mazarbhuiya",
    role: "Managing Director",
    company: "Skyline Properties",
    domain: "skylineproperties.ae",
    size: "51-200",
    location: "Dubai, UAE",
    status: "call_scheduled",
    source: "apollo",
    createdAgo: 120,
    lastContactedAgo: 3,
    followUpInDays: 1,
    dealValue: 9000,
    tags: ["enterprise"],
  },
  {
    id: "seed-3",
    firstName: "Imane",
    lastName: "Bakhkhar",
    role: "Co-Founder",
    company: "Marina Heights Realty",
    domain: "marinaheights.ae",
    size: "11-50",
    location: "Dubai, UAE",
    status: "replied",
    source: "linkedin",
    createdAgo: 95,
    lastContactedAgo: 2,
    followUpInDays: 4,
    tags: ["warm"],
  },
  {
    id: "seed-4",
    firstName: "Waseem",
    lastName: "Khursheed",
    role: "Chief Executive Officer",
    company: "Palm Residences Group",
    domain: "palmresidences.ae",
    size: "201-500",
    location: "Dubai, UAE",
    status: "contacted",
    source: "apollo",
    createdAgo: 80,
    lastContactedAgo: 9,
    followUpInDays: -2,
    tags: ["enterprise"],
  },
  {
    id: "seed-5",
    firstName: "Nazrul",
    lastName: "Kabir",
    role: "Sales Director",
    company: "Emirates Property Partners",
    domain: "emiratesproperty.ae",
    size: "51-200",
    location: "Abu Dhabi, UAE",
    status: "follow_up",
    source: "cold_outreach",
    createdAgo: 60,
    lastContactedAgo: 5,
    followUpInDays: 0,
  },
  {
    id: "seed-6",
    firstName: "Samta",
    lastName: "Thul",
    role: "Senior Property Consultant",
    company: "Downtown Living Real Estate",
    domain: "downtownliving.ae",
    size: "11-50",
    location: "Dubai, UAE",
    status: "researching",
    source: "apollo",
    createdAgo: 45,
    followUpInDays: 6,
  },
  {
    id: "seed-7",
    firstName: "Tarek",
    lastName: "Karroum",
    role: "Founder & CEO",
    company: "Arabian Homes Realty",
    domain: "arabianhomes.ae",
    size: "51-200",
    location: "Dubai, UAE",
    status: "client",
    source: "referral",
    createdAgo: 160,
    lastContactedAgo: 18,
    closedAgo: 18,
    dealValue: 15000,
    tags: ["client", "case-study"],
  },
  {
    id: "seed-8",
    firstName: "Maneesh",
    lastName: "Kapoor",
    role: "Director of Sales",
    company: "Oasis Property Group",
    domain: "oasisproperty.ae",
    size: "201-500",
    location: "Dubai, UAE",
    status: "new",
    source: "apollo",
    createdAgo: 8,
  },
  {
    id: "seed-9",
    firstName: "Javed",
    lastName: "Ansari",
    role: "Co-Founder",
    company: "Vista Real Estate Brokers",
    domain: "vistarealestate.ae",
    size: "11-50",
    location: "Dubai, UAE",
    status: "lost",
    source: "linkedin",
    createdAgo: 110,
    lastContactedAgo: 32,
    tags: ["nurture"],
  },
  {
    id: "seed-10",
    firstName: "Rohit",
    lastName: "Dhingra",
    role: "Managing Partner",
    company: "Pinnacle Properties LLC",
    domain: "pinnacleproperties.ae",
    size: "51-200",
    location: "Dubai, UAE",
    status: "proposal_sent",
    source: "website",
    createdAgo: 70,
    lastContactedAgo: 4,
    followUpInDays: 3,
    dealValue: 8000,
    tags: ["high-intent"],
  },
];

const FUNNEL_PATH: PipelineStage[] = [
  "new",
  "researching",
  "contacted",
  "follow_up",
  "replied",
  "call_scheduled",
  "proposal_sent",
  "client",
];

const STAGE_ACTIVITY: Record<
  PipelineStage,
  { type: ActivityType; title: string; description?: string }
> = {
  new: { type: "created", title: "Lead created" },
  researching: {
    type: "note_added",
    title: "Account researched",
    description: "Qualified fit and identified key decision makers.",
  },
  contacted: { type: "email_sent", title: "Sent first outreach email" },
  follow_up: { type: "follow_up_scheduled", title: "Scheduled a follow-up" },
  replied: { type: "email_received", title: "Lead replied to outreach" },
  call_scheduled: { type: "meeting", title: "Discovery call booked" },
  proposal_sent: { type: "email_sent", title: "Proposal sent" },
  client: {
    type: "status_change",
    title: "Won — converted to client",
    description: "Closed the deal. Kicking off onboarding.",
  },
  lost: {
    type: "status_change",
    title: "Marked as lost",
    description: "Went with another vendor for now — added to nurture.",
  },
};

function iso(date: Date): string {
  return date.toISOString();
}

function specToLead(spec: LeadSpec, now: Date): Lead {
  const createdAt = iso(subDays(now, spec.createdAgo));
  const lastContactedAt =
    spec.lastContactedAgo !== undefined
      ? iso(subDays(now, spec.lastContactedAgo))
      : undefined;
  const nextFollowUpAt =
    spec.followUpInDays !== undefined && spec.status !== "client" && spec.status !== "lost"
      ? iso(addDays(now, spec.followUpInDays))
      : undefined;
  const closedAt = spec.closedAgo !== undefined ? iso(subDays(now, spec.closedAgo)) : undefined;

  const partial = {
    role: spec.role,
    industry: INDUSTRY,
    location: spec.location,
    companySize: spec.size,
    email: `${spec.firstName.toLowerCase()}@${spec.domain}`,
    linkedinUrl: `https://www.linkedin.com/in/${spec.firstName.toLowerCase()}-${spec.lastName.toLowerCase()}`,
    phone: `+971 5${(spec.id.length + spec.firstName.length) % 9} ${(100 + spec.firstName.length * 7) % 900 + 100} ${(1000 + spec.lastName.length * 13) % 9000 + 1000}`,
    companyWebsite: `https://${spec.domain}`,
  };

  return {
    id: spec.id,
    firstName: spec.firstName,
    lastName: spec.lastName,
    fullName: `${spec.firstName} ${spec.lastName}`,
    role: spec.role,
    company: spec.company,
    companyWebsite: partial.companyWebsite,
    industry: INDUSTRY,
    companySize: spec.size,
    location: spec.location,
    email: partial.email,
    phone: partial.phone,
    linkedinUrl: partial.linkedinUrl,
    status: spec.status,
    source: spec.source,
    score: scoreLead(partial).score,
    tags: spec.tags ?? [],
    dealValue: spec.dealValue,
    createdAt,
    updatedAt: lastContactedAt ?? closedAt ?? createdAt,
    lastContactedAt,
    nextFollowUpAt,
    closedAt,
  };
}

function activitiesForLead(lead: Lead, spec: LeadSpec, now: Date): Activity[] {
  const startMs = new Date(lead.createdAt).getTime();
  const endMs = new Date(
    lead.lastContactedAt ?? lead.closedAt ?? iso(now),
  ).getTime();

  const path: PipelineStage[] =
    spec.status === "lost"
      ? ["new", "contacted", "lost"]
      : FUNNEL_PATH.slice(0, FUNNEL_PATH.indexOf(spec.status) + 1);

  return path.map((stage, i) => {
    const fraction = path.length > 1 ? i / (path.length - 1) : 0;
    const ts = new Date(startMs + (endMs - startMs) * fraction);
    const def = STAGE_ACTIVITY[stage];
    const description =
      stage === "new"
        ? `Added via ${SOURCE_MAP[lead.source]}`
        : def.description;
    return {
      id: `${lead.id}-act-${i}`,
      leadId: lead.id,
      type: stage === "new" ? "created" : def.type,
      title: def.title,
      description,
      createdAt: iso(ts),
    } satisfies Activity;
  });
}

export interface SeedData {
  leads: Lead[];
  activities: Activity[];
  notes: Note[];
  tasks: Task[];
}

export function buildSeedData(now: Date = new Date()): SeedData {
  const leads = SPECS.map((s) => specToLead(s, now));
  const activities = leads.flatMap((lead) => {
    const spec = SPECS.find((s) => s.id === lead.id)!;
    return activitiesForLead(lead, spec, now);
  });

  const notes: Note[] = [
    {
      id: "seed-note-1",
      leadId: "seed-1",
      content:
        "Wants to automate lead follow-up and reporting across their 12 agents. Budget approved for Q3. Decision by end of month.",
      author: "You",
      createdAt: iso(subDays(now, 7)),
      updatedAt: iso(subDays(now, 7)),
    },
    {
      id: "seed-note-2",
      leadId: "seed-2",
      content: "Prefers a Tuesday/Thursday call. Interested in WhatsApp + email sequences.",
      author: "You",
      createdAt: iso(subDays(now, 4)),
      updatedAt: iso(subDays(now, 4)),
    },
    {
      id: "seed-note-3",
      leadId: "seed-7",
      content: "Signed the annual plan 🎉 Onboarding scheduled. Great candidate for a case study.",
      author: "You",
      createdAt: iso(subDays(now, 18)),
      updatedAt: iso(subDays(now, 18)),
    },
    {
      id: "seed-note-4",
      leadId: "seed-5",
      content: "Asked for ROI numbers from similar Abu Dhabi brokerages before committing.",
      author: "You",
      createdAt: iso(subDays(now, 5)),
      updatedAt: iso(subDays(now, 5)),
    },
  ];

  const tasks: Task[] = [
    {
      id: "seed-task-1",
      leadId: "seed-1",
      title: "Send revised proposal (v2)",
      description: "Include the multi-agent pricing tier and onboarding timeline.",
      dueDate: iso(addDays(now, 2)),
      completed: false,
      priority: "high",
      createdAt: iso(subDays(now, 1)),
    },
    {
      id: "seed-task-2",
      leadId: "seed-5",
      title: "Follow-up call with Nazrul",
      dueDate: iso(now),
      completed: false,
      priority: "high",
      createdAt: iso(subDays(now, 3)),
    },
    {
      id: "seed-task-3",
      leadId: "seed-4",
      title: "Re-engage Waseem (overdue)",
      description: "No reply to first email — try LinkedIn + a value-add resource.",
      dueDate: iso(subDays(now, 2)),
      completed: false,
      priority: "medium",
      createdAt: iso(subDays(now, 9)),
    },
    {
      id: "seed-task-4",
      leadId: "seed-2",
      title: "Prep discovery call agenda",
      dueDate: iso(addDays(now, 1)),
      completed: false,
      priority: "medium",
      createdAt: iso(subDays(now, 2)),
    },
    {
      id: "seed-task-5",
      leadId: "seed-7",
      title: "Kick off onboarding",
      completed: true,
      priority: "high",
      createdAt: iso(subDays(now, 17)),
      completedAt: iso(subDays(now, 15)),
    },
    {
      id: "seed-task-6",
      leadId: "seed-10",
      title: "Check in on proposal feedback",
      dueDate: iso(addDays(now, 3)),
      completed: false,
      priority: "medium",
      createdAt: iso(subDays(now, 4)),
    },
  ];

  return { leads, activities, notes, tasks };
}
