import {
  LineChart, Line, XAxis, YAxis, ReferenceArea, ResponsiveContainer, Tooltip,
} from "recharts";

interface WeekData {
  week: string;
  avgSeverity: number;
}

interface TrendData {
  weeks?: WeekData[];
}

interface Props {
  data: TrendData;
}

export default function TrendAnalysisContent({ data }: Props) {
  const weeks = data.weeks ?? [];
  if (weeks.length === 0) {
    return <p className="text-sm text-muted-foreground">No trend data available yet.</p>;
  }

  // Convert severity (0-5) to a 0-100 "health" score (inverted: low severity = high score)
  const chartData = weeks.map((w) => ({
    week: w.week.slice(5),
    score: Math.round((1 - w.avgSeverity / 5) * 100),
    severity: w.avgSeverity,
  }));

  const scores = chartData.map((d) => d.score);
  const firstScore = scores[0];
  const lastScore = scores[scores.length - 1];
  const overallChange = lastScore - firstScore;
  const trend = overallChange > 3 ? "Improving" : overallChange < -3 ? "Declining" : "Stable";

  // Find sharpest drop and gain
  let sharpestDrop = { week: "", change: 0 };
  let sharpestGain = { week: "", change: 0 };
  for (let i = 1; i < chartData.length; i++) {
    const change = chartData[i].score - chartData[i - 1].score;
    if (change < sharpestDrop.change) sharpestDrop = { week: chartData[i].week, change };
    if (change > sharpestGain.change) sharpestGain = { week: chartData[i].week, change };
  }

  const weeksAbove70 = scores.filter((s) => s >= 70).length;
  const weeksInHighRisk = scores.filter((s) => s < 40).length;

  return (
    <div className="space-y-4">
      {/* Stats table */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <span className="text-muted-foreground">Weeks tracked</span>
        <span className="font-medium">{weeks.length}</span>
        <span className="text-muted-foreground">Overall trend direction</span>
        <span className={`font-medium ${trend === "Improving" ? "text-emerald-600" : trend === "Declining" ? "text-destructive" : ""}`}>
          {trend} ({overallChange > 0 ? "+" : ""}{overallChange} pts)
        </span>
        <span className="text-muted-foreground">Sharpest single-week drop</span>
        <span className="font-medium">{sharpestDrop.week || "—"} ({sharpestDrop.change} pts)</span>
        <span className="text-muted-foreground">Sharpest single-week gain</span>
        <span className="font-medium">{sharpestGain.week || "—"} (+{sharpestGain.change} pts)</span>
        <span className="text-muted-foreground">Weeks above 70 threshold</span>
        <span className="font-medium">{weeksAbove70} of {weeks.length}</span>
        <span className="text-muted-foreground">Weeks in high-risk zone</span>
        <span className="font-medium">{weeksInHighRisk} of {weeks.length}</span>
      </div>

      {/* Line chart with risk bands */}
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            {/* Risk bands */}
            <ReferenceArea y1={0} y2={40} fill="hsl(var(--destructive))" fillOpacity={0.08} />
            <ReferenceArea y1={40} y2={70} fill="hsl(var(--chart-4))" fillOpacity={0.08} />
            <ReferenceArea y1={70} y2={100} fill="hsl(var(--chart-2))" fillOpacity={0.08} />
            <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip
              formatter={(value: number) => [`${value}`, "Health Score"]}
              labelFormatter={(label) => `Week ${label}`}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
