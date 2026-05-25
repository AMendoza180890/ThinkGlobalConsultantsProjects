import { useState } from "react";
import { Plus, CheckCircle2, Clock, Circle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Quadrant = "drive" | "knowledge" | "strategy" | "action";
type Status = "planned" | "in-progress" | "complete";

interface Intervention {
  id: string;
  title: string;
  description: string;
  quadrant: Quadrant;
  segment: string;
  status: Status;
  startedMonth: string;
  completedMonth?: string;
  scoreBefore: number;
  scoreAfter?: number;
  owner: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const QUADRANT_META: Record<Quadrant, { label: string; color: string }> = {
  drive:     { label: "Drive",     color: "#1a7a7a" },
  knowledge: { label: "Knowledge", color: "#2a9d8f" },
  strategy:  { label: "Strategy",  color: "#4db8b8" },
  action:    { label: "Action",    color: "#2a9d8f" },
};

const SEED_INTERVENTIONS: Intervention[] = [
  {
    id: "1",
    title: "High-context communication workshop",
    description: "Half-day PD session introducing high/low context frameworks with scenario practice.",
    quadrant: "knowledge",
    segment: "All Teachers",
    status: "complete",
    startedMonth: "Nov 2024",
    completedMonth: "Dec 2024",
    scoreBefore: 6.1,
    scoreAfter: 6.8,
    owner: "Dr. Chen",
  },
  {
    id: "2",
    title: "Perspective-taking lesson planning protocol",
    description: "Structured template added to weekly lesson plans requiring a cultural lens checkpoint.",
    quadrant: "strategy",
    segment: "STEM Dept",
    status: "in-progress",
    startedMonth: "Feb 2025",
    scoreBefore: 5.8,
    owner: "A. Okonkwo",
  },
  {
    id: "3",
    title: "Family communication scripts — multilingual adaptation",
    description: "Coaching series on adapting outreach tone and timing for indirect communication families.",
    quadrant: "action",
    segment: "High-Friction Staff",
    status: "in-progress",
    startedMonth: "Mar 2025",
    scoreBefore: 5.4,
    owner: "S. Park",
  },
  {
    id: "4",
    title: "CQ motivation kickoff — reframing friction",
    description: "Staff meeting session repositioning cultural friction as actionable data, not a personal failure.",
    quadrant: "drive",
    segment: "Whole School",
    status: "planned",
    startedMonth: "May 2025",
    scoreBefore: 7.2,
    owner: "Principal",
  },
  {
    id: "5",
    title: "Direct vs indirect communication role-plays",
    description: "Monthly coaching sessions where teachers practice switching communication registers.",
    quadrant: "action",
    segment: "0–2 Year Teachers",
    status: "complete",
    startedMonth: "Oct 2024",
    completedMonth: "Jan 2025",
    scoreBefore: 6.0,
    scoreAfter: 7.0,
    owner: "A. Okonkwo",
  },
  {
    id: "6",
    title: "Classroom participation design sprint",
    description: "Workshop redesigning participation structures to include written, verbal, and group response modes.",
    quadrant: "strategy",
    segment: "Middle School",
    status: "complete",
    startedMonth: "Nov 2024",
    completedMonth: "Dec 2024",
    scoreBefore: 5.5,
    scoreAfter: 6.2,
    owner: "Dr. Chen",
  },
];

const QUADRANT_OPTIONS: Quadrant[] = ["drive", "knowledge", "strategy", "action"];
const STATUS_OPTIONS: Status[] = ["planned", "in-progress", "complete"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreDelta(before: number, after?: number) {
  if (after === undefined) return null;
  return Math.round((after - before) * 10) / 10;
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "complete")    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "in-progress") return <Clock className="h-4 w-4 text-amber-500" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
}

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    "complete":    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    "in-progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "planned":     "bg-muted text-muted-foreground",
  };
  const labels: Record<Status, string> = {
    "complete": "Complete", "in-progress": "In Progress", "planned": "Planned",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", styles[status])}>
      {labels[status]}
    </span>
  );
}

function DeltaChip({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-xs text-muted-foreground">—</span>;
  const pos = delta >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums", pos ? "text-emerald-600" : "text-red-500")}>
      {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pos ? "+" : ""}{delta}
    </span>
  );
}

// ─── Summary stat cards ───────────────────────────────────────────────────────

function SummaryCards({ items }: { items: Intervention[] }) {
  const complete   = items.filter(i => i.status === "complete");
  const inProgress = items.filter(i => i.status === "in-progress");
  const planned    = items.filter(i => i.status === "planned");

  const completedWithData = complete.filter(i => i.scoreAfter !== undefined);
  const avgDelta = completedWithData.length
    ? Math.round(
        (completedWithData.reduce((sum, i) => sum + (i.scoreAfter! - i.scoreBefore), 0) / completedWithData.length) * 10
      ) / 10
    : null;

  const impactedQuadrants = new Set(complete.map(i => i.quadrant)).size;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Complete",    value: complete.length,   sub: "interventions",           color: "text-emerald-600" },
        { label: "In Progress", value: inProgress.length, sub: "underway now",            color: "text-amber-600" },
        { label: "Planned",     value: planned.length,    sub: "upcoming",                color: "text-muted-foreground" },
        { label: "Avg Score Lift", value: avgDelta !== null ? `+${avgDelta}` : "—", sub: `across ${impactedQuadrants} dimensions`, color: "text-indigo-600" },
      ].map(s => (
        <Card key={s.label}>
          <CardContent className="pt-4 pb-4">
            <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.value}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
            <p className="text-[11px] text-muted-foreground">{s.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Intervention card ────────────────────────────────────────────────────────

function InterventionCard({ item }: { item: Intervention }) {
  const meta  = QUADRANT_META[item.quadrant];
  const delta = scoreDelta(item.scoreBefore, item.scoreAfter);

  return (
    <Card className="border-l-4" style={{ borderLeftColor: meta.color }}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2 min-w-0">
            <StatusIcon status={item.status} />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
          <span className="font-semibold" style={{ color: meta.color }}>{meta.label}</span>
          <span>{item.segment}</span>
          <span>Started {item.startedMonth}</span>
          {item.completedMonth && <span>Completed {item.completedMonth}</span>}
          <span>Owner: {item.owner}</span>
        </div>

        {/* Score before/after */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
          <div className="text-xs">
            <span className="text-muted-foreground">Score before: </span>
            <span className="font-semibold tabular-nums">{item.scoreBefore}</span>
          </div>
          {item.scoreAfter !== undefined ? (
            <>
              <Minus className="h-3 w-3 text-muted-foreground/40" />
              <div className="text-xs">
                <span className="text-muted-foreground">After: </span>
                <span className="font-semibold tabular-nums">{item.scoreAfter}</span>
              </div>
              <DeltaChip delta={delta} />
            </>
          ) : (
            <span className="text-xs text-muted-foreground italic">Score pending next survey</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Log intervention drawer (simple inline form) ─────────────────────────────

function LogForm({ onAdd }: { onAdd: (item: Intervention) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle]   = useState("");
  const [desc, setDesc]     = useState("");
  const [quad, setQuad]     = useState<Quadrant>("strategy");
  const [seg, setSeg]       = useState("Whole School");
  const [owner, setOwner]   = useState("");
  const [score, setScore]   = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      id: Date.now().toString(),
      title: title.trim(),
      description: desc.trim(),
      quadrant: quad,
      segment: seg.trim() || "Whole School",
      status: "planned",
      startedMonth: "Apr 2025",
      scoreBefore: parseFloat(score) || 6.0,
      owner: owner.trim() || "—",
    });
    setTitle(""); setDesc(""); setOwner(""); setScore("");
    setOpen(false);
  }

  const inputCls = "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1";

  return (
    <div className="mb-4">
      {!open ? (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Log intervention
        </Button>
      ) : (
        <Card className="border-dashed">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm">Log new intervention</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className={labelCls}>Title *</label>
                <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. High-context communication workshop" />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea className={cn(inputCls, "resize-none h-16")} value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was done?" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>CQ Dimension</label>
                  <select className={inputCls} value={quad} onChange={e => setQuad(e.target.value as Quadrant)}>
                    {QUADRANT_OPTIONS.map(q => (
                      <option key={q} value={q}>{QUADRANT_META[q].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Score before</label>
                  <input className={inputCls} type="number" min="0" max="10" step="0.1" value={score} onChange={e => setScore(e.target.value)} placeholder="e.g. 5.8" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Segment</label>
                  <input className={inputCls} value={seg} onChange={e => setSeg(e.target.value)} placeholder="e.g. STEM Dept" />
                </div>
                <div>
                  <label className={labelCls}>Owner</label>
                  <input className={inputCls} value={owner} onChange={e => setOwner(e.target.value)} placeholder="e.g. Dr. Chen" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm">Add intervention</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function CQInterventions() {
  const [items, setItems] = useState<Intervention[]>(SEED_INTERVENTIONS);
  const [filterQ, setFilterQ]   = useState<Quadrant | "all">("all");
  const [filterSt, setFilterSt] = useState<Status | "all">("all");

  function addItem(item: Intervention) {
    setItems(prev => [item, ...prev]);
  }

  const filtered = items.filter(i =>
    (filterQ  === "all" || i.quadrant === filterQ) &&
    (filterSt === "all" || i.status   === filterSt)
  );

  // Group by status for ordered display
  const order: Status[] = ["in-progress", "planned", "complete"];
  const grouped = order.map(s => ({ status: s, items: filtered.filter(i => i.status === s) })).filter(g => g.items.length > 0);

  const statusLabels: Record<Status, string> = { "in-progress": "In Progress", planned: "Planned", complete: "Complete" };

  return (
    <div className="container max-w-4xl py-10">
      <SummaryCards items={items} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Quadrant filter */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterQ("all")}
            className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
              filterQ === "all" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground")}
          >
            All dimensions
          </button>
          {QUADRANT_OPTIONS.map(q => {
            const m = QUADRANT_META[q];
            return (
              <button
                key={q}
                onClick={() => setFilterQ(q)}
                className={cn("px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all",
                  filterQ === q ? "text-white" : "text-muted-foreground hover:text-foreground border-border")}
                style={filterQ === q ? { backgroundColor: m.color, borderColor: m.color } : {}}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 flex-wrap ml-auto">
          {(["all", ...STATUS_OPTIONS] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterSt(s)}
              className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                filterSt === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground")}
            >
              {s === "all" ? "All statuses" : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <LogForm onAdd={addItem} />

      {/* Cards grouped by status */}
      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No interventions match the current filters.</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(g => (
            <div key={g.status}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{statusLabels[g.status]} ({g.items.length})</p>
              <div className="space-y-3">
                {g.items.map(item => <InterventionCard key={item.id} item={item} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
