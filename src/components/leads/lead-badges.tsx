import {
  SOURCE_MAP,
  STAGE_MAP,
  TONE_BADGE,
  TONE_DOT,
  type Tone,
} from "@/lib/constants";
import { scoreTier } from "@/lib/scoring/lead-scoring";
import { cn } from "@/lib/utils";
import type { LeadSource, PipelineStage } from "@/lib/types";

export function LeadStatusBadge({
  status,
  className,
}: {
  status: PipelineStage;
  className?: string;
}) {
  const stage = STAGE_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        TONE_BADGE[stage.tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", TONE_DOT[stage.tone])} />
      {stage.label}
    </span>
  );
}

export function SourceBadge({ source }: { source: LeadSource }) {
  return (
    <span className="text-muted-foreground inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
      {SOURCE_MAP[source]}
    </span>
  );
}

const SCORE_TONE: Record<ReturnType<typeof scoreTier>, Tone> = {
  hot: "emerald",
  warm: "amber",
  cold: "slate",
};

export function ScorePill({ score, className }: { score: number; className?: string }) {
  const tone = SCORE_TONE[scoreTier(score)];
  return (
    <span
      className={cn(
        "inline-flex min-w-9 items-center justify-center rounded-md border px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        TONE_BADGE[tone],
        className,
      )}
    >
      {score}
    </span>
  );
}

/** Circular score gauge used on the Lead Detail page. */
export function ScoreGauge({ score, size = 96 }: { score: number; size?: number }) {
  const tier = scoreTier(score);
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    tier === "hot" ? "#34d399" : tier === "warm" ? "#fbbf24" : "#94a3b8";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{score}</span>
        <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          {tier}
        </span>
      </div>
    </div>
  );
}
