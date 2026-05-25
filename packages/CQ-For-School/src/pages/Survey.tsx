import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ClipboardList, Loader2, Plus, Trash2,
  CheckCircle2, AlertCircle, ArrowRight, Video,
} from "lucide-react";
import { FrictionDiagnoser, GATE2_OPTIONS, GATE3_OPTIONS, type DiagnosisResult } from "@/components/FrictionDiagnoser";
import { cn } from "@/lib/utils";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getThisWeekMonday(): string {
  const today = new Date();
  const daysSinceMonday = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);
  return monday.toISOString().slice(0, 10);
}

function getLastWeekMonday(): string {
  const today = new Date();
  const daysSinceMonday = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday - 7);
  return monday.toISOString().slice(0, 10);
}

function getIsMonthlyWeek(): boolean {
  const today = new Date();
  const daysSinceMonday = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);
  return monday.getDate() <= 7;
}

// ─── Types ────────────────────────────────────────────────────────────────────

const INTERACTION_TYPES = [
  { id: "teacher-teacher", label: "Teacher → Teacher" },
  { id: "teacher-admin",   label: "Teacher → Administrator / Staff" },
  { id: "teacher-parent",  label: "Teacher → Parent" },
] as const;

const TIME_OPTIONS    = ["<30 min", "30–60 min", "1–2 hrs", "2+ hrs"] as const;
const PATTERN_OPTIONS = ["New", "Repeating"] as const;
const TREND_OPTIONS   = ["Improving", "Same", "Worse"] as const;

// Resolution options for follow-up gate
const RESOLUTION_OPTIONS = [
  { id: "resolved",    label: "Resolved",           icon: CheckCircle2, color: "text-emerald-600", bg: "border-emerald-300 bg-emerald-50" },
  { id: "ongoing",     label: "Still ongoing",       icon: AlertCircle,  color: "text-amber-600",   bg: "border-amber-300 bg-amber-50"   },
  { id: "worse",       label: "Got worse",           icon: AlertCircle,  color: "text-red-600",     bg: "border-red-300 bg-red-50"       },
  { id: "irrelevant",  label: "No longer relevant",  icon: CheckCircle2, color: "text-slate-500",   bg: "border-slate-300 bg-slate-50"   },
] as const;

type ResolutionId = typeof RESOLUTION_OPTIONS[number]["id"];

interface FrictionEntry {
  id: string;
  diagnosis: DiagnosisResult;
  interactionType: string;
  timeSpent: string;
  isNew: string;
  trend: string;
}

// A friction from a previous week that needs follow-up
interface PriorFriction {
  id: string;        // original entry id or fabricated key
  week: string;
  description: string;   // human-readable summary
  interactionType: string;
}

interface FrictionFollowUp {
  id: string;
  resolution: ResolutionId | "";
}

// ─── Mock webinar attendance ──────────────────────────────────────────────────
// When the real webinar_attendance table exists, replace this with a Supabase query.
// Shape: array of { webinar_title, attended_at (ISO date string) }

interface WebinarAttendance {
  id: string;
  webinar_title: string;
  attended_at: string;   // ISO date, e.g. "2026-04-16"
}

function getMockWebinarAttendances(userId: string): WebinarAttendance[] {
  // Simulates the user having attended a webinar 6 days ago (within the 3-week window)
  const sixDaysAgo = new Date();
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  return [
    {
      id: "mock-webinar-1",
      webinar_title: "Navigating High-Context vs. Low-Context Communication",
      attended_at: sixDaysAgo.toISOString().slice(0, 10),
    },
  ];
}

// ─── CQ Wins config ───────────────────────────────────────────────────────────

const CQ_WIN_CATEGORIES = [
  {
    id: "drive",
    label: "Drive (Motivation & Interest)",
    wins: [
      { id: "drive-1", label: "Stayed curious and open" },
      { id: "drive-2", label: "Persisted through a difficult conversation" },
      { id: "drive-3", label: "Adapted my approach for a colleague from a different background" },
    ],
  },
  {
    id: "knowledge",
    label: "Knowledge (Understanding Cultures)",
    wins: [
      { id: "knowledge-1", label: "Learned something new about a colleague's cultural norms" },
      { id: "knowledge-2", label: "Noticed differences in communication or work style" },
      { id: "knowledge-3", label: "Identified potential misunderstandings early" },
    ],
  },
  {
    id: "strategy",
    label: "Strategy (Planning & Awareness)",
    wins: [
      { id: "strategy-1", label: "Adjusted my plan for cultural differences" },
      { id: "strategy-2", label: "Checked assumptions before speaking" },
      { id: "strategy-3", label: "Anticipated how a colleague might interpret instructions" },
    ],
  },
  {
    id: "action",
    label: "Action (Behavioral CQ)",
    wins: [
      { id: "action-1", label: "Used active listening" },
      { id: "action-2", label: "Asked a clarifying question" },
      { id: "action-3", label: "Adapted communication style (tone, directness, gestures)" },
      { id: "action-4", label: "Included a quiet colleague / built rapport across difference" },
      { id: "action-5", label: "Navigated a misunderstanding calmly" },
      { id: "action-6", label: "Gave culturally sensitive feedback" },
    ],
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function frictionDescription(entry: { diagnosis: DiagnosisResult; interactionType: string }): string {
  const gate2Label =
    GATE2_OPTIONS[entry.diagnosis.gate1Branch as keyof typeof GATE2_OPTIONS]?.find(
      (o) => o.id === entry.diagnosis.gate2Choice
    )?.label ?? entry.diagnosis.gate2Choice;

  const gate3Label = entry.diagnosis.gate3Choice
    ? GATE3_OPTIONS[`${entry.diagnosis.gate1Branch}:${entry.diagnosis.gate2Choice}`]?.find(
        (o) => o.id === entry.diagnosis.gate3Choice
      )?.label
    : null;

  const interactionLabel =
    INTERACTION_TYPES.find((t) => t.id === entry.interactionType)?.label ?? entry.interactionType;

  return [gate2Label, gate3Label].filter(Boolean).join(" → ") + (interactionLabel ? ` (${interactionLabel})` : "");
}

// ─── PillSelect ───────────────────────────────────────────────────────────────

function PillSelect({
  options, value, onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm border transition-colors",
            value === opt
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-foreground border-border hover:border-primary/50"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── SavedEntryCard ───────────────────────────────────────────────────────────

function SavedEntryCard({ entry, index, onRemove }: {
  entry: FrictionEntry; index: number; onRemove: () => void;
}) {
  const interactionLabel =
    INTERACTION_TYPES.find((t) => t.id === entry.interactionType)?.label ?? entry.interactionType;

  const gate2Label =
    GATE2_OPTIONS[entry.diagnosis.gate1Branch as keyof typeof GATE2_OPTIONS]?.find(
      (o) => o.id === entry.diagnosis.gate2Choice
    )?.label ?? entry.diagnosis.gate2Choice;

  const gate3Label = entry.diagnosis.gate3Choice
    ? GATE3_OPTIONS[`${entry.diagnosis.gate1Branch}:${entry.diagnosis.gate2Choice}`]?.find(
        (o) => o.id === entry.diagnosis.gate3Choice
      )?.label
    : null;

  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">Incident #{index + 1}</p>
          <p className="text-sm font-medium leading-snug">
            {gate2Label}
            {gate3Label && <span className="text-muted-foreground font-normal"> → {gate3Label}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
          aria-label="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>{interactionLabel}</span>
        {entry.timeSpent && <span>· {entry.timeSpent}</span>}
        {entry.isNew && <span>· {entry.isNew}</span>}
        {entry.trend && <span>· {entry.trend}</span>}
      </div>
    </div>
  );
}

// ─── NewEntryForm ─────────────────────────────────────────────────────────────

function NewEntryForm({ onSave, onCancel, showCancel }: {
  onSave: (entry: Omit<FrictionEntry, "id">) => void;
  onCancel: () => void;
  showCancel: boolean;
}) {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [meta, setMeta] = useState({ interactionType: "", timeSpent: "", isNew: "", trend: "" });

  const gate2Label = diagnosis
    ? GATE2_OPTIONS[diagnosis.gate1Branch as keyof typeof GATE2_OPTIONS]?.find(
        (o) => o.id === diagnosis.gate2Choice
      )?.label ?? diagnosis.gate2Choice
    : null;

  const gate3Label = diagnosis?.gate3Choice
    ? GATE3_OPTIONS[`${diagnosis.gate1Branch}:${diagnosis.gate2Choice}`]?.find(
        (o) => o.id === diagnosis.gate3Choice
      )?.label
    : null;

  const isComplete =
    diagnosis !== null &&
    meta.interactionType !== "" &&
    meta.timeSpent !== "" &&
    meta.isNew !== "" &&
    (meta.isNew !== "Repeating" || meta.trend !== "");

  return (
    <div className="space-y-4 border border-dashed border-border rounded-xl p-4">
      {!diagnosis ? (
        <FrictionDiagnoser onComplete={(d) => { if (d) setDiagnosis(d); }} showOptOut={false} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-secondary/30 border border-border px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">You described:</p>
              <p className="text-sm font-medium leading-snug">
                {gate2Label}
                {gate3Label && <span className="text-muted-foreground font-normal"> → {gate3Label}</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDiagnosis(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors shrink-0 ml-4"
            >
              Change
            </button>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Who was involved?</p>
            <PillSelect
              options={INTERACTION_TYPES.map((t) => t.label)}
              value={INTERACTION_TYPES.find((t) => t.id === meta.interactionType)?.label ?? ""}
              onChange={(label) => {
                const found = INTERACTION_TYPES.find((t) => t.label === label);
                if (found) setMeta((p) => ({ ...p, interactionType: found.id }));
              }}
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Time spent resolving this:</p>
            <PillSelect
              options={TIME_OPTIONS}
              value={meta.timeSpent}
              onChange={(v) => setMeta((p) => ({ ...p, timeSpent: v }))}
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Was this new or repeating?</p>
            <PillSelect
              options={PATTERN_OPTIONS}
              value={meta.isNew}
              onChange={(v) => setMeta((p) => ({ ...p, isNew: v, trend: v === "New" ? "" : p.trend }))}
            />
          </div>

          {meta.isNew === "Repeating" && (
            <div>
              <p className="text-sm font-medium mb-2">Compared to last week:</p>
              <PillSelect
                options={TREND_OPTIONS}
                value={meta.trend}
                onChange={(v) => setMeta((p) => ({ ...p, trend: v }))}
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => { if (isComplete) onSave({ diagnosis: diagnosis!, ...meta }); }}
              disabled={!isComplete}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold transition-opacity disabled:opacity-40"
            >
              Save incident
            </button>
            {showCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FrictionFollowUpSection ──────────────────────────────────────────────────

function FrictionFollowUpSection({
  priorFrictions,
  followUps,
  onChange,
}: {
  priorFrictions: PriorFriction[];
  followUps: FrictionFollowUp[];
  onChange: (id: string, resolution: ResolutionId) => void;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-xl font-semibold">Following Up</h2>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          {priorFrictions.length} open {priorFrictions.length === 1 ? "issue" : "issues"} from last week
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        You reported friction last week. Let us know how each one is going before we ask about this week.
      </p>
      <div className="space-y-4">
        {priorFrictions.map((pf) => {
          const current = followUps.find((f) => f.id === pf.id)?.resolution ?? "";
          return (
            <Card key={pf.id}>
              <CardContent className="pt-5 space-y-3">
                {/* The issue they reported */}
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-xs text-amber-600 font-medium mb-0.5 uppercase tracking-wide">Last week you reported</p>
                  <p className="text-sm text-amber-900 font-medium leading-snug">{pf.description}</p>
                </div>
                {/* Resolution options */}
                <p className="text-sm font-medium">How is this now?</p>
                <div className="grid grid-cols-2 gap-2">
                  {RESOLUTION_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = current === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(pf.id, opt.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left",
                          isSelected
                            ? opt.bg + " " + opt.color + " shadow-sm"
                            : "border-border bg-card text-foreground hover:border-primary/40"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isSelected ? opt.color : "text-muted-foreground")} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

// ─── ScaleQuestion ────────────────────────────────────────────────────────────

function ScaleQuestion({
  id, label, lowLabel = "Not at all", highLabel = "Completely", value, onChange,
}: {
  id: string; label: string; lowLabel?: string; highLabel?: string;
  value: number | undefined; onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-foreground">{label}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground shrink-0 w-16">{lowLabel}</span>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "w-8 h-8 rounded-md text-xs font-semibold transition-colors flex-shrink-0",
              value === n
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-primary/20"
            )}
          >
            {n}
          </button>
        ))}
        <span className="text-xs text-muted-foreground shrink-0 w-16 text-right">{highLabel}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Survey() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token");

  // ── Token auth ───────────────────────────────────────────────────────────────
  const [tokenData, setTokenData] = useState<{
    user_id: string; school_id: string; week: string;
  } | null>(null);
  const [tokenLoading, setTokenLoading] = useState(!!tokenParam);
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    if (!tokenParam) return;
    (async () => {
      const { data, error } = await supabase
        .from("survey_tokens")
        .select("user_id, school_id, week, used_at, expires_at")
        .eq("token", tokenParam)
        .maybeSingle();

      if (error || !data)               setTokenError("This survey link is invalid or has expired.");
      else if (data.used_at)            setTokenError("You've already completed this week's survey. Thank you!");
      else if (new Date(data.expires_at) < new Date()) setTokenError("This survey link has expired.");
      else setTokenData({ user_id: data.user_id, school_id: data.school_id, week: data.week });
      setTokenLoading(false);
    })();
  }, [tokenParam]);

  const effectiveUserId   = tokenData?.user_id   ?? user?.id;
  const effectiveSchoolId = tokenData?.school_id ?? user?.user_metadata?.school_id;
  const effectiveWeek     = tokenData?.week       ?? getThisWeekMonday();

  // ── Load prior frictions ─────────────────────────────────────────────────────
  const [priorFrictions, setPriorFrictions] = useState<PriorFriction[]>([]);
  const [followUps, setFollowUps] = useState<FrictionFollowUp[]>([]);
  const [priorLoading, setPriorLoading] = useState(true);

  useEffect(() => {
    if (!effectiveUserId || !effectiveSchoolId) {
      setPriorLoading(false);
      return;
    }
    (async () => {
      const lastWeek = getLastWeekMonday();
      const { data } = await supabase
        .from("survey_responses")
        .select("responses")
        .eq("user_id", effectiveUserId)
        .eq("school_id", effectiveSchoolId)
        .eq("week", lastWeek)
        .maybeSingle();

      if (data?.responses) {
        const responses = data.responses as Record<string, unknown>;
        const friction = responses.friction;
        if (Array.isArray(friction) && friction.length > 0) {
          const open: PriorFriction[] = friction
            // Only carry forward entries that were not already resolved last week
            .filter((f: any) => !f.resolvedLastWeek)
            .map((f: any, i: number) => ({
              id: f.id ?? `prior-${i}`,
              week: lastWeek,
              description: frictionDescription(f),
              interactionType: f.interactionType ?? "",
            }));
          setPriorFrictions(open);
          setFollowUps(open.map((pf) => ({ id: pf.id, resolution: "" })));
        }
      }
      setPriorLoading(false);
    })();
  }, [effectiveUserId, effectiveSchoolId]);

  // ── Load webinar attendance ──────────────────────────────────────────────────
  // Replace getMockWebinarAttendances with a real Supabase query when the table exists.
  const [webinarAttendances, setWebinarAttendances] = useState<WebinarAttendance[]>([]);

  useEffect(() => {
    if (!effectiveUserId) return;
    // Real query would be:
    // const threeWeeksAgo = new Date(); threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    // supabase.from("webinar_attendance").select(...).eq("user_id", ...).gte("attended_at", ...)
    const mock = getMockWebinarAttendances(effectiveUserId);
    // Filter to within 3 weeks
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    setWebinarAttendances(
      mock.filter((a) => new Date(a.attended_at) >= threeWeeksAgo)
    );
  }, [effectiveUserId]);

  const hasWebinarGate = webinarAttendances.length > 0;

  // ── Section 1: New frictions ─────────────────────────────────────────────────
  const [frictionEntries, setFrictionEntries] = useState<FrictionEntry[]>([]);
  const [frictionMode, setFrictionMode] = useState<"idle" | "adding" | "skipped">("idle");

  const addEntry = (entry: Omit<FrictionEntry, "id">) => {
    setFrictionEntries((prev) => [...prev, { ...entry, id: crypto.randomUUID() }]);
    setFrictionMode("idle");
  };

  // ── Section 2: CQ Wins (webinar gate) ───────────────────────────────────────
  const [selectedWins, setSelectedWins] = useState<string[]>([]);
  const [winsNoneOfAbove, setWinsNoneOfAbove] = useState(false);
  const [winsDetail, setWinsDetail] = useState("");

  const toggleWin = (winId: string) => {
    setWinsNoneOfAbove(false);
    setSelectedWins((prev) =>
      prev.includes(winId) ? prev.filter((w) => w !== winId) : [...prev, winId]
    );
  };

  // ── Section 3: Monthly CQ quadrant ──────────────────────────────────────────
  const isMonthlyWeek = getIsMonthlyWeek();
  const [cqRatings, setCqRatings] = useState<Record<string, number>>({});

  // ── Section 5: Wellbeing ─────────────────────────────────────────────────────
  const [wellbeingRatings, setWellbeingRatings] = useState<Record<string, number>>({});

  // ── Section 6: Open feedback ─────────────────────────────────────────────────
  const [whatHelped, setWhatHelped] = useState("");
  const [whatCouldImprove, setWhatCouldImprove] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Follow-up helpers ────────────────────────────────────────────────────────
  const setFollowUpResolution = (id: string, resolution: ResolutionId) => {
    setFollowUps((prev) =>
      prev.map((f) => (f.id === id ? { ...f, resolution } : f))
    );
  };

  const allFollowUpsAnswered =
    priorFrictions.length === 0 ||
    followUps.every((f) => f.resolution !== "");

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);

    const responsesPayload: Record<string, unknown> = {
      // Follow-up on prior frictions
      ...(followUps.length > 0 ? { friction_follow_ups: followUps } : {}),

      // New frictions this week
      friction:
        frictionMode === "skipped"
          ? "skipped"
          : frictionEntries.length > 0
          ? frictionEntries.map(({ id, ...rest }) => rest)
          : undefined,

      // CQ wins (webinar-triggered)
      ...(hasWebinarGate ? {
        webinar_cq_wins: {
          webinar_ids: webinarAttendances.map((a) => a.id),
          wins: selectedWins,
          none_of_above: winsNoneOfAbove,
          detail: winsDetail || undefined,
        },
      } : {}),

      // Monthly CQ quadrant scores
      ...(isMonthlyWeek && Object.keys(cqRatings).length > 0
        ? { cqQuadrants: cqRatings }
        : {}),

      // Wellbeing
      wellbeing: wellbeingRatings,

      // Open feedback
      openFeedback: {
        whatHelped: whatHelped || undefined,
        whatCouldImprove: whatCouldImprove || undefined,
      },
    };

    if (effectiveUserId && effectiveSchoolId) {
      await supabase.from("survey_responses").insert([{
        user_id: effectiveUserId,
        school_id: effectiveSchoolId,
        week: effectiveWeek,
        responses: responsesPayload as any,
      }]);

      if (tokenParam) {
        await supabase
          .from("survey_tokens")
          .update({ used_at: new Date().toISOString() })
          .eq("token", tokenParam);
      }
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  const resetForm = () => {
    setFrictionEntries([]); setFrictionMode("idle");
    setSelectedWins([]); setWinsNoneOfAbove(false); setWinsDetail("");
    setCqRatings({}); setWellbeingRatings({});
    setWhatHelped(""); setWhatCouldImprove("");
    setSubmitted(false);
  };

  // ── Guard states ─────────────────────────────────────────────────────────────

  if (tokenLoading || priorLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="container max-w-md py-20 text-center">
        <Card>
          <CardContent className="pt-8 pb-8">
            <p className="text-lg font-semibold text-foreground mb-2">{tokenError}</p>
            <p className="text-sm text-muted-foreground">
              If you need a new link, one will be sent in the next reminder.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container max-w-2xl py-12 text-center space-y-3">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
        <h2 className="font-sans text-2xl font-semibold">Thank you!</h2>
        <p className="text-muted-foreground">Your responses have been recorded for this week.</p>
        <Button onClick={resetForm} variant="outline">Submit another response</Button>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="container max-w-3xl py-10 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="h-7 w-7 text-primary" />
          <h1 className="font-sans text-3xl font-semibold">Weekly CQ Survey</h1>
        </div>
        <p className="text-muted-foreground">
          Track your cross-cultural intelligence growth week by week.{" "}
          <span className="font-medium">~3–5 minutes.</span>
        </p>
        {/* Survey flow overview chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs text-muted-foreground">
          {priorFrictions.length > 0 && (
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              Follow-up ({priorFrictions.length})
            </span>
          )}
          <span className="bg-muted px-2 py-0.5 rounded-full">New frictions</span>
          {hasWebinarGate && (
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Video className="h-3 w-3" /> CQ Wins
            </span>
          )}
          {isMonthlyWeek && (
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              Monthly CQ
            </span>
          )}
          <span className="bg-muted px-2 py-0.5 rounded-full">Wellbeing</span>
          <span className="bg-muted px-2 py-0.5 rounded-full">Feedback</span>
        </div>
      </div>

      {/* ── Follow-up gate ── */}
      {priorFrictions.length > 0 && (
        <FrictionFollowUpSection
          priorFrictions={priorFrictions}
          followUps={followUps}
          onChange={setFollowUpResolution}
        />
      )}

      {/* Divider between follow-up and new frictions */}
      {priorFrictions.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            Now this week <ArrowRight className="h-3 w-3" />
          </span>
          <div className="flex-1 border-t border-border" />
        </div>
      )}

      {/* ── Section 1: New frictions ── */}
      <section>
        <h2 className="text-xl font-semibold mb-1">
          {priorFrictions.length > 0 ? "Any new friction this week?" : "Section 1: Friction This Week"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Log any frustrating cross-cultural interactions. Each incident gets its own diagnosis.
        </p>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {frictionEntries.map((entry, i) => (
              <SavedEntryCard
                key={entry.id}
                entry={entry}
                index={i}
                onRemove={() => setFrictionEntries((prev) => prev.filter((e) => e.id !== entry.id))}
              />
            ))}

            {frictionMode === "adding" && (
              <NewEntryForm
                onSave={addEntry}
                onCancel={() => setFrictionMode("idle")}
                showCancel={frictionEntries.length > 0}
              />
            )}

            {frictionMode === "skipped" && (
              <div className="flex items-center justify-between px-1 py-1">
                <p className="text-sm text-muted-foreground">✓ No new friction this week.</p>
                <button
                  type="button"
                  onClick={() => setFrictionMode("idle")}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Change
                </button>
              </div>
            )}

            {frictionMode === "idle" && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFrictionMode("adding")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {frictionEntries.length === 0 ? "Log a friction incident" : "Add another incident"}
                </button>
                {frictionEntries.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setFrictionMode("skipped")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    No friction this week →
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Section 2: CQ Wins (webinar gate) ── */}
      {hasWebinarGate && (
        <section>
          <div className="flex items-start gap-3 mb-1">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold">CQ Wins This Week</h2>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Video className="h-3 w-3" /> webinar follow-up
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                You recently attended{" "}
                <span className="font-medium text-foreground">
                  {webinarAttendances.map((a) => `"${a.webinar_title}"`).join(", ")}
                </span>
                . Did anything from that session show up in your work this week?
              </p>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            {CQ_WIN_CATEGORIES.map((cat) => (
              <Card key={cat.id}>
                <CardContent className="pt-5">
                  <p className="text-sm font-semibold text-primary mb-3">{cat.label}</p>
                  <div className="space-y-2">
                    {cat.wins.map((win: { id: string; label: string }) => (
                      <label key={win.id} className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={selectedWins.includes(win.id)}
                          onCheckedChange={() => toggleWin(win.id)}
                          disabled={winsNoneOfAbove}
                        />
                        <span className={cn("text-sm", winsNoneOfAbove && "text-muted-foreground")}>{win.label}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* None of the above */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={winsNoneOfAbove}
                    onCheckedChange={(checked) => {
                      setWinsNoneOfAbove(!!checked);
                      if (checked) setSelectedWins([]);
                    }}
                  />
                  <span className="text-sm font-medium text-muted-foreground">None of the above this week</span>
                </label>
              </CardContent>
            </Card>

            {/* Optional detail */}
            {(selectedWins.length > 0 || winsNoneOfAbove) && !winsNoneOfAbove && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Optional: describe what you did{" "}
                  <span className="text-muted-foreground font-normal">(helps us improve the list)</span>
                </p>
                <Textarea
                  placeholder="Briefly describe what happened…"
                  value={winsDetail}
                  onChange={(e) => setWinsDetail(e.target.value)}
                  className="text-sm resize-none"
                  rows={2}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Section 3: Monthly CQ quadrant ── */}
      {isMonthlyWeek && (
        <section>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-semibold">Monthly CQ Check-In</h2>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              monthly
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Once a month we ask you to reflect on your overall CQ across all four quadrants. (1 = Not at all, 10 = Very much)
          </p>
          <Card>
            <CardContent className="pt-6 space-y-6">
              {[
                { id: "drive",     label: "Drive: How motivated and confident were you in cross-cultural interactions this month?" },
                { id: "knowledge", label: "Knowledge: How well did you understand cultural differences this month?" },
                { id: "strategy",  label: "Strategy: How intentional were you in planning or adapting your approach?" },
                { id: "action",    label: "Action: How effectively did you adapt your behavior to others' styles?" },
              ].map((q) => (
                <ScaleQuestion
                  key={q.id}
                  id={q.id}
                  label={q.label}
                  lowLabel="Not at all"
                  highLabel="Very much"
                  value={cqRatings[q.id]}
                  onChange={(n) => setCqRatings((prev) => ({ ...prev, [q.id]: n }))}
                />
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Section 5: Wellbeing ── */}
      <section>
        <h2 className="text-xl font-semibold mb-1">Wellbeing Check-In</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Rate how you felt this week. (1 = Not at all, 10 = Completely)
        </p>
        <Card>
          <CardContent className="pt-6 space-y-6">
            {[
              { id: "workload",               label: "My workload felt manageable this week" },
              { id: "leadership_support",     label: "I felt supported by leadership this week" },
              { id: "psychological_safety",   label: "I felt safe speaking up this week" },
              { id: "professional_growth",    label: "I feel I am growing professionally" },
              { id: "process_friction",       label: "Work felt harder than it should due to processes or communication" },
              { id: "priority_clarity",       label: "I clearly understood my top 1–3 work priorities this week" },
              { id: "direction_consistency",  label: "School leadership direction and decisions felt consistent this week" },
              { id: "communication_clarity",  label: "Instructions from leadership were clear enough to act on without needing clarification" },
            ].map((q) => (
              <ScaleQuestion
                key={q.id}
                id={q.id}
                label={q.label}
                value={wellbeingRatings[q.id]}
                onChange={(n) => setWellbeingRatings((prev) => ({ ...prev, [q.id]: n }))}
              />
            ))}
          </CardContent>
        </Card>
      </section>

      {/* ── Section 6: Open Feedback ── */}
      <section>
        <h2 className="text-xl font-semibold mb-1">Open Feedback <span className="text-base font-normal text-muted-foreground">(Optional)</span></h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">What helped you work better across differences this week?</p>
              <Textarea
                placeholder="Share what worked well…"
                value={whatHelped}
                onChange={(e) => setWhatHelped(e.target.value)}
                className="text-sm resize-none"
                rows={3}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">What could be improved in collaboration or communication?</p>
              <Textarea
                placeholder="Share any challenges or ideas…"
                value={whatCouldImprove}
                onChange={(e) => setWhatCouldImprove(e.target.value)}
                className="text-sm resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Follow-up incomplete warning */}
      {!allFollowUpsAnswered && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          Please answer the follow-up questions above before submitting.
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end pb-8">
        <Button
          onClick={handleSubmit}
          disabled={submitting || !allFollowUpsAnswered}
          className="px-8"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</>
          ) : (
            "Submit Survey"
          )}
        </Button>
      </div>

    </div>
  );
}
