import { useState, useMemo, useEffect } from "react";
import { ShieldAlert, CalendarClock, ChevronDown, UserCheck, BookOpen, CalendarPlus, MessageSquare, Users, ClipboardCheck, Lightbulb, BarChart2, Video, TrendingDown, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip, ReferenceLine,
  ReferenceArea, XAxis, YAxis, CartesianGrid,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type CQDimension = "drive" | "knowledge" | "strategy" | "action";
type Severity = "critical" | "watch";

interface TrendPoint { week: string; score: number }

interface Concern {
  id: string;
  segment: string;
  role?: string;
  tenure?: string;
  level?: string;
  dept?: string;
  dimension: CQDimension;
  score: number;
  severity: Severity;
  criticalSince?: string;
  recommendation: string;
  trend: TrendPoint[];
  /** Mock respondent IDs used to compute attendance against CQ sessions */
  respondentIds: number[];
}

// ─── Mock sessions (CQ-themed, keyed by CQ dimension) ────────────────────────

type CQSessionDim = CQDimension;

interface CQSession {
  id: string;
  title: string;
  dim: CQSessionDim;
  scheduledDate: string; // ISO
}

const CQ_SESSIONS: CQSession[] = [
  // Past — Drive
  { id: "cq1",  dim: "drive",     title: "Motivation Across Cultures",         scheduledDate: "2026-01-12" },
  { id: "cq2",  dim: "drive",     title: "Engagement & Cultural Avoidance",    scheduledDate: "2026-02-17" },
  { id: "cq3",  dim: "drive",     title: "Rebuilding CQ Drive",                scheduledDate: "2026-03-10" },
  // Past — Knowledge
  { id: "cq4",  dim: "knowledge", title: "Reading Cultural Signals",           scheduledDate: "2026-01-20" },
  { id: "cq5",  dim: "knowledge", title: "Culture vs Personality",             scheduledDate: "2026-02-24" },
  { id: "cq6",  dim: "knowledge", title: "High-Context Learners",              scheduledDate: "2026-03-18" },
  // Past — Strategy
  { id: "cq7",  dim: "strategy",  title: "Pre-Interaction Cultural Planning",  scheduledDate: "2026-01-28" },
  { id: "cq8",  dim: "strategy",  title: "Anticipating Cultural Differences",  scheduledDate: "2026-02-20" },
  { id: "cq9",  dim: "strategy",  title: "Strategic Cultural Preparation",     scheduledDate: "2026-03-25" },
  // Past — Action
  { id: "cq10", dim: "action",    title: "Adapting in Real Interactions",      scheduledDate: "2026-02-10" },
  { id: "cq11", dim: "action",    title: "Communication Style Flexibility",    scheduledDate: "2026-03-03" },
  { id: "cq12", dim: "action",    title: "Bridging Knowledge to Behaviour",    scheduledDate: "2026-04-01" },
  // Upcoming — Drive
  { id: "cq13", dim: "drive",     title: "Sustaining CQ Motivation",          scheduledDate: "2026-04-22" },
  { id: "cq14", dim: "drive",     title: "Peer Support for CQ Growth",        scheduledDate: "2026-05-13" },
  // Upcoming — Knowledge
  { id: "cq15", dim: "knowledge", title: "Cultural Misreading Workshop",       scheduledDate: "2026-04-28" },
  { id: "cq16", dim: "knowledge", title: "CQ Knowledge Deep Dive",            scheduledDate: "2026-05-19" },
  // Upcoming — Strategy
  { id: "cq17", dim: "strategy",  title: "Cultural Checklist in Practice",    scheduledDate: "2026-04-25" },
  { id: "cq18", dim: "strategy",  title: "Peer Reflection Circles",           scheduledDate: "2026-05-16" },
  // Upcoming — Action
  { id: "cq19", dim: "action",    title: "Adaptation Exercises",              scheduledDate: "2026-04-18" },
  { id: "cq20", dim: "action",    title: "Difficult Interactions Practicum",  scheduledDate: "2026-05-09" },
];

const SESSION_TODAY = "2026-04-14";

// ─── Gap status ───────────────────────────────────────────────────────────────

type GapStatus = "unaddressed" | "in_progress" | "monitoring" | "resolved";

const GAP_STATUS_CONFIG: Record<GapStatus, { label: string; color: string; bg: string }> = {
  unaddressed: { label: "Unaddressed", color: "#dc2626", bg: "#fff5f5" },
  in_progress:  { label: "In Progress", color: "#d97706", bg: "#fffbeb" },
  monitoring:   { label: "Monitoring",  color: "#2563eb", bg: "#eff6ff" },
  resolved:     { label: "Resolved",    color: "#16a34a", bg: "#f0fdf4" },
};

const STORAGE_KEY = "cq_concern_statuses_v1";
function loadStatuses(): Record<string, GapStatus> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}
function saveStatuses(s: Record<string, GapStatus>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("cq-concern-statuses-changed"));
}

function deriveStatus(totalAttended: number, totalPossible: number, override: GapStatus | undefined): GapStatus {
  if (override !== undefined) return override;
  const pct = totalPossible > 0 ? (totalAttended / totalPossible) * 100 : 0;
  if (pct >= 100) return "resolved";
  if (pct >= 50)  return "monitoring";
  if (pct > 0)    return "in_progress";
  return "unaddressed";
}

function mockAttended(respondentId: number, sessionId: string): boolean {
  const sessionIdx = parseInt(sessionId.replace("cq", ""), 10);
  const base = sessionIdx <= 4 ? 0.7 : sessionIdx <= 8 ? 0.5 : 0.3;
  const hash = ((respondentId * 2654435761) ^ (sessionIdx * 40503)) >>> 0;
  return (hash % 100) / 100 < base;
}

function mockRegistered(respondentId: number, sessionId: string): boolean {
  const sessionIdx = parseInt(sessionId.replace("cq", ""), 10);
  const hash = ((respondentId * 1234567891) ^ (sessionIdx * 98765)) >>> 0;
  return (hash % 100) / 100 < 0.45;
}

function getPastSessions(respondentIds: number[], dim: CQSessionDim) {
  return CQ_SESSIONS
    .filter(s => s.dim === dim && s.scheduledDate <= SESSION_TODAY)
    .map(s => ({
      session: s,
      attended: respondentIds.filter(id => mockAttended(id, s.id)).length,
      total: respondentIds.length,
    }));
}

function getUpcomingSessions(respondentIds: number[], dim: CQSessionDim) {
  return CQ_SESSIONS
    .filter(s => s.dim === dim && s.scheduledDate > SESSION_TODAY)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .map(s => ({
      session: s,
      registered: respondentIds.filter(id => mockRegistered(id, s.id)).length,
      total: respondentIds.length,
    }))
    .filter(s => s.registered > 0)
    .slice(0, 2);
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Signal bars ──────────────────────────────────────────────────────────────

function SignalBars({ sessions }: { sessions: { session: CQSession; attended: number; total: number }[] }) {
  return (
    <div className="flex items-end gap-1">
      {sessions.map(({ session, attended, total }, i) => {
        const pct = total > 0 ? attended / total : 0;
        const height = [10, 16, 22][i] ?? 22;
        const filled = pct > 0;
        const color = pct >= 0.5 ? "#16a34a" : pct > 0 ? "#d97706" : "#e5e7eb";
        const fillHeight = Math.round(pct * height);
        return (
          <div
            key={session.id}
            title={`${session.title}: ${attended}/${total} attended (${Math.round(pct * 100)}%)`}
            className="relative rounded-sm overflow-hidden bg-gray-200 cursor-default"
            style={{ width: 6, height }}
          >
            {filled && (
              <div
                className="absolute bottom-0 left-0 right-0 rounded-sm"
                style={{ height: fillHeight, background: color }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Mock trend data ──────────────────────────────────────────────────────────

const CONCERNS: Concern[] = [
  // ── Critical ────────────────────────────────────────────────────────────────
  {
    id: "c1",
    segment: "Teachers · 3–5 yrs · Middle School",
    role: "Teacher", tenure: "3–5 yrs", level: "Middle School",
    dimension: "strategy", score: 4.8,
    severity: "critical", criticalSince: "2026-02-17",
    recommendation: "Run a structured pre-meeting planning protocol with this cohort. A 2-minute cultural checklist before parent interactions has shown +1.2 Strategy gains in comparable groups.",
    trend: [
      { week: "Nov", score: 6.8 }, { week: "Dec", score: 6.5 }, { week: "Jan", score: 6.1 },
      { week: "Feb W1", score: 5.8 }, { week: "Feb W2", score: 5.5 }, { week: "Feb W3", score: 5.2 },
      { week: "Mar W1", score: 5.0 }, { week: "Now", score: 4.8 },
    ],
    respondentIds: [20, 21, 24, 27, 30],
  },
  {
    id: "c2",
    segment: "High-Friction Staff · Elementary",
    role: "Teacher (High-Friction)", level: "Elementary",
    dimension: "drive", score: 5.1,
    severity: "critical", criticalSince: "2026-01-28",
    recommendation: "Low Drive signals avoidance risk. Prioritise 1-on-1 coaching conversations. Pair with a high-Drive mentor from the same school level.",
    trend: [
      { week: "Nov", score: 7.0 }, { week: "Dec", score: 6.7 }, { week: "Jan W1", score: 6.3 },
      { week: "Jan W2", score: 5.9 }, { week: "Jan W3", score: 5.6 }, { week: "Feb W1", score: 5.4 },
      { week: "Mar W1", score: 5.2 }, { week: "Now", score: 5.1 },
    ],
    respondentIds: [9, 11, 13, 16, 19],
  },
  {
    id: "c3",
    segment: "Teachers · 0–2 yrs · STEM",
    role: "Teacher", tenure: "0–2 yrs", dept: "STEM",
    dimension: "knowledge", score: 5.3,
    severity: "critical", criticalSince: "2026-02-03",
    recommendation: "New STEM teachers are misreading cultural behaviour signals. Add a cultural interpretation module to onboarding. Focus: direct vs indirect communication norms.",
    trend: [
      { week: "Nov", score: 6.4 }, { week: "Dec", score: 6.3 }, { week: "Jan", score: 6.0 },
      { week: "Feb W1", score: 5.8 }, { week: "Feb W2", score: 5.7 }, { week: "Feb W3", score: 5.5 },
      { week: "Mar W1", score: 5.4 }, { week: "Now", score: 5.3 },
    ],
    respondentIds: [10, 11, 14, 18],
  },
  {
    id: "c4",
    segment: "Teachers · 10+ yrs · Humanities",
    role: "Teacher", tenure: "10+ yrs", dept: "Humanities",
    dimension: "action", score: 5.4,
    severity: "critical", criticalSince: "2026-03-01",
    recommendation: "High Knowledge but low Action suggests awareness without adaptation. Targeted practice exercises on adjusting communication style in real interactions.",
    trend: [
      { week: "Nov", score: 7.2 }, { week: "Dec", score: 7.0 }, { week: "Jan", score: 6.7 },
      { week: "Feb W1", score: 6.4 }, { week: "Feb W2", score: 6.1 }, { week: "Mar W1", score: 5.8 },
      { week: "Mar W2", score: 5.6 }, { week: "Now", score: 5.4 },
    ],
    respondentIds: [44, 46, 49],
  },
  // ── Watch ────────────────────────────────────────────────────────────────────
  {
    id: "w1",
    segment: "Teachers · 3–5 yrs · High School",
    role: "Teacher", tenure: "3–5 yrs", level: "High School",
    dimension: "strategy", score: 6.0,
    severity: "watch",
    recommendation: "Approaching critical threshold. Introduce peer reflection circles — asking 'what did I assume going in?' after key interactions.",
    trend: [
      { week: "Nov", score: 7.1 }, { week: "Dec", score: 7.0 }, { week: "Jan", score: 6.8 },
      { week: "Feb W1", score: 6.6 }, { week: "Feb W2", score: 6.4 }, { week: "Feb W3", score: 6.3 },
      { week: "Mar W1", score: 6.2 }, { week: "Now", score: 6.0 },
    ],
    respondentIds: [22, 25, 28, 31],
  },
  {
    id: "w2",
    segment: "Administration · All Levels",
    role: "Admin",
    dimension: "drive", score: 6.2,
    severity: "watch",
    recommendation: "Admin Drive trending down for 4 weeks. Leaders model CQ for staff — consider culture-focused leadership session at next all-staff.",
    trend: [
      { week: "Nov", score: 7.4 }, { week: "Dec", score: 7.3 }, { week: "Jan", score: 7.1 },
      { week: "Feb W1", score: 6.9 }, { week: "Feb W2", score: 6.7 }, { week: "Feb W3", score: 6.5 },
      { week: "Mar W1", score: 6.4 }, { week: "Now", score: 6.2 },
    ],
    respondentIds: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  {
    id: "w3",
    segment: "Teachers · 6–10 yrs · Arts & PE",
    role: "Teacher", tenure: "6–10 yrs", dept: "Arts & PE",
    dimension: "knowledge", score: 6.1,
    severity: "watch",
    recommendation: "Mid-career Arts & PE staff show gaps in distinguishing cultural vs personality factors. A case-study workshop using real classroom scenarios would help.",
    trend: [
      { week: "Nov", score: 7.0 }, { week: "Dec", score: 6.9 }, { week: "Jan", score: 6.7 },
      { week: "Feb W1", score: 6.6 }, { week: "Feb W2", score: 6.5 }, { week: "Feb W3", score: 6.3 },
      { week: "Mar W1", score: 6.2 }, { week: "Now", score: 6.1 },
    ],
    respondentIds: [36, 40],
  },
  {
    id: "w4",
    segment: "Secondary Parents",
    role: "Parent (Secondary)",
    dimension: "action", score: 5.9,
    severity: "watch",
    recommendation: "Secondary parents are not adapting communication style with school staff. Consider a parent engagement session on two-way cultural communication.",
    trend: [
      { week: "Nov", score: 6.9 }, { week: "Dec", score: 6.7 }, { week: "Jan", score: 6.5 },
      { week: "Feb W1", score: 6.4 }, { week: "Feb W2", score: 6.3 }, { week: "Feb W3", score: 6.2 },
      { week: "Mar W1", score: 6.1 }, { week: "Now", score: 5.9 },
    ],
    respondentIds: [65, 66, 67, 68, 69],
  },
  {
    id: "w5",
    segment: "Teachers · 0–2 yrs · Elementary",
    role: "Teacher", tenure: "0–2 yrs", level: "Elementary",
    dimension: "strategy", score: 6.3,
    severity: "watch",
    recommendation: "Early-career elementary teachers going into interactions without planning for differences. Pair with a mentor who demonstrates intentional preparation.",
    trend: [
      { week: "Nov", score: 7.2 }, { week: "Dec", score: 7.1 }, { week: "Jan", score: 7.0 },
      { week: "Feb W1", score: 6.9 }, { week: "Feb W2", score: 6.8 }, { week: "Feb W3", score: 6.6 },
      { week: "Mar W1", score: 6.5 }, { week: "Now", score: 6.3 },
    ],
    respondentIds: [13, 16, 19],
  },
  {
    id: "w6",
    segment: "Teachers · 3–5 yrs · Middle School · STEM",
    role: "Teacher", tenure: "3–5 yrs", level: "Middle School", dept: "STEM",
    dimension: "knowledge", score: 6.2,
    severity: "watch",
    recommendation: "Most precise gap: middle school STEM teachers in years 3–5 are misreading student silence as disengagement rather than cultural deference.",
    trend: [
      { week: "Nov", score: 7.3 }, { week: "Dec", score: 7.1 }, { week: "Jan", score: 6.9 },
      { week: "Feb W1", score: 6.8 }, { week: "Feb W2", score: 6.7 }, { week: "Feb W3", score: 6.5 },
      { week: "Mar W1", score: 6.4 }, { week: "Now", score: 6.2 },
    ],
    respondentIds: [21, 24, 27],
  },
];

const DIMENSION_LABEL: Record<CQDimension, string> = {
  drive: "Drive", knowledge: "Knowledge", strategy: "Strategy", action: "Action",
};

const DIMENSION_QUESTION: Record<CQDimension, string> = {
  drive: "Do I want to engage?",
  knowledge: "Do I understand?",
  strategy: "Do I plan effectively?",
  action: "Can I adapt?",
};

// Symptom matrix
const DIMENSION_SYMPTOM: Record<CQDimension, { pattern: string; signals: string[] }> = {
  drive: {
    pattern: "Avoidance · frustration · low effort",
    signals: [
      "Avoids difficult parents or students from different cultural backgrounds",
      "Labels students as 'unmotivated' rather than adapting approach",
      "Visible frustration with indirect communication styles",
    ],
  },
  knowledge: {
    pattern: "Misdiagnosis · stereotyping · one-size-fits-all",
    signals: [
      "Confuses culture with personality — \"they're just quiet\"",
      "Misreads no eye contact as disrespect or disengagement",
      "Penalises quiet students who are high-context learners",
    ],
  },
  strategy: {
    pattern: "Reactive · unaware · misaligned expectations",
    signals: [
      "Enters interactions without anticipating cultural differences",
      "Doesn't check for shared understanding during or after",
      "Confused when a single approach disengages half the group",
    ],
  },
  action: {
    pattern: "Rigid · inconsistent · friction despite intent",
    signals: [
      "Uses the same communication style regardless of context",
      "Aware differences exist but can't operationalise adjustments",
      "Creates friction with families and students despite good intentions",
    ],
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Trend chart ─────────────────────────────────────────────────────────────

function dotColor(score: number): string {
  if (score >= 6.5) return "#10b981";
  if (score >= 5.5) return "#f59e0b";
  return "#ef4444";
}

function ZoneDot(props: { cx?: number; cy?: number; payload?: TrendPoint }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || payload == null) return null;
  return <circle cx={cx} cy={cy} r={5} fill={dotColor(payload.score)} stroke="#fff" strokeWidth={1.5} />;
}

function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const lineColor = dotColor(trend[trend.length - 1]?.score ?? 5);
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground mb-2">Score trend (8 weeks)</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <ReferenceArea y1={0} y2={5.5} fill="#fef2f2" fillOpacity={0.8} />
          <ReferenceArea y1={5.5} y2={6.5} fill="#fffbeb" fillOpacity={0.8} />
          <ReferenceArea y1={6.5} y2={10} fill="#f0fdf4" fillOpacity={0.8} />
          <ReferenceLine y={5.5} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3"
            label={{ value: "Critical ≤5.5", position: "insideTopRight", fontSize: 10, fill: "#d97706", dy: -2 }} />
          <ReferenceLine y={6.5} stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 3"
            label={{ value: "Healthy ≥6.5", position: "insideTopRight", fontSize: 10, fill: "#059669", dy: -2 }} />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
          <YAxis domain={[0, 10]} ticks={[0, 2, 4, 5.5, 6.5, 8, 10]} tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} width={28} />
          <Line type="monotone" dataKey="score" stroke={lineColor} strokeWidth={2.5}
            dot={(p) => <ZoneDot key={`${p.cx}-${p.cy}`} {...p} />}
            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }} />
          <RechartsTooltip contentStyle={{ fontSize: 12, padding: "6px 10px", borderRadius: 6 }}
            formatter={(val: number) => [`${val}/10`, "Score"]}
            labelFormatter={(label) => String(label)} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 text-[10px] mt-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          <span className="text-red-600 font-medium">Critical &lt;5.5</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
          <span className="text-amber-600 font-medium">Watch 5.5–6.5</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300" />
          <span className="text-emerald-600 font-medium">Healthy &gt;6.5</span>
        </span>
      </div>
    </div>
  );
}

// ─── Action buttons ───────────────────────────────────────────────────────────

interface Action {
  label: string;
  icon: React.ElementType;
  description: string;
  confirmMsg: string;
  variant: "primary" | "secondary";
}

const DIMENSION_ACTIONS: Record<CQDimension, Action[]> = {
  drive: [
    { label: "Schedule 1-on-1 coaching", icon: UserCheck, description: "Book a coaching session to address avoidance patterns and rebuild engagement motivation.", confirmMsg: "Coaching session request sent to this cohort's line manager.", variant: "primary" },
    { label: "Assign mentor pairing", icon: Users, description: "Pair with a high-Drive colleague from the same school level for peer support.", confirmMsg: "Mentor pairing request created and assigned.", variant: "secondary" },
    { label: "Send check-in survey", icon: MessageSquare, description: "Send a short pulse survey to understand what's driving the disengagement.", confirmMsg: "Pulse survey scheduled for this segment.", variant: "secondary" },
  ],
  knowledge: [
    { label: "Assign interpretation module", icon: BookOpen, description: "Assign the cultural behaviour interpretation CPD module — covers direct vs indirect communication norms.", confirmMsg: "CPD module assigned to this cohort in the learning portal.", variant: "primary" },
    { label: "Book case-study workshop", icon: CalendarPlus, description: "Schedule a workshop using real classroom scenarios to build cultural vs personality distinction.", confirmMsg: "Workshop booking request sent to the CPD calendar.", variant: "secondary" },
    { label: "Flag for onboarding review", icon: ClipboardCheck, description: "Add a cultural interpretation module to this group's onboarding checklist.", confirmMsg: "Onboarding checklist updated for this cohort.", variant: "secondary" },
  ],
  strategy: [
    { label: "Deploy pre-meeting checklist", icon: ClipboardCheck, description: "Roll out the 2-minute cultural checklist to this cohort before parent interactions.", confirmMsg: "Pre-meeting checklist distributed to this segment.", variant: "primary" },
    { label: "Schedule peer reflection circles", icon: Users, description: "Set up structured peer reflection sessions — 'What did I assume going in?' after key interactions.", confirmMsg: "Peer reflection circle scheduled for this cohort.", variant: "secondary" },
    { label: "Assign planning protocol", icon: BookOpen, description: "Assign the structured interaction planning CPD module focused on anticipating cultural differences.", confirmMsg: "Planning protocol module assigned in the learning portal.", variant: "secondary" },
  ],
  action: [
    { label: "Assign adaptation exercises", icon: BookOpen, description: "Assign targeted practice exercises on adjusting communication style in real interactions.", confirmMsg: "Adaptation exercises assigned to this cohort in the learning portal.", variant: "primary" },
    { label: "Book communication workshop", icon: CalendarPlus, description: "Schedule a practical workshop on shifting between direct and indirect communication styles.", confirmMsg: "Workshop booking request sent to the CPD calendar.", variant: "secondary" },
    { label: "Schedule engagement session", icon: MessageSquare, description: "Book a parent/staff engagement session on two-way cultural communication adaptation.", confirmMsg: "Engagement session request created and queued.", variant: "secondary" },
  ],
};

// ─── Analyze data ────────────────────────────────────────────────────────────

interface WebinarRecord {
  title: string;
  date: string;
  attendanceRate: number;
  avgScoreBefore: number;
  avgScoreAfter: number | null;
}

interface CoachingRecord {
  type: string;
  sessions: number;
  lastSession: string;
  avgGain: number | null;
  status: "active" | "completed" | "none";
}

interface GapInsight {
  label: string;
  value: string;
  severity: "critical" | "warning" | "good";
}

interface AnalyzeData {
  engagementSummary: string;
  webinars: WebinarRecord[];
  coaching: CoachingRecord[];
  gaps: GapInsight[];
  nextSteps: string[];
}

const ANALYZE_DATA: Record<string, AnalyzeData> = {
  c1: {
    engagementSummary: "Low intervention coverage — this cohort has received minimal targeted support despite a 7-week decline.",
    webinars: [
      { title: "Communication styles across cultures", date: "Nov 2025", attendanceRate: 38, avgScoreBefore: 6.8, avgScoreAfter: 6.5 },
      { title: "Decision-making across cultures", date: "Dec 2025", attendanceRate: 21, avgScoreBefore: 6.5, avgScoreAfter: null },
    ],
    coaching: [
      { type: "Group coaching", sessions: 1, lastSession: "Jan 2026", avgGain: 0.2, status: "completed" },
      { type: "1-on-1 coaching", sessions: 0, lastSession: "—", avgGain: null, status: "none" },
    ],
    gaps: [
      { label: "Webinar attendance", value: "29% avg — well below 60% target", severity: "critical" },
      { label: "Coaching sessions", value: "1 group session only — no individual support", severity: "critical" },
      { label: "Score change since last intervention", value: "−2.0 pts (Nov → now)", severity: "critical" },
      { label: "Time since last touchpoint", value: "11 weeks", severity: "warning" },
    ],
    nextSteps: [
      "Immediate: deploy pre-meeting cultural checklist to all 3–5 yr Middle School teachers",
      "Schedule a dedicated Strategy-focused workshop within 2 weeks",
      "Assign 1-on-1 coaching for the 3 lowest scorers in this cohort",
      "Re-survey this segment after 4 weeks to measure intervention effect",
    ],
  },
  c2: {
    engagementSummary: "Some coaching history but Drive continues to decline — current approach is not arresting the trend.",
    webinars: [
      { title: "Communication styles across cultures", date: "Oct 2025", attendanceRate: 55, avgScoreBefore: 7.0, avgScoreAfter: 6.7 },
      { title: "Power distance & hierarchy at work", date: "Jan 2026", attendanceRate: 30, avgScoreBefore: 6.3, avgScoreAfter: null },
    ],
    coaching: [
      { type: "Group coaching", sessions: 2, lastSession: "Feb 2026", avgGain: 0.1, status: "completed" },
      { type: "Mentor pairing", sessions: 0, lastSession: "—", avgGain: null, status: "none" },
    ],
    gaps: [
      { label: "Webinar attendance", value: "43% avg — below 60% target", severity: "warning" },
      { label: "Coaching impact", value: "+0.1/session — insufficient for Drive recovery", severity: "critical" },
      { label: "Score change since last intervention", value: "−1.9 pts (Oct → now)", severity: "critical" },
      { label: "Mentor pairing", value: "Not initiated — highest-impact Drive intervention unused", severity: "critical" },
    ],
    nextSteps: [
      "Initiate mentor pairing with a high-Drive Elementary colleague immediately",
      "Switch from group to individual coaching format — Drive requires personal engagement",
      "Investigate root cause via 1-on-1 conversation before next group session",
      "Set a 6-week Drive recovery target of +1.0 and review fortnightly",
    ],
  },
  c3: {
    engagementSummary: "Onboarding gap — new STEM teachers entered without adequate cultural Knowledge foundations.",
    webinars: [
      { title: "Communication styles across cultures", date: "Nov 2025", attendanceRate: 15, avgScoreBefore: 6.4, avgScoreAfter: 6.3 },
    ],
    coaching: [
      { type: "Group coaching", sessions: 0, lastSession: "—", avgGain: null, status: "none" },
      { type: "1-on-1 coaching", sessions: 0, lastSession: "—", avgGain: null, status: "none" },
    ],
    gaps: [
      { label: "Webinar attendance", value: "15% — critically low for a new cohort", severity: "critical" },
      { label: "Coaching sessions", value: "Zero — no coaching at any level", severity: "critical" },
      { label: "Onboarding cultural module", value: "Not included in current STEM onboarding", severity: "critical" },
      { label: "Score trajectory", value: "Slow steady decline over 16 weeks", severity: "warning" },
    ],
    nextSteps: [
      "Add a cultural interpretation module to STEM teacher onboarding immediately",
      "Mandate webinar attendance for all 0–2 yr STEM teachers this term",
      "Assign group coaching starting this month — no coaching to date is a critical gap",
      "Focus content on direct vs indirect communication and high-context learners",
    ],
  },
  c4: {
    engagementSummary: "Knowledge is strong — the gap is translating awareness into adapted behaviour. Existing interventions are knowledge-focused, not practice-focused.",
    webinars: [
      { title: "Communication styles across cultures", date: "Sep 2025", attendanceRate: 82, avgScoreBefore: 7.2, avgScoreAfter: 7.0 },
      { title: "Decision-making across cultures", date: "Nov 2025", attendanceRate: 74, avgScoreBefore: 7.0, avgScoreAfter: 6.7 },
      { title: "Power distance & hierarchy at work", date: "Feb 2026", attendanceRate: 61, avgScoreBefore: 6.4, avgScoreAfter: null },
    ],
    coaching: [
      { type: "Group coaching", sessions: 3, lastSession: "Mar 2026", avgGain: 0.15, status: "active" },
      { type: "1-on-1 coaching", sessions: 1, lastSession: "Feb 2026", avgGain: 0.3, status: "completed" },
    ],
    gaps: [
      { label: "Webinar attendance", value: "72% avg — above target, but no Action gain", severity: "good" },
      { label: "Coaching format", value: "Group-only coaching — insufficient for behaviour change", severity: "warning" },
      { label: "Practice exercises", value: "Zero assigned — awareness without practice won't shift Action", severity: "critical" },
      { label: "Score change despite high attendance", value: "−1.8 pts Action while Knowledge stays at 7.8", severity: "critical" },
    ],
    nextSteps: [
      "Shift intervention focus from knowledge content to practice-based exercises",
      "Assign communication style adaptation exercises with real classroom scenarios",
      "Add a reflective practice component to existing group coaching sessions",
      "Measure Action score fortnightly — target +0.5 within 6 weeks",
    ],
  },
  w1: {
    engagementSummary: "Moderate engagement but declining trend — early action now can prevent crossing into critical.",
    webinars: [
      { title: "Communication styles across cultures", date: "Oct 2025", attendanceRate: 52, avgScoreBefore: 7.1, avgScoreAfter: 6.8 },
    ],
    coaching: [
      { type: "Group coaching", sessions: 1, lastSession: "Dec 2025", avgGain: 0.2, status: "completed" },
      { type: "Peer reflection circles", sessions: 0, lastSession: "—", avgGain: null, status: "none" },
    ],
    gaps: [
      { label: "Webinar attendance", value: "52% — just below 60% target", severity: "warning" },
      { label: "Coaching recency", value: "Last session 16 weeks ago", severity: "warning" },
      { label: "Peer reflection", value: "Not initiated — highest-impact Strategy tool unused", severity: "warning" },
      { label: "Score trajectory", value: "−1.1 pts over 20 weeks — slow but consistent decline", severity: "warning" },
    ],
    nextSteps: [
      "Initiate peer reflection circles now — most effective Strategy intervention for this profile",
      "Refresh webinar invite — last attendance 6+ months ago",
      "Schedule a group coaching session before end of term",
      "Monitor fortnightly — at current rate will hit critical threshold in ~8 weeks",
    ],
  },
  w2: {
    engagementSummary: "Admin Drive decline is particularly high-risk — leaders model CQ culture for all staff.",
    webinars: [
      { title: "Communication styles across cultures", date: "Sep 2025", attendanceRate: 70, avgScoreBefore: 7.4, avgScoreAfter: 7.1 },
      { title: "Power distance & hierarchy at work", date: "Jan 2026", attendanceRate: 45, avgScoreBefore: 6.9, avgScoreAfter: null },
    ],
    coaching: [
      { type: "Leadership coaching", sessions: 2, lastSession: "Feb 2026", avgGain: 0.1, status: "completed" },
    ],
    gaps: [
      { label: "Webinar attendance", value: "58% avg — near but below target for leadership cohort", severity: "warning" },
      { label: "Leadership coaching impact", value: "+0.1/session — low return, review format", severity: "warning" },
      { label: "Culture-focused all-staff session", value: "Not scheduled this term", severity: "warning" },
      { label: "Score trajectory", value: "4-week consecutive decline — unusual for Admin cohort", severity: "critical" },
    ],
    nextSteps: [
      "Schedule a culture-focused leadership session at next all-staff meeting",
      "Review leadership coaching format — current approach showing minimal Drive impact",
      "Investigate whether workload or structural factors are contributing to Drive decline",
      "Admin Drive below 6.0 would signal organisation-wide cultural risk",
    ],
  },
  w3: {
    engagementSummary: "Mid-career plateau — Arts & PE staff have good general CQ but a specific blind spot in cultural vs personality interpretation.",
    webinars: [
      { title: "Communication styles across cultures", date: "Oct 2025", attendanceRate: 60, avgScoreBefore: 7.0, avgScoreAfter: 6.9 },
    ],
    coaching: [
      { type: "Group coaching", sessions: 2, lastSession: "Jan 2026", avgGain: 0.2, status: "completed" },
    ],
    gaps: [
      { label: "Targeted Knowledge content", value: "No workshop specifically on cultural vs personality distinction", severity: "warning" },
      { label: "Webinar recency", value: "Last attended 6 months ago — refresh due", severity: "warning" },
      { label: "Case-study workshop", value: "Not assigned — most effective for this specific gap", severity: "warning" },
      { label: "Score change", value: "−0.9 pts over 20 weeks — gradual erosion", severity: "warning" },
    ],
    nextSteps: [
      "Book a case-study workshop using real Arts & PE classroom scenarios",
      "Send refresher webinar invite — 6-month recency threshold reached",
      "Add a 'culture vs personality' module to next group coaching session",
      "Pair with a high-Knowledge colleague for a structured peer observation",
    ],
  },
  w4: {
    engagementSummary: "Parent cohort has had no direct interventions — all current support is teacher-facing only.",
    webinars: [
      { title: "Communication styles across cultures", date: "—", attendanceRate: 0, avgScoreBefore: 6.9, avgScoreAfter: null },
    ],
    coaching: [
      { type: "Parent engagement sessions", sessions: 0, lastSession: "—", avgGain: null, status: "none" },
      { type: "Two-way communication workshop", sessions: 0, lastSession: "—", avgGain: null, status: "none" },
    ],
    gaps: [
      { label: "Parent-facing interventions", value: "Zero — no sessions or workshops for this cohort", severity: "critical" },
      { label: "Communication bridge", value: "No structured two-way cultural communication support", severity: "warning" },
      { label: "Engagement data", value: "No attendance data — this cohort has never been invited", severity: "warning" },
      { label: "Score trajectory", value: "Steady decline — likely to cross threshold without intervention", severity: "warning" },
    ],
    nextSteps: [
      "Design and schedule a parent engagement session on two-way cultural communication",
      "Create a parent-specific communication guide in home languages where possible",
      "Invite Secondary Parents to the next available Communication Styles webinar",
      "Collect baseline engagement data — currently no attendance history to analyse",
    ],
  },
  w5: {
    engagementSummary: "Early-career teachers lack planning scaffolds — they have enthusiasm (Drive is good) but no strategy frameworks.",
    webinars: [
      { title: "Communication styles across cultures", date: "Nov 2025", attendanceRate: 44, avgScoreBefore: 7.2, avgScoreAfter: 7.0 },
    ],
    coaching: [
      { type: "Group coaching", sessions: 1, lastSession: "Jan 2026", avgGain: 0.3, status: "completed" },
      { type: "Mentor pairing", sessions: 0, lastSession: "—", avgGain: null, status: "none" },
    ],
    gaps: [
      { label: "Mentor pairing", value: "Not initiated — highest-impact early-career Strategy tool", severity: "warning" },
      { label: "Webinar attendance", value: "44% — below target for a cohort at risk", severity: "warning" },
      { label: "Planning scaffolds", value: "No pre-interaction planning tools assigned", severity: "warning" },
      { label: "Score trajectory", value: "−0.9 pts — gradual decline from high starting point", severity: "warning" },
    ],
    nextSteps: [
      "Pair each teacher in this cohort with an experienced mentor who models intentional preparation",
      "Assign the pre-meeting cultural checklist as a required practice tool",
      "Boost webinar attendance — mandate for 0–2 yr teachers this term",
      "Add Strategy-focused content to next group coaching session",
    ],
  },
  w6: {
    engagementSummary: "Precise gap — these teachers are misreading silence specifically, not Knowledge broadly. Targeted micro-intervention likely more effective than general content.",
    webinars: [
      { title: "Communication styles across cultures", date: "Oct 2025", attendanceRate: 48, avgScoreBefore: 7.3, avgScoreAfter: 7.1 },
      { title: "Decision-making across cultures", date: "Dec 2025", attendanceRate: 35, avgScoreBefore: 7.1, avgScoreAfter: 6.9 },
    ],
    coaching: [
      { type: "Group coaching", sessions: 2, lastSession: "Feb 2026", avgGain: 0.2, status: "completed" },
    ],
    gaps: [
      { label: "Targeted content on student silence", value: "No workshop specifically on silence as deference", severity: "warning" },
      { label: "Webinar attendance", value: "42% avg — below target", severity: "warning" },
      { label: "Micro-intervention", value: "Current support is too broad for this specific Knowledge gap", severity: "warning" },
      { label: "Score trajectory", value: "−1.1 pts over 20 weeks", severity: "warning" },
    ],
    nextSteps: [
      "Run a targeted micro-session: 'Silence as cultural deference in STEM classrooms'",
      "Add a specific case example of student silence to next group coaching session",
      "Share a short reading on high-context vs low-context learners with this cohort",
      "Re-assess Knowledge score in 4 weeks after targeted intervention",
    ],
  },
};

function severityIcon(s: GapInsight["severity"]) {
  if (s === "critical") return <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />;
  if (s === "warning")  return <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />;
  return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />;
}

// ─── Analyze dialog ───────────────────────────────────────────────────────────

function AnalyzeDialog({ c, open, onClose }: { c: Concern; open: boolean; onClose: () => void }) {
  const data = ANALYZE_DATA[c.id];
  if (!data) return null;
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="h-4 w-4 text-primary shrink-0" />
            Engagement Analysis
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-0.5 pb-3 border-b">
          <p className="text-sm font-semibold">{c.segment}</p>
          <p className="text-xs text-muted-foreground">
            <span className={`font-semibold ${c.severity === "critical" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
              {DIMENSION_LABEL[c.dimension]} {c.score}/10
            </span>
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            {DIMENSION_QUESTION[c.dimension]}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 border p-3">
          <p className="text-xs text-foreground/80 leading-relaxed italic">{data.engagementSummary}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5 text-primary" />
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Webinar &amp; Workshop Attendance</p>
          </div>
          {data.webinars.length === 0 || data.webinars[0].attendanceRate === 0 ? (
            <p className="text-xs text-muted-foreground italic pl-5">No webinar attendance recorded for this cohort.</p>
          ) : (
            <div className="space-y-2">
              {data.webinars.map(w => (
                <div key={w.title} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold leading-snug">{w.title}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{w.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Attendance</span>
                        <span className={`font-semibold ${w.attendanceRate >= 60 ? "text-emerald-600" : w.attendanceRate >= 40 ? "text-amber-600" : "text-red-600"}`}>
                          {w.attendanceRate}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${w.attendanceRate >= 60 ? "bg-emerald-500" : w.attendanceRate >= 40 ? "bg-amber-400" : "bg-red-500"}`}
                          style={{ width: `${w.attendanceRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-right shrink-0">
                      {w.avgScoreAfter != null ? (
                        <span className={w.avgScoreAfter >= w.avgScoreBefore ? "text-emerald-600" : "text-red-600"}>
                          {w.avgScoreBefore} → {w.avgScoreAfter}
                          <span className="ml-1 font-bold">
                            ({w.avgScoreAfter >= w.avgScoreBefore ? "+" : ""}{(w.avgScoreAfter - w.avgScoreBefore).toFixed(1)})
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Score pending</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Coaching &amp; Support</p>
          </div>
          <div className="space-y-2">
            {data.coaching.map(co => (
              <div key={co.type} className="rounded-lg border p-3 flex items-center gap-3">
                {co.status === "active"    && <Clock className="h-4 w-4 text-primary shrink-0" />}
                {co.status === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                {co.status === "none"      && <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{co.type}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {co.status === "none" ? "Not initiated" : `${co.sessions} session${co.sessions !== 1 ? "s" : ""} · last: ${co.lastSession}`}
                    {co.avgGain != null && ` · avg +${co.avgGain}/session`}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  co.status === "active" ? "bg-primary/10 text-primary" :
                  co.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {co.status === "active" ? "Active" : co.status === "completed" ? "Done" : "Not started"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-primary" />
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Gap Analysis</p>
          </div>
          <div className="space-y-1.5">
            {data.gaps.map(g => (
              <div key={g.label} className="flex items-start gap-2 text-xs">
                {severityIcon(g.severity)}
                <div>
                  <span className="font-semibold text-foreground">{g.label}: </span>
                  <span className="text-muted-foreground">{g.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Recommended next steps</p>
          </div>
          <ol className="space-y-1.5">
            {data.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="shrink-0 mt-px w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-foreground/80 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Recommendations dialog ───────────────────────────────────────────────────

function RecommendationsDialog({ c, open, onClose }: { c: Concern; open: boolean; onClose: () => void }) {
  const isCritical = c.severity === "critical";
  const actions = DIMENSION_ACTIONS[c.dimension];
  const [done, setDone] = useState<Record<string, boolean>>({});
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-primary shrink-0" />
            Recommendations
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-0.5 pb-3 border-b">
          <p className="text-sm font-semibold">{c.segment}</p>
          <p className="text-xs text-muted-foreground">
            <span className={`font-semibold ${isCritical ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
              {DIMENSION_LABEL[c.dimension]} {c.score}/10
            </span>
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            {DIMENSION_QUESTION[c.dimension]}
          </p>
        </div>
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-[11px] font-semibold text-primary mb-1">Insight</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{c.recommendation}</p>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Suggested actions</p>
          {actions.map(action => (
            <div key={action.label}>
              {done[action.label] ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                  <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium">{action.confirmMsg}</span>
                </div>
              ) : (
                <button
                  onClick={() => setDone(d => ({ ...d, [action.label]: true }))}
                  className={`w-full flex items-start gap-2.5 text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    action.variant === "primary"
                      ? "bg-primary/5 border-primary/30 text-primary hover:bg-primary/10"
                      : "bg-background border-border text-foreground/70 hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <action.icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="block">{action.label}</span>
                    <span className="block font-normal text-muted-foreground mt-0.5">{action.description}</span>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Expand dialog ────────────────────────────────────────────────────────────

function ExpandDialog({ c, open, onClose }: { c: Concern; open: boolean; onClose: () => void }) {
  const isCritical = c.severity === "critical";
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              isCritical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
            }`}>
              {isCritical ? "Critical" : "Watch"}
            </span>
            {c.segment}
          </DialogTitle>
        </DialogHeader>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {c.role   && <span className="text-[11px] bg-secondary px-2 py-0.5 rounded-full">{c.role}</span>}
          {c.tenure && <span className="text-[11px] bg-secondary px-2 py-0.5 rounded-full">{c.tenure}</span>}
          {c.level  && <span className="text-[11px] bg-secondary px-2 py-0.5 rounded-full">{c.level}</span>}
          {c.dept   && <span className="text-[11px] bg-secondary px-2 py-0.5 rounded-full">{c.dept}</span>}
        </div>

        {/* Score + timestamp */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-muted-foreground">{DIMENSION_LABEL[c.dimension]} score</span>
            <span className={`font-bold ${isCritical ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
              {c.score}/10
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isCritical ? "bg-red-500" : "bg-amber-400"}`} style={{ width: `${c.score * 10}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
            <span>0</span>
            <span className="text-amber-500">Watch ≥5.5</span>
            <span className="text-emerald-500">Healthy ≥6.5</span>
            <span>10</span>
          </div>
          {c.criticalSince && (
            <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1.5">
              <CalendarClock className="h-3 w-3" />
              Critical since {formatDate(c.criticalSince)}
            </p>
          )}
        </div>

        {/* Symptom signals */}
        <div className="rounded-lg bg-muted/40 border px-3 py-2 space-y-1">
          <p className={`text-[11px] font-semibold ${isCritical ? "text-red-600" : "text-amber-600"}`}>
            {DIMENSION_SYMPTOM[c.dimension].pattern}
          </p>
          <ul className="space-y-0.5">
            {DIMENSION_SYMPTOM[c.dimension].signals.map(s => (
              <li key={s} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <span className={`shrink-0 mt-px ${isCritical ? "text-red-400" : "text-amber-400"}`}>•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Trend */}
        <TrendChart trend={c.trend} />

        {/* Recommendation */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-[11px] font-semibold text-primary mb-1">Recommendation</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{c.recommendation}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function ConcernRow({ c, index, status, onStatusChange }: {
  c: Concern;
  index: number;
  status: GapStatus;
  onStatusChange: (id: string, s: GapStatus) => void;
}) {
  const [expandOpen,  setExpandOpen]  = useState(false);
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [recOpen,     setRecOpen]     = useState(false);

  const isCritical = c.severity === "critical";
  const scoreColor = isCritical ? "#dc2626" : "#d97706";
  const statusCfg  = GAP_STATUS_CONFIG[status];

  const pastSessions   = useMemo(() => getPastSessions(c.respondentIds, c.dimension),   [c]);
  const upcomingSessions = useMemo(() => getUpcomingSessions(c.respondentIds, c.dimension), [c]);

  const totalAttended  = pastSessions.reduce((sum, s) => sum + s.attended, 0);
  const totalPossible  = pastSessions.reduce((sum, s) => sum + s.total,    0);
  const attendedPct    = totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 0;

  const topSessions = pastSessions.filter(s => s.attended > 0).sort((a, b) => b.attended - a.attended);

  return (
    <>
      <tr
        className="hover:bg-gray-50 transition-colors"
        style={{ background: index % 2 === 0 ? "#ffffff" : "#fafafa" }}
      >
        {/* Severity badge */}
        <td className="px-4 py-3 w-8">
          <span
            className="inline-flex items-center justify-center rounded-full w-5 h-5"
            style={{ background: isCritical ? "#ef4444" : "#f59e0b" }}
            title={isCritical ? "Critical" : "Watch"}
          >
            {isCritical
              ? <AlertCircle className="h-2.5 w-2.5 text-white" />
              : <AlertCircle className="h-2.5 w-2.5 text-white" />
            }
          </span>
        </td>

        {/* Segment */}
        <td className="px-4 py-3" style={{ minWidth: 220 }}>
          <div className="font-semibold text-sm text-gray-900">{c.segment}</div>
          <div className="text-xs text-gray-400 mt-0.5">{c.respondentIds.length} respondents</div>
          <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
            <span className={`font-medium ${isCritical ? "text-red-500" : "text-amber-500"}`}>
              {DIMENSION_LABEL[c.dimension]}
            </span>
            <span>·</span>
            <span>{DIMENSION_QUESTION[c.dimension]}</span>
          </div>
          {c.criticalSince && (
            <div className="text-[10px] text-red-400 flex items-center gap-1 mt-0.5">
              <CalendarClock className="h-2.5 w-2.5" />
              Since {formatDate(c.criticalSince)}
            </div>
          )}
        </td>

        {/* Score */}
        <td className="px-4 py-3 text-right" style={{ minWidth: 80 }}>
          <div className="text-xl font-bold tabular-nums leading-none" style={{ color: scoreColor }}>
            {c.score}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">/ 10</div>
        </td>

        {/* Attended — count + bar */}
        <td className="px-4 py-3" style={{ minWidth: 110 }}>
          <div className="text-sm font-bold tabular-nums text-gray-800 mb-1">
            {totalAttended}<span className="text-gray-400 font-normal"> / {totalPossible}</span>
          </div>
          <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${attendedPct}%`, background: attendedPct >= 50 ? "#16a34a" : attendedPct > 0 ? "#d97706" : "#e5e7eb" }}
            />
          </div>
        </td>

        {/* Signal bars */}
        <td className="px-4 py-3">
          <SignalBars sessions={pastSessions} />
        </td>

        {/* Top sessions */}
        <td className="px-4 py-3" style={{ minWidth: 220 }}>
          {topSessions.length === 0 ? (
            <span className="text-[11px] text-gray-400 italic">No sessions attended yet</span>
          ) : (
            <div className="space-y-1.5">
              {topSessions.map(({ session, attended, total }) => {
                const color = attended / total >= 0.5 ? "#16a34a" : "#d97706";
                return (
                  <div key={session.id} className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold tabular-nums shrink-0" style={{ color, minWidth: 36 }}>
                      {attended}/{total}
                    </span>
                    <span className="text-[11px] text-gray-600 truncate" title={session.title}>
                      {session.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </td>

        {/* Upcoming sessions */}
        <td className="px-4 py-3" style={{ minWidth: 220 }}>
          {upcomingSessions.length === 0 ? (
            <span className="text-[11px] text-gray-400 italic">None registered yet</span>
          ) : (
            <div className="space-y-1.5">
              {upcomingSessions.map(({ session, registered, total }) => (
                <div key={session.id} className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tabular-nums text-blue-600 shrink-0" style={{ minWidth: 36 }}>
                    {registered}/{total}
                  </span>
                  <span className="text-[11px] text-gray-400 shrink-0">{formatSessionDate(session.scheduledDate)}</span>
                  <span className="text-[11px] text-gray-600 truncate" title={session.title}>
                    {session.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="relative inline-block">
            <select
              value={status}
              onChange={e => onStatusChange(c.id, e.target.value as GapStatus)}
              className="appearance-none text-[11px] font-semibold rounded-full px-2.5 py-1 pr-5 cursor-pointer border-0 outline-none"
              style={{ background: statusCfg.bg, color: statusCfg.color }}
            >
              {(Object.keys(GAP_STATUS_CONFIG) as GapStatus[]).map(s => (
                <option key={s} value={s}>{GAP_STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5" style={{ color: statusCfg.color }} />
          </div>
        </td>

        {/* Action buttons */}
        <td className="px-4 py-3" style={{ minWidth: 180 }}>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setExpandOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ChevronDown className="h-3 w-3" />
              Detail
            </button>
            <button
              onClick={() => setAnalyzeOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground border border-border bg-background hover:border-primary/40 hover:text-foreground px-2.5 py-1 rounded-full transition-colors"
            >
              <BarChart2 className="h-3 w-3" />
              Analyse
            </button>
            <button
              onClick={() => setRecOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-full transition-colors"
            >
              <Lightbulb className="h-3 w-3" />
              Recs
            </button>
          </div>
        </td>
      </tr>

      <ExpandDialog  c={c} open={expandOpen}  onClose={() => setExpandOpen(false)} />
      <AnalyzeDialog c={c} open={analyzeOpen} onClose={() => setAnalyzeOpen(false)} />
      <RecommendationsDialog c={c} open={recOpen} onClose={() => setRecOpen(false)} />
    </>
  );
}

// ─── Section table ────────────────────────────────────────────────────────────

const STATUS_ORDER: GapStatus[] = ["unaddressed", "in_progress", "monitoring", "resolved"];

const SECTION_META: Record<GapStatus, { label: string; borderColor: string; bgColor: string; textColor: string }> = {
  unaddressed: { label: "Unaddressed", borderColor: "#ef4444", bgColor: "#fff5f5", textColor: "#b91c1b" },
  in_progress:  { label: "In Progress", borderColor: "#f59e0b", bgColor: "#fffbeb", textColor: "#92400e" },
  monitoring:   { label: "Monitoring",  borderColor: "#3b82f6", bgColor: "#eff6ff", textColor: "#1d4ed8" },
  resolved:     { label: "Resolved",    borderColor: "#22c55e", bgColor: "#f0fdf4", textColor: "#15803d" },
};

const TABLE_HEADER = (
  <thead>
    <tr className="bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
      <th className="px-4 py-2 w-8" />
      <th className="px-4 py-2 text-left">Segment</th>
      <th className="px-4 py-2 text-right">Score</th>
      <th className="px-4 py-2 text-left">Attended</th>
      <th className="px-4 py-2 text-left">Sessions</th>
      <th className="px-4 py-2 text-left">Top Sessions</th>
      <th className="px-4 py-2 text-left">Upcoming</th>
      <th className="px-4 py-2 text-left">Status</th>
      <th className="px-4 py-2 text-left">Actions</th>
    </tr>
  </thead>
);

function ConcernTable({ rows, severity, statuses, onStatusChange }: {
  rows: Concern[];
  severity: Severity;
  statuses: Record<string, GapStatus>;
  onStatusChange: (id: string, s: GapStatus) => void;
}) {
  const isCritical = severity === "critical";

  // Pre-compute status for every row so we can group by it
  const enriched = rows.map(c => {
    const sessions     = getPastSessions(c.respondentIds, c.dimension);
    const totalAttended = sessions.reduce((sum, s) => sum + s.attended, 0);
    const totalPossible = sessions.reduce((sum, s) => sum + s.total, 0);
    const status = deriveStatus(totalAttended, totalPossible, statuses[c.id]);
    return { c, status };
  });

  const sortGroup = (group: typeof enriched, statusKey: GapStatus) => {
    const copy = [...group];
    if (statusKey === "unaddressed" || statusKey === "resolved") {
      return copy.sort((a, b) => a.c.score - b.c.score); // lowest score first — biggest risk / biggest win
    }
    if (statusKey === "in_progress") {
      // Least attended first — needs most attention
      const pct = (e: typeof enriched[0]) => {
        const s = getPastSessions(e.c.respondentIds, e.c.dimension);
        const total = s.reduce((sum, x) => sum + x.total, 0);
        const att   = s.reduce((sum, x) => sum + x.attended, 0);
        return total > 0 ? att / total : 0;
      };
      return copy.sort((a, b) => pct(a) - pct(b));
    }
    if (statusKey === "monitoring") {
      // Closest to resolved first — easiest wins
      const pct = (e: typeof enriched[0]) => {
        const s = getPastSessions(e.c.respondentIds, e.c.dimension);
        const total = s.reduce((sum, x) => sum + x.total, 0);
        const att   = s.reduce((sum, x) => sum + x.attended, 0);
        return total > 0 ? att / total : 0;
      };
      return copy.sort((a, b) => pct(b) - pct(a));
    }
    return copy;
  };

  // Severity banner above the status sections
  return (
    <div className="mb-8 space-y-4">
      {/* Severity label */}
      <div
        className="px-4 py-3 flex items-center gap-3 rounded-xl"
        style={{ background: isCritical ? "#fff5f5" : "#fffbeb", borderLeft: `4px solid ${isCritical ? "#ef4444" : "#f59e0b"}` }}
      >
        <span
          className="inline-flex items-center justify-center rounded-full w-6 h-6 shrink-0"
          style={{ background: isCritical ? "#ef4444" : "#f59e0b" }}
        >
          <AlertCircle className="h-3 w-3 text-white" />
        </span>
        <div>
          <span className="font-bold text-sm" style={{ color: isCritical ? "#b91c1b" : "#92400e" }}>
            {isCritical ? "Critical" : "Watch"}
          </span>
          <span className="ml-2 text-xs font-normal" style={{ color: isCritical ? "#f87171" : "#fbbf24" }}>
            {rows.length} concern{rows.length !== 1 ? "s" : ""}
            {isCritical ? " · score ≤5.5" : " · score 5.5–6.5"}
          </span>
        </div>
      </div>

      {/* Status-grouped sub-tables */}
      {STATUS_ORDER.map(statusKey => {
        const group = sortGroup(enriched.filter(e => e.status === statusKey), statusKey);
        if (group.length === 0) return null;
        const meta = SECTION_META[statusKey];
        return (
          <div key={statusKey} className="rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)" }}>
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: meta.bgColor, borderLeft: `4px solid ${meta.borderColor}` }}>
              <span className="font-bold text-sm" style={{ color: meta.textColor }}>{meta.label}</span>
              <span className="text-xs font-normal" style={{ color: meta.borderColor }}>
                {group.length} concern{group.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: 1080 }}>
                {TABLE_HEADER}
                <tbody>
                  {group.map(({ c }, i) => (
                    <ConcernRow key={c.id} c={c} index={i} status={statusKey} onStatusChange={onStatusChange} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

type SortKey = "quadrant" | "score" | "date";

const DIMENSION_ORDER: Record<CQDimension, number> = {
  drive: 0, knowledge: 1, strategy: 2, action: 3,
};

function sortConcerns(list: Concern[], key: SortKey): Concern[] {
  return [...list].sort((a, b) => {
    if (key === "quadrant") return DIMENSION_ORDER[a.dimension] - DIMENSION_ORDER[b.dimension];
    if (key === "score")    return a.score - b.score;
    if (key === "date")     return (a.criticalSince ?? "9999").localeCompare(b.criticalSince ?? "9999");
    return 0;
  });
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "quadrant", label: "Quadrant" },
  { key: "score",    label: "Score (low first)" },
  { key: "date",     label: "Date flagged" },
];

function SortBar({ active, onChange }: { active: SortKey; onChange: (k: SortKey) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-muted-foreground font-medium">Sort by:</span>
      {SORT_OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
            active === opt.key
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground/60 border-border hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Data splits ──────────────────────────────────────────────────────────────

const BASE_CRITICAL = CONCERNS.filter(c => c.severity === "critical");
const BASE_WATCH    = CONCERNS.filter(c => c.severity === "watch");

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Badge count hook (exported for CQNavigator tab badge) ───────────────────
// Returns the number of concerns whose status is "unaddressed" or "in_progress"

export function useCQConcernBadgeCount(): number {
  const [statuses, setStatuses] = useState<Record<string, GapStatus>>(loadStatuses);

  // Listen for the custom event fired by saveStatuses — works within the same
  // tab, unlike the native "storage" event which only fires across tabs.
  useEffect(() => {
    function onChanged() { setStatuses(loadStatuses()); }
    window.addEventListener("cq-concern-statuses-changed", onChanged);
    return () => window.removeEventListener("cq-concern-statuses-changed", onChanged);
  }, []);

  return useMemo(() => {
    return CONCERNS.filter(c => {
      const sessions      = getPastSessions(c.respondentIds, c.dimension);
      const totalAttended = sessions.reduce((sum, s) => sum + s.attended, 0);
      const totalPossible = sessions.reduce((sum, s) => sum + s.total, 0);
      const status        = deriveStatus(totalAttended, totalPossible, statuses[c.id]);
      return status === "unaddressed" || status === "in_progress";
    }).length;
  }, [statuses]);
}

export function useCQCriticalUnaddressedCount(): number {
  const [statuses, setStatuses] = useState<Record<string, GapStatus>>(loadStatuses);

  useEffect(() => {
    function onChanged() { setStatuses(loadStatuses()); }
    window.addEventListener("cq-concern-statuses-changed", onChanged);
    return () => window.removeEventListener("cq-concern-statuses-changed", onChanged);
  }, []);

  return useMemo(() => {
    return CONCERNS.filter(c => {
      if (c.severity !== "critical") return false;
      const sessions      = getPastSessions(c.respondentIds, c.dimension);
      const totalAttended = sessions.reduce((sum, s) => sum + s.attended, 0);
      const totalPossible = sessions.reduce((sum, s) => sum + s.total, 0);
      const status        = deriveStatus(totalAttended, totalPossible, statuses[c.id]);
      return status === "unaddressed";
    }).length;
  }, [statuses]);
}

export default function CQConcerns() {
  const [criticalSort, setCriticalSort] = useState<SortKey>("date");
  const [watchSort,    setWatchSort]    = useState<SortKey>("quadrant");
  const [statuses, setStatuses] = useState<Record<string, GapStatus>>(loadStatuses);

  const handleStatusChange = (id: string, s: GapStatus) => {
    setStatuses(prev => {
      const next = { ...prev, [id]: s };
      saveStatuses(next);
      return next;
    });
  };

  const CRITICAL_CONCERNS = useMemo(() => sortConcerns(BASE_CRITICAL, criticalSort), [criticalSort]);
  const WATCH_CONCERNS    = useMemo(() => sortConcerns(BASE_WATCH, watchSort),    [watchSort]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto overflow-x-auto">

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-red-100 shrink-0">
          <ShieldAlert className="h-4 w-4 text-red-600" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold font-sans text-gray-900 leading-tight">CQ Concerns</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">
            Segment intersections below CQ threshold — click Detail, Analyse, or Recommendations to act
          </p>
        </div>
      </div>

      {/* Critical table */}
      {CRITICAL_CONCERNS.length > 0 && (
        <section>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div /> {/* spacer */}
            <SortBar active={criticalSort} onChange={setCriticalSort} />
          </div>
          <ConcernTable rows={CRITICAL_CONCERNS} severity="critical" statuses={statuses} onStatusChange={handleStatusChange} />
        </section>
      )}

      {/* Watch table */}
      {WATCH_CONCERNS.length > 0 && (
        <section>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div />
            <SortBar active={watchSort} onChange={setWatchSort} />
          </div>
          <ConcernTable rows={WATCH_CONCERNS} severity="watch" statuses={statuses} onStatusChange={handleStatusChange} />
        </section>
      )}

    </div>
  );
}
