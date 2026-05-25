import { useState, useMemo } from "react";
import { useAccreditationData } from "@/hooks/useAccreditationData";
import { useSchoolData } from "@/hooks/useSchoolData";
import { useCPDEvidence } from "@/hooks/useCPDEvidence";
import { WASC_DOMAINS, DOCUMENT_ONLY_DOMAIN_IDS, type EvidenceArtifact } from "@/lib/accreditation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import StandardCard from "@/components/accreditation/StandardCard";
import StandardDetailPanel from "@/components/accreditation/StandardDetailPanel";
import CycleTrackerBanner from "@/components/accreditation/CycleTrackerBanner";
import GapAlertsPanel from "@/components/accreditation/GapAlertsPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AccreditationSegmentTab from "@/components/accreditation/AccreditationSegmentTab";

function getSparklineData(
  domainId: string,
  allEvidence: Record<string, EvidenceArtifact[]>,
  currentScore: number
): Array<{ week: string; score: number }> {
  const trendArtifact = allEvidence[domainId]?.find((a) => a.type === "trend_analysis");
  const weeks = (trendArtifact?.data?.weeks as Array<{ week: string; avgSeverity: number }>) ?? [];

  if (weeks.length < 2) {
    return Array.from({ length: 8 }, (_, i) => ({ week: `W${i + 1}`, score: currentScore }));
  }

  return weeks.slice(-8).map((w) => ({
    week: w.week,
    score: Math.round((w.avgSeverity / 5) * 100),
  }));
}

export default function AccreditationDashboard() {
  const { isLoading, summary, allEvidence } = useAccreditationData();
  const schoolData = useSchoolData();
  const { getCPDScore, gaps } = useCPDEvidence();
  const navigate = useNavigate();
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  const baseScores = useMemo(() => {
    const scores: Record<string, number> = {};
    summary.domainAssessments.forEach((a) => {
      scores[a.domain.id] = 100 - a.riskScore;
    });
    return scores;
  }, [summary.domainAssessments]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-36" />)}
        </div>
      </div>
    );
  }

  const { domainAssessments } = summary;

  const highRisk = domainAssessments.filter((d) => d.riskLevel === "high").length;
  const atRisk = domainAssessments.filter((d) => d.riskLevel === "medium").length;

  const surveyDomains = domainAssessments.filter(
    (d) => !DOCUMENT_ONLY_DOMAIN_IDS.includes(d.domain.id)
  );
  const withEvidence = surveyDomains.filter((d) => d.evidenceCount > 0).length;
  const evidenceCoverage = surveyDomains.length > 0
    ? Math.round((withEvidence / surveyDomains.length) * 100)
    : 0;

  const selectedAssessment = selectedDomainId
    ? domainAssessments.find((a) => a.domain.id === selectedDomainId)
    : null;

  return (
    <div className="space-y-6 p-6">
      {/* Zone A — Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Accreditation Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            ACS WASC · Term 2
          </p>
        </div>
        <Button onClick={() => navigate("/accreditation/report")}>
          Generate report
        </Button>
      </div>

      {/* Cycle Tracker */}
      <CycleTrackerBanner />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="department">By Department</TabsTrigger>
          <TabsTrigger value="school-level">By School Level</TabsTrigger>
          <TabsTrigger value="tenure">By Tenure</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Zone B — Summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-3xl font-bold text-destructive">{highRisk}</p>
              <p className="text-xs text-muted-foreground mt-1">High risk standards</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{atRisk}</p>
              <p className="text-xs text-muted-foreground mt-1">At-risk standards</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-3xl font-bold text-primary">{evidenceCoverage}%</p>
              <p className="text-xs text-muted-foreground mt-1">Evidence coverage</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-3xl font-bold text-foreground">{summary.participationRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">Survey participation</p>
            </div>
          </div>

          {/* Gap Alerts Panel */}
          <GapAlertsPanel gaps={gaps} onViewStandard={setSelectedDomainId} />

          {/* Zone C — Standards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {domainAssessments.map((assessment) => (
              <StandardCard
                key={assessment.domain.id}
                code={assessment.domain.code}
                name={assessment.domain.name}
                score={100 - assessment.riskScore}
                riskLevel={assessment.riskLevel}
                cpdEvidenceScore={getCPDScore(assessment.domain.id)}
                onClick={() => setSelectedDomainId(assessment.domain.id)}
              />
            ))}
          </div>

          {/* Side panel */}
          {selectedAssessment && (
            <StandardDetailPanel
              assessment={selectedAssessment}
              evidence={allEvidence[selectedAssessment.domain.id] ?? []}
              sparklineData={getSparklineData(
                selectedAssessment.domain.id,
                allEvidence,
                100 - selectedAssessment.riskScore
              )}
              surveyResponses={schoolData.rawSurveyResponses}
              onClose={() => setSelectedDomainId(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="department" className="mt-4">
          <AccreditationSegmentTab segmentType="department" baseScores={baseScores} />
        </TabsContent>

        <TabsContent value="school-level" className="mt-4">
          <AccreditationSegmentTab segmentType="school-level" baseScores={baseScores} />
        </TabsContent>

        <TabsContent value="tenure" className="mt-4">
          <AccreditationSegmentTab segmentType="tenure" baseScores={baseScores} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
