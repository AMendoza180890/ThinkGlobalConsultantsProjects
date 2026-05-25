import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock, Layers, Brain, Compass, Zap, Loader2, BookOpen, Video, ChevronRight } from "lucide-react";
import { GATE3_OPTIONS } from "@/components/FrictionDiagnoser";
import { useNavigate } from "react-router-dom";
import { getContentLessons } from "@/data/contentLibrary";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FrictionIncident {
  framework: "PRISM" | "CQ Quadrants" | "Cultural Values";
  dimension: string;
  polarity: string;
  gate1Branch: string;
  gate2Choice: string;
  gate3Choice: string | null;
  interactionType: string;
  timeSpent: string;
  isNew: string;
  trend: string;
}

interface ResponseRow {
  week: string;
  user_id: string;
  responses: {
    friction?: FrictionIncident[] | "skipped";
    [key: string]: unknown;
  };
}

// ─── Framework config ─────────────────────────────────────────────────────────

const FRAMEWORK_CONFIG = {
  "PRISM": {
    colorHex: "#1a7a7a",
    bgHex: "#f0fafa",
    borderHex: "#99d6d6",
    bar: "#1a7a7a",
    icon: Layers,
  },
  "CQ Quadrants": {
    colorHex: "#2a9d8f",
    bgHex: "#f4fbfa",
    borderHex: "#99d6d6",
    bar: "#2a9d8f",
    icon: Brain,
  },
  "Cultural Values": {
    colorHex: "#38b2ac",
    bgHex: "#f0fffe",
    borderHex: "#99d6d6",
    bar: "#38b2ac",
    icon: Compass,
  },
} as const;

const INTERACTION_LABELS: Record<string, string> = {
  "teacher-teacher": "Teacher → Teacher",
  "teacher-admin": "Teacher → Admin",
  "teacher-parent": "Teacher → Parent",
};

// ─── Supabase fetch ───────────────────────────────────────────────────────────

async function fetchFrictionResponses(schoolId: string): Promise<ResponseRow[]> {
  const { data, error } = await supabase
    .from("survey_responses")
    .select("week, user_id, responses")
    .eq("school_id", schoolId)
    .order("week", { ascending: false });

  if (error || !data) return [];
  return data as ResponseRow[];
}

// ─── Aggregation helpers ──────────────────────────────────────────────────────

function extractIncidents(rows: ResponseRow[]): FrictionIncident[] {
  const result: FrictionIncident[] = [];
  rows.forEach((row) => {
    const f = row.responses?.friction;
    if (!f || f === "skipped") return;
    if (Array.isArray(f)) {
      f.forEach((incident) => {
        if (incident?.diagnosis?.framework) {
          result.push({
            framework: incident.diagnosis.framework,
            dimension: incident.diagnosis.dimension,
            polarity: incident.diagnosis.polarity,
            gate1Branch: incident.diagnosis.gate1Branch,
            gate2Choice: incident.diagnosis.gate2Choice,
            gate3Choice: incident.diagnosis.gate3Choice,
            interactionType: incident.interactionType ?? "",
            timeSpent: incident.timeSpent ?? "",
            isNew: incident.isNew ?? "",
            trend: incident.trend ?? "",
          });
        }
      });
    }
  });
  return result;
}

interface InteractionStatus {
  repeating: number;
  worsening: number;
  new: number;
  hoursLost: number;
}

interface DimensionCount {
  framework: "PRISM" | "CQ Quadrants" | "Cultural Values";
  dimension: string;
  count: number;
  repeating: number;
  worsening: number;
  byInteraction: Record<string, number>;
  byInteractionStatus: Record<string, InteractionStatus>;
  byDirection: Record<string, number>; // gate3Choice label → count
}

// Look up the human-readable Gate 3 label for an incident
function getDirectionLabel(inc: FrictionIncident): string | null {
  if (!inc.gate3Choice) return null;
  const key = `${inc.gate1Branch}:${inc.gate2Choice}`;
  return (
    GATE3_OPTIONS[key]?.find((o) => o.id === inc.gate3Choice)?.label ??
    inc.gate3Choice
  );
}

// Convert timeSpent bucket to a midpoint hour estimate
function timeSpentToHours(t: string): number {
  if (t === "<30 min")   return 0.25;
  if (t === "30–60 min") return 0.75;
  if (t === "1–2 hrs")   return 1.5;
  if (t === "2+ hrs")    return 2.5;
  return 0;
}

function aggregateByDimension(incidents: FrictionIncident[]): DimensionCount[] {
  const map: Record<string, DimensionCount> = {};
  incidents.forEach((inc) => {
    const key = `${inc.framework}::${inc.dimension}`;
    if (!map[key]) {
      map[key] = {
        framework: inc.framework,
        dimension: inc.dimension,
        count: 0,
        repeating: 0,
        worsening: 0,
        byInteraction: {},
        byInteractionStatus: {},
        byDirection: {},
      };
    }
    map[key].count += 1;
    if (inc.isNew === "Repeating") map[key].repeating += 1;
    if (inc.trend === "Worse") map[key].worsening += 1;

    const intLabel = INTERACTION_LABELS[inc.interactionType] ?? inc.interactionType;
    map[key].byInteraction[intLabel] = (map[key].byInteraction[intLabel] ?? 0) + 1;

    // Cross-reference interaction type with status + time
    if (!map[key].byInteractionStatus[intLabel]) {
      map[key].byInteractionStatus[intLabel] = { repeating: 0, worsening: 0, new: 0, hoursLost: 0 };
    }
    const s = map[key].byInteractionStatus[intLabel];
    s.hoursLost += timeSpentToHours(inc.timeSpent);
    if (inc.trend === "Worse") {
      s.worsening += 1;
    } else if (inc.isNew === "Repeating") {
      s.repeating += 1;
    } else {
      s.new += 1;
    }

    const dirLabel = getDirectionLabel(inc);
    if (dirLabel) {
      map[key].byDirection[dirLabel] = (map[key].byDirection[dirLabel] ?? 0) + 1;
    }
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}

// ─── Mock data (shown when no real data yet) ──────────────────────────────────

const culturalGaps = [
  {
    title: "Communication style — teachers vs parents",
    gap: 4.8,
    isNew: false,
    leftLabel: "Indirect",
    rightLabel: "Direct",
    groupA: { name: "Staff", score: 6.8 },
    groupB: { name: "Parents", score: 2.0, approx: true },
  },
  {
    title: "Hierarchy — teachers vs admin",
    gap: 4.2,
    isNew: true,
    leftLabel: "Egalitarian",
    rightLabel: "Hierarchical",
    groupA: { name: "Teachers", score: 3.5 },
    groupB: { name: "Admin", score: 7.7 },
  },
];

const hoursLost = [
  { label: "Power distance", hours: 17.5 },
  { label: "Comm. style", hours: 14.4 },
  { label: "Decision speed", hours: 5.0 },
  { label: "Deadlines", hours: 2.0 },
];

const maxHours = Math.max(...hoursLost.map((h) => h.hours));

const bySchoolLevel = [
  { label: "Elementary", pct: 60, note: "disproportionate" },
  { label: "Middle", pct: 28, note: null },
  { label: "High School", pct: 12, note: null },
];

const byTenure = [
  { label: "0–2 yrs", level: "high", trend: null, warning: false },
  { label: "2–4 yrs", level: null, trend: "↓", warning: false },
  { label: "4–6 yrs", level: "low", trend: null, warning: false },
  { label: "6+ yrs", level: null, trend: "rising", warning: true },
];

// ─── Mock friction incidents (matches existing mock gaps above) ───────────────
// Mirrors the communication-style + hierarchy gaps shown in the static section.
// Used when no real survey_responses data exists yet.

const MOCK_INCIDENTS: FrictionIncident[] = [
  // PRISM: Communication — Teacher→Parent x5 (4 indirect, 1 too-direct)
  { framework: "PRISM", dimension: "Communication", polarity: "Direct vs. Indirect", gate1Branch: "prism", gate2Choice: "information", gate3Choice: "indirect",    interactionType: "teacher-parent",  timeSpent: "30–60 min", isNew: "Repeating", trend: "Worse" },
  { framework: "PRISM", dimension: "Communication", polarity: "Direct vs. Indirect", gate1Branch: "prism", gate2Choice: "information", gate3Choice: "indirect",    interactionType: "teacher-parent",  timeSpent: "<30 min",  isNew: "Repeating", trend: "Same" },
  { framework: "PRISM", dimension: "Communication", polarity: "Direct vs. Indirect", gate1Branch: "prism", gate2Choice: "information", gate3Choice: "too-direct",  interactionType: "teacher-parent",  timeSpent: "<30 min",  isNew: "New",       trend: "" },
  { framework: "PRISM", dimension: "Communication", polarity: "Direct vs. Indirect", gate1Branch: "prism", gate2Choice: "information", gate3Choice: "indirect",    interactionType: "teacher-parent",  timeSpent: "30–60 min", isNew: "Repeating", trend: "Worse" },
  { framework: "PRISM", dimension: "Communication", polarity: "Direct vs. Indirect", gate1Branch: "prism", gate2Choice: "information", gate3Choice: "indirect",    interactionType: "teacher-teacher", timeSpent: "<30 min",  isNew: "New",       trend: "" },
  // PRISM: Authority — Teacher→Admin x5 (3 too-hierarchical, 2 too-flat)
  { framework: "PRISM", dimension: "Authority", polarity: "Hierarchy vs. Flat", gate1Branch: "prism", gate2Choice: "power", gate3Choice: "too-hierarchical", interactionType: "teacher-admin", timeSpent: "1–2 hrs",  isNew: "Repeating", trend: "Worse" },
  { framework: "PRISM", dimension: "Authority", polarity: "Hierarchy vs. Flat", gate1Branch: "prism", gate2Choice: "power", gate3Choice: "too-hierarchical", interactionType: "teacher-admin", timeSpent: "30–60 min", isNew: "Repeating", trend: "Same" },
  { framework: "PRISM", dimension: "Authority", polarity: "Hierarchy vs. Flat", gate1Branch: "prism", gate2Choice: "power", gate3Choice: "too-flat",         interactionType: "teacher-admin", timeSpent: "<30 min",  isNew: "New",       trend: "" },
  { framework: "PRISM", dimension: "Authority", polarity: "Hierarchy vs. Flat", gate1Branch: "prism", gate2Choice: "power", gate3Choice: "too-hierarchical", interactionType: "teacher-admin", timeSpent: "2+ hrs",   isNew: "Repeating", trend: "Worse" },
  { framework: "PRISM", dimension: "Authority", polarity: "Hierarchy vs. Flat", gate1Branch: "prism", gate2Choice: "power", gate3Choice: "too-flat",         interactionType: "teacher-admin", timeSpent: "30–60 min", isNew: "New",       trend: "" },
  // PRISM: Pace x3 (2 too-fast, 1 too-slow)
  { framework: "PRISM", dimension: "Pace", polarity: "Fast vs. Slow", gate1Branch: "prism", gate2Choice: "timing", gate3Choice: "too-fast", interactionType: "teacher-admin",   timeSpent: "<30 min",  isNew: "New",       trend: "" },
  { framework: "PRISM", dimension: "Pace", polarity: "Fast vs. Slow", gate1Branch: "prism", gate2Choice: "timing", gate3Choice: "too-slow", interactionType: "teacher-teacher", timeSpent: "<30 min",  isNew: "Repeating", trend: "Same" },
  { framework: "PRISM", dimension: "Pace", polarity: "Fast vs. Slow", gate1Branch: "prism", gate2Choice: "timing", gate3Choice: "too-fast", interactionType: "teacher-admin",   timeSpent: "30–60 min", isNew: "New",       trend: "" },
  // CQ: Drive x3 (2 burned-out, 1 past-experience)
  { framework: "CQ Quadrants", dimension: "CQ Drive", polarity: "Motivation (High vs. Low)", gate1Branch: "cq", gate2Choice: "drive", gate3Choice: "burned-out",       interactionType: "teacher-teacher", timeSpent: "<30 min",  isNew: "Repeating", trend: "Same" },
  { framework: "CQ Quadrants", dimension: "CQ Drive", polarity: "Motivation (High vs. Low)", gate1Branch: "cq", gate2Choice: "drive", gate3Choice: "past-experience",  interactionType: "teacher-parent",  timeSpent: "<30 min",  isNew: "New",       trend: "" },
  { framework: "CQ Quadrants", dimension: "CQ Drive", polarity: "Motivation (High vs. Low)", gate1Branch: "cq", gate2Choice: "drive", gate3Choice: "burned-out",       interactionType: "teacher-teacher", timeSpent: "30–60 min", isNew: "Repeating", trend: "Worse" },
  // CQ: Knowledge x2 (1 norms, 1 values)
  { framework: "CQ Quadrants", dimension: "CQ Knowledge", polarity: "Cognition (Low)", gate1Branch: "cq", gate2Choice: "knowledge", gate3Choice: "norms",  interactionType: "teacher-parent",  timeSpent: "<30 min", isNew: "New", trend: "" },
  { framework: "CQ Quadrants", dimension: "CQ Knowledge", polarity: "Cognition (Low)", gate1Branch: "cq", gate2Choice: "knowledge", gate3Choice: "values", interactionType: "teacher-teacher", timeSpent: "<30 min", isNew: "New", trend: "" },
  // Values: Power Distance x2 (both over-defers)
  { framework: "Cultural Values", dimension: "Power Distance", polarity: "High vs. Low", gate1Branch: "values", gate2Choice: "power-distance", gate3Choice: "over-defers", interactionType: "teacher-admin", timeSpent: "30–60 min", isNew: "Repeating", trend: "Same" },
  { framework: "Cultural Values", dimension: "Power Distance", polarity: "High vs. Low", gate1Branch: "values", gate2Choice: "power-distance", gate3Choice: "over-defers", interactionType: "teacher-admin", timeSpent: "<30 min",  isNew: "New",       trend: "" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function gapColor(gap: number) {
  if (gap >= 4) return "text-red-500";
  if (gap >= 2) return "text-amber-500";
  return "text-emerald-500";
}

function barColorFromRatio(ratio: number) {
  if (ratio >= 0.6) return "bg-red-500";
  if (ratio >= 0.3) return "bg-amber-500";
  return "bg-emerald-500";
}

function tenureLevelColor(level: string | null, warning: boolean) {
  if (warning) return "text-amber-500 font-semibold";
  if (level === "high") return "text-red-500 font-semibold";
  if (level === "low") return "text-emerald-600 font-semibold";
  return "text-muted-foreground";
}

function SpectrumBar({ scoreA, scoreB, leftLabel, rightLabel }: {
  scoreA: number; scoreB: number; leftLabel: string; rightLabel: string;
}) {
  const pctA = (scoreA / 10) * 100;
  const pctB = (scoreB / 10) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="relative h-3 bg-secondary rounded-full">
        <div
          className="absolute h-3 bg-primary/15 rounded-full"
          style={{ left: `${Math.min(pctA, pctB)}%`, width: `${Math.abs(pctA - pctB)}%` }}
        />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background shadow" style={{ left: `${pctA}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-400 border-2 border-background shadow" style={{ left: `${pctB}%` }} />
      </div>
    </div>
  );
}

// ─── Content Mapping ──────────────────────────────────────────────────────────

function getRecommendedLessons(dimension: string, interactions: Record<string, any>) {
  const allLessons = getContentLessons();
  const getById = (id: string) => allLessons.find(l => l.intervention.id === id);

  const recommendedIds = new Set<string>();

  if (interactions["teacher-parent"] || interactions["Teacher → Parent"]) {
    recommendedIds.add("parent-comms-webinar");
  }

  switch (dimension) {
    case "Communication": recommendedIds.add("feedback-workshop"); recommendedIds.add("cultural-norms-async"); break;
    case "Authority": recommendedIds.add("leadership-clarity-webinar"); break;
    case "Pace": case "Structure": recommendedIds.add("handoffs-async"); break;
    case "CQ Drive": recommendedIds.add("belonging-workshop"); recommendedIds.add("conflict-resolution-workshop"); break;
    case "CQ Knowledge": recommendedIds.add("cultural-norms-async"); recommendedIds.add("active-listening-async"); break;
    case "CQ Action": recommendedIds.add("feedback-workshop"); recommendedIds.add("active-listening-async"); break;
    case "CQ Strategy": recommendedIds.add("reflective-practice-async"); break;
    case "Power Distance": recommendedIds.add("leadership-clarity-webinar"); break;
  }

  return Array.from(recommendedIds).map(getById).filter(Boolean).slice(0, 2);
}

// ─── Live dimension card ──────────────────────────────────────────────────────

function DimensionCard({ d, total }: { d: DimensionCount; total: number }) {
  const navigate = useNavigate();
  const cfg = FRAMEWORK_CONFIG[d.framework];
  const pct = Math.round((d.count / total) * 100);
  const directions = Object.entries(d.byDirection).sort((a, b) => b[1] - a[1]);
  const dirTotal = directions.reduce((s, [, n]) => s + n, 0);

  const recommended = getRecommendedLessons(d.dimension, d.byInteraction);

  return (
    <Card style={{ borderColor: cfg.borderHex }}>
      <CardContent className="pt-4 pb-4 rounded-xl" style={{ backgroundColor: cfg.bgHex }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
              style={{ backgroundColor: `${cfg.colorHex}18`, color: cfg.colorHex }}>
              {d.framework}
            </span>
            <span className="text-sm font-bold" style={{ color: cfg.colorHex }}>{d.dimension}</span>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold leading-none" style={{ color: cfg.colorHex }}>{d.count}</p>
            <p className="text-xs text-muted-foreground">incidents</p>
          </div>
        </div>

        {/* Volume bar */}
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.bar }} />
        </div>

        {/* Direction breakdown — shown when gate3 data exists */}
        {directions.length > 0 && (
          <div className="mb-3 border-t border-border/30 pt-2.5 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Specific direction</p>
            {/* Segmented split bar */}
            <div className="flex h-1.5 rounded-full overflow-hidden bg-secondary">
              {directions.map(([label, n], i) => (
                <div
                  key={label}
                  className="h-full"
                  style={{ width: `${(n / dirTotal) * 100}%`, backgroundColor: cfg.bar, opacity: i === 0 ? 1 : 0.3 }}
                />
              ))}
            </div>
            {/* Direction labels */}
            <div className="space-y-0.5">
              {directions.map(([label, n]) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-xs text-muted-foreground leading-snug flex-1 line-clamp-2">{label}</span>
                  <span className="text-xs font-bold shrink-0 tabular-nums" style={{ color: cfg.colorHex }}>×{n}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interaction type × status breakdown */}
        {Object.keys(d.byInteractionStatus).length > 0 && (
          <div className="border-t border-border/30 pt-2.5 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">By interaction type</p>
            {Object.entries(d.byInteractionStatus)
              .sort((a, b) => (d.byInteraction[b[0]] ?? 0) - (d.byInteraction[a[0]] ?? 0))
              .map(([label, s]) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {d.byInteraction[label]} incident{d.byInteraction[label] !== 1 ? "s" : ""}
                      {s.hoursLost > 0 && (
                        <span className="ml-1.5 text-amber-600 dark:text-amber-400 font-medium">
                          · ~{s.hoursLost % 1 === 0 ? s.hoursLost : s.hoursLost.toFixed(1)}h lost
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {s.worsening > 0 && (
                      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full px-2 py-0.5 text-[11px] font-medium">
                        ↑ {s.worsening} worsening
                      </span>
                    )}
                    {s.repeating > 0 && (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded-full px-2 py-0.5 text-[11px] font-medium">
                        ↻ {s.repeating} repeating
                      </span>
                    )}
                    {s.new > 0 && (
                      <span className="inline-flex items-center gap-1 bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-[11px]">
                        ✦ {s.new} new
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Recommended Content Strip */}
        {recommended.length > 0 && (
          <div className="mt-4 border-t border-border/30 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recommended content</p>
            </div>
            <div className="space-y-1.5">
              {recommended.map((lesson) => {
                const Icon = lesson!.intervention.format === "webinar" ? Video :
                             lesson!.intervention.format === "workshop" ? BookOpen : Zap;
                return (
                  <button
                    key={lesson!.intervention.id}
                    onClick={() => navigate('/learning/library', { state: { preselect: lesson!.intervention.id } })}
                    className="w-full flex items-center justify-between text-left group bg-background/50 hover:bg-background border border-border/40 hover:border-border rounded-lg p-2 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                      <span className="text-xs font-medium text-foreground truncate">{lesson!.intervention.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                         <span className="capitalize">{lesson!.intervention.format}</span>
                         <span className="opacity-40 px-0.5">•</span>
                         {lesson!.intervention.durationHours}h
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Time window helpers ─────────────────────────────────────────────────────

type WindowKey = "1w" | "4w" | "10w" | "all";

const WINDOW_OPTIONS: { key: WindowKey; label: string; weeks: number | null }[] = [
  { key: "1w",  label: "This week",   weeks: 1  },
  { key: "4w",  label: "Last 4 wks",  weeks: 4  },
  { key: "10w", label: "This term",   weeks: 10 },
  { key: "all", label: "All time",    weeks: null },
];

function getCutoffDate(weeks: number | null): string | null {
  if (weeks === null) return null;
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return d.toISOString().slice(0, 10);
}

function formatDateRange(cutoff: string | null, allWeeks: string[]): string {
  if (allWeeks.length === 0) return "";
  const sorted = [...allWeeks].sort();
  const from = cutoff
    ? sorted.find((w) => w >= cutoff) ?? sorted[0]
    : sorted[0];
  const to = sorted[sorted.length - 1];
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${parseInt(d, 10)} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m,10)-1]}`;
  };
  return from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FrictionCauses() {
  const { selectedSchoolId } = useSchoolContext();

  const [window, setWindow] = useState<WindowKey>("4w");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["friction-diagnosis", selectedSchoolId],
    queryFn: () => fetchFrictionResponses(selectedSchoolId!),
    enabled: !!selectedSchoolId,
  });

  const windowCfg = WINDOW_OPTIONS.find((o) => o.key === window)!;
  const cutoff = useMemo(() => getCutoffDate(windowCfg.weeks), [windowCfg.weeks]);

  // Filter rows by week before extracting incidents
  const filteredRows = useMemo(
    () => (cutoff ? rows.filter((r) => r.week >= cutoff) : rows),
    [rows, cutoff]
  );

  const filteredWeeks = useMemo(() => [...new Set(filteredRows.map((r) => r.week))], [filteredRows]);
  const dateRangeLabel = useMemo(() => formatDateRange(cutoff, filteredWeeks), [cutoff, filteredWeeks]);

  const rawIncidents = useMemo(() => extractIncidents(filteredRows), [filteredRows]);
  const isMock = !isLoading && extractIncidents(rows).length === 0;
  const incidents = useMemo(
    () => (rawIncidents.length > 0 ? rawIncidents : isLoading ? [] : MOCK_INCIDENTS),
    [rawIncidents, isLoading]
  );
  const byDimension = useMemo(() => aggregateByDimension(incidents), [incidents]);
  const hasLiveData = incidents.length > 0;

  // Framework summary
  const byFramework = useMemo(() => {
    const map: Record<string, number> = {};
    incidents.forEach((i) => { map[i.framework] = (map[i.framework] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [incidents]);

  // Top interaction type
  const byInteraction = useMemo(() => {
    const map: Record<string, number> = {};
    incidents.forEach((i) => {
      const l = INTERACTION_LABELS[i.interactionType] ?? i.interactionType;
      map[l] = (map[l] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [incidents]);

  return (
    <div className="container max-w-4xl py-10 space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Zap className="h-7 w-7 text-primary" />
          <h1 className="font-sans text-3xl font-semibold">Friction & Causes</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Hours lost, cultural gaps, and what's driving each issue.
        </p>
      </div>

      {/* ── Live diagnosis data ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        {/* Section heading + time window selector */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg font-semibold">Self-reported friction — by root cause</h2>
            {!isMock && (
              <span className="text-sm text-muted-foreground">
                {incidents.length} incident{incidents.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Window pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {dateRangeLabel && (
              <span className="text-xs text-muted-foreground mr-1">{dateRangeLabel}</span>
            )}
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setWindow(opt.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  window === opt.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hasLiveData ? (
          <>
            {/* Framework summary row */}
            <div className="grid grid-cols-3 gap-3">
              {(["PRISM", "CQ Quadrants", "Cultural Values"] as const).map((fw) => {
                const cfg = FRAMEWORK_CONFIG[fw];
                const Icon = cfg.icon;
                const n = byFramework.find(([f]) => f === fw)?.[1] ?? 0;
                const pct = incidents.length ? Math.round((n / incidents.length) * 100) : 0;
                return (
                  <div key={fw} className="rounded-xl border p-4 text-center"
                    style={{ backgroundColor: cfg.bgHex, borderColor: cfg.borderHex }}>
                    <Icon className="h-5 w-5 mx-auto mb-1" style={{ color: cfg.colorHex }} />
                    <p className="text-2xl font-bold" style={{ color: cfg.colorHex }}>{n}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fw}</p>
                    <div className="h-1 bg-secondary/60 rounded-full mt-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.bar }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interaction type breakdown */}
            {byInteraction.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <p className="text-sm font-semibold">Friction by interaction type</p>
                  {byInteraction.map(([label, n]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{label}</span>
                        <span className="text-sm font-bold">{n}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={barColorFromRatio(n / incidents.length) + " h-full rounded-full"}
                          style={{ width: `${(n / incidents.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Dimension breakdown */}
            <div className="space-y-3">
              {byDimension.map((d) => (
                <DimensionCard key={`${d.framework}::${d.dimension}`} d={d} total={incidents.length} />
              ))}
            </div>

            {/* Repeating / worsening alert */}
            {incidents.filter((i) => i.trend === "Worse").length > 0 && (
              <Card className="border-red-300 dark:border-red-700">
                <CardContent className="pt-4 pb-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold mb-1">
                        {incidents.filter((i) => i.trend === "Worse").length} worsening incident{incidents.filter((i) => i.trend === "Worse").length > 1 ? "s" : ""} flagged
                      </p>
                      <p className="text-xs text-muted-foreground">
                        These are repeating friction patterns that staff report are getting worse week-over-week.
                        Prioritise targeted webinar content from the content library for these dimensions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">No friction incidents reported yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Data appears here once staff submit the weekly survey with friction logged.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Cultural gap analysis (existing / mock) ──────────────────────────── */}
      <section>
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-lg font-semibold">Cultural gap analysis</h2>
          <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
            from survey preferences
          </span>
        </div>
        <div className="space-y-4">
          {culturalGaps.map((gap) => (
            <Card key={gap.title}>
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{gap.title}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-lg font-bold ${gapColor(gap.gap)}`}>{gap.gap} pt gap</span>
                    {gap.isNew && (
                      <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                        new issue
                      </span>
                    )}
                  </div>
                </div>
                <SpectrumBar
                  scoreA={gap.groupA.score}
                  scoreB={gap.groupB.score}
                  leftLabel={gap.leftLabel}
                  rightLabel={gap.rightLabel}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/5 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{gap.groupA.name}</p>
                      <p className="text-xl font-bold text-primary">{gap.groupA.score}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{gap.groupB.name}</p>
                      <p className="text-xl font-bold text-red-400">
                        {gap.groupB.approx ? "~" : ""}{gap.groupB.score}
                      </p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                  </div>
                </div>
                {gap.isNew && (
                  <p className="text-xs text-muted-foreground bg-secondary/60 rounded-lg p-3 leading-relaxed">
                    You don't need to change preferences — you need to bridge the gap. A teacher who understands admin communicates at 7.7 on hierarchy adjusts their approach without changing who they are. The intervention is <span className="font-medium text-foreground">awareness and technique</span>.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Hours lost (mock) ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Hours lost by friction type</h2>
        <Card>
          <CardContent className="pt-5 pb-5 space-y-4">
            {hoursLost.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-sm font-bold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.hours}h
                  </span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColorFromRatio(item.hours / maxHours)}`}
                    style={{ width: `${(item.hours / maxHours) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* ── By school level + tenure (mock) ──────────────────────────────────── */}
      <section className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-sm font-semibold mb-4">By school level</p>
            <div className="space-y-3">
              {bySchoolLevel.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm flex items-center gap-1.5">
                      {s.label}
                      {s.note && (
                        <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                          {s.note}
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-bold">{s.pct}%</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.pct >= 50 ? "bg-red-500" : s.pct >= 25 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              Elementary disproportionate. 60% of parent friction from 35% of staff. Highest directness (7.2), most parent contact.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-sm font-semibold mb-4">By tenure</p>
            <div className="space-y-3">
              {byTenure.map((t) => (
                <div key={t.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    {t.label}
                    {t.warning && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                  </span>
                  <span className={`text-sm ${tenureLevelColor(t.level, t.warning)}`}>
                    {t.warning ? t.trend : t.trend ?? t.level}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              6+ year cohort reverting. Webinars won't fix this — they need <span className="font-medium text-foreground">peer coaching</span>.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
