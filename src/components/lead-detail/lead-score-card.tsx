import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreGauge } from "@/components/leads/lead-badges";
import { scoreLead } from "@/lib/scoring/lead-scoring";
import type { Lead } from "@/lib/types";

export function LeadScoreCard({ lead }: { lead: Lead }) {
  const { score, breakdown } = scoreLead(lead);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lead Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5">
        <ScoreGauge score={score} />
        <div className="w-full space-y-1.5">
          {breakdown.length > 0 ? (
            breakdown.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-emerald-400 tabular-nums">
                  +{item.points}
                </span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center text-sm">
              Add a role, industry, location and contact details to build a score.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
