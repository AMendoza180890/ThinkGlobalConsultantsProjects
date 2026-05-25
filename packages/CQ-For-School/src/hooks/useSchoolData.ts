import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "./useSchoolContext";
import {
  SurveyResponse,
  ConfidenceEntry,
  WinsEntry,
  NSMScores,
  TimeScopedMetrics,
  TopFrictionItem,
  TopWinItem,
  TeacherInsight,
  calculateFrictionScore,
  calculateConfidenceScore,
  calculateWinsScore,
  calculateNSM,
  calculateTurnoverRisk,
  getSurveyResponses,
  getConfidenceEntries,
  getWinsEntries,
  getAdminSettings,
  getLatestNSMScores,
  getWeeklyTrends,
  getFrictionBreakdown,
  getConfidenceBreakdown,
  getWinsTrend,
  calculateInsights,
  getLastWeekMetrics,
  getWoWChange,
  getCumulativeMetrics,
  getReportingStreak,
  getTopImprovedIssue,
  getLastWeekTopFriction,
  getWoWFrictionChange,
  getCumulativeTopFriction,
  getLastWeekTopWins,
  getCumulativeTopWins,
  getBestWinsWeek,
  FRICTION_ISSUES,
  FRICTION_CATEGORIES,
  CQ_WINS,
  MAX_WINS,
  getLessonForIssue,
} from "@/lib/data";

// The Test School uses mock/localStorage data
const TEST_SCHOOL_ID = "d184f91b-3049-4fa0-a03e-1378561527e4";

interface SurveyResponseRow {
  id: string;
  responses: {
    friction?: Array<{ issueId: string; severity: number; hoursSpent?: number; context?: string }>;
    confidence?: { colleagues: number; parents: number; administrators: number; text?: string };
    wins?: { wins: string[]; ratings?: Record<string, number>; text?: string };
  };
  created_at: string;
  user_id: string;
  school_id: string;
  week: string;
}

function parseDbResponses(rows: SurveyResponseRow[]) {
  const surveyResponses: SurveyResponse[] = [];
  const confidenceEntries: ConfidenceEntry[] = [];
  const winsEntries: WinsEntry[] = [];

  rows.forEach((row) => {
    const resp = row.responses;
    const ts = row.created_at;

    if (resp.friction) {
      resp.friction.forEach((f, i) => {
        surveyResponses.push({
          id: `${row.id}-f${i}`,
          issueId: f.issueId,
          severity: f.severity,
          hoursSpent: f.hoursSpent,
          context: f.context,
          timestamp: ts,
        });
      });
    }

    if (resp.confidence) {
      confidenceEntries.push({
        id: `${row.id}-c`,
        colleagues: resp.confidence.colleagues,
        parents: resp.confidence.parents,
        administrators: resp.confidence.administrators,
        text: resp.confidence.text,
        timestamp: ts,
      });
    }

    if (resp.wins) {
      winsEntries.push({
        id: `${row.id}-w`,
        wins: resp.wins.wins,
        ratings: resp.wins.ratings,
        text: resp.wins.text,
        timestamp: ts,
      });
    }
  });

  return { surveyResponses, confidenceEntries, winsEntries };
}

// ── Compute functions that take data as input (mirror data.ts but parameterized) ──

function getIssueWeight(issueId: string): number {
  const issue = FRICTION_ISSUES.find((fi) => fi.id === issueId);
  if (!issue) return 1;
  const cat = FRICTION_CATEGORIES.find((c) => c.id === issue.categoryId);
  return cat?.weight ?? 1;
}

function getLatestWeekResponses(responses: SurveyResponse[]): SurveyResponse[] {
  if (responses.length === 0) return [];
  const sorted = [...responses].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const latestDate = sorted[0].timestamp.slice(0, 10);
  return sorted.filter((r) => r.timestamp.slice(0, 10) === latestDate);
}

function computeNSMScores(
  surveyResponses: SurveyResponse[],
  confidenceEntries: ConfidenceEntry[],
  winsEntries: WinsEntry[]
): NSMScores {
  const latestConfidence = confidenceEntries.length > 0 ? confidenceEntries[confidenceEntries.length - 1] : null;
  const latestWins = winsEntries.length > 0 ? winsEntries[winsEntries.length - 1] : null;
  const latestResponses = getLatestWeekResponses(surveyResponses);
  const frictionScore = calculateFrictionScore(latestResponses);
  const confidenceScore = calculateConfidenceScore(latestConfidence);
  const cqWinsScore = calculateWinsScore(latestWins);
  const nsm = calculateNSM(frictionScore, confidenceScore, cqWinsScore);
  const turnoverRisk = calculateTurnoverRisk(nsm);
  return { frictionScore, confidenceScore, cqWinsScore, nsm, turnoverRisk };
}

function computeWeeklyTrends(
  surveyResponses: SurveyResponse[],
  confidenceEntries: ConfidenceEntry[],
  winsEntries: WinsEntry[]
) {
  const surveyByDate: Record<string, SurveyResponse[]> = {};
  surveyResponses.forEach((r) => {
    const date = r.timestamp.slice(0, 10);
    if (!surveyByDate[date]) surveyByDate[date] = [];
    surveyByDate[date].push(r);
  });

  const allDates = new Set<string>();
  surveyResponses.forEach((r) => allDates.add(r.timestamp.slice(0, 10)));
  confidenceEntries.forEach((c) => allDates.add(c.timestamp.slice(0, 10)));
  winsEntries.forEach((w) => allDates.add(w.timestamp.slice(0, 10)));

  return [...allDates].sort().map((date) => {
    const dayResponses = surveyByDate[date] || [];
    const dayConfidence = confidenceEntries.filter((c) => c.timestamp.slice(0, 10) === date);
    const dayWins = winsEntries.filter((w) => w.timestamp.slice(0, 10) === date);
    const frictionScore = calculateFrictionScore(dayResponses);
    const confidenceScore = calculateConfidenceScore(dayConfidence.length > 0 ? dayConfidence[dayConfidence.length - 1] : null);
    const cqWinsScore = calculateWinsScore(dayWins.length > 0 ? dayWins[dayWins.length - 1] : null);
    const nsm = calculateNSM(frictionScore, confidenceScore, cqWinsScore);
    const turnoverRisk = calculateTurnoverRisk(nsm);
    return { week: date, frictionScore, confidenceScore, cqWinsScore, nsm, turnoverRisk };
  });
}

function computeFrictionBreakdown(responses: SurveyResponse[]) {
  const totalSubmissions = new Set(responses.map((r) => r.timestamp.slice(0, 10))).size || 1;
  return FRICTION_CATEGORIES.map((cat) => {
    const catIssueIds = FRICTION_ISSUES.filter((fi) => fi.categoryId === cat.id).map((fi) => fi.id);
    const catResponses = responses.filter((r) => catIssueIds.includes(r.issueId));
    const avgSeverity = catResponses.length > 0
      ? Math.round((catResponses.reduce((s, r) => s + r.severity, 0) / catResponses.length) * 10) / 10
      : 0;
    const uniqueDays = new Set(catResponses.map((r) => r.timestamp.slice(0, 10))).size;
    return { category: cat.label, avgSeverity, reportCount: catResponses.length, percentReporting: Math.round((uniqueDays / totalSubmissions) * 100) };
  });
}

function computeConfidenceBreakdown(entries: ConfidenceEntry[]) {
  return entries.map((e) => ({
    week: e.timestamp.slice(0, 10),
    colleagues: e.colleagues,
    parents: e.parents,
    administrators: e.administrators,
  }));
}

function computeWinsTrend(entries: WinsEntry[]) {
  return entries.map((e) => ({
    week: e.timestamp.slice(0, 10),
    winsCount: e.wins.length,
    winsPercent: Math.min(100, Math.round((e.wins.length / 3) * 100)),
  }));
}

function computeInsights(responses: SurveyResponse[]): TeacherInsight[] {
  const settings = getAdminSettings();
  const adoptionFactor = settings.adoptionFactor / 100;
  const grouped: Record<string, SurveyResponse[]> = {};
  responses.forEach((r) => {
    if (!grouped[r.issueId]) grouped[r.issueId] = [];
    grouped[r.issueId].push(r);
  });

  return Object.entries(grouped)
    .map(([issueId, issueResponses]) => {
      const issue = FRICTION_ISSUES.find((f) => f.id === issueId);
      const lesson = getLessonForIssue(issueId);
      const severityAvg = issueResponses.reduce((s, r) => s + r.severity, 0) / issueResponses.length;
      const hoursValues = issueResponses.filter((r) => r.hoursSpent != null).map((r) => r.hoursSpent!);
      const hoursAvg = hoursValues.length > 0 ? hoursValues.reduce((s, h) => s + h, 0) / hoursValues.length : 0;
      const predictedFrictionReduction = (severityAvg / 5) * adoptionFactor;
      const predictedHoursSaved = hoursAvg * predictedFrictionReduction;
      const predictedMoneySaved = predictedHoursSaved * settings.hourlyCost;
      return {
        issueId,
        issueDescription: issue?.description ?? "Other",
        severityAvg: Math.round(severityAvg * 10) / 10,
        hoursAvg: Math.round(hoursAvg * 10) / 10,
        cqLessonName: lesson?.cqLessonName ?? "—",
        tip: lesson?.tip ?? "—",
        predictedFrictionReduction: Math.round(predictedFrictionReduction * 100),
        predictedHoursSaved: Math.round(predictedHoursSaved * 10) / 10,
        predictedMoneySaved: Math.round(predictedMoneySaved * 100) / 100,
      };
    })
    .sort((a, b) => b.predictedMoneySaved - a.predictedMoneySaved);
}

function computeMetrics(responses: SurveyResponse[]): TimeScopedMetrics {
  const settings = getAdminSettings();
  const adoptionFactor = settings.adoptionFactor / 100;
  const grouped: Record<string, SurveyResponse[]> = {};
  responses.forEach((r) => {
    if (!grouped[r.issueId]) grouped[r.issueId] = [];
    grouped[r.issueId].push(r);
  });
  let totalHoursSaved = 0;
  let totalMoneySaved = 0;
  Object.values(grouped).forEach((issueResponses) => {
    const severityAvg = issueResponses.reduce((s, r) => s + r.severity, 0) / issueResponses.length;
    const hoursValues = issueResponses.filter((r) => r.hoursSpent != null).map((r) => r.hoursSpent!);
    const hoursAvg = hoursValues.length > 0 ? hoursValues.reduce((s, h) => s + h, 0) / hoursValues.length : 0;
    const reduction = (severityAvg / 5) * adoptionFactor;
    totalHoursSaved += hoursAvg * reduction;
    totalMoneySaved += hoursAvg * reduction * settings.hourlyCost;
  });
  return { issuesReported: Object.keys(grouped).length, hoursSaved: Math.round(totalHoursSaved * 10) / 10, moneySaved: Math.round(totalMoneySaved * 100) / 100 };
}

function getSubmissionDates(responses: SurveyResponse[]): string[] {
  const dates = new Set<string>();
  responses.forEach((r) => dates.add(r.timestamp.slice(0, 10)));
  return [...dates].sort();
}

function computeLastWeekMetrics(responses: SurveyResponse[]): TimeScopedMetrics {
  const dates = getSubmissionDates(responses);
  if (dates.length === 0) return { issuesReported: 0, hoursSaved: 0, moneySaved: 0 };
  const lastDate = dates[dates.length - 1];
  return computeMetrics(responses.filter((r) => r.timestamp.slice(0, 10) === lastDate));
}

function computeWoWChange(responses: SurveyResponse[]) {
  const dates = getSubmissionDates(responses);
  if (dates.length < 2) return null;
  const lastDate = dates[dates.length - 1];
  const prevDate = dates[dates.length - 2];
  const current = computeMetrics(responses.filter((r) => r.timestamp.slice(0, 10) === lastDate));
  const previous = computeMetrics(responses.filter((r) => r.timestamp.slice(0, 10) === prevDate));
  return {
    issuesChange: current.issuesReported - previous.issuesReported,
    hoursChange: Math.round((current.hoursSaved - previous.hoursSaved) * 10) / 10,
    moneyChange: Math.round((current.moneySaved - previous.moneySaved) * 100) / 100,
  };
}

function computeReportingStreak(responses: SurveyResponse[]): number {
  return getSubmissionDates(responses).length;
}

function computeTopImprovedIssue(responses: SurveyResponse[]) {
  const dates = getSubmissionDates(responses);
  if (dates.length < 2) return null;
  const lastDate = dates[dates.length - 1];
  const prevDate = dates[dates.length - 2];
  const lastR = responses.filter((r) => r.timestamp.slice(0, 10) === lastDate);
  const prevR = responses.filter((r) => r.timestamp.slice(0, 10) === prevDate);
  const avgSev = (rs: SurveyResponse[]) => rs.reduce((s, r) => s + r.severity, 0) / rs.length;
  const prevByIssue: Record<string, SurveyResponse[]> = {};
  prevR.forEach((r) => { if (!prevByIssue[r.issueId]) prevByIssue[r.issueId] = []; prevByIssue[r.issueId].push(r); });
  const lastByIssue: Record<string, SurveyResponse[]> = {};
  lastR.forEach((r) => { if (!lastByIssue[r.issueId]) lastByIssue[r.issueId] = []; lastByIssue[r.issueId].push(r); });
  let best = 0, bestId = "";
  Object.keys(prevByIssue).forEach((id) => {
    const imp = lastByIssue[id] ? avgSev(prevByIssue[id]) - avgSev(lastByIssue[id]) : avgSev(prevByIssue[id]);
    if (imp > best) { best = imp; bestId = id; }
  });
  if (best <= 0) return null;
  const issue = FRICTION_ISSUES.find((f) => f.id === bestId);
  return { description: issue?.description ?? "Other", improvement: Math.round(best * 10) / 10 };
}

function computeTopFriction(responses: SurveyResponse[], limit = 5): TopFrictionItem[] {
  const grouped: Record<string, SurveyResponse[]> = {};
  responses.forEach((r) => { if (!grouped[r.issueId]) grouped[r.issueId] = []; grouped[r.issueId].push(r); });
  return Object.entries(grouped)
    .map(([issueId, rs]) => ({
      issueId,
      description: FRICTION_ISSUES.find((f) => f.id === issueId)?.description ?? "Other",
      severity: Math.round((rs.reduce((s, r) => s + r.severity, 0) / rs.length) * 10) / 10,
      count: rs.length,
    }))
    .sort((a, b) => b.severity - a.severity)
    .slice(0, limit);
}

function computeTopWins(entries: WinsEntry[], limit = 5): TopWinItem[] {
  const counts: Record<string, number> = {};
  entries.forEach((e) => e.wins.forEach((wId) => { counts[wId] = (counts[wId] || 0) + 1; }));
  return Object.entries(counts)
    .map(([winId, count]) => ({ winId, label: CQ_WINS.find((w) => w.id === winId)?.label ?? winId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function computeLastWeekTopFriction(responses: SurveyResponse[]): TopFrictionItem[] {
  const dates = getSubmissionDates(responses);
  if (dates.length === 0) return [];
  return computeTopFriction(responses.filter((r) => r.timestamp.slice(0, 10) === dates[dates.length - 1]));
}

function computeCumulativeTopFriction(responses: SurveyResponse[]): TopFrictionItem[] {
  return computeTopFriction(responses);
}

function computeLastWeekTopWins(entries: WinsEntry[]): TopWinItem[] {
  const dates = [...new Set(entries.map((e) => e.timestamp.slice(0, 10)))].sort();
  if (dates.length === 0) return [];
  return computeTopWins(entries.filter((e) => e.timestamp.slice(0, 10) === dates[dates.length - 1]));
}

function computeCumulativeTopWins(entries: WinsEntry[]): TopWinItem[] {
  return computeTopWins(entries);
}

function computeWoWFrictionChange(responses: SurveyResponse[]) {
  const dates = getSubmissionDates(responses);
  if (dates.length < 2) return [];
  const curr = computeTopFriction(responses.filter((r) => r.timestamp.slice(0, 10) === dates[dates.length - 1]));
  const prev = computeTopFriction(responses.filter((r) => r.timestamp.slice(0, 10) === dates[dates.length - 2]));
  const prevMap = new Map(prev.map((p) => [p.issueId, p]));
  const results: Array<{ description: string; prevSeverity: number; currSeverity: number; change: number }> = [];
  curr.forEach((c) => {
    const p = prevMap.get(c.issueId);
    if (p) results.push({ description: c.description, prevSeverity: p.severity, currSeverity: c.severity, change: Math.round((c.severity - p.severity) * 10) / 10 });
  });
  prev.forEach((p) => { if (!curr.find((c) => c.issueId === p.issueId)) results.push({ description: p.description, prevSeverity: p.severity, currSeverity: 0, change: -p.severity }); });
  curr.forEach((c) => { if (!prevMap.has(c.issueId)) results.push({ description: c.description, prevSeverity: 0, currSeverity: c.severity, change: c.severity }); });
  return results.sort((a, b) => a.change - b.change);
}

function computeBestWinsWeek(entries: WinsEntry[]) {
  if (entries.length === 0) return null;
  const byDate: Record<string, string[]> = {};
  entries.forEach((e) => { const d = e.timestamp.slice(0, 10); if (!byDate[d]) byDate[d] = []; byDate[d].push(...e.wins); });
  let bestDate = "", bestCount = 0, bestWins: string[] = [];
  Object.entries(byDate).forEach(([date, wins]) => {
    const unique = [...new Set(wins)];
    if (unique.length > bestCount) { bestCount = unique.length; bestDate = date; bestWins = unique; }
  });
  if (!bestDate) return null;
  return { week: bestDate, winsCount: bestCount, wins: bestWins.map((wId) => CQ_WINS.find((w) => w.id === wId)?.label ?? wId) };
}

// ── The Hook ──

export type DateFilter = "last-week" | "last-2-weeks" | "last-month" | "semester" | "school-year" | "all-time";

function getDateCutoff(filter: DateFilter): string | null {
  if (filter === "all-time") return null;
  const now = new Date();
  switch (filter) {
    case "last-week":
      now.setDate(now.getDate() - 7);
      return now.toISOString();
    case "last-2-weeks":
      now.setDate(now.getDate() - 14);
      return now.toISOString();
    case "last-month":
      now.setMonth(now.getMonth() - 1);
      return now.toISOString();
    case "semester": {
      // Current semester: Jan-Jun or Jul-Dec
      const month = now.getMonth(); // 0-indexed
      const year = now.getFullYear();
      if (month < 6) {
        return new Date(year, 0, 1).toISOString(); // Jan 1
      } else {
        return new Date(year, 6, 1).toISOString(); // Jul 1
      }
    }
    case "school-year": {
      // School year: Aug 1 of previous/current year
      const month = now.getMonth();
      const year = now.getFullYear();
      const startYear = month >= 7 ? year : year - 1; // Aug=7 (0-indexed)
      return new Date(startYear, 7, 1).toISOString(); // Aug 1
    }
    default:
      return null;
  }
}

function filterByDate<T extends { timestamp: string }>(items: T[], cutoff: string | null): T[] {
  if (!cutoff) return items;
  return items.filter((item) => item.timestamp >= cutoff);
}

export interface SchoolDashboardData {
  isLoading: boolean;
  isMockData: boolean;
  scores: NSMScores;
  trends: ReturnType<typeof computeWeeklyTrends>;
  frictionBreakdown: ReturnType<typeof computeFrictionBreakdown>;
  confidenceBreakdown: ReturnType<typeof computeConfidenceBreakdown>;
  winsTrend: ReturnType<typeof computeWinsTrend>;
  insights: TeacherInsight[];
  lastWeek: TimeScopedMetrics;
  wow: ReturnType<typeof computeWoWChange>;
  cumulative: TimeScopedMetrics;
  streak: number;
  topImproved: ReturnType<typeof computeTopImprovedIssue>;
  lastWeekFriction: TopFrictionItem[];
  wowFriction: ReturnType<typeof computeWoWFrictionChange>;
  cumulativeFriction: TopFrictionItem[];
  lastWeekWins: TopWinItem[];
  cumulativeWins: TopWinItem[];
  bestWinsWeek: ReturnType<typeof computeBestWinsWeek>;
  rawSurveyResponses: SurveyResponse[];
  rawConfidenceEntries: ConfidenceEntry[];
  rawWinsEntries: WinsEntry[];
  frictionCount: number;
  winsCount: number;
  surveyCount: number;
  /** Average severity on 1–5 scale (intuitive) */
  avgSeverity: number;
  /** Average confidence on 1–5 scale (intuitive) */
  avgConfidenceRating: number;
}

export function useSchoolData(dateFilter: DateFilter = "all-time"): SchoolDashboardData {
  const { selectedSchoolId } = useSchoolContext();
  const isMock = selectedSchoolId === TEST_SCHOOL_ID;
  const dateCutoff = getDateCutoff(dateFilter);

  const { data: dbRows, isLoading } = useQuery({
    queryKey: ["school-survey-data", selectedSchoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_responses")
        .select("*")
        .eq("school_id", selectedSchoolId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !isMock && !!selectedSchoolId,
  });

  return useMemo(() => {
    if (isMock) {
      // Use existing localStorage mock data
      const mockSurveys = filterByDate(getSurveyResponses(), dateCutoff);
      const mockConfidence = filterByDate(getConfidenceEntries(), dateCutoff);
      const mockWins = filterByDate(getWinsEntries(), dateCutoff);
      const totalWinsSelected = mockWins.reduce((sum, e) => sum + e.wins.length, 0);
      return {
        isLoading: false,
        isMockData: true,
        scores: getLatestNSMScores(),
        trends: getWeeklyTrends(),
        frictionBreakdown: getFrictionBreakdown(),
        confidenceBreakdown: getConfidenceBreakdown(),
        winsTrend: getWinsTrend(),
        insights: calculateInsights(),
        lastWeek: getLastWeekMetrics(),
        wow: getWoWChange(),
        cumulative: getCumulativeMetrics(),
        streak: getReportingStreak(),
        topImproved: getTopImprovedIssue(),
        lastWeekFriction: getLastWeekTopFriction(),
        wowFriction: getWoWFrictionChange(),
        cumulativeFriction: getCumulativeTopFriction(),
        lastWeekWins: getLastWeekTopWins(),
        cumulativeWins: getCumulativeTopWins(),
        bestWinsWeek: getBestWinsWeek(),
        rawSurveyResponses: mockSurveys,
        rawConfidenceEntries: mockConfidence,
        rawWinsEntries: mockWins,
        frictionCount: mockSurveys.length,
        winsCount: totalWinsSelected,
        surveyCount: new Set(mockSurveys.map((r) => r.timestamp.slice(0, 10))).size,
        avgSeverity: mockSurveys.length > 0
          ? Math.round((mockSurveys.reduce((s, r) => s + r.severity, 0) / mockSurveys.length) * 10) / 10
          : 0,
        avgConfidenceRating: mockConfidence.length > 0
          ? Math.round(((mockConfidence[mockConfidence.length - 1].colleagues + mockConfidence[mockConfidence.length - 1].parents + mockConfidence[mockConfidence.length - 1].administrators) / 3) * 10) / 10
          : 0,
      };
    }

    // Parse real DB data
    const parsed = parseDbResponses((dbRows as unknown as SurveyResponseRow[]) ?? []);
    // Apply date filter
    const surveyResponses = filterByDate(parsed.surveyResponses, dateCutoff);
    const confidenceEntries = filterByDate(parsed.confidenceEntries, dateCutoff);
    const winsEntries = filterByDate(parsed.winsEntries, dateCutoff);
    const totalWinsSelected = winsEntries.reduce((sum, e) => sum + e.wins.length, 0);

    return {
      isLoading,
      isMockData: false,
      scores: computeNSMScores(surveyResponses, confidenceEntries, winsEntries),
      trends: computeWeeklyTrends(surveyResponses, confidenceEntries, winsEntries),
      frictionBreakdown: computeFrictionBreakdown(surveyResponses),
      confidenceBreakdown: computeConfidenceBreakdown(confidenceEntries),
      winsTrend: computeWinsTrend(winsEntries),
      insights: computeInsights(surveyResponses),
      lastWeek: computeLastWeekMetrics(surveyResponses),
      wow: computeWoWChange(surveyResponses),
      cumulative: computeMetrics(surveyResponses),
      streak: computeReportingStreak(surveyResponses),
      topImproved: computeTopImprovedIssue(surveyResponses),
      lastWeekFriction: computeLastWeekTopFriction(surveyResponses),
      wowFriction: computeWoWFrictionChange(surveyResponses),
      cumulativeFriction: computeCumulativeTopFriction(surveyResponses),
      lastWeekWins: computeLastWeekTopWins(winsEntries),
      cumulativeWins: computeCumulativeTopWins(winsEntries),
      bestWinsWeek: computeBestWinsWeek(winsEntries),
      rawSurveyResponses: surveyResponses,
      rawConfidenceEntries: confidenceEntries,
      rawWinsEntries: winsEntries,
      frictionCount: surveyResponses.length,
      winsCount: totalWinsSelected,
      surveyCount: new Set(surveyResponses.map((r) => r.timestamp.slice(0, 10))).size,
      avgSeverity: surveyResponses.length > 0
        ? Math.round((surveyResponses.reduce((s, r) => s + r.severity, 0) / surveyResponses.length) * 10) / 10
        : 0,
      avgConfidenceRating: confidenceEntries.length > 0
        ? Math.round(((confidenceEntries[confidenceEntries.length - 1].colleagues + confidenceEntries[confidenceEntries.length - 1].parents + confidenceEntries[confidenceEntries.length - 1].administrators) / 3) * 10) / 10
        : 0,
    };
  }, [selectedSchoolId, isMock, dbRows, isLoading, dateCutoff]);
}
