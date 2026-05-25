import { WASC_DOMAINS } from "./accreditation";

// ── Types ──

export type GapType = "coverage" | "distribution" | "alignment" | "compliance";

export interface CPDStrength {
  coverage: number;
  distribution: number;
  alignment: number;
  total: number;
}

export interface DetectedGap {
  type: GapType;
  standardId: string;
  standardCode: string;
  standardName: string;
  message: string;
  severity: number; // 2 or 3
  actionLabel: string;
}

// ── Mock CPD Evidence scores (used as fallback) ──

const MOCK_CPD_SCORES: Record<string, number> = {
  "wasc-c1": 55,
  "wasc-a4": 68,
  "wasc-a3": 62,
  "wasc-c2": 70,
  "wasc-a2": 72,
  "wasc-c3": 85,
  "wasc-b2": 65,
  "wasc-a1": 80,
  "wasc-a5": 78,
  "wasc-a6": 60,
  "wasc-b1": 82,
  "wasc-b3": 79,
};

const MOCK_COMPONENT_SCORES: Record<string, CPDStrength> = {
  "wasc-c1": { coverage: 48, distribution: 42, alignment: 75, total: 55 },
  "wasc-a4": { coverage: 72, distribution: 65, alignment: 67, total: 68 },
  "wasc-a3": { coverage: 61, distribution: 55, alignment: 70, total: 62 },
  "wasc-c2": { coverage: 74, distribution: 68, alignment: 68, total: 70 },
  "wasc-a2": { coverage: 76, distribution: 70, alignment: 70, total: 72 },
  "wasc-c3": { coverage: 88, distribution: 82, alignment: 85, total: 85 },
  "wasc-b2": { coverage: 68, distribution: 60, alignment: 67, total: 65 },
  "wasc-a1": { coverage: 82, distribution: 78, alignment: 80, total: 80 },
  "wasc-a5": { coverage: 80, distribution: 76, alignment: 78, total: 78 },
  "wasc-a6": { coverage: 58, distribution: 55, alignment: 67, total: 60 },
  "wasc-b1": { coverage: 85, distribution: 80, alignment: 81, total: 82 },
  "wasc-b3": { coverage: 82, distribution: 76, alignment: 79, total: 79 },
};

// ── Mock department breakdown ──

export interface DepartmentBreakdown {
  department: string;
  cpdScore: number;
  completionRate: number;
  keyGap: string;
  actionLabel: string;
  actionRoute: string;
}

export const MOCK_DEPARTMENT_BREAKDOWN: DepartmentBreakdown[] = [
  { department: "Elementary", cpdScore: 62, completionRate: 74, keyGap: "Leadership coverage", actionLabel: "Schedule session", actionRoute: "" },
  { department: "Middle School", cpdScore: 48, completionRate: 61, keyGap: "Coverage + Alignment", actionLabel: "Assign PD", actionRoute: "/accreditation/interventions" },
  { department: "High School", cpdScore: 55, completionRate: 68, keyGap: "Distribution gap in STEM", actionLabel: "View breakdown", actionRoute: "" },
];

export const MOCK_UNASSIGNED_ROW: DepartmentBreakdown = {
  department: "Unassigned",
  cpdScore: -1,
  completionRate: -1,
  keyGap: "12 staff have incomplete profiles",
  actionLabel: "Complete profiles",
  actionRoute: "/settings/staff",
};

// ── Gap type assignments for mock interventions ──

export const MOCK_INTERVENTION_GAP_TYPES: Record<string, { type: GapType; reason: string }> = {
  "reflective-practice-async": { type: "alignment", reason: "PD not yet aligned to Wellbeing goals for C1" },
  "active-listening-async": { type: "distribution", reason: "Middle School staff have 60% lower CQ engagement" },
  "belonging-workshop": { type: "coverage", reason: "Only 62% of staff have completed PD for School Culture" },
  "feedback-workshop": { type: "alignment", reason: "Feedback training not mapped to any WASC standard" },
  "cq-meetings-workshop": { type: "coverage", reason: "Meeting facilitation PD missing for 38 staff members" },
  "cultural-norms-async": { type: "distribution", reason: "Arts and PE departments have no completions" },
  "leadership-clarity-webinar": { type: "compliance", reason: "Leadership PD required by accreditation cycle deadline" },
  "handoffs-async": { type: "alignment", reason: "Handoff training not linked to improvement plan goals" },
  "parent-comms-webinar": { type: "coverage", reason: "Parent communication PD only completed by 45% of staff" },
};

// ── Computation ──

export function computeAllStandardStrengths(): Map<string, CPDStrength> {
  // Falls back to mock data (real data requires lesson_completions table)
  const map = new Map<string, CPDStrength>();
  WASC_DOMAINS.forEach((d) => {
    map.set(d.id, MOCK_COMPONENT_SCORES[d.id] ?? { coverage: 70, distribution: 70, alignment: 70, total: 70 });
  });
  return map;
}

export function getCPDScore(domainId: string): number {
  return MOCK_CPD_SCORES[domainId] ?? 70;
}

export function detectAllGaps(): DetectedGap[] {
  const gaps: DetectedGap[] = [];

  WASC_DOMAINS.forEach((domain) => {
    const strength = MOCK_COMPONENT_SCORES[domain.id];
    if (!strength) return;

    if (strength.coverage < 70) {
      const pct = strength.coverage;
      gaps.push({
        type: "coverage",
        standardId: domain.id,
        standardCode: domain.code,
        standardName: domain.name,
        message: `Only ${pct}% of staff have completed PD aligned to ${domain.code}. ${Math.round((100 - pct) * 1)} staff still need to be assigned.`,
        severity: pct < 50 ? 3 : 2,
        actionLabel: "Assign PD",
      });
    }

    if (strength.distribution < 55) {
      gaps.push({
        type: "distribution",
        standardId: domain.id,
        standardCode: domain.code,
        standardName: domain.name,
        message: `${domain.code} completion rates vary by 30+ points across school levels. Middle School is significantly behind.`,
        severity: 2,
        actionLabel: "View breakdown",
      });
    }

    if (strength.alignment < 60) {
      gaps.push({
        type: "alignment",
        standardId: domain.id,
        standardCode: domain.code,
        standardName: domain.name,
        message: `Only ${strength.alignment}% of recommended interventions for ${domain.code} have been completed.`,
        severity: 2,
        actionLabel: "Review plan",
      });
    }

    if (strength.total < 50) {
      gaps.push({
        type: "compliance",
        standardId: domain.id,
        standardCode: domain.code,
        standardName: domain.name,
        message: `${domain.code} — ${domain.name} is below the 50-point compliance threshold. Immediate action needed.`,
        severity: 3,
        actionLabel: "Take action",
      });
    }
  });

  return gaps.sort((a, b) => b.severity - a.severity);
}

// ── Mock priority actions ──

export interface PriorityAction {
  id: string;
  urgency: "critical" | "high" | "moderate";
  title: string;
  standardCode: string;
  standardId: string;
  actionLabel: string;
  actionRoute: string;
  gapType: GapType;
}

export function getPriorityActions(): PriorityAction[] {
  return [
    {
      id: "pa-1",
      urgency: "critical",
      title: "Assign PD for A3 — 38 staff have no aligned training",
      standardCode: "A3",
      standardId: "wasc-a3",
      actionLabel: "Assign now",
      actionRoute: "/accreditation/interventions",
      gapType: "coverage",
    },
    {
      id: "pa-2",
      urgency: "critical",
      title: "C1 compliance at risk — CPD Evidence below 50-point threshold",
      standardCode: "C1",
      standardId: "wasc-c1",
      actionLabel: "View standard",
      actionRoute: "/accreditation",
      gapType: "compliance",
    },
    {
      id: "pa-3",
      urgency: "high",
      title: "Secondary department 30+ points behind on A4 completion",
      standardCode: "A4",
      standardId: "wasc-a4",
      actionLabel: "View breakdown",
      actionRoute: "/accreditation",
      gapType: "distribution",
    },
  ];
}
