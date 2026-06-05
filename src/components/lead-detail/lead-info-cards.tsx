import * as React from "react";
import {
  Briefcase,
  Building2,
  Globe,
  Link2,
  Mail,
  MapPin,
  Phone,
  Tag,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SourceBadge } from "@/components/leads/lead-badges";
import { INDUSTRY_MAP } from "@/lib/constants";
import type { Lead } from "@/lib/types";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        <div className="truncate text-sm">{value || "—"}</div>
      </div>
    </div>
  );
}

const linkClass = "text-primary hover:underline";

export function ContactInfoCard({ lead }: { lead: Lead }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="divide-y py-0">
        <InfoRow
          icon={Mail}
          label="Email"
          value={
            lead.email ? (
              <a href={`mailto:${lead.email}`} className={linkClass}>
                {lead.email}
              </a>
            ) : undefined
          }
        />
        <InfoRow
          icon={Phone}
          label="Phone"
          value={
            lead.phone ? (
              <a href={`tel:${lead.phone}`} className={linkClass}>
                {lead.phone}
              </a>
            ) : undefined
          }
        />
        <InfoRow
          icon={Link2}
          label="LinkedIn"
          value={
            lead.linkedinUrl ? (
              <a
                href={lead.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                View profile
              </a>
            ) : undefined
          }
        />
        <InfoRow icon={MapPin} label="Location" value={lead.location} />
      </CardContent>
    </Card>
  );
}

export function CompanyInfoCard({ lead }: { lead: Lead }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Company Information</CardTitle>
      </CardHeader>
      <CardContent className="divide-y py-0">
        <InfoRow icon={Building2} label="Company" value={lead.company} />
        <InfoRow
          icon={Globe}
          label="Website"
          value={
            lead.companyWebsite ? (
              <a
                href={lead.companyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {lead.companyWebsite.replace(/^https?:\/\//, "")}
              </a>
            ) : undefined
          }
        />
        <InfoRow icon={Briefcase} label="Role" value={lead.role} />
        <InfoRow
          icon={Building2}
          label="Industry"
          value={lead.industry ? INDUSTRY_MAP[lead.industry] : undefined}
        />
        <InfoRow
          icon={Users}
          label="Company size"
          value={lead.companySize ? `${lead.companySize} employees` : undefined}
        />
        <InfoRow icon={Tag} label="Source" value={<SourceBadge source={lead.source} />} />
        {lead.tags.length > 0 && (
          <InfoRow
            icon={Tag}
            label="Tags"
            value={
              <div className="flex flex-wrap gap-1">
                {lead.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
