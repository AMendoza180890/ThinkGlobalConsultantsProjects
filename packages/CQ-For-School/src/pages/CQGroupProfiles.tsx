import { useState, useMemo } from "react";

// ─── CQ Quadrant score types ──────────────────────────────────────────────────

interface CQScores {
  drive: number;
  knowledge: number;
  strategy: number;
  action: number;
}

const CQ_DIMS: { key: keyof CQScores; label: string }[] = [
  { key: "drive",     label: "Drive"     },
  { key: "knowledge", label: "Knowledge" },
  { key: "strategy",  label: "Strategy"  },
  { key: "action",    label: "Action"    },
];

// ─── Mock staff data ──────────────────────────────────────────────────────────

type Tenure      = "0-2" | "3-5" | "6-10" | "10+";
type SchoolLevel = "Elementary" | "Middle" | "High";
type Department  = "Humanities" | "STEM" | "Arts & PE" | "Admin";
type Nationality = "Western" | "South Asian" | "East Asian" | "Middle Eastern" | "African" | "Latin American";

interface Staff {
  id: number;
  tenure: Tenure;
  level: SchoolLevel;
  department: Department;
  nationality: Nationality;
  cq: CQScores;
}

// Deterministic score generator: produces varied but stable values
function cqScore(id: number, seed: number): number {
  return Math.min(10, Math.max(1, Math.round(((((id * seed * 2654435761) >>> 0) % 80) + 30) / 10)));
}

function makeCQ(id: number): CQScores {
  return {
    drive:     cqScore(id, 7),
    knowledge: cqScore(id, 13),
    strategy:  cqScore(id, 17),
    action:    cqScore(id, 23),
  };
}

const MOCK_STAFF: Staff[] = [
  // 0-2 yr teachers
  { id:1,  tenure:"0-2",  level:"High",        department:"STEM",       nationality:"Western",       cq:makeCQ(1)  },
  { id:2,  tenure:"0-2",  level:"Middle",      department:"Humanities", nationality:"South Asian",   cq:makeCQ(2)  },
  { id:3,  tenure:"0-2",  level:"Elementary",  department:"Arts & PE",  nationality:"East Asian",    cq:makeCQ(3)  },
  { id:4,  tenure:"0-2",  level:"High",        department:"Humanities", nationality:"Western",       cq:makeCQ(4)  },
  { id:5,  tenure:"0-2",  level:"Middle",      department:"STEM",       nationality:"Middle Eastern",cq:makeCQ(5)  },
  { id:6,  tenure:"0-2",  level:"Elementary",  department:"Humanities", nationality:"African",       cq:makeCQ(6)  },
  { id:7,  tenure:"0-2",  level:"High",        department:"STEM",       nationality:"South Asian",   cq:makeCQ(7)  },
  { id:8,  tenure:"0-2",  level:"Middle",      department:"Arts & PE",  nationality:"Latin American",cq:makeCQ(8)  },
  { id:9,  tenure:"0-2",  level:"Elementary",  department:"STEM",       nationality:"East Asian",    cq:makeCQ(9)  },
  { id:10, tenure:"0-2",  level:"High",        department:"Humanities", nationality:"Western",       cq:makeCQ(10) },
  // 3-5 yr teachers
  { id:11, tenure:"3-5",  level:"Elementary",  department:"Humanities", nationality:"Western",       cq:makeCQ(11) },
  { id:12, tenure:"3-5",  level:"Middle",      department:"STEM",       nationality:"South Asian",   cq:makeCQ(12) },
  { id:13, tenure:"3-5",  level:"High",        department:"Arts & PE",  nationality:"East Asian",    cq:makeCQ(13) },
  { id:14, tenure:"3-5",  level:"Elementary",  department:"STEM",       nationality:"Western",       cq:makeCQ(14) },
  { id:15, tenure:"3-5",  level:"Middle",      department:"Humanities", nationality:"Middle Eastern",cq:makeCQ(15) },
  { id:16, tenure:"3-5",  level:"High",        department:"STEM",       nationality:"African",       cq:makeCQ(16) },
  { id:17, tenure:"3-5",  level:"Elementary",  department:"Arts & PE",  nationality:"South Asian",   cq:makeCQ(17) },
  { id:18, tenure:"3-5",  level:"Middle",      department:"Humanities", nationality:"Latin American",cq:makeCQ(18) },
  { id:19, tenure:"3-5",  level:"High",        department:"Humanities", nationality:"Western",       cq:makeCQ(19) },
  { id:20, tenure:"3-5",  level:"Elementary",  department:"STEM",       nationality:"East Asian",    cq:makeCQ(20) },
  { id:21, tenure:"3-5",  level:"Middle",      department:"Arts & PE",  nationality:"Western",       cq:makeCQ(21) },
  { id:22, tenure:"3-5",  level:"High",        department:"STEM",       nationality:"South Asian",   cq:makeCQ(22) },
  // 6-10 yr teachers
  { id:23, tenure:"6-10", level:"Elementary",  department:"Humanities", nationality:"Western",       cq:makeCQ(23) },
  { id:24, tenure:"6-10", level:"Middle",      department:"STEM",       nationality:"Middle Eastern",cq:makeCQ(24) },
  { id:25, tenure:"6-10", level:"High",        department:"Arts & PE",  nationality:"East Asian",    cq:makeCQ(25) },
  { id:26, tenure:"6-10", level:"Elementary",  department:"STEM",       nationality:"African",       cq:makeCQ(26) },
  { id:27, tenure:"6-10", level:"Middle",      department:"Humanities", nationality:"South Asian",   cq:makeCQ(27) },
  { id:28, tenure:"6-10", level:"High",        department:"Humanities", nationality:"Western",       cq:makeCQ(28) },
  { id:29, tenure:"6-10", level:"Elementary",  department:"Arts & PE",  nationality:"Latin American",cq:makeCQ(29) },
  { id:30, tenure:"6-10", level:"Middle",      department:"STEM",       nationality:"East Asian",    cq:makeCQ(30) },
  { id:31, tenure:"6-10", level:"High",        department:"STEM",       nationality:"Western",       cq:makeCQ(31) },
  { id:32, tenure:"6-10", level:"Elementary",  department:"Humanities", nationality:"South Asian",   cq:makeCQ(32) },
  // 10+ yr teachers / admin
  { id:33, tenure:"10+",  level:"Elementary",  department:"Humanities", nationality:"Western",       cq:makeCQ(33) },
  { id:34, tenure:"10+",  level:"Middle",      department:"STEM",       nationality:"East Asian",    cq:makeCQ(34) },
  { id:35, tenure:"10+",  level:"High",        department:"Arts & PE",  nationality:"South Asian",   cq:makeCQ(35) },
  { id:36, tenure:"10+",  level:"Elementary",  department:"Admin",      nationality:"Western",       cq:makeCQ(36) },
  { id:37, tenure:"10+",  level:"Middle",      department:"Humanities", nationality:"Middle Eastern",cq:makeCQ(37) },
  { id:38, tenure:"10+",  level:"High",        department:"STEM",       nationality:"African",       cq:makeCQ(38) },
  { id:39, tenure:"10+",  level:"Elementary",  department:"STEM",       nationality:"Latin American",cq:makeCQ(39) },
  { id:40, tenure:"10+",  level:"Middle",      department:"Admin",      nationality:"Western",       cq:makeCQ(40) },
  { id:41, tenure:"10+",  level:"High",        department:"Humanities", nationality:"East Asian",    cq:makeCQ(41) },
  { id:42, tenure:"10+",  level:"Elementary",  department:"Arts & PE",  nationality:"South Asian",   cq:makeCQ(42) },
  { id:43, tenure:"10+",  level:"Middle",      department:"STEM",       nationality:"Western",       cq:makeCQ(43) },
  { id:44, tenure:"10+",  level:"High",        department:"Admin",      nationality:"Western",       cq:makeCQ(44) },
  // Extra nationality diversity
  { id:45, tenure:"3-5",  level:"Elementary",  department:"Humanities", nationality:"African",       cq:makeCQ(45) },
  { id:46, tenure:"0-2",  level:"Middle",      department:"STEM",       nationality:"Latin American",cq:makeCQ(46) },
  { id:47, tenure:"6-10", level:"High",        department:"Humanities", nationality:"Middle Eastern",cq:makeCQ(47) },
  { id:48, tenure:"3-5",  level:"Elementary",  department:"Arts & PE",  nationality:"African",       cq:makeCQ(48) },
  { id:49, tenure:"10+",  level:"Middle",      department:"STEM",       nationality:"East Asian",    cq:makeCQ(49) },
  { id:50, tenure:"0-2",  level:"High",        department:"Admin",      nationality:"Western",       cq:makeCQ(50) },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round1(n: number) { return Math.round(n * 10) / 10; }

function groupStats(members: Staff[]): Record<keyof CQScores, { scores: number[]; avg: number; spread: number }> {
  const result = {} as Record<keyof CQScores, { scores: number[]; avg: number; spread: number }>;
  for (const { key } of CQ_DIMS) {
    const scores = members.map(m => m.cq[key]);
    const avg = round1(scores.reduce((a, b) => a + b, 0) / scores.length);
    const spread = round1(Math.max(...scores) - Math.min(...scores));
    result[key] = { scores, avg, spread };
  }
  return result;
}

// ─── SpreadBar component ──────────────────────────────────────────────────────

const SPREAD_HIGH = 4; // out of 10

function SpreadBar({
  label,
  scores,
  avg,
  spread,
}: {
  label: string;
  scores: number[];
  avg: number;
  spread: number;
}) {
  const isWide = spread >= SPREAD_HIGH;
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  return (
    <div className={`rounded-lg border p-3 ${isWide ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">avg {avg}</span>
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              isWide ? "bg-red-500 text-white" : "bg-slate-400 text-white"
            }`}
          >
            spread {spread}
          </span>
        </div>
      </div>

      {/* Track — scale 1–10 */}
      <div className="relative h-6 bg-white rounded border border-slate-200 overflow-visible mb-1">
        {/* Range fill */}
        {scores.length > 1 && (
          <div
            className="absolute top-0 bottom-0 bg-blue-100 rounded"
            style={{
              left:  `${((minScore - 1) / 9) * 100}%`,
              width: `${((maxScore - minScore) / 9) * 100}%`,
            }}
          />
        )}
        {/* Average line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
          style={{ left: `${((avg - 1) / 9) * 100}%` }}
        />
        {/* Individual dots */}
        {scores.map((s, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-600 border-2 border-white shadow-sm"
            style={{ left: `calc(${((s - 1) / 9) * 100}% - 5px)` }}
            title={`Score: ${s}`}
          />
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-slate-400">
        <span>1 — Low</span>
        <span>10 — High</span>
      </div>
    </div>
  );
}

// ─── Group card ───────────────────────────────────────────────────────────────

function GroupCard({
  label,
  count,
  stats,
  isSelected,
  maxSpread,
  onClick,
}: {
  label: string;
  count: number;
  stats: ReturnType<typeof groupStats>;
  isSelected: boolean;
  maxSpread: number;
  onClick: () => void;
}) {
  const isWide = maxSpread >= SPREAD_HIGH;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="font-semibold text-sm text-slate-800">{label}</span>
          <span className="ml-2 text-xs text-slate-400">n={count}</span>
        </div>
        {isWide && (
          <span className="shrink-0 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
            Wide spread
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CQ_DIMS.map(({ key, label: dimLabel }) => {
          const { avg, spread } = stats[key];
          const wide = spread >= SPREAD_HIGH;
          return (
            <div key={key} className="flex items-center justify-between bg-white rounded border border-slate-100 px-2 py-1">
              <span className="text-[11px] text-slate-500">{dimLabel}</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-slate-700">{avg}</span>
                <span className={`text-[10px] px-1 rounded ${wide ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                  ±{spread}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </button>
  );
}

// ─── Group types ──────────────────────────────────────────────────────────────

type GroupDim = "tenure" | "level" | "department" | "nationality";

const GROUP_DIM_LABELS: Record<GroupDim, string> = {
  tenure:      "By Tenure",
  level:       "By School Level",
  department:  "By Department",
  nationality: "By Nationality",
};

function getGroupKey(s: Staff, dim: GroupDim): string {
  if (dim === "tenure")      return `${s.tenure} yrs`;
  if (dim === "level")       return s.level;
  if (dim === "department")  return s.department;
  if (dim === "nationality") return s.nationality;
  return "Unknown";
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CQGroupProfiles() {
  const [dim, setDim] = useState<GroupDim>("tenure");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"widest" | "alpha">("widest");

  const groups = useMemo(() => {
    const map = new Map<string, Staff[]>();
    for (const s of MOCK_STAFF) {
      const key = getGroupKey(s, dim);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([label, members]) => {
      const stats = groupStats(members);
      const maxSpread = Math.max(...CQ_DIMS.map(d => stats[d.key].spread));
      return { label, members, stats, maxSpread };
    });
  }, [dim]);

  const sorted = useMemo(() => {
    const copy = [...groups];
    if (sortBy === "widest") copy.sort((a, b) => b.maxSpread - a.maxSpread);
    else copy.sort((a, b) => a.label.localeCompare(b.label));
    return copy;
  }, [groups, sortBy]);

  const detail = useMemo(
    () => sorted.find(g => g.label === selectedGroup) ?? sorted[0] ?? null,
    [sorted, selectedGroup]
  );

  // Widen spreads count
  const wideCount = sorted.filter(g => g.maxSpread >= SPREAD_HIGH).length;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Group Profiles</h2>
        <p className="text-sm text-slate-500 mt-1">
          Spread of CQ quadrant scores within each group. Wide spread means members vary significantly from one another.
        </p>
      </div>

      {/* Dimension tabs + sort */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 border-b border-slate-200">
          {(["tenure", "level", "department", "nationality"] as GroupDim[]).map(d => (
            <button
              key={d}
              onClick={() => { setDim(d); setSelectedGroup(null); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                dim === d
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {GROUP_DIM_LABELS[d]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {wideCount > 0 && (
            <span className="text-xs text-red-600 font-medium">
              {wideCount} group{wideCount !== 1 ? "s" : ""} with wide spread
            </span>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => setSortBy("widest")}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                sortBy === "widest"
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
              }`}
            >
              Widest first
            </button>
            <button
              onClick={() => setSortBy("alpha")}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                sortBy === "alpha"
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
              }`}
            >
              A–Z
            </button>
          </div>
        </div>
      </div>

      {/* Body: group list + detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Group list */}
        <div className="space-y-3">
          {sorted.map(g => (
            <GroupCard
              key={g.label}
              label={g.label}
              count={g.members.length}
              stats={g.stats}
              isSelected={detail?.label === g.label}
              maxSpread={g.maxSpread}
              onClick={() => setSelectedGroup(g.label)}
            />
          ))}
        </div>

        {/* Detail panel */}
        {detail && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 self-start sticky top-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{detail.label}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {detail.members.length} staff · {GROUP_DIM_LABELS[dim]}
                </p>
              </div>
              {detail.maxSpread >= SPREAD_HIGH && (
                <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full">
                  Wide spread detected
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Each bar shows where individual scores fall on a 1–10 scale. The blue line is the group
              average; the shaded region is the full range. Dots represent individual staff.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CQ_DIMS.map(({ key, label }) => {
                const s = detail.stats[key];
                return (
                  <SpreadBar
                    key={key}
                    label={label}
                    scores={s.scores}
                    avg={s.avg}
                    spread={s.spread}
                  />
                );
              })}
            </div>

            {/* Summary table */}
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="text-left py-1.5 font-medium">Dimension</th>
                  <th className="text-right py-1.5 font-medium">Min</th>
                  <th className="text-right py-1.5 font-medium">Avg</th>
                  <th className="text-right py-1.5 font-medium">Max</th>
                  <th className="text-right py-1.5 font-medium">Spread</th>
                </tr>
              </thead>
              <tbody>
                {CQ_DIMS.map(({ key, label }) => {
                  const { scores, avg, spread } = detail.stats[key];
                  const min = Math.min(...scores);
                  const max = Math.max(...scores);
                  const wide = spread >= SPREAD_HIGH;
                  return (
                    <tr key={key} className="border-b border-slate-50">
                      <td className="py-1.5 text-slate-700 font-medium">{label}</td>
                      <td className="py-1.5 text-right text-slate-500">{min}</td>
                      <td className="py-1.5 text-right text-slate-700 font-semibold">{avg}</td>
                      <td className="py-1.5 text-right text-slate-500">{max}</td>
                      <td className="py-1.5 text-right">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${wide ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                          {spread}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
