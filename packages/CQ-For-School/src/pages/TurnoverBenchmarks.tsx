import { useState, useMemo } from "react";
import { UserMinus, Crown, Shield, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
  CartesianGrid, LineChart, Line, Legend,
} from "recharts";

// ── Filter options ────────────────────────────────────────────────────────────

const REGIONS      = ["All Regions", "Middle East", "Southeast Asia", "South Asia", "East Asia", "Europe", "North America"];
const SIZES        = ["All Sizes", "Small (<300 students)", "Medium (300–800)", "Large (800+)"];
const TYPES        = ["All Types", "International", "Private", "Public", "Charter"];
const CURRICULA    = ["All Curricula", "IB", "British", "American", "Mixed"];
const LEADERSHIP_NATIONALITIES = ["All Leadership", "American-led", "British-led", "Arab-led", "Filipino-led", "Indian-led", "Australian-led", "Korean-led", "South African-led"];
const ACCREDITATIONS = ["All Accreditation", "WASC", "CIS", "WASC + CIS", "No Accreditation"];

// ── Peer benchmark data ───────────────────────────────────────────────────────

interface TurnoverBenchmark {
  overallRate: number;        // % annual turnover
  voluntaryRate: number;      // % voluntary exits
  involuntaryRate: number;    // % involuntary exits
  avgTenureAtExit: number;    // years
  newStaffRate: number;       // % 0–2yr staff who leave
  veteranRate: number;        // % 6+ yr staff who leave
  elementaryRate: number;     // % turnover at elementary level
  middleRate: number;
  highRate: number;
  stemRate: number;
  humanitiesRate: number;
  artsRate: number;
  schoolCount: number;
}

const BASE_PEERS: TurnoverBenchmark = {
  overallRate: 18, voluntaryRate: 13, involuntaryRate: 5,
  avgTenureAtExit: 3.2,
  newStaffRate: 28, veteranRate: 6,
  elementaryRate: 14, middleRate: 18, highRate: 22,
  stemRate: 22, humanitiesRate: 16, artsRate: 12,
  schoolCount: 1082,
};

const MULTIPLIERS: Record<string, Partial<Record<keyof Omit<TurnoverBenchmark,"schoolCount">, number>> & { schoolCount?: number }> = {
  "Middle East":    { overallRate:1.05, voluntaryRate:1.08, highRate:1.10, stemRate:1.15, schoolCount:247 },
  "Southeast Asia": { overallRate:1.15, voluntaryRate:1.18, newStaffRate:1.20, schoolCount:183 },
  "South Asia":     { overallRate:1.20, voluntaryRate:1.22, newStaffRate:1.25, schoolCount:142 },
  "East Asia":      { overallRate:0.92, voluntaryRate:0.90, veteranRate:0.85, schoolCount:198 },
  "Europe":         { overallRate:0.85, voluntaryRate:0.82, newStaffRate:0.88, veteranRate:0.80, schoolCount:312 },
  "North America":  { overallRate:0.95, voluntaryRate:0.94, schoolCount:220 },
  "Small (<300 students)": { overallRate:0.90, newStaffRate:0.92, schoolCount:380 },
  "Medium (300–800)":      { overallRate:1.00, schoolCount:480 },
  "Large (800+)":          { overallRate:1.12, newStaffRate:1.15, highRate:1.18, schoolCount:222 },
  "International": { overallRate:0.88, voluntaryRate:0.85, stemRate:0.90, schoolCount:310 },
  "Private":       { overallRate:0.92, voluntaryRate:0.90, schoolCount:290 },
  "Public":        { overallRate:1.10, voluntaryRate:1.12, schoolCount:340 },
  "Charter":       { overallRate:1.02, schoolCount:142 },
  "IB":       { overallRate:0.85, voluntaryRate:0.82, schoolCount:198 },
  "British":  { overallRate:0.90, schoolCount:245 },
  "American": { overallRate:0.95, schoolCount:312 },
  "Mixed":    { overallRate:1.05, schoolCount:327 },
  // Leadership nationality
  "American-led":     { overallRate:0.90, voluntaryRate:0.88, newStaffRate:0.88 },
  "British-led":      { overallRate:0.88, voluntaryRate:0.86, newStaffRate:0.86 },
  "Arab-led":         { overallRate:1.14, voluntaryRate:1.18, newStaffRate:1.20 },
  "Filipino-led":     { overallRate:1.12, voluntaryRate:1.15, newStaffRate:1.18 },
  "Indian-led":       { overallRate:1.08, voluntaryRate:1.10, newStaffRate:1.14 },
  "Australian-led":   { overallRate:0.87, voluntaryRate:0.85, newStaffRate:0.85 },
  "Korean-led":       { overallRate:0.98, voluntaryRate:0.96, newStaffRate:0.96 },
  "South African-led":{ overallRate:0.93, voluntaryRate:0.92, newStaffRate:0.92 },
  // Accreditation
  "WASC":           { overallRate:0.88, voluntaryRate:0.86, newStaffRate:0.90, schoolCount:210 },
  "CIS":            { overallRate:0.85, voluntaryRate:0.83, newStaffRate:0.87, schoolCount:185 },
  "WASC + CIS":     { overallRate:0.83, voluntaryRate:0.81, newStaffRate:0.85, schoolCount:142 },
  "No Accreditation":{ overallRate:1.18, voluntaryRate:1.22, newStaffRate:1.25, schoolCount:320 },
};

function computePeers(filters: { region: string; size: string; type: string; curriculum: string; nationality: string; accreditation: string }): TurnoverBenchmark {
  const activeFilters = [filters.region, filters.size, filters.type, filters.curriculum, filters.nationality, filters.accreditation]
    .filter(f => !f.startsWith("All"));
  const result = { ...BASE_PEERS };
  let schoolCount = BASE_PEERS.schoolCount;
  for (const f of activeFilters) {
    const m = MULTIPLIERS[f];
    if (!m) continue;
    if (m.schoolCount !== undefined) schoolCount = m.schoolCount;
    (Object.keys(result) as (keyof TurnoverBenchmark)[]).forEach(k => {
      if (k === "schoolCount") return;
      const factor = (m as Record<string, number>)[k];
      if (factor !== undefined) (result[k] as number) = parseFloat(((result[k] as number) * factor).toFixed(1));
    });
  }
  result.schoolCount = schoolCount;
  return result;
}

// ── Your school's data ────────────────────────────────────────────────────────

const YOUR_SCHOOL = {
  overallRate: 11, voluntaryRate: 8, involuntaryRate: 3,
  avgTenureAtExit: 2.4,
  newStaffRate: 22, veteranRate: 4,
  elementaryRate: 8, middleRate: 10, highRate: 16,
  stemRate: 14, humanitiesRate: 10, artsRate: 7,
};

// ── Trend data (your school vs peer median, last 4 school years) ──────────────

const TREND_DATA = [
  { year: "2021–22", yours: 19, peers: 20 },
  { year: "2022–23", yours: 16, peers: 19 },
  { year: "2023–24", yours: 13, peers: 18 },
  { year: "2024–25", yours: 11, peers: 18 },
];

// ── Segment bar data ──────────────────────────────────────────────────────────

function tenureSegments(peers: TurnoverBenchmark) {
  return [
    { label: "0–2 Years",  yours: YOUR_SCHOOL.newStaffRate, peer: peers.newStaffRate  },
    { label: "3–5 Years",  yours: 14,                       peer: peers.overallRate   },
    { label: "6–10 Years", yours: 6,                        peer: Math.round(peers.overallRate * 0.65) },
    { label: "10+ Years",  yours: YOUR_SCHOOL.veteranRate,  peer: peers.veteranRate   },
  ];
}

function levelSegments(peers: TurnoverBenchmark) {
  return [
    { label: "Elementary",   yours: YOUR_SCHOOL.elementaryRate, peer: peers.elementaryRate },
    { label: "Middle School",yours: YOUR_SCHOOL.middleRate,     peer: peers.middleRate     },
    { label: "High School",  yours: YOUR_SCHOOL.highRate,       peer: peers.highRate       },
  ];
}

function deptSegments(peers: TurnoverBenchmark) {
  return [
    { label: "STEM",       yours: YOUR_SCHOOL.stemRate,       peer: peers.stemRate       },
    { label: "Humanities", yours: YOUR_SCHOOL.humanitiesRate, peer: peers.humanitiesRate },
    { label: "Arts & PE",  yours: YOUR_SCHOOL.artsRate,       peer: peers.artsRate       },
  ];
}

function roleSegments(peers: TurnoverBenchmark) {
  return [
    { label: "Voluntary",   yours: YOUR_SCHOOL.voluntaryRate,   peer: peers.voluntaryRate   },
    { label: "Involuntary", yours: YOUR_SCHOOL.involuntaryRate, peer: peers.involuntaryRate },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Delta({ yours, peer }: { yours: number; peer: number }) {
  const better = yours <= peer;
  const same = yours === peer;
  const diff = Math.abs(yours - peer).toFixed(1);
  if (same) return <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><Minus className="h-3 w-3" /> same as peers</span>;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${better ? "text-emerald-600" : "text-red-500"}`}>
      {better ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
      {better ? "-" : "+"}{diff}% vs peers
    </span>
  );
}

function StatCard({ label, yours, peer, unit = "%", note }: { label: string; yours: number; peer: number; unit?: string; note?: string }) {
  const better = yours <= peer;
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{yours}{unit}</p>
      <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
        <span className="text-xs text-muted-foreground">Peers {peer}{unit}</span>
        <Delta yours={yours} peer={peer} />
      </div>
      {note && <p className="text-[10px] text-muted-foreground mt-1">{note}</p>}
    </div>
  );
}

function SegmentChart({ title, data, cohortLabel }: { title: string; data: { label: string; yours: number; peer: number }[]; cohortLabel: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,32%,91%)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit="%" />
            <RechartsTooltip
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={(v: number, name: string) => [`${v}%`, name === "peer" ? cohortLabel : "Your School"]}
            />
            <Bar dataKey="peer"  name="peer"  fill="#cbd5e1" radius={[3, 3, 0, 0]} barSize={24} />
            <Bar dataKey="yours" name="yours" fill="#1a7a7a" radius={[3, 3, 0, 0]} barSize={24} />
            <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v) => v === "peer" ? cohortLabel : "Your School"} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TurnoverBenchmarks() {
  const [region,        setRegion]        = useState("Middle East");
  const [size,          setSize]          = useState("All Sizes");
  const [type,          setType]          = useState("All Types");
  const [curriculum,    setCurriculum]    = useState("All Curricula");
  const [nationality,   setNationality]   = useState("All Leadership");
  const [accreditation, setAccreditation] = useState("All Accreditation");

  const peers = useMemo(() =>
    computePeers({ region, size, type, curriculum, nationality, accreditation }),
    [region, size, type, curriculum, nationality, accreditation]
  );

  const cohortLabel = [region, size, type, curriculum, nationality, accreditation]
    .filter(f => !f.startsWith("All"))
    .join(" · ") || "Global";

  return (
    <div className="flex flex-col min-h-0">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <UserMinus className="h-7 w-7 text-primary shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans text-3xl font-semibold leading-tight">Turnover Benchmarks</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-semibold">
                  <Crown className="h-3 w-3" /> Premium
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Your school's turnover vs. {peers.schoolCount.toLocaleString()} peer schools · {cohortLabel}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Region",      value: region,      set: setRegion,      options: REGIONS       },
              { label: "Size",        value: size,        set: setSize,        options: SIZES         },
              { label: "Type",        value: type,        set: setType,        options: TYPES         },
              { label: "Curriculum",  value: curriculum,  set: setCurriculum,  options: CURRICULA     },
              { label: "Leadership",     value: nationality,   set: setNationality,   options: LEADERSHIP_NATIONALITIES },
              { label: "Accreditation",  value: accreditation, set: setAccreditation, options: ACCREDITATIONS             },
            ].map(f => (
              <Select key={f.label} value={f.value} onValueChange={f.set}>
                <SelectTrigger className="h-8 w-auto min-w-36 text-xs bg-muted/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {f.options.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">

        {/* 1 — Key stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Overall Turnover"     yours={YOUR_SCHOOL.overallRate}     peer={peers.overallRate}     note="Annual rate" />
          <StatCard label="Voluntary Exits"      yours={YOUR_SCHOOL.voluntaryRate}   peer={peers.voluntaryRate}   note="Staff-initiated" />
          <StatCard label="Involuntary Exits"    yours={YOUR_SCHOOL.involuntaryRate} peer={peers.involuntaryRate} note="School-initiated" />
          <StatCard label="New Staff (0–2yr)"    yours={YOUR_SCHOOL.newStaffRate}    peer={peers.newStaffRate}    note="Highest-risk group" />
          <StatCard label="Avg Tenure at Exit"   yours={YOUR_SCHOOL.avgTenureAtExit} peer={peers.avgTenureAtExit} unit="yr" note="Years before leaving" />
        </div>

        {/* 2 — Trend over time */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Overall Turnover Rate Over Time</CardTitle>
            <p className="text-sm text-muted-foreground">Your school vs. {cohortLabel} peer median, last 4 school years.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={TREND_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit="%" />
                <RechartsTooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v: number, name: string) => [`${v}%`, name === "peers" ? cohortLabel : "Your School"]}
                />
                <Line type="monotone" dataKey="peers" name="peers" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                <Line type="monotone" dataKey="yours" name="yours" stroke="#1a7a7a" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#1a7a7a", stroke: "#fff", strokeWidth: 2 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v) => v === "peers" ? cohortLabel : "Your School"} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3 — Segment charts */}
        <div>
          <h2 className="text-base font-semibold mb-4">Turnover by Segment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SegmentChart title="By Tenure"       data={tenureSegments(peers)} cohortLabel={cohortLabel} />
            <SegmentChart title="By School Level"  data={levelSegments(peers)} cohortLabel={cohortLabel} />
            <SegmentChart title="By Department"    data={deptSegments(peers)}  cohortLabel={cohortLabel} />
            <SegmentChart title="Voluntary vs Involuntary" data={roleSegments(peers)} cohortLabel={cohortLabel} />
          </div>
        </div>

        {/* Anonymity note */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pb-4">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          All benchmark data is anonymized by cohort. No individual schools are identified.
        </div>

      </div>
    </div>
  );
}
