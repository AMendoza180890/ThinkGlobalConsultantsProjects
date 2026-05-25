import { BarChart, Bar, XAxis, Cell, ResponsiveContainer } from "recharts";

interface WeeklyBreakdown {
  week: string;
  count: number;
}

interface ParticipationData {
  totalSubmissions?: number;
  uniqueWeeks?: number;
  weeklyBreakdown?: WeeklyBreakdown[];
}

interface Props {
  data: ParticipationData;
  participationRate: number;
}

export default function ParticipationLogContent({ data, participationRate }: Props) {
  const weeks = data.weeklyBreakdown ?? [];
  const totalResponses = data.totalSubmissions ?? 0;
  const weekCount = data.uniqueWeeks ?? weeks.length;

  if (weekCount === 0) {
    return <p className="text-sm text-muted-foreground">No participation data available yet.</p>;
  }

  const avgParticipation = participationRate;
  const weekCounts = weeks.map((w) => w.count);
  const minWeek = weeks.length > 0 ? weeks.reduce((a, b) => (a.count < b.count ? a : b)) : null;
  const maxWeek = weeks.length > 0 ? weeks.reduce((a, b) => (a.count > b.count ? a : b)) : null;
  const maxCount = Math.max(...weekCounts, 1);

  // Rate is relative to the peak week, not absolute staff count — used only for bar coloring
  const weeklyRates = weeks.map((w) => ({
    week: w.week.slice(5), // strip year: "2024-03-11" → "03-11"
    count: w.count,
    rate: Math.round((w.count / maxCount) * 100),
  }));

  // Weeks where relative participation fell below the 60% threshold
  const belowThreshold = weeklyRates.filter((w) => w.rate < 60).length;
  // High requires both sustained rate (≥60%) and enough weeks (≥8) for statistical weight
  const confidence = avgParticipation >= 60 && weekCount >= 8 ? "High" : avgParticipation >= 40 ? "Medium" : "Low";
  const firstDate = weeks[0]?.week ?? "—";
  const lastDate = weeks[weeks.length - 1]?.week ?? "—";

  // Green ≥60%, amber 40–59%, red <40% — mirrors the confidence thresholds above
  const getBarColor = (rate: number) => {
    if (rate >= 60) return "hsl(var(--chart-2))";
    if (rate >= 40) return "hsl(var(--chart-4))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="space-y-4">
      {/* Stats table */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <span className="text-muted-foreground">Reporting period</span>
        <span className="font-medium">{firstDate} → {lastDate}</span>
        <span className="text-muted-foreground">Total responses</span>
        <span className="font-medium">{totalResponses}</span>
        <span className="text-muted-foreground">Avg weekly participation</span>
        <span className="font-medium">{avgParticipation}%</span>
        <span className="text-muted-foreground">Lowest participation week</span>
        <span className="font-medium">{minWeek ? `${minWeek.week.slice(5)} (${minWeek.count} responses)` : "—"}</span>
        <span className="text-muted-foreground">Highest participation week</span>
        <span className="font-medium">{maxWeek ? `${maxWeek.week.slice(5)} (${maxWeek.count} responses)` : "—"}</span>
        <span className="text-muted-foreground">Weeks below 60% threshold</span>
        <span className="font-medium">{belowThreshold}</span>
        <span className="text-muted-foreground">Evidence confidence</span>
        <span className={`font-medium ${confidence === "High" ? "text-emerald-600" : confidence === "Medium" ? "text-amber-600" : "text-destructive"}`}>
          {confidence}
        </span>
      </div>

      {/* Bar chart */}
      {weeklyRates.length > 0 && (
        <div className="h-[60px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyRates} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {weeklyRates.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry.rate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary sentence */}
      <p className="text-xs text-muted-foreground border-t pt-3">
        Data drawn from {totalResponses} staff responses across {weekCount} weeks ({firstDate} – {lastDate}),
        representing an average participation rate of {avgParticipation}% —{" "}
        {avgParticipation >= 60 ? "above" : "below"} the 60% minimum threshold for high-confidence evidence.
      </p>
    </div>
  );
}
