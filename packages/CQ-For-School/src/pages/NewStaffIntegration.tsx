import { useMemo, useState } from "react";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { UserPlus } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, Line,
} from "recharts";
import { cn } from "@/lib/utils";

// ── Integration-specific filter dimensions ─────────────────────────────────────

const INTEGRATION_DIMENSIONS = [
  {
    key: "role",
    label: "Role",
    options: [
      { label: "All New Staff",         n: 34 },
      { label: "New Teachers",          n: 26 },
      { label: "New Support Staff",     n: 8  },
    ],
  },
  {
    key: "tenure",
    label: "Time at School",
    options: [
      { label: "0–3 Months",  n: 12 },
      { label: "4–6 Months",  n: 11 },
      { label: "7–12 Months", n: 11 },
    ],
  },
  {
    key: "schoolLevel",
    label: "School Level",
    options: [
      { label: "Elementary",    n: 11 },
      { label: "Middle School", n: 12 },
      { label: "High School",   n: 11 },
    ],
  },
  {
    key: "department",
    label: "Department",
    options: [
      { label: "Humanities", n: 13 },
      { label: "STEM",       n: 12 },
      { label: "Arts & PE",  n: 9  },
    ],
  },
  {
    key: "family",
    label: "Family Status",
    options: [
      { label: "Relocated with Family", n: 19 },
      { label: "Relocated Solo",        n: 15 },
    ],
  },
  {
    key: "nationality",
    label: "Nationality",
    options: [
      { label: "American",      n: 7  },
      { label: "British",       n: 5  },
      { label: "Filipino",      n: 8  },
      { label: "Indian",        n: 6  },
      { label: "South African", n: 5  },
      { label: "Australian",    n: 3  },
    ],
  },
] as const;

type IntegrationDimKey = typeof INTEGRATION_DIMENSIONS[number]["key"];
type IntegrationFilterState = Record<IntegrationDimKey, string | null>;

function emptyIntegrationGroup(): IntegrationFilterState {
  return Object.fromEntries(INTEGRATION_DIMENSIONS.map(d => [d.key, null])) as IntegrationFilterState;
}

function groupN(state: IntegrationFilterState): number {
  const selected = INTEGRATION_DIMENSIONS.flatMap(d => {
    const val = state[d.key];
    if (!val) return [];
    const opt = (d.options as readonly { label: string; n: number }[]).find(o => o.label === val);
    return opt ? [opt.n] : [];
  });
  return selected.length === 0 ? 0 : Math.min(...selected);
}

// ── Filter multipliers ────────────────────────────────────────────────────────
// settlement: higher = more settled; struggle: higher = more struggle

const FILTER_MULTIPLIERS: Record<string, { struggle: number; settlement: number }> = {
  // Role
  "All New Staff":         { struggle: 1.00, settlement: 1.00 },
  "New Teachers":          { struggle: 1.05, settlement: 0.97 },
  "New Support Staff":     { struggle: 0.90, settlement: 1.06 },
  // Time at School
  "0–3 Months":            { struggle: 1.32, settlement: 0.78 },
  "4–6 Months":            { struggle: 1.12, settlement: 0.90 },
  "7–12 Months":           { struggle: 0.82, settlement: 1.10 },
  // School Level
  "Elementary":            { struggle: 0.94, settlement: 1.04 },
  "Middle School":         { struggle: 1.02, settlement: 0.98 },
  "High School":           { struggle: 1.08, settlement: 0.94 },
  // Department
  "Humanities":            { struggle: 1.00, settlement: 1.00 },
  "STEM":                  { struggle: 0.96, settlement: 1.03 },
  "Arts & PE":             { struggle: 0.92, settlement: 1.05 },
  // Family
  "Relocated with Family": { struggle: 1.18, settlement: 0.88 },
  "Relocated Solo":        { struggle: 0.88, settlement: 1.08 },
  // Nationality
  "American":              { struggle: 0.90, settlement: 1.06 },
  "British":               { struggle: 0.88, settlement: 1.07 },
  "Filipino":              { struggle: 1.14, settlement: 0.91 },
  "Indian":                { struggle: 1.08, settlement: 0.94 },
  "South African":         { struggle: 0.94, settlement: 1.03 },
  "Australian":            { struggle: 0.86, settlement: 1.08 },
};

const COMPARE_COLORS = ["#1a7a7a", "#f97316", "#2563eb", "#7c3aed"] as const;

// ── Group selector panel ──────────────────────────────────────────────────────

function GroupSelector({
  label,
  color,
  state,
  onChange,
  onClear,
  showAllStaff = false,
}: {
  label: string;
  color: string;
  state: IntegrationFilterState;
  onChange: (dim: IntegrationDimKey, value: string | null) => void;
  onClear: () => void;
  showAllStaff?: boolean;
}) {
  const n = groupN(state);
  const hasAny = INTEGRATION_DIMENSIONS.some(d => state[d.key] !== null);

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex-1 min-w-[220px]">
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderTopWidth: 3, borderTopColor: color }}>
        <div>
          <p className="text-sm font-bold text-slate-800">{label}</p>
          {hasAny
            ? <p className="text-xs text-slate-500">{n} respondents</p>
            : <p className="text-xs text-slate-400">All staff</p>
          }
        </div>
        {hasAny && (
          <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-700 underline">Clear</button>
        )}
      </div>
      <div className="px-3 py-3 space-y-4">
        {showAllStaff && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">Scope</p>
            <button
              onClick={onClear}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                !hasAny
                  ? "font-semibold text-white border-transparent"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              )}
              style={!hasAny ? { backgroundColor: color, borderColor: color } : {}}
            >
              All staff
            </button>
          </div>
        )}
        {INTEGRATION_DIMENSIONS.map(dim => {
          const dimKey = dim.key as IntegrationDimKey;
          const selected = state[dimKey];
          return (
            <div key={dim.key}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">{dim.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {(dim.options as readonly { label: string; n: number }[]).map(opt => {
                  const active = selected === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => onChange(dimKey, active ? null : opt.label)}
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                        active
                          ? "font-semibold text-white border-transparent"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      )}
                      style={active ? { backgroundColor: color, borderColor: color } : {}}
                    >
                      <span>{opt.label}</span>
                      <span className={cn("tabular-nums text-[10px]", active ? "opacity-80" : "text-slate-400")}>{opt.n}n</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Metric config ─────────────────────────────────────────────────────────────

type MetricId = "overall_settlement" | "practical_navigation" | "language_comfort" | "social_integration" | "family_settlement";

const METRICS: { id: MetricId; label: string; hint: string; stroke: string; fill: string; isStruggle: boolean; conditional?: string }[] = [
  {
    id: "overall_settlement",
    label: "Overall Settlement",
    hint: "\"I'm feeling settled in my life here.\"",
    stroke: "#1a7a7a",
    fill: "#1a7a7a",
    isStruggle: false,
  },
  {
    id: "practical_navigation",
    label: "Practical Navigation",
    hint: "Day-to-day logistics feel manageable.",
    stroke: "#2a9d8f",
    fill: "#2a9d8f",
    isStruggle: false,
  },
  {
    id: "language_comfort",
    label: "Language Comfort",
    hint: "Language isn't getting in the way of daily life.",
    stroke: "#38b2ac",
    fill: "#38b2ac",
    isStruggle: false,
  },
  {
    id: "social_integration",
    label: "Social Integration",
    hint: "\"I have people outside of work I can spend time with.\"",
    stroke: "#4db8b8",
    fill: "#4db8b8",
    isStruggle: false,
  },
  {
    id: "family_settlement",
    label: "Family Settlement",
    hint: "\"My family is adjusting well to life here.\" (Family relocations only)",
    stroke: "hsl(28, 80%, 55%)",
    fill: "hsl(28, 80%, 55%)",
    isStruggle: false,
    conditional: "Relocated with Family",
  },
];

// ── Mock data ─────────────────────────────────────────────────────────────────

interface WeekPoint {
  week: string;
  label: string;
  overall_settlement: number;
  practical_navigation: number;
  language_comfort: number;
  social_integration: number;
  family_settlement: number;
}

const MOCK_POINTS: WeekPoint[] = [
  { week: "2025-09-15", label: "Sep", overall_settlement: 5.2, practical_navigation: 5.8, language_comfort: 6.4, social_integration: 4.8, family_settlement: 5.0 },
  { week: "2025-10-13", label: "Oct", overall_settlement: 5.6, practical_navigation: 6.2, language_comfort: 6.6, social_integration: 5.2, family_settlement: 5.3 },
  { week: "2025-11-10", label: "Nov", overall_settlement: 6.0, practical_navigation: 6.5, language_comfort: 6.8, social_integration: 5.6, family_settlement: 5.8 },
  { week: "2025-12-08", label: "Dec", overall_settlement: 6.3, practical_navigation: 6.8, language_comfort: 7.0, social_integration: 5.9, family_settlement: 6.1 },
  { week: "2026-01-12", label: "Jan", overall_settlement: 6.6, practical_navigation: 7.0, language_comfort: 7.2, social_integration: 6.2, family_settlement: 6.4 },
  { week: "2026-02-09", label: "Feb", overall_settlement: 6.9, practical_navigation: 7.2, language_comfort: 7.4, social_integration: 6.5, family_settlement: 6.7 },
  { week: "2026-03-09", label: "Mar", overall_settlement: 7.1, practical_navigation: 7.4, language_comfort: 7.5, social_integration: 6.7, family_settlement: 6.9 },
];

// ── Hardest things this month ─────────────────────────────────────────────────

const HARDEST_CHIPS = [
  { key: "housing",       label: "Housing",           n: 18, pct: 53 },
  { key: "isolation",     label: "Isolation",         n: 14, pct: 41 },
  { key: "missing_home",  label: "Missing home",      n: 13, pct: 38 },
  { key: "family_stress", label: "Family stress",     n: 10, pct: 29 },
  { key: "language",      label: "Language",          n: 9,  pct: 26 },
  { key: "school_culture",label: "School culture",    n: 8,  pct: 24 },
  { key: "paperwork",     label: "Paperwork / admin", n: 7,  pct: 21 },
  { key: "healthcare",    label: "Healthcare",        n: 6,  pct: 18 },
  { key: "nothing",       label: "Nothing — it's going well", n: 5, pct: 15 },
  { key: "other",         label: "Other",             n: 3,  pct: 9  },
];

// Colors mapped to app palette:
// high-struggle → orange/amber (accent), mid → teal gradient (primary/charts), positive → muted teal, neutral → slate
const HARDEST_COLORS: Record<string, string> = {
  housing:        "hsl(28, 80%, 55%)",   // accent orange — top stressor
  isolation:      "hsl(28, 70%, 62%)",   // lighter orange
  missing_home:   "hsl(28, 60%, 68%)",   // warm amber
  family_stress:  "hsl(28, 65%, 58%)",   // orange-amber
  language:       "hsl(174, 63%, 40%)",  // chart-1 teal
  school_culture: "hsl(189, 52%, 36%)",  // chart-2 teal
  paperwork:      "hsl(196, 62%, 52%)",  // chart-3 blue-teal
  healthcare:     "hsl(207, 55%, 45%)",  // chart-5 blue
  nothing:        "hsl(168, 55%, 38%)",  // primary teal — positive outcome
  other:          "hsl(200, 10%, 65%)",  // muted slate
};

function HardestThisMonth() {
  const sorted = [...HARDEST_CHIPS].sort((a, b) => b.pct - a.pct);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50/60">
          <p className="font-semibold text-slate-900 text-sm">What's hardest right now</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            "What part of settling in has been hardest this month?" — multi-select, up to 3 · {HARDEST_CHIPS.reduce((s, c) => s + c.n, 0)} total selections from 34 respondents
          </p>
        </div>
        <div className="p-5 space-y-3">
          {sorted.map(chip => {
            const isPositive = chip.key === "nothing";
            const color = HARDEST_COLORS[chip.key] ?? "hsl(200, 10%, 65%)";
            return (
              <div key={chip.key} className="flex items-center gap-3">
                <div className="w-36 shrink-0">
                  <span className={cn("text-sm font-medium", isPositive ? "text-primary" : "text-slate-700")}>
                    {chip.label}
                  </span>
                </div>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${chip.pct}%`, backgroundColor: color, opacity: isPositive ? 0.85 : 1 }}
                  />
                </div>
                <div className="w-16 text-right shrink-0">
                  <span className={cn("text-sm font-bold tabular-nums", isPositive ? "text-primary" : "text-slate-700")}>{chip.pct}%</span>
                  <span className="text-xs text-slate-400 ml-1">{chip.n}n</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-2.5 border-t bg-slate-50/40 text-[10px] text-slate-400">
          Respondents select up to 3 items · percentages are % of respondents who selected each option
        </div>
      </div>
    </div>
  );
}

// ── Multiplier helpers ────────────────────────────────────────────────────────

function computeMultFromGroup(state: IntegrationFilterState, family: "struggle" | "settlement"): number {
  const active = INTEGRATION_DIMENSIONS.map(d => state[d.key as IntegrationDimKey]).filter((v): v is string => v !== null);
  if (active.length === 0) return 1;
  const mults = active.map(v => FILTER_MULTIPLIERS[v]?.[family] ?? 1);
  return mults.reduce((s, m) => s + m, 0) / mults.length;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewStaffIntegration() {
  useSchoolContext();

  const [activeTab, setActiveTab] = useState<"trends" | "hardest">("trends");
  const [groupA, setGroupA] = useState<IntegrationFilterState>(emptyIntegrationGroup());
  const [groupB, setGroupB] = useState<IntegrationFilterState>(emptyIntegrationGroup());

  const changeA = (dim: IntegrationDimKey, value: string | null) =>
    setGroupA(prev => ({ ...prev, [dim]: value }));
  const changeB = (dim: IntegrationDimKey, value: string | null) =>
    setGroupB(prev => ({ ...prev, [dim]: value }));

  const hasA = true;
  const hasB = INTEGRATION_DIMENSIONS.some(d => groupB[d.key as IntegrationDimKey] !== null);

  const smA = useMemo(() => computeMultFromGroup(groupA, "settlement"), [groupA]);
  const smB = useMemo(() => computeMultFromGroup(groupB, "settlement"), [groupB]);

  const groupBisSolo = groupB.family === "Relocated Solo";
  const groupAisSolo = groupA.family === "Relocated Solo";

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex-1 min-w-0 flex flex-col min-h-0">

        {/* Header + tab bar */}
        <div className="border-b bg-background px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
              <UserPlus className="h-4 w-4 text-primary" />
            </span>
            <div>
              <h1 className="font-sans text-3xl font-semibold text-foreground leading-tight">New Staff Integration</h1>
              <p className="text-sm text-muted-foreground">
                Settlement and wellbeing trends for newly-arrived staff
              </p>
            </div>
          </div>

          <div className="flex gap-0 -mb-px overflow-x-auto">
            {([["trends", "Trends"], ["hardest", "What's Hardest"]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "px-4 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap",
                  activeTab === id
                    ? "border-foreground font-semibold text-foreground"
                    : "border-transparent font-normal text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {activeTab === "hardest" && <HardestThisMonth />}

          {activeTab === "trends" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {METRICS.map(metric => {
                  // Suppress family_settlement chart when both groups are solo
                  const skipA = metric.conditional === "Relocated with Family" && groupAisSolo;
                  const skipB = metric.conditional === "Relocated with Family" && groupBisSolo;

                  const chartData = MOCK_POINTS.map(d => {
                    const aVal = parseFloat(Math.min(10, d[metric.id] * (hasA && !skipA ? smA : 1)).toFixed(2));
                    const bVal = parseFloat(Math.min(10, d[metric.id] * (hasB && !skipB ? smB : 1)).toFixed(2));
                    const row: Record<string, number | string> = { label: d.label, [metric.id]: aVal };
                    if (hasB && !skipB) row["compare_groupB"] = bVal;
                    return row;
                  });

                  const allVals = chartData.flatMap(d =>
                    Object.entries(d).filter(([k]) => k !== "label").map(([, v]) => v as number)
                  );
                  const yMin = Math.floor(Math.min(...allVals) * 10) / 10 - 0.2;
                  const yMax = Math.ceil(Math.max(...allVals) * 10) / 10 + 0.2;

                  const lastBase = MOCK_POINTS[MOCK_POINTS.length - 1];
                  const latestVal  = parseFloat(Math.min(10, lastBase[metric.id] * (hasA && !skipA ? smA : 1)).toFixed(1));
                  const latestBVal = parseFloat(Math.min(10, lastBase[metric.id] * (hasB && !skipB ? smB : 1)).toFixed(1));

                  return (
                    <div key={metric.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="flex items-start justify-between px-4 pt-4 pb-1">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{metric.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{metric.hint}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {hasB && !skipB && (
                            <span className="rounded-full border px-2 py-0.5 text-xs font-bold"
                              style={{ borderColor: `${COMPARE_COLORS[1]}60`, color: COMPARE_COLORS[1], backgroundColor: `${COMPARE_COLORS[1]}10` }}>
                              {latestBVal.toFixed(1)}
                            </span>
                          )}
                          <span className="rounded-full border px-2.5 py-0.5 text-sm font-bold" style={{ backgroundColor: `${COMPARE_COLORS[0]}10`, borderColor: `${COMPARE_COLORS[0]}40`, color: COMPARE_COLORS[0] }}>
                            {latestVal.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {metric.conditional && (
                        <p className="px-4 pb-1 text-[10px] text-slate-400 italic">
                          Shown for: {metric.conditional}
                        </p>
                      )}

                      <ResponsiveContainer width="100%" height={180}>
                        <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                          <defs>
                            <linearGradient id={`nsi-fill-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={COMPARE_COLORS[0]} stopOpacity={0.18} />
                              <stop offset="95%" stopColor={COMPARE_COLORS[0]} stopOpacity={0.03} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} tickFormatter={(v: number) => v.toFixed(1)} />
                          <Tooltip
                            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0", padding: "4px 10px" }}
                            formatter={(v: number, name: string) => [
                              (v as number).toFixed(1),
                              name === "compare_groupB" ? "Group B" : "Group A",
                            ]}
                          />
                          <Area type="monotone" dataKey={metric.id} stroke={COMPARE_COLORS[0]} strokeWidth={2.5} fill={`url(#nsi-fill-${metric.id})`} dot={{ r: 4, fill: COMPARE_COLORS[0], strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5 }} name="Group A" />
                          {hasB && !skipB && <Line type="monotone" dataKey="compare_groupB" stroke={COMPARE_COLORS[1]} strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 3, fill: COMPARE_COLORS[1], strokeWidth: 2, stroke: "#fff" }} name="Group B" />}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </div>

              {/* Group selectors */}
              <div className="flex gap-4 overflow-x-auto">
                <GroupSelector label="Group A" color={COMPARE_COLORS[0]} state={groupA} onChange={changeA} onClear={() => setGroupA(emptyIntegrationGroup())} showAllStaff />
                <GroupSelector label="Group B" color={COMPARE_COLORS[1]} state={groupB} onChange={changeB} onClear={() => setGroupB(emptyIntegrationGroup())} />
              </div>

              {/* Legend note */}
              <p className="text-xs text-muted-foreground">
                All scores on a 1–10 scale · higher = more settled · Family Settlement only shown for staff who relocated with family
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
