import { useState, useMemo } from "react";
import { BarChart3, Crown, Shield, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
} from "recharts";

// ── Filter options ────────────────────────────────────────────────────────────

const REGIONS   = ["All Regions", "Middle East", "Southeast Asia", "South Asia", "East Asia", "Europe", "North America"];
const SIZES     = ["All Sizes", "Small (<300 students)", "Medium (300–800)", "Large (800+)"];
const TYPES     = ["All Types", "International", "Private", "Public", "Charter"];
const CURRICULA = ["All Curricula", "IB", "British", "American", "Mixed"];
const LEADERSHIP_NATIONALITIES = ["All Leadership", "American-led", "British-led", "Arab-led", "Filipino-led", "Indian-led", "Australian-led", "Korean-led", "South African-led"];
const ACCREDITATIONS = ["All Accreditation", "WASC", "CIS", "WASC + CIS", "No Accreditation"];

// ── Benchmark data ────────────────────────────────────────────────────────────
// Each filter combination slightly adjusts peer benchmarks via multipliers.
// Base benchmarks come from the "All Regions" / neutral baseline.

interface PeerBenchmark {
  // Cultural Preferences (0–100)
  powerDistance: number;
  riskTolerance: number;
  decisionSpeed: number;
  communicationStyle: number;
  individualismCollectivism: number;
  // CQ Navigator (0–10)
  cqDrive: number;
  cqKnowledge: number;
  cqStrategy: number;
  cqAction: number;
  // Staff Wellness (0–10)
  wellnessWorkload: number;
  wellnessLeadershipSupport: number;
  wellnessPsychSafety: number;
  wellnessProfGrowth: number;
  // Leadership Clarity (0–10)
  priorityClarity: number;
  directionConsistency: number;
  communicationClarity: number;
  // Other
  frictionRate: number;       // % of work hours
  turnoverRate: number;       // % annual
  surveyParticipation: number; // %
  schoolCount: number;
}

const BASE_PEERS: PeerBenchmark = {
  powerDistance: 62, riskTolerance: 44, decisionSpeed: 40, communicationStyle: 54, individualismCollectivism: 58,
  cqDrive: 6.8, cqKnowledge: 6.9, cqStrategy: 6.5, cqAction: 6.7,
  wellnessWorkload: 6.1, wellnessLeadershipSupport: 6.8, wellnessPsychSafety: 6.4, wellnessProfGrowth: 6.6,
  priorityClarity: 6.3, directionConsistency: 6.0, communicationClarity: 6.2,
  frictionRate: 18, turnoverRate: 14, surveyParticipation: 71,
  schoolCount: 1082,
};

// Multipliers per filter value (applied to all numeric fields except schoolCount)
const MULTIPLIERS: Record<string, Partial<Record<keyof Omit<PeerBenchmark, "schoolCount">, number>> & { schoolCount?: number }> = {
  // Region
  "Middle East":     { cqDrive:0.99, cqKnowledge:1.01, frictionRate:1.00, turnoverRate:1.05, schoolCount:247 },
  "Southeast Asia":  { cqDrive:0.97, cqKnowledge:0.98, frictionRate:1.12, turnoverRate:1.15, schoolCount:183 },
  "South Asia":      { cqDrive:0.96, cqKnowledge:0.97, frictionRate:1.18, turnoverRate:1.20, schoolCount:142 },
  "East Asia":       { cqDrive:1.02, cqKnowledge:1.03, frictionRate:0.90, turnoverRate:0.92, schoolCount:198 },
  "Europe":          { cqDrive:1.05, cqKnowledge:1.06, frictionRate:0.80, turnoverRate:0.85, schoolCount:312 },
  "North America":   { cqDrive:1.02, cqKnowledge:1.02, frictionRate:0.95, turnoverRate:0.95, schoolCount:220 },
  // Size
  "Small (<300 students)": { frictionRate:0.88, turnoverRate:0.90, surveyParticipation:1.08, schoolCount:380 },
  "Medium (300–800)":      { frictionRate:1.00, turnoverRate:1.00, surveyParticipation:1.00, schoolCount:480 },
  "Large (800+)":          { frictionRate:1.14, turnoverRate:1.12, surveyParticipation:0.92, schoolCount:222 },
  // Type
  "International": { cqDrive:1.04, cqKnowledge:1.05, frictionRate:0.88, turnoverRate:0.88, surveyParticipation:1.06, schoolCount:310 },
  "Private":       { cqDrive:1.02, cqKnowledge:1.03, frictionRate:0.92, turnoverRate:0.90, schoolCount:290 },
  "Public":        { cqDrive:0.97, cqKnowledge:0.97, frictionRate:1.08, turnoverRate:1.10, schoolCount:340 },
  "Charter":       { cqDrive:1.00, cqKnowledge:1.00, frictionRate:1.00, turnoverRate:1.02, schoolCount:142 },
  // Curriculum
  "IB":       { cqDrive:1.05, cqKnowledge:1.06, frictionRate:0.85, surveyParticipation:1.08, schoolCount:198 },
  "British":  { cqDrive:1.02, cqKnowledge:1.03, frictionRate:0.90, surveyParticipation:1.04, schoolCount:245 },
  "American": { cqDrive:1.01, cqKnowledge:1.01, frictionRate:0.95, surveyParticipation:1.02, schoolCount:312 },
  "Mixed":    { cqDrive:0.99, cqKnowledge:0.99, frictionRate:1.05, surveyParticipation:0.96, schoolCount:327 },
  // Accreditation
  "WASC":           { cqDrive:1.04, cqKnowledge:1.05, frictionRate:0.88, surveyParticipation:1.08, schoolCount:210 },
  "CIS":            { cqDrive:1.05, cqKnowledge:1.06, frictionRate:0.86, surveyParticipation:1.10, schoolCount:185 },
  "WASC + CIS":     { cqDrive:1.07, cqKnowledge:1.08, frictionRate:0.83, surveyParticipation:1.12, schoolCount:142 },
  "No Accreditation":{ cqDrive:0.95, cqKnowledge:0.94, frictionRate:1.15, surveyParticipation:0.88, schoolCount:320 },
  // Leadership nationality — drives hierarchy, communication, and friction norms
  "American-led":     { powerDistance:0.85, communicationStyle:1.12, frictionRate:0.90, cqDrive:1.04 },
  "British-led":      { powerDistance:0.88, communicationStyle:1.10, frictionRate:0.88, cqDrive:1.03 },
  "Arab-led":         { powerDistance:1.15, communicationStyle:0.88, frictionRate:1.10, cqDrive:0.97 },
  "Filipino-led":     { powerDistance:1.12, communicationStyle:0.90, frictionRate:1.08, cqDrive:0.98 },
  "Indian-led":       { powerDistance:1.14, communicationStyle:0.89, frictionRate:1.06, cqDrive:0.98 },
  "Australian-led":   { powerDistance:0.86, communicationStyle:1.11, frictionRate:0.87, cqDrive:1.04 },
  "Korean-led":       { powerDistance:1.10, communicationStyle:0.92, frictionRate:1.05, cqDrive:0.99 },
  "South African-led":{ powerDistance:0.92, communicationStyle:1.06, frictionRate:0.93, cqDrive:1.02 },
};

function computePeers(filters: { region: string; size: string; type: string; curriculum: string; nationality: string; accreditation: string }): PeerBenchmark {
  const activeFilters = [filters.region, filters.size, filters.type, filters.curriculum, filters.nationality, filters.accreditation]
    .filter(f => !f.startsWith("All"));

  const result = { ...BASE_PEERS };
  let schoolCount = BASE_PEERS.schoolCount;

  for (const f of activeFilters) {
    const m = MULTIPLIERS[f];
    if (!m) continue;
    if (m.schoolCount !== undefined) schoolCount = m.schoolCount;
    (Object.keys(result) as (keyof PeerBenchmark)[]).forEach(k => {
      if (k === "schoolCount") return;
      const factor = (m as Record<string, number>)[k];
      if (factor !== undefined) {
        (result[k] as number) = parseFloat(((result[k] as number) * factor).toFixed(1));
      }
    });
  }

  result.schoolCount = schoolCount;
  return result;
}

// ── Your school's scores (fixed) ──────────────────────────────────────────────

const YOUR_SCHOOL = {
  powerDistance: 52, riskTolerance: 55, decisionSpeed: 58, communicationStyle: 66, individualismCollectivism: 44,
  cqDrive: 7.5, cqKnowledge: 7.0, cqStrategy: 6.8, cqAction: 7.2,
  wellnessWorkload: 6.2, wellnessLeadershipSupport: 7.4, wellnessPsychSafety: 6.9, wellnessProfGrowth: 7.1,
  priorityClarity: 7.0, directionConsistency: 6.7, communicationClarity: 6.9,
  frictionRate: 14, turnoverRate: 11, surveyParticipation: 84,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Delta({ yours, peer, higherIsBetter = true, unit = "" }: { yours: number; peer: number; higherIsBetter?: boolean; unit?: string }) {
  const better = higherIsBetter ? yours > peer : yours < peer;
  const same = yours === peer;
  const diff = Math.abs(yours - peer).toFixed(1);
  if (same) return <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><Minus className="h-3 w-3" /> same as peers</span>;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${better ? "text-emerald-600" : "text-red-500"}`}>
      {better ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {better ? "+" : "-"}{diff}{unit} vs peers
    </span>
  );
}

function StatCard({ label, yours, peer, unit = "", higherIsBetter = true }: { label: string; yours: number; peer: number; unit?: string; higherIsBetter?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{yours}{unit}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground">Peers {peer}{unit}</span>
        <Delta yours={yours} peer={peer} higherIsBetter={higherIsBetter} unit={unit} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BenchmarkingDashboard() {
  const [region,      setRegion]      = useState("Middle East");
  const [size,        setSize]        = useState("All Sizes");
  const [type,        setType]        = useState("All Types");
  const [curriculum,  setCurriculum]  = useState("All Curricula");
  const [nationality,   setNationality]   = useState("All Leadership");
  const [accreditation, setAccreditation] = useState("All Accreditation");

  const peers = useMemo(() =>
    computePeers({ region, size, type, curriculum, nationality, accreditation }),
    [region, size, type, curriculum, nationality, accreditation]
  );

  const cohortLabel = [region, size, type, curriculum, nationality, accreditation]
    .filter(f => !f.startsWith("All"))
    .join(" · ") || "Global";

  const culturalDimensions = [
    { label: "Power Distance",      yours: YOUR_SCHOOL.powerDistance,             peer: peers.powerDistance,             lowLabel: "Egalitarian", highLabel: "Hierarchical" },
    { label: "Risk Tolerance",      yours: YOUR_SCHOOL.riskTolerance,             peer: peers.riskTolerance,             lowLabel: "Risk-Averse", highLabel: "Flexible"     },
    { label: "Decision Speed",      yours: YOUR_SCHOOL.decisionSpeed,             peer: peers.decisionSpeed,             lowLabel: "Deliberate",  highLabel: "Fast"         },
    { label: "Communication",       yours: YOUR_SCHOOL.communicationStyle,        peer: peers.communicationStyle,        lowLabel: "Indirect",    highLabel: "Direct"       },
    { label: "Group vs Individual", yours: YOUR_SCHOOL.individualismCollectivism, peer: peers.individualismCollectivism, lowLabel: "Individual",  highLabel: "Group-Focused"},
  ];

  const cqDimensions = [
    { label: "Drive",     yours: YOUR_SCHOOL.cqDrive,     peer: peers.cqDrive     },
    { label: "Knowledge", yours: YOUR_SCHOOL.cqKnowledge, peer: peers.cqKnowledge },
    { label: "Strategy",  yours: YOUR_SCHOOL.cqStrategy,  peer: peers.cqStrategy  },
    { label: "Action",    yours: YOUR_SCHOOL.cqAction,    peer: peers.cqAction    },
  ];

  const wellnessDimensions = [
    { label: "Workload",          yours: YOUR_SCHOOL.wellnessWorkload,         peer: peers.wellnessWorkload         },
    { label: "Leadership Support",yours: YOUR_SCHOOL.wellnessLeadershipSupport,peer: peers.wellnessLeadershipSupport},
    { label: "Psych Safety",      yours: YOUR_SCHOOL.wellnessPsychSafety,      peer: peers.wellnessPsychSafety      },
    { label: "Prof Growth",       yours: YOUR_SCHOOL.wellnessProfGrowth,       peer: peers.wellnessProfGrowth       },
  ];

  const clarityDimensions = [
    { label: "Priority Clarity",       yours: YOUR_SCHOOL.priorityClarity,       peer: peers.priorityClarity       },
    { label: "Direction Consistency",  yours: YOUR_SCHOOL.directionConsistency,  peer: peers.directionConsistency  },
    { label: "Communication Clarity",  yours: YOUR_SCHOOL.communicationClarity,  peer: peers.communicationClarity  },
  ];

  const radarData = culturalDimensions.map(d => ({
    subject: d.label,
    "Your School": d.yours,
    "Peer Median": d.peer,
  }));

  return (
    <div className="flex flex-col min-h-0">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <BarChart3 className="h-7 w-7 text-primary shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans text-3xl font-semibold leading-tight">Cultural Benchmarks</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-semibold">
                  <Crown className="h-3 w-3" /> Premium
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Your school vs. {peers.schoolCount.toLocaleString()} peer schools · {cohortLabel}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Region",      value: region,      set: setRegion,      options: REGIONS      },
              { label: "Size",        value: size,        set: setSize,        options: SIZES        },
              { label: "Type",        value: type,        set: setType,        options: TYPES        },
              { label: "Curriculum",  value: curriculum,  set: setCurriculum,  options: CURRICULA    },
              { label: "Leadership",    value: nationality,   set: setNationality,   options: LEADERSHIP_NATIONALITIES },
              { label: "Accreditation", value: accreditation, set: setAccreditation, options: ACCREDITATIONS             },
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

        {/* 1 — Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Friction Rate"          yours={YOUR_SCHOOL.frictionRate}       peer={peers.frictionRate}       unit="%" higherIsBetter={false} />
          <StatCard label="Staff Turnover"         yours={YOUR_SCHOOL.turnoverRate}        peer={peers.turnoverRate}       unit="%" higherIsBetter={false} />
          <StatCard label="Survey Participation"   yours={YOUR_SCHOOL.surveyParticipation} peer={peers.surveyParticipation}unit="%" />
          <StatCard label="Avg CQ Score"
            yours={parseFloat(((YOUR_SCHOOL.cqDrive + YOUR_SCHOOL.cqKnowledge + YOUR_SCHOOL.cqStrategy + YOUR_SCHOOL.cqAction) / 4).toFixed(1))}
            peer={parseFloat(((peers.cqDrive + peers.cqKnowledge + peers.cqStrategy + peers.cqAction) / 4).toFixed(1))}
          />
          <StatCard label="Avg Wellness Score"
            yours={parseFloat(((YOUR_SCHOOL.wellnessWorkload + YOUR_SCHOOL.wellnessLeadershipSupport + YOUR_SCHOOL.wellnessPsychSafety + YOUR_SCHOOL.wellnessProfGrowth) / 4).toFixed(1))}
            peer={parseFloat(((peers.wellnessWorkload + peers.wellnessLeadershipSupport + peers.wellnessPsychSafety + peers.wellnessProfGrowth) / 4).toFixed(1))}
          />
        </div>

        {/* 2 — Cultural Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cultural Preferences</CardTitle>
            <p className="text-sm text-muted-foreground">Your school's cultural profile vs. {cohortLabel} peer median.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Radar name="Peer Median"  dataKey="Peer Median"  stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeWidth={1.5} strokeDasharray="4 3" />
                  <Radar name="Your School"  dataKey="Your School"  stroke="#1a7a7a" fill="#1a7a7a" fillOpacity={0.25} strokeWidth={2} />
                  <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => v.toFixed(0)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {culturalDimensions.map(d => (
                  <div key={d.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium">{d.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{d.lowLabel} ↔ {d.highLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">Peers {d.peer}</span>
                        <span className="text-sm font-bold tabular-nums">{d.yours}</span>
                      </div>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${d.yours}%` }} />
                      <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-400 rounded" style={{ left: `${d.peer}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3 — CQ Navigator */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">CQ Navigator</CardTitle>
            <p className="text-sm text-muted-foreground">Cultural intelligence scores vs. {cohortLabel} peer median.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cqDimensions} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,32%,91%)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => v.toFixed(1)} />
                <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => v.toFixed(1)} />
                <Bar dataKey="peer"  name="Peer Median"  fill="#cbd5e1" radius={[3, 3, 0, 0]} barSize={24} />
                <Bar dataKey="yours" name="Your School"  fill="#1a7a7a" radius={[3, 3, 0, 0]} barSize={24} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {cqDimensions.map(d => (
                <div key={d.label} className="text-center">
                  <p className="text-xs font-semibold">{d.label}</p>
                  <Delta yours={d.yours} peer={d.peer} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4 — Staff Wellness */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Staff Wellness</CardTitle>
            <p className="text-sm text-muted-foreground">Wellness dimensions vs. {cohortLabel} peer median (out of 10).</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={wellnessDimensions} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,32%,91%)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => v.toFixed(1)} />
                <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => v.toFixed(1)} />
                <Bar dataKey="peer"  name="Peer Median" fill="#cbd5e1" radius={[3, 3, 0, 0]} barSize={24} />
                <Bar dataKey="yours" name="Your School" fill="#1a7a7a" radius={[3, 3, 0, 0]} barSize={24} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {wellnessDimensions.map(d => (
                <div key={d.label} className="text-center">
                  <p className="text-xs font-semibold">{d.label}</p>
                  <Delta yours={d.yours} peer={d.peer} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 5 — Leadership Clarity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Leadership Clarity</CardTitle>
            <p className="text-sm text-muted-foreground">Clarity dimensions vs. {cohortLabel} peer median (out of 10).</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={clarityDimensions} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,32%,91%)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => v.toFixed(1)} />
                <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => v.toFixed(1)} />
                <Bar dataKey="peer"  name="Peer Median" fill="#cbd5e1" radius={[3, 3, 0, 0]} barSize={32} />
                <Bar dataKey="yours" name="Your School" fill="#1a7a7a" radius={[3, 3, 0, 0]} barSize={32} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {clarityDimensions.map(d => (
                <div key={d.label} className="text-center">
                  <p className="text-xs font-semibold">{d.label}</p>
                  <Delta yours={d.yours} peer={d.peer} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Anonymity note */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pb-4">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          All benchmark data is anonymized by cohort. No individual schools are identified.
        </div>

      </div>
    </div>
  );
}
