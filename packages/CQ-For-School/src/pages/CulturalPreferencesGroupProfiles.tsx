import { useState, useMemo } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown } from "lucide-react";

// ─── Types & data ─────────────────────────────────────────────────────────────

type Role = "admin" | "teacher" | "parent";
type Tenure = "0-2" | "3-5" | "6-10" | "10+";
type GradeLevel = "elementary" | "middle" | "high";
type Department = "humanities" | "stem" | "arts-pe" | "admin-support" | null;
type FrictionLevel = "high" | "low";
type ParentLevel = "primary" | "secondary" | "high-school" | null;
type Nationality = "American" | "British" | "Filipino" | "Indian" | "Lebanese" | "South African" | "Korean" | "Australian";

interface Respondent {
  id: number;
  role: Role;
  tenure: Tenure | null;
  gradeLevel: GradeLevel | null;
  department: Department;
  frictionLevel: FrictionLevel;
  parentLevel: ParentLevel;
  nationality: Nationality;
  departed: boolean;
  powerDistance: number;
  riskTolerance: number;
  decisionSpeed: number;
  communicationStyle: number;
  individualismCollectivism: number;
}

const MOCK_RESPONDENTS: Respondent[] = [
  // ── Administration (8) ────────────────────────────────────────────────────
  { id:1,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"American",     departed:false, powerDistance:78, riskTolerance:32, decisionSpeed:25, communicationStyle:44, individualismCollectivism:72 },
  { id:2,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"American",     departed:false, powerDistance:72, riskTolerance:38, decisionSpeed:28, communicationStyle:50, individualismCollectivism:65 },
  { id:3,  role:"admin", tenure:"6-10", gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"British",      departed:false, powerDistance:70, riskTolerance:40, decisionSpeed:32, communicationStyle:48, individualismCollectivism:70 },
  { id:4,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"American",     departed:false, powerDistance:76, riskTolerance:35, decisionSpeed:30, communicationStyle:52, individualismCollectivism:68 },
  { id:5,  role:"admin", tenure:"6-10", gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"Australian",   departed:false, powerDistance:74, riskTolerance:36, decisionSpeed:34, communicationStyle:46, individualismCollectivism:66 },
  { id:6,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"American",     departed:false, powerDistance:80, riskTolerance:30, decisionSpeed:28, communicationStyle:45, individualismCollectivism:74 },
  { id:7,  role:"admin", tenure:"3-5",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"British",      departed:false, powerDistance:68, riskTolerance:42, decisionSpeed:35, communicationStyle:55, individualismCollectivism:62 },
  { id:8,  role:"admin", tenure:"6-10", gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"American",     departed:false, powerDistance:72, riskTolerance:34, decisionSpeed:28, communicationStyle:44, individualismCollectivism:70 },
  // ── Teachers: 0–2 yrs ────────────────────────────────────────────────────
  { id:9,  role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"humanities", frictionLevel:"high", parentLevel:null, nationality:"Filipino",     departed:false, powerDistance:22, riskTolerance:72, decisionSpeed:70, communicationStyle:80, individualismCollectivism:30 },
  { id:10, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"stem",       frictionLevel:"high", parentLevel:null, nationality:"Indian",       departed:false, powerDistance:28, riskTolerance:68, decisionSpeed:72, communicationStyle:76, individualismCollectivism:34 },
  { id:11, role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"stem",       frictionLevel:"high", parentLevel:null, nationality:"Filipino",     departed:false, powerDistance:25, riskTolerance:75, decisionSpeed:65, communicationStyle:82, individualismCollectivism:38 },
  { id:12, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"humanities", frictionLevel:"high", parentLevel:null, nationality:"Lebanese",     departed:false, powerDistance:30, riskTolerance:70, decisionSpeed:68, communicationStyle:78, individualismCollectivism:35 },
  { id:13, role:"teacher", tenure:"0-2", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low",  parentLevel:null, nationality:"South African", departed:false, powerDistance:26, riskTolerance:74, decisionSpeed:66, communicationStyle:76, individualismCollectivism:40 },
  { id:14, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"stem",       frictionLevel:"high", parentLevel:null, nationality:"Indian",       departed:false, powerDistance:32, riskTolerance:66, decisionSpeed:70, communicationStyle:80, individualismCollectivism:32 },
  { id:15, role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"Filipino",     departed:false, powerDistance:28, riskTolerance:70, decisionSpeed:68, communicationStyle:74, individualismCollectivism:38 },
  { id:16, role:"teacher", tenure:"0-2", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low",  parentLevel:null, nationality:"Korean",       departed:false, powerDistance:24, riskTolerance:72, decisionSpeed:64, communicationStyle:78, individualismCollectivism:36 },
  { id:17, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"humanities", frictionLevel:"high", parentLevel:null, nationality:"Lebanese",     departed:false, powerDistance:30, riskTolerance:68, decisionSpeed:72, communicationStyle:80, individualismCollectivism:34 },
  { id:18, role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"stem",       frictionLevel:"low",  parentLevel:null, nationality:"Indian",       departed:false, powerDistance:26, riskTolerance:73, decisionSpeed:67, communicationStyle:76, individualismCollectivism:40 },
  { id:19, role:"teacher", tenure:"0-2", gradeLevel:"elementary", department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"Filipino",     departed:false, powerDistance:29, riskTolerance:69, decisionSpeed:65, communicationStyle:78, individualismCollectivism:38 },
  // ── Teachers: 3–5 yrs ────────────────────────────────────────────────────
  { id:20, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"American",     departed:false, powerDistance:38, riskTolerance:65, decisionSpeed:55, communicationStyle:76, individualismCollectivism:45 },
  { id:21, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"stem",       frictionLevel:"low",  parentLevel:null, nationality:"Indian",       departed:false, powerDistance:42, riskTolerance:62, decisionSpeed:58, communicationStyle:74, individualismCollectivism:50 },
  { id:22, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"arts-pe",    frictionLevel:"high", parentLevel:null, nationality:"South African", departed:false, powerDistance:40, riskTolerance:60, decisionSpeed:56, communicationStyle:72, individualismCollectivism:48 },
  { id:23, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"stem",       frictionLevel:"low",  parentLevel:null, nationality:"Filipino",     departed:false, powerDistance:44, riskTolerance:64, decisionSpeed:60, communicationStyle:76, individualismCollectivism:46 },
  { id:24, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"Lebanese",     departed:false, powerDistance:39, riskTolerance:63, decisionSpeed:57, communicationStyle:75, individualismCollectivism:49 },
  { id:25, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"stem",       frictionLevel:"high", parentLevel:null, nationality:"Korean",       departed:false, powerDistance:45, riskTolerance:65, decisionSpeed:62, communicationStyle:73, individualismCollectivism:47 },
  { id:26, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low",  parentLevel:null, nationality:"British",      departed:false, powerDistance:41, riskTolerance:61, decisionSpeed:55, communicationStyle:74, individualismCollectivism:52 },
  { id:27, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"Filipino",     departed:false, powerDistance:43, riskTolerance:63, decisionSpeed:58, communicationStyle:73, individualismCollectivism:48 },
  { id:28, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"stem",       frictionLevel:"low",  parentLevel:null, nationality:"Indian",       departed:false, powerDistance:40, riskTolerance:62, decisionSpeed:56, communicationStyle:75, individualismCollectivism:46 },
  { id:29, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"American",     departed:false, powerDistance:42, riskTolerance:64, decisionSpeed:59, communicationStyle:74, individualismCollectivism:50 },
  { id:30, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"arts-pe",    frictionLevel:"high", parentLevel:null, nationality:"South African", departed:false, powerDistance:38, riskTolerance:66, decisionSpeed:57, communicationStyle:72, individualismCollectivism:47 },
  { id:31, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"Lebanese",     departed:false, powerDistance:41, riskTolerance:60, decisionSpeed:55, communicationStyle:76, individualismCollectivism:49 },
  { id:32, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"stem",       frictionLevel:"low",  parentLevel:null, nationality:"Korean",       departed:false, powerDistance:43, riskTolerance:63, decisionSpeed:58, communicationStyle:74, individualismCollectivism:48 },
  { id:33, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"arts-pe",    frictionLevel:"low",  parentLevel:null, nationality:"Filipino",     departed:false, powerDistance:40, riskTolerance:62, decisionSpeed:56, communicationStyle:73, individualismCollectivism:50 },
  // ── Teachers: 6–10 yrs ───────────────────────────────────────────────────
  { id:34, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"British",      departed:false, powerDistance:48, riskTolerance:57, decisionSpeed:44, communicationStyle:66, individualismCollectivism:54 },
  { id:35, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"stem",       frictionLevel:"low", parentLevel:null, nationality:"Indian",       departed:false, powerDistance:52, riskTolerance:54, decisionSpeed:47, communicationStyle:64, individualismCollectivism:50 },
  { id:36, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"arts-pe",    frictionLevel:"low", parentLevel:null, nationality:"South African", departed:false, powerDistance:50, riskTolerance:56, decisionSpeed:45, communicationStyle:65, individualismCollectivism:52 },
  { id:37, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"stem",       frictionLevel:"low", parentLevel:null, nationality:"Filipino",     departed:false, powerDistance:49, riskTolerance:55, decisionSpeed:46, communicationStyle:67, individualismCollectivism:53 },
  { id:38, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"Lebanese",     departed:false, powerDistance:51, riskTolerance:53, decisionSpeed:44, communicationStyle:63, individualismCollectivism:51 },
  { id:39, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"American",     departed:false, powerDistance:50, riskTolerance:56, decisionSpeed:46, communicationStyle:66, individualismCollectivism:52 },
  { id:40, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low", parentLevel:null, nationality:"Korean",       departed:false, powerDistance:48, riskTolerance:58, decisionSpeed:45, communicationStyle:64, individualismCollectivism:54 },
  { id:41, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"stem",       frictionLevel:"low", parentLevel:null, nationality:"Indian",       departed:false, powerDistance:52, riskTolerance:54, decisionSpeed:46, communicationStyle:65, individualismCollectivism:50 },
  { id:42, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"Filipino",     departed:false, powerDistance:50, riskTolerance:55, decisionSpeed:44, communicationStyle:67, individualismCollectivism:53 },
  { id:43, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"stem",       frictionLevel:"low", parentLevel:null, nationality:"Australian",   departed:false, powerDistance:49, riskTolerance:57, decisionSpeed:47, communicationStyle:65, individualismCollectivism:51 },
  // ── Teachers: 10+ yrs ────────────────────────────────────────────────────
  { id:44, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"American",     departed:false, powerDistance:60, riskTolerance:44, decisionSpeed:36, communicationStyle:58, individualismCollectivism:62 },
  { id:45, role:"teacher", tenure:"10+", gradeLevel:"middle",     department:"stem",       frictionLevel:"low", parentLevel:null, nationality:"British",      departed:false, powerDistance:64, riskTolerance:40, decisionSpeed:38, communicationStyle:56, individualismCollectivism:60 },
  { id:46, role:"teacher", tenure:"10+", gradeLevel:"high",       department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"Lebanese",     departed:false, powerDistance:62, riskTolerance:42, decisionSpeed:40, communicationStyle:60, individualismCollectivism:58 },
  { id:47, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low", parentLevel:null, nationality:"Filipino",     departed:false, powerDistance:60, riskTolerance:44, decisionSpeed:36, communicationStyle:58, individualismCollectivism:64 },
  { id:48, role:"teacher", tenure:"10+", gradeLevel:"high",       department:"stem",       frictionLevel:"low", parentLevel:null, nationality:"Indian",       departed:false, powerDistance:63, riskTolerance:41, decisionSpeed:39, communicationStyle:57, individualismCollectivism:60 },
  { id:49, role:"teacher", tenure:"10+", gradeLevel:"middle",     department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"South African", departed:false, powerDistance:62, riskTolerance:43, decisionSpeed:38, communicationStyle:59, individualismCollectivism:62 },
  { id:50, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low", parentLevel:null, nationality:"Korean",       departed:false, powerDistance:61, riskTolerance:42, decisionSpeed:37, communicationStyle:58, individualismCollectivism:63 },
  // ── Parents ───────────────────────────────────────────────────────────────
  { id:51, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"American",     departed:false, powerDistance:60, riskTolerance:38, decisionSpeed:30, communicationStyle:42, individualismCollectivism:74 },
  { id:52, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"Lebanese",     departed:false, powerDistance:56, riskTolerance:42, decisionSpeed:34, communicationStyle:46, individualismCollectivism:70 },
  { id:53, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"Filipino",     departed:false, powerDistance:58, riskTolerance:40, decisionSpeed:32, communicationStyle:44, individualismCollectivism:72 },
  { id:54, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"Indian",       departed:false, powerDistance:62, riskTolerance:36, decisionSpeed:28, communicationStyle:40, individualismCollectivism:76 },
  { id:55, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"Lebanese",     departed:false, powerDistance:58, riskTolerance:40, decisionSpeed:32, communicationStyle:44, individualismCollectivism:72 },
  { id:56, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"American",     departed:false, powerDistance:60, riskTolerance:38, decisionSpeed:30, communicationStyle:42, individualismCollectivism:74 },
  { id:57, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"Filipino",     departed:false, powerDistance:56, riskTolerance:42, decisionSpeed:34, communicationStyle:46, individualismCollectivism:70 },
  { id:65, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   nationality:"Indian",       departed:false, powerDistance:54, riskTolerance:46, decisionSpeed:38, communicationStyle:50, individualismCollectivism:66 },
  { id:66, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   nationality:"South African", departed:false, powerDistance:56, riskTolerance:44, decisionSpeed:36, communicationStyle:48, individualismCollectivism:68 },
  { id:67, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   nationality:"Lebanese",     departed:false, powerDistance:52, riskTolerance:48, decisionSpeed:40, communicationStyle:52, individualismCollectivism:64 },
  { id:68, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   nationality:"Korean",       departed:false, powerDistance:55, riskTolerance:45, decisionSpeed:37, communicationStyle:49, individualismCollectivism:67 },
  { id:75, role:"parent", tenure:null, gradeLevel:"high",       department:null, frictionLevel:"low", parentLevel:"high-school", nationality:"American",     departed:false, powerDistance:52, riskTolerance:50, decisionSpeed:42, communicationStyle:54, individualismCollectivism:62 },
  { id:76, role:"parent", tenure:null, gradeLevel:"high",       department:null, frictionLevel:"low", parentLevel:"high-school", nationality:"Filipino",     departed:false, powerDistance:54, riskTolerance:48, decisionSpeed:40, communicationStyle:52, individualismCollectivism:64 },
  { id:77, role:"parent", tenure:null, gradeLevel:"high",       department:null, frictionLevel:"low", parentLevel:"high-school", nationality:"British",      departed:false, powerDistance:50, riskTolerance:52, decisionSpeed:44, communicationStyle:56, individualismCollectivism:60 },
];

// ─── Dimension config ─────────────────────────────────────────────────────────

const DIMENSIONS = [
  { field: "powerDistance",             label: "Power Distance",      lowLabel: "Egalitarian",  highLabel: "Hierarchical", tooltip: "How comfortable this group is with formal authority and hierarchy vs. flat, collaborative structures." },
  { field: "riskTolerance",             label: "Risk Tolerance",      lowLabel: "Risk-Averse",  highLabel: "Flexible",     tooltip: "Whether this group prefers predictable, proven approaches or is open to experimentation and change." },
  { field: "decisionSpeed",             label: "Decision Speed",      lowLabel: "Deliberate",   highLabel: "Fast",         tooltip: "Whether this group tends to deliberate carefully before acting, or prefers quick, adaptive decisions." },
  { field: "communicationStyle",        label: "Communication Style", lowLabel: "Indirect",     highLabel: "Direct",       tooltip: "Whether this group communicates with subtlety and context, or values direct, explicit expression." },
  { field: "individualismCollectivism", label: "Group vs Individual", lowLabel: "Individual",   highLabel: "Group-Focused",tooltip: "Whether this group prioritizes individual autonomy and goals, or shared identity and collective outcomes." },
] as const;

// ─── Group logic ──────────────────────────────────────────────────────────────

type GroupBy = "role+tenure" | "role+gradeLevel" | "role+department" | "nationality";

function getGroupKey(r: Respondent, groupBy: GroupBy): string | null {
  if (groupBy === "role+tenure") {
    if (r.role === "teacher" || r.role === "admin") return `${r.role} · ${r.tenure ?? "?"}`;
    return null;
  }
  if (groupBy === "role+gradeLevel") {
    if (r.gradeLevel) return `${r.role} · ${r.gradeLevel}`;
    return null;
  }
  if (groupBy === "role+department") {
    if (r.department) return `${r.role} · ${r.department}`;
    return null;
  }
  if (groupBy === "nationality") {
    return r.nationality;
  }
  return null;
}

// ─── Spread strip component ───────────────────────────────────────────────────

function SpreadStrip({
  scores,
  avg,
  spread,
  dimLabel,
  tooltip,
  lowLabel,
  highLabel,
}: {
  scores: number[];
  avg: number;
  spread: number;
  dimLabel: string;
  tooltip?: string;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground/80" title={tooltip}>{dimLabel}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">avg {avg}</span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {spread}pt
          </span>
        </div>
      </div>

      <div className="relative h-6 bg-background rounded border border-border/40 overflow-visible mb-1">
        {scores.length > 1 && (
          <div
            className="absolute top-0 bottom-0 bg-primary/15 rounded"
            style={{
              left: `${Math.min(...scores)}%`,
              width: `${Math.max(...scores) - Math.min(...scores)}%`,
            }}
          />
        )}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary"
          style={{ left: `${avg}%` }}
        />
        {scores.map((s, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-foreground/60 border-2 border-background shadow-sm"
            style={{ left: `calc(${s}% - 5px)` }}
            title={`Score: ${s}`}
          />
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CulturalPreferencesGroupProfiles() {
  const [groupBy, setGroupBy] = useState<GroupBy>("role+tenure");
  const [sortBy, setSortBy] = useState<"widest" | "alpha">("widest");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [tab, setTab] = useState<"role+tenure" | "role+gradeLevel" | "role+department" | "nationality" | "most-diverse" | "least-diverse">("role+tenure");

  // One row per group across all groupBys, with all dimension stats, ranked by avg spread
  const allGroupRows = useMemo(() => {
    const ALL_GROUP_BYS: GroupBy[] = ["role+tenure", "role+gradeLevel", "role+department", "nationality"];
    const GROUP_BY_LABELS: Record<GroupBy, string> = {
      "role+tenure": "Tenure",
      "role+gradeLevel": "School Level",
      "role+department": "Department",
      "nationality": "Nationality",
    };
    const rows: {
      groupLabel: string;
      groupBy: GroupBy;
      groupByLabel: string;
      memberCount: number;
      dimStats: ((typeof DIMENSIONS)[number] & { scores: number[]; avg: number; spread: number })[];
      avgSpread: number;
    }[] = [];
    for (const gb of ALL_GROUP_BYS) {
      const map = new Map<string, Respondent[]>();
      for (const r of MOCK_RESPONDENTS) {
        if (r.departed) continue;
        const key = getGroupKey(r, gb);
        if (!key) continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r);
      }
      for (const [label, members] of map.entries()) {
        const dimStats = DIMENSIONS.map((d) => {
          const scores = members.map((m) => m[d.field]);
          const spread = Math.max(...scores) - Math.min(...scores);
          const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          return { ...d, scores, avg, spread };
        });
        const avgSpread = Math.round(dimStats.reduce((s, d) => s + d.spread, 0) / dimStats.length);
        rows.push({ groupLabel: label, groupBy: gb, groupByLabel: GROUP_BY_LABELS[gb], memberCount: members.length, dimStats, avgSpread });
      }
    }
    return rows;
  }, []);

  const TOP_N = 15;
  const eligibleGroupRows = useMemo(() => allGroupRows.filter(r => r.memberCount >= 5), [allGroupRows]);
  const mostDiverse  = useMemo(() => [...eligibleGroupRows].sort((a, b) => b.avgSpread - a.avgSpread).slice(0, TOP_N), [eligibleGroupRows]);
  const leastDiverse = useMemo(() => [...eligibleGroupRows].sort((a, b) => a.avgSpread - b.avgSpread).slice(0, TOP_N), [eligibleGroupRows]);

  // Build groups for the explorer tabs
  const groups = useMemo(() => {
    const map = new Map<string, Respondent[]>();
    for (const r of MOCK_RESPONDENTS) {
      if (r.departed) continue;
      const key = getGroupKey(r, groupBy);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).map(([label, members]) => {
      const dimStats = DIMENSIONS.map((d) => {
        const scores = members.map((m) => m[d.field]);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const spread = Math.max(...scores) - Math.min(...scores);
        return { ...d, scores, avg, spread };
      });
      const maxSpread = Math.max(...dimStats.map((d) => d.spread));
      return { label, members, dimStats, maxSpread };
    });
  }, [groupBy]);

  const sorted = useMemo(() => {
    const copy = [...groups];
    if (sortBy === "widest") copy.sort((a, b) => b.maxSpread - a.maxSpread);
    else copy.sort((a, b) => a.label.localeCompare(b.label));
    return copy;
  }, [groups, sortBy]);

  const detail = useMemo(
    () => sorted.find((g) => g.label === selectedGroup) ?? sorted[0] ?? null,
    [sorted, selectedGroup]
  );

  const isExplorerTab = tab === "role+tenure" || tab === "role+gradeLevel" || tab === "role+department" || tab === "nationality";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold font-sans text-foreground">Group Breakdown</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          See how spread out individual scores are within each group. A wider spread means more
          diverse perspectives — a narrower spread means the group thinks more uniformly.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-0 border-b border-border/50">
        {([
          { value: "role+tenure",      label: "By Tenure" },
          { value: "role+gradeLevel",  label: "By School Level" },
          { value: "role+department",  label: "By Department" },
          { value: "nationality",      label: "By Nationality" },
        ] as const).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setTab(value); setGroupBy(value); setSelectedGroup(null); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setTab("most-diverse")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            tab === "most-diverse"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Most Diverse
        </button>
        <button
          onClick={() => setTab("least-diverse")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            tab === "least-diverse"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          Least Diverse
        </button>
      </div>

      {/* ── Most / Least Diverse tabs ── */}
      {(tab === "most-diverse" || tab === "least-diverse") && (() => {
        const rows = tab === "most-diverse" ? mostDiverse : leastDiverse;
        const isMost = tab === "most-diverse";
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isMost
                ? `Top ${TOP_N} groups with the widest range of perspectives across all cultural dimensions. Groups with fewer than 5 members are excluded.`
                : `Top ${TOP_N} groups with the most uniform perspectives across all dimensions. Groups with fewer than 5 members are excluded.`}
            </p>
            <div className="space-y-4">
              {rows.map((row, i) => {
                return (
                  <div
                    key={`${row.groupLabel}-${row.groupBy}`}
                    className="rounded-xl border border-border/50 bg-card hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => { setTab(row.groupBy); setGroupBy(row.groupBy); setSelectedGroup(row.groupLabel); }}
                  >
                    {/* Card header — avgSpread leads left, group name is secondary */}
                    <div className="flex items-center gap-4 px-5 py-3.5 rounded-t-xl border-b border-border/40 bg-muted/30">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-background text-muted-foreground border border-border/60 shrink-0 tabular-nums">
                        {i + 1}
                      </span>
                      <div className="flex items-baseline gap-2 shrink-0">
                        <span className="text-3xl font-bold tabular-nums text-primary leading-none">
                          {row.avgSpread}
                        </span>
                        <span className="text-xs text-muted-foreground">pt avg spread</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-foreground capitalize block truncate">{row.groupLabel}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground bg-background rounded px-1.5 py-0.5 border border-border/60">{row.groupByLabel}</span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />{row.memberCount}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setTab(row.groupBy); setGroupBy(row.groupBy); setSelectedGroup(row.groupLabel); }}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors shrink-0"
                      >
                        Explore
                      </button>
                    </div>

                    {/* Dimension bars */}
                    <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {row.dimStats.map((d) => (
                        <div key={d.field}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-foreground/70">{d.label}</span>
                            <span className="text-xs font-bold tabular-nums text-muted-foreground">
                              {d.spread}pt
                            </span>
                          </div>
                          <div className="relative h-7 bg-muted/40 rounded overflow-visible border border-border/50">
                            {/* Range fill */}
                            <div
                              className="absolute top-0 bottom-0 rounded bg-primary/20"
                              style={{
                                left: `${Math.min(...d.scores)}%`,
                                width: `${d.spread}%`,
                              }}
                            />
                            {/* Avg line */}
                            <div className="absolute top-0 bottom-0 w-0.5 bg-primary" style={{ left: `${d.avg}%` }} />
                            {/* Individual dots */}
                            {d.scores.map((s, si) => (
                              <div
                                key={si}
                                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-foreground/70 border-2 border-background shadow-sm"
                                style={{ left: `calc(${s}% - 5px)` }}
                                title={`Score: ${s}`}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>{d.lowLabel}</span>
                            <span className="tabular-nums">avg {d.avg}</span>
                            <span>{d.highLabel}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Group Explorer tabs ── */}
      {isExplorerTab && <>
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Sort by</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "widest" | "alpha")}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="widest">Widest spread first</SelectItem>
                <SelectItem value="alpha">A → Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {sorted.length} groups · {MOCK_RESPONDENTS.filter((r) => !r.departed).length} respondents
          </span>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">

          {/* Left: group list */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
              Groups
            </p>
            {sorted.map((g) => {
              const isActive = g.label === (detail?.label ?? "");
              return (
                <button
                  key={g.label}
                  onClick={() => setSelectedGroup(g.label)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 border transition-all ${
                    isActive
                      ? "bg-primary/5 border-primary/40 shadow-sm"
                      : "bg-card border-border/50 hover:bg-muted/40 hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground capitalize leading-tight">
                      {g.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                      <Users className="w-3 h-3" />{g.members.length}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isActive ? "bg-primary/60" : "bg-muted-foreground/30"}`}
                        style={{ width: `${g.maxSpread}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-6 text-right tabular-nums">{g.maxSpread}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: detail panel */}
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground capitalize">{detail.label}</h2>
                  <p className="text-sm text-muted-foreground">
                    {detail.members.length} {detail.members.length === 1 ? "person" : "people"} in this group
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-medium">
                  Max spread: {detail.maxSpread} pts
                </Badge>
              </div>

              {/* Callout: widest dimension */}
              {(() => {
                const widest = [...detail.dimStats].sort((a, b) => b.spread - a.spread)[0];
                return widest.spread >= 20 ? (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-foreground">
                    <span className="font-semibold">{widest.label}</span> shows the most diversity in
                    this group ({widest.spread} pts) — members hold a broad range of views here.
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3 text-sm text-muted-foreground">
                    This group is relatively uniform — no dimension has a spread wider than 20 points.
                  </div>
                );
              })()}

              {/* Dimension strips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detail.dimStats
                  .slice()
                  .sort((a, b) => b.spread - a.spread)
                  .map((d) => (
                    <SpreadStrip
                      key={d.field}
                      scores={d.scores}
                      avg={d.avg}
                      spread={d.spread}
                      dimLabel={d.label}
                      tooltip={d.tooltip}
                      lowLabel={d.lowLabel}
                      highLabel={d.highLabel}
                    />
                  ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-foreground/60 border-2 border-background shadow-sm" />
                  Individual score
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-0.5 h-4 bg-primary" />
                  Group average
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-6 h-3 bg-primary/15 rounded border border-primary/20" />
                  Score range
                </span>
              </div>
            </div>
          )}
        </div>
      </>}
    </div>
  );
}
