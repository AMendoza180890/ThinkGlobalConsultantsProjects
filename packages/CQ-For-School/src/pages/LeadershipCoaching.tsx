import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, CheckCircle2, Clock, Send, AlertTriangle } from "lucide-react";

// ── CQ dimension comparison data ──────────────────────────────────────────────

const dimensions = [
  {
    label: "Directness",
    staff: 6.8,
    leadership: 8.2,
  },
  {
    label: "Hierarchy",
    staff: 3.5,
    leadership: 7.7,
  },
  {
    label: "Dec. speed",
    staff: 4.2,
    leadership: 8.0,
  },
];

// ── Quiz milestones ───────────────────────────────────────────────────────────

const quizMilestones = [
  {
    title: "Initial CQ assessment",
    detail: "Completed · Term 1 Week 1 · Baseline set",
    status: "done" as const,
  },
  {
    title: "Mid-term check-in quiz",
    detail: "Completed · Week 8 · CQ Health ↑ 14 pts",
    status: "done" as const,
  },
  {
    title: "Update quiz — classes taught this term",
    detail: "Due this week · update preference profile",
    status: "due" as const,
  },
  {
    title: "End of term exit quiz",
    detail: "Due · Week 20 · Includes reflection + next term planning",
    status: "upcoming" as const,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function DimensionBar({ score, max = 10, color }: { score: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${(score / max) * 100}%` }}
        />
      </div>
      <span className="text-sm font-bold w-8 text-right">{score}</span>
    </div>
  );
}

function gapSeverity(gap: number) {
  if (gap >= 4) return "text-red-500";
  if (gap >= 2) return "text-amber-500";
  return "text-emerald-500";
}

function StatusIcon({ status }: { status: "done" | "due" | "upcoming" }) {
  if (status === "done") return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
  if (status === "due") return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
  return <Clock className="h-5 w-5 text-muted-foreground shrink-0" />;
}

function StatusBadge({ status }: { status: "done" | "due" | "upcoming" }) {
  if (status === "done")
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">Done</Badge>;
  if (status === "due")
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0">Due this week</Badge>;
  return <Badge variant="secondary">Upcoming</Badge>;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LeadershipCoaching() {
  return (
    <div className="container max-w-4xl py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Crown className="h-7 w-7 text-primary" />
          <h1 className="font-sans text-3xl font-semibold">Leadership coaching</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Quiz progress, coaching milestones, and where leadership CQ sits relative to teaching staff.
        </p>
      </div>

      {/* Leadership CQ vs teaching staff */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Leadership CQ vs teaching staff</h2>
        <Card>
          <CardContent className="pt-5 pb-5 space-y-5">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary inline-block" />
                Teaching staff
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                Leadership team
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                Gap ≥ 4 pts
              </span>
            </div>

            {/* Dimension rows */}
            {dimensions.map((dim) => {
              const gap = Math.abs(dim.leadership - dim.staff);
              return (
                <div key={dim.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{dim.label}</span>
                    <span className={`text-xs font-semibold ${gapSeverity(gap)}`}>
                      {gap.toFixed(1)} pt gap
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-24 shrink-0">Teaching staff</span>
                      <DimensionBar score={dim.staff} color="bg-primary" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-24 shrink-0">Leadership</span>
                      <DimensionBar score={dim.leadership} color={gap >= 4 ? "bg-red-400" : "bg-amber-500"} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Insight */}
            <p className="text-xs text-muted-foreground bg-secondary/60 rounded-lg p-3 leading-relaxed">
              Leadership is more direct, more hierarchical, and faster-deciding on every dimension. This is the root cause of T↔Admin friction.{" "}
              <span className="font-medium text-foreground">Leadership coaching targets this gap directly.</span>
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Coaching quiz progress */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Coaching quiz progress</h2>
        <div className="space-y-3">
          {quizMilestones.map((milestone) => (
            <Card
              key={milestone.title}
              className={milestone.status === "due" ? "border-amber-300 dark:border-amber-700" : ""}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <StatusIcon status={milestone.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground">{milestone.detail}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <StatusBadge status={milestone.status} />
                    {milestone.status === "due" && (
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1">
                        <Send className="h-3 w-3" />
                        Send quiz →
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
