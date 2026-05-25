import { useMemo, useState } from "react";
import { Brain, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Legend,
} from "recharts";

// ─── Respondent dataset (same as Cost of Misalignment / Wellness Impact) ──────

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
  { id:51, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     departed:false, powerDistance:60, riskTolerance:38, decisionSpeed:30, communicationStyle:42, individualismCollectivism:74 },
  { id:52, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     departed:false, powerDistance:56, riskTolerance:42, decisionSpeed:34, communicationStyle:46, individualismCollectivism:70 },
  { id:53, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     departed:false, powerDistance:58, riskTolerance:40, decisionSpeed:32, communicationStyle:44, individualismCollectivism:72 },
  { id:54, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     departed:false, powerDistance:62, riskTolerance:36, decisionSpeed:28, communicationStyle:40, individualismCollectivism:76 },
  { id:55, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     departed:false, powerDistance:58, riskTolerance:40, decisionSpeed:32, communicationStyle:44, individualismCollectivism:72 },
  { id:56, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     departed:false, powerDistance:60, riskTolerance:38, decisionSpeed:30, communicationStyle:42, individualismCollectivism:74 },
  { id:57, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     departed:false, powerDistance:56, riskTolerance:42, decisionSpeed:34, communicationStyle:46, individualismCollectivism:70 },
  { id:65, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   departed:false, powerDistance:54, riskTolerance:46, decisionSpeed:38, communicationStyle:50, individualismCollectivism:66 },
  { id:66, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   departed:false, powerDistance:56, riskTolerance:44, decisionSpeed:36, communicationStyle:48, individualismCollectivism:68 },
  { id:67, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   departed:false, powerDistance:52, riskTolerance:48, decisionSpeed:40, communicationStyle:52, individualismCollectivism:64 },
  { id:68, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   departed:false, powerDistance:55, riskTolerance:45, decisionSpeed:37, communicationStyle:49, individualismCollectivism:67 },
  { id:69, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   departed:false, powerDistance:53, riskTolerance:47, decisionSpeed:39, communicationStyle:51, individualismCollectivism:65 },
  { id:78, role:"parent", tenure:null, gradeLevel:"high",       department:null, frictionLevel:"low", parentLevel:"high-school", departed:false, powerDistance:50, riskTolerance:48, decisionSpeed:42, communicationStyle:52, individualismCollectivism:62 },
  { id:79, role:"parent", tenure:null, gradeLevel:"high",       department:null, frictionLevel:"low", parentLevel:"high-school", departed:false, powerDistance:52, riskTolerance:46, decisionSpeed:40, communicationStyle:50, individualismCollectivism:64 },
  { id:80, role:"parent", tenure:null, gradeLevel:"high",       department:null, frictionLevel:"low", parentLevel:"high-school", departed:false, powerDistance:48, riskTolerance:50, decisionSpeed:44, communicationStyle:54, individualismCollectivism:60 },
];

// ─── CQ derivation from cultural gap profile ──────────────────────────────────
//
// CQ Drive    = motivation to engage across cultural difference
//               → penalised by high Power Distance gap (if group defers, they disengage)
//                 and high friction level
//
// CQ Knowledge = understanding of how culture shapes behaviour
//               → penalised by Individualism/Collectivism gap and Communication Style gap
//                 (divergent norms = blind spots)
//
// CQ Strategy  = awareness & planning before cross-cultural encounters
//               → penalised by Decision Speed gap (fast movers skip planning)
//                 and Risk Tolerance gap (risk-averse avoid ambiguous encounters)
//
// CQ Action    = ability to adapt verbal/non-verbal behaviour across cultures
//               → penalised by Communication Style gap (biggest behavioural barrier)
//                 and Power Distance gap (rigid roles constrain adaptation)

type DimensionField = "powerDistance" | "riskTolerance" | "decisionSpeed" | "communicationStyle" | "individualismCollectivism";

const CRITICAL_THRESHOLD = 35;
const WATCH_THRESHOLD = 20;
const MIN_N = 5;

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

interface CQGroup {
  id: string;
  label: string;
  n: number;
  severity: "critical" | "watch" | "aligned";
  maxAbsGap: number;
  drive: number;
  knowledge: number;
  strategy: number;
  action: number;
  overall: number;
  // for breakdown table
  gapPD: number;
  gapRT: number;
  gapDS: number;
  gapCS: number;
  gapIC: number;
  hasFriction: boolean;
}

function computeCQGroups(): CQGroup[] {
  const current = MOCK_RESPONDENTS.filter(r => !r.departed);
  const admins = current.filter(r => r.role === "admin");

  const dims: DimensionField[] = ["powerDistance", "riskTolerance", "decisionSpeed", "communicationStyle", "individualismCollectivism"];
  const adminAvgs = Object.fromEntries(dims.map(d => [d, avg(admins.map(r => r[d]))])) as Record<DimensionField, number>;

  const nonAdmin = current.filter(r => r.role !== "admin");

  const groupMap = new Map<string, Respondent[]>();

  const tenureLabel:  Record<string, string> = { "0-2": "0–2 yrs", "3-5": "3–5 yrs", "6-10": "6–10 yrs", "10+": "10+ yrs" };
  const levelLabel:   Record<string, string> = { elementary: "Elementary", middle: "Middle School", high: "High School" };
  const deptLabel:    Record<string, string> = { humanities: "Humanities", stem: "STEM", "arts-pe": "Arts & PE" };
  const roleLabel:    Record<string, string> = { teacher: "Teachers", parent: "Parents" };
  const parentLvlLabel: Record<string, string> = { primary: "Primary", secondary: "Secondary", "high-school": "HS" };

  // Build group combos (role-only and role+tenure for teachers; role+parentLevel for parents)
  for (const r of nonAdmin) {
    const rk = r.role;
    const tk = r.tenure ?? "none";
    const lk = r.gradeLevel ?? "none";
    const dk = r.department ?? "none";

    const combos = [
      [rk],
      [rk, tk],
      [rk, lk],
      [rk, dk],
      [rk, tk, lk],
      [rk, tk, dk],
    ];

    for (const combo of combos) {
      const key = combo.join("|");
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(r);
    }
  }

  const results: CQGroup[] = [];
  const seen = new Set<string>();

  for (const [key, members] of groupMap.entries()) {
    if (seen.has(key) || members.length < MIN_N) continue;
    seen.add(key);

    const parts = key.split("|");

    const gapPD = Math.abs(avg(members.map(r => r.powerDistance))          - adminAvgs.powerDistance);
    const gapRT = Math.abs(avg(members.map(r => r.riskTolerance))           - adminAvgs.riskTolerance);
    const gapDS = Math.abs(avg(members.map(r => r.decisionSpeed))           - adminAvgs.decisionSpeed);
    const gapCS = Math.abs(avg(members.map(r => r.communicationStyle))      - adminAvgs.communicationStyle);
    const gapIC = Math.abs(avg(members.map(r => r.individualismCollectivism)) - adminAvgs.individualismCollectivism);

    const maxAbsGap = Math.max(gapPD, gapRT, gapDS, gapCS, gapIC);
    const severity: "critical" | "watch" | "aligned" =
      maxAbsGap >= CRITICAL_THRESHOLD ? "critical" :
      maxAbsGap >= WATCH_THRESHOLD    ? "watch"    : "aligned";

    const hasFriction = members.filter(r => r.frictionLevel === "high").length / members.length > 0.4;

    // CQ Drive: high PD gap and friction suppress motivation to engage
    const drive = clamp(
      10 - gapPD * 0.09 - gapRT * 0.03 - (hasFriction ? 1.5 : 0),
      1, 10
    );

    // CQ Knowledge: IC + CS gaps create the most cultural blind spots
    const knowledge = clamp(
      10 - gapIC * 0.10 - gapCS * 0.05 - gapPD * 0.03,
      1, 10
    );

    // CQ Strategy: DS gap (moving fast = skipping planning) + RT gap (avoidance of ambiguity)
    const strategy = clamp(
      10 - gapDS * 0.09 - gapRT * 0.06 - (hasFriction ? 0.8 : 0),
      1, 10
    );

    // CQ Action: CS gap is the direct behavioural barrier; PD gap constrains adaptability
    const action = clamp(
      10 - gapCS * 0.10 - gapPD * 0.05 - (hasFriction ? 1.0 : 0),
      1, 10
    );

    const overall = (drive + knowledge + strategy + action) / 4;

    // Build label from combo parts
    const role       = parts[0] === "parent" ? "parent" : "teacher";
    const tenure     = parts.find(p => ["0-2","3-5","6-10","10+"].includes(p)) ?? null;
    const gradeLevel = parts.find(p => ["elementary","middle","high"].includes(p)) ?? null;
    const department = parts.find(p => ["humanities","stem","arts-pe"].includes(p)) ?? null;
    const parentLevel = role === "parent" ? (members[0].parentLevel ?? null) : null;

    const labelParts: string[] = [roleLabel[role] ?? role];
    if (role === "parent" && parentLevel) labelParts[0] = `${parentLvlLabel[parentLevel]} Parents`;
    if (tenure)     labelParts.push(tenureLabel[tenure]);
    if (gradeLevel) labelParts.push(levelLabel[gradeLevel]);
    if (department) labelParts.push(deptLabel[department]);

    results.push({
      id: key,
      label: labelParts.join(" · "),
      n: members.length,
      severity,
      maxAbsGap: Math.round(maxAbsGap),
      drive:    Math.round(drive * 10) / 10,
      knowledge:Math.round(knowledge * 10) / 10,
      strategy: Math.round(strategy * 10) / 10,
      action:   Math.round(action * 10) / 10,
      overall:  Math.round(overall * 10) / 10,
      gapPD: Math.round(gapPD),
      gapRT: Math.round(gapRT),
      gapDS: Math.round(gapDS),
      gapCS: Math.round(gapCS),
      gapIC: Math.round(gapIC),
      hasFriction,
    });
  }

  return results;
}

// ─── CQ dimension metadata ────────────────────────────────────────────────────

const CQ_DIMS = [
  {
    key: "drive" as const,
    label: "CQ Drive",
    color: "#1a7a7a",
    description: "Motivation & confidence to engage across cultural difference",
    driver: "Suppressed by Power Distance gaps — groups that feel structurally distant disengage from cross-cultural interaction.",
  },
  {
    key: "knowledge" as const,
    label: "CQ Knowledge",
    color: "#2a9d8f",
    description: "Understanding of how culture shapes norms, values, and behaviour",
    driver: "Eroded by Individualism/Collectivism and Communication Style gaps — divergent assumptions create blind spots.",
  },
  {
    key: "strategy" as const,
    label: "CQ Strategy",
    color: "#4db8b8",
    description: "Planning and awareness before entering cross-cultural encounters",
    driver: "Undermined by Decision Speed gaps — fast-moving groups skip cultural preparation and encounter surprises.",
  },
  {
    key: "action" as const,
    label: "CQ Action",
    color: "#2a9d8f",
    description: "Ability to adapt verbal and non-verbal behaviour across cultures",
    driver: "Directly blocked by Communication Style gaps — behavioural norms are the most visible barrier to adaptation.",
  },
];

type CQKey = "drive" | "knowledge" | "strategy" | "action";

function round1(n: number) { return Math.round(n * 10) / 10; }

function groupCQAvg(groups: CQGroup[], key: CQKey) {
  if (groups.length === 0) return 0;
  return round1(groups.reduce((s, g) => s + g[key], 0) / groups.length);
}

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ value, of = 10 }: { value: number; of?: number }) {
  const pct = value / of;
  const color = pct >= 0.75 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : pct >= 0.55 ? "text-amber-700 bg-amber-50 border-amber-200"
              :               "text-red-700 bg-red-50 border-red-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-bold ${color}`}>
      {value.toFixed(1)}
    </span>
  );
}

// ─── Delta chip ───────────────────────────────────────────────────────────────

function DeltaChip({ aligned, misaligned }: { aligned: number; misaligned: number }) {
  const delta = round1(misaligned - aligned);
  const positive = delta >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}{delta.toFixed(1)}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CulturalPreferencesCQImpact() {
  const allGroups = useMemo(() => computeCQGroups(), []);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const aligned    = allGroups.filter(g => g.severity === "aligned");
  const misaligned = allGroups.filter(g => g.severity !== "aligned");

  // Radar data: aligned vs misaligned averages across all 4 CQ dimensions
  const radarData = CQ_DIMS.map(d => ({
    dim: d.label.replace("CQ ", ""),
    Aligned:    groupCQAvg(aligned, d.key),
    Misaligned: groupCQAvg(misaligned, d.key),
  }));

  // Bar data: per-dimension comparison
  const barData = CQ_DIMS.map(d => ({
    name: d.label,
    shortName: d.label.replace("CQ ", ""),
    Aligned:    groupCQAvg(aligned, d.key),
    Misaligned: groupCQAvg(misaligned, d.key),
    color: d.color,
  }));

  // Overall averages
  const alignedOverall    = round1(aligned.length    ? aligned.reduce((s, g) => s + g.overall, 0)    / aligned.length    : 0);
  const misalignedOverall = round1(misaligned.length ? misaligned.reduce((s, g) => s + g.overall, 0) / misaligned.length : 0);

  // Worst-performing group per CQ dimension (among misaligned)
  const worstPerDim = CQ_DIMS.map(d => ({
    dim: d,
    group: misaligned.length
      ? misaligned.reduce((worst, g) => g[d.key] < worst[d.key] ? g : worst, misaligned[0])
      : null,
  }));

  // Sort misaligned groups by overall CQ asc for table
  const sortedMisaligned = [...misaligned].sort((a, b) => a.overall - b.overall);

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 shrink-0">
          <Brain className="h-4 w-4 text-indigo-600" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold font-sans text-gray-900 leading-tight">CQ Impact by Alignment</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">
            How cultural misalignment suppresses Drive, Knowledge, Strategy and Action across groups
          </p>
        </div>
      </div>

      {/* Summary banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <p className="text-center text-xl font-bold text-slate-800">
          Misaligned groups score{" "}
          <span className="text-red-500">{round1(alignedOverall - misalignedOverall).toFixed(1)} pts lower</span>{" "}
          overall across all four CQ dimensions.
        </p>
        <p className="text-center text-sm text-slate-500 mt-1">
          Cultural gaps don't just cause friction — they erode the capacity to navigate difference effectively.
        </p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {CQ_DIMS.map(d => (
            <div key={d.key} className="text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{d.label}</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-emerald-600 font-bold text-lg">{groupCQAvg(aligned, d.key).toFixed(1)}</span>
                <span className="text-slate-300 text-sm">vs</span>
                <span className="text-red-500 font-bold text-lg">{groupCQAvg(misaligned, d.key).toFixed(1)}</span>
              </div>
              <DeltaChip aligned={groupCQAvg(aligned, d.key)} misaligned={groupCQAvg(misaligned, d.key)} />
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Radar */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-1">CQ Profile Comparison</h2>
          <p className="text-xs text-slate-500 mb-4">Average scores across all four dimensions (out of 10)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: number) => [`${v.toFixed(1)} / 10`]}
                />
                <Radar name="Aligned"    dataKey="Aligned"    stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Misaligned" dataKey="Misaligned" stroke="#264653" fill="#264653" fillOpacity={0.15} strokeWidth={2} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-1">Dimension Breakdown</h2>
          <p className="text-xs text-slate-500 mb-4">Aligned vs misaligned group averages per CQ dimension</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 20, bottom: 5, left: -10 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} dy={8} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: number) => [`${v.toFixed(1)} / 10`]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Aligned"    fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Misaligned" fill="#264653" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CQ dimension driver cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {worstPerDim.map(({ dim, group }) => (
          <div key={dim.key} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: dim.color }}>
                  {dim.label}
                </p>
                <p className="text-sm font-semibold text-slate-800">{dim.description}</p>
              </div>
              {group && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Lowest group</p>
                  <ScoreBadge value={group[dim.key]} />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">{dim.driver}</p>
            {group && (
              <div className="mt-3 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{group.label}</span>
                {" "}— {group.n} respondents · Gap: {group.maxAbsGap} pts
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Group-level table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Misaligned Groups — CQ Breakdown</h2>
          <p className="text-xs text-slate-500 mt-0.5">Sorted by overall CQ score (lowest first). Click a row to see the cultural gap drivers.</p>
        </div>

        <div className="divide-y divide-slate-100">
          {sortedMisaligned.map(g => {
            const isOpen = expandedGroup === g.id;
            const severityColor = g.severity === "critical"
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700";

            return (
              <div key={g.id}>
                <button
                  className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedGroup(isOpen ? null : g.id)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Label + badge */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${severityColor}`}>
                        {g.severity}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 truncate">{g.label}</span>
                      <span className="text-xs text-slate-400 shrink-0">n={g.n}</span>
                    </div>

                    {/* CQ scores */}
                    <div className="flex items-center gap-3 shrink-0">
                      {CQ_DIMS.map(d => (
                        <div key={d.key} className="text-center hidden sm:block">
                          <p className="text-[9px] text-slate-400 uppercase tracking-wide">{d.key}</p>
                          <ScoreBadge value={g[d.key]} />
                        </div>
                      ))}
                      <div className="text-center ml-2">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wide">Overall</p>
                        <ScoreBadge value={g.overall} />
                      </div>
                      {isOpen
                        ? <ChevronUp className="h-4 w-4 text-slate-400 ml-1" />
                        : <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
                      }
                    </div>
                  </div>
                </button>

                {/* Expanded: gap drivers */}
                {isOpen && (
                  <div className="px-6 pb-5 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-4 mb-3">Cultural Gap Drivers</p>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {[
                        { label: "Power Distance", val: g.gapPD, affects: "Drive, Action" },
                        { label: "Risk Tolerance",  val: g.gapRT, affects: "Drive, Strategy" },
                        { label: "Decision Speed",  val: g.gapDS, affects: "Strategy" },
                        { label: "Comm. Style",     val: g.gapCS, affects: "Knowledge, Action" },
                        { label: "Group/Individual",val: g.gapIC, affects: "Knowledge" },
                      ].map(item => (
                        <div key={item.label} className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                          <p className="text-[10px] text-slate-400 font-medium mb-1">{item.label}</p>
                          <p className={`text-xl font-bold ${item.val >= CRITICAL_THRESHOLD ? "text-red-600" : item.val >= WATCH_THRESHOLD ? "text-amber-600" : "text-slate-700"}`}>
                            {item.val}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1">→ {item.affects}</p>
                        </div>
                      ))}
                    </div>
                    {g.hasFriction && (
                      <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        High friction reported — additional CQ Drive and CQ Action suppression applied.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {sortedMisaligned.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-10">No misaligned groups found.</p>
          )}
        </div>
      </div>

    </div>
  );
}
