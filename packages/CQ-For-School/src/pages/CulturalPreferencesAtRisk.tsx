import { useState, useMemo, useEffect } from "react";
import { AlertTriangle, Eye, Check, ArrowLeftRight } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

// ─── Re-use the same respondent dataset from WorkstyleComparator ──────────────

type Role = "admin" | "teacher" | "parent";
type Tenure = "0-2" | "3-5" | "6-10" | "10+";
type GradeLevel = "elementary" | "middle" | "high";
type Department = "humanities" | "stem" | "arts-pe" | "admin-support" | null;
type FrictionLevel = "high" | "low";
type ParentLevel = "primary" | "secondary" | "high-school" | null;

interface Respondent {
  id: number;
  role: Role;
  tenure: Tenure | null;
  gradeLevel: GradeLevel | null;
  department: Department;
  frictionLevel: FrictionLevel;
  parentLevel: ParentLevel;
  departed: boolean;
  powerDistance: number;
  riskTolerance: number;
  decisionSpeed: number;
  communicationStyle: number;
  individualismCollectivism: number;
}

const MOCK_RESPONDENTS: Respondent[] = [
  // ── Administration (8) ────────────────────────────────────────────────────
  { id:1,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:78, riskTolerance:32, decisionSpeed:25, communicationStyle:44, individualismCollectivism:72 },
  { id:2,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:72, riskTolerance:38, decisionSpeed:28, communicationStyle:50, individualismCollectivism:65 },
  { id:3,  role:"admin", tenure:"6-10", gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:70, riskTolerance:40, decisionSpeed:32, communicationStyle:48, individualismCollectivism:70 },
  { id:4,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:76, riskTolerance:35, decisionSpeed:30, communicationStyle:52, individualismCollectivism:68 },
  { id:5,  role:"admin", tenure:"6-10", gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:74, riskTolerance:36, decisionSpeed:34, communicationStyle:46, individualismCollectivism:66 },
  { id:6,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:80, riskTolerance:30, decisionSpeed:28, communicationStyle:45, individualismCollectivism:74 },
  { id:7,  role:"admin", tenure:"3-5",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:68, riskTolerance:42, decisionSpeed:35, communicationStyle:55, individualismCollectivism:62 },
  { id:8,  role:"admin", tenure:"6-10", gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:72, riskTolerance:34, decisionSpeed:28, communicationStyle:44, individualismCollectivism:70 },
  // ── Teachers: 0–2 yrs ────────────────────────────────────────────────────
  { id:9,  role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"humanities", frictionLevel:"high", parentLevel:null, departed:false, powerDistance:22, riskTolerance:72, decisionSpeed:70, communicationStyle:80, individualismCollectivism:30 },
  { id:10, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"stem",       frictionLevel:"high", parentLevel:null, departed:false, powerDistance:28, riskTolerance:68, decisionSpeed:72, communicationStyle:76, individualismCollectivism:34 },
  { id:11, role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"stem",       frictionLevel:"high", parentLevel:null, departed:false, powerDistance:25, riskTolerance:75, decisionSpeed:65, communicationStyle:82, individualismCollectivism:38 },
  { id:12, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"humanities", frictionLevel:"high", parentLevel:null, departed:false, powerDistance:30, riskTolerance:70, decisionSpeed:68, communicationStyle:78, individualismCollectivism:35 },
  { id:13, role:"teacher", tenure:"0-2", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:26, riskTolerance:74, decisionSpeed:66, communicationStyle:76, individualismCollectivism:40 },
  { id:14, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"stem",       frictionLevel:"high", parentLevel:null, departed:false, powerDistance:32, riskTolerance:66, decisionSpeed:70, communicationStyle:80, individualismCollectivism:32 },
  { id:15, role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"humanities", frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:28, riskTolerance:70, decisionSpeed:68, communicationStyle:74, individualismCollectivism:38 },
  { id:16, role:"teacher", tenure:"0-2", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:24, riskTolerance:72, decisionSpeed:64, communicationStyle:78, individualismCollectivism:36 },
  { id:17, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"humanities", frictionLevel:"high", parentLevel:null, departed:false, powerDistance:30, riskTolerance:68, decisionSpeed:72, communicationStyle:80, individualismCollectivism:34 },
  { id:18, role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"stem",       frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:26, riskTolerance:73, decisionSpeed:67, communicationStyle:76, individualismCollectivism:40 },
  { id:19, role:"teacher", tenure:"0-2", gradeLevel:"elementary", department:"humanities", frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:29, riskTolerance:69, decisionSpeed:65, communicationStyle:78, individualismCollectivism:38 },
  // ── Teachers: 3–5 yrs ────────────────────────────────────────────────────
  { id:20, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"humanities", frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:38, riskTolerance:65, decisionSpeed:55, communicationStyle:76, individualismCollectivism:45 },
  { id:21, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"stem",       frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:42, riskTolerance:62, decisionSpeed:58, communicationStyle:74, individualismCollectivism:50 },
  { id:22, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"arts-pe",    frictionLevel:"high", parentLevel:null, departed:false, powerDistance:40, riskTolerance:60, decisionSpeed:56, communicationStyle:72, individualismCollectivism:48 },
  { id:23, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"stem",       frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:44, riskTolerance:64, decisionSpeed:60, communicationStyle:76, individualismCollectivism:46 },
  { id:24, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"humanities", frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:39, riskTolerance:63, decisionSpeed:57, communicationStyle:75, individualismCollectivism:49 },
  { id:25, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"stem",       frictionLevel:"high", parentLevel:null, departed:false, powerDistance:45, riskTolerance:65, decisionSpeed:62, communicationStyle:73, individualismCollectivism:47 },
  { id:26, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:41, riskTolerance:61, decisionSpeed:55, communicationStyle:74, individualismCollectivism:52 },
  { id:27, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"humanities", frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:43, riskTolerance:63, decisionSpeed:58, communicationStyle:73, individualismCollectivism:48 },
  { id:28, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"stem",       frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:40, riskTolerance:62, decisionSpeed:56, communicationStyle:75, individualismCollectivism:46 },
  { id:29, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"humanities", frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:42, riskTolerance:64, decisionSpeed:59, communicationStyle:74, individualismCollectivism:50 },
  { id:30, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"arts-pe",    frictionLevel:"high", parentLevel:null, departed:false, powerDistance:38, riskTolerance:66, decisionSpeed:57, communicationStyle:72, individualismCollectivism:47 },
  { id:31, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"humanities", frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:41, riskTolerance:60, decisionSpeed:55, communicationStyle:76, individualismCollectivism:49 },
  { id:32, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"stem",       frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:43, riskTolerance:63, decisionSpeed:58, communicationStyle:74, individualismCollectivism:48 },
  { id:33, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"arts-pe",    frictionLevel:"low",  parentLevel:null, departed:false, powerDistance:40, riskTolerance:62, decisionSpeed:56, communicationStyle:73, individualismCollectivism:50 },
  // ── Teachers: 6–10 yrs ───────────────────────────────────────────────────
  { id:34, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"humanities", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:48, riskTolerance:57, decisionSpeed:44, communicationStyle:66, individualismCollectivism:54 },
  { id:35, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"stem",       frictionLevel:"low", parentLevel:null, departed:false, powerDistance:52, riskTolerance:54, decisionSpeed:47, communicationStyle:64, individualismCollectivism:50 },
  { id:36, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"arts-pe",    frictionLevel:"low", parentLevel:null, departed:false, powerDistance:50, riskTolerance:56, decisionSpeed:45, communicationStyle:65, individualismCollectivism:52 },
  { id:37, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"stem",       frictionLevel:"low", parentLevel:null, departed:false, powerDistance:49, riskTolerance:55, decisionSpeed:46, communicationStyle:67, individualismCollectivism:53 },
  { id:38, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"humanities", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:51, riskTolerance:53, decisionSpeed:44, communicationStyle:63, individualismCollectivism:51 },
  { id:39, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"humanities", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:50, riskTolerance:56, decisionSpeed:46, communicationStyle:66, individualismCollectivism:52 },
  { id:40, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low", parentLevel:null, departed:false, powerDistance:48, riskTolerance:58, decisionSpeed:45, communicationStyle:64, individualismCollectivism:54 },
  { id:41, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"stem",       frictionLevel:"low", parentLevel:null, departed:false, powerDistance:52, riskTolerance:54, decisionSpeed:46, communicationStyle:65, individualismCollectivism:50 },
  { id:42, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"humanities", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:50, riskTolerance:55, decisionSpeed:44, communicationStyle:67, individualismCollectivism:53 },
  { id:43, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"stem",       frictionLevel:"low", parentLevel:null, departed:false, powerDistance:49, riskTolerance:57, decisionSpeed:47, communicationStyle:65, individualismCollectivism:51 },
  // ── Teachers: 10+ yrs ────────────────────────────────────────────────────
  { id:44, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"humanities", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:60, riskTolerance:44, decisionSpeed:36, communicationStyle:58, individualismCollectivism:62 },
  { id:45, role:"teacher", tenure:"10+", gradeLevel:"middle",     department:"stem",       frictionLevel:"low", parentLevel:null, departed:false, powerDistance:64, riskTolerance:40, decisionSpeed:38, communicationStyle:56, individualismCollectivism:60 },
  { id:46, role:"teacher", tenure:"10+", gradeLevel:"high",       department:"humanities", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:62, riskTolerance:42, decisionSpeed:40, communicationStyle:60, individualismCollectivism:58 },
  { id:47, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low", parentLevel:null, departed:false, powerDistance:60, riskTolerance:44, decisionSpeed:36, communicationStyle:58, individualismCollectivism:64 },
  { id:48, role:"teacher", tenure:"10+", gradeLevel:"high",       department:"stem",       frictionLevel:"low", parentLevel:null, departed:false, powerDistance:63, riskTolerance:41, decisionSpeed:39, communicationStyle:57, individualismCollectivism:60 },
  { id:49, role:"teacher", tenure:"10+", gradeLevel:"middle",     department:"humanities", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:62, riskTolerance:43, decisionSpeed:38, communicationStyle:59, individualismCollectivism:62 },
  { id:50, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low", parentLevel:null, departed:false, powerDistance:61, riskTolerance:42, decisionSpeed:37, communicationStyle:58, individualismCollectivism:63 },
  // ── Parents ───────────────────────────────────────────────────────────────
  { id:51, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",    departed:false, powerDistance:60, riskTolerance:38, decisionSpeed:30, communicationStyle:42, individualismCollectivism:74 },
  { id:52, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",    departed:false, powerDistance:56, riskTolerance:42, decisionSpeed:34, communicationStyle:46, individualismCollectivism:70 },
  { id:53, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",    departed:false, powerDistance:58, riskTolerance:40, decisionSpeed:32, communicationStyle:44, individualismCollectivism:72 },
  { id:54, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",    departed:false, powerDistance:62, riskTolerance:36, decisionSpeed:28, communicationStyle:40, individualismCollectivism:76 },
  { id:55, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",    departed:false, powerDistance:58, riskTolerance:40, decisionSpeed:32, communicationStyle:44, individualismCollectivism:72 },
  { id:56, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",    departed:false, powerDistance:60, riskTolerance:38, decisionSpeed:30, communicationStyle:42, individualismCollectivism:74 },
  { id:57, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",    departed:false, powerDistance:56, riskTolerance:42, decisionSpeed:34, communicationStyle:46, individualismCollectivism:70 },
  { id:65, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",  departed:false, powerDistance:54, riskTolerance:46, decisionSpeed:38, communicationStyle:50, individualismCollectivism:66 },
  { id:66, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",  departed:false, powerDistance:56, riskTolerance:44, decisionSpeed:36, communicationStyle:48, individualismCollectivism:68 },
  { id:67, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",  departed:false, powerDistance:52, riskTolerance:48, decisionSpeed:40, communicationStyle:52, individualismCollectivism:64 },
  { id:68, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",  departed:false, powerDistance:55, riskTolerance:45, decisionSpeed:37, communicationStyle:49, individualismCollectivism:67 },
  { id:69, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",  departed:false, powerDistance:53, riskTolerance:47, decisionSpeed:39, communicationStyle:51, individualismCollectivism:65 },
  { id:78, role:"parent", tenure:null, gradeLevel:"high",       department:null, frictionLevel:"low", parentLevel:"high-school",departed:false, powerDistance:50, riskTolerance:48, decisionSpeed:42, communicationStyle:52, individualismCollectivism:62 },
  { id:79, role:"parent", tenure:null, gradeLevel:"high",       department:null, frictionLevel:"low", parentLevel:"high-school",departed:false, powerDistance:52, riskTolerance:46, decisionSpeed:40, communicationStyle:50, individualismCollectivism:64 },
  { id:80, role:"parent", tenure:null, gradeLevel:"high",       department:null, frictionLevel:"low", parentLevel:"high-school",departed:false, powerDistance:48, riskTolerance:50, decisionSpeed:44, communicationStyle:54, individualismCollectivism:60 },
];

// ─── Gap action status ────────────────────────────────────────────────────────

type GapStatus = "unaddressed" | "in_progress" | "monitoring" | "resolved";


// Derive status automatically from attendance %, but allow admin to manually
// pin to "monitoring" or "resolved" (stored in localStorage) as an override.
function deriveStatus(attendedCount: number, groupSize: number, override: GapStatus | undefined): GapStatus {
  // Any manual override is respected
  if (override !== undefined) return override;
  const pct = groupSize > 0 ? (attendedCount / groupSize) * 100 : 0;
  if (pct >= 100) return "resolved";
  if (pct >= 50)  return "monitoring";
  if (pct > 0)    return "in_progress";
  return "unaddressed";
}

const STORAGE_KEY = "gap_statuses_v1";

function loadStatuses(): Record<string, GapStatus> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}
function saveStatuses(s: Record<string, GapStatus>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}


// ─── Mock sessions (same as GroupProfiles) ────────────────────────────────────

type DimKey = "powerDistance" | "riskTolerance" | "decisionSpeed" | "communicationStyle" | "individualismCollectivism";

interface MockSession {
  id: string;
  title: string;
  dim: DimKey;
  scheduledDate: string;
}

const MOCK_SESSIONS: MockSession[] = [
  // Past sessions
  { id: "s1",  dim: "powerDistance",             title: "Leadership & Hierarchy",             scheduledDate: "2026-01-15" },
  { id: "s2",  dim: "powerDistance",             title: "Equity & Voice in Schools",          scheduledDate: "2026-02-10" },
  { id: "s3",  dim: "powerDistance",             title: "Authority Structures",               scheduledDate: "2026-03-05" },
  { id: "s4",  dim: "riskTolerance",             title: "Leading Through Change",             scheduledDate: "2026-01-20" },
  { id: "s5",  dim: "riskTolerance",             title: "Innovation & Resilience",            scheduledDate: "2026-02-18" },
  { id: "s6",  dim: "riskTolerance",             title: "Risk & Agility",                     scheduledDate: "2026-03-12" },
  { id: "s7",  dim: "decisionSpeed",             title: "Agile Decision Making",              scheduledDate: "2026-01-28" },
  { id: "s8",  dim: "decisionSpeed",             title: "Urgency & Process",                  scheduledDate: "2026-02-25" },
  { id: "s9",  dim: "decisionSpeed",             title: "Responsive Leadership",              scheduledDate: "2026-03-20" },
  { id: "s10", dim: "communicationStyle",        title: "Direct vs Indirect Communication",   scheduledDate: "2026-02-05" },
  { id: "s11", dim: "communicationStyle",        title: "Feedback Cultures",                  scheduledDate: "2026-03-01" },
  { id: "s12", dim: "communicationStyle",        title: "Listening Across Differences",       scheduledDate: "2026-03-28" },
  { id: "s13", dim: "individualismCollectivism", title: "Team & Collective Culture",          scheduledDate: "2026-02-12" },
  { id: "s14", dim: "individualismCollectivism", title: "Community & Belonging",              scheduledDate: "2026-03-08" },
  { id: "s15", dim: "individualismCollectivism", title: "Collaboration Norms",               scheduledDate: "2026-04-02" },
  // Upcoming sessions
  { id: "s16", dim: "powerDistance",             title: "Navigating Hierarchy in Schools",    scheduledDate: "2026-04-24" },
  { id: "s17", dim: "powerDistance",             title: "Inclusive Leadership",               scheduledDate: "2026-05-08" },
  { id: "s18", dim: "riskTolerance",             title: "Embracing Uncertainty",              scheduledDate: "2026-04-18" },
  { id: "s19", dim: "riskTolerance",             title: "Change Readiness",                   scheduledDate: "2026-05-15" },
  { id: "s20", dim: "decisionSpeed",             title: "Fast vs Deliberate Decision Making", scheduledDate: "2026-04-22" },
  { id: "s21", dim: "decisionSpeed",             title: "Decision Frameworks",                scheduledDate: "2026-05-20" },
  { id: "s22", dim: "communicationStyle",        title: "Cross-Cultural Communication",       scheduledDate: "2026-04-30" },
  { id: "s23", dim: "communicationStyle",        title: "Difficult Conversations",            scheduledDate: "2026-05-22" },
  { id: "s24", dim: "individualismCollectivism", title: "Building Collective Identity",       scheduledDate: "2026-04-17" },
  { id: "s25", dim: "individualismCollectivism", title: "Group Accountability",               scheduledDate: "2026-05-12" },
];

const SESSION_TODAY = "2026-04-14";

function mockAttended(respondentId: number, sessionId: string): boolean {
  const sessionIdx = parseInt(sessionId.replace("s", ""), 10);
  const base = sessionIdx <= 5 ? 0.7 : sessionIdx <= 10 ? 0.5 : 0.3;
  const hash = ((respondentId * 2654435761) ^ (sessionIdx * 40503)) >>> 0;
  return (hash % 100) / 100 < base;
}

function getPastSessions(respondentIds: number[], dim: DimKey): { session: MockSession; attended: number; total: number }[] {
  return MOCK_SESSIONS
    .filter(s => s.dim === dim && s.scheduledDate <= SESSION_TODAY)
    .map(s => ({
      session: s,
      attended: respondentIds.filter(id => mockAttended(id, s.id)).length,
      total: respondentIds.length,
    }));
}


// ─── Signal bars ──────────────────────────────────────────────────────────────

// ─── Inline tooltip ───────────────────────────────────────────────────────────

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex items-center">
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 text-[9px] font-bold cursor-default select-none leading-none">?</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 rounded-lg bg-gray-900 px-3 py-2 text-[11px] text-white leading-relaxed shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  );
}

// ─── Dimension metadata ───────────────────────────────────────────────────────

type DimensionField = "powerDistance" | "riskTolerance" | "decisionSpeed" | "communicationStyle" | "individualismCollectivism";

const DIMENSIONS: { field: DimensionField; label: string; lowLabel: string; highLabel: string; tip: string }[] = [
  { field: "powerDistance",            label: "Power Distance",       lowLabel: "Egalitarian",   highLabel: "Hierarchical",  tip: "How comfortable this group is with authority and hierarchy. High = prefers clear chain of command. Low = prefers flat, collaborative structures."  },
  { field: "riskTolerance",            label: "Risk Tolerance",       lowLabel: "Risk-Averse",   highLabel: "Risk-Open",     tip: "How willing this group is to embrace uncertainty or try new approaches. High = comfortable experimenting. Low = prefers established procedures." },
  { field: "decisionSpeed",            label: "Decision Speed",       lowLabel: "Deliberate",    highLabel: "Fast",          tip: "How quickly this group prefers to make decisions. High = moves fast, acts then adjusts. Low = prefers careful analysis and consultation before acting." },
  { field: "communicationStyle",       label: "Communication Style",  lowLabel: "Indirect",      highLabel: "Direct",        tip: "How explicitly this group communicates. High = says exactly what they mean. Low = relies on context, tone, and implication." },
  { field: "individualismCollectivism",label: "Group vs Individual",  lowLabel: "Individualist", highLabel: "Group-Focused", tip: "Whether this group prioritises individual achievement or collective success. High = team-first, shared goals. Low = values personal ownership and recognition." },
];

// ─── Gap analysis types ───────────────────────────────────────────────────────

interface DimensionGap {
  label: string;
  field: DimensionField;
  segmentScore: number;
  adminScore: number;
  gap: number; // absolute, segment − admin (signed)
  absGap: number;
  scores: number[];
  spread: number;
  adminScores: number[];
  adminSpread: number;
  lowLabel: string;
  highLabel: string;
}

interface GapResult {
  id: string;
  label: string;
  sublabel: string;
  role: string;
  tenure: string | null;
  gradeLevel: string | null;
  department: string | null;
  frictionLevel: string | null;
  n: number;
  respondentIds: number[];
  maxAbsGap: number;
  severity: "critical" | "watch" | "aligned";
  dimensionGaps: DimensionGap[];
}

// ─── Severity thresholds ──────────────────────────────────────────────────────
const CRITICAL_THRESHOLD = 35;
const WATCH_THRESHOLD = 20;

// ─── Compute administration baseline ─────────────────────────────────────────

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// ─── Min segment size — avoid noisy single-respondent combos ─────────────────
const MIN_N = 5;

// ─── Dimension gap insights ───────────────────────────────────────────────────

const GAP_INSIGHTS: Record<DimensionField, { high: string; low: string }> = {
  powerDistance: {
    high: "This group is significantly more egalitarian than admin — they may push back on directives, seek flatter decision-making, or resist top-down communication.",
    low:  "This group is significantly more hierarchical than admin — they may over-defer, avoid raising concerns, or wait for explicit permission to act.",
  },
  riskTolerance: {
    high: "Much more risk-tolerant than admin — initiatives may feel restrained or over-controlled, creating frustration with slow approval cycles.",
    low:  "Much more risk-averse than admin — may resist change, prefer established procedures, and feel destabilised by rapid decisions.",
  },
  decisionSpeed: {
    high: "Significantly faster decision-makers than admin — may grow frustrated with deliberation, bypass process, or feel leadership is indecisive.",
    low:  "Much more deliberate than admin — may feel overwhelmed by quick directives and need more context and lead time.",
  },
  communicationStyle: {
    high: "Far more direct communicators than admin — indirect messaging is likely misread as evasive or unclear; bluntness may be perceived as insubordination.",
    low:  "Much more indirect than admin — explicit instructions may feel aggressive; important concerns may never surface clearly.",
  },
  individualismCollectivism: {
    high: "Much more group-oriented than admin — individual performance frameworks, competitive incentives, or solo recognition may create friction.",
    low:  "Far more individualistic than admin — collective-first messaging, team-based goals, or shared accountability may feel frustrating or unfair.",
  },
};

function getInsight(field: DimensionField, gap: number): string {
  return gap > 0 ? GAP_INSIGHTS[field].high : GAP_INSIGHTS[field].low;
}

// ─── Main computation ─────────────────────────────────────────────────────────

function computeGaps(): GapResult[] {
  const current = MOCK_RESPONDENTS.filter(r => !r.departed);
  const admins = current.filter(r => r.role === "admin");

  const adminAvgs: Record<DimensionField, number> = {} as Record<DimensionField, number>;
  for (const d of DIMENSIONS) {
    adminAvgs[d.field] = avg(admins.map(r => r[d.field] as number));
  }

  // Build all unique segments: role × tenure × gradeLevel × department
  // For teachers only: all combos of tenure × gradeLevel × department
  // For parents: gradeLevel (via parentLevel)
  const results: GapResult[] = [];

  const nonAdmin = current.filter(r => r.role !== "admin");

  // Group by: role + tenure + gradeLevel + department
  const groupMap = new Map<string, Respondent[]>();

  for (const r of nonAdmin) {
    // We want increasingly granular combos:
    // 1. role only
    // 2. role + tenure
    // 3. role + gradeLevel
    // 4. role + department
    // 5. role + tenure + gradeLevel
    // 6. role + tenure + department
    // 7. role + gradeLevel + department
    // 8. role + tenure + gradeLevel + department (most specific)

    const roleKey = r.role;
    const tenureKey = r.tenure ?? "none";
    const levelKey = r.gradeLevel ?? "none";
    const deptKey = r.department ?? "none";

    const combos = [
      [roleKey],
      [roleKey, tenureKey],
      [roleKey, levelKey],
      [roleKey, deptKey],
      [roleKey, tenureKey, levelKey],
      [roleKey, tenureKey, deptKey],
      [roleKey, levelKey, deptKey],
      [roleKey, tenureKey, levelKey, deptKey],
    ];

    for (const combo of combos) {
      const key = combo.join("|");
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(r);
    }
  }

  const seen = new Set<string>();

  for (const [key, members] of groupMap.entries()) {
    if (seen.has(key) || members.length < MIN_N) continue;
    seen.add(key);

    const parts = key.split("|");

    // Compute per-dimension gaps vs admin
    const dimGaps: DimensionGap[] = DIMENSIONS.map(d => {
      const scores = members.map(r => r[d.field] as number);
      const segScore = avg(scores);
      const gap = segScore - adminAvgs[d.field];
      const spread = scores.length > 0 ? Math.max(...scores) - Math.min(...scores) : 0;
      
      const adminScores = admins.map(r => r[d.field] as number);
      const adminSpread = adminScores.length > 0 ? Math.max(...adminScores) - Math.min(...adminScores) : 0;

      return {
        label: d.label,
        field: d.field,
        segmentScore: segScore,
        adminScore: adminAvgs[d.field],
        gap,
        absGap: Math.abs(gap),
        scores,
        spread,
        adminScores,
        adminSpread,
        lowLabel: d.lowLabel,
        highLabel: d.highLabel,
      };
});

    const maxAbsGap = dimGaps[0].absGap;
    const severity: "critical" | "watch" | "aligned" = maxAbsGap >= CRITICAL_THRESHOLD ? "critical" : maxAbsGap >= WATCH_THRESHOLD ? "watch" : "aligned";

    // Build human-readable label from combo parts
    const roleLabel: Record<string, string> = {
      teacher: "Teachers", parent: "Parents",
    };
    const tenureLabel: Record<string, string> = {
      "0-2": "0–2 yrs", "3-5": "3–5 yrs", "6-10": "6–10 yrs", "10+": "10+ yrs",
    };
    const levelLabel: Record<string, string> = {
      elementary: "Elementary", middle: "Middle School", high: "High School",
    };
    const deptLabel: Record<string, string> = {
      humanities: "Humanities", stem: "STEM", "arts-pe": "Arts & PE", "admin-support": "Admin Support",
    };
    const parentLevelLabel: Record<string, string> = {
      primary: "Primary", secondary: "Secondary", "high-school": "HS", none: "",
    };

    // Infer role/tenure/level/dept from combo parts
    const role = parts[0] === "parent" ? "parent" : "teacher";
    const tenure = parts.find(p => ["0-2","3-5","6-10","10+"].includes(p)) ?? null;
    const gradeLevel = parts.find(p => ["elementary","middle","high"].includes(p)) ?? null;
    const department = parts.find(p => ["humanities","stem","arts-pe"].includes(p)) ?? null;
    const parentLevel = role === "parent"
      ? (members[0].parentLevel ?? null)
      : null;

    const labelParts: string[] = [roleLabel[role] ?? role];
    if (role === "parent" && parentLevel) labelParts[0] = `${parentLevelLabel[parentLevel]} Parents`;
    if (tenure) labelParts.push(tenureLabel[tenure]);
    if (gradeLevel) labelParts.push(levelLabel[gradeLevel]);
    if (department) labelParts.push(deptLabel[department]);

    const label = labelParts.join(" · ");
    const sublabel = `vs. Admin baseline · ${members.length} people`;

    results.push({
      id: key,
      label,
      sublabel,
      role,
      tenure,
      gradeLevel,
      department,
      frictionLevel: members.some(r => r.frictionLevel === "high") ? "high" : "low",
      n: members.length,
      respondentIds: members.map(r => r.id),
      maxAbsGap,
      severity,
      dimensionGaps: dimGaps,
    });
  }

  return results;
}

// ─── Expandable row ───────────────────────────────────────────────────────────

// ─── Radar chart ─────────────────────────────────────────────────────────────

const DIM_ABBR: Record<DimensionField, string> = {
  powerDistance: "PD",
  riskTolerance: "RT",
  decisionSpeed: "DS",
  communicationStyle: "CS",
  individualismCollectivism: "GI",
};

function GapRadar({ result }: { result: GapResult }) {
  const data = result.dimensionGaps.map(dg => ({
    dim: dg.label,
    segment: dg.segmentScore,
    admin: dg.adminScore,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="dim"
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />
        <Radar name="Admin" dataKey="admin" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={1.5} strokeDasharray="4 2" />
        <Radar name="Group" dataKey="segment" stroke="#1a7a7a" fill="#1a7a7a" fillOpacity={0.15} strokeWidth={2} />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
          formatter={(v: number, name: string) => [v, name === "segment" ? "This group" : "Admin avg"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Dimension row (collapsed) ────────────────────────────────────────────────

function DimensionRow({
  avg,
  adminScore,
  gap,
  dimLabel,
  lowLabel,
  highLabel,
  tip,
}: {
  avg: number;
  adminScore: number;
  gap: number;
  dimLabel: string;
  lowLabel: string;
  highLabel: string;
  tip: string;
}) {
  const absGap = Math.abs(gap);
  const gapTextColor = absGap >= 35 ? "text-red-700" : absGap >= 20 ? "text-amber-700" : "text-slate-400";
  const barColor = absGap >= 35 ? "#1a7a7a" : absGap >= 20 ? "#4db8b8" : "#2a9d8f";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      {/* Dimension label */}
      <span className="w-40 shrink-0 flex items-center gap-1 text-sm font-medium text-slate-700 leading-tight">
        <span className="truncate">{dimLabel}</span>
        <InfoTip text={tip} />
      </span>

      {/* Low label */}
      <span className="w-20 shrink-0 text-right text-xs text-slate-400">{lowLabel}</span>

      {/* Comparison bar */}
      <div className="relative flex-1 h-4 bg-slate-100 rounded-full" style={{ overflow: "visible" }}>
        {/* Admin marker — tall tick through the bar */}
        <div
          className="absolute z-10"
          style={{ left: `${adminScore}%`, top: "-4px", bottom: "-4px", width: 3, background: "#f97316", borderRadius: 2, transform: "translateX(-50%)" }}
          title={`Admin avg: ${adminScore}`}
        />
        {/* Group marker — diamond */}
        <div
          className="absolute z-20"
          style={{
            left: `${avg}%`,
            top: "50%",
            transform: "translate(-50%, -50%) rotate(45deg)",
            width: 14,
            height: 14,
            background: barColor,
            borderRadius: 2,
            boxShadow: "0 0 0 2px white",
          }}
          title={`Group avg: ${avg}`}
        />
      </div>

      {/* High label */}
      <span className="w-20 shrink-0 text-left text-xs text-slate-400">{highLabel}</span>

      {/* Gap number */}
      <span className={`w-12 shrink-0 text-right text-sm font-bold tabular-nums ${gapTextColor}`}>
        {gap > 0 ? "+" : ""}{gap}
      </span>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  result,
  status: _status,
  onStatusChange: _onStatusChange,
}: {
  result: GapResult;
  status: GapStatus;
  onStatusChange: (id: string, s: GapStatus) => void;
}) {
  const topGap = result.dimensionGaps[0];
  const isCritical = result.severity === "critical";
  const gapColor = isCritical ? "#1a7a7a" : "#4db8b8";
  const frictionHours = Math.round(result.maxAbsGap * result.n * 0.1);

  return (
    <div className="h-full flex flex-col overflow-y-auto">

      {/* Group heading */}
      <div className="px-6 pt-6 pb-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 capitalize leading-tight">{result.label}</h2>
            <p className="text-sm text-gray-400 mt-1">{result.n} people · vs. Admin baseline</p>
          </div>
        </div>

        {/* Insight callout */}
        <div
          className="rounded-lg px-4 py-3 mt-3"
          style={{ background: isCritical ? "#f0fafa" : "#e6f7f7" }}
        >
          <p className="text-sm font-bold mb-1.5" style={{ color: gapColor }}>
            {topGap.gap > 0 ? `↑ Higher ${topGap.label}` : `↓ Lower ${topGap.label}`}
            <span className="ml-2 font-normal text-gray-400 text-xs">({topGap.gap > 0 ? "+" : ""}{topGap.gap}pts vs admin)</span>
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">{getInsight(topGap.field, topGap.gap)}</p>
        </div>
      </div>

      {/* Radar chart */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 px-2">
          CULTURAL PROFILE VS. ADMINISTRATION
        </p>
        <GapRadar result={result} />
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400 -mt-1 mb-1">
          <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0" style={{ borderTop: "1.5px dashed #f97316" }} />Administration avg</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0" style={{ borderTop: "2px solid #1a7a7a" }} />This group</span>
        </div>
      </div>

      {/* Dimension rows */}
      <div className="px-6 pb-5 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gap by dimension</p>
        <div className="flex items-center gap-3 pb-1.5 border-b border-slate-100">
          <span className="w-40 shrink-0 text-xs text-slate-400">Dimension</span>
          <span className="w-20 shrink-0 text-right text-xs text-slate-400">Low</span>
          <div className="flex-1 text-xs text-slate-400 text-center">← Scale →</div>
          <span className="w-20 shrink-0 text-left text-xs text-slate-400">High</span>
          <span className="w-12 shrink-0 text-right text-xs text-slate-400">Gap</span>
        </div>
        {result.dimensionGaps.map(dg => (
          <DimensionRow
            key={dg.field}
            avg={dg.segmentScore}
            adminScore={dg.adminScore}
            gap={dg.gap}
            dimLabel={dg.label}
            lowLabel={dg.lowLabel}
            highLabel={dg.highLabel}
            tip={DIMENSIONS.find(d => d.field === dg.field)?.tip ?? ""}
          />
        ))}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            est. friction / month
            <InfoTip text="Estimated hours of misalignment per month, based on group size × gap severity. A rough signal, not a precise measure." />
          </div>
          <span className="text-base font-bold tabular-nums" style={{ color: gapColor }}>~{frictionHours}h</span>
        </div>
      </div>

    </div>
  );
}

// ─── Left list item ───────────────────────────────────────────────────────────

function GapListItem({
  result,
  status,
  isSelected,
  onClick,
}: {
  result: GapResult;
  status: GapStatus;
  isSelected: boolean;
  onClick: () => void;
}) {
  const topGap = result.dimensionGaps[0];
  const isCritical = result.severity === "critical";
  // Red = critical gap, amber = watch, teal = aligned (keeps green reserved for session attendance)
  const gapColor = isCritical ? "#1a7a7a" : result.severity === "watch" ? "#4db8b8" : "#264653";

  const radarData = result.dimensionGaps.map(dg => ({
    dim: DIM_ABBR[dg.field as DimensionField] ?? dg.field,
    segment: dg.segmentScore,
    admin: dg.adminScore,
  }));

  return (
    <button
      onClick={onClick}
      className={`flex flex-col flex-1 w-full text-left px-4 py-4 rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 ${
        isSelected
          ? "bg-white border-teal-400 shadow-sm"
          : "bg-white border-slate-200 hover:bg-slate-50"
      }`}
    >
      {/* Top row: icon + label + gap */}
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex items-center justify-center rounded-full w-6 h-6 shrink-0"
          style={{ background: isCritical ? "#1a7a7a" : result.severity === "watch" ? "#4db8b8" : "#264653" }}
        >
          {isCritical
            ? <AlertTriangle className="h-3 w-3 text-white" />
            : result.severity === "watch"
            ? <Eye className="h-3 w-3 text-white" />
            : <Check className="h-3 w-3 text-white" />
          }
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 capitalize leading-snug">{result.label}</div>
          <div className="text-xs text-gray-400 mt-1">{topGap.label}</div>
        </div>
        <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: gapColor }}>
          {topGap.gap > 0 ? "+" : ""}{topGap.gap}
        </span>
      </div>

      {/* Mini radar */}
      <div className="flex-1 flex items-center justify-center -mx-2 pointer-events-none">
        <RadarChart width={180} height={130} data={radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9, fill: "#9ca3af" }} />
          <Radar name="admin" dataKey="admin" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={1} strokeDasharray="3 2" />
          <Radar name="segment" dataKey="segment" stroke={gapColor} fill={gapColor} fillOpacity={0.18} strokeWidth={1.5} />
        </RadarChart>
      </div>

      {/* People count */}
      <div className="flex items-center">
        <span className="ml-auto text-xs text-gray-400">{result.n} people</span>
      </div>
    </button>
  );
}

// ─── Attended count ───────────────────────────────────────────────────────────

function computeAttendedCount(result: GapResult): number {
  const dim = result.dimensionGaps[0].field as DimKey;
  const sessions = getPastSessions(result.respondentIds, dim);
  const attended = new Set<number>();
  for (const { session } of sessions) {
    for (const id of result.respondentIds) {
      if (mockAttended(id, session.id)) attended.add(id);
    }
  }
  return attended.size;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CulturalPreferencesAtRisk() {
  const allResults = useMemo(() => computeGaps(), []);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc" | "friction-desc" | "friction-asc">("desc");

  const [statuses, setStatuses] = useState<Record<string, GapStatus>>(loadStatuses);
  const handleStatusChange = (id: string, s: GapStatus) => {
    setStatuses(prev => { const next = { ...prev, [id]: s }; saveStatuses(next); return next; });
  };


  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rowsWithStatus = useMemo(() => {
    let mapped = allResults.map(result => {
      const attendedCount = computeAttendedCount(result);
      const derivedStatus = deriveStatus(attendedCount, result.n, statuses[result.id]);
      return { result, attendedCount, derivedStatus };
    });

    mapped.sort((a, b) => {
      if (sortOrder === "desc") {
        if (a.result.severity !== b.result.severity) {
          if (a.result.severity === "critical") return -1;
          if (b.result.severity === "critical") return 1;
          if (a.result.severity === "watch") return -1;
          if (b.result.severity === "watch") return 1;
        }
        return b.result.maxAbsGap - a.result.maxAbsGap;
      } else if (sortOrder === "asc") {
        if (a.result.severity !== b.result.severity) {
          if (a.result.severity === "aligned") return -1;
          if (b.result.severity === "aligned") return 1;
          if (a.result.severity === "watch") return -1;
          if (b.result.severity === "watch") return 1;
        }
        return a.result.maxAbsGap - b.result.maxAbsGap;
      } else if (sortOrder === "friction-desc") {
        if (a.result.frictionLevel !== b.result.frictionLevel) {
          return a.result.frictionLevel === "high" ? -1 : 1;
        }
        return b.result.maxAbsGap - a.result.maxAbsGap;
      } else {
        if (a.result.frictionLevel !== b.result.frictionLevel) {
          return a.result.frictionLevel === "low" ? -1 : 1;
        }
        return a.result.maxAbsGap - b.result.maxAbsGap;
      }
    });

    return mapped;
  }, [allResults, statuses, sortOrder]);

  // Auto-select first result when list changes
  useEffect(() => {
    if (rowsWithStatus.length > 0) {
      setSelectedId(prev => {
        const stillExists = rowsWithStatus.some(r => r.result.id === prev);
        return stillExists ? prev : rowsWithStatus[0].result.id;
      });
    } else {
      setSelectedId(null);
    }
  }, [rowsWithStatus]);

  const selectedRow = rowsWithStatus.find(r => r.result.id === selectedId) ?? rowsWithStatus[0] ?? null;
  const PAGE_SIZE = 3;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(rowsWithStatus.length / PAGE_SIZE);
  const visibleRows = rowsWithStatus.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
            <ArrowLeftRight className="h-4 w-4 text-slate-600" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold font-sans text-gray-900 leading-tight">Teacher ↔ Admin Alignment</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Where teacher groups diverge most from how administration thinks and works
            </p>
          </div>
        </div>
        
      </div>


      {/* Two-pane layout */}
      {rowsWithStatus.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No segments match the current filters.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-stretch">

          {/* Left: ranked list */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-3" style={{ boxShadow: "0 1px 6px 0 rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Teacher Groups</p>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "desc" | "asc" | "friction-desc" | "friction-asc")}
                className="text-[11px] font-medium rounded-md border border-slate-200 bg-white text-slate-600 outline-none cursor-pointer py-1 pl-2 pr-6 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' fill=\\'none\\' viewBox=\\'0 0 24 24\\' stroke=\\'%2364748b\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M19 9l-7 7-7-7\\'/></svg>')] bg-no-repeat"
                style={{ backgroundPosition: 'right 6px center', backgroundSize: '12px' }}
              >
                <option value="desc">Biggest gap</option>
                <option value="asc">Closest alignment</option>
                <option value="friction-desc">Most friction</option>
                <option value="friction-asc">Least friction</option>
              </select>
            </div>
            <div className="flex flex-col flex-1 gap-1.5">
              {visibleRows.map(({ result, derivedStatus }) => (
                <GapListItem
                  key={result.id}
                  result={result}
                  status={derivedStatus}
                  isSelected={result.id === selectedRow?.result.id}
                  onClick={() => setSelectedId(result.id)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>

          {/* Right: detail panel */}
          {selectedRow && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              style={{ boxShadow: "0 1px 6px 0 rgba(0,0,0,0.07)" }}>
              <DetailPanel
                result={selectedRow.result}
                status={selectedRow.derivedStatus}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
