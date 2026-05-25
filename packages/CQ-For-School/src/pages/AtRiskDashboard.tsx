import { useState } from "react";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { useSchoolData, DateFilter } from "@/hooks/useSchoolData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingDown, Clock, Sparkles, BarChart3, CalendarDays, ShieldAlert } from "lucide-react";
import { getAdminSettings } from "@/lib/data";
import { INTERVENTION_LIBRARY } from "@/data/interventionLibrary";
import { cn } from "@/lib/utils";

export default function AtRiskDashboard() {
  const { selectedSchool } = useSchoolContext();
  const [dateFilter, setDateFilter] = useState<DateFilter>("last-month");

  const data = useSchoolData(dateFilter);
  const settings = getAdminSettings();

  const { insights, rawSurveyResponses, surveyCount } = data;

  const highFrictionSignals = rawSurveyResponses
    ? rawSurveyResponses.filter((r) => r.severity >= 4).length
    : 0;
  const atRiskPct =
    rawSurveyResponses && rawSurveyResponses.length > 0
      ? Math.round((highFrictionSignals / rawSurveyResponses.length) * 100)
      : 0;

  const topIssue = insights[0] ?? null;

  // Match top friction issues to interventions dynamically
  const dynamicRecs = insights.slice(0, 4).map((insight) => {
    const intervention = INTERVENTION_LIBRARY.find((int) =>
      int.targetSubItems.some((subId) =>
        insight.issueId.startsWith(subId) || subId.startsWith(insight.issueId)
      )
    );
    return {
      issueDescription: insight.issueDescription,
      severityAvg: insight.severityAvg,
      intervention,
    };
  });

  const avgSev = data.avgSeverity;
  const avgSevColor =
    avgSev >= 4 ? "text-destructive" : avgSev >= 3 ? "text-amber-500" : "text-emerald-500";

  const statCards = [
    {
      label: "Total Staff",
      value: settings.totalTeachers,
      icon: Clock,
      sub: "Configured in settings",
      color: "text-foreground",
      border: "",
    },
    {
      label: "High-Friction Reports",
      value: highFrictionSignals,
      icon: AlertTriangle,
      sub: `${atRiskPct}% of submissions`,
      color: "text-destructive",
      border: "border-destructive/30",
    },
    {
      label: "Avg Friction (1–5)",
      value: avgSev,
      icon: TrendingDown,
      sub: "Across all staff",
      color: avgSevColor,
      border: avgSev >= 4 ? "border-destructive/30" : avgSev >= 3 ? "border-amber-500/30" : "",
    },
    {
      label: "Survey Submissions",
      value: surveyCount,
      icon: BarChart3,
      sub: "In selected period",
      color: "text-foreground",
      border: "",
    },
  ];

  return (
    <div className="container max-w-7xl py-10 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-4xl font-semibold tracking-tight">At-Risk Overview</h1>
          <p className="text-muted-foreground text-lg mt-1">
            {selectedSchool?.name ?? "Select a school"} — Risk signals and CQ recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-week">Last Week</SelectItem>
              <SelectItem value="last-2-weeks">Last 2 Weeks</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="semester">This Semester</SelectItem>
              <SelectItem value="school-year">School Year</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Executive Alert Banner */}
      {topIssue && (
        <Card className="mb-10 overflow-hidden border-none shadow-lg relative bg-gradient-to-br from-destructive/10 via-background to-destructive/5">
          <div className="absolute top-0 right-0 p-32 bg-destructive/15 blur-[100px] rounded-full pointer-events-none" />
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-destructive/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-2">Executive Alert</h2>
              <p className="text-muted-foreground text-[17px] leading-relaxed max-w-4xl">
                <span className="font-bold text-destructive">{highFrictionSignals} high-friction report{highFrictionSignals !== 1 ? "s" : ""}</span> detected this period.
                The top driver is <span className="font-semibold text-foreground">"{topIssue.issueDescription}"</span>{" "}
                with an average severity of{" "}
                <span className={cn("font-bold", topIssue.severityAvg >= 4 ? "text-destructive" : "text-amber-500")}>
                  {topIssue.severityAvg}/5
                </span>. Immediate intervention is recommended.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-10">
        {statCards.map(({ label, value, icon: Icon, sub, color, border }) => (
          <Card key={label} className={cn("transition-all duration-200 hover:shadow-md", border && `border ${border}`)}>
            <CardContent className="pt-6 pb-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
                <Icon className={cn("h-4 w-4", color)} />
              </div>
              <p className={cn("text-5xl font-black tracking-tighter leading-none mb-1", color)}>{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-10">
        {/* Top Friction Issues */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-destructive" />
              Top Friction Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No issues reported in this timeframe.</p>
            ) : (
              insights.slice(0, 5).map((item, i) => (
                <div key={item.issueId} className="flex items-center gap-3 group">
                  <span className="text-xs font-black text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold leading-tight">{item.issueDescription}</p>
                      <Badge
                        variant={item.severityAvg >= 4 ? "destructive" : "secondary"}
                        className="text-xs ml-2 shrink-0"
                      >
                        {item.severityAvg}/5
                      </Badge>
                    </div>
                    <Progress
                      value={(item.severityAvg / 5) * 100}
                      className={cn(
                        "h-1.5",
                        item.severityAvg >= 4 ? "[&>div]:bg-destructive bg-destructive/20" :
                        item.severityAvg >= 3 ? "[&>div]:bg-amber-500 bg-amber-500/20" :
                        "[&>div]:bg-emerald-500 bg-emerald-500/20"
                      )}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* CQ Recommendations — dynamically matched */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              CQ-Driven Interventions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dynamicRecs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recommendations available yet.</p>
            ) : (
              dynamicRecs.map(({ issueDescription, severityAvg, intervention }, i) => (
                <div key={i} className="p-4 rounded-xl border bg-background space-y-2 hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold leading-tight flex-1">
                      {intervention?.title ?? "Review friction signals"}
                    </p>
                    <Badge
                      variant={severityAvg >= 4 ? "destructive" : "secondary"}
                      className="text-[10px] shrink-0"
                    >
                      {severityAvg >= 4 ? "High" : "Medium"}
                    </Badge>
                  </div>
                  {intervention && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{intervention.description}</p>
                  )}
                  <p className="text-xs text-primary font-medium">Targets: {issueDescription}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
