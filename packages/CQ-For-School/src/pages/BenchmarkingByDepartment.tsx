import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { LayoutGrid } from "lucide-react";

const deptBreakdown = [
  { dept: "Maths", cqHealth: 68, friction: 38, confidence: 72 },
  { dept: "Science", cqHealth: 65, friction: 42, confidence: 68 },
  { dept: "English", cqHealth: 70, friction: 34, confidence: 74 },
  { dept: "Humanities", cqHealth: 63, friction: 46, confidence: 66 },
  { dept: "Arts", cqHealth: 75, friction: 28, confidence: 80 },
  { dept: "PE", cqHealth: 72, friction: 32, confidence: 76 },
  { dept: "IT / Tech", cqHealth: 60, friction: 50, confidence: 62 },
  { dept: "Languages", cqHealth: 66, friction: 40, confidence: 70 },
];

const radarData = deptBreakdown.map((d) => ({ subject: d.dept, CQ: d.cqHealth }));

const percentileRanks = [
  { metric: "Arts CQ Health", percentile: 88 },
  { metric: "Maths CQ Health", percentile: 74 },
  { metric: "Science Friction", percentile: 62 },
  { metric: "IT Confidence", percentile: 48 },
  { metric: "Cross-Dept Alignment", percentile: 70 },
];

export default function BenchmarkingByDepartment() {
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

      {/* Department bar chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            CQ Health by Department
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={deptBreakdown}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="dept" className="text-xs" />
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

      {/* Radar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department CQ Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" className="text-xs" />
              <Radar name="CQ Health" dataKey="CQ" stroke="hsl(168, 55%, 38%)" fill="hsl(168, 55%, 38%)" fillOpacity={0.25} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
