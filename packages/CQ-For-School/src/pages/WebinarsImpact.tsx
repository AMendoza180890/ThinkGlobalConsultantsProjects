import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Send, AlertTriangle, CheckCircle2, ArrowDown, Clock } from "lucide-react";

// ── Workshop effectiveness data ───────────────────────────────────────────────

const workshops = [
  {
    initials: "CS",
    title: "Communication styles across cultures",
    matchedTo: "comm. style friction",
    takenCount: 24,
    takenAvg: 2.1,
    notTakenAvg: 3.8,
    reduction: 45,
    notTakenCount: null,
  },
  {
    initials: "DM",
    title: "Decision-making across cultures",
    matchedTo: "decision speed friction",
    takenCount: 12,
    takenAvg: 1.8,
    notTakenAvg: 3.2,
    reduction: 44,
    notTakenCount: null,
  },
  {
    initials: "PD",
    title: "Power distance & hierarchy at work",
    matchedTo: "new issue this week",
    takenCount: 6,
    takenAvg: 1.4,
    notTakenAvg: 4.4,
    reduction: 44,
    notTakenCount: 44,
  },
];

// ── Sent invites data ─────────────────────────────────────────────────────────

const sentInvites = [
  {
    title: "Comm. styles webinar invite",
    detail: "7 teachers · matched to comm. style friction · Mon 09:00",
    status: "sent" as const,
  },
  {
    title: "Decision-making webinar invite",
    detail: "3 teachers · matched to decision speed · Mon 09:00",
    status: "sent" as const,
  },
  {
    title: "Power distance webinar invite",
    detail: "44 teachers haven't taken this · ready to send",
    status: "pending" as const,
  },
];

// ── Recency flags ─────────────────────────────────────────────────────────────

const recencyFlags = [
  {
    title: "Comm. styles — 8 staff overdue",
    detail: "Last taken 7+ months ago · 6-month refresh recommended",
    overdue: true,
  },
  {
    title: "Decision-making — all current",
    detail: "All attendees within 6-month window",
    overdue: false,
  },
];

// ── Reduction colour helper ───────────────────────────────────────────────────

function reductionColor(pct: number) {
  if (pct >= 40) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 20) return "text-amber-600 dark:text-amber-400";
  return "text-red-500";
}

// ─────────────────────────────────────────────────────────────────────────────

export default function WebinarsImpact() {
  return (
    <div className="container max-w-4xl py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Video className="h-7 w-7 text-primary" />
          <h1 className="font-sans text-3xl font-semibold">Webinars</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Attendance, effectiveness, and what's matched to this week's friction.
        </p>
      </div>

      {/* Workshop Effectiveness */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Workshop effectiveness — taken vs not taken</h2>
        <div className="space-y-4">
          {workshops.map((w) => (
            <Card key={w.initials}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  {/* Initials badge */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                    {w.initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{w.title}</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Matched to:{" "}
                      <span className="text-foreground font-medium">{w.matchedTo}</span>
                      {" · "}
                      <span className="text-foreground font-medium">{w.takenCount} staff taken</span>
                    </p>

                    {/* Taken / Not taken comparison */}
                    <div className="grid grid-cols-3 gap-3 items-center">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">Taken</p>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Avg friction</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{w.takenAvg}</p>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <ArrowDown className={`h-5 w-5 ${reductionColor(w.reduction)}`} />
                        <span className={`text-lg font-bold ${reductionColor(w.reduction)}`}>
                          {w.reduction}%
                        </span>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">Not taken</p>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Avg friction</p>
                        <p className="text-2xl font-bold text-red-500">{w.notTakenAvg}</p>
                      </div>
                    </div>

                    {w.notTakenCount && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <span className="font-semibold text-foreground">{w.notTakenCount} not taken</span>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Sent this week */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Sent this week — auto-matched</h2>
        <div className="space-y-3">
          {sentInvites.map((inv) => (
            <Card key={inv.title}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Send className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{inv.title}</p>
                      <p className="text-xs text-muted-foreground">{inv.detail}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {inv.status === "sent" ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">
                        Sent
                      </Badge>
                    ) : (
                      <>
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0">
                          Pending
                        </Badge>
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                          Send to all →
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recency — overdue flags */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Recency — overdue flags</h2>
        <div className="space-y-3">
          {recencyFlags.map((flag) => (
            <Card key={flag.title} className={flag.overdue ? "border-amber-300 dark:border-amber-700" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {flag.overdue ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{flag.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {flag.detail}
                      </p>
                    </div>
                  </div>
                  {flag.overdue && (
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2 shrink-0">
                      Send refresh invite →
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
