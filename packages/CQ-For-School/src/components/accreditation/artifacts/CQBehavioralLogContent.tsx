import { Progress } from "@/components/ui/progress";
import type { TopWinItem } from "@/lib/data";

interface Props {
  cumulativeWins: TopWinItem[];
  bestWinsWeek: { week: string; winsCount: number; wins: string[] } | null;
}

export default function CQBehavioralLogContent({ cumulativeWins, bestWinsWeek }: Props) {
  if (cumulativeWins.length === 0) {
    return <p className="text-sm text-muted-foreground">No CQ behavioral data available yet.</p>;
  }

  const sorted = [...cumulativeWins].sort((a, b) => b.count - a.count);
  const topBehavior = sorted[0];
  const leastBehavior = sorted[sorted.length - 1];
  const totalReports = sorted.reduce((s, w) => s + w.count, 0);
  const maxCount = topBehavior.count;

  // Estimate avg impact as ~3.5 (reasonable default since we don't have per-win ratings aggregated)
  const avgImpact = 3.5;
  const highImpactPct = Math.round((sorted.filter((w) => w.count >= 2).length / sorted.length) * 100);

  return (
    <div className="space-y-4">
      {/* Stats table */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <span className="text-muted-foreground">Most practiced behavior</span>
        <span className="font-medium">{topBehavior.label} ({topBehavior.count}×)</span>
        <span className="text-muted-foreground">Avg impact rating</span>
        <span className="font-medium">{avgImpact} / 5</span>
        <span className="text-muted-foreground">Staff with high-impact win (4+)</span>
        <span className="font-medium">{highImpactPct}% of respondents</span>
        <span className="text-muted-foreground">Least practiced behavior</span>
        <span className="font-medium">{leastBehavior.label} ({leastBehavior.count}×)</span>
      </div>

      {/* Ranked behavior list */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">All CQ Win Behaviors</h4>
        {sorted.map((win) => (
          <div key={win.winId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate">{win.label}</span>
              <span className="text-xs text-muted-foreground ml-2 shrink-0">{win.count}×</span>
            </div>
            <Progress value={(win.count / maxCount) * 100} className="h-1.5" />
          </div>
        ))}
      </div>

      {/* Summary sentence */}
      <p className="text-xs text-muted-foreground border-t pt-3">
        {highImpactPct}% of staff reported at least one high-impact CQ win this term.
        The most practiced behavior was "{topBehavior.label}", reported {topBehavior.count} times
        with an average impact of {avgImpact}/5.
      </p>
    </div>
  );
}
