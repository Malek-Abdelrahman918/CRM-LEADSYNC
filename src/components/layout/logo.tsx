import { Waypoints } from "lucide-react";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-500 text-primary-foreground shadow-sm shadow-primary/30 ring-1 ring-white/10",
        className,
      )}
    >
      <Waypoints className="size-4.5" strokeWidth={2.25} />
    </div>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">LeadSync</span>
          <span className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            OS
          </span>
        </div>
      )}
    </div>
  );
}
