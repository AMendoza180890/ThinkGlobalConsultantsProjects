import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { Compass, History, Users } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, Line,
} from "recharts";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_N = 86;
const COMPARE_COLORS = ["#1a7a7a", "#f97316", "#2563eb", "#7c3aed"] as const;

type SchoolYear = "2021-22" | "2022-23" | "2023-24";
const SCHOOL_YEARS: SchoolYear[] = ["2021-22", "2022-23", "2023-24"];

const HIST_FILTER_GROUPS = [
  { label: "Role", options: [
    { key: "role:admin",    label: "Administration",      n: 11 },
    { key: "role:teacher",  label: "All Teachers",        n: 75 },
    { key: "friction:high", label: "High-Friction Staff", n: 27 },
    { key: "friction:low",  label: "Low-Friction Staff",  n: 48 },
  ]},
  { label: "Tenure", options: [
    { key: "tenure:0-2",  label: "0–2 Years",  n: 22 },
    { key: "tenure:3-5",  label: "3–5 Years",  n: 26 },
    { key: "tenure:6-10", label: "6–10 Years", n: 21 },
    { key: "tenure:10+",  label: "10+ Years",  n: 17 },
  ]},
  { label: "School Level", options: [
    { key: "level:elementary", label: "Elementary",    n: 24 },
    { key: "level:middle",     label: "Middle School", n: 25 },
    { key: "level:high",       label: "High School",   n: 26 },
  ]},
  { label: "Department", options: [
    { key: "dept:humanities", label: "Humanities", n: 29 },
    { key: "dept:stem",       label: "STEM",       n: 27 },
    { key: "dept:arts-pe",    label: "Arts & PE",  n: 19 },
  ]},
  { label: "Parents", options: [
    { key: "parent:all",         label: "All Parents",       n: 38 },
    { key: "parent:primary",     label: "Primary Parents",   n: 14 },
    { key: "parent:secondary",   label: "Secondary Parents", n: 13 },
    { key: "parent:high-school", label: "HS Parents",        n: 11 },
  ]},
];

const DEPARTED_FILTER_GROUPS = [
  { label: "Role", options: [
    { key: "d-role:teacher",   label: "All Departed Teachers",  n: 12 },
    { key: "d-friction:high",  label: "High-Friction Departed", n: 9  },
    { key: "d-friction:low",   label: "Low-Friction Departed",  n: 3  },
  ]},
  { label: "Tenure at Departure", options: [
    { key: "d-tenure:0-2",  label: "0–2 Years",  n: 5 },
    { key: "d-tenure:3-5",  label: "3–5 Years",  n: 5 },
    { key: "d-tenure:6-10", label: "6–10 Years", n: 2 },
    { key: "d-tenure:10+",  label: "10+ Years",  n: 0 },
  ]},
  { label: "School Level", options: [
    { key: "d-level:elementary", label: "Elementary",    n: 3 },
    { key: "d-level:middle",     label: "Middle School", n: 4 },
    { key: "d-level:high",       label: "High School",   n: 5 },
  ]},
  { label: "Department", options: [
    { key: "d-dept:humanities", label: "Humanities", n: 4 },
    { key: "d-dept:stem",       label: "STEM",       n: 5 },
    { key: "d-dept:arts-pe",    label: "Arts & PE",  n: 3 },
  ]},
];

const HIST_CLARITY_MULTIPLIERS: Record<string, number> = {
  "role:admin":    1.08, "role:teacher":  1.00,
  "friction:high": 0.82, "friction:low":  1.14,
  "tenure:0-2":    0.86, "tenure:3-5":    0.94,
  "tenure:6-10":   1.05, "tenure:10+":    1.12,
  "level:elementary": 1.08, "level:middle": 0.97, "level:high": 0.92,
  "dept:humanities": 0.99, "dept:stem": 1.03, "dept:arts-pe": 1.06,
  "parent:all": 1.10, "parent:primary": 1.14, "parent:secondary": 1.06, "parent:high-school": 1.02,
};

const YEAR_CLARITY_OFFSET: Record<SchoolYear, number> = {
  "2021-22": 0.88, "2022-23": 0.94, "2023-24": 0.99,
};

const DEPARTED_CLARITY_MULTIPLIERS: Record<string, number> = {
  "d-role:teacher":   0.76, "d-friction:high": 0.68, "d-friction:low":  0.88,
  "d-tenure:0-2":     0.74, "d-tenure:3-5":    0.80, "d-tenure:6-10":   0.84, "d-tenure:10+": 0.90,
  "d-level:elementary": 0.80, "d-level:middle": 0.76, "d-level:high": 0.72,
  "d-dept:humanities":  0.78, "d-dept:stem":    0.80, "d-dept:arts-pe": 0.84,
};

function computeMultFromKeys(keys: string[], mults: Record<string, number>): number {
  if (keys.length === 0) return 1;
  const vals = keys.map(k => mults[k] ?? 1);
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function HistoricalPanel({ keys, onKeysChange, year, onYearChange }: {
  keys: string[]; onKeysChange: (k: string[]) => void;
  year: SchoolYear | null; onYearChange: (y: SchoolYear | null) => void;
}) {
  const color = COMPARE_COLORS[2];
  const hasAny = keys.length > 0 || !!year;
  function toggle(key: string) { onKeysChange(keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key]); }
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex-1 min-w-[220px]" style={{ borderTopWidth: 3, borderTopColor: color }}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <p className="text-sm font-bold" style={{ color }}>Group C — Historical</p>
          {hasAny ? <p className="text-xs text-slate-500">Overlay active</p> : <p className="text-xs text-slate-400">Optional — overlay a historical year</p>}
        </div>
        {hasAny && <button onClick={() => { onKeysChange([]); onYearChange(null); }} className="text-xs text-slate-400 hover:text-slate-700 underline">Clear</button>}
      </div>
      <div className="px-3 py-3 space-y-4">
        {HIST_FILTER_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">{group.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.options.map(opt => {
                const active = keys.includes(opt.key);
                return (
                  <button key={opt.key} onClick={() => toggle(opt.key)}
                    className={cn("flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                      active ? "font-semibold text-white border-transparent" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50")}
                    style={active ? { backgroundColor: color, borderColor: color } : {}}>
                    <span>{opt.label}</span>
                    <span className={cn("tabular-nums text-[10px]", active ? "opacity-80" : "text-slate-400")}>{opt.n}n</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="border-t border-slate-100 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1 flex items-center gap-1"><History className="w-3 h-3" />School Year</p>
          <div className="flex flex-wrap gap-1.5">
            {SCHOOL_YEARS.map(yr => {
              const active = year === yr;
              return (
                <button key={yr} onClick={() => onYearChange(active ? null : yr)}
                  className={cn("rounded-full border px-2.5 py-1 text-xs transition-colors",
                    active ? "font-semibold text-white border-transparent" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50")}
                  style={active ? { backgroundColor: color, borderColor: color } : {}}>{yr}</button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DepartedPanel({ keys, onKeysChange, year, onYearChange }: {
  keys: string[]; onKeysChange: (k: string[]) => void;
  year: SchoolYear | null; onYearChange: (y: SchoolYear | null) => void;
}) {
  const color = COMPARE_COLORS[3];
  const hasAny = keys.length > 0 || !!year;
  function toggle(key: string) { onKeysChange(keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key]); }
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex-1 min-w-[220px]" style={{ borderTopWidth: 3, borderTopColor: color }}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <p className="text-sm font-bold" style={{ color }}>Group D — Departed</p>
          {hasAny ? <p className="text-xs text-slate-500">Overlay active</p> : <p className="text-xs text-slate-400">Optional — overlay departed staff</p>}
        </div>
        {hasAny && <button onClick={() => { onKeysChange([]); onYearChange(null); }} className="text-xs text-slate-400 hover:text-slate-700 underline">Clear</button>}
      </div>
      <div className="px-3 py-3 space-y-4">
        {DEPARTED_FILTER_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">{group.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.options.map(opt => {
                const active = keys.includes(opt.key);
                return (
                  <button key={opt.key} onClick={() => toggle(opt.key)}
                    className={cn("flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                      active ? "font-semibold text-white border-transparent" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50")}
                    style={active ? { backgroundColor: color, borderColor: color } : {}}>
                    <span>{opt.label}</span>
                    <span className={cn("tabular-nums text-[10px]", active ? "opacity-80" : "text-slate-400")}>{opt.n}n</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="border-t border-slate-100 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1 flex items-center gap-1"><History className="w-3 h-3" />Year of Departure</p>
          <div className="flex flex-wrap gap-1.5">
            {SCHOOL_YEARS.map(yr => {
              const active = year === yr;
              return (
                <button key={yr} onClick={() => onYearChange(active ? null : yr)}
                  className={cn("rounded-full border px-2.5 py-1 text-xs transition-colors",
                    active ? "font-semibold text-white border-transparent" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50")}
                  style={active ? { backgroundColor: color, borderColor: color } : {}}>{yr}</button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const CLARITY_MULTIPLIERS: Record<string, number> = {
  // Role
  "Administration":      1.08,
  "All Teachers":        1.00,
  "High-Friction Staff": 0.76,
  "Low-Friction Staff":  1.12,
  // Tenure
  "0–2 Years":           0.82,
  "3–5 Years":           0.94,
  "6–10 Years":          1.04,
  "10+ Years":           1.10,
  // School Level
  "Elementary":          1.06,
  "Middle School":       0.98,
  "High School":         0.90,
  // Department
  "Humanities":          1.01,
  "STEM":                1.04,
  "Arts & PE":           0.97,
  // Parents
  "All Parents":         1.05,
  "Primary Parents":     1.08,
  "Secondary Parents":   1.02,
  "HS Parents":          0.96,
  // Nationality
  "American":            1.06,
  "British":             1.08,
  "Filipino":            0.91,
  "Indian":              0.96,
  "Lebanese":            0.90,
  "South African":       1.03,
  "Korean":              0.92,
  "Australian":          1.07,
};

// ── Wellness dimensions (same shape as StaffWellness) ─────────────────────────

const CLARITY_DIMENSIONS = [
  {
    key: "role",
    label: "Role",
    options: [
      { label: "Administration",      n: 11 },
      { label: "All Teachers",        n: 75 },
      { label: "High-Friction Staff", n: 27 },
      { label: "Low-Friction Staff",  n: 48 },
    ],
  },
  {
    key: "tenure",
    label: "Tenure",
    options: [
      { label: "0–2 Years",  n: 22 },
      { label: "3–5 Years",  n: 26 },
      { label: "6–10 Years", n: 21 },
      { label: "10+ Years",  n: 17 },
    ],
  },
  {
    key: "schoolLevel",
    label: "School Level",
    options: [
      { label: "Elementary",    n: 24 },
      { label: "Middle School", n: 25 },
      { label: "High School",   n: 26 },
    ],
  },
  {
    key: "department",
    label: "Department",
    options: [
      { label: "Humanities", n: 29 },
      { label: "STEM",       n: 27 },
      { label: "Arts & PE",  n: 19 },
    ],
  },
  {
    key: "parents",
    label: "Parents",
    options: [
      { label: "All Parents",       n: 38 },
      { label: "Primary Parents",   n: 14 },
      { label: "Secondary Parents", n: 13 },
      { label: "HS Parents",        n: 11 },
    ],
  },
  {
    key: "nationality",
    label: "Nationality",
    options: [
      { label: "American",      n: 19 },
      { label: "British",       n: 10 },
      { label: "Filipino",      n: 27 },
      { label: "Indian",        n: 18 },
      { label: "Lebanese",      n: 18 },
      { label: "South African", n: 14 },
      { label: "Korean",        n: 15 },
      { label: "Australian",    n: 3  },
    ],
  },
] as const;

type ClarityDimKey = typeof CLARITY_DIMENSIONS[number]["key"];
type ClarityGroupState = Record<ClarityDimKey, string | null>;

function emptyGroup(): ClarityGroupState {
  return Object.fromEntries(CLARITY_DIMENSIONS.map(d => [d.key, null])) as ClarityGroupState;
}

function groupMult(state: ClarityGroupState): number {
  const active = CLARITY_DIMENSIONS.map(d => state[d.key as ClarityDimKey]).filter((v): v is string => v !== null);
  if (active.length === 0) return 1;
  const mults = active.map(v => CLARITY_MULTIPLIERS[v] ?? 1);
  return mults.reduce((s, m) => s + m, 0) / mults.length;
}

function groupN(state: ClarityGroupState): number {
  const selected = CLARITY_DIMENSIONS.flatMap(d => {
    const val = state[d.key as ClarityDimKey];
    if (!val) return [];
    const opt = (d.options as readonly { label: string; n: number }[]).find(o => o.label === val);
    return opt ? [opt.n] : [];
  });
  return selected.length === 0 ? 0 : Math.min(...selected);
}

// ── Group selector ────────────────────────────────────────────────────────────

function GroupSelector({
  label, color, state, onChange, onClear, showAllStaff = false,
}: {
  label: string; color: string;
  state: ClarityGroupState;
  onChange: (dim: ClarityDimKey, value: string | null) => void;
  onClear: () => void;
  showAllStaff?: boolean;
}) {
  const n = groupN(state);
  const hasAny = CLARITY_DIMENSIONS.some(d => state[d.key as ClarityDimKey] !== null);

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex-1 min-w-[220px]">
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderTopWidth: 3, borderTopColor: color }}>
        <div>
          <p className="text-sm font-bold text-slate-800">{label}</p>
          {hasAny ? <p className="text-xs text-slate-500">{n} respondents</p> : <p className="text-xs text-slate-400">All staff</p>}
        </div>
        {hasAny && <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-700 underline">Clear</button>}
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
        {CLARITY_DIMENSIONS.map(dim => {
          const dimKey = dim.key as ClarityDimKey;
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
                        active ? "font-semibold text-white border-transparent" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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

// ── Types ─────────────────────────────────────────────────────────────────────

type MetricId = "priority_clarity" | "direction_consistency" | "communication_clarity";

interface WeekPoint {
  week: string; label: string;
  priority_clarity: number; direction_consistency: number; communication_clarity: number;
  responseCount: number;
}

// ── Metric config ─────────────────────────────────────────────────────────────

const METRICS: { id: MetricId; label: string; question: string; stroke: string; fill: string; hint: string }[] = [
  { id: "priority_clarity",      label: "Priority Clarity",      question: "I clearly understood my top 1–3 work priorities this week", stroke: "#1a7a7a", fill: "#1a7a7a", hint: "Higher = clearer priorities"    },
  { id: "direction_consistency", label: "Direction Consistency",  question: "Leadership direction and decisions felt consistent this week", stroke: "#2a9d8f", fill: "#2a9d8f", hint: "Higher = more consistent"      },
  { id: "communication_clarity", label: "Communication Clarity",  question: "Instructions were clear enough to act on without clarification", stroke: "#4db8b8", fill: "#4db8b8", hint: "Higher = clearer communication" },
];

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_POINTS: WeekPoint[] = [
  { week: "2025-09-15", label: "Sep", priority_clarity: 6.2, direction_consistency: 5.8, communication_clarity: 6.0, responseCount: 18 },
  { week: "2025-10-13", label: "Oct", priority_clarity: 6.5, direction_consistency: 6.1, communication_clarity: 6.3, responseCount: 21 },
  { week: "2025-11-10", label: "Nov", priority_clarity: 6.4, direction_consistency: 6.3, communication_clarity: 6.5, responseCount: 19 },
  { week: "2025-12-08", label: "Dec", priority_clarity: 5.9, direction_consistency: 5.6, communication_clarity: 5.8, responseCount: 22 },
  { week: "2026-01-12", label: "Jan", priority_clarity: 6.7, direction_consistency: 6.4, communication_clarity: 6.6, responseCount: 24 },
  { week: "2026-02-09", label: "Feb", priority_clarity: 6.9, direction_consistency: 6.6, communication_clarity: 6.8, responseCount: 20 },
  { week: "2026-03-09", label: "Mar", priority_clarity: 7.0, direction_consistency: 6.7, communication_clarity: 6.9, responseCount: 23 },
];

const BASELINE_POINT = MOCK_POINTS[MOCK_POINTS.length - 1];

// ── Supabase fetch ────────────────────────────────────────────────────────────

interface ResponseRow {
  week: string;
  responses: { wellbeing?: Record<string, number>; [key: string]: unknown };
}

async function fetchClarityResponses(schoolId: string): Promise<ResponseRow[]> {
  const { data, error } = await supabase
    .from("survey_responses").select("week, responses").eq("school_id", schoolId).order("week", { ascending: true });
  if (error || !data) return [];
  return data as ResponseRow[];
}

function computeWeeklyPoints(rows: ResponseRow[]): WeekPoint[] {
  const byWeek: Record<string, { sums: Record<string, number>; counts: Record<string, number>; total: number }> = {};
  rows.forEach(row => {
    const wb = row.responses?.wellbeing;
    if (!wb) return;
    if (!byWeek[row.week]) byWeek[row.week] = { sums: {}, counts: {}, total: 0 };
    byWeek[row.week].total += 1;
    (["priority_clarity", "direction_consistency", "communication_clarity"] as MetricId[]).forEach(id => {
      const val = wb[id];
      if (typeof val === "number") {
        byWeek[row.week].sums[id] = (byWeek[row.week].sums[id] ?? 0) + val;
        byWeek[row.week].counts[id] = (byWeek[row.week].counts[id] ?? 0) + 1;
      }
    });
  });
  return Object.entries(byWeek).sort(([a], [b]) => a.localeCompare(b)).map(([week, { sums, counts, total }]) => {
    const avg = (id: string) => counts[id] ? Math.round((sums[id] / counts[id]) * 10) / 10 : 0;
    const [, mm, dd] = week.split("-");
    return { week, label: `${mm}/${dd}`, priority_clarity: avg("priority_clarity"), direction_consistency: avg("direction_consistency"), communication_clarity: avg("communication_clarity"), responseCount: total };
  });
}

// ── Gap analysis ──────────────────────────────────────────────────────────────

interface GapRow {
  group: string; n: number;
  priority_clarity: number; direction_consistency: number; communication_clarity: number;
  overallClarity: number; severity: "critical" | "watch" | "ok";
}

const GAP_GROUPS: { label: string; n: number }[] = [
  { label: "0–2 Years",           n: 22 }, { label: "3–5 Years",           n: 26 },
  { label: "6–10 Years",          n: 21 }, { label: "10+ Years",           n: 17 },
  { label: "Elementary",          n: 24 }, { label: "Middle School",       n: 25 },
  { label: "High School",         n: 26 }, { label: "Humanities",          n: 29 },
  { label: "STEM",                n: 27 }, { label: "Arts & PE",           n: 19 },
  { label: "High-Friction Staff", n: 27 }, { label: "Low-Friction Staff",  n: 48 },
];

function buildGapRows(): GapRow[] {
  return GAP_GROUPS.map(g => {
    const m = CLARITY_MULTIPLIERS[g.label] ?? 1;
    const pc = parseFloat(Math.min(10, BASELINE_POINT.priority_clarity      * m).toFixed(1));
    const dc = parseFloat(Math.min(10, BASELINE_POINT.direction_consistency * m).toFixed(1));
    const cc = parseFloat(Math.min(10, BASELINE_POINT.communication_clarity * m).toFixed(1));
    const overall = parseFloat(((pc + dc + cc) / 3).toFixed(1));
    const severity = overall < 5.5 ? "critical" : overall < 6.5 ? "watch" : "ok";
    return { group: g.label, n: g.n, priority_clarity: pc, direction_consistency: dc, communication_clarity: cc, overallClarity: overall, severity };
  });
}

const SCHOOL_BASELINE_CLARITY = {
  priority_clarity:      parseFloat(BASELINE_POINT.priority_clarity.toFixed(1)),
  direction_consistency: parseFloat(BASELINE_POINT.direction_consistency.toFixed(1)),
  communication_clarity: parseFloat(BASELINE_POINT.communication_clarity.toFixed(1)),
};


// ── Group Profiles ────────────────────────────────────────────────────────────

type Nationality = "American" | "British" | "Filipino" | "Indian" | "Lebanese" | "South African" | "Korean" | "Australian";

interface StaffMember {
  id: number;
  tenure: "0–2 Years" | "3–5 Years" | "6–10 Years" | "10+ Years";
  level: "Elementary" | "Middle School" | "High School";
  dept: "Humanities" | "STEM" | "Arts & PE";
  friction: "High-Friction Staff" | "Low-Friction Staff";
  nationality: Nationality;
  priority_clarity: number; direction_consistency: number; communication_clarity: number;
}

const NATIONALITY_POOL: Nationality[] = [
  ...Array(9).fill("American"),
  ...Array(5).fill("British"),
  ...Array(11).fill("Filipino"),
  ...Array(7).fill("Indian"),
  ...Array(4).fill("Lebanese"),
  ...Array(3).fill("South African"),
  ...Array(2).fill("Korean"),
  ...Array(1).fill("Australian"),
];

function makeMember(id: number, opts: Omit<StaffMember, "id" | "priority_clarity" | "direction_consistency" | "communication_clarity">): StaffMember {
  const m = ((CLARITY_MULTIPLIERS[opts.tenure] ?? 1) + (CLARITY_MULTIPLIERS[opts.nationality] ?? 1)) / 2;
  const j = (salt: number) => ((((id * 9301 + salt * 49297) % 233280) / 233280) - 0.5) * 2.4;
  return {
    id, ...opts,
    priority_clarity:      parseFloat(Math.min(10, Math.max(1, BASELINE_POINT.priority_clarity      * m + j(1))).toFixed(1)),
    direction_consistency: parseFloat(Math.min(10, Math.max(1, BASELINE_POINT.direction_consistency * m + j(2))).toFixed(1)),
    communication_clarity: parseFloat(Math.min(10, Math.max(1, BASELINE_POINT.communication_clarity * m + j(3))).toFixed(1)),
  };
}

const STAFF_MEMBERS: StaffMember[] = [
  ...Array.from({ length: 11 }, (_, i) => ({ id: i + 1,  tenure: "0–2 Years" as const,  level: (["Elementary","Middle School","High School"] as const)[i % 3], dept: (["Humanities","STEM","Arts & PE"] as const)[i % 3], friction: i % 3 === 0 ? "Low-Friction Staff" as const : "High-Friction Staff" as const, nationality: NATIONALITY_POOL[i % NATIONALITY_POOL.length] })),
  ...Array.from({ length: 13 }, (_, i) => ({ id: i + 12, tenure: "3–5 Years" as const,  level: (["Elementary","Middle School","High School"] as const)[i % 3], dept: (["Humanities","STEM","Arts & PE"] as const)[i % 3], friction: i % 4 === 0 ? "High-Friction Staff" as const : "Low-Friction Staff" as const, nationality: NATIONALITY_POOL[(i + 3) % NATIONALITY_POOL.length] })),
  ...Array.from({ length: 10 }, (_, i) => ({ id: i + 25, tenure: "6–10 Years" as const, level: (["Elementary","Middle School","High School"] as const)[i % 3], dept: (["Humanities","STEM","Arts & PE"] as const)[i % 3], friction: i % 5 === 0 ? "High-Friction Staff" as const : "Low-Friction Staff" as const, nationality: NATIONALITY_POOL[(i + 7) % NATIONALITY_POOL.length] })),
  ...Array.from({ length: 8 },  (_, i) => ({ id: i + 35, tenure: "10+ Years" as const,  level: (["Elementary","Middle School","High School"] as const)[i % 3], dept: (["Humanities","STEM","Arts & PE"] as const)[i % 3], friction: "Low-Friction Staff" as const, nationality: NATIONALITY_POOL[(i + 13) % NATIONALITY_POOL.length] })),
].map(opts => makeMember(opts.id, opts));

type ProfileDim = "priority_clarity" | "direction_consistency" | "communication_clarity";
type ProfileGroupBy = "tenure" | "level" | "dept" | "friction" | "nationality";

const PROFILE_DIMS: { key: ProfileDim; label: string; lowLabel: string; highLabel: string }[] = [
  { key: "priority_clarity",      label: "Priority Clarity",      lowLabel: "Unclear",      highLabel: "Clear"      },
  { key: "direction_consistency", label: "Direction Consistency",  lowLabel: "Inconsistent", highLabel: "Consistent" },
  { key: "communication_clarity", label: "Communication Clarity",  lowLabel: "Unclear",      highLabel: "Clear"      },
];

const PROFILE_GROUP_BYS: { key: ProfileGroupBy; label: string }[] = [
  { key: "tenure",      label: "By Tenure" },
  { key: "level",       label: "By School Level" },
  { key: "dept",        label: "By Department" },
  { key: "friction",    label: "By Friction Level" },
  { key: "nationality", label: "By Nationality" },
];

function getGroupKey(m: StaffMember, by: ProfileGroupBy): string {
  if (by === "tenure")      return m.tenure;
  if (by === "level")       return m.level;
  if (by === "dept")        return m.dept;
  if (by === "friction")    return m.friction;
  if (by === "nationality") return m.nationality;
  return "Unknown";
}

function buildProfileGroups(by: ProfileGroupBy) {
  const map = new Map<string, StaffMember[]>();
  for (const m of STAFF_MEMBERS) {
    const key = getGroupKey(m, by);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([label, members]) => {
    const dimStats = PROFILE_DIMS.map(d => {
      const scores = members.map(m => m[d.key]);
      const avg = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
      const spread = parseFloat((Math.max(...scores) - Math.min(...scores)).toFixed(1));
      return { ...d, scores, avg, spread };
    });
    const avgSpread = parseFloat((dimStats.reduce((s, d) => s + d.spread, 0) / dimStats.length).toFixed(1));
    return { label, members, dimStats, avgSpread };
  });
}

function SpreadStrip({ scores, avg, spread, label, lowLabel, highLabel }: { scores: number[]; avg: number; spread: number; label: string; lowLabel: string; highLabel: string }) {
  const min = Math.min(...scores); const max = Math.max(...scores);
  const pct = (v: number) => ((v - 1) / 9) * 100;
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground/80">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">avg {avg.toFixed(1)}</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${spread > 4 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>{spread.toFixed(1)}pt</span>
        </div>
      </div>
      <div className="relative h-6 bg-background rounded border border-border/40 overflow-visible mb-1">
        {scores.length > 1 && <div className={`absolute top-0 bottom-0 rounded ${spread > 4 ? "bg-amber-400/25" : "bg-primary/15"}`} style={{ left: `${pct(min)}%`, width: `${pct(max) - pct(min)}%` }} />}
        <div className="absolute top-0 bottom-0 w-0.5 bg-primary" style={{ left: `${pct(avg)}%` }} />
        {scores.map((s, i) => <div key={i} className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-foreground/60 border-2 border-background shadow-sm" style={{ left: `calc(${pct(s)}% - 5px)` }} title={`${s}/10`} />)}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>{lowLabel}</span><span>{highLabel}</span></div>
    </div>
  );
}

function GroupProfilesTab() {
  const [groupBy, setGroupBy] = useState<ProfileGroupBy>("tenure");
  const [sortBy, setSortBy] = useState<"widest" | "alpha">("widest");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const groups = useMemo(() => buildProfileGroups(groupBy), [groupBy]);
  const sorted = useMemo(() => {
    const copy = [...groups];
    return sortBy === "widest" ? copy.sort((a, b) => b.avgSpread - a.avgSpread) : copy.sort((a, b) => a.label.localeCompare(b.label));
  }, [groups, sortBy]);
  const detail = useMemo(() => sorted.find(g => g.label === selectedGroup) ?? sorted[0] ?? null, [sorted, selectedGroup]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-0 border-b border-border/50">
          {PROFILE_GROUP_BYS.map(({ key, label }) => (
            <button key={key} onClick={() => { setGroupBy(key); setSelectedGroup(null); }} className={cn("px-4 py-2 text-sm border-b-2 transition-colors whitespace-nowrap", groupBy === key ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground")}>{label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort:</span>
          {(["widest", "alpha"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)} className={cn("px-2.5 py-1 rounded-md border transition-colors", sortBy === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground")}>{s === "widest" ? "Widest spread" : "A → Z"}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">Groups</p>
          {sorted.map(g => {
            const isActive = g.label === (detail?.label ?? "");
            return (
              <button key={g.label} onClick={() => setSelectedGroup(g.label)} className={cn("w-full text-left rounded-lg px-3 py-2.5 border transition-all", isActive ? "bg-primary/5 border-primary/40 shadow-sm" : "bg-card border-border/50 hover:bg-muted/40 hover:border-border")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground leading-tight">{g.label}</span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0"><Users className="w-3 h-3" />{g.members.length}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className={cn("h-full rounded-full transition-all", isActive ? "bg-primary/60" : "bg-muted-foreground/30")} style={{ width: `${(g.avgSpread / 9) * 100}%` }} /></div>
                  <span className="text-[10px] text-muted-foreground w-12 text-right tabular-nums">{g.avgSpread.toFixed(1)}pt</span>
                </div>
              </button>
            );
          })}
        </div>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">{detail.label}</h2>
                <p className="text-sm text-muted-foreground">{detail.members.length} staff members · avg spread {detail.avgSpread.toFixed(1)} pts</p>
              </div>
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0", detail.avgSpread > 4 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>{detail.avgSpread > 4 ? "Wide spread" : "Uniform group"}</span>
            </div>
            {(() => {
              const widest = [...detail.dimStats].sort((a, b) => b.spread - a.spread)[0];
              return widest.spread > 4 ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900"><span className="font-semibold">{widest.label}</span> has the widest range in this group ({widest.spread.toFixed(1)} pts).</div>
              ) : (
                <div className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3 text-sm text-muted-foreground">This group is relatively uniform — no clarity dimension has a spread wider than 4 points.</div>
              );
            })()}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[...detail.dimStats].sort((a, b) => b.spread - a.spread).map(d => <SpreadStrip key={d.key} scores={d.scores} avg={d.avg} spread={d.spread} label={d.label} lowLabel={d.lowLabel} highLabel={d.highLabel} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Group Rankings tab ────────────────────────────────────────────────────────

type ClarityRankSort = "overallClarity" | "priority_clarity" | "direction_consistency" | "communication_clarity" | "n";

const CLARITY_GAP_CATEGORIES: Record<string, string> = {
  "0–2 Years": "Tenure", "3–5 Years": "Tenure", "6–10 Years": "Tenure", "10+ Years": "Tenure",
  "Elementary": "School Level", "Middle School": "School Level", "High School": "School Level",
  "Humanities": "Department", "STEM": "Department", "Arts & PE": "Department",
  "High-Friction Staff": "Role", "Low-Friction Staff": "Role",
};

function ClarityGroupRankings({ mode, rows }: { mode: "top" | "bottom"; rows: GapRow[] }) {
  const [sortKey, setSortKey] = useState<ClarityRankSort>("overallClarity");
  const [sortAsc, setSortAsc] = useState(mode === "bottom");

  const baseRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.overallClarity - a.overallClarity);
    return mode === "top" ? sorted.slice(0, 10) : [...sorted].reverse().slice(0, 10);
  }, [rows, mode]);

  const visible = useMemo(() => {
    return [...baseRows].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      return ((a[sortKey as keyof GapRow] as number) - (b[sortKey as keyof GapRow] as number)) * dir;
    });
  }, [baseRows, sortKey, sortAsc]);

  const handleSort = (k: ClarityRankSort) => {
    if (sortKey === k) setSortAsc(v => !v); else { setSortKey(k); setSortAsc(false); }
  };

  const isTop = mode === "top";
  const accentColor = isTop ? "text-emerald-600" : "text-red-500";
  const badgeCls = isTop ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200";

  const schoolOverall = parseFloat(((
    SCHOOL_BASELINE_CLARITY.priority_clarity +
    SCHOOL_BASELINE_CLARITY.direction_consistency +
    SCHOOL_BASELINE_CLARITY.communication_clarity
  ) / 3).toFixed(1));

  const dimAvg = (key: keyof GapRow) =>
    parseFloat((visible.reduce((s, r) => s + (r[key] as number), 0) / visible.length).toFixed(1));

  const cols: { key: ClarityRankSort; label: string }[] = [
    { key: "overallClarity",        label: "Overall"       },
    { key: "priority_clarity",      label: "Priority ↑"    },
    { key: "direction_consistency", label: "Consistency ↑" },
    { key: "communication_clarity", label: "Communication ↑"},
    { key: "n",                     label: "n"             },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["priority_clarity", "direction_consistency", "communication_clarity"] as const).map(key => {
          const labels: Record<string, string> = { priority_clarity: "Priority Clarity", direction_consistency: "Direction Consistency", communication_clarity: "Communication Clarity" };
          const avgVal = dimAvg(key);
          const baseline = SCHOOL_BASELINE_CLARITY[key];
          const diff = avgVal - baseline;
          return (
            <div key={key} className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{labels[key]}</p>
              <p className={`text-2xl font-bold tabular-nums ${accentColor}`}>{avgVal.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                vs avg {baseline.toFixed(1)}{" "}
                <span className={diff >= 0 ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
                  {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                </span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Sortable table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50/60">
          <p className="font-semibold text-slate-900 text-sm">
            {isTop ? "Highest Clarity Groups" : "Lowest Clarity Groups"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            School-wide baseline: {schoolOverall.toFixed(1)} · click any column header to sort
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-5 py-2.5">Group</th>
                {cols.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    className="text-center px-3 py-2.5 cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap">
                    {col.label}
                    <span className="ml-1 opacity-40 text-[9px]">{sortKey === col.key ? (sortAsc ? "▲" : "▼") : "▲▼"}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {/* Baseline */}
              <tr className="bg-slate-50/80">
                <td className="px-5 py-2.5"><span className="text-xs font-semibold text-slate-500 italic">School-wide baseline</span></td>
                <td className="px-3 py-2.5 text-center"><span className="text-xs font-semibold text-slate-500 tabular-nums">{schoolOverall.toFixed(1)}</span></td>
                {(["priority_clarity", "direction_consistency", "communication_clarity"] as const).map(k => (
                  <td key={k} className="px-3 py-2.5 text-center"><span className="text-xs font-semibold text-slate-500 tabular-nums">{SCHOOL_BASELINE_CLARITY[k].toFixed(1)}</span></td>
                ))}
                <td className="px-3 py-2.5 text-center"><span className="text-xs text-slate-400">{TOTAL_N}</span></td>
              </tr>
              {visible.map(row => {
                const diff = row.overallClarity - schoolOverall;
                const category = CLARITY_GAP_CATEGORIES[row.group] ?? "";
                return (
                  <tr key={row.group} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{row.group}</span>
                        {category && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeCls}`}>{category}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-sm font-bold tabular-nums ${accentColor}`}>{row.overallClarity.toFixed(1)}</span>
                      <span className={`ml-1.5 text-xs font-semibold ${diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                      </span>
                    </td>
                    {(["priority_clarity", "direction_consistency", "communication_clarity"] as const).map(k => {
                      const d = row[k] - SCHOOL_BASELINE_CLARITY[k];
                      return (
                        <td key={k} className="px-3 py-3 text-center">
                          <span className="tabular-nums text-xs font-semibold text-foreground/80">{row[k].toFixed(1)}</span>
                          <span className={`ml-1 text-[10px] font-semibold ${d >= 0.3 ? "text-emerald-600" : d <= -0.3 ? "text-red-500" : "text-slate-400"}`}>
                            {d >= 0.3 ? "↑" : d <= -0.3 ? "↓" : "→"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center"><span className="text-xs text-muted-foreground tabular-nums">{row.n}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2.5 border-t bg-slate-50/40 text-[10px] text-slate-400">
          Overall = avg of all 3 clarity dimensions · ↑↓ vs school-wide baseline · click column headers to sort
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadershipClarity() {
  const { selectedSchoolId } = useSchoolContext();

  const [activeTab, setActiveTab] = useState<"trends" | "profiles" | "top" | "bottom">("trends");
  const [groupA, setGroupA] = useState<ClarityGroupState>(emptyGroup());
  const [groupB, setGroupB] = useState<ClarityGroupState>(emptyGroup());
  const [histKeys, setHistKeys] = useState<string[]>([]);
  const [histYear, setHistYear] = useState<SchoolYear | null>(null);
  const [deptKeys, setDeptKeys] = useState<string[]>([]);
  const [deptYear, setDeptYear] = useState<SchoolYear | null>(null);

  const gapRows = useMemo(() => buildGapRows(), []);

  const changeA = (dim: ClarityDimKey, value: string | null) => setGroupA(prev => ({ ...prev, [dim]: value }));
  const changeB = (dim: ClarityDimKey, value: string | null) => setGroupB(prev => ({ ...prev, [dim]: value }));

  const hasA = true;
  const hasB = CLARITY_DIMENSIONS.some(d => groupB[d.key as ClarityDimKey] !== null);
  const hasHist = histKeys.length > 0 || !!histYear;
  const hasDept = deptKeys.length > 0 || !!deptYear;

  const multA = useMemo(() => groupMult(groupA), [groupA]);
  const multB = useMemo(() => groupMult(groupB), [groupB]);

  const effectiveHistYear = histYear ?? (histKeys.length > 0 ? "2023-24" : null) as SchoolYear | null;

  const multHist = useMemo(() => {
    const keyMult = computeMultFromKeys(histKeys, HIST_CLARITY_MULTIPLIERS);
    const yearMult = effectiveHistYear ? YEAR_CLARITY_OFFSET[effectiveHistYear] : 1;
    return keyMult * yearMult;
  }, [histKeys, effectiveHistYear]);

  const multDept = useMemo(() => computeMultFromKeys(deptKeys, DEPARTED_CLARITY_MULTIPLIERS), [deptKeys]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["leadership-clarity", selectedSchoolId],
    queryFn: () => fetchClarityResponses(selectedSchoolId!),
    enabled: !!selectedSchoolId,
  });

  const basePoints = useMemo(() => {
    const computed = computeWeeklyPoints(rows);
    return computed.length > 0 ? computed : MOCK_POINTS;
  }, [rows]);


  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex-1 min-w-0 flex flex-col min-h-0">

        <div className="border-b bg-background px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
              <Compass className="h-4 w-4 text-primary" />
            </span>
            <div>
              <h1 className="font-sans text-3xl font-semibold text-foreground leading-tight">Leadership Clarity</h1>
              <p className="text-sm text-muted-foreground">
                How clearly staff understand priorities, direction, and communication from leadership
              </p>
            </div>
          </div>
          <div className="flex gap-0 -mb-px overflow-x-auto">
            {([["trends", "Trends"], ["top", "Highest Clarity Groups"], ["bottom", "Lowest Clarity Groups"], ["profiles", "Group Profiles"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} className={cn("px-4 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap", activeTab === id ? "border-foreground font-semibold text-foreground" : "border-transparent font-normal text-muted-foreground hover:text-foreground hover:border-muted-foreground/40")}>{label}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {activeTab === "profiles" && <GroupProfilesTab />}
          {activeTab === "top"     && <ClarityGroupRankings mode="top"    rows={gapRows} />}
          {activeTab === "bottom"  && <ClarityGroupRankings mode="bottom" rows={gapRows} />}

          {activeTab === "trends" && (isLoading ? (
            <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : (
            <div className="space-y-6">
              {/* Trend charts */}
              <div className="grid gap-4 lg:grid-cols-3">
                {METRICS.map(metric => {
                  const chartData = basePoints.map(d => {
                    const aVal = parseFloat(Math.min(10, d[metric.id] * (hasA ? multA : 1)).toFixed(2));
                    const row: Record<string, number | string> = { label: d.label, [metric.id]: aVal };
                    if (hasB) row["compare_groupB"] = parseFloat(Math.min(10, d[metric.id] * multB).toFixed(2));
                    if (hasHist) row["compare_hist"] = parseFloat(Math.min(10, d[metric.id] * multHist).toFixed(2));
                    if (hasDept) row["compare_dept"] = parseFloat(Math.min(10, d[metric.id] * multDept).toFixed(2));
                    return row;
                  });

                  const allVals = chartData.flatMap(d => Object.entries(d).filter(([k]) => k !== "label").map(([, v]) => v as number));
                  const yMin = Math.floor(Math.min(...allVals) * 10) / 10 - 0.2;
                  const yMax = Math.ceil(Math.max(...allVals) * 10) / 10 + 0.2;

                  const lastBase = basePoints[basePoints.length - 1];
                  const latestA    = parseFloat(Math.min(10, lastBase[metric.id] * (hasA ? multA : 1)).toFixed(1));
                  const latestB    = parseFloat(Math.min(10, lastBase[metric.id] * multB).toFixed(1));
                  const latestHist = parseFloat(Math.min(10, lastBase[metric.id] * multHist).toFixed(1));
                  const latestDept = parseFloat(Math.min(10, lastBase[metric.id] * multDept).toFixed(1));

                  return (
                    <div key={metric.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="flex items-start justify-between px-4 pt-4 pb-1">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{metric.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{metric.hint}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {hasDept && <span className="rounded-full border px-2 py-0.5 text-xs font-bold" style={{ borderColor: `${COMPARE_COLORS[3]}60`, color: COMPARE_COLORS[3], backgroundColor: `${COMPARE_COLORS[3]}10` }}>{latestDept.toFixed(1)}</span>}
                          {hasHist && <span className="rounded-full border px-2 py-0.5 text-xs font-bold" style={{ borderColor: `${COMPARE_COLORS[2]}60`, color: COMPARE_COLORS[2], backgroundColor: `${COMPARE_COLORS[2]}10` }}>{latestHist.toFixed(1)}</span>}
                          {hasB && <span className="rounded-full border px-2 py-0.5 text-xs font-bold" style={{ borderColor: `${COMPARE_COLORS[1]}60`, color: COMPARE_COLORS[1], backgroundColor: `${COMPARE_COLORS[1]}10` }}>{latestB.toFixed(1)}</span>}
                          <span className="rounded-full border px-2.5 py-0.5 text-sm font-bold" style={{ backgroundColor: `${COMPARE_COLORS[0]}10`, borderColor: `${COMPARE_COLORS[0]}40`, color: COMPARE_COLORS[0] }}>{latestA.toFixed(1)}</span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                          <defs>
                            <linearGradient id={`clarity-fill-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={COMPARE_COLORS[0]} stopOpacity={0.18} />
                              <stop offset="95%" stopColor={COMPARE_COLORS[0]} stopOpacity={0.03} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} tickFormatter={(v: number) => v.toFixed(1)} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0", padding: "4px 10px" }} formatter={(v: number, name: string) => [(v as number).toFixed(1), name === "compare_groupB" ? "Group B" : name === "compare_hist" ? "Group C (Historical)" : name === "compare_dept" ? "Group D (Departed)" : "Group A"]} />
                          <Area type="monotone" dataKey={metric.id} stroke={COMPARE_COLORS[0]} strokeWidth={2.5} fill={`url(#clarity-fill-${metric.id})`} dot={{ r: 4, fill: COMPARE_COLORS[0], strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5 }} name="Group A" />
                          {hasB    && <Line type="monotone" dataKey="compare_groupB" stroke={COMPARE_COLORS[1]} strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 3, fill: COMPARE_COLORS[1], strokeWidth: 2, stroke: "#fff" }} name="Group B" />}
                          {hasHist && <Line type="monotone" dataKey="compare_hist"   stroke={COMPARE_COLORS[2]} strokeWidth={2}   strokeDasharray="4 2" dot={{ r: 3, fill: COMPARE_COLORS[2], strokeWidth: 2, stroke: "#fff" }} name="Group C (Historical)" />}
                          {hasDept && <Line type="monotone" dataKey="compare_dept"   stroke={COMPARE_COLORS[3]} strokeWidth={2}   strokeDasharray="2 3" dot={{ r: 3, fill: COMPARE_COLORS[3], strokeWidth: 2, stroke: "#fff" }} name="Group D (Departed)" />}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </div>

              {/* Group selectors */}
              <div className="flex gap-4 overflow-x-auto">
                <GroupSelector label="Group A" color={COMPARE_COLORS[0]} state={groupA} onChange={changeA} onClear={() => setGroupA(emptyGroup())} showAllStaff />
                <GroupSelector label="Group B" color={COMPARE_COLORS[1]} state={groupB} onChange={changeB} onClear={() => setGroupB(emptyGroup())} />
                <HistoricalPanel keys={histKeys} onKeysChange={setHistKeys} year={histYear} onYearChange={setHistYear} />
                <DepartedPanel keys={deptKeys} onKeysChange={setDeptKeys} year={deptYear} onYearChange={setDeptYear} />
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
