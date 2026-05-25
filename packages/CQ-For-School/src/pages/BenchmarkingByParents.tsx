import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts";
import { Users, TrendingUp } from "lucide-react";

const parentMetrics = [
  { group: "High Engagement", cqHealth: 74, friction: 28, confidence: 78 },
  { group: "Medium Engagement", cqHealth: 64, friction: 40, confidence: 68 },
  { group: "Low Engagement", cqHealth: 52, friction: 56, confidence: 56 },
  { group: "New Parents", cqHealth: 50, friction: 60, confidence: 54 },
  { group: "Long-term Parents", cqHealth: 72, friction: 32, confidence: 75 },
];

const parentTrend = [
  { month: "Sep", teacherParent: 50, highEngage: 68, lowEngage: 42 },
  { month: "Oct", teacherParent: 52, highEngage: 70, lowEngage: 44 },
  { month: "Nov", teacherParent: 54, highEngage: 71, lowEngage: 46 },
  { month: "Dec", teacherParent: 55, highEngage: 72, lowEngage: 47 },
  { month: "Jan", teacherParent: 57, highEngage: 73, lowEngage: 48 },
  { month: "Feb", teacherParent: 58, highEngage: 74, lowEngage: 50 },
  { month: "Mar", teacherParent: 60, highEngage: 74, lowEngage: 52 },
];

const percentileRanks = [
  { metric: "Parent-Teacher CQ", percentile: 66 },
  { metric: "Parent Satisfaction", percentile: 72 },
  { metric: "Communication Friction", percentile: 58 },
  { metric: "Engagement Rate", percentile: 70 },
  { metric: "Conflict Resolution", percentile: 64 },
];

const topIssues = [
  { issue: "Communication style mismatch", count: 14, severity: 3.8 },
  { issue: "Expectation misalignment", count: 11, severity: 3.5 },
  { issue: "Cultural norm differences", count: 9, severity: 3.2 },
  { issue: "Language barriers", count: 6, severity: 2.9 },
  { issue: "Feedback delivery", count: 5, severity: 2.6 },
];

export default function BenchmarkingByParents() {
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

      {/* Parent engagement breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            CQ Health by Parent Engagement Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={parentMetrics}>
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

      {/* Trend */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Teacher–Parent CQ Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={parentTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis domain={[30, 85]} className="text-xs" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="teacherParent" name="Overall T→P" stroke="hsl(168, 55%, 38%)" strokeWidth={3} />
              <Line type="monotone" dataKey="highEngage" name="High Engagement" stroke="hsl(200, 60%, 50%)" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="lowEngage" name="Low Engagement" stroke="hsl(28, 80%, 55%)" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top issues */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Teacher–Parent Friction Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topIssues.map((item) => (
            <div key={item.issue} className="flex items-center justify-between gap-4">
              <span className="text-sm flex-1">{item.issue}</span>
              <span className="text-xs text-muted-foreground">{item.count} reports</span>
              <span className="text-sm font-semibold w-12 text-right text-destructive">{item.severity.toFixed(1)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
