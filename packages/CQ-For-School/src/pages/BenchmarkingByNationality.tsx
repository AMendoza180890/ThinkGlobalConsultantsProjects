import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Globe2 } from "lucide-react";

const nationalityData = [
  { group: "Local", cqHealth: 72, friction: 30, confidence: 76, count: 42 },
  { group: "South Asian", cqHealth: 65, friction: 42, confidence: 68, count: 18 },
  { group: "East Asian", cqHealth: 68, friction: 38, confidence: 70, count: 12 },
  { group: "Western Expat", cqHealth: 60, friction: 50, confidence: 64, count: 24 },
  { group: "African", cqHealth: 63, friction: 44, confidence: 66, count: 8 },
  { group: "Other", cqHealth: 61, friction: 46, confidence: 65, count: 10 },
];

const percentileRanks = [
  { metric: "Cross-Cultural CQ", percentile: 68 },
  { metric: "Expat Integration", percentile: 55 },
  { metric: "Local Staff Confidence", percentile: 80 },
  { metric: "Cultural Friction", percentile: 72 },
  { metric: "Diversity Index", percentile: 76 },
];

export default function BenchmarkingByNationality() {
  return (
    <div className="container max-w-6xl px-4 py-8">
      {/* Percentile Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-8">
        {percentileRanks.map((p) => (
          <Card key={p.metric}>
            <CardContent className="pt-6 text-center">
              <p className="text-xs text-muted-foreground">{p.metric}</p>
              <p className="text-2xl font-bold text-primary">{p.percentile}<sup className="text-xs">th</sup></p>
              <Progress value={p.percentile} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nationality breakdown chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary" />
            CQ Health by Nationality Group
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={nationalityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="group" className="text-xs" />
              <YAxis domain={[0, 100]} className="text-xs" />
              <Tooltip />
              <Legend />
              <Bar dataKey="cqHealth" name="CQ Health" fill="hsl(168, 55%, 38%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="friction" name="Friction" fill="hsl(28, 80%, 55%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="confidence" name="Confidence" fill="hsl(200, 60%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Staff distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staff Distribution by Nationality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {nationalityData.map((n) => {
            const total = nationalityData.reduce((s, d) => s + d.count, 0);
            const pct = Math.round((n.count / total) * 100);
            return (
              <div key={n.group} className="flex items-center gap-3">
                <span className="text-sm w-24 shrink-0">{n.group}</span>
                <Progress value={pct} className="h-2 flex-1" />
                <span className="text-sm font-medium w-16 text-right text-muted-foreground">{n.count} ({pct}%)</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
