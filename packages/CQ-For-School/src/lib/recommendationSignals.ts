import type { SchoolDashboardData } from "@/hooks/useSchoolData";
import type { SurveyResponse } from "@/lib/data";

export type AreaKey = "atRiskGroups" | "cqConcerns" | "issueTracking" | "staffWellness";

export interface AreaSignal {
  id: string;
  label: string;
  area: AreaKey;
  score: number; // 0-10 or 0-100 depending on source; engine normalizes
  severity?: "critical" | "watch" | "normal";
  respondents: number;
  gap?: number;
  hoursLost?: number;
  criticalSince?: string;
  trend?: "worsening" | "stable" | "improving";
  dimension?: string;
}

export interface RecommendationSignalSnapshot {
  atRiskGroups: AreaSignal[];
  cqConcerns: AreaSignal[];
  issueTracking: AreaSignal[];
  staffWellness: AreaSignal[];
  schoolSize: number;
}

const AT_RISK_AND_CQ_CONCERNS: AreaSignal[] = [
  {
    id: "c1",
    label: "Teachers · 3-5 yrs · Middle School",
    area: "cqConcerns",
    score: 4.8,
    severity: "critical",
    respondents: 5,
    gap: 1.2,
    criticalSince: "2026-02-17",
    trend: "worsening",
    dimension: "strategy",
  },
  {
    id: "c2",
    label: "High-Friction Staff · Elementary",
    area: "cqConcerns",
    score: 5.1,
    severity: "critical",
    respondents: 5,
    gap: 0.9,
    criticalSince: "2026-01-28",
    trend: "worsening",
    dimension: "drive",
  },
  {
    id: "c3",
    label: "Teachers · 0-2 yrs · STEM",
    area: "cqConcerns",
    score: 5.3,
    severity: "critical",
    respondents: 4,
    gap: 0.7,
    criticalSince: "2026-02-03",
    trend: "worsening",
    dimension: "knowledge",
  },
  {
    id: "c4",
    label: "Teachers · 10+ yrs · Humanities",
    area: "cqConcerns",
    score: 5.4,
    severity: "critical",
    respondents: 3,
    gap: 0.6,
    criticalSince: "2026-03-01",
    trend: "worsening",
    dimension: "action",
  },
  {
    id: "w1",
    label: "Teachers · 3-5 yrs · High School",
    area: "cqConcerns",
    score: 6,
    severity: "watch",
    respondents: 4,
    gap: 0.0,
    criticalSince: "2026-03-01",
    trend: "worsening",
    dimension: "strategy",
  },
  {
    id: "w2",
    label: "Administration · All Levels",
    area: "cqConcerns",
    score: 6.2,
    severity: "watch",
    respondents: 8,
    gap: 0,
    criticalSince: "2026-03-01",
    trend: "worsening",
    dimension: "drive",
  },
  {
    id: "w3",
    label: "Teachers · 6-10 yrs · Arts & PE",
    area: "cqConcerns",
    score: 6.1,
    severity: "watch",
    respondents: 2,
    gap: 0,
    criticalSince: "2026-03-01",
    trend: "stable",
    dimension: "knowledge",
  },
  {
    id: "w4",
    label: "Secondary Parents",
    area: "cqConcerns",
    score: 5.9,
    severity: "watch",
    respondents: 5,
    gap: 0.1,
    criticalSince: "2026-03-01",
    trend: "worsening",
    dimension: "action",
  },
  {
    id: "w5",
    label: "Teachers · 0-2 yrs · Elementary",
    area: "cqConcerns",
    score: 6.3,
    severity: "watch",
    respondents: 3,
    gap: 0,
    criticalSince: "2026-03-01",
    trend: "stable",
    dimension: "strategy",
  },
  {
    id: "w6",
    label: "Teachers · 3-5 yrs · Middle School · STEM",
    area: "cqConcerns",
    score: 6.2,
    severity: "watch",
    respondents: 3,
    gap: 0,
    criticalSince: "2026-03-01",
    trend: "stable",
    dimension: "knowledge",
  },
];

const WELLNESS_LATEST_WEEK: AreaSignal[] = [
  {
    id: "workload",
    label: "Workload",
    area: "staffWellness",
    score: 6.2,
    severity: "watch",
    respondents: 23,
  },
  {
    id: "leadership_support",
    label: "Leadership support",
    area: "staffWellness",
    score: 7.0,
    severity: "normal",
    respondents: 23,
  },
  {
    id: "psychological_safety",
    label: "Psychological safety",
    area: "staffWellness",
    score: 6.9,
    severity: "watch",
    respondents: 23,
  },
  {
    id: "professional_growth",
    label: "Professional growth",
    area: "staffWellness",
    score: 7.5,
    severity: "normal",
    respondents: 23,
  },
  {
    id: "process_friction",
    label: "Process friction",
    area: "staffWellness",
    score: 6.1,
    severity: "watch",
    respondents: 23,
  },
];

function cloneSignals(area: AreaKey, signals: AreaSignal[]): AreaSignal[] {
  return signals.map((signal) => ({ ...signal, area }));
}

export function buildIssueTrackingSignals(data: SchoolDashboardData): AreaSignal[] {
  const counts = new Map<string, { count: number; hours: number; severitySum: number }>();

  data.rawSurveyResponses.forEach((response: SurveyResponse) => {
    const current = counts.get(response.issueId) ?? { count: 0, hours: 0, severitySum: 0 };
    current.count += 1;
    current.hours += response.hoursSpent ?? 0;
    current.severitySum += response.severity;
    counts.set(response.issueId, current);
  });

  return data.insights
    .map((insight) => {
      const signal = counts.get(insight.issueId);
      const avgHours = signal ? signal.hours / signal.count : insight.hoursAvg;
      const count = signal?.count ?? 0;
      return {
        id: insight.issueId,
        label: insight.issueDescription,
        area: "issueTracking" as const,
        score: insight.severityAvg,
        severity: insight.severityAvg >= 4 ? "critical" : "watch",
        respondents: count,
        gap: insight.severityAvg,
        hoursLost: Math.round((avgHours * count) * 10) / 10,
        trend: insight.predictedFrictionReduction >= 55 ? "worsening" : "stable",
      };
    })
    .sort((a, b) => (b.hoursLost ?? 0) - (a.hoursLost ?? 0));
}

export function buildRecommendationSignalSnapshot(
  data: SchoolDashboardData,
  schoolSize: number
): RecommendationSignalSnapshot {
  return {
    atRiskGroups: cloneSignals("atRiskGroups", AT_RISK_AND_CQ_CONCERNS),
    cqConcerns: cloneSignals("cqConcerns", AT_RISK_AND_CQ_CONCERNS),
    issueTracking: cloneSignals("issueTracking", buildIssueTrackingSignals(data)),
    staffWellness: cloneSignals("staffWellness", WELLNESS_LATEST_WEEK),
    schoolSize,
  };
}

export function getAtRiskSignals(): AreaSignal[] {
  return cloneSignals("atRiskGroups", AT_RISK_AND_CQ_CONCERNS);
}

export function getCqConcernSignals(): AreaSignal[] {
  return cloneSignals("cqConcerns", AT_RISK_AND_CQ_CONCERNS);
}

export function getWellnessSignals(): AreaSignal[] {
  return cloneSignals("staffWellness", WELLNESS_LATEST_WEEK);
}
