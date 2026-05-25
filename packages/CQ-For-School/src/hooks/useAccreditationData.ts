import { useMemo } from "react";
import { useSchoolData } from "./useSchoolData";
import {
  computeAccreditationSummary,
  generateEvidenceArtifacts,
  WASC_DOMAINS,
  type AccreditationSummary,
  type EvidenceArtifact,
} from "@/lib/accreditation";

export interface AccreditationDashboardData {
  isLoading: boolean;
  summary: AccreditationSummary;
  allEvidence: Record<string, EvidenceArtifact[]>;
}

export function useAccreditationData(): AccreditationDashboardData {
  const schoolData = useSchoolData();

  return useMemo(() => {
    const surveyResponses = schoolData.rawSurveyResponses;
    const confidenceEntries = schoolData.rawConfidenceEntries;

    const summary = computeAccreditationSummary(
      surveyResponses,
      confidenceEntries,
      schoolData.streak > 0 ? Math.min(100, schoolData.streak * 15) : 0,
      schoolData.streak
    );

    const allEvidence: Record<string, EvidenceArtifact[]> = {};
    WASC_DOMAINS.forEach((d) => {
      allEvidence[d.id] = generateEvidenceArtifacts(d.id, surveyResponses, confidenceEntries);
    });

    return {
      isLoading: schoolData.isLoading,
      summary,
      allEvidence,
    };
  }, [schoolData]);
}
