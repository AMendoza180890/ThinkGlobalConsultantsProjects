import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, Line,
} from "recharts";

// ─── Mock trend data ──────────────────────────────────────────────────────────

const BASE_TREND = [
  { month: "Sep", workload: 5.6, support: 6.8, safety: 6.3, growth: 6.5, friction: 5.4 },
  { month: "Oct", workload: 5.8, support: 7.0, safety: 6.5, growth: 6.7, friction: 5.3 },
  { month: "Nov", workload: 6.0, support: 7.1, safety: 6.6, growth: 6.9, friction: 5.3 },
  { month: "Dec", workload: 6.1, support: 7.2, safety: 6.7, growth: 7.0, friction: 5.4 },
  { month: "Jan", workload: 6.2, support: 7.4, safety: 6.9, growth: 7.1, friction: 5.6 },
  { month: "Feb", workload: 6.2, support: 7.4, safety: 6.9, growth: 7.1, friction: 5.8 },
  { month: "Mar", workload: 6.2, support: 7.4, safety: 6.9, growth: 7.1, friction: 5.8 },
];

// Group multipliers — friction higher = worse, wellness higher = better
const GROUP_MULTIPLIERS: Record<string, { friction: number; wellness: number }> = {
  "All Staff":            { friction: 1.00, wellness: 1.00 },
  "0–2 Yrs":             { friction: 1.30, wellness: 0.86 },
  "3–5 Yrs":             { friction: 1.08, wellness: 0.94 },
  "6–10 Yrs":            { friction: 0.90, wellness: 1.05 },
  "10+ Yrs":             { friction: 0.74, wellness: 1.12 },
  "Elementary":          { friction: 0.90, wellness: 1.08 },
  "Middle School":       { friction: 1.04, wellness: 0.97 },
  "High School":         { friction: 1.12, wellness: 0.92 },
  "Humanities":          { friction: 1.02, wellness: 0.99 },
  "STEM":                { friction: 0.96, wellness: 1.03 },
  "Arts & PE":           { friction: 0.88, wellness: 1.06 },
  "High-Friction Staff": { friction: 1.38, wellness: 0.82 },
  "Low-Friction Staff":  { friction: 0.68, wellness: 1.14 },
};

function applyMult(val: number, m: number, decimals = 2): number {
  return parseFloat((Math.min(10, Math.max(0, val * m))).toFixed(decimals));
}

function deriveTrend(group: string) {
  const gm = GROUP_MULTIPLIERS[group] ?? { friction: 1, wellness: 1 };
  return BASE_TREND.map(d => ({
    month:    d.month,
    workload: applyMult(d.workload, gm.friction),
    support:  applyMult(d.support,  gm.wellness),
    safety:   applyMult(d.safety,   gm.wellness),
    growth:   applyMult(d.growth,   gm.wellness),
    friction: applyMult(d.friction, gm.friction),
  }));
}

// ─── Metric config ────────────────────────────────────────────────────────────

type TrendKey = "workload" | "support" | "safety" | "growth" | "friction";

const METRICS: { label: string; dataKey: TrendKey; stroke: string; fill: string; higherIsBetter: boolean; hint: string }[] = [
  { label: "Workload",             dataKey: "workload", stroke: "hsl(28, 90%, 55%)",  fill: "hsl(28, 90%, 55%)",  higherIsBetter: false, hint: "Lower = lighter load"        },
  { label: "Leadership support",   dataKey: "support",  stroke: "hsl(198, 78%, 46%)", fill: "hsl(198, 78%, 46%)", higherIsBetter: true,  hint: "Higher = stronger support"   },
  { label: "Psychological safety", dataKey: "safety",   stroke: "hsl(258, 72%, 55%)", fill: "hsl(258, 72%, 55%)", higherIsBetter: true,  hint: "Higher = safer environment"  },
  { label: "Professional growth",  dataKey: "growth",   stroke: "hsl(152, 58%, 40%)", fill: "hsl(152, 58%, 40%)", higherIsBetter: true,  hint: "Higher = more opportunity"   },
  { label: "Process friction",     dataKey: "friction", stroke: "hsl(0, 72%, 55%)",   fill: "hsl(0, 72%, 55%)",   higherIsBetter: false, hint: "Lower = less friction"       },
];

const COMPARE_PALETTE = ["#1a7a7a", "#4db8b8", "#2a9d8f", "#1a7a7a", "#2a9d8f"];

// ─── Compare segment pills ────────────────────────────────────────────────────

interface CompareSeg { id: string; label: string; color: string }

function ComparePill({ seg, onRemove }: { seg: CompareSeg; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${seg.color}18`, color: seg.color, border: `1px solid ${seg.color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ backgroundColor: seg.color }} />
      {seg.label}
      <button onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const GROUPS = Object.keys(GROUP_MULTIPLIERS);

export default function CulturalPreferencesWellnessImpact() {
  const [primaryGroup, setPrimaryGroup] = useState("All Staff");
  const [compareSegs, setCompareSegs] = useState<CompareSeg[]>([]);
  const [addingCompare, setAddingCompare] = useState(false);

  const primaryTrend = useMemo(() => deriveTrend(primaryGroup), [primaryGroup]);
  const latest = primaryTrend[primaryTrend.length - 1];

  function addCompare(label: string) {
    if (compareSegs.find(s => s.label === label)) return;
    const color = COMPARE_PALETTE[compareSegs.length % COMPARE_PALETTE.length];
    setCompareSegs(prev => [...prev, { id: label, label, color }]);
    setAddingCompare(false);
  }

  function removeCompare(id: string) {
    setCompareSegs(prev => prev.filter(s => s.id !== id));
  }

  const compareGroups = GROUPS.filter(g => g !== primaryGroup && !compareSegs.find(s => s.label === g));

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
            <Activity className="h-4 w-4 text-primary" />
          </span>
          <div>
            <h1 className="font-sans text-2xl font-semibold text-foreground leading-tight">Staff Wellness Trends</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monthly wellness indicators by staff group — 7-month view
            </p>
          </div>
        </div>

        {/* Group selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-medium text-muted-foreground">Group:</label>
          <select
            value={primaryGroup}
            onChange={e => setPrimaryGroup(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Compare bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Compare with:</span>
        {compareSegs.map(seg => (
          <ComparePill key={seg.id} seg={seg} onRemove={() => removeCompare(seg.id)} />
        ))}
        {compareSegs.length < 4 && (
          addingCompare ? (
            <div className="relative">
              <select
                autoFocus
                onChange={e => { if (e.target.value) addCompare(e.target.value); }}
                onBlur={() => setAddingCompare(false)}
                defaultValue=""
                className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="" disabled>Pick a group…</option>
                {compareGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          ) : (
            <button
              onClick={() => setAddingCompare(true)}
              className="rounded-full border border-dashed border-border px-3 py-0.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              + Add group
            </button>
          )
        )}
      </div>

      {/* Trend cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map(metric => {
          const compareTrends = compareSegs.map(seg => ({
            seg,
            trend: deriveTrend(seg.label),
          }));

          const chartData = primaryTrend.map((d, i) => {
            const row: Record<string, number | string> = {
              month: d.month,
              [metric.dataKey]: d[metric.dataKey],
            };
            compareTrends.forEach(({ seg, trend }) => {
              row[`compare_${seg.id}`] = trend[i][metric.dataKey];
            });
            return row;
          });

          const allVals = chartData.flatMap(d =>
            Object.entries(d).filter(([k]) => k !== "month").map(([, v]) => v as number)
          );
          const yMin = Math.floor(Math.min(...allVals) * 10) / 10 - 0.2;
          const yMax = Math.ceil(Math.max(...allVals) * 10) / 10 + 0.2;

          const latestVal = latest[metric.dataKey];
          const badgeColor = metric.higherIsBetter
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-orange-50 border-orange-200 text-orange-700";

          return (
            <div key={metric.label} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="flex items-start justify-between px-4 pt-4 pb-1">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{metric.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{metric.hint}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {compareSegs.map(seg => {
                    const ct = deriveTrend(seg.label);
                    const cv = ct[ct.length - 1][metric.dataKey];
                    return (
                      <span
                        key={seg.id}
                        className="rounded-full border px-2 py-0.5 text-xs font-bold"
                        style={{ borderColor: `${seg.color}60`, color: seg.color, backgroundColor: `${seg.color}10` }}
                      >
                        {cv.toFixed(1)}
                      </span>
                    );
                  })}
                  <span className={`rounded-full border px-2.5 py-0.5 text-sm font-bold ${badgeColor}`}>
                    {latestVal.toFixed(1)}
                  </span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id={`well-fill-${metric.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={metric.fill} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={metric.fill} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[yMin, yMax]}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                    tickFormatter={(v: number) => v.toFixed(1)}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0", padding: "4px 10px" }}
                    formatter={(v: number, name: string) => {
                      const seg = compareSegs.find(s => `compare_${s.id}` === name);
                      return [(v as number).toFixed(1), seg ? seg.label : primaryGroup];
                    }}
                  />
                  {compareSegs.map(seg => (
                    <Line
                      key={seg.id}
                      type="monotone"
                      dataKey={`compare_${seg.id}`}
                      stroke={seg.color}
                      strokeWidth={2}
                      strokeDasharray="5 3"
                      dot={false}
                      name={`compare_${seg.id}`}
                    />
                  ))}
                  <Area
                    type="monotone"
                    dataKey={metric.dataKey}
                    stroke={metric.stroke}
                    strokeWidth={2.5}
                    fill={`url(#well-fill-${metric.dataKey})`}
                    dot={{ r: 4, fill: metric.stroke, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 5 }}
                    name={metric.dataKey}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
