import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, CheckCircle2, XCircle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import type { DomainRiskAssessment, EvidenceArtifact, RiskLevel } from "@/lib/accreditation";
import { DOCUMENT_ONLY_DOMAIN_IDS } from "@/lib/accreditation";
import type { SurveyResponse } from "@/lib/data";
import { useState } from "react";
import InterventionsTab from "./InterventionsTab";
import DepartmentDrilldownTab from "./DepartmentDrilldownTab";

interface StandardDetailPanelProps {
  assessment: DomainRiskAssessment;
  evidence: EvidenceArtifact[];
  sparklineData: Array<{ week: string; score: number }>;
  surveyResponses: SurveyResponse[];
  onClose: () => void;
}

const riskBadgeColor: Record<RiskLevel, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const sparklineColors: Record<RiskLevel, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
};

const riskScoreColor: Record<RiskLevel, string> = {
  high: "text-red-600 dark:text-red-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-emerald-600 dark:text-emerald-400",
};

function getTrendInfo(assessment: DomainRiskAssessment) {
  const { trendDirection } = assessment;
  if (trendDirection === "improving")
    return { icon: <TrendingDown className="h-4 w-4 text-emerald-600" />, label: "Improving" };
  if (trendDirection === "declining")
    return { icon: <TrendingUp className="h-4 w-4 text-red-600" />, label: "Declining" };
  return { icon: <Minus className="h-4 w-4 text-muted-foreground" />, label: "Stable" };
}

export default function StandardDetailPanel({
  assessment,
  evidence,
  sparklineData,
  surveyResponses,
  onClose,
}: StandardDetailPanelProps) {
  const navigate = useNavigate();
  const [includeInReport, setIncludeInReport] = useState(true);

  const score = 100 - assessment.riskScore;
  const color = sparklineColors[assessment.riskLevel];
  const trend = getTrendInfo(assessment);
  const isDocOnly = DOCUMENT_ONLY_DOMAIN_IDS.includes(assessment.domain.id);

  const readyEvidence = evidence.filter((e) => e.generated);
  const missingEvidence = evidence.filter((e) => !e.generated);

  const showInterventions = assessment.riskLevel === "high" || assessment.riskLevel === "medium";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-background border-l shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-mono">
                {assessment.domain.code}
              </Badge>
              <h2 className="text-lg font-semibold text-foreground">
                {assessment.domain.name}
              </h2>
            </div>
            <Badge className={`text-xs border-0 ${riskBadgeColor[assessment.riskLevel]}`}>
              {assessment.riskLevel === "high" ? "High risk" : assessment.riskLevel === "medium" ? "At risk" : "Strong"}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabbed content */}
        <Tabs defaultValue="insights" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-5 mt-3 mb-0">
            <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
            <TabsTrigger value="evidence" className="text-xs">Evidence</TabsTrigger>
            {showInterventions && (
              <TabsTrigger value="interventions" className="text-xs">Interventions</TabsTrigger>
            )}
            <TabsTrigger value="departments" className="text-xs">Departments</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {/* Insights Tab */}
            <TabsContent value="insights" className="mt-0">
              {/* Score & Trend */}
              <div className="p-5 border-b space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Score & Trend
                </h3>
                <div className="flex items-end gap-3">
                  <span className={`text-4xl font-bold leading-none ${riskScoreColor[assessment.riskLevel]}`}>
                    {score}
                  </span>
                  <div className="flex items-center gap-1.5 pb-1 text-sm text-muted-foreground">
                    {trend.icon}
                    <span>{trend.label}</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`panel-grad-${assessment.domain.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke={color}
                      strokeWidth={2}
                      fill={`url(#panel-grad-${assessment.domain.id})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Top Friction Drivers */}
              {(assessment.riskLevel === "high" || assessment.riskLevel === "medium") &&
                assessment.topIssues.length > 0 && (
                  <div className="p-5 border-b space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Top Friction Drivers
                    </h3>
                    <div className="space-y-3">
                      {assessment.topIssues.slice(0, 3).map((issue, i) => {
                        const pct = (issue.severity / 5) * 100;
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-foreground truncate mr-2">{issue.description}</span>
                              <span className="shrink-0 text-xs text-muted-foreground font-medium">
                                {issue.severity}/5
                              </span>
                            </div>
                            <Progress value={pct} className="h-1.5 [&>div]:bg-red-400" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </TabsContent>

            {/* Evidence Tab */}
            <TabsContent value="evidence" className="mt-0">
              <div className="p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Evidence Status
                </h3>

                {isDocOnly ? (
                  <p className="text-sm text-muted-foreground">
                    This standard requires manual document uploads. No auto-compiled survey evidence available.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {readyEvidence.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-foreground">{e.title}</span>
                      </div>
                    ))}
                    {missingEvidence.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="text-muted-foreground">{e.title}</span>
                      </div>
                    ))}
                    {readyEvidence.length === 0 && missingEvidence.length === 0 && (
                      <p className="text-sm text-muted-foreground">No evidence requirements defined.</p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => navigate("/accreditation/evidence")}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Manage evidence →
                </button>
              </div>
            </TabsContent>

            {/* Interventions Tab */}
            {showInterventions && (
              <TabsContent value="interventions" className="mt-0">
                <InterventionsTab
                  assessment={assessment}
                  surveyResponses={surveyResponses}
                />
              </TabsContent>
            )}

            {/* Departments Tab */}
            <TabsContent value="departments" className="mt-0">
              <DepartmentDrilldownTab />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t p-5 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <label htmlFor="include-toggle" className="text-sm font-medium text-foreground">
              Include in report
            </label>
            <Switch
              id="include-toggle"
              checked={includeInReport}
              onCheckedChange={setIncludeInReport}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => navigate("/accreditation/report")}
          >
            Generate report for this standard →
          </Button>
        </div>
      </div>
    </>
  );
}
