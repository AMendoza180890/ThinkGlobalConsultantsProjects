import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Shared data ──────────────────────────────────────────────────────────────

export const QUADRANT_META = [
  {
    id: "drive",
    label: "Drive",
    color: "#6366f1",
    question: "Do I want to engage across differences?",
    low: {
      pattern: "Avoidance · frustration · low effort",
      behaviors: [
        "Avoids difficult parents (different culture/language)",
        "Labels students as 'unmotivated' instead of adapting",
        "Resists culturally inclusive approaches",
        "Visible frustration with indirect communication",
      ],
    },
    high: {
      pattern: "Curiosity · persistence · resilience",
      behaviors: [
        "Actively seeks to understand student backgrounds",
        "Persists through misunderstandings instead of withdrawing",
        "Regulates frustration in ambiguous situations",
        "Sees friction as a learning opportunity",
      ],
    },
    pdFocus: "Build motivational framing around cultural encounters — reframe friction as data, not failure.",
    scenarios: ["Students aren't participating", "Staff conflict"],
  },
  {
    id: "knowledge",
    label: "Knowledge",
    color: "#0ea5e9",
    question: "Do I understand what's going on?",
    low: {
      pattern: "Misdiagnosis · stereotyping · one-size-fits-all",
      behaviors: [
        "Confuses culture with personality",
        "Misreads no eye contact as disrespect",
        "Penalises quiet students (high-context learners)",
        "Thinks parent silence means disengagement",
      ],
    },
    high: {
      pattern: "Accurate interpretation · nuanced understanding",
      behaviors: [
        "Distinguishes culture vs personality vs circumstance",
        "Recognises direct vs indirect communication styles",
        "Offers multiple participation methods",
        "Adjusts expectations for parent response timing/style",
      ],
    },
    pdFocus: "Teach cultural frameworks (high/low context, individualism/collectivism) with concrete classroom examples.",
    scenarios: ["Students aren't participating", "Parent communication issues"],
  },
  {
    id: "strategy",
    label: "Strategy",
    color: "#f59e0b",
    question: "Do I plan and interpret effectively?",
    low: {
      pattern: "Reactive · unaware · misaligned expectations",
      behaviors: [
        "Goes into interactions without anticipating differences",
        "Misreads situations in real time",
        "Doesn't check for shared understanding",
        "One approach — confused when half the class disengages",
      ],
    },
    high: {
      pattern: "Intentional · reflective · anticipatory",
      behaviors: [
        "Plans for cultural differences before interactions",
        "Uses perspective-taking in real time",
        "Checks assumptions (\"What might I be missing?\")",
        "Designs multiple engagement paths into lessons",
      ],
    },
    pdFocus: "Structured lesson-planning protocols that include a cultural perspective-taking checkpoint before delivery.",
    scenarios: ["Parent communication issues", "Classroom behaviour issues"],
  },
  {
    id: "action",
    label: "Action",
    color: "#10b981",
    question: "Can I adapt what I actually do?",
    low: {
      pattern: "Rigid · inconsistent · friction despite intent",
      behaviors: [
        "Same communication style for all students",
        "Knows differences exist but can't operationalise them",
        "Same script with all families regardless of context",
        "Creates friction despite good intentions",
      ],
    },
    high: {
      pattern: "Flexible · adaptive · precise execution",
      behaviors: [
        "Shifts between direct and indirect communication",
        "Adapts teaching methods to cultural preferences",
        "Public vs private feedback based on cultural norms",
        "Designs both individual and collaborative tasks",
      ],
    },
    pdFocus: "Practice-based coaching: role-play adapting communication scripts across different family and student profiles.",
    scenarios: ["Staff conflict", "Classroom behaviour issues"],
  },
];

const ROOT_CAUSES: {
  scenario: string;
  quadrants: ("drive" | "knowledge" | "strategy" | "action")[];
  rows: { dim: string; low: string; high: string }[];
}[] = [
  {
    scenario: "Students aren't participating",
    quadrants: ["drive", "knowledge", "strategy", "action"],
    rows: [
      { dim: "Drive",     low: "\"I don't want to deal with this group\"",       high: "\"I'm motivated to solve this\"" },
      { dim: "Knowledge", low: "\"They're shy / unmotivated\"",                  high: "\"They may be high-context / collectivist\"" },
      { dim: "Strategy",  low: "\"Why didn't my approach work?\"",               high: "\"I'll plan alternative participation paths\"" },
      { dim: "Action",    low: "\"I tried something but don't know what to change\"", high: "Written responses + small groups + delayed sharing" },
    ],
  },
  {
    scenario: "Parent communication issues",
    quadrants: ["drive", "knowledge", "strategy", "action"],
    rows: [
      { dim: "Drive",     low: "Avoids outreach",                        high: "Seeks alternate channels" },
      { dim: "Knowledge", low: "Misreads silence as disengagement",       high: "Adjusts expectations for response style" },
      { dim: "Strategy",  low: "No plan for communication approach",      high: "Clarifies expectations upfront" },
      { dim: "Action",    low: "Uses wrong tone or same script",          high: "Adapts message style per family" },
    ],
  },
  {
    scenario: "Staff conflict",
    quadrants: ["drive", "knowledge", "strategy", "action"],
    rows: [
      { dim: "Drive",     low: "Avoids collaboration",                    high: "Leans into the difficulty" },
      { dim: "Knowledge", low: "Misattributes intent or motivation",       high: "Considers cultural style differences" },
      { dim: "Strategy",  low: "Doesn't anticipate style differences",    high: "Prepares for different conflict styles" },
      { dim: "Action",    low: "Communicates poorly under pressure",      high: "Adjusts style to the person and moment" },
    ],
  },
  {
    scenario: "Classroom behaviour issues",
    quadrants: ["drive", "knowledge", "strategy", "action"],
    rows: [
      { dim: "Drive",     low: "Gives up quickly",                        high: "Persists, experiments" },
      { dim: "Knowledge", low: "Labels students by personality",           high: "Checks for cultural explanation first" },
      { dim: "Strategy",  low: "Reacts emotionally without a plan",       high: "Pauses to interpret before acting" },
      { dim: "Action",    low: "One rigid discipline method",             high: "Adjusts approach per student/context" },
    ],
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function QuadrantPill({
  id, label, color, selected, onClick,
}: {
  id: string; label: string; color: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all",
        selected
          ? "text-white border-transparent shadow-sm"
          : "bg-background text-muted-foreground border-border hover:border-muted-foreground/40"
      )}
      style={selected ? { backgroundColor: color, borderColor: color } : {}}
    >
      {label}
    </button>
  );
}

function BehaviorCard({ q }: { q: typeof QUADRANT_META[0] }) {
  return (
    <Card className="border-2" style={{ borderColor: q.color + "30" }}>
      <CardContent className="pt-5 pb-5">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: q.color }}>
            {q.label}
          </p>
          <p className="text-sm text-muted-foreground italic">{q.question}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
            <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mb-2">Low · {q.low.pattern}</p>
            <ul className="space-y-1">
              {q.low.behaviors.map(b => (
                <li key={b} className="text-[11px] text-foreground/75 flex gap-1.5">
                  <span className="text-red-400 shrink-0 mt-px">•</span>{b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-2">High · {q.high.pattern}</p>
            <ul className="space-y-1">
              {q.high.behaviors.map(b => (
                <li key={b} className="text-[11px] text-foreground/75 flex gap-1.5">
                  <span className="text-emerald-500 shrink-0 mt-px">•</span>{b}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 border border-border/50">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">PD Focus</p>
          <p className="text-xs text-foreground/80">{q.pdFocus}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RootCauseRow({ rc, activeIds }: { rc: typeof ROOT_CAUSES[0]; activeIds: string[] }) {
  const [open, setOpen] = useState(false);
  const isRelevant = activeIds.length === 0 || rc.quadrants.some(q => activeIds.includes(q));
  if (!isRelevant) return null;
  return (
    <Card>
      <CardContent className="pt-4 pb-0">
        <button
          className="w-full flex items-center justify-between gap-2 text-left pb-4"
          onClick={() => setOpen(o => !o)}
        >
          <p className="text-sm font-semibold">{rc.scenario}</p>
          {open
            ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        {open && (
          <div className="space-y-2 pb-4 border-t pt-3">
            {rc.rows.map(row => (
              <div key={row.dim} className="grid grid-cols-[80px_1fr_1fr] gap-2 text-xs items-start">
                <span className="font-semibold text-muted-foreground pt-0.5">{row.dim}</span>
                <span className="rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 leading-snug">{row.low}</span>
                <span className="rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-1 leading-snug">{row.high}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function CQPlaybook() {
  const [activeIds, setActiveIds] = useState<string[]>([]);

  function toggleQuadrant(id: string) {
    setActiveIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const visibleQuadrants = activeIds.length === 0
    ? QUADRANT_META
    : QUADRANT_META.filter(q => activeIds.includes(q.id));

  return (
    <div className="container max-w-4xl py-10 space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">CQ Playbook</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Reference tool for coaches and instructional leads. Filter by dimension to focus on what your data shows.
        </p>

        {/* Quadrant filter pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {QUADRANT_META.map(q => (
            <QuadrantPill
              key={q.id}
              id={q.id}
              label={q.label}
              color={q.color}
              selected={activeIds.includes(q.id)}
              onClick={() => toggleQuadrant(q.id)}
            />
          ))}
          {activeIds.length > 0 && (
            <button
              onClick={() => setActiveIds([])}
              className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
        {activeIds.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">Showing all dimensions — select one or more to focus.</p>
        )}
      </div>

      {/* Section 1 — Observable behaviors */}
      <section>
        <div className="mb-3">
          <h3 className="text-base font-semibold">What low and high looks like</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Observable behaviors per dimension, with suggested PD focus.</p>
        </div>
        <div className="space-y-4">
          {visibleQuadrants.map(q => <BehaviorCard key={q.id} q={q} />)}
        </div>
      </section>

      {/* Section 2 — Root-cause diagnosis */}
      <section>
        <div className="mb-3">
          <h3 className="text-base font-semibold">Root-cause diagnosis</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Same problem, different CQ root cause.
            {activeIds.length > 0 && " Showing scenarios linked to selected dimension(s)."}
          </p>
        </div>
        <div className="space-y-2">
          {ROOT_CAUSES.map(rc => (
            <RootCauseRow key={rc.scenario} rc={rc} activeIds={activeIds} />
          ))}
        </div>
      </section>

      {/* Section 3 — Symptom matrix */}
      <section>
        <div className="mb-3">
          <h3 className="text-base font-semibold">Teacher symptom matrix</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Full reference — core pattern and key behaviors per dimension.</p>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-xs min-w-[540px]">
            <thead>
              <tr className="bg-muted/60 border-b">
                <th className="text-left px-3 py-2.5 font-semibold w-24">Dimension</th>
                <th className="text-left px-3 py-2.5 font-semibold w-16">Level</th>
                <th className="text-left px-3 py-2.5 font-semibold">Core pattern</th>
                <th className="text-left px-3 py-2.5 font-semibold">Key behaviors</th>
              </tr>
            </thead>
            <tbody>
              {visibleQuadrants.flatMap((q, qi) => [
                <tr key={`${q.id}-low`} className={qi % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="px-3 py-2.5 font-medium align-top" rowSpan={2} style={{ borderLeft: `3px solid ${q.color}40` }}>
                    {q.label}
                  </td>
                  <td className="px-3 py-2.5 align-top"><span className="text-red-600 font-semibold">Low</span></td>
                  <td className="px-3 py-2.5 text-foreground/70 align-top">{q.low.pattern}</td>
                  <td className="px-3 py-2.5 align-top">
                    <ul className="space-y-0.5">
                      {q.low.behaviors.map(b => (
                        <li key={b} className="text-foreground/70 flex gap-1">
                          <span className="text-red-400 shrink-0">•</span>{b}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>,
                <tr key={`${q.id}-high`} className={`border-b ${qi % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                  <td className="px-3 py-2.5 align-top"><span className="text-emerald-600 font-semibold">High</span></td>
                  <td className="px-3 py-2.5 text-foreground/70 align-top">{q.high.pattern}</td>
                  <td className="px-3 py-2.5 align-top">
                    <ul className="space-y-0.5">
                      {q.high.behaviors.map(b => (
                        <li key={b} className="text-foreground/70 flex gap-1">
                          <span className="text-emerald-500 shrink-0">•</span>{b}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>,
              ])}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
