import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LeadsView } from "@/components/leads/leads-view";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Search, filter, score and manage every lead in one place."
      />
      <Suspense fallback={<div className="h-64" />}>
        <LeadsView />
      </Suspense>
    </div>
  );
}
