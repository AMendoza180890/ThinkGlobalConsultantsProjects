import { useSchoolContext } from "@/hooks/useSchoolContext";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";
import { Heart, TrendingUp, Users, Shield, Sparkles, GraduationCap } from "lucide-react";
import { MetricDrilldownFilter, useMetricDrilldown } from "@/components/MetricDrilldownFilter";
import { buildFrictionChartData, buildWinsChartData, DRILLDOWN_COLORS, applyPeriodOffset } from "@/lib/mockDrilldownData";
import { TimePeriodSelector, type TimePeriod } from "@/components/TimePeriodSelector";

type SchoolLevel = "all" | "primary" | "secondary" | "high";

interface LevelData {
  label: string;
  climate: { belonging: number; safety: number; inclusion: number; communication: number; culturalAwareness: number };
  trend: Array<{ month: string; belonging: number; safety: number; inclusion: number; communication: number }>;
  highlights: Array<{ label: string; score: number }>;
  feedback: Array<{ theme: string; count: number; sentiment: string }>;
}

const dataByLevel: Record<SchoolLevel, LevelData> = {
  all: {
    label: "All Levels",
    climate: { belonging: 78, safety: 82, inclusion: 74, communication: 68, culturalAwareness: 72 },
    trend: [
      { month: "Sep", belonging: 65, safety: 70, inclusion: 60, communication: 55 },
      { month: "Oct", belonging: 68, safety: 72, inclusion: 63, communication: 58 },
      { month: "Nov", belonging: 72, safety: 75, inclusion: 68, communication: 62 },
      { month: "Dec", belonging: 74, safety: 78, inclusion: 70, communication: 65 },
      { month: "Jan", belonging: 75, safety: 80, inclusion: 72, communication: 66 },
      { month: "Feb", belonging: 77, safety: 81, inclusion: 73, communication: 67 },
      { month: "Mar", belonging: 78, safety: 82, inclusion: 74, communication: 68 },
    ],
    highlights: [
      { label: "Parents feel their child is culturally understood", score: 81 },
      { label: "Parents trust teacher communication", score: 76 },
      { label: "Parents feel welcomed at school events", score: 85 },
      { label: "Parents feel comfortable raising concerns", score: 70 },
      { label: "Parents see diverse perspectives valued", score: 73 },
    ],
    feedback: [
      { theme: "More multilingual communications", count: 24, sentiment: "suggestion" },
      { theme: "Appreciate cultural events", count: 18, sentiment: "positive" },
      { theme: "Want more parent-teacher connection", count: 15, sentiment: "suggestion" },
      { theme: "Feel included in school decisions", count: 12, sentiment: "positive" },
      { theme: "Need better conflict resolution", count: 8, sentiment: "concern" },
    ],
  },
  primary: {
    label: "Primary (K–5)",
    climate: { belonging: 85, safety: 88, inclusion: 80, communication: 75, culturalAwareness: 78 },
    trend: [
      { month: "Sep", belonging: 72, safety: 76, inclusion: 68, communication: 62 },
      { month: "Oct", belonging: 75, safety: 78, inclusion: 71, communication: 65 },
      { month: "Nov", belonging: 78, safety: 82, inclusion: 74, communication: 68 },
      { month: "Dec", belonging: 80, safety: 84, inclusion: 76, communication: 70 },
      { month: "Jan", belonging: 82, safety: 86, inclusion: 78, communication: 72 },
      { month: "Feb", belonging: 84, safety: 87, inclusion: 79, communication: 74 },
      { month: "Mar", belonging: 85, safety: 88, inclusion: 80, communication: 75 },
    ],
    highlights: [
      { label: "Parents feel their child is culturally understood", score: 88 },
      { label: "Parents trust teacher communication", score: 82 },
      { label: "Parents feel welcomed at school events", score: 90 },
      { label: "Parents feel comfortable raising concerns", score: 78 },
      { label: "Parents see diverse perspectives valued", score: 80 },
    ],
    feedback: [
      { theme: "Love the multicultural story time", count: 14, sentiment: "positive" },
      { theme: "More translation for take-home materials", count: 10, sentiment: "suggestion" },
      { theme: "Appreciate diverse holiday celebrations", count: 12, sentiment: "positive" },
      { theme: "Want more cultural awareness activities", count: 8, sentiment: "suggestion" },
      { theme: "Some playground exclusion concerns", count: 5, sentiment: "concern" },
    ],
  },
  secondary: {
    label: "Secondary (6–8)",
    climate: { belonging: 72, safety: 78, inclusion: 68, communication: 62, culturalAwareness: 66 },
    trend: [
      { month: "Sep", belonging: 60, safety: 66, inclusion: 55, communication: 50 },
      { month: "Oct", belonging: 62, safety: 68, inclusion: 58, communication: 52 },
      { month: "Nov", belonging: 65, safety: 71, inclusion: 61, communication: 55 },
      { month: "Dec", belonging: 67, safety: 73, inclusion: 63, communication: 57 },
      { month: "Jan", belonging: 69, safety: 75, inclusion: 65, communication: 59 },
      { month: "Feb", belonging: 71, safety: 77, inclusion: 67, communication: 61 },
      { month: "Mar", belonging: 72, safety: 78, inclusion: 68, communication: 62 },
    ],
    highlights: [
      { label: "Parents feel their child is culturally understood", score: 74 },
      { label: "Parents trust teacher communication", score: 70 },
      { label: "Parents feel welcomed at school events", score: 78 },
      { label: "Parents feel comfortable raising concerns", score: 65 },
      { label: "Parents see diverse perspectives valued", score: 68 },
    ],
    feedback: [
      { theme: "More communication about social dynamics", count: 12, sentiment: "suggestion" },
      { theme: "Appreciate diversity in curriculum", count: 8, sentiment: "positive" },
      { theme: "Bullying around cultural differences", count: 10, sentiment: "concern" },
      { theme: "Want more parent involvement opportunities", count: 9, sentiment: "suggestion" },
      { theme: "Happy with advisory program", count: 6, sentiment: "positive" },
    ],
  },
  high: {
    label: "High School (9–12)",
    climate: { belonging: 68, safety: 74, inclusion: 65, communication: 58, culturalAwareness: 62 },
    trend: [
      { month: "Sep", belonging: 55, safety: 62, inclusion: 52, communication: 45 },
      { month: "Oct", belonging: 58, safety: 64, inclusion: 54, communication: 48 },
      { month: "Nov", belonging: 61, safety: 67, inclusion: 57, communication: 50 },
      { month: "Dec", belonging: 63, safety: 69, inclusion: 59, communication: 52 },
      { month: "Jan", belonging: 65, safety: 71, inclusion: 62, communication: 54 },
      { month: "Feb", belonging: 67, safety: 73, inclusion: 64, communication: 56 },
      { month: "Mar", belonging: 68, safety: 74, inclusion: 65, communication: 58 },
    ],
    highlights: [
      { label: "Parents feel their child is culturally understood", score: 70 },
      { label: "Parents trust teacher communication", score: 65 },
      { label: "Parents feel welcomed at school events", score: 72 },
      { label: "Parents feel comfortable raising concerns", score: 60 },
      { label: "Parents see diverse perspectives valued", score: 64 },
    ],
    feedback: [
      { theme: "Need more college-prep equity support", count: 15, sentiment: "suggestion" },
      { theme: "Appreciate multicultural clubs", count: 10, sentiment: "positive" },
      { theme: "Communication gaps about student progress", count: 12, sentiment: "concern" },
      { theme: "Want culturally responsive counseling", count: 9, sentiment: "suggestion" },
      { theme: "Students feel safe to express identity", count: 7, sentiment: "positive" },
    ],
  },
};

const levelCohortNames = ["Primary (K–5)", "Secondary (6–8)", "High School (9–12)"];

const defaultComparisonChart = Object.entries(dataByLevel)
  .filter(([key]) => key !== "all")
  .map(([, data]) => ({
    name: data.label,
    Belonging: data.climate.belonging,
    Safety: data.climate.safety,
    Inclusion: data.climate.inclusion,
    Communication: data.climate.communication,
  }));

const climateIcons: Record<string, React.ElementType> = {
  belonging: Heart,
  safety: Shield,
  inclusion: Users,
  communication: TrendingUp,
  culturalAwareness: Sparkles,
};

export default function ParentDashboard() {
  const { selectedSchool } = useSchoolContext();
  const [level, setLevel] = useState<SchoolLevel>("all");
  const data = dataByLevel[level];
  const { drilldown, setDrilldown } = useMetricDrilldown();
  const [period, setPeriod] = useState<TimePeriod>("full-year");

  const hasFrictionFilter = drilldown.selectedFrictionIds.length > 0;
  const hasWinsFilter = drilldown.selectedWinIds.length > 0;
  const isFiltered = hasFrictionFilter || hasWinsFilter;

  const comparisonData = useMemo(() => {
    if (hasFrictionFilter) return buildFrictionChartData(levelCohortNames, drilldown.selectedFrictionIds, period);
    if (hasWinsFilter) return buildWinsChartData(levelCohortNames, drilldown.selectedWinIds, period);
    return Object.entries(dataByLevel)
      .filter(([key]) => key !== "all")
      .map(([, d]) => ({
        name: d.label,
        Belonging: applyPeriodOffset(d.climate.belonging, d.label, "belonging", period),
        Safety: applyPeriodOffset(d.climate.safety, d.label, "safety", period),
        Inclusion: applyPeriodOffset(d.climate.inclusion, d.label, "inclusion", period),
        Communication: applyPeriodOffset(d.climate.communication, d.label, "communication", period),
      }));
  }, [drilldown.selectedFrictionIds, drilldown.selectedWinIds, hasFrictionFilter, hasWinsFilter, period]);

  const dataKeys = useMemo(() => {
    if (!isFiltered) return ["Belonging", "Safety", "Inclusion", "Communication"];
    if (comparisonData.length === 0) return [];
    return Object.keys(comparisonData[0]).filter((k) => k !== "name");
  }, [comparisonData, isFiltered]);

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-6">
        <h1 className="font-sans text-3xl font-semibold">Parent Dashboard</h1>
        <p className="text-muted-foreground">{selectedSchool?.name ?? "Select a school"} — School climate from the parent perspective</p>
      </div>

      <Tabs value={level} onValueChange={(v) => setLevel(v as SchoolLevel)} className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Levels</TabsTrigger>
          <TabsTrigger value="primary" className="gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Primary (K–5)</TabsTrigger>
          <TabsTrigger value="secondary" className="gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Secondary (6–8)</TabsTrigger>
          <TabsTrigger value="high" className="gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> High School (9–12)</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-5 mb-8">
        {Object.entries(data.climate).map(([key, value]) => {
          const Icon = climateIcons[key] || Heart;
          const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
          return (
            <Card key={key}>
              <CardContent className="pt-6 text-center">
                <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}%</p>
                <Progress value={value} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {level === "all" && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">
              {isFiltered ? (hasFrictionFilter ? "Friction Issue Comparison" : "CQ Wins Comparison") : "Climate Scores by School Level"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MetricDrilldownFilter value={drilldown} onChange={setDrilldown} />
            <div className="flex items-center justify-between mb-4">
              <TimePeriodSelector value={period} onChange={setPeriod} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip />
                <Legend />
                {dataKeys.map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={isFiltered
                      ? DRILLDOWN_COLORS[i % DRILLDOWN_COLORS.length]
                      : ["hsl(340, 65%, 55%)", "hsl(168, 55%, 38%)", "hsl(200, 60%, 50%)", "hsl(28, 80%, 55%)"][i]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Climate Trends — {data.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis domain={[40, 100]} className="text-xs" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="belonging" stroke="hsl(340, 65%, 55%)" strokeWidth={2} />
              <Line type="monotone" dataKey="safety" stroke="hsl(168, 55%, 38%)" strokeWidth={2} />
              <Line type="monotone" dataKey="inclusion" stroke="hsl(200, 60%, 50%)" strokeWidth={2} />
              <Line type="monotone" dataKey="communication" stroke="hsl(28, 80%, 55%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parent Satisfaction — {data.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.highlights.map((h) => (
              <div key={h.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{h.label}</span>
                  <span className="font-medium">{h.score}%</span>
                </div>
                <Progress value={h.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Feedback — {data.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.feedback.map((f) => (
              <div key={f.theme} className="flex items-center justify-between gap-2">
                <span className="text-sm flex-1">{f.theme}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={f.sentiment === "concern" ? "destructive" : f.sentiment === "positive" ? "default" : "secondary"}>
                    {f.sentiment}
                  </Badge>
                  <span className="text-xs text-muted-foreground">×{f.count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
