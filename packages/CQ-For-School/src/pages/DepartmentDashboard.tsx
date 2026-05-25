import { useSchoolContext } from "@/hooks/useSchoolContext";
import { useDemographicBreakdown } from "@/hooks/useDemographicBreakdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building2, Sparkles, LayoutGrid, Columns, Loader2, DatabaseZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { FRICTION_ISSUES } from "@/lib/data";
import { INTERVENTION_LIBRARY } from "@/data/interventionLibrary";

const METRIC_ROWS = [
  { label: "CQ Health Score", hint: "" },
  { label: "Friction Level", hint: "1–5" },
  { label: "Confidence Level", hint: "1–5" },
  { label: "CQ Wins Score", hint: "%" },
  { label: "Risk Driver", hint: "" },
  { label: "Recommended", hint: "" },
];

export default function DepartmentDashboard() {
  const { selectedSchool } = useSchoolContext();
  const { cohorts, isLoading, hasData } = useDemographicBreakdown("department");

  const getInterventionForIssue = (description: string) => {
    const issue = FRICTION_ISSUES.find((fi) => fi.description === description);
    if (!issue) return null;
    return INTERVENTION_LIBRARY.find((int) => int.targetSubItems.includes(issue.id));
  };

  const healthColor = (score: number) =>
    score < 50 ? "text-destructive" : score > 70 ? "text-emerald-500" : "text-amber-500";

  const worstCohort = hasData
    ? cohorts.reduce((prev, curr) => (prev.frictionScale > curr.frictionScale ? prev : curr))
    : null;

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-lg">Loading department data...</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="container max-w-7xl py-10">
        <div className="mb-8">
          <h1 className="font-sans text-4xl font-semibold tracking-tight">Department Matrix</h1>
          <p className="text-muted-foreground text-lg mt-1">{selectedSchool?.name ?? "Select a school"} — Comparative analysis across academic departments</p>
        </div>
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <DatabaseZap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">No data yet</h2>
            <p className="text-muted-foreground max-w-md">
              Teachers need to complete their <strong>profile setup</strong> (department) and submit at least one survey for data to appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-10 fade-in">
      <div className="mb-8">
        <h1 className="font-sans text-4xl font-semibold tracking-tight">Department Matrix</h1>
        <p className="text-muted-foreground text-lg mt-1">
          {selectedSchool?.name ?? "Select a school"} — Comparative analysis across academic departments
        </p>
      </div>

      {worstCohort && (
        <Card className="mb-10 overflow-hidden border-none shadow-lg relative bg-gradient-to-br from-primary/10 via-background to-primary/5">
          <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-2">Executive Insight</h2>
              <p className="text-muted-foreground text-[17px] leading-relaxed max-w-4xl">
                Alert: Teachers in the{" "}
                <span className="font-semibold text-foreground italic">{worstCohort.label}</span> department
                are reporting Friction severely above the school average{" "}
                <span className="font-bold text-destructive">({worstCohort.frictionScale.toFixed(1)}/5)</span>,
                primarily driven by{" "}
                <span className="font-medium text-foreground">"{worstCohort.topIssue}"</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="grid">
        <TabsList className="mb-6">
          <TabsTrigger value="grid" className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> Grid Cards</TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2"><Columns className="h-4 w-4" /> Matrix Columns</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cohorts.map((dept) => {
              const intervention = getInterventionForIssue(dept.topIssue);
              const isWorst = dept === worstCohort;
              return (
                <Card key={dept.label} className={cn("relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300", isWorst && "border-destructive/40 shadow-destructive/10")}>
                  {isWorst && <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />}
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg"><Building2 className="h-5 w-5 text-primary" /></div>
                      <Badge variant="outline" className="font-medium bg-background">{dept.teacherCount} teachers</Badge>
                    </div>
                    <CardTitle className="text-xl">{dept.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">CQ Health Score</p>
                      <p className={cn("text-6xl font-black tracking-tighter", healthColor(dept.avgNSM))}>{dept.avgNSM}</p>
                    </div>
                    <div className="space-y-4 pt-5 border-t">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5 font-medium"><span className="text-muted-foreground">Friction Level</span><span className="text-destructive font-bold">{dept.frictionScale.toFixed(1)} <span className="text-muted-foreground font-normal">/ 5</span></span></div>
                        <Progress value={(dept.frictionScale / 5) * 100} className="h-1.5 [&>div]:bg-destructive bg-destructive/20" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1.5 font-medium"><span className="text-muted-foreground">Confidence Level</span><span className="text-emerald-500 font-bold">{dept.confidenceScale.toFixed(1)} <span className="text-muted-foreground font-normal">/ 5</span></span></div>
                        <Progress value={(dept.confidenceScale / 5) * 100} className="h-1.5 [&>div]:bg-emerald-500 bg-emerald-500/20" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1.5 font-medium"><span className="text-muted-foreground">CQ Wins Score</span><span className="text-primary font-bold">{dept.winsScore}%</span></div>
                        <Progress value={dept.winsScore} className="h-1.5" />
                      </div>
                    </div>
                    <div className="pt-5 border-t bg-muted/20 -mx-6 -mb-6 p-6 space-y-3">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Primary Risk Driver</p>
                      <p className="text-sm font-semibold leading-tight">{dept.topIssue}</p>
                      {intervention && (
                        <div className="mt-4 p-3.5 bg-background shadow-sm rounded-lg border border-primary/20 group-hover:border-primary/50 transition-colors">
                          <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1.5 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Recommended</p>
                          <p className="text-xs font-semibold leading-relaxed">{intervention.title}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <div className="flex gap-0 overflow-x-auto pb-4 rounded-xl border border-border">
            <div className="flex flex-col shrink-0 w-40 sticky left-0 z-10 bg-background border-r border-border">
              <div className="h-[72px] border-b border-border px-4 flex items-center">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Metric</p>
              </div>
              {METRIC_ROWS.map(({ label, hint }) => (
                <div key={label} className="flex items-center h-16 border-b last:border-b-0 px-4">
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
                    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
                  </div>
                </div>
              ))}
            </div>
            {cohorts.map((dept, idx) => {
              const intervention = getInterventionForIssue(dept.topIssue);
              const isLast = idx === cohorts.length - 1;
              const isWorst = dept === worstCohort;
              return (
                <div key={dept.label} className={cn("flex flex-col shrink-0 w-52 transition-all duration-300 hover:bg-muted/20", !isLast && "border-r border-border", isWorst && "bg-destructive/5")}>
                  <div className={cn("h-[72px] border-b border-border px-5 flex flex-col justify-center gap-1", isWorst && "border-t-2 border-t-destructive")}>
                    <p className="font-bold text-sm tracking-tight leading-tight">{dept.label}</p>
                    <Badge variant="outline" className="w-fit text-[10px] font-medium px-1.5">{dept.teacherCount} teachers</Badge>
                  </div>
                  <div className="flex items-center justify-center h-16 border-b border-border px-5">
                    <p className={cn("text-3xl font-black tracking-tighter", healthColor(dept.avgNSM))}>{dept.avgNSM}</p>
                  </div>
                  <div className="flex flex-col justify-center h-16 border-b border-border px-5 space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-destructive font-bold">{dept.frictionScale.toFixed(1)}</span><span className="text-muted-foreground">/ 5</span></div>
                    <Progress value={(dept.frictionScale / 5) * 100} className="h-1 [&>div]:bg-destructive bg-destructive/20" />
                  </div>
                  <div className="flex flex-col justify-center h-16 border-b border-border px-5 space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-emerald-500 font-bold">{dept.confidenceScale.toFixed(1)}</span><span className="text-muted-foreground">/ 5</span></div>
                    <Progress value={(dept.confidenceScale / 5) * 100} className="h-1 [&>div]:bg-emerald-500 bg-emerald-500/20" />
                  </div>
                  <div className="flex flex-col justify-center h-16 border-b border-border px-5 space-y-1.5">
                    <span className="text-primary font-bold text-xs">{dept.winsScore}%</span>
                    <Progress value={dept.winsScore} className="h-1" />
                  </div>
                  <div className="flex items-center h-16 border-b border-border px-5">
                    <p className="text-xs font-semibold leading-tight line-clamp-2">{dept.topIssue}</p>
                  </div>
                  <div className="flex items-center h-16 px-5">
                    {intervention ? <p className="text-xs text-primary font-semibold leading-tight line-clamp-2">{intervention.title}</p> : <p className="text-xs text-muted-foreground italic">—</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
