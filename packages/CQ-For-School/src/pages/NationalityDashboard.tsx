import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { Globe2, AlertTriangle } from "lucide-react";

const nationalityGroups = [
  { group: "Local",         cqHealth: 72, friction: 30, confidence: 76, staff: 42, atRisk: 8  },
  { group: "South Asian",   cqHealth: 65, friction: 42, confidence: 68, staff: 18, atRisk: 18 },
  { group: "East Asian",    cqHealth: 68, friction: 38, confidence: 70, staff: 12, atRisk: 12 },
  { group: "Western Expat", cqHealth: 60, friction: 50, confidence: 64, staff: 24, atRisk: 25 },
  { group: "African",       cqHealth: 63, friction: 44, confidence: 66, staff: 8,  atRisk: 15 },
  { group: "Other",         cqHealth: 61, friction: 46, confidence: 65, staff: 10, atRisk: 14 },
];

const radarData = nationalityGroups.map((n) => ({ subject: n.group, CQ: n.cqHealth, Confidence: n.confidence }));

const topFrictionIssues = [
  { issue: "Communication style mismatch",  count: 14, severity: 3.8 },
  { issue: "Expectation misalignment",      count: 11, severity: 3.5 },
  { issue: "Cultural norm differences",     count: 9,  severity: 3.2 },
  { issue: "Language barriers",             count: 6,  severity: 2.9 },
  { issue: "Feedback delivery styles",      count: 5,  severity: 2.6 },
];

const total = nationalityGroups.reduce((s, n) => s + n.staff, 0);

export default function NationalityDashboard() {
  return (
    <div className="container max-w-6xl px-4 py-8">

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">Nationality Groups</p>
            <p className="text-3xl font-black text-primary">{nationalityGroups.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">Total Staff</p>
            <p className="text-3xl font-black">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">Avg CQ Health</p>
            <p className="text-3xl font-black text-primary">
              {Math.round(nationalityGroups.reduce((s, n) => s + n.cqHealth, 0) / nationalityGroups.length)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">Highest At-Risk Group</p>
            <p className="text-lg font-bold text-amber-500">Western Expat</p>
            <p className="text-xs text-muted-foreground">25% at-risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary" />
            CQ Health by Nationality Group
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={nationalityGroups}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="group" className="text-xs" />
              <YAxis domain={[0, 100]} className="text-xs" />
              <Tooltip />
              <Legend />
              <Bar dataKey="cqHealth"    name="CQ Health"   fill="hsl(168, 55%, 38%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="friction"    name="Friction"    fill="hsl(28, 80%, 55%)"  radius={[4, 4, 0, 0]} />
              <Bar dataKey="confidence"  name="Confidence"  fill="hsl(200, 60%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CQ & Confidence Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" className="text-xs" />
                <Radar name="CQ Health"  dataKey="CQ"         stroke="hsl(168, 55%, 38%)" fill="hsl(168, 55%, 38%)" fillOpacity={0.25} />
                <Radar name="Confidence" dataKey="Confidence" stroke="hsl(200, 60%, 50%)" fill="hsl(200, 60%, 50%)" fillOpacity={0.15} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Staff distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Staff Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {nationalityGroups.map((n) => {
              const pct = Math.round((n.staff / total) * 100);
              return (
                <div key={n.group} className="flex items-center gap-3">
                  <span className="text-sm w-28 shrink-0">{n.group}</span>
                  <Progress value={pct} className="h-2 flex-1" />
                  <span className="text-sm text-muted-foreground w-20 text-right">{n.staff} ({pct}%)</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* At-risk by group */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              At-Risk % by Nationality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {nationalityGroups.map((n) => (
              <div key={n.group} className="flex items-center gap-3">
                <span className="text-sm w-28 shrink-0">{n.group}</span>
                <Progress value={n.atRisk} className="h-2 flex-1" />
                <Badge variant={n.atRisk >= 20 ? "destructive" : "secondary"} className="text-xs w-12 justify-center">
                  {n.atRisk}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top friction issues */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Cross-Cultural Friction Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {topFrictionIssues.map((item) => (
              <div key={item.issue} className="flex items-center justify-between gap-3">
                <span className="text-sm flex-1">{item.issue}</span>
                <span className="text-xs text-muted-foreground shrink-0">{item.count} reports</span>
                <Badge variant={item.severity >= 3.5 ? "destructive" : "secondary"} className="text-xs w-10 justify-center">
                  {item.severity.toFixed(1)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
