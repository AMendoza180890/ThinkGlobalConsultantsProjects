import { useState, useMemo } from "react";
import { Check, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Radar, RadarChart, PolarGrid, PolarAngleAxis } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  { id:1,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:78, riskTolerance:32, decisionSpeed:25, communicationStyle:44, individualismCollectivism:72 },
  { id:2,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:72, riskTolerance:38, decisionSpeed:28, communicationStyle:50, individualismCollectivism:65 },
  { id:3,  role:"admin", tenure:"6-10", gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:70, riskTolerance:40, decisionSpeed:32, communicationStyle:48, individualismCollectivism:70 },
  { id:4,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:76, riskTolerance:35, decisionSpeed:30, communicationStyle:52, individualismCollectivism:68 },
  { id:5,  role:"admin", tenure:"6-10", gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:74, riskTolerance:36, decisionSpeed:34, communicationStyle:46, individualismCollectivism:66 },
  { id:6,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:80, riskTolerance:30, decisionSpeed:28, communicationStyle:45, individualismCollectivism:74 },
  { id:7,  role:"admin", tenure:"3-5",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:68, riskTolerance:42, decisionSpeed:35, communicationStyle:55, individualismCollectivism:62 },
  { id:8,  role:"admin", tenure:"6-10", gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:72, riskTolerance:34, decisionSpeed:28, communicationStyle:44, individualismCollectivism:70 },
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
  { id:44, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"humanities", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:60, riskTolerance:44, decisionSpeed:36, communicationStyle:58, individualismCollectivism:62 },
  { id:45, role:"teacher", tenure:"10+", gradeLevel:"middle",     department:"stem",       frictionLevel:"low", parentLevel:null, departed:false, powerDistance:64, riskTolerance:40, decisionSpeed:38, communicationStyle:56, individualismCollectivism:60 },
  { id:46, role:"teacher", tenure:"10+", gradeLevel:"high",       department:"humanities", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:62, riskTolerance:42, decisionSpeed:40, communicationStyle:60, individualismCollectivism:58 },
  { id:47, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low", parentLevel:null, departed:false, powerDistance:60, riskTolerance:44, decisionSpeed:36, communicationStyle:58, individualismCollectivism:64 },
  { id:48, role:"teacher", tenure:"10+", gradeLevel:"high",       department:"stem",       frictionLevel:"low", parentLevel:null, departed:false, powerDistance:63, riskTolerance:41, decisionSpeed:39, communicationStyle:57, individualismCollectivism:60 },
  { id:49, role:"teacher", tenure:"10+", gradeLevel:"middle",     department:"humanities", frictionLevel:"low", parentLevel:null, departed:false, powerDistance:62, riskTolerance:43, decisionSpeed:38, communicationStyle:59, individualismCollectivism:62 },
  { id:50, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low", parentLevel:null, departed:false, powerDistance:61, riskTolerance:42, decisionSpeed:37, communicationStyle:58, individualismCollectivism:63 },
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

// ─── Palette ──────────────────────────────────────────────────────────────────
const TEAL_PRIMARY   = "#1a7a7a";
const TEAL_LIGHT     = "#4db8b8";
const TEAL_MID       = "#2a9d8f";
const TEAL_NAVY      = "#264653";
const TEAL_SOFT      = "#52b5b5";

// ─── Dimension metadata ───────────────────────────────────────────────────────

type DimensionField = "powerDistance" | "riskTolerance" | "decisionSpeed" | "communicationStyle" | "individualismCollectivism";

const DIMENSIONS: { field: DimensionField; label: string; abbr: string; lowLabel: string; highLabel: string }[] = [
  { field: "powerDistance",            label: "Power Distance",      abbr: "PWR", lowLabel: "Egalitarian",   highLabel: "Hierarchical"  },
  { field: "riskTolerance",            label: "Risk Tolerance",      abbr: "RSK", lowLabel: "Risk-Averse",   highLabel: "Flexible"      },
  { field: "decisionSpeed",            label: "Decision Speed",      abbr: "DEC", lowLabel: "Deliberate",    highLabel: "Fast"          },
  { field: "communicationStyle",       label: "Communication Style", abbr: "COM", lowLabel: "Indirect",      highLabel: "Direct"        },
  { field: "individualismCollectivism",label: "Group vs Individual", abbr: "GRP", lowLabel: "Individualist", highLabel: "Group-Focused" },
];

interface DimensionGap {
  label: string;
  abbr: string;
  field: DimensionField;
  segmentScore: number;
  adminScore: number;
  gap: number;
  absGap: number;
  lowLabel: string;
  highLabel: string;
}

interface GapResult {
  id: string;
  label: string;
  role: string;
  tenure: string | null;
  gradeLevel: string | null;
  department: string | null;
  n: number;
  maxAbsGap: number;
  severity: "critical" | "watch" | "aligned";
  dimensionGaps: DimensionGap[];
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

const MIN_N = 5;
const CRITICAL_THRESHOLD = 35;
const WATCH_THRESHOLD = 20;

function computeGaps(): GapResult[] {
  const current = MOCK_RESPONDENTS.filter(r => !r.departed);
  const admins = current.filter(r => r.role === "admin");

  const adminAvgs: Record<DimensionField, number> = {} as Record<DimensionField, number>;
  for (const d of DIMENSIONS) {
    adminAvgs[d.field] = avg(admins.map(r => r[d.field] as number));
  }

  const nonAdmin = current.filter(r => r.role !== "admin");
  const groupMap = new Map<string, Respondent[]>();

  for (const r of nonAdmin) {
    const combos = [
      [r.role],
      [r.role, r.tenure ?? "none"],
      [r.role, r.gradeLevel ?? "none"],
      [r.role, r.department ?? "none"],
      [r.role, r.tenure ?? "none", r.gradeLevel ?? "none"],
      [r.role, r.tenure ?? "none", r.department ?? "none"],
      [r.role, r.gradeLevel ?? "none", r.department ?? "none"],
      [r.role, r.tenure ?? "none", r.gradeLevel ?? "none", r.department ?? "none"],
    ];
    for (const combo of combos) {
      const key = combo.join("|");
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(r);
    }
  }

  const results: GapResult[] = [];
  const seen = new Set<string>();
  const tenureLabel: Record<string, string> = { "0-2": "0–2 yrs", "3-5": "3–5 yrs", "6-10": "6–10 yrs", "10+": "10+ yrs" };
  const levelLabel: Record<string, string> = { elementary: "Elementary", middle: "Middle School", high: "High School" };
  const deptLabel: Record<string, string> = { humanities: "Humanities", stem: "STEM", "arts-pe": "Arts & PE" };
  const parentLevelLabel: Record<string, string> = { primary: "Primary", secondary: "Secondary", "high-school": "HS" };

  for (const [key, members] of groupMap.entries()) {
    if (seen.has(key) || members.length < MIN_N) continue;
    seen.add(key);

    const parts = key.split("|");
    const dimGaps: DimensionGap[] = DIMENSIONS.map(d => {
      const scores = members.map(r => r[d.field] as number);
      const segScore = avg(scores);
      const gap = segScore - adminAvgs[d.field];
      return { label: d.label, abbr: d.abbr, field: d.field, segmentScore: segScore, adminScore: adminAvgs[d.field], gap, absGap: Math.abs(gap), lowLabel: d.lowLabel, highLabel: d.highLabel };
    }).sort((a, b) => b.absGap - a.absGap);

    const maxAbsGap = dimGaps[0].absGap;
    const severity: "critical" | "watch" | "aligned" =
      maxAbsGap >= CRITICAL_THRESHOLD ? "critical" : maxAbsGap >= WATCH_THRESHOLD ? "watch" : "aligned";

    const role = parts[0] === "parent" ? "parent" : "teacher";
    const tenure = parts.find(p => ["0-2","3-5","6-10","10+"].includes(p)) ?? null;
    const gradeLevel = parts.find(p => ["elementary","middle","high"].includes(p)) ?? null;
    const department = parts.find(p => ["humanities","stem","arts-pe"].includes(p)) ?? null;
    const parentLevel = role === "parent" ? (members[0].parentLevel ?? null) : null;

    const labelParts: string[] = [];
    if (role === "parent") {
      labelParts.push(parentLevel ? `${parentLevelLabel[parentLevel]} Parents` : "Parents");
    } else {
      labelParts.push("Teachers");
    }
    if (tenure) labelParts.push(tenureLabel[tenure]);
    if (gradeLevel) labelParts.push(levelLabel[gradeLevel]);
    if (department) labelParts.push(deptLabel[department]);

    results.push({ id: key, label: labelParts.join(" · "), role, tenure, gradeLevel, department, n: members.length, maxAbsGap, severity, dimensionGaps: dimGaps });
  }

  return results;
}

// ─── Proportion bar ───────────────────────────────────────────────────────────

function ProportionBar({ misalignedHours, alignedHours }: { misalignedHours: number; alignedHours: number }) {
  const total = misalignedHours + alignedHours;
  const misalignedPct = total > 0 ? (misalignedHours / total) * 100 : 0;
  const alignedPct = 100 - misalignedPct;

  return (
    <div className="w-full">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Friction Distribution</p>
      <div className="flex h-8 rounded-lg overflow-hidden gap-px">
        <div className="flex items-center justify-center transition-all" style={{ width: `${misalignedPct}%`, background: TEAL_NAVY }}>
          {misalignedPct > 15 && <span className="text-[11px] font-bold text-white/90">{misalignedPct.toFixed(0)}%</span>}
        </div>
        <div className="flex items-center justify-center transition-all" style={{ width: `${alignedPct}%`, background: TEAL_SOFT }}>
          {alignedPct > 15 && <span className="text-[11px] font-bold text-white/90">{alignedPct.toFixed(0)}%</span>}
        </div>
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: TEAL_NAVY }} />
          Misaligned groups
        </span>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          Aligned groups
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: TEAL_SOFT }} />
        </span>
      </div>
    </div>
  );
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

function severityColor(severity: "critical" | "watch" | "aligned") {
  return severity === "critical" ? TEAL_NAVY : severity === "watch" ? TEAL_PRIMARY : TEAL_MID;
}

function gapColor(maxAbsGap: number) {
  return maxAbsGap >= 35 ? TEAL_NAVY : maxAbsGap >= 20 ? TEAL_PRIMARY : TEAL_MID;
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function CulturalPreferencesCostOfMisalignment() {
  const [filter, setFilter] = useState<"all" | "aligned">("all");
  const [sortKey, setSortKey] = useState<"friction" | "n" | "gap">("gap");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const allResults = useMemo(() => computeGaps(), []);

  function handleSort(key: "friction" | "n" | "gap") {
    if (sortKey === key) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const getFrictionHours = (r: GapResult) => Math.round(r.maxAbsGap * r.n * 0.1);

  const misaligned = allResults.filter(r => r.severity === "critical" || r.severity === "watch");
  const aligned    = allResults.filter(r => r.severity === "aligned");

  const misalignedFriction = misaligned.reduce((sum, r) => sum + getFrictionHours(r), 0);
  const alignedFriction    = aligned.reduce((sum, r) => sum + getFrictionHours(r), 0);
  const totalFriction      = misalignedFriction + alignedFriction;
  const criticalGroups     = allResults.filter(r => r.severity === "critical");
  const watchGroups        = allResults.filter(r => r.severity === "watch");
  const ratio              = alignedFriction > 0 ? (misalignedFriction / alignedFriction) : 0;

  const baseResults    = filter === "aligned" ? aligned : [...allResults];
  const displayResults = [...baseResults].sort((a, b) => {
    const aVal = sortKey === "friction" ? getFrictionHours(a) : sortKey === "n" ? a.n : a.maxAbsGap;
    const bVal = sortKey === "friction" ? getFrictionHours(b) : sortKey === "n" ? b.n : b.maxAbsGap;
    return sortDir === "desc" ? bVal - aVal : aVal - bVal;
  });

  const chartData = DIMENSIONS.map(d => {
    const misalignedHours = misaligned.filter(r => r.dimensionGaps[0].field === d.field).reduce((sum, r) => sum + getFrictionHours(r), 0);
    const alignedHours    = aligned.filter(r => r.dimensionGaps[0].field === d.field).reduce((sum, r) => sum + getFrictionHours(r), 0);
    return { name: d.abbr, fullName: d.label, misaligned: misalignedHours, aligned: alignedHours };
  });

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="w-full px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 flex items-start justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-1 text-muted-foreground">
              Cultural Impact Analysis
            </p>
            <h2 className="font-sans text-2xl font-semibold text-foreground leading-tight">
              Cost of Misalignment
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Estimated friction overhead from cultural gaps between groups and administration
            </p>
          </div>
          <div className="shrink-0 text-right rounded-xl px-5 py-4" style={{ background: TEAL_NAVY }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
              Friction multiplier
            </p>
            <p className="font-sans text-4xl font-bold mt-0.5" style={{ color: TEAL_LIGHT }}>
              {ratio.toFixed(1)}×
            </p>
            <p className="text-[11px] mt-0.5 text-white/50">
              misaligned vs. aligned
            </p>
          </div>
        </div>

        {/* ── Impact strip ── */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { label: "Total friction / mo",   value: `${totalFriction}h`,          sub: "across all groups",                                                                              color: "text-foreground" },
            { label: "Misaligned groups",      value: String(misaligned.length),    sub: `${criticalGroups.length} critical · ${watchGroups.length} watch`,                               color: "text-foreground" },
            { label: "Misaligned friction",    value: `${misalignedFriction}h`,     sub: `${totalFriction > 0 ? Math.round((misalignedFriction / totalFriction) * 100) : 0}% of total`,  color: "text-foreground" },
            { label: "Aligned groups",         value: String(aligned.length),       sub: `${alignedFriction}h friction / mo`,                                                             color: "text-foreground" },
          ].map((item, i) => (
            <div key={i} className="px-6 py-1" style={{ borderRight: i < 3 ? "1px solid hsl(var(--border))" : undefined }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1 text-muted-foreground">{item.label}</p>
              <p className="font-sans text-3xl font-bold leading-none" style={{ color: TEAL_PRIMARY }}>{item.value}</p>
              <p className="text-[11px] mt-1 text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Proportion bar + dimension chart ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6">
            <ProportionBar misalignedHours={misalignedFriction} alignedHours={alignedFriction} />
            <div className="pt-2 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">What this means</p>
              <p className="text-sm leading-relaxed text-foreground">
                Groups misaligned with administration accumulate{" "}
                <strong>{ratio.toFixed(1)}× more friction overhead</strong> per respondent than aligned cohorts — through
                unproductive deliberation, delayed decisions, and escalated conflict resolution.
              </p>
              <div className="flex items-start gap-2 rounded-lg p-3 border" style={{ background: `${TEAL_PRIMARY}08`, borderColor: `${TEAL_PRIMARY}30` }}>
                <TrendingDown className="h-4 w-4 mt-0.5 shrink-0" style={{ color: TEAL_PRIMARY }} />
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  Reducing the gap in the top {Math.min(3, criticalGroups.length)} critical groups by 50% could recover an estimated{" "}
                  <strong className="text-foreground">{Math.round(misalignedFriction * 0.35)}h/month</strong> in productive capacity.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border shadow-sm p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1 text-muted-foreground">Friction hours by dimension</p>
            <p className="text-[12px] mb-5 text-muted-foreground">Misaligned vs. aligned cohorts</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={14} barGap={4} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontFamily: "inherit", fontWeight: 600, fill: "hsl(var(--muted-foreground))" }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontFamily: "inherit", fontSize: "12px" }}
                    formatter={(value: number, name: string) => [`${value}h`, name === "misaligned" ? "Misaligned" : "Aligned"]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? label}
                  />
                  <Bar dataKey="misaligned" fill={TEAL_NAVY}  radius={[3, 3, 0, 0]} opacity={0.9} />
                  <Bar dataKey="aligned"    fill={TEAL_LIGHT} radius={[3, 3, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: TEAL_NAVY }} /> Misaligned
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: TEAL_LIGHT }} /> Aligned
              </span>
            </div>
          </div>
        </div>

        {/* ── Group ledger ── */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">

          {/* Ledger header */}
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: TEAL_NAVY }}>
            <div>
              <p className="font-sans text-sm font-semibold text-white">Group Friction Ledger</p>
              <p className="text-[11px] mt-0.5 text-white/50">{displayResults.length} groups · ranked by friction hours</p>
            </div>
            <div className="flex items-center gap-1">
              {(["all", "aligned"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1 rounded text-[11px] font-semibold transition-all capitalize"
                  style={{
                    background: filter === f ? "white" : "transparent",
                    color: filter === f ? TEAL_NAVY : "rgba(255,255,255,0.5)",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2.5 pl-5 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">#</th>
                <th className="py-2.5 px-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Group</th>
                {(["n", "friction", "gap"] as const).map(key => {
                  const labels: Record<string, string> = { n: "n", friction: "Friction / mo", gap: "Largest admin gap" };
                  const active = sortKey === key;
                  return (
                    <th
                      key={key}
                      className="py-2.5 px-3 text-right text-[10px] font-semibold uppercase tracking-widest cursor-pointer select-none whitespace-nowrap"
                      style={{ color: active ? TEAL_PRIMARY : "hsl(var(--muted-foreground))" }}
                      onClick={() => handleSort(key)}
                    >
                      {labels[key]} <span style={{ opacity: active ? 1 : 0.3 }}>{active && sortDir === "asc" ? "↑" : "↓"}</span>
                    </th>
                  );
                })}
                <th className="py-2.5 px-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">vs. Administration</th>
              </tr>
            </thead>
            <tbody>
              {displayResults.map((result, idx) => (
                <tr key={result.id} className="border-b border-border">
                  <td className="py-3 pl-5 pr-2">
                    <span className="text-[11px] font-bold tabular-nums text-muted-foreground w-5 inline-block text-right">{idx + 1}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: severityColor(result.severity) }} />
                      <span className="text-[13px] font-medium text-foreground">{result.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-[12px] tabular-nums text-muted-foreground">{result.n}</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: severityColor(result.severity) }}>
                      {getFrictionHours(result)}h
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: gapColor(result.maxAbsGap) }}>
                      {result.maxAbsGap} pts
                    </span>
                  </td>
                  <td className="py-1 px-2 pr-4" style={{ overflow: "visible" }}>
                    {(() => {
                      const color = severityColor(result.severity);
                      const radarData = result.dimensionGaps.map(dg => ({ dim: dg.abbr, segment: dg.segmentScore, admin: dg.adminScore }));
                      return (
                        <RadarChart width={160} height={120} data={radarData} margin={{ top: 6, right: 20, bottom: 6, left: 20 }}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="dim" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                          <Radar name="admin"   dataKey="admin"   stroke={TEAL_SOFT} fill={TEAL_SOFT} fillOpacity={0.2} strokeWidth={1.5} strokeDasharray="3 2" />
                          <Radar name="segment" dataKey="segment" stroke={color}     fill={color}     fillOpacity={0.18} strokeWidth={1.5} />
                          <Tooltip
                            position={{ x: 164, y: 10 }}
                            contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid hsl(var(--border))", padding: "4px 8px" }}
                            formatter={(v: number, name: string) => [v, name === "segment" ? "This group" : "Admin avg"]}
                          />
                        </RadarChart>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {displayResults.length === 0 && (
            <div className="py-12 text-center">
              <Check className="h-6 w-6 mx-auto mb-2" style={{ color: TEAL_MID }} />
              <p className="text-[13px] text-muted-foreground">No groups in this category.</p>
            </div>
          )}

          {/* Ledger footer */}
          <div className="px-5 py-3 flex items-center justify-between border-t border-border bg-[#f7f8fa]">
            <p className="text-[11px] text-muted-foreground">
              Friction hours = max gap × group size × 0.1. Gap pills show deviation from administration baseline.
            </p>
            <div className="flex items-center gap-4 shrink-0">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: TEAL_NAVY }} /> Critical ≥35 pts
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: TEAL_PRIMARY }} /> Watch ≥20 pts
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: TEAL_MID }} /> Aligned
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
