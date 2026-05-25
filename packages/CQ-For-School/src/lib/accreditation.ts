import { FRICTION_CATEGORIES, FRICTION_ISSUES, type SurveyResponse, type ConfidenceEntry } from "./data";

// ── ACS WASC Focus on Learning Domains ──

export interface WASCDomain {
  id: string;
  code: string;
  name: string;
  description: string;
  frictionCategoryIds: string[]; // mapped friction categories
}

export const WASC_DOMAINS: WASCDomain[] = [
  {
    id: "wasc-c1",
    code: "C1",
    name: "School Culture",
    description: "Measures whether the school fosters a collaborative, safe culture based on trust, respect, and shared responsibility. Evidence drawn from weekly staff confidence scores, belonging signals, and cultural friction reports.",
    frictionCategoryIds: ["cat-3", "cat-4"],
  },
  {
    id: "wasc-a4",
    code: "A4",
    name: "Continuous Improvement",
    description: "Tracks whether the school uses qualitative and quantitative data to guide improvement planning. Evidence drawn from 14-week domain score trends, pre/post term comparisons, and friction prevalence data.",
    frictionCategoryIds: ["cat-1", "cat-5"],
  },
  {
    id: "wasc-a3",
    code: "A3",
    name: "Faculty and Staff",
    description: "Assesses ongoing collaborative professional learning aligned to school goals. Evidence drawn from CQ win behaviours, impact ratings, and Phase 2 CPD certificate records.",
    frictionCategoryIds: ["cat-2", "cat-3"],
  },
  {
    id: "wasc-c2",
    code: "C2",
    name: "Systems of Support",
    description: "Evaluates whether responsive systems address staff and student social-emotional needs. Evidence drawn from friction severity scores, hours-per-week burden, and intervention completion data.",
    frictionCategoryIds: ["cat-3", "cat-4"],
  },
  {
    id: "wasc-a2",
    code: "A2",
    name: "Leadership and Governance",
    description: "Examines effective decision-making and shared accountability. Evidence drawn from administrator confidence scores, leadership clarity friction sub-items, and supplementary governance documents.",
    frictionCategoryIds: ["cat-1"],
  },
  {
    id: "wasc-c3",
    code: "C3",
    name: "Community Partnerships",
    description: "Assesses engagement with families and community. Evidence drawn from parent confidence scores and supplementary partnership documentation.",
    frictionCategoryIds: [],
  },
  {
    id: "wasc-b2",
    code: "B2",
    name: "Teaching and Learning",
    description: "Reviews whether instruction is student-centred and differentiated. Evidence drawn from CQ win behaviours including active listening, adapted communication, and inclusive practice indicators.",
    frictionCategoryIds: ["cat-4"],
  },
  {
    id: "wasc-a1",
    code: "A1",
    name: "Vision and Mission",
    description: "Evaluates whether the school mission guides all decisions and is understood by the community. Evidence requires document upload — mission statement, strategic plan.",
    frictionCategoryIds: [],
  },
  {
    id: "wasc-a5",
    code: "A5",
    name: "Resources",
    description: "Assesses whether the school allocates and manages resources effectively to support student learning and school programmes. Evidence requires document upload — budget plans, resource audits.",
    frictionCategoryIds: [],
  },
  {
    id: "wasc-a6",
    code: "A6",
    name: "Accountability and Compliance",
    description: "Confirms clear policies and compliance with applicable laws. Evidence requires document upload — policy documents and compliance records.",
    frictionCategoryIds: ["cat-5"],
  },
  {
    id: "wasc-b1",
    code: "B1",
    name: "Curriculum",
    description: "Evaluates whether the curriculum is coherent, rigorous, and aligned to standards. Evidence requires document upload — curriculum maps, scope and sequence documents.",
    frictionCategoryIds: [],
  },
  {
    id: "wasc-b3",
    code: "B3",
    name: "Assessment",
    description: "Reviews whether the school uses a comprehensive assessment system to monitor and improve student learning. Evidence requires document upload — assessment policies, data analysis reports.",
    frictionCategoryIds: [],
  },
];

// Standards that require document upload only (no survey signal)
export const DOCUMENT_ONLY_DOMAIN_IDS = ["wasc-a1", "wasc-a5", "wasc-a6", "wasc-b1", "wasc-b3"];

// ── Risk Levels ──

export type RiskLevel = "low" | "medium" | "high";

export interface DomainRiskAssessment {
  domain: WASCDomain;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  avgSeverity: number;
  trendDirection: "improving" | "stable" | "declining";
  issueCount: number;
  evidenceCount: number;
  missingEvidence: string[];
  topIssues: Array<{ description: string; severity: number }>;
}

export interface AccreditationSummary {
  overallRisk: RiskLevel;
  overallScore: number;
  domainAssessments: DomainRiskAssessment[];
  totalIssuesReported: number;
  participationRate: number;
  reportingWeeks: number;
}

// ── Evidence Types ──

export interface EvidenceArtifact {
  id: string;
  domainId: string;
  type: "participation_log" | "pre_post_metrics" | "trend_analysis" | "friction_summary";
  title: string;
  description: string;
  generated: boolean;
  data?: Record<string, unknown>;
}

const EVIDENCE_REQUIREMENTS: Record<string, string[]> = {
  "wasc-c1": ["participation_log", "friction_summary", "pre_post_metrics", "trend_analysis"],
  "wasc-a4": ["trend_analysis", "pre_post_metrics"],
  "wasc-a3": ["participation_log", "trend_analysis"],
  "wasc-c2": ["friction_summary", "trend_analysis"],
  "wasc-a2": ["participation_log", "friction_summary"],
  "wasc-c3": ["participation_log", "pre_post_metrics"],
  "wasc-b2": ["participation_log", "pre_post_metrics"],
  "wasc-a1": [],
  "wasc-a5": [],
  "wasc-a6": [],
  "wasc-b1": [],
  "wasc-b3": [],
};

const EVIDENCE_LABELS: Record<string, string> = {
  participation_log: "Survey Participation Log",
  pre_post_metrics: "Pre/Post Survey Metrics",
  trend_analysis: "Weekly Trend Analysis",
  friction_summary: "Friction & Risk Summary",
};

// ── Computation Functions ──

export function computeDomainRisk(
  domain: WASCDomain,
  surveyResponses: SurveyResponse[],
  confidenceEntries: ConfidenceEntry[]
): DomainRiskAssessment {
  // Get friction issues for this domain's categories
  const domainIssueIds = FRICTION_ISSUES
    .filter((fi) => domain.frictionCategoryIds.includes(fi.categoryId))
    .map((fi) => fi.id);

  const domainResponses = surveyResponses.filter((r) => domainIssueIds.includes(r.issueId));

  // Calculate avg severity
  const avgSeverity =
    domainResponses.length > 0
      ? domainResponses.reduce((s, r) => s + r.severity, 0) / domainResponses.length
      : 0;

  // Friction risk: normalized 0-100 (severity 1-5 → 0-100)
  const frictionRisk = Math.round((avgSeverity / 5) * 100);

  // Confidence risk: low confidence = high risk
  const avgConfidenceRaw = confidenceEntries.length > 0
    ? confidenceEntries.reduce((sum, e) =>
        sum + (e.colleagues + e.parents + e.administrators) / 3, 0
      ) / confidenceEntries.length
    : 3; // neutral fallback if no entries
  const avgConfidence = ((avgConfidenceRaw - 1) / 4) * 100;
  const confidenceRisk = 100 - avgConfidence;

  // Blended risk score: 60% friction, 40% confidence
  const riskScore = Math.round(0.6 * frictionRisk + 0.4 * confidenceRisk);

  // Trend: compare last 2 weeks
  const dates = [...new Set(domainResponses.map((r) => r.timestamp.slice(0, 10)))].sort();
  let trendDirection: "improving" | "stable" | "declining" = "stable";
  if (dates.length >= 2) {
    const lastDate = dates[dates.length - 1];
    const prevDate = dates[dates.length - 2];
    const lastAvg = avg(domainResponses.filter((r) => r.timestamp.slice(0, 10) === lastDate).map((r) => r.severity));
    const prevAvg = avg(domainResponses.filter((r) => r.timestamp.slice(0, 10) === prevDate).map((r) => r.severity));
    const diff = lastAvg - prevAvg;
    if (diff < -0.3) trendDirection = "improving";
    else if (diff > 0.3) trendDirection = "declining";
  }

  // Risk level
  const riskLevel: RiskLevel = riskScore >= 60 ? "high" : riskScore >= 35 ? "medium" : "low";

  // Top issues
  const issueGroups: Record<string, number[]> = {};
  domainResponses.forEach((r) => {
    if (!issueGroups[r.issueId]) issueGroups[r.issueId] = [];
    issueGroups[r.issueId].push(r.severity);
  });
  const topIssues = Object.entries(issueGroups)
    .map(([id, sevs]) => ({
      description: FRICTION_ISSUES.find((fi) => fi.id === id)?.description ?? "Unknown",
      severity: Math.round((sevs.reduce((a, b) => a + b, 0) / sevs.length) * 10) / 10,
    }))
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3);

  // Evidence
  const required = EVIDENCE_REQUIREMENTS[domain.id] ?? [];
  const hasData = domainResponses.length > 0;
  const evidenceCount = hasData ? required.length : 0;
  const missingEvidence = hasData ? [] : required.map((t) => EVIDENCE_LABELS[t] ?? t);

  return {
    domain,
    riskLevel,
    riskScore,
    avgSeverity: Math.round(avgSeverity * 10) / 10,
    trendDirection,
    issueCount: domainResponses.length,
    evidenceCount,
    missingEvidence,
    topIssues,
  };
}

export function computeAccreditationSummary(
  surveyResponses: SurveyResponse[],
  confidenceEntries: ConfidenceEntry[],
  participationRate: number = 0,
  reportingWeeks: number = 0
): AccreditationSummary {
  const domainAssessments = WASC_DOMAINS.map((d) =>
    computeDomainRisk(d, surveyResponses, confidenceEntries)
  );

  const overallScore =
    domainAssessments.length > 0
      ? Math.round(domainAssessments.reduce((s, d) => s + d.riskScore, 0) / domainAssessments.length)
      : 0;

  const overallRisk: RiskLevel = overallScore >= 60 ? "high" : overallScore >= 35 ? "medium" : "low";

  return {
    overallRisk,
    overallScore,
    domainAssessments,
    totalIssuesReported: surveyResponses.length,
    participationRate,
    reportingWeeks,
  };
}

export function generateEvidenceArtifacts(
  domainId: string,
  surveyResponses: SurveyResponse[],
  confidenceEntries: ConfidenceEntry[]
): EvidenceArtifact[] {
  const required = EVIDENCE_REQUIREMENTS[domainId] ?? [];
  const domain = WASC_DOMAINS.find((d) => d.id === domainId);
  if (!domain) return [];

  const domainIssueIds = FRICTION_ISSUES
    .filter((fi) => domain.frictionCategoryIds.includes(fi.categoryId))
    .map((fi) => fi.id);
  const domainResponses = surveyResponses.filter((r) => domainIssueIds.includes(r.issueId));
  const hasData = domainResponses.length > 0;

  return required.map((type) => ({
    id: `${domainId}-${type}`,
    domainId,
    type: type as EvidenceArtifact["type"],
    title: EVIDENCE_LABELS[type] ?? type,
    description: `${EVIDENCE_LABELS[type]} for Domain ${domain.code}: ${domain.name}`,
    generated: hasData,
    data: hasData ? buildEvidenceData(type, domainResponses, confidenceEntries) : undefined,
  }));
}

function buildEvidenceData(
  type: string,
  responses: SurveyResponse[],
  confidenceEntries: ConfidenceEntry[]
): Record<string, unknown> {
  const dates = [...new Set(responses.map((r) => r.timestamp.slice(0, 10)))].sort();

  switch (type) {
    case "participation_log":
      return {
        totalSubmissions: responses.length,
        uniqueWeeks: dates.length,
        weeklyBreakdown: dates.map((d) => ({
          week: d,
          count: responses.filter((r) => r.timestamp.slice(0, 10) === d).length,
        })),
      };
    case "pre_post_metrics": {
      if (dates.length < 2) return { insufficient: true };
      const first = responses.filter((r) => r.timestamp.slice(0, 10) === dates[0]);
      const last = responses.filter((r) => r.timestamp.slice(0, 10) === dates[dates.length - 1]);
      return {
        preAvgSeverity: Math.round(avg(first.map((r) => r.severity)) * 10) / 10,
        postAvgSeverity: Math.round(avg(last.map((r) => r.severity)) * 10) / 10,
        preDate: dates[0],
        postDate: dates[dates.length - 1],
      };
    }
    case "trend_analysis":
      return {
        weeks: dates.map((d) => ({
          week: d,
          avgSeverity: Math.round(avg(responses.filter((r) => r.timestamp.slice(0, 10) === d).map((r) => r.severity)) * 10) / 10,
        })),
      };
    case "friction_summary": {
      const grouped: Record<string, number[]> = {};
      responses.forEach((r) => {
        if (!grouped[r.issueId]) grouped[r.issueId] = [];
        grouped[r.issueId].push(r.severity);
      });
      return {
        issues: Object.entries(grouped).map(([id, sevs]) => ({
          issueId: id,
          description: FRICTION_ISSUES.find((fi) => fi.id === id)?.description ?? "Unknown",
          avgSeverity: Math.round(avg(sevs) * 10) / 10,
          count: sevs.length,
        })),
      };
    }
    default:
      return {};
  }
}

function avg(nums: number[]): number {
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
