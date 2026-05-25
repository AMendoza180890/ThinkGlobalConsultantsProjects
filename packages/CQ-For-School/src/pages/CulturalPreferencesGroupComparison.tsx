import { useState, useMemo } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, Users } from "lucide-react";

// ─── Types & shared data ──────────────────────────────────────────────────────

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
  { id:1,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"American",      departed:false, powerDistance:78, riskTolerance:32, decisionSpeed:25, communicationStyle:44, individualismCollectivism:72 },
  { id:2,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"American",      departed:false, powerDistance:72, riskTolerance:38, decisionSpeed:28, communicationStyle:50, individualismCollectivism:65 },
  { id:3,  role:"admin", tenure:"6-10", gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"British",       departed:false, powerDistance:70, riskTolerance:40, decisionSpeed:32, communicationStyle:48, individualismCollectivism:70 },
  { id:4,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"American",      departed:false, powerDistance:76, riskTolerance:35, decisionSpeed:30, communicationStyle:52, individualismCollectivism:68 },
  { id:5,  role:"admin", tenure:"6-10", gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"Australian",    departed:false, powerDistance:74, riskTolerance:36, decisionSpeed:34, communicationStyle:46, individualismCollectivism:66 },
  { id:6,  role:"admin", tenure:"10+",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"American",      departed:false, powerDistance:80, riskTolerance:30, decisionSpeed:28, communicationStyle:45, individualismCollectivism:74 },
  { id:7,  role:"admin", tenure:"3-5",  gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"British",       departed:false, powerDistance:68, riskTolerance:42, decisionSpeed:35, communicationStyle:55, individualismCollectivism:62 },
  { id:8,  role:"admin", tenure:"6-10", gradeLevel:null, department:"admin-support", frictionLevel:"low", parentLevel:null, nationality:"American",      departed:false, powerDistance:72, riskTolerance:34, decisionSpeed:28, communicationStyle:44, individualismCollectivism:70 },
  { id:9,  role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"humanities", frictionLevel:"high", parentLevel:null, nationality:"Filipino",      departed:false, powerDistance:22, riskTolerance:72, decisionSpeed:70, communicationStyle:80, individualismCollectivism:30 },
  { id:10, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"stem",       frictionLevel:"high", parentLevel:null, nationality:"Indian",        departed:false, powerDistance:28, riskTolerance:68, decisionSpeed:72, communicationStyle:76, individualismCollectivism:34 },
  { id:11, role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"stem",       frictionLevel:"high", parentLevel:null, nationality:"Filipino",      departed:false, powerDistance:25, riskTolerance:75, decisionSpeed:65, communicationStyle:82, individualismCollectivism:38 },
  { id:12, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"humanities", frictionLevel:"high", parentLevel:null, nationality:"Lebanese",      departed:false, powerDistance:30, riskTolerance:70, decisionSpeed:68, communicationStyle:78, individualismCollectivism:35 },
  { id:13, role:"teacher", tenure:"0-2", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low",  parentLevel:null, nationality:"South African", departed:false, powerDistance:26, riskTolerance:74, decisionSpeed:66, communicationStyle:76, individualismCollectivism:40 },
  { id:14, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"stem",       frictionLevel:"high", parentLevel:null, nationality:"Indian",        departed:false, powerDistance:32, riskTolerance:66, decisionSpeed:70, communicationStyle:80, individualismCollectivism:32 },
  { id:15, role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, powerDistance:28, riskTolerance:70, decisionSpeed:68, communicationStyle:74, individualismCollectivism:38 },
  { id:16, role:"teacher", tenure:"0-2", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low",  parentLevel:null, nationality:"Korean",        departed:false, powerDistance:24, riskTolerance:72, decisionSpeed:64, communicationStyle:78, individualismCollectivism:36 },
  { id:17, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"humanities", frictionLevel:"high", parentLevel:null, nationality:"Lebanese",      departed:false, powerDistance:30, riskTolerance:68, decisionSpeed:72, communicationStyle:80, individualismCollectivism:34 },
  { id:18, role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"stem",       frictionLevel:"low",  parentLevel:null, nationality:"Indian",        departed:false, powerDistance:26, riskTolerance:73, decisionSpeed:67, communicationStyle:76, individualismCollectivism:40 },
  { id:19, role:"teacher", tenure:"0-2", gradeLevel:"elementary", department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, powerDistance:29, riskTolerance:69, decisionSpeed:65, communicationStyle:78, individualismCollectivism:38 },
  { id:20, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, powerDistance:38, riskTolerance:65, decisionSpeed:55, communicationStyle:76, individualismCollectivism:45 },
  { id:21, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"stem",       frictionLevel:"low",  parentLevel:null, nationality:"Indian",        departed:false, powerDistance:42, riskTolerance:62, decisionSpeed:58, communicationStyle:74, individualismCollectivism:50 },
  { id:22, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"arts-pe",    frictionLevel:"high", parentLevel:null, nationality:"South African", departed:false, powerDistance:40, riskTolerance:60, decisionSpeed:56, communicationStyle:72, individualismCollectivism:48 },
  { id:23, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"stem",       frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, powerDistance:44, riskTolerance:64, decisionSpeed:60, communicationStyle:76, individualismCollectivism:46 },
  { id:24, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"Lebanese",      departed:false, powerDistance:39, riskTolerance:63, decisionSpeed:57, communicationStyle:75, individualismCollectivism:49 },
  { id:25, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"stem",       frictionLevel:"high", parentLevel:null, nationality:"Korean",        departed:false, powerDistance:45, riskTolerance:65, decisionSpeed:62, communicationStyle:73, individualismCollectivism:47 },
  { id:26, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low",  parentLevel:null, nationality:"British",       departed:false, powerDistance:41, riskTolerance:61, decisionSpeed:55, communicationStyle:74, individualismCollectivism:52 },
  { id:27, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, powerDistance:43, riskTolerance:63, decisionSpeed:58, communicationStyle:73, individualismCollectivism:48 },
  { id:28, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"stem",       frictionLevel:"low",  parentLevel:null, nationality:"Indian",        departed:false, powerDistance:40, riskTolerance:62, decisionSpeed:56, communicationStyle:75, individualismCollectivism:46 },
  { id:29, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, powerDistance:42, riskTolerance:64, decisionSpeed:59, communicationStyle:74, individualismCollectivism:50 },
  { id:30, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"arts-pe",    frictionLevel:"high", parentLevel:null, nationality:"South African", departed:false, powerDistance:38, riskTolerance:66, decisionSpeed:57, communicationStyle:72, individualismCollectivism:47 },
  { id:31, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"humanities", frictionLevel:"low",  parentLevel:null, nationality:"Lebanese",      departed:false, powerDistance:41, riskTolerance:60, decisionSpeed:55, communicationStyle:76, individualismCollectivism:49 },
  { id:32, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"stem",       frictionLevel:"low",  parentLevel:null, nationality:"Korean",        departed:false, powerDistance:43, riskTolerance:63, decisionSpeed:58, communicationStyle:74, individualismCollectivism:48 },
  { id:33, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"arts-pe",    frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, powerDistance:40, riskTolerance:62, decisionSpeed:56, communicationStyle:73, individualismCollectivism:50 },
  { id:34, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"British",       departed:false, powerDistance:48, riskTolerance:57, decisionSpeed:44, communicationStyle:66, individualismCollectivism:54 },
  { id:35, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"stem",       frictionLevel:"low", parentLevel:null, nationality:"Indian",        departed:false, powerDistance:52, riskTolerance:54, decisionSpeed:47, communicationStyle:64, individualismCollectivism:50 },
  { id:36, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"arts-pe",    frictionLevel:"low", parentLevel:null, nationality:"South African", departed:false, powerDistance:50, riskTolerance:56, decisionSpeed:45, communicationStyle:65, individualismCollectivism:52 },
  { id:37, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"stem",       frictionLevel:"low", parentLevel:null, nationality:"Filipino",      departed:false, powerDistance:49, riskTolerance:55, decisionSpeed:46, communicationStyle:67, individualismCollectivism:53 },
  { id:38, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"Lebanese",      departed:false, powerDistance:51, riskTolerance:53, decisionSpeed:44, communicationStyle:63, individualismCollectivism:51 },
  { id:39, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"American",      departed:false, powerDistance:50, riskTolerance:56, decisionSpeed:46, communicationStyle:66, individualismCollectivism:52 },
  { id:40, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low", parentLevel:null, nationality:"Korean",        departed:false, powerDistance:48, riskTolerance:58, decisionSpeed:45, communicationStyle:64, individualismCollectivism:54 },
  { id:41, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"stem",       frictionLevel:"low", parentLevel:null, nationality:"Indian",        departed:false, powerDistance:52, riskTolerance:54, decisionSpeed:46, communicationStyle:65, individualismCollectivism:50 },
  { id:42, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"Filipino",      departed:false, powerDistance:50, riskTolerance:55, decisionSpeed:44, communicationStyle:67, individualismCollectivism:53 },
  { id:43, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"stem",       frictionLevel:"low", parentLevel:null, nationality:"Australian",    departed:false, powerDistance:49, riskTolerance:57, decisionSpeed:47, communicationStyle:65, individualismCollectivism:51 },
  { id:44, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"American",       departed:false, powerDistance:60, riskTolerance:44, decisionSpeed:36, communicationStyle:58, individualismCollectivism:62 },
  { id:45, role:"teacher", tenure:"10+", gradeLevel:"middle",     department:"stem",       frictionLevel:"low", parentLevel:null, nationality:"British",        departed:false, powerDistance:64, riskTolerance:40, decisionSpeed:38, communicationStyle:56, individualismCollectivism:60 },
  { id:46, role:"teacher", tenure:"10+", gradeLevel:"high",       department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"Lebanese",       departed:false, powerDistance:62, riskTolerance:42, decisionSpeed:40, communicationStyle:60, individualismCollectivism:58 },
  { id:47, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low", parentLevel:null, nationality:"Filipino",       departed:false, powerDistance:60, riskTolerance:44, decisionSpeed:36, communicationStyle:58, individualismCollectivism:64 },
  { id:48, role:"teacher", tenure:"10+", gradeLevel:"high",       department:"stem",       frictionLevel:"low", parentLevel:null, nationality:"Indian",         departed:false, powerDistance:63, riskTolerance:41, decisionSpeed:39, communicationStyle:57, individualismCollectivism:60 },
  { id:49, role:"teacher", tenure:"10+", gradeLevel:"middle",     department:"humanities", frictionLevel:"low", parentLevel:null, nationality:"South African",  departed:false, powerDistance:62, riskTolerance:43, decisionSpeed:38, communicationStyle:59, individualismCollectivism:62 },
  { id:50, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"arts-pe",    frictionLevel:"low", parentLevel:null, nationality:"Korean",         departed:false, powerDistance:61, riskTolerance:42, decisionSpeed:37, communicationStyle:58, individualismCollectivism:63 },
  { id:51, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"American",      departed:false, powerDistance:60, riskTolerance:38, decisionSpeed:30, communicationStyle:42, individualismCollectivism:74 },
  { id:52, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"Lebanese",      departed:false, powerDistance:56, riskTolerance:42, decisionSpeed:34, communicationStyle:46, individualismCollectivism:70 },
  { id:53, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"Filipino",      departed:false, powerDistance:58, riskTolerance:40, decisionSpeed:32, communicationStyle:44, individualismCollectivism:72 },
  { id:54, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"Indian",        departed:false, powerDistance:62, riskTolerance:36, decisionSpeed:28, communicationStyle:40, individualismCollectivism:76 },
  { id:55, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"Lebanese",      departed:false, powerDistance:58, riskTolerance:40, decisionSpeed:32, communicationStyle:44, individualismCollectivism:72 },
  { id:56, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"American",      departed:false, powerDistance:60, riskTolerance:38, decisionSpeed:30, communicationStyle:42, individualismCollectivism:74 },
  { id:57, role:"parent", tenure:null, gradeLevel:"elementary", department:null, frictionLevel:"low", parentLevel:"primary",     nationality:"Filipino",      departed:false, powerDistance:56, riskTolerance:42, decisionSpeed:34, communicationStyle:46, individualismCollectivism:70 },
  { id:65, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   nationality:"Indian",        departed:false, powerDistance:54, riskTolerance:46, decisionSpeed:38, communicationStyle:50, individualismCollectivism:66 },
  { id:66, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   nationality:"South African", departed:false, powerDistance:56, riskTolerance:44, decisionSpeed:36, communicationStyle:48, individualismCollectivism:68 },
  { id:67, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   nationality:"Lebanese",      departed:false, powerDistance:52, riskTolerance:48, decisionSpeed:40, communicationStyle:52, individualismCollectivism:64 },
  { id:68, role:"parent", tenure:null, gradeLevel:"middle",     department:null, frictionLevel:"low", parentLevel:"secondary",   nationality:"Korean",        departed:false, powerDistance:55, riskTolerance:45, decisionSpeed:37, communicationStyle:49, individualismCollectivism:67 },
  { id:75, role:"parent", tenure:null, gradeLevel:"high",       department:null, frictionLevel:"low", parentLevel:"high-school", nationality:"American",      departed:false, powerDistance:52, riskTolerance:50, decisionSpeed:42, communicationStyle:54, individualismCollectivism:62 },
  { id:76, role:"parent", tenure:null, gradeLevel:"high",       department:null, frictionLevel:"low", parentLevel:"high-school", nationality:"Filipino",      departed:false, powerDistance:54, riskTolerance:48, decisionSpeed:40, communicationStyle:52, individualismCollectivism:64 },
  { id:77, role:"parent", tenure:null, gradeLevel:"high",       department:null, frictionLevel:"low", parentLevel:"high-school", nationality:"British",       departed:false, powerDistance:50, riskTolerance:52, decisionSpeed:44, communicationStyle:56, individualismCollectivism:60 },
];

const DIMENSIONS = [
  { field: "powerDistance"             as const, label: "Power Distance",      shortLabel: "Power Dist.",  lowLabel: "Egalitarian", highLabel: "Hierarchical" },
  { field: "riskTolerance"             as const, label: "Risk Tolerance",      shortLabel: "Risk Tol.",    lowLabel: "Risk-Averse", highLabel: "Flexible"     },
  { field: "decisionSpeed"             as const, label: "Decision Speed",      shortLabel: "Decision Spd",lowLabel: "Deliberate",  highLabel: "Fast"         },
  { field: "communicationStyle"        as const, label: "Communication Style", shortLabel: "Comm. Style",  lowLabel: "Indirect",    highLabel: "Direct"       },
  { field: "individualismCollectivism" as const, label: "Group vs Individual", shortLabel: "Group/Indiv.", lowLabel: "Individual",  highLabel: "Group-Focused"},
];

type GroupBy = "role" | "tenure" | "department" | "nationality";

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "role",        label: "Role" },
  { value: "tenure",      label: "Tenure" },
  { value: "department",  label: "Department" },
  { value: "nationality", label: "Nationality" },
];

function getGroupKey(r: Respondent, groupBy: GroupBy): string | null {
  if (groupBy === "role") return r.role;
  if (groupBy === "tenure") {
    if (r.tenure) return r.tenure + " yrs";
    return null;
  }
  if (groupBy === "department") return r.department ?? null;
  if (groupBy === "nationality") return r.nationality;
  return null;
}

// ─── Score cell with inline bar ───────────────────────────────────────────────

function ScoreCell({ score, isHighest, isLowest }: { score: number; isHighest: boolean; isLowest: boolean }) {
  return (
    <td className="px-3 py-2.5 text-center align-middle">
      <div className="flex flex-col items-center gap-1">
        <span className={`text-sm font-bold tabular-nums ${isHighest ? "text-emerald-600 dark:text-emerald-400" : isLowest ? "text-rose-500 dark:text-rose-400" : "text-foreground"}`}>
          {score}
        </span>
        <div className="w-full max-w-[56px] h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isHighest ? "bg-emerald-500" : isLowest ? "bg-rose-400" : "bg-primary/40"}`}
            style={{ width: `${score}%` }}
          />
        </div>
        {isHighest && <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />}
        {isLowest  && <TrendingDown className="w-3 h-3 text-rose-400 shrink-0" />}
      </div>
    </td>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CulturalPreferencesGroupComparison() {
  const [groupBy, setGroupBy] = useState<GroupBy>("role");
  const [sortDim, setSortDim] = useState<string>("powerDistance");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const tableRows = useMemo(() => {
    const map = new Map<string, Respondent[]>();
    for (const r of MOCK_RESPONDENTS) {
      if (r.departed) continue;
      const key = getGroupKey(r, groupBy);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).map(([label, members]) => {
      const scores = Object.fromEntries(
        DIMENSIONS.map(d => [d.field, Math.round(members.map(m => m[d.field]).reduce((a, b) => a + b, 0) / members.length)])
      ) as Record<string, number>;
      return { label, count: members.length, scores };
    });
  }, [groupBy]);

  // Per-dimension highest and lowest group labels
  const dimExtremes = useMemo(() => {
    return Object.fromEntries(
      DIMENSIONS.map(d => {
        const sorted = [...tableRows].sort((a, b) => b.scores[d.field] - a.scores[d.field]);
        return [d.field, { highest: sorted[0]?.label, lowest: sorted[sorted.length - 1]?.label }];
      })
    ) as Record<string, { highest: string; lowest: string }>;
  }, [tableRows]);

  const sorted = useMemo(() => {
    return [...tableRows].sort((a, b) => {
      const diff = a.scores[sortDim] - b.scores[sortDim];
      return sortDir === "desc" ? -diff : diff;
    });
  }, [tableRows, sortDim, sortDir]);

  function toggleSort(field: string) {
    if (sortDim === field) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortDim(field);
      setSortDir("desc");
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold font-sans text-foreground">Highest &amp; Lowest Groups</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Compare average cultural preference scores across groups. Green highlights the highest-scoring group per dimension; red highlights the lowest.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">Group by</span>
        <Select value={groupBy} onValueChange={v => setGroupBy(v as GroupBy)}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROUP_BY_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {sorted.length} groups · click a column header to sort
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Group
              </th>
              <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                <Users className="w-3.5 h-3.5 mx-auto" />
              </th>
              {DIMENSIONS.map(d => (
                <th
                  key={d.field}
                  className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none transition-colors hover:text-foreground ${
                    sortDim === d.field ? "text-primary" : "text-muted-foreground"
                  }`}
                  onClick={() => toggleSort(d.field)}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{d.shortLabel}</span>
                    {sortDim === d.field && (
                      <span className="text-[10px] text-primary">{sortDir === "desc" ? "▼" : "▲"}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
            {/* Scale labels row */}
            <tr className="border-b border-border/30 bg-background">
              <td colSpan={2} />
              {DIMENSIONS.map(d => (
                <td key={d.field} className="px-3 py-1 text-center">
                  <div className="flex justify-between text-[9px] text-muted-foreground/60 max-w-[80px] mx-auto">
                    <span>{d.lowLabel}</span>
                    <span>{d.highLabel}</span>
                  </div>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.label}
                className={`border-b border-border/30 transition-colors hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
              >
                <td className="px-4 py-2.5 font-medium text-foreground capitalize whitespace-nowrap">
                  {row.label}
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-muted-foreground tabular-nums">
                  {row.count}
                </td>
                {DIMENSIONS.map(d => (
                  <ScoreCell
                    key={d.field}
                    score={row.scores[d.field]}
                    isHighest={dimExtremes[d.field]?.highest === row.label}
                    isLowest={dimExtremes[d.field]?.lowest === row.label}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Highest</span>
          — top-scoring group for that dimension
        </span>
        <span className="flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-rose-500 dark:text-rose-400 font-medium">Lowest</span>
          — lowest-scoring group for that dimension
        </span>
        <span className="ml-auto">Scores 0–100 · avg per group</span>
      </div>
    </div>
  );
}
