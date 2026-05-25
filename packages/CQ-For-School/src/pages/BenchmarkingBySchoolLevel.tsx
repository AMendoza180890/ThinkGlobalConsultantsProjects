import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts";
import { School, TrendingUp } from "lucide-react";

const levelBreakdown = [
  { level: "Early Years", cqHealth: 70, friction: 34, confidence: 74 },
  { level: "Primary", cqHealth: 68, friction: 36, confidence: 72 },
  { level: "Middle", cqHealth: 62, friction: 44, confidence: 66 },
  { level: "Secondary", cqHealth: 58, friction: 50, confidence: 62 },
  { level: "Sixth Form", cqHealth: 72, friction: 30, confidence: 76 },
];

const trendByLevel = [
  { month: "Sep", primary: 62, middle: 55, secondary: 52 },
  { month: "Oct", primary: 63, middle: 57, secondary: 53 },
  { month: "Nov", primary: 65, middle: 58, secondary: 55 },
  { month: "Dec", primary: 66, middle: 59, secondary: 56 },
  { month: "Jan", primary: 67, middle: 61, secondary: 57 },
  { month: "Feb", primary: 68, middle: 62, secondary: 58 },
  { month: "Mar", primary: 68, middle: 62, secondary: 58 },
];

const percentileRanks = [
  { metric: "Early Years CQ", percentile: 80 },
  { metric: "Primary Health", percentile: 74 },
  { metric: "Middle School Friction", percentile: 60 },
  { metric: "Secondary Confidence", percentile: 56 },
  { metric: "Sixth Form Health", percentile: 82 },
];

export default function BenchmarkingBySchoolLevel() {
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

      {/* Level breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <School className="h-4 w-4 text-primary" />
            CQ Health by School Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={levelBreakdown}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="level" className="text-xs" />
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

      {/* Trend by level */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            CQ Health Trend by Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendByLevel}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis domain={[40, 80]} className="text-xs" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="primary" name="Primary" stroke="hsl(168, 55%, 38%)" strokeWidth={2} />
              <Line type="monotone" dataKey="middle" name="Middle" stroke="hsl(200, 60%, 50%)" strokeWidth={2} />
              <Line type="monotone" dataKey="secondary" name="Secondary" stroke="hsl(28, 80%, 55%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
