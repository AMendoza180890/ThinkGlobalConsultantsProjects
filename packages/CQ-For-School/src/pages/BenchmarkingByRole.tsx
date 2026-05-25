import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts";
import { Trophy, Globe, MapPin, Target } from "lucide-react";

const benchmarkData = [
  { metric: "CQ Health Score", yourSchool: 62, district: 55, regional: 52, national: 50 },
  { metric: "Friction", yourSchool: 42, district: 48, regional: 52, national: 55 },
  { metric: "Confidence", yourSchool: 68, district: 60, regional: 58, national: 56 },
  { metric: "CQ Wins", yourSchool: 58, district: 50, regional: 48, national: 45 },
  { metric: "Belonging", yourSchool: 75, district: 68, regional: 65, national: 62 },
];

const trendComparison = [
  { month: "Sep", yourSchool: 45, district: 48, regional: 50 },
  { month: "Oct", yourSchool: 48, district: 49, regional: 50 },
  { month: "Nov", yourSchool: 52, district: 50, regional: 51 },
  { month: "Dec", yourSchool: 55, district: 51, regional: 51 },
  { month: "Jan", yourSchool: 58, district: 53, regional: 52 },
  { month: "Feb", yourSchool: 60, district: 54, regional: 52 },
  { month: "Mar", yourSchool: 62, district: 55, regional: 52 },
];

const percentileRanks = [
  { metric: "Overall CQ Health", percentile: 72 },
  { metric: "Friction Reduction", percentile: 85 },
  { metric: "Confidence Growth", percentile: 68 },
  { metric: "CQ Wins Adoption", percentile: 78 },
  { metric: "Teacher Retention", percentile: 65 },
];

const topSchools = [
  { rank: 1, name: "Lincoln Academy", nsm: 78, region: "Northeast" },
  { rank: 2, name: "Riverside Prep", nsm: 75, region: "West" },
  { rank: 3, name: "Your School", nsm: 62, region: "Southeast", isYou: true },
  { rank: 4, name: "Oak Park School", nsm: 60, region: "Midwest" },
  { rank: 5, name: "Harbor View", nsm: 58, region: "West" },
];

const roleBreakdown = [
  { role: "Classroom Teacher", cqHealth: 64, friction: 40, confidence: 70 },
  { role: "Head of Dept", cqHealth: 68, friction: 35, confidence: 74 },
  { role: "Assistant Principal", cqHealth: 72, friction: 28, confidence: 78 },
  { role: "Principal", cqHealth: 75, friction: 25, confidence: 80 },
  { role: "Support Staff", cqHealth: 55, friction: 50, confidence: 62 },
];

export default function BenchmarkingByRole() {
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

      {/* Role Breakdown Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            CQ Health by Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roleBreakdown}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="role" className="text-xs" />
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

      {/* Benchmark vs Peers */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Your School vs. Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={benchmarkData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="metric" className="text-xs" />
              <YAxis domain={[0, 100]} className="text-xs" />
              <Tooltip />
              <Legend />
              <Bar dataKey="yourSchool" name="Your School" fill="hsl(168, 55%, 38%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="district" name="District Avg" fill="hsl(200, 60%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="regional" name="Regional Avg" fill="hsl(28, 80%, 55%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="national" name="National Avg" fill="hsl(260, 50%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* CQ Health Trend */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            CQ Health Trend vs. Peers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendComparison}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis domain={[30, 80]} className="text-xs" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="yourSchool" name="Your School" stroke="hsl(168, 55%, 38%)" strokeWidth={3} />
              <Line type="monotone" dataKey="district" name="District" stroke="hsl(200, 60%, 50%)" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="regional" name="Regional" stroke="hsl(28, 80%, 55%)" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              Regional Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topSchools.map((school) => (
              <div
                key={school.rank}
                className={`flex items-center justify-between p-2 rounded-lg ${school.isYou ? "bg-primary/10 border border-primary/20" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6">#{school.rank}</span>
                  <div>
                    <p className="text-sm font-medium">
                      {school.name}
                      {school.isYou && <Badge variant="default" className="ml-2 text-[10px]">You</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {school.region}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold">{school.nsm}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="font-medium text-primary">Above Average</p>
              <p className="text-muted-foreground mt-1">Your school's CQ Health Score is 20% higher than the national average, driven by strong CQ wins adoption.</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <p className="font-medium text-accent">Fastest Improvement</p>
              <p className="text-muted-foreground mt-1">Your friction reduction rate is in the 85th percentile — one of the fastest improving schools in the region.</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary border">
              <p className="font-medium">Opportunity</p>
              <p className="text-muted-foreground mt-1">Support Staff show the highest friction scores. Consider targeted CQ workshops for this group.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
