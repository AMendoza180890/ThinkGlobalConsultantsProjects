export interface FrictionCategory {
  id: string;
  label: string;
  weight: number; // 1–3
}

export interface FrictionIssue {
  id: string;
  categoryId: string;
  description: string;
}

export interface LessonMapping {
  frictionId: string;
  cqLessonName: string;
  tip: string;
}

export interface SurveyResponse {
  id: string;
  issueId: string;
  severity: number;
  hoursSpent?: number;
  context?: string;
  timestamp: string;
}

export interface ConfidenceEntry {
  id: string;
  colleagues: number;
  parents: number;
  administrators: number;
  text?: string;
  timestamp: string;
}

export interface WinsEntry {
  id: string;
  wins: string[];
  ratings?: Record<string, number>;
  text?: string;
  timestamp: string;
}

export interface AdminSettings {
  hourlyCost: number;
  adoptionFactor: number;
  totalTeachers: number;
}

export interface TeacherInsight {
  issueId: string;
  issueDescription: string;
  severityAvg: number;
  hoursAvg: number;
  cqLessonName: string;
  tip: string;
  predictedFrictionReduction: number;
  predictedHoursSaved: number;
  predictedMoneySaved: number;
}

export interface NSMScores {
  frictionScore: number;       // 0–100, higher = more friction
  confidenceScore: number;     // 0–100, higher = better
  cqWinsScore: number;         // 0–100, higher = better
  nsm: number;                 // 0–100, higher = lower risk
  turnoverRisk: number;        // percentage
}

export const CQ_WINS = [
  { id: "win-1", label: "Used active listening" },
  { id: "win-2", label: "Asked a clarifying question" },
  { id: "win-3", label: "Adapted my communication style" },
  { id: "win-4", label: "Included a quiet colleague" },
  { id: "win-5", label: "Navigated a misunderstanding calmly" },
  { id: "win-6", label: "Learned something new about a culture" },
  { id: "win-7", label: "Built rapport across difference" },
  { id: "win-8", label: "Gave culturally sensitive feedback" },
  { id: "win-9", label: "Felt truly seen and known by a colleague" },
  { id: "win-10", label: "Felt understood across a cultural difference" },
  { id: "win-11", label: "Felt safe to be my authentic self" },
];

export const MAX_WINS = CQ_WINS.length;

// ── Friction Categories (Tier 1) with weights ──
export const FRICTION_CATEGORIES: FrictionCategory[] = [
  { id: "cat-1", label: "Misaligned expectations", weight: 2 },
  { id: "cat-2", label: "Delayed responses", weight: 1 },
  { id: "cat-3", label: "Conflicts / friction", weight: 3 },
  { id: "cat-4", label: "Cultural misunderstandings", weight: 2 },
  { id: "cat-5", label: "Missed deadlines", weight: 1 },
];

// ── Friction Issues (Tier 2) ──
export const FRICTION_ISSUES: FrictionIssue[] = [
  { id: "fi-1", categoryId: "cat-1", description: "Unclear tasks or role responsibilities" },
  { id: "fi-5", categoryId: "cat-1", description: "Mixed messaging / inconsistent information" },
  { id: "fi-9", categoryId: "cat-1", description: "Lack of clarity on leadership expectations" },
  { id: "fi-2", categoryId: "cat-2", description: "Delayed responses from colleagues" },
  { id: "fi-10", categoryId: "cat-2", description: "Slow follow-up on action items" },
  { id: "fi-4", categoryId: "cat-3", description: "Conflicting priorities between teams" },
  { id: "fi-8", categoryId: "cat-3", description: "Collaboration friction with team members" },
  { id: "fi-3", categoryId: "cat-4", description: "Misunderstandings in meetings" },
  { id: "fi-6", categoryId: "cat-4", description: "Feeling excluded from decisions" },
  { id: "fi-7", categoryId: "cat-4", description: "Cultural misunderstandings (jokes, norms)" },
  { id: "fi-11", categoryId: "cat-5", description: "Deadlines missed due to miscommunication" },
  { id: "fi-12", categoryId: "cat-5", description: "Tasks delayed by unclear handoffs" },
];

// ── CQ Lesson Mappings ──
export const LESSON_MAPPINGS: LessonMapping[] = [
  { frictionId: "fi-1", cqLessonName: "Cultural Strategy (Dec)", tip: "Align on goals before assigning tasks; clarify assumptions explicitly." },
  { frictionId: "fi-2", cqLessonName: "Cultural Curiosity (Jan)", tip: "Weekly 5-min check-ins with colleagues to clarify expectations." },
  { frictionId: "fi-3", cqLessonName: "Handling Misunderstandings Gracefully (Apr)", tip: "Repeat back key points to ensure clarity." },
  { frictionId: "fi-4", cqLessonName: "Navigating Conflicting Priorities (Feb)", tip: "Use a shared priority matrix to align on what matters most this week." },
  { frictionId: "fi-5", cqLessonName: "Clear Cross-Cultural Communication (Mar)", tip: "Summarize decisions in writing after verbal discussions to reduce ambiguity." },
  { frictionId: "fi-6", cqLessonName: "Inclusive Decision-Making (May)", tip: "Proactively invite quiet colleagues into discussions; ask for input before finalizing." },
  { frictionId: "fi-7", cqLessonName: "Cultural Norms Awareness (Jun)", tip: "When humor or norms clash, pause and ask: 'Can you help me understand what you meant?'" },
  { frictionId: "fi-8", cqLessonName: "Building Trust Across Cultures (Jul)", tip: "Share one personal/professional win with a colleague this week to build rapport." },
  { frictionId: "fi-9", cqLessonName: "Leading with Cultural Intelligence (Aug)", tip: "Ask your leader: 'What does success look like for this task?' to reduce ambiguity." },
  { frictionId: "fi-10", cqLessonName: "Proactive Follow-Up (Sep)", tip: "Set a 48-hour follow-up reminder for every action item you assign or receive." },
  { frictionId: "fi-11", cqLessonName: "Cross-Cultural Time Management (Oct)", tip: "Clarify deadlines with explicit dates/times and confirm understanding across teams." },
  { frictionId: "fi-12", cqLessonName: "Effective Handoffs (Nov)", tip: "Use a brief written handoff checklist when passing tasks between colleagues." },
];

export function getLessonForIssue(frictionId: string): LessonMapping | undefined {
  return LESSON_MAPPINGS.find((lm) => lm.frictionId === frictionId);
}

// ── Storage ──
const STORAGE_KEYS = {
  surveys: "cq_survey_responses",
  settings: "cq_admin_settings",
  reflections: "cq_reflections",
  confidence: "cq_confidence",
  wins: "cq_wins",
};

export function getSurveyResponses(): SurveyResponse[] {
  const data = localStorage.getItem(STORAGE_KEYS.surveys);
  return data ? JSON.parse(data) : [];
}

export function addSurveyResponses(responses: Omit<SurveyResponse, "id" | "timestamp">[]): SurveyResponse[] {
  const existing = getSurveyResponses();
  const newResponses = responses.map((r) => ({
    ...r,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }));
  existing.push(...newResponses);
  localStorage.setItem(STORAGE_KEYS.surveys, JSON.stringify(existing));
  return newResponses;
}

export function getConfidenceEntries(): ConfidenceEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.confidence);
  return data ? JSON.parse(data) : [];
}

export function addConfidenceEntry(entry: Omit<ConfidenceEntry, "id" | "timestamp">): ConfidenceEntry {
  const existing = getConfidenceEntries();
  const newEntry: ConfidenceEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  existing.push(newEntry);
  localStorage.setItem(STORAGE_KEYS.confidence, JSON.stringify(existing));
  return newEntry;
}

export function getWinsEntries(): WinsEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.wins);
  return data ? JSON.parse(data) : [];
}

export function addWinsEntry(entry: Omit<WinsEntry, "id" | "timestamp">): WinsEntry {
  const existing = getWinsEntries();
  const newEntry: WinsEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  existing.push(newEntry);
  localStorage.setItem(STORAGE_KEYS.wins, JSON.stringify(existing));
  return newEntry;
}

export function getAdminSettings(): AdminSettings {
  const data = localStorage.getItem(STORAGE_KEYS.settings);
  return data ? JSON.parse(data) : { hourlyCost: 50, adoptionFactor: 70, totalTeachers: 50 };
}

export function saveAdminSettings(settings: AdminSettings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function getReflections(): Record<string, boolean> {
  const data = localStorage.getItem(STORAGE_KEYS.reflections);
  return data ? JSON.parse(data) : {};
}

export function saveReflection(lessonId: string, tried: boolean) {
  const reflections = getReflections();
  reflections[lessonId] = tried;
  localStorage.setItem(STORAGE_KEYS.reflections, JSON.stringify(reflections));
}

// ── CQ Health Score Calculations ──

function getIssueWeight(issueId: string): number {
  const issue = FRICTION_ISSUES.find((fi) => fi.id === issueId);
  if (!issue) return 1;
  const cat = FRICTION_CATEGORIES.find((c) => c.id === issue.categoryId);
  return cat?.weight ?? 1;
}

export function calculateFrictionScore(responses: SurveyResponse[]): number {
  if (responses.length === 0) return 0;
  
  // Shift severity to a 0-4 scale so a severity of 1 = 0 friction
  const totalWeightedSeverity = responses.reduce((sum, r) => {
    const weight = getIssueWeight(r.issueId);
    return sum + (r.severity - 1) * weight;
  }, 0);
  
  // Determine max possible score based ONLY on the issues actually reported
  const totalObservedWeights = responses.reduce((sum, r) => {
    return sum + getIssueWeight(r.issueId);
  }, 0);
  
  if (totalObservedWeights === 0) return 0;
  
  const maxPossible = totalObservedWeights * 4; // 4 is max shifted severity (5-1)
  return Math.round((totalWeightedSeverity / maxPossible) * 100);
}

/** Calculate Confidence Score (0–100, higher = better) */
export function calculateConfidenceScore(entry: ConfidenceEntry | null): number {
  if (!entry) return 50; // default neutral
  const normColleagues = ((entry.colleagues - 1) / 4) * 100;
  const normParents = ((entry.parents - 1) / 4) * 100;
  const normAdmins = ((entry.administrators - 1) / 4) * 100;
  return Math.round(0.5 * normColleagues + 0.3 * normParents + 0.2 * normAdmins);
}

export function calculateWinsScore(entry: WinsEntry | null): number {
  if (!entry) return 0;
  // A great week is 3 distinct wins. Cap it at 100%.
  return Math.min(100, Math.round((entry.wins.length / 3) * 100));
}

/** Calculate CQ Health Score composite score (0–100, higher = lower burnout risk) */
export function calculateNSM(friction: number, confidence: number, wins: number): number {
  const nsm = (1 - friction / 100) * 0.5 + (confidence / 100) * 0.3 + (wins / 100) * 0.2;
  return Math.round(nsm * 100);
}

export function calculateTurnoverRisk(nsm: number): number {
  // An CQ Health Score of 0 is critical risk (100%), an CQ Health Score of 100 is no risk (0%).
  return Math.max(0, Math.min(100, 100 - nsm));
}

/** Get CQ Health Score scores from latest data */
export function getLatestNSMScores(): NSMScores {
  const surveyResponses = getSurveyResponses();
  const confidenceEntries = getConfidenceEntries();
  const winsEntries = getWinsEntries();

  // Use latest week's data
  const latestConfidence = confidenceEntries.length > 0 ? confidenceEntries[confidenceEntries.length - 1] : null;
  const latestWins = winsEntries.length > 0 ? winsEntries[winsEntries.length - 1] : null;

  // For friction, use the most recent batch (same timestamp prefix)
  const latestResponses = getLatestWeekResponses(surveyResponses);

  const frictionScore = calculateFrictionScore(latestResponses);
  const confidenceScore = calculateConfidenceScore(latestConfidence);
  const cqWinsScore = calculateWinsScore(latestWins);
  const nsm = calculateNSM(frictionScore, confidenceScore, cqWinsScore);
  const turnoverRisk = calculateTurnoverRisk(nsm);

  return { frictionScore, confidenceScore, cqWinsScore, nsm, turnoverRisk };
}

/** Get responses from the most recent submission batch */
function getLatestWeekResponses(responses: SurveyResponse[]): SurveyResponse[] {
  if (responses.length === 0) return [];
  // Group by date (day)
  const sorted = [...responses].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const latestDate = sorted[0].timestamp.slice(0, 10);
  return sorted.filter((r) => r.timestamp.slice(0, 10) === latestDate);
}

/** Get weekly trend data for CQ Health Score dashboard */
export function getWeeklyTrends(): Array<{
  week: string;
  frictionScore: number;
  confidenceScore: number;
  cqWinsScore: number;
  nsm: number;
  turnoverRisk: number;
}> {
  const surveyResponses = getSurveyResponses();
  const confidenceEntries = getConfidenceEntries();
  const winsEntries = getWinsEntries();

  // Group surveys by date
  const surveyByDate: Record<string, SurveyResponse[]> = {};
  surveyResponses.forEach((r) => {
    const date = r.timestamp.slice(0, 10);
    if (!surveyByDate[date]) surveyByDate[date] = [];
    surveyByDate[date].push(r);
  });

  // Collect all unique dates
  const allDates = new Set<string>();
  surveyResponses.forEach((r) => allDates.add(r.timestamp.slice(0, 10)));
  confidenceEntries.forEach((c) => allDates.add(c.timestamp.slice(0, 10)));
  winsEntries.forEach((w) => allDates.add(w.timestamp.slice(0, 10)));

  const sortedDates = [...allDates].sort();

  return sortedDates.map((date) => {
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

/** Get friction breakdown for charts */
export function getFrictionBreakdown(): Array<{
  category: string;
  avgSeverity: number;
  reportCount: number;
  percentReporting: number;
}> {
  const responses = getSurveyResponses();
  const totalSubmissions = new Set(responses.map((r) => r.timestamp.slice(0, 10))).size || 1;

  return FRICTION_CATEGORIES.map((cat) => {
    const catIssueIds = FRICTION_ISSUES.filter((fi) => fi.categoryId === cat.id).map((fi) => fi.id);
    const catResponses = responses.filter((r) => catIssueIds.includes(r.issueId));
    const avgSeverity = catResponses.length > 0
      ? Math.round((catResponses.reduce((s, r) => s + r.severity, 0) / catResponses.length) * 10) / 10
      : 0;
    const uniqueDays = new Set(catResponses.map((r) => r.timestamp.slice(0, 10))).size;
    return {
      category: cat.label,
      avgSeverity,
      reportCount: catResponses.length,
      percentReporting: Math.round((uniqueDays / totalSubmissions) * 100),
    };
  });
}

/** Get confidence breakdown across groups */
export function getConfidenceBreakdown(): Array<{
  week: string;
  colleagues: number;
  parents: number;
  administrators: number;
}> {
  const entries = getConfidenceEntries();
  return entries.map((e) => ({
    week: e.timestamp.slice(0, 10),
    colleagues: e.colleagues,
    parents: e.parents,
    administrators: e.administrators,
  }));
}

/** Get CQ wins trend */
export function getWinsTrend(): Array<{
  week: string;
  winsCount: number;
  winsPercent: number;
}> {
  const entries = getWinsEntries();
  return entries.map((e) => ({
    week: e.timestamp.slice(0, 10),
    winsCount: e.wins.length,
    winsPercent: Math.min(100, Math.round((e.wins.length / 3) * 100)),
  }));
}

// ── Legacy insight calculation ──
export function calculateInsights(): TeacherInsight[] {
  const responses = getSurveyResponses();
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

// ── Time-Scoped Metrics ──

export interface TimeScopedMetrics {
  issuesReported: number;
  hoursSaved: number;
  moneySaved: number;
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
    const hoursSaved = hoursAvg * reduction;
    totalHoursSaved += hoursSaved;
    totalMoneySaved += hoursSaved * settings.hourlyCost;
  });

  return {
    issuesReported: Object.keys(grouped).length,
    hoursSaved: Math.round(totalHoursSaved * 10) / 10,
    moneySaved: Math.round(totalMoneySaved * 100) / 100,
  };
}

/** Get unique submission dates sorted ascending */
function getSubmissionDates(): string[] {
  const responses = getSurveyResponses();
  const dates = new Set<string>();
  responses.forEach((r) => dates.add(r.timestamp.slice(0, 10)));
  return [...dates].sort();
}

/** Metrics for the most recent submission date ("last week") */
export function getLastWeekMetrics(): TimeScopedMetrics {
  const responses = getSurveyResponses();
  const dates = getSubmissionDates();
  if (dates.length === 0) return { issuesReported: 0, hoursSaved: 0, moneySaved: 0 };
  const lastDate = dates[dates.length - 1];
  return computeMetrics(responses.filter((r) => r.timestamp.slice(0, 10) === lastDate));
}

/** Metrics for the second-most-recent submission date ("previous week") */
export function getPreviousWeekMetrics(): TimeScopedMetrics | null {
  const responses = getSurveyResponses();
  const dates = getSubmissionDates();
  if (dates.length < 2) return null;
  const prevDate = dates[dates.length - 2];
  return computeMetrics(responses.filter((r) => r.timestamp.slice(0, 10) === prevDate));
}

/** Week-over-week change (current − previous). Null if no previous data. */
export function getWoWChange(): { issuesChange: number; hoursChange: number; moneyChange: number } | null {
  const current = getLastWeekMetrics();
  const previous = getPreviousWeekMetrics();
  if (!previous) return null;
  return {
    issuesChange: current.issuesReported - previous.issuesReported,
    hoursChange: Math.round((current.hoursSaved - previous.hoursSaved) * 10) / 10,
    moneyChange: Math.round((current.moneySaved - previous.moneySaved) * 100) / 100,
  };
}

/** Cumulative school-year metrics (all data) */
export function getCumulativeMetrics(): TimeScopedMetrics {
  return computeMetrics(getSurveyResponses());
}

/** Reporting streak — consecutive submission dates (days with at least one response) */
export function getReportingStreak(): number {
  const dates = getSubmissionDates();
  if (dates.length === 0) return 0;
  // For weekly surveys, count total submission dates as "weeks"
  return dates.length;
}

/** Top improved issue — the issue whose severity dropped most between the two most recent dates */
export function getTopImprovedIssue(): { description: string; improvement: number } | null {
  const responses = getSurveyResponses();
  const dates = getSubmissionDates();
  if (dates.length < 2) return null;

  const lastDate = dates[dates.length - 1];
  const prevDate = dates[dates.length - 2];

  const lastResponses = responses.filter((r) => r.timestamp.slice(0, 10) === lastDate);
  const prevResponses = responses.filter((r) => r.timestamp.slice(0, 10) === prevDate);

  const avgSeverity = (rs: SurveyResponse[]) => rs.reduce((s, r) => s + r.severity, 0) / rs.length;

  // Group by issue for both periods
  const prevByIssue: Record<string, SurveyResponse[]> = {};
  prevResponses.forEach((r) => {
    if (!prevByIssue[r.issueId]) prevByIssue[r.issueId] = [];
    prevByIssue[r.issueId].push(r);
  });

  const lastByIssue: Record<string, SurveyResponse[]> = {};
  lastResponses.forEach((r) => {
    if (!lastByIssue[r.issueId]) lastByIssue[r.issueId] = [];
    lastByIssue[r.issueId].push(r);
  });

  let bestImprovement = 0;
  let bestIssueId = "";

  Object.keys(prevByIssue).forEach((issueId) => {
    if (lastByIssue[issueId]) {
      const prevAvg = avgSeverity(prevByIssue[issueId]);
      const lastAvg = avgSeverity(lastByIssue[issueId]);
      const improvement = prevAvg - lastAvg; // positive = improved
      if (improvement > bestImprovement) {
        bestImprovement = improvement;
        bestIssueId = issueId;
      }
    }
  });

  // Also check issues that were reported before but not this week (fully resolved)
  Object.keys(prevByIssue).forEach((issueId) => {
    if (!lastByIssue[issueId]) {
      const prevAvg = avgSeverity(prevByIssue[issueId]);
      if (prevAvg > bestImprovement) {
        bestImprovement = prevAvg;
        bestIssueId = issueId;
      }
    }
  });

  if (bestImprovement <= 0) return null;

  const issue = FRICTION_ISSUES.find((f) => f.id === bestIssueId);
  return {
    description: issue?.description ?? "Other",
    improvement: Math.round(bestImprovement * 10) / 10,
  };
}

// ── Top Friction Issues & Wins by Time Period ──

export interface TopFrictionItem {
  issueId: string;
  description: string;
  severity: number;
  count: number;
}

export interface TopWinItem {
  winId: string;
  label: string;
  count: number;
}

function getTopFrictionFromResponses(responses: SurveyResponse[], limit = 5): TopFrictionItem[] {
  const grouped: Record<string, SurveyResponse[]> = {};
  responses.forEach((r) => {
    if (!grouped[r.issueId]) grouped[r.issueId] = [];
    grouped[r.issueId].push(r);
  });

  return Object.entries(grouped)
    .map(([issueId, rs]) => {
      const issue = FRICTION_ISSUES.find((f) => f.id === issueId);
      return {
        issueId,
        description: issue?.description ?? "Other",
        severity: Math.round((rs.reduce((s, r) => s + r.severity, 0) / rs.length) * 10) / 10,
        count: rs.length,
      };
    })
    .sort((a, b) => b.severity - a.severity)
    .slice(0, limit);
}

function getTopWinsFromEntries(entries: WinsEntry[], limit = 5): TopWinItem[] {
  const counts: Record<string, number> = {};
  entries.forEach((e) => {
    e.wins.forEach((wId) => {
      counts[wId] = (counts[wId] || 0) + 1;
    });
  });

  return Object.entries(counts)
    .map(([winId, count]) => {
      const win = CQ_WINS.find((w) => w.id === winId);
      return { winId, label: win?.label ?? winId, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Top friction issues for last week */
export function getLastWeekTopFriction(): TopFrictionItem[] {
  const responses = getSurveyResponses();
  const dates = getSubmissionDates();
  if (dates.length === 0) return [];
  const lastDate = dates[dates.length - 1];
  return getTopFrictionFromResponses(responses.filter((r) => r.timestamp.slice(0, 10) === lastDate));
}

/** Top friction issues for previous week (for WoW comparison) */
export function getPreviousWeekTopFriction(): TopFrictionItem[] {
  const responses = getSurveyResponses();
  const dates = getSubmissionDates();
  if (dates.length < 2) return [];
  const prevDate = dates[dates.length - 2];
  return getTopFrictionFromResponses(responses.filter((r) => r.timestamp.slice(0, 10) === prevDate));
}

/** Top friction issues cumulative (school year) */
export function getCumulativeTopFriction(): TopFrictionItem[] {
  return getTopFrictionFromResponses(getSurveyResponses());
}

/** Top wins for last week */
export function getLastWeekTopWins(): TopWinItem[] {
  const entries = getWinsEntries();
  const dates = [...new Set(entries.map((e) => e.timestamp.slice(0, 10)))].sort();
  if (dates.length === 0) return [];
  const lastDate = dates[dates.length - 1];
  return getTopWinsFromEntries(entries.filter((e) => e.timestamp.slice(0, 10) === lastDate));
}

/** Top wins for previous week */
export function getPreviousWeekTopWins(): TopWinItem[] {
  const entries = getWinsEntries();
  const dates = [...new Set(entries.map((e) => e.timestamp.slice(0, 10)))].sort();
  if (dates.length < 2) return [];
  const prevDate = dates[dates.length - 2];
  return getTopWinsFromEntries(entries.filter((e) => e.timestamp.slice(0, 10) === prevDate));
}

/** Top wins cumulative (school year) */
export function getCumulativeTopWins(): TopWinItem[] {
  return getTopWinsFromEntries(getWinsEntries());
}

/** WoW friction change per issue — shows severity change for issues present in both weeks */
export function getWoWFrictionChange(): Array<{ description: string; prevSeverity: number; currSeverity: number; change: number }> {
  const curr = getLastWeekTopFriction();
  const prev = getPreviousWeekTopFriction();
  if (prev.length === 0) return [];

  const prevMap = new Map(prev.map((p) => [p.issueId, p]));
  const results: Array<{ description: string; prevSeverity: number; currSeverity: number; change: number }> = [];

  // Issues in both periods
  curr.forEach((c) => {
    const p = prevMap.get(c.issueId);
    if (p) {
      results.push({
        description: c.description,
        prevSeverity: p.severity,
        currSeverity: c.severity,
        change: Math.round((c.severity - p.severity) * 10) / 10,
      });
    }
  });

  // Issues resolved (in prev but not curr)
  prev.forEach((p) => {
    if (!curr.find((c) => c.issueId === p.issueId)) {
      results.push({
        description: p.description,
        prevSeverity: p.severity,
        currSeverity: 0,
        change: -p.severity,
      });
    }
  });

  // New issues (in curr but not prev)
  curr.forEach((c) => {
    if (!prevMap.has(c.issueId)) {
      results.push({
        description: c.description,
        prevSeverity: 0,
        currSeverity: c.severity,
        change: c.severity,
      });
    }
  });

  return results.sort((a, b) => a.change - b.change); // improvements first
}

/** Best CQ wins week — the submission date with the most wins reported (ideally post-workshop) */
export function getBestWinsWeek(): { week: string; winsCount: number; wins: string[] } | null {
  const entries = getWinsEntries();
  if (entries.length === 0) return null;

  const byDate: Record<string, string[]> = {};
  entries.forEach((e) => {
    const date = e.timestamp.slice(0, 10);
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(...e.wins);
  });

  let bestDate = "";
  let bestCount = 0;
  let bestWins: string[] = [];

  Object.entries(byDate).forEach(([date, wins]) => {
    const unique = [...new Set(wins)];
    if (unique.length > bestCount) {
      bestCount = unique.length;
      bestDate = date;
      bestWins = unique;
    }
  });

  if (!bestDate) return null;

  return {
    week: bestDate,
    winsCount: bestCount,
    wins: bestWins.map((wId) => CQ_WINS.find((w) => w.id === wId)?.label ?? wId),
  };
}

// ── Mock Data Seeding ──

export function seedMockData(force = false) {
  if (!force && getSurveyResponses().length > 0) return; // already seeded

  const weeks = [
    "2026-03-05", "2026-03-12", "2026-03-19", "2026-03-26",
  ];

  // Survey responses across 4 weeks with improving trends
  const mockSurveys: SurveyResponse[] = [
    // Week 1 — high friction
    { id: "m1", issueId: "fi-1", severity: 5, hoursSpent: 3, timestamp: `${weeks[0]}T10:00:00Z` },
    { id: "m2", issueId: "fi-3", severity: 4, hoursSpent: 2, timestamp: `${weeks[0]}T10:00:00Z` },
    { id: "m3", issueId: "fi-6", severity: 4, hoursSpent: 1.5, timestamp: `${weeks[0]}T10:00:00Z` },
    { id: "m4", issueId: "fi-7", severity: 3, hoursSpent: 1, timestamp: `${weeks[0]}T10:00:00Z` },
    { id: "m5", issueId: "fi-4", severity: 4, hoursSpent: 2.5, timestamp: `${weeks[0]}T10:00:00Z` },
    // Week 2 — moderate
    { id: "m6", issueId: "fi-1", severity: 4, hoursSpent: 2, timestamp: `${weeks[1]}T10:00:00Z` },
    { id: "m7", issueId: "fi-3", severity: 3, hoursSpent: 1.5, timestamp: `${weeks[1]}T10:00:00Z` },
    { id: "m8", issueId: "fi-6", severity: 3, hoursSpent: 1, timestamp: `${weeks[1]}T10:00:00Z` },
    { id: "m9", issueId: "fi-8", severity: 3, hoursSpent: 1.5, timestamp: `${weeks[1]}T10:00:00Z` },
    // Week 3 — improving
    { id: "m10", issueId: "fi-1", severity: 3, hoursSpent: 1.5, timestamp: `${weeks[2]}T10:00:00Z` },
    { id: "m11", issueId: "fi-7", severity: 2, hoursSpent: 0.5, timestamp: `${weeks[2]}T10:00:00Z` },
    { id: "m12", issueId: "fi-11", severity: 3, hoursSpent: 1, timestamp: `${weeks[2]}T10:00:00Z` },
    // Week 4 — low friction
    { id: "m13", issueId: "fi-1", severity: 2, hoursSpent: 1, timestamp: `${weeks[3]}T10:00:00Z` },
    { id: "m14", issueId: "fi-5", severity: 2, hoursSpent: 0.5, timestamp: `${weeks[3]}T10:00:00Z` },
  ];

  // Confidence entries — improving over time
  const mockConfidence: ConfidenceEntry[] = [
    { id: "c1", colleagues: 2, parents: 2, administrators: 2, timestamp: `${weeks[0]}T10:00:00Z` },
    { id: "c2", colleagues: 3, parents: 3, administrators: 2, timestamp: `${weeks[1]}T10:00:00Z` },
    { id: "c3", colleagues: 4, parents: 3, administrators: 3, text: "Feeling more comfortable after the workshop", timestamp: `${weeks[2]}T10:00:00Z` },
    { id: "c4", colleagues: 4, parents: 4, administrators: 4, text: "Much more confident this week!", timestamp: `${weeks[3]}T10:00:00Z` },
  ];

  // Wins entries — growing over time
  const mockWins: WinsEntry[] = [
    { id: "w1", wins: ["win-1", "win-2"], ratings: { "win-1": 3, "win-2": 4 }, timestamp: `${weeks[0]}T10:00:00Z` },
    { id: "w2", wins: ["win-1", "win-3", "win-5"], ratings: { "win-1": 4, "win-3": 3, "win-5": 4 }, timestamp: `${weeks[1]}T10:00:00Z` },
    { id: "w3", wins: ["win-1", "win-2", "win-4", "win-6", "win-9"], ratings: { "win-1": 5, "win-2": 4, "win-4": 4, "win-6": 3, "win-9": 5 }, text: "Had a great cross-cultural moment!", timestamp: `${weeks[2]}T10:00:00Z` },
    { id: "w4", wins: ["win-1", "win-3", "win-5", "win-7", "win-9", "win-10", "win-11"], ratings: { "win-1": 5, "win-3": 5, "win-5": 4, "win-7": 4, "win-9": 5, "win-10": 4, "win-11": 5 }, text: "Best week yet!", timestamp: `${weeks[3]}T10:00:00Z` },
  ];

  localStorage.setItem(STORAGE_KEYS.surveys, JSON.stringify(mockSurveys));
  localStorage.setItem(STORAGE_KEYS.confidence, JSON.stringify(mockConfidence));
  localStorage.setItem(STORAGE_KEYS.wins, JSON.stringify(mockWins));
}
