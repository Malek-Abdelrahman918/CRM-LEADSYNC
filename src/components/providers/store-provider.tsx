"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { useCrmStore } from "@/store/use-crm-store";
import { Logo } from "@/components/layout/logo";

/**
 * Hydrates the CRM store from the storage provider on mount (seeding sample data
 * on first run) and gates the app behind a branded splash until ready. Rendering
 * the same splash on the server and the first client paint avoids any hydration
 * mismatch from LocalStorage-only data.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useCrmStore((s) => s.hydrated);
  const hydrate = useCrmStore((s) => s.hydrate);

  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background">
        <Logo />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
