import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";

const tenureBreakdown = [
  { group: "< 1 yr", cqHealth: 48, friction: 62, confidence: 52, atRisk: 38 },
  { group: "1–3 yrs", cqHealth: 55, friction: 52, confidence: 60, atRisk: 22 },
  { group: "3–5 yrs", cqHealth: 63, friction: 44, confidence: 68, atRisk: 15 },
  { group: "5–10 yrs", cqHealth: 70, friction: 36, confidence: 74, atRisk: 10 },
  { group: "10+ yrs", cqHealth: 74, friction: 30, confidence: 78, atRisk: 8 },
];

const retentionTrend = [
  { month: "Sep", new: 45, mid: 62, senior: 74 },
  { month: "Oct", new: 47, mid: 63, senior: 74 },
  { month: "Nov", new: 50, mid: 64, senior: 75 },
  { month: "Dec", new: 48, mid: 65, senior: 76 },
  { month: "Jan", new: 52, mid: 66, senior: 76 },
  { month: "Feb", new: 54, mid: 67, senior: 77 },
  { month: "Mar", new: 55, mid: 68, senior: 77 },
];

const percentileRanks = [
  { metric: "New Teacher CQ", percentile: 58 },
  { metric: "Early Career Retention", percentile: 64 },
  { metric: "Mid-Career Confidence", percentile: 72 },
  { metric: "Senior Teacher Health", percentile: 80 },
  { metric: "Onboarding Friction", percentile: 55 },
];

export default function BenchmarkingByTenure() {
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

      {/* Tenure Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            CQ Health by Tenure Group
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tenureBreakdown}>
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

      {/* Retention Trend */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            CQ Health Trend by Tenure Band
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={retentionTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis domain={[30, 90]} className="text-xs" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="new" name="< 1 yr" stroke="hsl(28, 80%, 55%)" strokeWidth={2} />
              <Line type="monotone" dataKey="mid" name="3–5 yrs" stroke="hsl(200, 60%, 50%)" strokeWidth={2} />
              <Line type="monotone" dataKey="senior" name="10+ yrs" stroke="hsl(168, 55%, 38%)" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* At-risk by tenure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            At-Risk % by Tenure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tenureBreakdown.map((t) => (
            <div key={t.group} className="flex items-center gap-3">
              <span className="text-sm w-20 shrink-0">{t.group}</span>
              <Progress value={t.atRisk} className="h-2 flex-1" />
              <span className="text-sm font-medium w-10 text-right">{t.atRisk}%</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
