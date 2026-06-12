"use client";

import * as React from "react";
import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCrmStore } from "@/store/use-crm-store";

/**
 * Shown only while the workspace holds the untouched seeded sample dataset.
 * Lets the user clear the demo data (permanently — it will not re-seed) or
 * dismiss the notice while keeping the data.
 */
export function SampleDataBanner() {
  const isSample = useCrmStore((s) => s.isSample);
  const clearData = useCrmStore((s) => s.clearData);
  const dismissSample = useCrmStore((s) => s.dismissSample);
  const [busy, setBusy] = React.useState(false);

  if (!isSample) return null;

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex items-start gap-2.5">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-400" />
        <p className="text-sm text-amber-100/90">
          <span className="font-medium text-amber-200">
            You're viewing sample data.
          </span>{" "}
          These 10 Dubai real-estate leads and their activity history are demo
          records so the app isn't empty. Import your own CSV or clear them to
          start fresh.
        </p>
      </div>
      <div className="flex shrink-0 gap-2 sm:ml-auto">
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await clearData();
              toast.success("Sample data cleared");
            } finally {
              setBusy(false);
            }
          }}
        >
          Clear sample data
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label="Dismiss"
          onClick={() => dismissSample()}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
