import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { useSchoolData } from "@/hooks/useSchoolData";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSettings, saveAdminSettings } from "@/lib/data";
import { ClipboardList, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardTabs from "@/components/DashboardTabs";

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { id: "all",              label: "All Issues" },
  { id: "teacher-teacher",  label: "Teacher → Teacher" },
  { id: "teacher-parents",  label: "Teacher → Parent" },
  { id: "teacher-admin",    label: "Teacher → Admin" },
] as const;

type FilterId = typeof FILTER_TABS[number]["id"];

export default function AdminDashboard() {
  const { selectedSchool } = useSchoolContext();
  const [settings, setSettings] = useState(getAdminSettings);
  const [searchParams] = useSearchParams();
  const initialFilter = (searchParams.get("filter") as FilterId | null) ?? "all";
  const [activeFilter, setActiveFilter] = useState<FilterId>(initialFilter);

  const data = useSchoolData("all-time");
  const {
    scores, insights, trends, frictionBreakdown, confidenceBreakdown, winsTrend,
    lastWeek, wow, cumulative, streak, topImproved, lastWeekFriction, wowFriction,
    cumulativeFriction, lastWeekWins, cumulativeWins, bestWinsWeek,
    isLoading: dataLoading, isMockData,
    frictionCount, winsCount, surveyCount, avgSeverity, avgConfidenceRating,
    rawSurveyResponses,
  } = data;

  // Filter responses by interaction type when not "all"
  const filteredResponses = activeFilter === "all"
    ? rawSurveyResponses
    : rawSurveyResponses.filter((r: any) => r.interactionType === activeFilter);

  const handleSettingChange = (key: "hourlyCost" | "adoptionFactor" | "totalTeachers", value: string) => {
    const num = parseFloat(value) || 0;
    const updated = { ...settings, [key]: num };
    setSettings(updated);
    saveAdminSettings(updated);
  };

  const exportCSV = () => {
    const header = "Issue,Severity Avg,Hours Avg,CQ Lesson,Tip,Friction Reduction %,Hours Saved,Money Saved/wk\n";
    const rows = insights.map((i) =>
      `"${i.issueDescription}",${i.severityAvg},${i.hoursAvg},"${i.cqLessonName}","${i.tip}",${i.predictedFrictionReduction}%,${i.predictedHoursSaved},$${i.predictedMoneySaved.toFixed(2)}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cq-impact-report.csv";
    a.click();
  };

  return (
    <div key={selectedSchool?.id ?? "no-school"} className="flex flex-col min-h-0">
      {/* Page header */}
      <div className="border-b bg-background">
        <div className="px-6 pt-8 pb-0">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-7 w-7 text-primary shrink-0" />
            <div>
              <h1 className="font-sans text-3xl font-semibold leading-tight">Weekly Frictions</h1>
              <p className="text-muted-foreground text-sm mt-1">Staff-reported friction themes, reviewed and acted on each week.</p>
            </div>
          </div>
          {/* Filter tabs */}
          <div className="flex gap-0 -mb-px overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  "inline-flex items-center px-4 py-2.5 text-sm font-sans border-b-2 transition-colors whitespace-nowrap",
                  activeFilter === tab.id
                    ? "border-foreground font-semibold text-foreground"
                    : "border-transparent font-normal text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-6 pb-6">
        {dataLoading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Loading survey data…</p>
            </div>
          </div>
        ) : !isMockData && scores.nsm === 0 && cumulative.issuesReported === 0 ? (
          <Card className="mb-8 border-dashed">
            <CardContent className="py-16 flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-full bg-muted w-fit">
                <ClipboardList className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold mb-1">No survey data yet</p>
                <p className="text-sm text-muted-foreground max-w-sm">Share the join link with staff to start collecting responses. Data will appear here once the first survey is submitted.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DashboardTabs
            scores={scores}
            insights={insights}
            trends={trends}
            frictionBreakdown={frictionBreakdown}
            confidenceBreakdown={confidenceBreakdown}
            winsTrend={winsTrend}
            lastWeek={lastWeek}
            wow={wow}
            cumulative={cumulative}
            streak={streak}
            topImproved={topImproved}
            lastWeekFriction={lastWeekFriction}
            wowFriction={wowFriction}
            cumulativeFriction={cumulativeFriction}
            lastWeekWins={lastWeekWins}
            cumulativeWins={cumulativeWins}
            bestWinsWeek={bestWinsWeek}
            frictionCount={activeFilter === "all" ? frictionCount : filteredResponses.length}
            winsCount={winsCount}
            surveyCount={surveyCount}
            avgSeverity={activeFilter === "all" ? avgSeverity : (
              filteredResponses.length > 0
                ? Math.round((filteredResponses.reduce((s: number, r: any) => s + r.severity, 0) / filteredResponses.length) * 10) / 10
                : 0
            )}
            avgConfidenceRating={avgConfidenceRating}
            settings={settings}
            onSettingChange={handleSettingChange}
            onExportCSV={exportCSV}
            rawSurveyResponses={filteredResponses}
            activeFilter={activeFilter}
            filterTabs={FILTER_TABS}
            onFilterChange={(id) => setActiveFilter(id as FilterId)}
          />
        )}
      </div>
    </div>
  );
}
