import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "./useSchoolContext";
import {
  SurveyResponse,
  ConfidenceEntry,
  WinsEntry,
  calculateFrictionScore,
  calculateConfidenceScore,
  calculateWinsScore,
  calculateNSM,
  FRICTION_ISSUES,
} from "@/lib/data";

export interface UserProfile {
  user_id: string;
  school_id: string | null;
  display_name: string | null;
  tenure_band: "0-2" | "3-5" | "6-10" | "10+" | null;
  department: string | null;
  grade_level: "elementary" | "middle" | "high" | null;
  onboarded: boolean;
}

export interface CohortMetrics {
  label: string;
  teacherCount: number;
  avgNSM: number;
  frictionScale: number;
  confidenceScale: number;
  winsScore: number;
  topIssue: string;
}

export type DemographicDimension = "tenure" | "department" | "grade_level";

// ── Supabase row types ──────────────────────────────────────────────────────

interface SurveyResponseRow {
  id: string;
  user_id: string;
  responses: {
    friction?: Array<{ issueId: string; severity: number; hoursSpent?: number }>;
    confidence?: { colleagues: number; parents: number; administrators: number };
    wins?: { wins: string[] };
  };
  created_at: string;
  school_id: string;
  week: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseRows(rows: SurveyResponseRow[]) {
  const surveyMap: Record<string, SurveyResponse[]> = {};
  const confidenceMap: Record<string, ConfidenceEntry[]> = {};
  const winsMap: Record<string, WinsEntry[]> = {};

  rows.forEach((row) => {
    const uid = row.user_id;
    const ts = row.created_at;
    const resp = row.responses;

    if (resp.friction) {
      if (!surveyMap[uid]) surveyMap[uid] = [];
      resp.friction.forEach((f, i) => {
        surveyMap[uid].push({
          id: `${row.id}-f${i}`,
          issueId: f.issueId,
          severity: f.severity,
          hoursSpent: f.hoursSpent,
          timestamp: ts,
        });
      });
    }

    if (resp.confidence) {
      if (!confidenceMap[uid]) confidenceMap[uid] = [];
      confidenceMap[uid].push({
        id: `${row.id}-c`,
        colleagues: resp.confidence.colleagues,
        parents: resp.confidence.parents,
        administrators: resp.confidence.administrators,
        timestamp: ts,
      });
    }

    if (resp.wins) {
      if (!winsMap[uid]) winsMap[uid] = [];
      winsMap[uid].push({
        id: `${row.id}-w`,
        wins: resp.wins.wins,
        timestamp: ts,
      });
    }
  });

  return { surveyMap, confidenceMap, winsMap };
}

function getTopIssue(responses: SurveyResponse[]): string {
  if (responses.length === 0) return "No issues reported";
  const grouped: Record<string, number> = {};
  responses.forEach((r) => {
    grouped[r.issueId] = (grouped[r.issueId] || 0) + r.severity;
  });
  const topId = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0]?.[0];
  return FRICTION_ISSUES.find((f) => f.id === topId)?.description ?? "—";
}

function computeCohortMetrics(
  userIds: string[],
  surveyMap: Record<string, SurveyResponse[]>,
  confidenceMap: Record<string, ConfidenceEntry[]>,
  winsMap: Record<string, WinsEntry[]>,
  label: string
): CohortMetrics {
  const allSurvey: SurveyResponse[] = userIds.flatMap((id) => surveyMap[id] ?? []);
  const allConf: ConfidenceEntry[] = userIds.flatMap((id) => confidenceMap[id] ?? []);
  const allWins: WinsEntry[] = userIds.flatMap((id) => winsMap[id] ?? []);

  const latestConf = allConf.length > 0 ? allConf[allConf.length - 1] : null;
  const latestWins = allWins.length > 0 ? allWins[allWins.length - 1] : null;

  const frictionScore = calculateFrictionScore(allSurvey);       // 0–100
  const confidenceScore = calculateConfidenceScore(latestConf);   // 0–100
  const winsScore = calculateWinsScore(latestWins);               // 0–100
  const nsm = calculateNSM(frictionScore, confidenceScore, winsScore);

  // Map 0-100 friction score to 1-5 intuitive scale (lower score = lower friction = better)
  // frictionScore 0 = all severity 1, 100 = all severity 5
  const frictionScale = allSurvey.length > 0
    ? Math.round((allSurvey.reduce((s, r) => s + r.severity, 0) / allSurvey.length) * 10) / 10
    : 0;

  const confidenceScale = latestConf
    ? Math.round(((latestConf.colleagues + latestConf.parents + latestConf.administrators) / 3) * 10) / 10
    : 0;

  return {
    label,
    teacherCount: userIds.length,
    avgNSM: nsm,
    frictionScale,
    confidenceScale,
    winsScore,
    topIssue: getTopIssue(allSurvey),
  };
}

const TENURE_LABELS: Record<string, string> = {
  "0-2": "0–2 years",
  "3-5": "3–5 years",
  "6-10": "6–10 years",
  "10+": "10+ years",
};

const GRADE_LABELS: Record<string, string> = {
  elementary: "Elementary (K–5)",
  middle: "Middle School (6–8)",
  high: "High School (9–12)",
};

// ── The Hook ────────────────────────────────────────────────────────────────

const TEST_SCHOOL_ID = "d184f91b-3049-4fa0-a03e-1378561527e4";

const MOCK_TENURE_COHORTS: CohortMetrics[] = [
  { label: "0–2 years", teacherCount: 12, avgNSM: 52, frictionScale: 3.8, confidenceScale: 2.9, winsScore: 40, topIssue: "Grading / Feedback Loops" },
  { label: "3–5 years", teacherCount: 18, avgNSM: 61, frictionScale: 3.2, confidenceScale: 3.4, winsScore: 55, topIssue: "Lesson Planning / Prep Time" },
  { label: "6–10 years", teacherCount: 9, avgNSM: 70, frictionScale: 2.6, confidenceScale: 3.8, winsScore: 65, topIssue: "Parent Communication" },
  { label: "10+ years", teacherCount: 6, avgNSM: 75, frictionScale: 2.1, confidenceScale: 4.1, winsScore: 72, topIssue: "Administrative Tasks" },
];

const MOCK_DEPARTMENT_COHORTS: CohortMetrics[] = [
  { label: "Math", teacherCount: 10, avgNSM: 58, frictionScale: 3.5, confidenceScale: 3.2, winsScore: 48, topIssue: "Grading / Feedback Loops" },
  { label: "English / Language Arts", teacherCount: 11, avgNSM: 63, frictionScale: 3.0, confidenceScale: 3.5, winsScore: 55, topIssue: "Lesson Planning / Prep Time" },
  { label: "Science", teacherCount: 8, avgNSM: 66, frictionScale: 2.8, confidenceScale: 3.6, winsScore: 60, topIssue: "Tech / Tool Overload" },
  { label: "Social Studies / History", teacherCount: 7, avgNSM: 60, frictionScale: 3.2, confidenceScale: 3.3, winsScore: 52, topIssue: "Parent Communication" },
  { label: "Special Education", teacherCount: 5, avgNSM: 48, frictionScale: 4.0, confidenceScale: 2.7, winsScore: 38, topIssue: "IEP / Compliance Paperwork" },
  { label: "Electives", teacherCount: 4, avgNSM: 72, frictionScale: 2.3, confidenceScale: 3.9, winsScore: 68, topIssue: "Administrative Tasks" },
];

const MOCK_GRADE_COHORTS: CohortMetrics[] = [
  { label: "Elementary (K–5)", teacherCount: 15, avgNSM: 64, frictionScale: 3.0, confidenceScale: 3.5, winsScore: 58, topIssue: "Parent Communication" },
  { label: "Middle School (6–8)", teacherCount: 14, avgNSM: 57, frictionScale: 3.4, confidenceScale: 3.1, winsScore: 50, topIssue: "Grading / Feedback Loops" },
  { label: "High School (9–12)", teacherCount: 16, avgNSM: 62, frictionScale: 3.1, confidenceScale: 3.4, winsScore: 55, topIssue: "Lesson Planning / Prep Time" },
];

export function useDemographicBreakdown(dimension: DemographicDimension) {
  const { selectedSchoolId } = useSchoolContext();

  const isMock = selectedSchoolId === TEST_SCHOOL_ID;

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["user-profiles", selectedSchoolId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_profiles")
        .select("*")
        .eq("school_id", selectedSchoolId);
      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: !!selectedSchoolId && !isMock,
  });

  const { data: surveyRows, isLoading: surveysLoading } = useQuery({
    queryKey: ["school-survey-data-raw", selectedSchoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_responses")
        .select("*")
        .eq("school_id", selectedSchoolId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSchoolId && !isMock,
  });

  const cohorts = useMemo<CohortMetrics[]>(() => {
    if (isMock) {
      if (dimension === "tenure") return MOCK_TENURE_COHORTS;
      if (dimension === "department") return MOCK_DEPARTMENT_COHORTS;
      return MOCK_GRADE_COHORTS;
    }

    if (!profiles || !surveyRows) return [];

    const { surveyMap, confidenceMap, winsMap } = parseRows(
      surveyRows as unknown as SurveyResponseRow[]
    );

    const groups: Record<string, string[]> = {};

    profiles.forEach((p) => {
      let key: string | null = null;
      if (dimension === "tenure") key = p.tenure_band;
      else if (dimension === "department") key = p.department;
      else if (dimension === "grade_level") key = p.grade_level;

      if (!key) return;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p.user_id);
    });

    return Object.entries(groups).map(([key, userIds]) => {
      let label = key;
      if (dimension === "tenure") label = TENURE_LABELS[key] ?? key;
      if (dimension === "grade_level") label = GRADE_LABELS[key] ?? key;
      return computeCohortMetrics(userIds, surveyMap, confidenceMap, winsMap, label);
    });
  }, [profiles, surveyRows, dimension, isMock]);

  const hasData = cohorts.length > 0 && cohorts.some((c) => c.teacherCount > 0);

  return {
    cohorts,
    isLoading: isMock ? false : (profilesLoading || surveysLoading),
    hasData,
  };
}
