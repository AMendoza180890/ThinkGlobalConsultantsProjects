import { useState } from "react";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";
import {
  Fingerprint, Users, AlertTriangle, Building2,
  GraduationCap, Heart, Info, TrendingUp, TrendingDown, Minus,
  Shield, Lightbulb, ArrowRight,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DimensionScore {
  dimension: string;        // display label
  field: string;            // survey field name
  score: number;            // 0–100 (higher = stronger tendency toward that pole)
  lowLabel: string;         // what "low" means for this dimension
  highLabel: string;        // what "high" means for this dimension
}

interface SegmentFingerprint {
  label: string;
  respondents: number;
  dimensions: DimensionScore[];
  dominantStyle: string;
  insight: string;
}

// ─── Dimension definitions (map 1:1 to survey Section 4 fields) ──────────────

const DIMENSION_META: Omit<DimensionScore, "score">[] = [
  {
    dimension: "Power Distance",
    field: "powerDistance",
    lowLabel: "Egalitarian",
    highLabel: "Hierarchical",
  },
  {
    dimension: "Risk Tolerance",
    field: "riskTolerance",
    lowLabel: "Risk-Averse",
    highLabel: "Flexible",
  },
  {
    dimension: "Decision Speed",
    field: "decisionSpeed",
    lowLabel: "Deliberate",
    highLabel: "Fast",
  },
  {
    dimension: "Communication Style",
    field: "communicationStyle",
    lowLabel: "Indirect",
    highLabel: "Direct",
  },
  {
    dimension: "Group vs Individual",
    field: "individualismCollectivism",
    lowLabel: "Individual",
    highLabel: "Group-Focused",
  },
];

function makeDimensions(scores: number[]): DimensionScore[] {
  return DIMENSION_META.map((meta, i) => ({ ...meta, score: scores[i] }));
}

// ─── Sample data (mirrors survey Section 4 cultural dimension responses) ──────
// Scores 0–100: derived from % of responses selecting the "high" pole option.
// e.g. powerDistance: % selecting "More hierarchical" (vs "More egalitarian")

const SCHOOL_WIDE: SegmentFingerprint = {
  label: "School-Wide",
  respondents: 42,
  dimensions: makeDimensions([38, 61, 55, 72, 44]),
  dominantStyle: "Direct communicators who prefer flexibility over rigid plans",
  insight: "Staff are broadly direct and risk-tolerant, but split on hierarchy — a mix of egalitarian and hierarchical preferences is driving T↔Admin friction.",
};

// Tenure segments (survey: tenure_band field on user profiles)
const TENURE_SEGMENTS: SegmentFingerprint[] = [
  {
    label: "0–2 Years",
    respondents: 11,
    dimensions: makeDimensions([28, 70, 68, 78, 36]),
    dominantStyle: "Fast, direct, low hierarchy preference",
    insight: "New teachers are the most direct and fastest decision-makers. They expect flat structures — mismatches with senior staff and admin are likely.",
  },
  {
    label: "3–5 Years",
    respondents: 14,
    dimensions: makeDimensions([41, 63, 57, 74, 48]),
    dominantStyle: "Direct with moderate hierarchy acceptance",
    insight: "Mid-career teachers sit closest to the school-wide average across all five dimensions.",
  },
  {
    label: "6–10 Years",
    respondents: 10,
    dimensions: makeDimensions([50, 55, 45, 65, 52]),
    dominantStyle: "Balanced — moderate on all dimensions",
    insight: "This cohort shows the most balanced profile. Their flexibility may make them effective bridge-builders between newer and veteran staff.",
  },
  {
    label: "10+ Years",
    respondents: 7,
    dimensions: makeDimensions([62, 42, 38, 58, 61]),
    dominantStyle: "Hierarchical, deliberate, group-focused",
    insight: "Veteran teachers lean most hierarchical and slowest in decision-making. Direct friction risk with newer staff who prefer flat, fast collaboration.",
  },
];

// At-Risk: teachers who reported friction severity ≥ 4 at least once
const AT_RISK_SEGMENTS: SegmentFingerprint[] = [
  {
    label: "High-Friction Staff",
    respondents: 9,
    dimensions: makeDimensions([31, 72, 74, 82, 30]),
    dominantStyle: "Very direct, fast, individualistic",
    insight: "High-friction teachers skew strongly direct and fast. Their workstyle diverges most from admin and parent expectations — a primary driver of their friction.",
  },
  {
    label: "Low-Friction Staff",
    respondents: 33,
    dimensions: makeDimensions([40, 58, 50, 68, 48]),
    dominantStyle: "Direct with balanced pace and group orientation",
    insight: "Low-friction staff mirror the school-wide average closely. Their moderate profile likely reduces mismatches across all interaction types.",
  },
];

// Department segments (survey: department field on user profiles)
const DEPT_SEGMENTS: SegmentFingerprint[] = [
  {
    label: "Humanities",
    respondents: 12,
    dimensions: makeDimensions([35, 58, 48, 76, 52]),
    dominantStyle: "Direct, moderate risk tolerance, group-leaning",
    insight: "Humanities teachers are the most direct communicators across departments. Parent communication friction here is likely style-driven, not content-driven.",
  },
  {
    label: "STEM",
    respondents: 14,
    dimensions: makeDimensions([44, 65, 70, 62, 38]),
    dominantStyle: "Fast decision-makers, flexible, individualistic",
    insight: "STEM staff are the fastest and most risk-tolerant. Deadline friction with admin may stem from moving quickly without full coordination.",
  },
  {
    label: "Arts & PE",
    respondents: 8,
    dimensions: makeDimensions([30, 68, 55, 72, 58]),
    dominantStyle: "Direct, flexible, group-focused",
    insight: "Arts & PE staff are flexible and group-oriented. Their profile is closest to the high-friction staff group — worth monitoring.",
  },
  {
    label: "Admin & Support",
    respondents: 8,
    dimensions: makeDimensions([71, 38, 32, 50, 65]),
    dominantStyle: "Hierarchical, deliberate, group-focused",
    insight: "Admin & Support staff have the most hierarchical and slowest profile in the school. This directly explains T↔Admin power distance and speed friction.",
  },
];

// School level segments (survey: grade_level field — elementary/middle/high)
const LEVEL_SEGMENTS: SegmentFingerprint[] = [
  {
    label: "Elementary",
    respondents: 15,
    dimensions: makeDimensions([42, 55, 47, 68, 60]),
    dominantStyle: "Moderately direct, group-focused",
    insight: "Elementary staff are the most group-focused. Parent communication friction here is relatively low — styles are better aligned.",
  },
  {
    label: "Middle School",
    respondents: 14,
    dimensions: makeDimensions([36, 63, 58, 74, 44]),
    dominantStyle: "Direct, flexible, individually-oriented",
    insight: "Middle school teachers are direct and flexible. Their faster pace creates some friction with admin's more deliberate decision-making style.",
  },
  {
    label: "High School",
    respondents: 13,
    dimensions: makeDimensions([38, 66, 62, 76, 36]),
    dominantStyle: "Most direct and fastest across levels",
    insight: "High school staff are the most direct and fastest decision-makers. They have the highest mismatch with admin — intervention priority for T↔Admin friction.",
  },
];

// Parent dashboard: parents' cultural preference profile (from parent-facing survey)
const PARENT_SEGMENTS: SegmentFingerprint[] = [
  {
    label: "All Parents",
    respondents: 38,
    dimensions: makeDimensions([55, 44, 36, 48, 68]),
    dominantStyle: "Hierarchical, deliberate, group-focused",
    insight: "Parents lean more hierarchical and group-focused than staff overall — and are significantly more indirect. This explains the high communication style friction in T↔Parent interactions.",
  },
  {
    label: "Primary Parents",
    respondents: 14,
    dimensions: makeDimensions([58, 40, 32, 44, 72]),
    dominantStyle: "Most hierarchical and group-focused",
    insight: "Primary parents are the most indirect and group-oriented. Direct-communicating teachers are most likely to create unintended friction here.",
  },
  {
    label: "Secondary Parents",
    respondents: 13,
    dimensions: makeDimensions([54, 46, 38, 50, 66]),
    dominantStyle: "Hierarchical, balanced communication",
    insight: "Secondary parents closely mirror the all-parent average. Communication style mismatch with high school staff is the key friction risk.",
  },
  {
    label: "High School Parents",
    respondents: 11,
    dimensions: makeDimensions([50, 48, 42, 52, 62]),
    dominantStyle: "Moderate — closest to school staff average",
    insight: "High school parents are the most closely aligned with staff preferences. Friction here tends to be issue-specific rather than style-driven.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function DeltaBadge({ a, b }: { a: number; b: number }) {
  const diff = Math.round(a - b);
  if (Math.abs(diff) < 5) return <Minus className="h-3 w-3 text-muted-foreground inline" />;
  return diff > 0
    ? <span className="text-xs font-semibold text-[#1a7a7a] inline-flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />+{diff}</span>
    : <span className="text-xs font-semibold text-[#2a9d8f] inline-flex items-center gap-0.5"><TrendingDown className="h-3 w-3" />{diff}</span>;
}

// ─── Radar + bar for one segment ─────────────────────────────────────────────

function FingerprintCard({
  segment,
  compare,
  compareLabel,
}: {
  segment: SegmentFingerprint;
  compare?: SegmentFingerprint;
  compareLabel?: string;
}) {
  const radarData = segment.dimensions.map((d, i) => ({
    dimension: d.dimension.replace(" Style", "").replace(" Distance", "").replace(" Tolerance", "").replace(" Speed", ""),
    score: d.score,
    ...(compare ? { compareScore: compare.dimensions[i].score } : {}),
  }));

  return (
    <div className="space-y-6">
      {/* Respondent count + dominant style */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="text-xs">
          {segment.respondents} respondents
        </Badge>
        <span className="text-sm text-muted-foreground">{segment.dominantStyle}</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Radar */}
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Workstyle Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name={segment.label}
                  dataKey="score"
                  stroke="#1a7a7a"
                  fill="#1a7a7a"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                {compare && (
                  <Radar
                    name={compareLabel ?? "Compare"}
                    dataKey="compareScore"
                    stroke="#4db8b8"
                    fill="#4db8b8"
                    fillOpacity={0.15}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                )}
                {compare && <Legend wrapperStyle={{ fontSize: 11 }} />}
                <RechartsTooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  formatter={(v: number) => [`${v}`, ""]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* Insight callout */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">{segment.insight}</p>
      </div>
    </div>
  );
}

// ─── Multi-segment comparison bar chart ──────────────────────────────────────

function SegmentComparisonChart({ segments }: { segments: SegmentFingerprint[] }) {
  const chartData = DIMENSION_META.map((meta) => {
    const row: Record<string, string | number> = { dimension: meta.dimension.replace(" Distance", "").replace(" Tolerance", "").replace(" Style", "").replace(" Speed", "") };
    segments.forEach((s) => { row[s.label] = s.dimensions.find(d => d.field === meta.field)?.score ?? 0; });
    return row;
  });

  const COLORS = ["#1a7a7a", "#4db8b8", "#2a9d8f", "#264653", "#52b5b5", "#0e4d5c"];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          All Segments — Side-by-Side Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="dimension" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <RechartsTooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {segments.map((s, i) => (
              <Bar key={s.label} dataKey={s.label} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={28} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Section wrapper with tab-per-segment ─────────────────────────────────────

function SegmentedSection({
  segments,
  compareWith,
  compareLabel,
  showComparison,
}: {
  segments: SegmentFingerprint[];
  compareWith?: SegmentFingerprint;
  compareLabel?: string;
  showComparison?: boolean;
}) {
  return (
    <div className="space-y-6">
      {showComparison && segments.length > 1 && (
        <SegmentComparisonChart segments={segments} />
      )}
      <Tabs defaultValue={segments[0].label}>
        <TabsList className={`grid w-full h-auto p-1 gap-1`} style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}>
          {segments.map((s) => (
            <TabsTrigger key={s.label} value={s.label} className="text-xs py-2">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {segments.map((s) => (
          <TabsContent key={s.label} value={s.label} className="mt-4">
            <FingerprintCard
              segment={s}
              compare={compareWith}
              compareLabel={compareLabel}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// ─── Administration fingerprint ───────────────────────────────────────────────
// Admin & leadership team — used as the comparison baseline for gap analysis

export const ADMINISTRATION: SegmentFingerprint = {
  label: "Administration",
  respondents: 8,
  dimensions: makeDimensions([74, 36, 30, 48, 68]),
  dominantStyle: "Hierarchical, deliberate, group-focused, moderately indirect",
  insight: "Administration leans strongly hierarchical and slow in decision-making — the opposite of newer teaching staff. These gaps are the root cause of most T↔Admin friction in the school.",
};

// ─── Gap Analysis ─────────────────────────────────────────────────────────────

interface GapRec {
  dimension: string;
  field: string;
  gap: number;           // absolute difference
  segScore: number;
  adminScore: number;
  highLabel: string;
  lowLabel: string;
  recommendation: string;
  intervention: string;
}

// Rules: for each dimension, map gap size + direction to a plain-language recommendation
function buildGapRecs(segment: SegmentFingerprint, compareWith: SegmentFingerprint = ADMINISTRATION): GapRec[] {
  return segment.dimensions
    .map((d): GapRec => {
      const adminDim = compareWith.dimensions.find(a => a.field === d.field)!;
      const gap = Math.abs(d.score - adminDim.score);
      const segHigher = d.score > adminDim.score;

      let recommendation = "";
      let intervention = "";

      if (d.field === "powerDistance") {
        if (gap >= 20) {
          recommendation = segHigher
            ? "Staff prefer more hierarchy than admin currently models. Clarify decision-making authority and escalation paths."
            : "Staff prefer flat collaboration while admin leans hierarchical. Establish shared decision-making norms and involve teachers in key decisions.";
          intervention = "Shared Decision-Making Protocol Workshop";
        } else {
          recommendation = "Power distance preferences are broadly aligned. No urgent action needed.";
          intervention = "Monthly CQ Pulse Check-In";
        }
      } else if (d.field === "riskTolerance") {
        if (gap >= 20) {
          recommendation = segHigher
            ? "Staff tolerate ambiguity better than admin. Admin should communicate change rationale earlier to reduce staff uncertainty."
            : "Staff are more risk-averse than admin. Provide more lead time and clearer plans before implementing changes.";
          intervention = "Change Management & Communication Workshop";
        } else {
          recommendation = "Risk tolerance is well-matched. Maintain current communication cadence.";
          intervention = "Monthly CQ Pulse Check-In";
        }
      } else if (d.field === "decisionSpeed") {
        if (gap >= 20) {
          recommendation = segHigher
            ? "Staff decide faster than admin. Create clear timelines for admin decisions so staff aren't left waiting."
            : "Admin makes faster decisions than staff prefer. Build in structured review windows before finalising key decisions.";
          intervention = "Planning Alignment & Decision Speed Session";
        } else {
          recommendation = "Decision pace is reasonably aligned. Continue current planning rhythms.";
          intervention = "Monthly CQ Pulse Check-In";
        }
      } else if (d.field === "communicationStyle") {
        if (gap >= 20) {
          recommendation = segHigher
            ? "Staff communicate more directly than admin. Admin should increase directness in memos, feedback, and instructions to reduce ambiguity."
            : "Admin communicates more directly than staff prefer. Train admin on indirect communication cues and create space for staff to ask clarifying questions.";
          intervention = "Communication Norms Workshop";
        } else {
          recommendation = "Communication styles are broadly aligned. Maintain current feedback practices.";
          intervention = "Monthly CQ Pulse Check-In";
        }
      } else if (d.field === "individualismCollectivism") {
        if (gap >= 20) {
          recommendation = segHigher
            ? "Staff are more group-focused than admin expects. Celebrate team achievements and use collective goal-setting."
            : "Staff prefer individual autonomy more than admin's group-first approach. Allow more individual initiative within clearly defined boundaries.";
          intervention = "Team Norms & Autonomy Alignment Workshop";
        } else {
          recommendation = "Group vs individual orientation is well-matched. No urgent action needed.";
          intervention = "Monthly CQ Pulse Check-In";
        }
      }

      return {
        dimension: d.dimension,
        field: d.field,
        gap,
        segScore: d.score,
        adminScore: adminDim.score,
        highLabel: d.highLabel,
        lowLabel: d.lowLabel,
        recommendation,
        intervention,
      };
    })
    .sort((a, b) => b.gap - a.gap);
}

function GapAnalysis({ segment, compareWith = ADMINISTRATION }: { segment: SegmentFingerprint; compareWith?: SegmentFingerprint }) {
  const recs = buildGapRecs(segment, compareWith);

  const compareLabel = compareWith.label;
  const chartData = recs.map(r => ({
    dimension: r.dimension.replace(" Distance", "").replace(" Tolerance", "").replace(" Style", "").replace(" Speed", ""),
    [segment.label]: r.segScore,
    [compareLabel]: r.adminScore,
    gap: r.gap,
  }));

  const gapColor = (gap: number) =>
    gap >= 30 ? "#264653" : gap >= 15 ? "#4db8b8" : "#2a9d8f";

  const priorityLabel = (gap: number) =>
    gap >= 30 ? { text: "Critical Gap", cls: "bg-[#264653]/10 text-[#264653] border-[#264653]/30 border" }
    : gap >= 15 ? { text: "Moderate Gap", cls: "bg-[#4db8b8]/10 text-[#1a7a7a] border-[#4db8b8]/30 border" }
    : { text: "Low Gap", cls: "bg-[#2a9d8f]/10 text-[#2a9d8f] border-[#2a9d8f]/30 border" };

  return (
    <div className="space-y-6">
      {/* Gap bar chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {segment.label} vs. Administration — Dimension Gaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dimension" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <RechartsTooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                formatter={(v: number, name: string) => [`${v}`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey={segment.label} fill="#1a7a7a" radius={[3, 3, 0, 0]} maxBarSize={32} />
              <Bar dataKey={compareLabel} fill="#4db8b8" radius={[3, 3, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gap size ranking */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Gaps Ranked — Largest to Smallest
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recs.map((r, i) => {
            const priority = priorityLabel(r.gap);
            return (
              <div key={r.field} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{r.dimension}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {segment.label}: <strong className="text-[#1a7a7a]">{r.segScore}</strong>
                        {" · "}Admin: <strong className="text-[#4db8b8]">{r.adminScore}</strong>
                      </span>
                      <Badge className={`text-[10px] py-0 h-4 ${priority.cls}`}>{priority.text}</Badge>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${r.gap}%`, backgroundColor: gapColor(r.gap) }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Gap: {r.gap} points</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display text-base font-bold">Recommended Actions</h3>
          <span className="text-xs text-muted-foreground">— based on largest gaps, ranked by priority</span>
        </div>
        <div className="space-y-3">
          {recs.filter(r => r.gap >= 15).map((r, i) => {
            const priority = priorityLabel(r.gap);
            const borderCls = r.gap >= 30
              ? "border-[#264653]/30 bg-[#264653]/5"
              : "border-[#4db8b8]/30 bg-[#4db8b8]/5";
            return (
              <div key={r.field} className={`p-4 rounded-xl border ${borderCls}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 mt-0.5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-semibold text-sm">{r.dimension}</span>
                      <Badge className={`text-[10px] ${priority.cls}`}>{priority.text}</Badge>
                      <Badge variant="outline" className="text-[10px]">{r.gap}-point gap</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{r.recommendation}</p>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border/60">
                      <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-xs font-semibold text-primary">{r.intervention}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {recs.filter(r => r.gap >= 15).length === 0 && (
            <div className="p-4 rounded-xl border border-[#2a9d8f]/30 bg-[#2a9d8f]/5 flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#2a9d8f] shrink-0" />
              <p className="text-sm text-muted-foreground">All dimension gaps are below 15 points — cultural preferences are well-aligned. Continue current practices.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TOP_TABS = [
  { value: "school", label: "School-Wide", icon: Fingerprint },
  { value: "admin", label: "Administration", icon: Shield },
  { value: "tenure", label: "Teacher Tenure", icon: Users },
  { value: "at-risk", label: "At-Risk Teachers", icon: AlertTriangle },
  { value: "department", label: "By Department", icon: Building2 },
  { value: "level", label: "By School Level", icon: GraduationCap },
  { value: "parent", label: "Parent Dashboard", icon: Heart },
];

export default function CulturalFingerprintDashboard() {
  const { selectedSchool } = useSchoolContext();
  const [activeTab, setActiveTab] = useState("school");

  return (
    <div className="container max-w-6xl py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Fingerprint className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-sans text-3xl font-semibold">Cultural Preference Fingerprint</h1>
            <p className="text-muted-foreground">
              {selectedSchool?.name ?? "Select a school"} — How staff and parents prefer to work, communicate, and decide
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-xl border border-border/60 bg-muted/20 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Scores reflect survey responses from Section 4 — Cultural Preferences. Each dimension runs from 0 (low pole) to 100 (high pole).
            Higher scores indicate a stronger tendency toward the high-end label (e.g., Direct, Hierarchical, Fast).
            <strong className="text-foreground"> Sample data shown</strong> — connect live survey responses to see your school's actual fingerprint.
          </p>
        </div>
      </div>

      {/* Top-level tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 md:grid-cols-7 w-full h-auto p-1 gap-1 mb-6">
          {TOP_TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="text-xs py-2.5 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(" ")[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* School-Wide */}
        <TabsContent value="school" className="mt-0">
          <div className="mb-4">
            <h2 className="font-sans text-xl font-semibold">School-Wide Fingerprint</h2>
            <p className="text-sm text-muted-foreground">Aggregate cultural preference profile across all {SCHOOL_WIDE.respondents} staff respondents — dashed line shows Administration</p>
          </div>
          <FingerprintCard segment={SCHOOL_WIDE} compare={ADMINISTRATION} compareLabel="Administration" />
          <div className="mt-8">
            <h3 className="font-display text-lg font-bold mb-1">Gap Analysis vs. Administration</h3>
            <p className="text-sm text-muted-foreground mb-4">Where school-wide staff preferences diverge most from leadership</p>
            <GapAnalysis segment={SCHOOL_WIDE} />
          </div>
        </TabsContent>

        {/* Administration */}
        <TabsContent value="admin" className="mt-0">
          <div className="mb-4">
            <h2 className="font-sans text-xl font-semibold">Administration Fingerprint</h2>
            <p className="text-sm text-muted-foreground">Leadership team's cultural preference profile — dashed line shows school-wide staff average</p>
          </div>
          <FingerprintCard segment={ADMINISTRATION} compare={SCHOOL_WIDE} compareLabel="School-Wide Staff" />
          <div className="mt-8">
            <h3 className="font-display text-lg font-bold mb-1">Gap Analysis — Admin vs. School-Wide Staff</h3>
            <p className="text-sm text-muted-foreground mb-4">Where administration's preferences diverge most from the staff they lead</p>
            <GapAnalysis segment={SCHOOL_WIDE} />
          </div>
        </TabsContent>

        {/* By Tenure */}
        <TabsContent value="tenure" className="mt-0">
          <div className="mb-4">
            <h2 className="font-sans text-xl font-semibold">Teacher Tenure</h2>
            <p className="text-sm text-muted-foreground">How cultural preferences shift across career stages — dashed line shows Administration</p>
          </div>
          <SegmentedSection
            segments={TENURE_SEGMENTS}
            compareWith={ADMINISTRATION}
            compareLabel="Administration"
            showComparison
          />
          <div className="mt-8 space-y-10">
            {TENURE_SEGMENTS.map(s => (
              <div key={s.label}>
                <h3 className="font-display text-lg font-bold mb-1">Gap Analysis — {s.label} vs. Administration</h3>
                <p className="text-sm text-muted-foreground mb-4">Where {s.label} teachers diverge most from leadership preferences</p>
                <GapAnalysis segment={s} />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* At-Risk */}
        <TabsContent value="at-risk" className="mt-0">
          <div className="mb-4">
            <h2 className="font-sans text-xl font-semibold">At-Risk Teachers</h2>
            <p className="text-sm text-muted-foreground">Cultural profile of high-friction staff vs. low-friction staff — dashed line shows Administration</p>
          </div>
          <SegmentedSection
            segments={AT_RISK_SEGMENTS}
            compareWith={ADMINISTRATION}
            compareLabel="Administration"
            showComparison
          />
          <div className="mt-8 space-y-10">
            {AT_RISK_SEGMENTS.map(s => (
              <div key={s.label}>
                <h3 className="font-display text-lg font-bold mb-1">Gap Analysis — {s.label} vs. Administration</h3>
                <p className="text-sm text-muted-foreground mb-4">Dimension mismatches driving friction for this group</p>
                <GapAnalysis segment={s} />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* By Department */}
        <TabsContent value="department" className="mt-0">
          <div className="mb-4">
            <h2 className="font-sans text-xl font-semibold">By Department</h2>
            <p className="text-sm text-muted-foreground">Where departments diverge in workstyle — dashed line shows Administration</p>
          </div>
          <SegmentedSection
            segments={DEPT_SEGMENTS}
            compareWith={ADMINISTRATION}
            compareLabel="Administration"
            showComparison
          />
          <div className="mt-8 space-y-10">
            {DEPT_SEGMENTS.map(s => (
              <div key={s.label}>
                <h3 className="font-display text-lg font-bold mb-1">Gap Analysis — {s.label} vs. Administration</h3>
                <p className="text-sm text-muted-foreground mb-4">Friction drivers specific to this department's interactions with leadership</p>
                <GapAnalysis segment={s} />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* By School Level */}
        <TabsContent value="level" className="mt-0">
          <div className="mb-4">
            <h2 className="font-sans text-xl font-semibold">By School Level</h2>
            <p className="text-sm text-muted-foreground">Elementary, middle, and high school staff compared — dashed line shows Administration</p>
          </div>
          <SegmentedSection
            segments={LEVEL_SEGMENTS}
            compareWith={ADMINISTRATION}
            compareLabel="Administration"
            showComparison
          />
          <div className="mt-8 space-y-10">
            {LEVEL_SEGMENTS.map(s => (
              <div key={s.label}>
                <h3 className="font-display text-lg font-bold mb-1">Gap Analysis — {s.label} vs. Administration</h3>
                <p className="text-sm text-muted-foreground mb-4">Where this level's staff diverge most from leadership</p>
                <GapAnalysis segment={s} />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Parent Dashboard */}
        <TabsContent value="parent" className="mt-0">
          <div className="mb-4">
            <h2 className="font-sans text-xl font-semibold">Parent Dashboard</h2>
            <p className="text-sm text-muted-foreground">Parent cultural preferences vs. school-wide staff — gap here explains T↔Parent friction</p>
          </div>
          <SegmentedSection
            segments={PARENT_SEGMENTS}
            compareWith={SCHOOL_WIDE}
            compareLabel="Staff (School-Wide)"
            showComparison
          />
          <div className="mt-8 space-y-10">
            {PARENT_SEGMENTS.map(s => (
              <div key={s.label}>
                <h3 className="font-display text-lg font-bold mb-1">Gap Analysis — {s.label} vs. School-Wide Staff</h3>
                <p className="text-sm text-muted-foreground mb-4">Where parent preferences diverge from staff — root causes of T↔Parent friction</p>
                <GapAnalysis segment={s} compareWith={SCHOOL_WIDE} />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
