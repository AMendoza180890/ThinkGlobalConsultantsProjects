import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from "recharts";
import {
  Users, UserMinus, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Info, Shield, GraduationCap, Briefcase, ArrowRight,
  Activity, Sparkles, RefreshCw, UserPlus, UserX, FlaskConical,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DimensionScore {
  dimension: string;
  field: string;
  score: number;
  lowLabel: string;
  highLabel: string;
}

interface StaffFingerprint {
  label: string;
  respondents: number;
  dimensions: DimensionScore[];
  dominantStyle: string;
  insight: string;
}

interface DepartureRecord {
  id: string;
  role: string;
  department: string;
  gradeLevel: "Elementary" | "Middle School" | "High School";
  departureMonth: string; // "YYYY-MM"
  status: "Left" | "On Leave";
  yearsAtSchool: number;
}

// ─── Dimension metadata ───────────────────────────────────────────────────────

const DIMENSION_META: Omit<DimensionScore, "score">[] = [
  { dimension: "Power Distance",      field: "powerDistance",           lowLabel: "Egalitarian",  highLabel: "Hierarchical" },
  { dimension: "Risk Tolerance",      field: "riskTolerance",           lowLabel: "Risk-Averse",  highLabel: "Flexible" },
  { dimension: "Decision Speed",      field: "decisionSpeed",           lowLabel: "Deliberate",   highLabel: "Fast" },
  { dimension: "Communication Style", field: "communicationStyle",      lowLabel: "Indirect",     highLabel: "Direct" },
  { dimension: "Group vs Individual", field: "individualismCollectivism",lowLabel: "Individual",  highLabel: "Group-Focused" },
];

function makeDimensions(scores: number[]): DimensionScore[] {
  return DIMENSION_META.map((meta, i) => ({ ...meta, score: scores[i] }));
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// Privacy rule: groups of <5 are suppressed in real data; mock has ≥5 per segment.

const CURRENT_STAFF: StaffFingerprint = {
  label: "Current Staff",
  respondents: 38,
  dimensions: makeDimensions([38, 61, 55, 72, 44]),
  dominantStyle: "Direct communicators who prefer flexibility over rigid plans",
  insight: "Current staff lean direct and risk-tolerant, with moderate hierarchy preference. The egalitarian tendency sets them apart from admin and from the staff who departed last year.",
};

const DEPARTED_STAFF: StaffFingerprint = {
  label: "Departed Staff (Last 12 Months)",
  respondents: 9,
  dimensions: makeDimensions([27, 74, 72, 83, 31]),
  dominantStyle: "Very direct, fast decision-makers, low hierarchy preference",
  insight: "Departing staff were the most direct, fastest-moving, and most egalitarian in the school — the highest-friction profile against admin. Their exit may signal a structural alignment problem rather than individual fit issues.",
};

const ADMIN_FINGERPRINT: StaffFingerprint = {
  label: "Administration",
  respondents: 8,
  dimensions: makeDimensions([74, 36, 30, 48, 68]),
  dominantStyle: "Hierarchical, deliberate, group-focused, moderately indirect",
  insight: "Admin lean strongly hierarchical and slow in decision-making — the opposite of the teachers who left. These gaps are the root cause of most T↔Admin friction.",
};

// Departed staff by department (suppress <5 — shown as "Suppressed")
const DEPT_DEPARTED: Array<{ dept: string; count: number; suppressed: boolean; fingerprint?: StaffFingerprint }> = [
  {
    dept: "STEM", count: 4, suppressed: true,
  },
  {
    dept: "Humanities", count: 3, suppressed: true,
  },
  {
    dept: "Arts & PE", count: 2, suppressed: true,
  },
  // Combined view: all 9 departures used for aggregate
];

// Monthly departure trend (last 12 months)
const DEPARTURE_TREND = [
  { month: "Apr '25", departures: 0, onLeave: 0 },
  { month: "May '25", departures: 1, onLeave: 0 },
  { month: "Jun '25", departures: 3, onLeave: 1 },
  { month: "Jul '25", departures: 2, onLeave: 0 },
  { month: "Aug '25", departures: 0, onLeave: 1 },
  { month: "Sep '25", departures: 1, onLeave: 0 },
  { month: "Oct '25", departures: 0, onLeave: 0 },
  { month: "Nov '25", departures: 0, onLeave: 1 },
  { month: "Dec '25", departures: 1, onLeave: 0 },
  { month: "Jan '26", departures: 0, onLeave: 0 },
  { month: "Feb '26", departures: 1, onLeave: 0 },
  { month: "Mar '26", departures: 0, onLeave: 0 },
];

// Friction heatmap data: cultural distance per dimension, current vs departed
// Value = absolute gap between current staff and departed staff scores
const FRICTION_HEATMAP = DIMENSION_META.map((meta, i) => ({
  dimension: meta.dimension.replace(" Style", "").replace(" Distance", "").replace(" Tolerance", "").replace(" Speed", ""),
  currentScore: CURRENT_STAFF.dimensions[i].score,
  departedScore: DEPARTED_STAFF.dimensions[i].score,
  gap: Math.abs(CURRENT_STAFF.dimensions[i].score - DEPARTED_STAFF.dimensions[i].score),
  adminGap: Math.abs(DEPARTED_STAFF.dimensions[i].score - ADMIN_FINGERPRINT.dimensions[i].score),
}));

// Tenure breakdown of departures
const TENURE_BREAKDOWN = [
  { band: "0–2 Years", count: 4 },
  { band: "3–5 Years", count: 3 },
  { band: "6–10 Years", count: 2 },
  { band: "10+ Years", count: 0 },
];

// Grade level breakdown
const LEVEL_BREAKDOWN = [
  { level: "Elementary", count: 2 },
  { level: "Middle School", count: 3 },
  { level: "High School", count: 4 },
];

// ─── What-If Archetypes ───────────────────────────────────────────────────────
// Anonymous groups — no individual data, only aggregate cultural profiles.
// "weight" = how many teacher-equivalents this archetype represents (1 = one teacher).

interface Archetype {
  id: string;
  label: string;           // e.g. "Hire: Collaborative Integrator"
  type: "hire" | "departure";
  role: string;
  department: string;
  gradeLevel: string;
  weight: number;          // number of teachers this archetype adds/removes
  dimensions: number[];    // [PD, Risk, Speed, Comm, Group] scores 0–100
  description: string;
}

const HIRE_ARCHETYPES: Archetype[] = [
  {
    id: "h1",
    label: "Collaborative Integrator",
    type: "hire",
    role: "Teacher",
    department: "Humanities",
    gradeLevel: "High School",
    weight: 1,
    dimensions: [42, 58, 50, 65, 62],
    description: "Balanced communicator, moderate on all dimensions — close to school-wide average. Strong alignment candidate.",
  },
  {
    id: "h2",
    label: "Structured Traditionalist",
    type: "hire",
    role: "Teacher",
    department: "Admin & Support",
    gradeLevel: "Elementary",
    weight: 1,
    dimensions: [68, 38, 34, 50, 70],
    description: "Hierarchical, deliberate, group-focused — aligns well with admin but may clash with newer direct-communication staff.",
  },
  {
    id: "h3",
    label: "Agile Innovator",
    type: "hire",
    role: "Teacher",
    department: "STEM",
    gradeLevel: "High School",
    weight: 1,
    dimensions: [25, 78, 80, 85, 28],
    description: "Very direct, fast, and egalitarian. High alignment risk with admin — mirrors the profile of recently departed staff.",
  },
  {
    id: "h4",
    label: "Adaptive Facilitator",
    type: "hire",
    role: "Teacher",
    department: "Arts & PE",
    gradeLevel: "Middle School",
    weight: 1,
    dimensions: [36, 64, 58, 70, 55],
    description: "Direct with moderate flexibility. Sits comfortably between current staff and admin — a likely friction-reducer.",
  },
  {
    id: "h5",
    label: "Consensus Builder",
    type: "hire",
    role: "Teacher",
    department: "Humanities",
    gradeLevel: "Elementary",
    weight: 1,
    dimensions: [50, 50, 44, 56, 66],
    description: "Moderate on all axes, slightly group-focused and deliberate. Good cultural bridge between departments.",
  },
];

const DEPARTURE_ARCHETYPES: Archetype[] = [
  {
    id: "d1",
    label: "Senior STEM Teacher",
    type: "departure",
    role: "Senior Teacher",
    department: "STEM",
    gradeLevel: "High School",
    weight: 1,
    dimensions: [44, 65, 70, 62, 38],
    description: "Fast-moving, flexible STEM profile. Losing this archetype slightly reduces the school's risk tolerance and decision speed.",
  },
  {
    id: "d2",
    label: "Mid-Career Humanities Teacher",
    type: "departure",
    role: "Teacher",
    department: "Humanities",
    gradeLevel: "Middle School",
    weight: 1,
    dimensions: [41, 63, 57, 74, 48],
    description: "Close to school-wide average. Departure has minimal fingerprint impact but reduces team stability.",
  },
  {
    id: "d3",
    label: "New Teacher (0–2 Yrs)",
    type: "departure",
    role: "Teacher",
    department: "Multiple",
    gradeLevel: "High School",
    weight: 1,
    dimensions: [28, 70, 68, 78, 36],
    description: "Most direct, fast, and egalitarian profile. Losing multiple new teachers has a measurable moderating effect on the school's directness score.",
  },
  {
    id: "d4",
    label: "Veteran Teacher (10+ Yrs)",
    type: "departure",
    role: "Senior Teacher",
    department: "Multiple",
    gradeLevel: "Elementary",
    weight: 1,
    dimensions: [62, 42, 38, 58, 61],
    description: "Hierarchical and deliberate. Departure shifts the school fingerprint toward more egalitarian, faster styles.",
  },
];

// ─── Simulation engine ────────────────────────────────────────────────────────

// Weighted average fingerprint: start with current staff baseline, add hires, subtract departures.
// Returns null if simulation group is empty (no changes selected).
function computeSimulatedFingerprint(
  baseline: StaffFingerprint,
  selectedHires: Archetype[],
  selectedDepartures: Archetype[],
): StaffFingerprint {
  const baseCount = baseline.respondents;
  const addedWeight = selectedHires.reduce((s, a) => s + a.weight, 0);
  const removedWeight = selectedDepartures.reduce((s, a) => s + a.weight, 0);
  const netCount = Math.max(baseCount + addedWeight - removedWeight, 1);

  const newScores = DIMENSION_META.map((_, i) => {
    let weightedSum = baseline.dimensions[i].score * baseCount;
    selectedHires.forEach((a) => { weightedSum += a.dimensions[i] * a.weight; });
    selectedDepartures.forEach((a) => { weightedSum -= a.dimensions[i] * a.weight; });
    return Math.max(0, Math.min(100, Math.round(weightedSum / netCount)));
  });

  return {
    label: "Simulated Staff",
    respondents: netCount,
    dimensions: makeDimensions(newScores),
    dominantStyle: "Projected after simulation changes",
    insight: "Projected aggregate fingerprint based on selected hypothetical hires and departures.",
  };
}

// Friction likelihood: average gap between simulated fingerprint and admin, scaled to 0–100%.
function computeFrictionLikelihood(fp: StaffFingerprint, against: StaffFingerprint = ADMIN_FINGERPRINT): number {
  const avgGap = fp.dimensions.reduce((s, d, i) => s + Math.abs(d.score - against.dimensions[i].score), 0) / fp.dimensions.length;
  // Scale: gap of 0 → 5% baseline friction, gap of 50+ → 90%
  return Math.min(90, Math.round(5 + (avgGap / 50) * 85));
}

// CQ health: inverse of friction likelihood, bounded 0–100
function computeCQHealth(frictionLikelihood: number): number {
  return Math.max(0, 100 - frictionLikelihood);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gapColor(gap: number): string {
  if (gap >= 30) return "#264653";
  if (gap >= 15) return "#4db8b8";
  return "#2a9d8f";
}

function gapLabel(gap: number): { label: string; variant: "destructive" | "secondary" | "outline" } {
  if (gap >= 30) return { label: "High Friction", variant: "destructive" };
  if (gap >= 15) return { label: "Moderate", variant: "secondary" };
  return { label: "Aligned", variant: "outline" };
}

function scoreColor(score: number) {
  if (score >= 70) return "#1a7a7a";
  if (score >= 45) return "#4db8b8";
  return "#2a9d8f";
}

function scoreBadge(score: number, lowLabel: string, highLabel: string) {
  if (score >= 65) return { label: highLabel, variant: "default" as const };
  if (score <= 35) return { label: lowLabel, variant: "secondary" as const };
  return { label: "Balanced", variant: "outline" as const };
}

function DeltaBadge({ current, departed }: { current: number; departed: number }) {
  const diff = Math.round(departed - current);
  if (Math.abs(diff) < 5) return <Minus className="h-3 w-3 text-muted-foreground inline" />;
  return diff > 0
    ? <span className="text-xs font-semibold text-violet-500 inline-flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />+{diff}</span>
    : <span className="text-xs font-semibold text-emerald-500 inline-flex items-center gap-0.5"><TrendingDown className="h-3 w-3" />{diff}</span>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-foreground",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PrivacyBanner() {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 text-sm text-blue-700 dark:text-blue-300">
      <Shield className="h-4 w-4 mt-0.5 shrink-0" />
      <span>
        <strong>Privacy protected:</strong> Individual cultural data is never shown. Groups of fewer than 5 teachers are suppressed. All views display aggregates only.
      </span>
    </div>
  );
}

function ComparisonRadar({
  current,
  departed,
}: {
  current: StaffFingerprint;
  departed: StaffFingerprint;
}) {
  const radarData = current.dimensions.map((d, i) => ({
    dimension: d.dimension.replace(" Style", "").replace(" Distance", "").replace(" Tolerance", "").replace(" Speed", ""),
    current: d.score,
    departed: departed.dimensions[i].score,
    admin: ADMIN_FINGERPRINT.dimensions[i].score,
  }));

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Cultural Alignment — Current vs Departed vs Admin
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-w-md">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Current Staff" dataKey="current" stroke="#1a7a7a" fill="#1a7a7a" fillOpacity={0.2} strokeWidth={2} />
            <Radar name="Departed Staff" dataKey="departed" stroke="#264653" fill="#264653" fillOpacity={0.12} strokeWidth={2} strokeDasharray="4 4" />
            <Radar name="Administration" dataKey="admin" stroke="#4db8b8" fill="#4db8b8" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="2 4" />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <RechartsTooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              formatter={(v: number) => [`${v}`, ""]}
            />
          </RadarChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}


function FrictionHeatmap() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          Alignment Heatmap — Cultural Distance by Dimension
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                Gap = absolute difference in dimension score between groups. Gaps ≥30 indicate high friction risk; ≥15 moderate.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pb-1">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Aligned (&lt;15)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Moderate (15–29)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> High Friction (≥30)</span>
          </div>

          {/* Heatmap rows */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 gap-y-2 items-center">
            {/* Header */}
            <span className="text-xs font-semibold text-muted-foreground">Dimension</span>
            <span className="text-xs font-semibold text-muted-foreground text-center">Current</span>
            <span className="text-xs font-semibold text-muted-foreground text-center">Departed</span>
            <span className="text-xs font-semibold text-muted-foreground text-center w-20">Gap</span>
            <span className="text-xs font-semibold text-muted-foreground text-center">Risk</span>

            {FRICTION_HEATMAP.map((row) => {
              const { label, variant } = gapLabel(row.gap);
              return (
                <>
                  <span key={`dim-${row.dimension}`} className="text-sm">{row.dimension}</span>
                  <span key={`cur-${row.dimension}`} className="text-sm font-semibold text-center tabular-nums" style={{ color: scoreColor(row.currentScore) }}>{row.currentScore}</span>
                  <span key={`dep-${row.dimension}`} className="text-sm font-semibold text-center tabular-nums" style={{ color: scoreColor(row.departedScore) }}>{row.departedScore}</span>
                  <div key={`gap-${row.dimension}`} className="flex items-center gap-2 w-20">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(row.gap, 100)}%`, backgroundColor: gapColor(row.gap) }}
                      />
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: gapColor(row.gap) }}>{row.gap}</span>
                  </div>
                  <Badge key={`badge-${row.dimension}`} variant={variant} className="text-[10px] py-0 h-5 justify-center">{label}</Badge>
                </>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DepartureTrendChart() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Departure Trend — Last 12 Months
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={DEPARTURE_TREND} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="departures" stroke="#264653" strokeWidth={2} dot={{ r: 4 }} name="Departures" />
            <Line type="monotone" dataKey="onLeave" stroke="#4db8b8" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" name="On Leave" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function BreakdownBars({
  data,
  labelKey,
  countKey = "count",
  title,
  icon: Icon,
  total,
}: {
  data: Record<string, unknown>[];
  labelKey: string;
  countKey?: string;
  title: string;
  icon: React.ElementType;
  total: number;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((row) => {
          const label = row[labelKey] as string;
          const count = row[countKey] as number;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span className="font-semibold tabular-nums">{count} <span className="text-muted-foreground font-normal text-xs">({pct}%)</span></span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function DimensionDeepDive({ fp, compare, compareLabel }: { fp: StaffFingerprint; compare: StaffFingerprint; compareLabel: string }) {
  return (
    <div className="space-y-4">
      {fp.dimensions.map((d, i) => {
        const badge = scoreBadge(d.score, d.lowLabel, d.highLabel);
        const compareDim = compare.dimensions[i];
        const gap = Math.abs(d.score - compareDim.score);
        const { label: riskLabel, variant: riskVariant } = gapLabel(gap);
        return (
          <div key={d.field} className="p-4 rounded-xl border border-border/50 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-semibold cursor-help">{d.dimension}</span>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs max-w-[180px]">
                      <p><strong>Low (0):</strong> {d.lowLabel}</p>
                      <p><strong>High (100):</strong> {d.highLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Badge variant={badge.variant} className="text-[10px] py-0 h-4">{badge.label}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={riskVariant} className="text-[10px] py-0 h-5">{riskLabel}</Badge>
                <span className="text-xs text-muted-foreground">Gap: <strong style={{ color: gapColor(gap) }}>{gap}</strong></span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[{ label: fp.label, score: d.score, color: "#1a7a7a" }, { label: compareLabel, score: compareDim.score, color: "#264653" }].map(({ label, score, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{label}</span>
                    <span className="font-bold" style={{ color }}>{score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>{d.lowLabel}</span><span>{d.highLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Overview Panel ───────────────────────────────────────────────────────────

function OverviewPanel() {
  const totalDepartures = DEPARTURE_TREND.reduce((s, m) => s + m.departures, 0);
  const onLeaveCount = DEPARTURE_TREND.reduce((s, m) => s + m.onLeave, 0);
  const highFrictionDims = FRICTION_HEATMAP.filter(r => r.gap >= 30).length;
  const avgGap = Math.round(FRICTION_HEATMAP.reduce((s, r) => s + r.gap, 0) / FRICTION_HEATMAP.length);

  return (
    <div className="space-y-6">
      <PrivacyBanner />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Current Active Staff" value={CURRENT_STAFF.respondents} sub="fingerprint respondents" />
        <StatCard icon={UserMinus} label="Departures (12 mo)" value={totalDepartures} sub="left the school" color="text-red-500" />
        <StatCard icon={Activity} label="On Leave" value={onLeaveCount} sub="currently on leave" color="text-amber-500" />
        <StatCard icon={AlertTriangle} label="High-Friction Dimensions" value={`${highFrictionDims} / 5`} sub={`avg gap: ${avgGap} pts`} color={highFrictionDims >= 3 ? "text-red-500" : "text-amber-500"} />
      </div>

      {/* Current fingerprint summary */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Current School Fingerprint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="text-xs">{CURRENT_STAFF.respondents} respondents</Badge>
            <span className="text-muted-foreground">{CURRENT_STAFF.dominantStyle}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {CURRENT_STAFF.dimensions.map((d) => {
              const badge = scoreBadge(d.score, d.lowLabel, d.highLabel);
              return (
                <div key={d.field} className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">{d.dimension}</span>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.score}%`, backgroundColor: scoreColor(d.score) }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant={badge.variant} className="text-[9px] py-0 h-3.5">{badge.label}</Badge>
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: scoreColor(d.score) }}>{d.score}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{CURRENT_STAFF.insight}</p>
          </div>
        </CardContent>
      </Card>

      {/* Friction summary */}
      <FrictionHeatmap />

      {/* Departure trend */}
      <DepartureTrendChart />
    </div>
  );
}

// ─── Friction Comparison Stats ────────────────────────────────────────────────

const FRICTION_TIME_DATA = {
  "3m":  { departedHours: 187,  currentHours: 42,  departedGroups: 6,  currentGroups: 18 },
  "6m":  { departedHours: 374,  currentHours: 83,  departedGroups: 6,  currentGroups: 18 },
  "12m": { departedHours: 747,  currentHours: 167, departedGroups: 6,  currentGroups: 18 },
  "24m": { departedHours: 1494, currentHours: 334, departedGroups: 6,  currentGroups: 18 },
};

function FrictionComparisonStats() {
  const [period, setPeriod] = useState<"3m" | "6m" | "12m" | "24m">("12m");
  const data = FRICTION_TIME_DATA[period];

  const highGap = FRICTION_HEATMAP.filter(r => r.gap >= 25);
  const lowGap  = FRICTION_HEATMAP.filter(r => r.gap < 25);
  const departedAvgGap = Math.round(highGap.reduce((s, r) => s + r.gap, 0) / Math.max(highGap.length, 1));
  const currentAvgGap  = Math.round(lowGap.reduce((s, r) => s + r.gap, 0)  / Math.max(lowGap.length, 1));

  const periodLabel = { "3m": "3 months", "6m": "6 months", "12m": "12 months", "24m": "2 years" }[period];

  return (
    <Card className="border-border/50 h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Friction Cost
          </CardTitle>
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 months</SelectItem>
              <SelectItem value="6m">6 months</SelectItem>
              <SelectItem value="12m">12 months</SelectItem>
              <SelectItem value="24m">2 years</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Departed staff experienced <strong>4.5× more friction</strong> than retained staff over {periodLabel}.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-1">
        {/* Departed */}
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3 space-y-2">
          <p className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">Departed Staff</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Est. Friction / Period</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data.departedHours.toLocaleString()}h</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Avg Cultural Gap</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{departedAvgGap} pts</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">{data.departedGroups} high-gap dimension groups (≥25 pts)</p>
        </div>

        {/* Current */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 p-3 space-y-2">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Current Staff</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Est. Friction / Period</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.currentHours.toLocaleString()}h</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Avg Cultural Gap</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{currentAvgGap} pts</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">{data.currentGroups} lower-gap dimension groups (&lt;25 pts)</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Turnover Insights Panel ──────────────────────────────────────────────────

function TurnoverInsightsPanel() {
  return (
    <div className="space-y-6">
      <PrivacyBanner />

      {/* Radar + friction stats side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        <ComparisonRadar current={CURRENT_STAFF} departed={DEPARTED_STAFF} />
        <FrictionComparisonStats />
      </div>
    </div>
  );
}

// ─── What-If Simulation Panel ─────────────────────────────────────────────────

function ScoreDelta({ baseline, simulated }: { baseline: number; simulated: number }) {
  const diff = simulated - baseline;
  if (Math.abs(diff) < 2) return <span className="text-xs text-muted-foreground">no change</span>;
  return diff > 0
    ? <span className="text-xs font-semibold text-violet-500 inline-flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />+{diff}</span>
    : <span className="text-xs font-semibold text-emerald-500 inline-flex items-center gap-0.5"><TrendingDown className="h-3 w-3" />{diff}</span>;
}

function ArchetypeCard({
  archetype,
  selected,
  onToggle,
}: {
  archetype: Archetype;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const isHire = archetype.type === "hire";
  return (
    <label
      htmlFor={archetype.id}
      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
        selected
          ? isHire
            ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
            : "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/30"
          : "border-border/60 hover:border-border"
      }`}
    >
      <Checkbox
        id={archetype.id}
        checked={selected}
        onCheckedChange={() => onToggle(archetype.id)}
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{archetype.label}</span>
          <Badge
            variant={isHire ? "outline" : "destructive"}
            className={`text-[10px] py-0 h-4 ${isHire ? "border-emerald-400 text-emerald-700 dark:text-emerald-300" : ""}`}
          >
            {isHire ? "Potential Hire" : "Potential Departure"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
          <span>{archetype.role}</span>
          <span>·</span>
          <span>{archetype.department}</span>
          <span>·</span>
          <span>{archetype.gradeLevel}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{archetype.description}</p>
        {/* Mini dimension bars */}
        <div className="grid grid-cols-5 gap-1 pt-1">
          {DIMENSION_META.map((meta, i) => (
            <div key={meta.field} className="flex flex-col gap-0.5">
              <span className="text-[9px] text-muted-foreground truncate">{meta.dimension.split(" ")[0]}</span>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${archetype.dimensions[i]}%`, backgroundColor: scoreColor(archetype.dimensions[i]) }}
                />
              </div>
              <span className="text-[9px] font-semibold tabular-nums" style={{ color: scoreColor(archetype.dimensions[i]) }}>
                {archetype.dimensions[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </label>
  );
}

function SimulationResults({
  baseline,
  simulated,
}: {
  baseline: StaffFingerprint;
  simulated: StaffFingerprint;
}) {
  const baselineFriction = computeFrictionLikelihood(baseline);
  const simulatedFriction = computeFrictionLikelihood(simulated);
  const baselineCQ = computeCQHealth(baselineFriction);
  const simulatedCQ = computeCQHealth(simulatedFriction);
  const frictionDelta = simulatedFriction - baselineFriction;
  const cqDelta = simulatedCQ - baselineCQ;

  const radarData = baseline.dimensions.map((d, i) => ({
    dimension: d.dimension.replace(" Style", "").replace(" Distance", "").replace(" Tolerance", "").replace(" Speed", ""),
    baseline: d.score,
    simulated: simulated.dimensions[i].score,
    admin: ADMIN_FINGERPRINT.dimensions[i].score,
  }));

  return (
    <div className="space-y-6">
      {/* Score summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Staff count */}
        <Card className="border-border/50">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Net Staff Count</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-bold">{simulated.respondents}</span>
              <span className="text-sm text-muted-foreground mb-0.5">
                (was {baseline.respondents})
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {simulated.respondents > baseline.respondents ? `+${simulated.respondents - baseline.respondents} net hire(s)` :
               simulated.respondents < baseline.respondents ? `−${baseline.respondents - simulated.respondents} net departure(s)` :
               "no net change"}
            </p>
          </CardContent>
        </Card>

        {/* Friction likelihood */}
        <Card className={`border-2 ${frictionDelta > 5 ? "border-red-400 dark:border-red-700" : frictionDelta < -5 ? "border-emerald-400 dark:border-emerald-700" : "border-border/50"}`}>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Friction Likelihood
            </p>
            <div className="flex items-end gap-2 mt-1">
              <span className={`text-3xl font-bold ${simulatedFriction >= 60 ? "text-red-500" : simulatedFriction >= 35 ? "text-amber-500" : "text-emerald-500"}`}>
                {simulatedFriction}%
              </span>
              <span className={`text-sm mb-0.5 font-semibold ${frictionDelta > 0 ? "text-red-500" : frictionDelta < 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                {frictionDelta > 0 ? `▲ +${frictionDelta}%` : frictionDelta < 0 ? `▼ ${frictionDelta}%` : "no change"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">was {baselineFriction}% with current staff</p>
          </CardContent>
        </Card>

        {/* CQ health */}
        <Card className={`border-2 ${cqDelta < -5 ? "border-red-400 dark:border-red-700" : cqDelta > 5 ? "border-emerald-400 dark:border-emerald-700" : "border-border/50"}`}>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> CQ Health Score
            </p>
            <div className="flex items-end gap-2 mt-1">
              <span className={`text-3xl font-bold ${simulatedCQ >= 65 ? "text-emerald-500" : simulatedCQ >= 40 ? "text-amber-500" : "text-red-500"}`}>
                {simulatedCQ}
              </span>
              <span className={`text-sm mb-0.5 font-semibold ${cqDelta > 0 ? "text-emerald-500" : cqDelta < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                {cqDelta > 0 ? `▲ +${cqDelta}` : cqDelta < 0 ? `▼ ${cqDelta}` : "no change"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">was {baselineCQ} with current staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Radar */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Projected Fingerprint — Baseline vs Simulated vs Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Baseline" dataKey="baseline" stroke="#1a7a7a" fill="#1a7a7a" fillOpacity={0.15} strokeWidth={2} strokeDasharray="4 4" />
              <Radar name="Simulated" dataKey="simulated" stroke="#2a9d8f" fill="#2a9d8f" fillOpacity={0.25} strokeWidth={2.5} />
              <Radar name="Administration" dataKey="admin" stroke="#4db8b8" fill="#4db8b8" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="2 4" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <RechartsTooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                formatter={(v: number) => [`${v}`, ""]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Dimension delta table */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Projected Dimension Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 gap-y-3 items-center">
            <span className="text-xs font-semibold text-muted-foreground">Dimension</span>
            <span className="text-xs font-semibold text-muted-foreground text-center">Baseline</span>
            <span className="text-xs font-semibold text-muted-foreground text-center">Simulated</span>
            <span className="text-xs font-semibold text-muted-foreground text-center">Change</span>
            <span className="text-xs font-semibold text-muted-foreground text-center">Admin Gap</span>

            {baseline.dimensions.map((d, i) => {
              const sim = simulated.dimensions[i];
              const adminGap = Math.abs(sim.score - ADMIN_FINGERPRINT.dimensions[i].score);
              const { label: riskLabel, variant: riskVariant } = gapLabel(adminGap);
              return (
                <>
                  <span key={`dim-${d.field}`} className="text-sm">{d.dimension}</span>
                  <span key={`base-${d.field}`} className="text-sm font-semibold text-center tabular-nums" style={{ color: scoreColor(d.score) }}>{d.score}</span>
                  <span key={`sim-${d.field}`} className="text-sm font-bold text-center tabular-nums" style={{ color: scoreColor(sim.score) }}>{sim.score}</span>
                  <div key={`delta-${d.field}`} className="text-center">
                    <ScoreDelta baseline={d.score} simulated={sim.score} />
                  </div>
                  <div key={`risk-${d.field}`} className="text-center">
                    <Badge variant={riskVariant} className="text-[10px] py-0 h-5">{riskLabel}</Badge>
                  </div>
                </>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Narrative insight */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
        frictionDelta > 5
          ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
          : frictionDelta < -5
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
          : "border-primary/20 bg-primary/5"
      }`}>
        <Info className={`h-4 w-4 mt-0.5 shrink-0 ${frictionDelta > 5 ? "text-red-500" : frictionDelta < -5 ? "text-emerald-500" : "text-primary"}`} />
        <div className="space-y-1">
          <p className={`text-sm font-semibold ${frictionDelta > 5 ? "text-red-700 dark:text-red-300" : frictionDelta < -5 ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"}`}>
            {frictionDelta > 5
              ? "Warning: Simulation increases friction risk"
              : frictionDelta < -5
              ? "Positive: Simulation reduces friction risk"
              : "Simulation has minimal impact on cultural alignment"}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {frictionDelta > 5
              ? `The selected combination pushes the school fingerprint further from admin's profile on key dimensions. Friction likelihood rises by ${frictionDelta}%. Consider pairing these hires with structured onboarding that bridges the communication and hierarchy gap.`
              : frictionDelta < -5
              ? `The selected combination moves the school fingerprint closer to a balanced midpoint. Friction likelihood drops by ${Math.abs(frictionDelta)}%. These changes may help reduce T↔Admin friction over time.`
              : "The selected changes have a small net effect on cultural alignment. Monitor CQ survey data over the next quarter to detect any shift in friction patterns."}
          </p>
        </div>
      </div>
    </div>
  );
}

function WhatIfPanel() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setSelectedIds(new Set());
  }

  const selectedHires = HIRE_ARCHETYPES.filter((a) => selectedIds.has(a.id));
  const selectedDepartures = DEPARTURE_ARCHETYPES.filter((a) => selectedIds.has(a.id));
  const hasSelection = selectedIds.size > 0;

  const simulated = useMemo(
    () => computeSimulatedFingerprint(CURRENT_STAFF, selectedHires, selectedDepartures),
    [selectedHires, selectedDepartures],
  );

  return (
    <div className="space-y-6">
      {/* Privacy + explainer */}
      <PrivacyBanner />
      <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <FlaskConical className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">How the simulation works</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select any combination of hypothetical hires or departures below. The simulator recalculates the school's aggregate cultural fingerprint, predicted friction likelihood, and CQ health score in real time. All archetypes are anonymous — no individual profiles are used or revealed.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left: selection panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-500" />
              Potential Hires
            </h3>
            <Badge variant="outline" className="text-xs">{selectedHires.length} selected</Badge>
          </div>
          <div className="space-y-2">
            {HIRE_ARCHETYPES.map((a) => (
              <ArchetypeCard key={a.id} archetype={a} selected={selectedIds.has(a.id)} onToggle={toggle} />
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              Hypothetical Departures
            </h3>
            <Badge variant="outline" className="text-xs">{selectedDepartures.length} selected</Badge>
          </div>
          <div className="space-y-2">
            {DEPARTURE_ARCHETYPES.map((a) => (
              <ArchetypeCard key={a.id} archetype={a} selected={selectedIds.has(a.id)} onToggle={toggle} />
            ))}
          </div>

          {hasSelection && (
            <Button variant="outline" size="sm" onClick={reset} className="w-full gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Simulation
            </Button>
          )}
        </div>

        {/* Right: results */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Projected Outcomes
            {hasSelection && (
              <Badge className="text-xs bg-primary text-primary-foreground">Live</Badge>
            )}
          </h3>
          {!hasSelection ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border border-dashed border-border text-muted-foreground space-y-3">
              <FlaskConical className="h-8 w-8 opacity-30" />
              <p className="text-sm">Select one or more hires or departures on the left to see projected outcomes.</p>
            </div>
          ) : (
            <SimulationResults baseline={CURRENT_STAFF} simulated={simulated} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CQ Dimension Trend Data ──────────────────────────────────────────────────

const CQ_QUADRANTS = [
  {
    key: "drive",
    label: "CQ Drive",
    description: "Motivation & confidence to engage cross-culturally",
    color: "#1a7a7a",
  },
  {
    key: "knowledge",
    label: "CQ Knowledge",
    description: "Understanding of cultural systems & differences",
    color: "#2a9d8f",
  },
  {
    key: "strategy",
    label: "CQ Strategy",
    description: "Awareness & planning in multicultural situations",
    color: "#4db8b8",
  },
  {
    key: "action",
    label: "CQ Action",
    description: "Ability to adapt behaviour across cultural contexts",
    color: "#2a9d8f",
  },
];

type CQKey = "drive" | "knowledge" | "strategy" | "action";

const CQ_TREND_DATA: Record<CQKey, { month: string; current: number; departed: number }[]> = {
  drive: [
    {month:"Apr '25",current:62,departed:78},{month:"May '25",current:63,departed:79},
    {month:"Jun '25",current:63,departed:80},{month:"Jul '25",current:64,departed:81},
    {month:"Aug '25",current:64,departed:81},{month:"Sep '25",current:65,departed:82},
    {month:"Oct '25",current:65,departed:82},{month:"Nov '25",current:65,departed:83},
    {month:"Dec '25",current:66,departed:83},{month:"Jan '26",current:66,departed:83},
    {month:"Feb '26",current:66,departed:84},{month:"Mar '26",current:67,departed:84},
  ],
  knowledge: [
    {month:"Apr '25",current:55,departed:71},{month:"May '25",current:55,departed:72},
    {month:"Jun '25",current:56,departed:72},{month:"Jul '25",current:56,departed:73},
    {month:"Aug '25",current:57,departed:73},{month:"Sep '25",current:57,departed:74},
    {month:"Oct '25",current:57,departed:74},{month:"Nov '25",current:58,departed:74},
    {month:"Dec '25",current:58,departed:75},{month:"Jan '26",current:58,departed:75},
    {month:"Feb '26",current:59,departed:75},{month:"Mar '26",current:59,departed:76},
  ],
  strategy: [
    {month:"Apr '25",current:48,departed:66},{month:"May '25",current:49,departed:66},
    {month:"Jun '25",current:49,departed:67},{month:"Jul '25",current:50,departed:68},
    {month:"Aug '25",current:50,departed:68},{month:"Sep '25",current:51,departed:69},
    {month:"Oct '25",current:51,departed:69},{month:"Nov '25",current:51,departed:70},
    {month:"Dec '25",current:52,departed:70},{month:"Jan '26",current:52,departed:71},
    {month:"Feb '26",current:52,departed:71},{month:"Mar '26",current:53,departed:72},
  ],
  action: [
    {month:"Apr '25",current:57,departed:73},{month:"May '25",current:57,departed:74},
    {month:"Jun '25",current:58,departed:74},{month:"Jul '25",current:58,departed:75},
    {month:"Aug '25",current:59,departed:75},{month:"Sep '25",current:59,departed:76},
    {month:"Oct '25",current:60,departed:76},{month:"Nov '25",current:60,departed:77},
    {month:"Dec '25",current:60,departed:77},{month:"Jan '26",current:61,departed:78},
    {month:"Feb '26",current:61,departed:78},{month:"Mar '26",current:61,departed:79},
  ],
};

const TIME_OPTIONS = [
  { label: "3 Months", value: "3m", months: 3 },
  { label: "6 Months", value: "6m", months: 6 },
  { label: "12 Months", value: "12m", months: 12 },
];

// ─── CQ Trend Charts ──────────────────────────────────────────────────────────

function CQTrendCharts() {
  const [range, setRange] = useState<"3m" | "6m" | "12m">("12m");
  const months = TIME_OPTIONS.find((o) => o.value === range)!.months;

  return (
    <div className="space-y-6">
      {/* Time selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium">Time range:</span>
        <div className="flex gap-1">
          {TIME_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={range === opt.value ? "default" : "outline"}
              className="h-7 px-3 text-xs"
              onClick={() => setRange(opt.value as "3m" | "6m" | "12m")}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* One chart per CQ quadrant in a 2-col grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {CQ_QUADRANTS.map((q) => {
          const allData = CQ_TREND_DATA[q.key as CQKey];
          const data = allData.slice(-months);
          const last = data.at(-1)!;
          const gap = Math.abs(last.current - last.departed);
          return (
            <Card key={q.key} className="border-border/50">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: q.color }}>
                    {q.label}
                  </CardTitle>
                  <span
                    className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: gap >= 30 ? "hsl(0 85% 95%)" : gap >= 15 ? "hsl(38 95% 95%)" : "hsl(142 70% 95%)",
                      color: gap >= 30 ? "hsl(0 72% 45%)" : gap >= 15 ? "hsl(38 92% 40%)" : "hsl(142 60% 35%)",
                    }}
                  >
                    Gap: {gap}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{q.description}</p>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 inline-block rounded" style={{ background: q.color }} /> Current</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 inline-block rounded bg-red-400" style={{ borderTop: "2px dashed #f87171" }} /> Departed</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                      formatter={(v: number, name: string) => [v, name === "current" ? "Current Staff" : "Departed Staff"]}
                    />
                    <Line type="monotone" dataKey="current" stroke={q.color} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="departed" stroke="#f87171" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Composition Panel ───────────────────────────────────────────────────────

function TurnoverCompositionPanel() {
  const totalDepartures = DEPARTURE_TREND.reduce((s, m) => s + m.departures, 0);
  return (
    <div className="space-y-6">
      <PrivacyBanner />
      <div className="grid gap-4 md:grid-cols-2">
        <BreakdownBars data={TENURE_BREAKDOWN} labelKey="band" title="Departures by Tenure" icon={Users} total={totalDepartures} />
        <BreakdownBars data={LEVEL_BREAKDOWN} labelKey="level" title="Departures by School Level" icon={GraduationCap} total={totalDepartures} />
      </div>
      <DepartureTrendChart />
      <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 flex items-start gap-2">
        <Shield className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Department-level departure fingerprints are suppressed — each department had fewer than 5 departures this year. Groups below 5 are hidden to protect individual privacy.
        </p>
      </div>
    </div>
  );
}

// ─── Alignment Panel ─────────────────────────────────────────────────────────

function TurnoverAlignmentPanel() {
  return (
    <div className="space-y-6">
      <PrivacyBanner />
      <div className="grid gap-4 md:grid-cols-2">
        <ComparisonRadar current={CURRENT_STAFF} departed={DEPARTED_STAFF} />
        <FrictionComparisonStats />
      </div>
      <FrictionHeatmap />
    </div>
  );
}

// ─── Cost Panel ──────────────────────────────────────────────────────────────

const TURNOVER_COST = {
  replacementCost: "$18,400",
  frictionHours: 747,
  frictionCostMonthly: "$6,200",
  decisionDelay: "4.5d",
  avoidableMeetings: 14,
  totalEstimatedAnnual: "$24,600",
};

function TurnoverCostPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-red-50/80 dark:bg-red-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avg replacement cost / departure</p>
          <p className="mt-1 text-3xl font-bold text-red-700 dark:text-red-400">{TURNOVER_COST.replacementCost}</p>
          <p className="text-xs text-muted-foreground mt-1">Recruiting, onboarding, and productivity ramp</p>
        </div>
        <div className="rounded-xl border bg-amber-50/80 dark:bg-amber-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Friction hours / month</p>
          <p className="mt-1 text-3xl font-bold text-amber-700 dark:text-amber-400">{TURNOVER_COST.frictionHours}h</p>
          <p className="text-xs text-muted-foreground mt-1">Time lost to cultural misalignment across groups</p>
        </div>
        <div className="rounded-xl border bg-background/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Decision delay</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{TURNOVER_COST.decisionDelay}</p>
          <p className="text-xs text-muted-foreground mt-1">Avg lag before decisions feel settled</p>
        </div>
        <div className="rounded-xl border bg-background/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avoidable meetings / month</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{TURNOVER_COST.avoidableMeetings}</p>
          <p className="text-xs text-muted-foreground mt-1">Meetings existing mainly to repair misalignment</p>
        </div>
        <div className="rounded-xl border bg-background/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Est. friction cost / month</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{TURNOVER_COST.frictionCostMonthly}</p>
          <p className="text-xs text-muted-foreground mt-1">Illustrative cost of ongoing misalignment</p>
        </div>
        <div className="rounded-xl border bg-emerald-50/80 dark:bg-emerald-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total est. annual cost</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-400">{TURNOVER_COST.totalEstimatedAnnual}</p>
          <p className="text-xs text-muted-foreground mt-1">Departures + ongoing friction combined</p>
        </div>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/20 p-4">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Biggest cost driver
        </p>
        <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200">
          The largest share of cost is not replacement but ongoing friction between staff and admin — the cultural alignment gap means recurring time losses even after departures stabilise.
        </p>
      </div>
    </div>
  );
}

// ─── Wellness Panel ──────────────────────────────────────────────────────────

const WELLNESS_COMPARE = [
  { label: "Workload",             current: 5.8, departed: 7.9, higherIsBetter: false },
  { label: "Leadership Support",   current: 7.2, departed: 4.1, higherIsBetter: true  },
  { label: "Psychological Safety", current: 7.0, departed: 4.8, higherIsBetter: true  },
  { label: "Professional Growth",  current: 6.5, departed: 4.3, higherIsBetter: true  },
  { label: "Process Friction",     current: 5.1, departed: 8.2, higherIsBetter: false },
];

function TurnoverWellnessPanel() {
  return (
    <div className="space-y-4">
      <PrivacyBanner />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {WELLNESS_COMPARE.map((item) => {
          const currentBetter = item.higherIsBetter
            ? item.current >= item.departed
            : item.current <= item.departed;
          return (
            <Card key={item.label} className="border-border/50">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-600 font-medium">Current Staff</span>
                    <span className="font-bold tabular-nums">{item.current.toFixed(1)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(item.current / 10) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-500 font-medium">Departed Staff</span>
                    <span className="font-bold tabular-nums">{item.departed.toFixed(1)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-red-400" style={{ width: `${(item.departed / 10) * 100}%` }} />
                  </div>
                </div>
                <div className={`text-[11px] font-semibold rounded-full text-center py-0.5 ${currentBetter ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"}`}>
                  {currentBetter ? "Current staff healthier" : "Departed staff scored higher"}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="p-4 rounded-xl border bg-background/60">
        <p className="text-sm font-semibold">Wellness read</p>
        <p className="mt-1 text-sm text-muted-foreground">Departed staff reported significantly higher workload and process friction, and lower leadership support — the pattern is consistent with push-factor exits rather than pull-factor opportunities.</p>
      </div>
    </div>
  );
}

// ─── Next Steps Panel ────────────────────────────────────────────────────────

const NEXT_STEPS = [
  {
    rank: 1,
    title: "CQ Drive & Motivation — Retaining High-Drive Staff",
    description: "Understand why high-CQ-Drive staff disengage and what creates sustained motivation for proactive cultural engagement.",
    format: "Live",
    duration: "90 min",
    why: "Departed staff scored 17 pts higher on CQ Drive than current staff. High-drive staff need challenge and autonomy — misalignment here directly predicts voluntary exit.",
    match: 94,
  },
  {
    rank: 2,
    title: "Authority & Decision-Making Across Cultures",
    description: "How different cultural backgrounds shape expectations around hierarchy, sign-off, and who gets to decide what.",
    format: "Workshop",
    duration: "2 hrs",
    why: "The Power Distance gap between admin and departed staff is 47 pts — the single largest friction driver. This webinar directly addresses that gap.",
    match: 91,
  },
  {
    rank: 3,
    title: "Communication Norms & Direct vs Indirect Styles",
    description: "Bridge the gap between direct and indirect communicators without requiring anyone to compromise their cultural identity.",
    format: "Live",
    duration: "60 min",
    why: "Communication Style gap of 35 pts between admin and departed staff caused repeated misreads. Normalising both styles reduces friction without blame.",
    match: 88,
  },
  {
    rank: 4,
    title: "Pace of Change — Fast vs Deliberate Decision Cultures",
    description: "Practical tools for teams where some members want rapid decisions and others need consensus before moving.",
    format: "On-demand",
    duration: "45 min",
    why: "Decision Speed gap of 42 pts between admin and departed staff meant fast-movers felt blocked. Shared norms around pace reduce this friction significantly.",
    match: 85,
  },
];

function TurnoverNextStepsPanel() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-slate-50/70 dark:bg-slate-900/40 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Top interventions for this turnover profile</p>
          <p className="text-xs text-muted-foreground mt-0.5">Matched to CQ gaps between current staff, departed staff, and administration.</p>
        </div>
        <span className="text-xs text-muted-foreground">{NEXT_STEPS.length} recommendations</span>
      </div>
      <div className="space-y-3">
        {NEXT_STEPS.map((item) => (
          <div key={item.rank} className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-600">{item.rank}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${item.format === "Live" ? "bg-emerald-100 text-emerald-700" : item.format === "Workshop" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}>{item.format}</span>
                  <span className="text-[11px] text-muted-foreground">{item.duration}</span>
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/30 px-3 py-2.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">{item.why}</p>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Match</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.match}%` }} />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 tabular-nums">{item.match}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TurnoverDashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <UserMinus className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold font-sans tracking-tight">Turnover & Cultural Analysis</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Analyze teacher departure patterns relative to school cultural fingerprints. All data is aggregate and privacy-protected.
        </p>
      </div>

      <Tabs defaultValue="insights">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="composition">Composition</TabsTrigger>
          <TabsTrigger value="quadrants">CQ Quadrants</TabsTrigger>
          <TabsTrigger value="alignment">Alignment</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
          <TabsTrigger value="wellness">Wellness</TabsTrigger>
          <TabsTrigger value="friction">Friction</TabsTrigger>
          <TabsTrigger value="nextsteps">Next Steps</TabsTrigger>
        </TabsList>
        <TabsContent value="insights" className="mt-6">
          <TurnoverInsightsPanel />
        </TabsContent>
        <TabsContent value="summary" className="mt-6">
          <OverviewPanel />
        </TabsContent>
        <TabsContent value="composition" className="mt-6">
          <TurnoverCompositionPanel />
        </TabsContent>
        <TabsContent value="quadrants" className="mt-6">
          <CQTrendCharts />
        </TabsContent>
        <TabsContent value="alignment" className="mt-6">
          <TurnoverAlignmentPanel />
        </TabsContent>
        <TabsContent value="cost" className="mt-6">
          <TurnoverCostPanel />
        </TabsContent>
        <TabsContent value="wellness" className="mt-6">
          <TurnoverWellnessPanel />
        </TabsContent>
        <TabsContent value="friction" className="mt-6">
          <FrictionHeatmap />
        </TabsContent>
        <TabsContent value="nextsteps" className="mt-6">
          <TurnoverNextStepsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
