import { useMemo } from "react";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { useSchoolData } from "@/hooks/useSchoolData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { NavLink } from "react-router-dom";
import {
  Users, Heart, TrendingUp, TrendingDown, Minus, ArrowRight,
  AlertTriangle, UserMinus, GitMerge,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from "recharts";

// ── Shared sub-components ─────────────────────────────────────────────────────

function SampleBadge() {
  return (
    <span className="inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 leading-none">
      sample
    </span>
  );
}

function SectionHeader({ label, to, linkLabel }: { label: string; to: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</h2>
      <NavLink
        to={to}
        className="text-xs text-primary flex items-center gap-0.5 hover:text-primary/80 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        {linkLabel ?? "Full report"} <ArrowRight className="h-3 w-3" />
      </NavLink>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCurrentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date().setDate(diff)).toISOString().slice(0, 10);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getWeekLabel() {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function completionColor(pct: number) {
  if (pct >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 40) return "text-amber-600 dark:text-amber-500";
  return "text-red-500";
}


function wellnessTextColor(score: number) {
  if (score >= 8) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 6) return "text-amber-600 dark:text-amber-500";
  return "text-red-500";
}

function cqColor(score: number) {
  if (score >= 7.5) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 6) return "text-amber-600 dark:text-amber-500";
  return "text-red-500";
}

// ── Wellness questions ────────────────────────────────────────────────────────

const QUESTIONS = [
  { id: "workload",              label: "Workload",             invertRisk: false },
  { id: "leadership_support",   label: "Leadership support",   invertRisk: false },
  { id: "psychological_safety", label: "Psychological safety", invertRisk: false },
  { id: "professional_growth",  label: "Professional growth",  invertRisk: false },
  { id: "process_friction",     label: "Process friction",     invertRisk: true  },
] as const;

type QuestionId = typeof QUESTIONS[number]["id"];

// ── Mock fallbacks ────────────────────────────────────────────────────────────

const MOCK_WELLNESS = {
  overall: 6.7,
  trend: +0.3,
  atRiskCount: 1,
  worst: { label: "Process friction", score: 5.8 },
  avgs: { workload: 6.4, leadership_support: 7.1, psychological_safety: 6.8, professional_growth: 7.4, process_friction: 5.8 } as Record<QuestionId, number>,
  isMock: true,
};

// 8-week mock series per dimension (oldest → newest)
const MOCK_WELLNESS_SERIES: { week: string; scores: Record<QuestionId, number> }[] = [
  { week: "W1", scores: { workload: 6.1, leadership_support: 6.8, psychological_safety: 6.4, professional_growth: 7.0, process_friction: 6.2 } },
  { week: "W2", scores: { workload: 6.3, leadership_support: 6.9, psychological_safety: 6.5, professional_growth: 7.1, process_friction: 6.0 } },
  { week: "W3", scores: { workload: 5.9, leadership_support: 7.0, psychological_safety: 6.6, professional_growth: 7.2, process_friction: 5.8 } },
  { week: "W4", scores: { workload: 6.2, leadership_support: 7.0, psychological_safety: 6.5, professional_growth: 7.3, process_friction: 6.1 } },
  { week: "W5", scores: { workload: 6.0, leadership_support: 7.1, psychological_safety: 6.7, professional_growth: 7.2, process_friction: 5.9 } },
  { week: "W6", scores: { workload: 6.3, leadership_support: 7.0, psychological_safety: 6.9, professional_growth: 7.3, process_friction: 5.7 } },
  { week: "W7", scores: { workload: 6.2, leadership_support: 7.1, psychological_safety: 6.7, professional_growth: 7.3, process_friction: 5.9 } },
  { week: "W8", scores: { workload: 6.4, leadership_support: 7.1, psychological_safety: 6.8, professional_growth: 7.4, process_friction: 5.8 } },
];

const MOCK_CQ = {
  drive: 7.4, knowledge: 6.6, strategy: 6.2, action: 7.0,
  weakest: { label: "Strategy", score: 6.2 },
  isMock: true,
};


const MOCK_FRICTION = {
  activeThemes: 3,
  repeatingPct: 68,
  hoursLost: 47,
  topTheme: "Communication style",
  turnoverRiskCount: 4,
  alignmentGap: 34,
  isMock: true,
};

const MOCK_COMPLETION = { total: 38, completed: 23, prevCompleted: 18, isMock: true };

// ─────────────────────────────────────────────────────────────────────────────

export default function Admin() {
  const { selectedSchool, selectedSchoolId } = useSchoolContext();
  const data = useSchoolData("last-week");
  const { surveyCount, rawSurveyResponses } = data;

  // Live: wellbeing rows
  const { data: wellbeingRows = [] } = useQuery({
    queryKey: ["wellbeing-home", selectedSchoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_responses")
        .select("week, responses")
        .eq("school_id", selectedSchoolId!)
        .order("week", { ascending: false })
        .limit(100);
      if (error || !data) return [];
      return data as { week: string; responses: { wellbeing?: Record<string, number> } }[];
    },
    enabled: !!selectedSchoolId,
  });

  // Live: survey token completion
  const { data: liveCompletion } = useQuery({
    queryKey: ["survey-completion", selectedSchoolId],
    queryFn: async () => {
      const week = getCurrentWeekMonday();
      const { data, error } = await supabase
        .from("survey_tokens")
        .select("used_at, week")
        .eq("school_id", selectedSchoolId!);
      if (error || !data) return null;
      const thisWeek = data.filter((r) => r.week === week);
      // previous Monday
      const prev = new Date(week);
      prev.setDate(prev.getDate() - 7);
      const prevWeek = prev.toISOString().slice(0, 10);
      const lastWeek = data.filter((r) => r.week === prevWeek);
      return {
        total: thisWeek.length,
        completed: thisWeek.filter((r) => r.used_at !== null).length,
        prevCompleted: lastWeek.filter((r) => r.used_at !== null).length,
        isMock: false,
      };
    },
    enabled: !!selectedSchoolId,
  });

  // Derive wellness metrics
  const wellness = useMemo(() => {
    const withWB = wellbeingRows.filter((r) => r.responses?.wellbeing);
    if (withWB.length === 0) return MOCK_WELLNESS;
    const weeks = [...new Set(withWB.map((r) => r.week))].sort().reverse();
    function avgForWeek(w: string) {
      const rows = withWB.filter((r) => r.week === w);
      const sums: Record<string, number> = {};
      const counts: Record<string, number> = {};
      rows.forEach((r) => {
        QUESTIONS.forEach(({ id }) => {
          const v = r.responses.wellbeing?.[id];
          if (typeof v === "number") { sums[id] = (sums[id] ?? 0) + v; counts[id] = (counts[id] ?? 0) + 1; }
        });
      });
      return Object.fromEntries(QUESTIONS.map(({ id }) => [id, counts[id] ? Math.round((sums[id] / counts[id]) * 10) / 10 : null])) as Record<QuestionId, number | null>;
    }
    const avgsNow = avgForWeek(weeks[0]);
    const avgsPrev = weeks[1] ? avgForWeek(weeks[1]) : null;
    const overall = QUESTIONS.reduce((s, { id, invertRisk }) => {
      const v = avgsNow[id]; return v !== null ? s + (invertRisk ? 11 - v : v) : s;
    }, 0) / QUESTIONS.length;
    const prevOverall = avgsPrev ? QUESTIONS.reduce((s, { id, invertRisk }) => {
      const v = avgsPrev[id]; return v !== null ? s + (invertRisk ? 11 - v : v) : s;
    }, 0) / QUESTIONS.length : null;
    const atRisk = QUESTIONS.filter(({ id, invertRisk }) => { const v = avgsNow[id]; return v !== null && (invertRisk ? 11 - v : v) < 6; });
    const worstQ = QUESTIONS.reduce((worst, q) => {
      const v = avgsNow[q.id]; if (v === null) return worst;
      const eff = q.invertRisk ? 11 - v : v;
      return (!worst || eff < worst.eff) ? { label: q.label, score: v, eff } : worst;
    }, null as { label: string; score: number; eff: number } | null);
    return {
      overall: Math.round(overall * 10) / 10,
      trend: prevOverall !== null ? Math.round((overall - prevOverall) * 10) / 10 : null,
      atRiskCount: atRisk.length,
      worst: worstQ ? { label: worstQ.label, score: worstQ.score } : null,
      avgs: avgsNow as Record<QuestionId, number>,
      isMock: false,
    };
  }, [wellbeingRows]);

  const completion = (liveCompletion && liveCompletion.total > 0) ? liveCompletion : MOCK_COMPLETION;
  const completionPct = completion.total > 0 ? Math.round((completion.completed / completion.total) * 100) : 0;
  const completionDelta = completion.completed - (completion.prevCompleted ?? 0);

  // Hours lost from raw survey responses
  const hoursLost = useMemo(() => {
    if (!rawSurveyResponses) return MOCK_FRICTION.hoursLost;
    const total = (rawSurveyResponses as any[]).reduce((sum, r) => sum + (r.hoursSpent ?? 0), 0);
    return total > 0 ? Math.round(total * 10) / 10 : MOCK_FRICTION.hoursLost;
  }, [rawSurveyResponses]);

  // Per-week series for trend charts (oldest → newest)
  const wellnessSeries = useMemo(() => {
    const withWB = wellbeingRows.filter((r) => r.responses?.wellbeing);
    if (withWB.length === 0) return MOCK_WELLNESS_SERIES;
    const weeks = [...new Set(withWB.map((r) => r.week))].sort().slice(-8);
    return weeks.map((w, i) => {
      const rows = withWB.filter((r) => r.week === w);
      const scores = Object.fromEntries(
        QUESTIONS.map(({ id, invertRisk }) => {
          const vals = rows.map((r) => r.responses.wellbeing?.[id]).filter((v): v is number => typeof v === "number");
          const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
          return [id, avg !== null ? (invertRisk ? Math.round((11 - avg) * 10) / 10 : avg) : null];
        })
      ) as Record<QuestionId, number | null>;
      return { week: `W${i + 1}`, scores };
    });
  }, [wellbeingRows]);

  const anySampleData = wellness.isMock || completion.isMock;

  return (
    <div className="px-6 pt-8 pb-12 space-y-10">

      {/* Welcome */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-semibold tracking-tight mb-1">
            {getGreeting()}{selectedSchool ? `, ${selectedSchool.name}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm">
            Week of {getWeekLabel()} · {surveyCount ?? 0} responses collected
          </p>
        </div>
        {anySampleData && (
          <p className="text-xs text-muted-foreground mt-1 shrink-0">
            <SampleBadge /> Sample data shown
          </p>
        )}
      </div>

      {/* ── Snapshot stat row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <Users className="h-3.5 w-3.5 text-blue-500" /> Completion
            </p>
            <p className={`text-3xl font-bold tabular-nums ${completionColor(completionPct)}`}>{completionPct}%</p>
            <p className="text-xs text-muted-foreground mt-1">{completion.completed}/{completion.total} teachers</p>
            <p className={`text-xs mt-1.5 flex items-center gap-0.5 ${completionDelta > 0 ? "text-emerald-600" : completionDelta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {completionDelta > 0 ? <TrendingUp className="h-3 w-3" /> : completionDelta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {completionDelta > 0 ? `+${completionDelta}` : completionDelta} vs last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <Heart className="h-3.5 w-3.5 text-rose-400" /> Wellness
            </p>
            <p className={`text-3xl font-bold tabular-nums ${wellnessTextColor(wellness.overall)}`}>
              {wellness.overall}<span className="text-base font-normal text-muted-foreground">/10</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {wellness.atRiskCount > 0 ? `${wellness.atRiskCount} area${wellness.atRiskCount > 1 ? "s" : ""} at risk` : "All areas healthy"}
            </p>
            {wellness.trend !== null && (
              <p className={`text-xs mt-1.5 flex items-center gap-0.5 ${wellness.trend > 0 ? "text-emerald-600" : wellness.trend < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {wellness.trend > 0 ? <TrendingUp className="h-3 w-3" /> : wellness.trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {wellness.trend > 0 ? `+${wellness.trend}` : wellness.trend} vs last week
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <UserMinus className="h-3.5 w-3.5 text-destructive" /> Turnover risk
            </p>
            <p className="text-3xl font-bold tabular-nums text-destructive">{MOCK_FRICTION.turnoverRiskCount}</p>
            <p className="text-xs text-muted-foreground mt-1">match departure patterns</p>
            <NavLink
              to="/analytics/turnover"
              className="text-xs text-primary flex items-center gap-0.5 mt-1.5 hover:text-primary/80 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              View analysis <ArrowRight className="h-3 w-3" />
            </NavLink>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <GitMerge className="h-3.5 w-3.5 text-violet-400" /> Alignment gap
            </p>
            <p className={`text-3xl font-bold tabular-nums ${MOCK_FRICTION.alignmentGap >= 30 ? "text-destructive" : MOCK_FRICTION.alignmentGap >= 15 ? "text-amber-600 dark:text-amber-500" : "text-emerald-600"}`}>
              {MOCK_FRICTION.alignmentGap}<span className="text-base font-normal text-muted-foreground"> pt</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">admin ↔ teacher gap</p>
            {MOCK_FRICTION.alignmentGap >= 30 && (
              <p className="text-xs text-destructive mt-1.5 font-medium">High — predicts friction spikes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Issues & friction ── */}
      <section className="space-y-3">
        <SectionHeader label="Issues & friction" to="/quarterly-action-plan" linkLabel="Quarterly Action Plan" />
        <Card className={MOCK_FRICTION.repeatingPct >= 60 ? "bg-red-50/60 dark:bg-red-950/20" : "bg-amber-50/50 dark:bg-amber-950/10"}>
          <CardContent className="pt-5 pb-5">
            <div className="grid sm:grid-cols-3 gap-5">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Active themes</p>
                <p className="text-3xl font-bold tabular-nums text-foreground">{MOCK_FRICTION.activeThemes}</p>
                <p className="text-xs text-muted-foreground mt-1">Top: {MOCK_FRICTION.topTheme}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Repeating issues</p>
                <p className={`text-3xl font-bold tabular-nums ${MOCK_FRICTION.repeatingPct >= 60 ? "text-destructive" : "text-amber-600 dark:text-amber-500"}`}>
                  {MOCK_FRICTION.repeatingPct}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">of issues this week</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Hours lost</p>
                <p className="text-3xl font-bold tabular-nums text-foreground">{hoursLost}h</p>
                <p className="text-xs text-muted-foreground mt-1">to friction this week</p>
              </div>
            </div>
            {MOCK_FRICTION.repeatingPct >= 60 && (
              <div className="flex items-start gap-2 bg-destructive/10 rounded-md px-3 py-2.5 mt-4">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">
                  {MOCK_FRICTION.repeatingPct}% of issues are repeating — interventions aren't resolving root causes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Staff wellness ── */}
      <section className="space-y-3">
        <SectionHeader label="Staff wellness" to="/staff/wellness" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUESTIONS.map(({ id, label, invertRisk }) => {
            const currentScore = wellness.avgs?.[id] ?? null;
            if (currentScore === null) return null;
            const effective = invertRisk ? Math.round((11 - currentScore) * 10) / 10 : currentScore;
            const isWorst = wellness.worst?.label === label;
            const chartData = wellnessSeries.map((pt) => ({ week: pt.week, value: pt.scores[id] ?? undefined }));
            const prev = wellnessSeries.length >= 2 ? wellnessSeries[wellnessSeries.length - 2].scores[id] : null;
            const delta = prev !== null && effective !== null ? Math.round((effective - prev) * 10) / 10 : null;
            const strokeColor = effective >= 8 ? "#059669" : effective >= 6 ? "#d97706" : "#ef4444";
            const fillColor = effective >= 8 ? "#d1fae5" : effective >= 6 ? "#fef3c7" : "#fee2e2";
            return (
              <Card key={id} className={isWorst ? "bg-red-50/40 dark:bg-red-950/20" : ""}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className={`text-xs font-medium leading-tight ${isWorst ? "text-foreground" : "text-muted-foreground"}`}>
                      {label}{isWorst && <span className="ml-1 text-destructive">↓</span>}
                    </p>
                    {delta !== null && (
                      <span className={`text-[10px] tabular-nums font-medium shrink-0 ml-2 ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {delta > 0 ? "+" : ""}{delta}
                      </span>
                    )}
                  </div>
                  <p className={`text-2xl font-bold tabular-nums mb-2 ${wellnessTextColor(effective)}`}>
                    {effective}<span className="text-xs font-normal text-muted-foreground">/10</span>
                  </p>
                  <ResponsiveContainer width="100%" height={48}>
                    <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={fillColor} stopOpacity={0.8} />
                          <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <YAxis domain={[4, 10]} hide />
                      <Tooltip
                        content={({ active, payload, label: wk }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="bg-popover border border-border rounded px-2 py-1 text-xs shadow-sm">
                              <span className="text-muted-foreground">{wk} </span>
                              <span className="font-semibold tabular-nums">{payload[0].value}</span>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        strokeWidth={1.5}
                        fill={`url(#fill-${id})`}
                        dot={false}
                        activeDot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
                        connectNulls
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── CQ snapshot ── */}
      <section className="space-y-3">
        <SectionHeader label="CQ snapshot" to="/analytics/cq-navigator" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { key: "drive",     label: "Drive",     score: MOCK_CQ.drive },
            { key: "knowledge", label: "Knowledge", score: MOCK_CQ.knowledge },
            { key: "strategy",  label: "Strategy",  score: MOCK_CQ.strategy },
            { key: "action",    label: "Action",    score: MOCK_CQ.action },
          ] as const).map(({ key, label, score }) => {
            const isWeakest = MOCK_CQ.weakest.label === label;
            return (
              <Card key={key} className={isWeakest ? "bg-amber-50/70 dark:bg-amber-950/20" : ""}>
                <CardContent className="pt-5 pb-5">
                  <p className="text-xs text-muted-foreground mb-2">{label}</p>
                  <p className={`text-3xl font-bold tabular-nums ${cqColor(score)}`}>
                    {score}<span className="text-base font-normal text-muted-foreground">/10</span>
                  </p>
                  {isWeakest && <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 font-medium">Weakest area</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

    </div>
  );
}
