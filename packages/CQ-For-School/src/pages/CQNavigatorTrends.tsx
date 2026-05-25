import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ChevronDown } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─── Mock trend data ──────────────────────────────────────────────────────────
// Surveys across 5 terms. Each segment has CQ scores per term.

const TERMS = ["Term 1 '24", "Term 2 '24", "Term 3 '24", "Term 1 '25", "Term 2 '25"];

interface TermScore { drive: number; knowledge: number; strategy: number; action: number }

const TREND_DATA: Record<string, TermScore[]> = {
  "All Staff": [
    { drive: 6.4, knowledge: 5.9, strategy: 5.6, action: 6.1 },
    { drive: 6.7, knowledge: 6.2, strategy: 5.9, action: 6.4 },
    { drive: 7.0, knowledge: 6.5, strategy: 6.2, action: 6.7 },
    { drive: 7.2, knowledge: 6.7, strategy: 6.5, action: 6.9 },
    { drive: 7.5, knowledge: 7.0, strategy: 6.8, action: 7.2 },
  ],
  "Administration": [
    { drive: 6.8, knowledge: 6.4, strategy: 6.5, action: 6.5 },
    { drive: 7.0, knowledge: 6.6, strategy: 6.7, action: 6.7 },
    { drive: 7.1, knowledge: 6.7, strategy: 6.8, action: 6.8 },
    { drive: 7.2, knowledge: 6.8, strategy: 7.0, action: 6.9 },
    { drive: 7.4, knowledge: 6.9, strategy: 7.1, action: 7.1 },
  ],
  "All Teachers": [
    { drive: 7.2, knowledge: 6.0, strategy: 5.2, action: 6.6 },
    { drive: 7.4, knowledge: 6.3, strategy: 5.5, action: 6.9 },
    { drive: 7.6, knowledge: 6.5, strategy: 5.8, action: 7.1 },
    { drive: 7.7, knowledge: 6.6, strategy: 6.0, action: 7.2 },
    { drive: 7.9, knowledge: 6.8, strategy: 6.2, action: 7.4 },
  ],
  "High-Friction Staff": [
    { drive: 4.9, knowledge: 4.5, strategy: 4.2, action: 4.8 },
    { drive: 5.2, knowledge: 4.8, strategy: 4.5, action: 5.1 },
    { drive: 5.5, knowledge: 5.0, strategy: 4.7, action: 5.3 },
    { drive: 5.7, knowledge: 5.2, strategy: 4.9, action: 5.4 },
    { drive: 5.9, knowledge: 5.4, strategy: 5.1, action: 5.6 },
  ],
  "Low-Friction Staff": [
    { drive: 7.8, knowledge: 7.0, strategy: 6.7, action: 7.4 },
    { drive: 8.0, knowledge: 7.2, strategy: 6.9, action: 7.6 },
    { drive: 8.1, knowledge: 7.3, strategy: 7.0, action: 7.7 },
    { drive: 8.2, knowledge: 7.4, strategy: 7.1, action: 7.8 },
    { drive: 8.4, knowledge: 7.6, strategy: 7.3, action: 8.0 },
  ],
  "0–2 Years Tenure": [
    { drive: 8.0, knowledge: 5.2, strategy: 4.8, action: 6.4 },
    { drive: 8.1, knowledge: 5.4, strategy: 5.0, action: 6.5 },
    { drive: 8.3, knowledge: 5.6, strategy: 5.1, action: 6.7 },
    { drive: 8.4, knowledge: 5.8, strategy: 5.2, action: 6.8 },
    { drive: 8.5, knowledge: 6.0, strategy: 5.4, action: 7.0 },
  ],
  "10+ Years Tenure": [
    { drive: 6.4, knowledge: 7.4, strategy: 7.2, action: 6.7 },
    { drive: 6.5, knowledge: 7.5, strategy: 7.3, action: 6.8 },
    { drive: 6.7, knowledge: 7.6, strategy: 7.5, action: 6.9 },
    { drive: 6.8, knowledge: 7.7, strategy: 7.6, action: 7.0 },
    { drive: 6.9, knowledge: 7.8, strategy: 7.7, action: 7.1 },
  ],
  "Elementary": [
    { drive: 7.2, knowledge: 6.5, strategy: 5.8, action: 6.8 },
    { drive: 7.3, knowledge: 6.7, strategy: 6.0, action: 6.9 },
    { drive: 7.5, knowledge: 6.8, strategy: 6.2, action: 7.0 },
    { drive: 7.6, knowledge: 6.9, strategy: 6.3, action: 7.1 },
    { drive: 7.7, knowledge: 7.0, strategy: 6.4, action: 7.2 },
  ],
  "STEM Dept": [
    { drive: 6.8, knowledge: 6.0, strategy: 5.4, action: 6.4 },
    { drive: 7.0, knowledge: 6.2, strategy: 5.6, action: 6.5 },
    { drive: 7.1, knowledge: 6.3, strategy: 5.7, action: 6.7 },
    { drive: 7.2, knowledge: 6.4, strategy: 5.8, action: 6.8 },
    { drive: 7.3, knowledge: 6.5, strategy: 6.0, action: 6.9 },
  ],
};

const SEGMENT_OPTIONS = Object.keys(TREND_DATA);

const DIMENSIONS = [
  { key: "drive",     label: "Drive",     color: "#1a7a7a" },
  { key: "knowledge", label: "Knowledge", color: "#2a9d8f" },
  { key: "strategy",  label: "Strategy",  color: "#4db8b8" },
  { key: "action",    label: "Action",    color: "#264653" },
] as const;

type DimKey = "drive" | "knowledge" | "strategy" | "action";

// ─── Segment selector ─────────────────────────────────────────────────────────

function SegmentSelect({
  value, onChange, label,
}: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative">
      <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {SEGMENT_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

// ─── Trend chart ──────────────────────────────────────────────────────────────

function buildChartData(seg: string) {
  return TERMS.map((term, i) => {
    const row = TREND_DATA[seg][i];
    return { term, ...row };
  });
}

function TrendChart({
  segment, activeDims,
}: { segment: string; activeDims: Set<DimKey> }) {
  const data = buildChartData(segment);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="term" tick={{ fontSize: 11, fill: "#6b7280" }} />
        <YAxis domain={[0, 10]} tickCount={6} tick={{ fontSize: 10, fill: "#9ca3af" }} />
        <RechartsTooltip
          formatter={(val: number, name: string) => [`${val}/10`, name]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine y={5} stroke="#d1d5db" strokeDasharray="4 2" />
        {DIMENSIONS.map(dim => activeDims.has(dim.key) && (
          <Line
            key={dim.key}
            type="monotone"
            dataKey={dim.key}
            name={dim.label}
            stroke={dim.color}
            strokeWidth={2}
            dot={{ r: 3, fill: dim.color }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Comparison chart (two segments, one dimension) ───────────────────────────

function ComparisonChart({
  segA, segB, dim,
}: { segA: string; segB: string; dim: DimKey }) {
  const dataA = buildChartData(segA);
  const dataB = buildChartData(segB);
  const merged = TERMS.map((term, i) => ({
    term,
    [segA]: dataA[i][dim],
    [segB]: dataB[i][dim],
  }));
  const colorA = "#1a7a7a";
  const colorB = "#4db8b8";
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={merged} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="term" tick={{ fontSize: 11, fill: "#6b7280" }} />
        <YAxis domain={[0, 10]} tickCount={6} tick={{ fontSize: 10, fill: "#9ca3af" }} />
        <RechartsTooltip formatter={(val: number, name: string) => [`${val}/10`, name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine y={5} stroke="#d1d5db" strokeDasharray="4 2" />
        <Line type="monotone" dataKey={segA} stroke={colorA} strokeWidth={2} dot={{ r: 3, fill: colorA }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey={segB} stroke={colorB} strokeWidth={2} dot={{ r: 3, fill: colorB }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Delta summary table ──────────────────────────────────────────────────────

function DeltaTable({ segment }: { segment: string }) {
  const rows = TREND_DATA[segment];
  const first = rows[0];
  const last = rows[rows.length - 1];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4 font-semibold">Dimension</th>
            <th className="text-center py-2 px-3 font-semibold text-muted-foreground">{TERMS[0]}</th>
            <th className="text-center py-2 px-3 font-semibold text-muted-foreground">{TERMS[TERMS.length - 1]}</th>
            <th className="text-center py-2 px-3 font-semibold">Change</th>
          </tr>
        </thead>
        <tbody>
          {DIMENSIONS.map(dim => {
            const delta = Math.round((last[dim.key] - first[dim.key]) * 10) / 10;
            const colorClass = delta > 0
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : delta < 0
              ? "text-red-600 dark:text-red-400 font-bold"
              : "text-muted-foreground";
            return (
              <tr key={dim.key} className="border-b last:border-0">
                <td className="py-2 pr-4 font-medium" style={{ color: dim.color }}>{dim.label}</td>
                <td className="text-center py-2 px-3 text-muted-foreground">{first[dim.key]}</td>
                <td className="text-center py-2 px-3 text-muted-foreground">{last[dim.key]}</td>
                <td className={`text-center py-2 px-3 ${colorClass}`}>
                  {delta > 0 ? `+${delta}` : delta}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CQNavigatorTrends() {
  const [segment, setSegment] = useState("All Staff");
  const [activeDims, setActiveDims] = useState<Set<DimKey>>(
    new Set(["drive", "knowledge", "strategy", "action"])
  );
  const [compSegA, setCompSegA] = useState("All Teachers");
  const [compSegB, setCompSegB] = useState("High-Friction Staff");
  const [compDim, setCompDim] = useState<DimKey>("drive");

  function toggleDim(key: DimKey) {
    setActiveDims(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="container max-w-4xl py-10 space-y-10">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="h-7 w-7 text-primary" />
          <h1 className="font-sans text-3xl font-semibold">CQ Navigator Trends</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Track how Drive, Knowledge, Strategy and Action change across survey terms for any segment.
        </p>
      </div>

      {/* Section 1 — single segment trend */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">1. Segment trend over time</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select a segment and toggle dimensions to see how CQ evolves term by term.
          </p>
        </div>
        <Card>
          <CardContent className="pt-5 pb-5 space-y-5">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[200px]">
                <SegmentSelect value={segment} onChange={setSegment} label="Segment" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Dimensions</p>
                <div className="flex gap-2 flex-wrap">
                  {DIMENSIONS.map(dim => (
                    <button
                      key={dim.key}
                      onClick={() => toggleDim(dim.key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        activeDims.has(dim.key)
                          ? "text-white border-transparent"
                          : "bg-background text-muted-foreground border-border hover:border-primary/40"
                      }`}
                      style={activeDims.has(dim.key) ? { background: dim.color, borderColor: dim.color } : {}}
                    >
                      {dim.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <TrendChart segment={segment} activeDims={activeDims} />

            {/* Delta table */}
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Change: {TERMS[0]} → {TERMS[TERMS.length - 1]}
              </p>
              <DeltaTable segment={segment} />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section 2 — cross-segment comparison */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">2. Cross-segment comparison</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compare two segments on one dimension to see where growth gaps persist or close over time.
          </p>
        </div>
        <Card>
          <CardContent className="pt-5 pb-5 space-y-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <SegmentSelect value={compSegA} onChange={setCompSegA} label="Segment A" />
              <SegmentSelect value={compSegB} onChange={setCompSegB} label="Segment B" />
              <div className="relative">
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Dimension</label>
                <div className="relative">
                  <select
                    value={compDim}
                    onChange={e => setCompDim(e.target.value as DimKey)}
                    className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {DIMENSIONS.map(d => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <ComparisonChart segA={compSegA} segB={compSegB} dim={compDim} />

            {/* Gap note */}
            {(() => {
              const lastA = TREND_DATA[compSegA][TERMS.length - 1][compDim];
              const lastB = TREND_DATA[compSegB][TERMS.length - 1][compDim];
              const gap = Math.abs(Math.round((lastA - lastB) * 10) / 10);
              const leader = lastA >= lastB ? compSegA : compSegB;
              const gapColor = gap >= 2 ? "text-red-600 dark:text-red-400" : gap >= 1 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
              return (
                <p className={`text-xs font-medium ${gapColor}`}>
                  Current gap ({TERMS[TERMS.length - 1]}): <strong>{gap} points</strong> — {leader} leads on {DIMENSIONS.find(d => d.key === compDim)?.label}.
                </p>
              );
            })()}
          </CardContent>
        </Card>
      </section>

      {/* Section 3 — all-segment snapshot table */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">3. All-segment snapshot</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Latest term scores and overall trajectory for every tracked segment.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-xs min-w-[560px]">
            <thead>
              <tr className="bg-muted/60 border-b">
                <th className="text-left px-3 py-2.5 font-semibold">Segment</th>
                {DIMENSIONS.map(d => (
                  <th key={d.key} className="text-center px-3 py-2.5 font-semibold" style={{ color: d.color }}>{d.label}</th>
                ))}
                <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground">Trend</th>
              </tr>
            </thead>
            <tbody>
              {SEGMENT_OPTIONS.map((seg, si) => {
                const rows = TREND_DATA[seg];
                const last = rows[rows.length - 1];
                const first = rows[0];
                const avgDelta = Math.round(
                  (DIMENSIONS.reduce((s, d) => s + last[d.key] - first[d.key], 0) / DIMENSIONS.length) * 10
                ) / 10;
                return (
                  <tr key={seg} className={`border-b last:border-0 ${si % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                    <td className="px-3 py-2.5 font-medium">{seg}</td>
                    {DIMENSIONS.map(d => (
                      <td key={d.key} className="text-center px-3 py-2.5 font-semibold" style={{ color: d.color }}>
                        {last[d.key]}
                      </td>
                    ))}
                    <td className={`text-center px-3 py-2.5 font-semibold ${avgDelta > 0 ? "text-emerald-600 dark:text-emerald-400" : avgDelta < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                      {avgDelta > 0 ? `↑ +${avgDelta}` : avgDelta < 0 ? `↓ ${avgDelta}` : "→ 0"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
