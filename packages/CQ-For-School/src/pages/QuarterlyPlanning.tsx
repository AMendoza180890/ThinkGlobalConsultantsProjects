import { useState } from "react";
import { Check, Circle, CalendarPlus, Lightbulb, AlertTriangle, Heart, TrendingUp, Fingerprint, Video, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "high" | "medium" | "low";
type TodoStatus = "pending" | "done";

interface QuarterlyFocus {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  source: "cultural" | "cq" | "wellness" | "issues";
}

interface AdminTodo {
  id: string;
  label: string;
  detail: string;
  priority: Priority;
  status: TodoStatus;
}

interface RecommendedWebinar {
  id: string;
  title: string;
  description: string;
  urgency: Priority;
  reductionPct: number;
  pendingCount: number;
  scheduled: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUARTER = "Q2 2025 · Apr – Jun";

const FOCUSES: QuarterlyFocus[] = [
  {
    id: "f1",
    title: "Close the hierarchy & voice gap",
    description: "47pt Power Distance spread between admin and new teachers is the single largest driver of friction this quarter.",
    priority: "high",
    source: "cultural",
  },
  {
    id: "f2",
    title: "Rebuild decision-making confidence",
    description: "CQ Strategy scores in Middle School are at a critical low — teachers lack frameworks for navigating cross-cultural decisions.",
    priority: "high",
    source: "cq",
  },
  {
    id: "f3",
    title: "Stabilise leadership support scores",
    description: "Leadership support dropped below 6.0 for two consecutive weeks — early warning before a wellness risk event.",
    priority: "medium",
    source: "wellness",
  },
  {
    id: "f4",
    title: "Reduce unresolved teacher-admin incidents",
    description: "12 open incidents in the tracker, most tied to feedback ignored or decisions made without team input.",
    priority: "medium",
    source: "issues",
  },
  {
    id: "f5",
    title: "Extend communication webinar coverage",
    description: "Only 24 of 38 teachers have completed the communication styles webinar — the highest-impact webinar by friction reduction.",
    priority: "low",
    source: "cultural",
  },
];

const TODOS: AdminTodo[] = [
  { id: "t1", label: "Schedule hierarchy & voice webinar", detail: "36 staff pending — highest urgency this quarter.", priority: "high", status: "pending" },
  { id: "t2", label: "Review 12 open staff incidents", detail: "Resolve or assign owners before end of April.", priority: "high", status: "pending" },
  { id: "t3", label: "Send Q2 survey to all staff", detail: "Last survey was 6 weeks ago — data is ageing.", priority: "high", status: "pending" },
  { id: "t4", label: "Follow up on leadership support dip", detail: "Book 1:1s with flagged department leads.", priority: "medium", status: "pending" },
  { id: "t5", label: "Enrol remaining 14 staff in communication webinar", detail: "Completion would close the coverage gap before Q3.", priority: "medium", status: "pending" },
  { id: "t6", label: "Review Middle School CQ Strategy scores", detail: "Share findings with department head and agree an action.", priority: "medium", status: "pending" },
  { id: "t7", label: "Check Q1 webinar attendance vs friction change", detail: "Validate impact before Q2 planning is locked.", priority: "low", status: "pending" },
];

const WEBINARS: RecommendedWebinar[] = [
  {
    id: "w1",
    title: "Navigating Hierarchy & Voice Across Cultures",
    description: "For staff experiencing friction around authority, decision-making, and being heard.",
    urgency: "high",
    reductionPct: 42,
    pendingCount: 36,
    scheduled: false,
  },
  {
    id: "w2",
    title: "Agile Decision-Making Across Cultural Styles",
    description: "For teams where speed mismatches are creating blocked approvals and bypassed processes.",
    urgency: "high",
    reductionPct: 38,
    pendingCount: 32,
    scheduled: false,
  },
  {
    id: "w3",
    title: "Communication Styles Across Cultures",
    description: "For staff and teams where direct/indirect style gaps are causing misreads and broken trust.",
    urgency: "medium",
    reductionPct: 45,
    pendingCount: 14,
    scheduled: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<Priority, { pill: string; dot: string; label: string }> = {
  high:   { pill: "bg-red-50 text-red-700 border border-red-200",       dot: "bg-red-500",    label: "High priority" },
  medium: { pill: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400",  label: "Medium priority" },
  low:    { pill: "bg-slate-100 text-slate-500 border border-slate-200", dot: "bg-slate-400", label: "Lower priority" },
};

const SOURCE_ICON: Record<QuarterlyFocus["source"], React.ReactNode> = {
  cultural: <Fingerprint className="w-3.5 h-3.5" />,
  cq:       <TrendingUp className="w-3.5 h-3.5" />,
  wellness: <Heart className="w-3.5 h-3.5" />,
  issues:   <AlertTriangle className="w-3.5 h-3.5" />,
};

const SOURCE_COLOR: Record<QuarterlyFocus["source"], string> = {
  cultural: "text-indigo-500",
  cq:       "text-violet-500",
  wellness: "text-rose-500",
  issues:   "text-amber-500",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuarterlyPlanning() {
  const [todos, setTodos] = useState<AdminTodo[]>(TODOS);
  const [scheduled, setScheduled] = useState<Set<string>>(new Set());
  const [focusExpanded, setFocusExpanded] = useState(true);

  const toggleTodo = (id: string) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status: t.status === "done" ? "pending" : "done" } : t));

  const toggleSchedule = (id: string) =>
    setScheduled(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const doneTodos = todos.filter(t => t.status === "done").length;
  const totalTodos = todos.length;

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

        {/* ── Left column ── */}
        <div className="space-y-6">

          {/* Quarter header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{QUARTER}</p>
              <h2 className="text-2xl font-bold text-slate-800 mt-0.5">Quarterly Planning</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Action progress</p>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">{doneTodos}<span className="text-base font-normal text-slate-400">/{totalTodos}</span></p>
            </div>
          </div>

          {/* Quarterly Focus */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button
              onClick={() => setFocusExpanded(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Lightbulb className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="text-sm font-bold text-slate-800">Quarterly Focus Areas</span>
                <span className="text-xs text-slate-400 font-normal">— auto-generated from your survey data</span>
              </div>
              {focusExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>

            {focusExpanded && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {FOCUSES.map(f => {
                  const sty = PRIORITY_STYLES[f.priority];
                  return (
                    <div key={f.id} className="px-5 py-3.5 flex items-start gap-3">
                      <span className={`mt-0.5 shrink-0 ${SOURCE_COLOR[f.source]}`}>
                        {SOURCE_ICON[f.source]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-semibold text-slate-800">{f.title}</p>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sty.pill}`}>
                            {sty.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Queue */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">Action Queue</p>
              <span className="text-xs text-slate-400">{doneTodos} of {totalTodos} complete</span>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-slate-100">
              <div
                className="h-full bg-indigo-400 transition-all duration-300"
                style={{ width: `${Math.round((doneTodos / totalTodos) * 100)}%` }}
              />
            </div>

            <div className="divide-y divide-slate-100">
              {todos.map(t => {
                const done = t.status === "done";
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTodo(t.id)}
                    className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors group"
                  >
                    <div className="shrink-0 mt-0.5">
                      {done
                        ? <div className="h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></div>
                        : <Circle className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug ${done ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {t.label}
                      </p>
                      {!done && <p className="text-xs text-slate-400 mt-0.5">{t.detail}</p>}
                    </div>
                    <span className={`shrink-0 mt-0.5 h-1.5 w-1.5 rounded-full ${PRIORITY_STYLES[t.priority].dot}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right column: Recommended webinars ── */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">This quarter</p>
            <h3 className="text-sm font-bold text-slate-800">Recommended Webinars</h3>
          </div>

          {WEBINARS.map(w => {
            const isScheduled = scheduled.has(w.id);
            const sty = PRIORITY_STYLES[w.urgency];
            return (
              <div key={w.id} className="rounded-xl border border-slate-200 bg-white px-4 py-4 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <Video className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sty.pill}`}>
                        {sty.label === "High priority" ? "Urgent" : "Recommended"}
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums">{w.reductionPct}% friction reduction</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{w.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{w.description}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{w.pendingCount} staff pending</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleSchedule(w.id)}
                  className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                    isScheduled
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {isScheduled
                    ? <><Check className="h-3.5 w-3.5" /> Scheduled</>
                    : <><CalendarPlus className="h-3.5 w-3.5" /> Schedule</>
                  }
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
