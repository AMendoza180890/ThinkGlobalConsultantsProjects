import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Heart, Sparkles, Zap } from "lucide-react";

const summaryCards = [
  { label: "Largest alignment gap", value: "+47", helper: "Power distance between teachers and admin" },
  { label: "Estimated alignment cost", value: "$4.2k", helper: "Illustrative monthly friction cost" },
  { label: "Wellness risk", value: "Moderate", helper: "Process friction is dragging weekly wellbeing" },
];

const wellnessSignals = [
  { label: "Workload", score: 6.2 },
  { label: "Leadership support", score: 7.4 },
  { label: "Psychological safety", score: 6.9 },
  { label: "Professional growth", score: 7.1 },
  { label: "Process friction", score: 5.8 },
];

const frictionDrivers = [
  { label: "Communication style", count: 14, detail: "Repeat clarification loops and mismatched expectations." },
  { label: "Decision speed", count: 11, detail: "Teachers want faster closure on routine issues." },
  { label: "Power distance", count: 9, detail: "Some teachers wait too long to raise concerns." },
];

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border bg-background shadow-[0_20px_60px_rgba(15,23,42,0.08)] overflow-hidden">
      <div className="border-b bg-slate-50/80 px-4 py-3 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs font-medium text-muted-foreground">Elementary Cohort Page Preview</span>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{children}</p>;
}

function SummaryStat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function CompactMetric({ label, score, detail }: { label: string; score: number; detail: string }) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">{detail}</p>
        </div>
        <p className="text-2xl font-bold tabular-nums">{score}</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${(score / 10) * 100}%` }} />
      </div>
    </div>
  );
}

function EvidencePageMock() {
  return (
    <PageFrame>
      <div className="grid gap-6 xl:grid-cols-[1.08fr_.92fr]">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                <Sparkles className="h-4 w-4" />
                Elementary Cohort
              </div>
              <h2 className="mt-4 text-3xl font-bold leading-tight max-w-xl">Elementary is running more collaboratively than admin, but decision timing is creating avoidable drag.</h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">
                This preview shows the exact page direction now in use: a compact story section, then a tabbed evidence stack for Alignment, Cost, Wellness, and Friction.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300">Page focus</p>
              <p className="mt-1 text-sm font-semibold">Tabbed evidence stack</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge className="bg-white/10 text-white border-white/10">Alignment first</Badge>
            <Badge className="bg-white/10 text-white border-white/10">Cost second</Badge>
            <Badge className="bg-white/10 text-white border-white/10">Wellness third</Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          {summaryCards.map((card) => (
            <SummaryStat key={card.label} label={card.label} value={card.value} helper={card.helper} />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="border-amber-200/80 bg-amber-50/60">
          <CardContent className="pt-5">
            <SectionLabel>What to scan first</SectionLabel>
            <p className="text-sm font-semibold">The cohort is more egalitarian than admin.</p>
            <p className="mt-1 text-sm text-muted-foreground">Power distance is the biggest divergence, followed by decision speed and communication style.</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80">
          <CardContent className="pt-5">
            <SectionLabel>Why it matters</SectionLabel>
            <p className="text-sm font-semibold">Misalignment is creating repeat coordination work.</p>
            <p className="mt-1 text-sm text-muted-foreground">The cost card below translates the gap into time, meetings, and operational drag.</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200/80 bg-emerald-50/60">
          <CardContent className="pt-5">
            <SectionLabel>What changes</SectionLabel>
            <p className="text-sm font-semibold">The next action is a drilldown, not another summary.</p>
            <p className="mt-1 text-sm text-muted-foreground">Users can move from story to detail without leaving the page.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 rounded-2xl border bg-slate-50/70 p-4">
        <Card className="border-slate-200/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Tabbed evidence stack preview
            </CardTitle>
            <p className="text-sm text-muted-foreground">This is the same structure the real elementary cohort page now uses.</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="alignment" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="alignment">Alignment</TabsTrigger>
                <TabsTrigger value="cost">Cost</TabsTrigger>
                <TabsTrigger value="wellness">Wellness</TabsTrigger>
                <TabsTrigger value="friction">Friction</TabsTrigger>
              </TabsList>

              <TabsContent value="alignment" className="mt-0 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: "Power distance", value: "-47 pts", detail: "Biggest gap in the cohort" },
                    { label: "Decision speed", value: "+38 pts", detail: "Teachers want faster closure" },
                    { label: "Communication style", value: "+30 pts", detail: "Directness is creating tension" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border bg-background/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-2xl font-bold">{item.value}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="cost" className="mt-0">
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: "Friction hours / month", value: "27h" },
                    { label: "Decision delay", value: "12d" },
                    { label: "Avoidable meetings", value: "8" },
                    { label: "Estimated cost", value: "$4.2k" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border bg-background/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-3xl font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <p className="text-sm font-semibold text-amber-800 flex items-center gap-2"><Zap className="h-4 w-4" /> Biggest driver</p>
                  <p className="mt-1 text-sm text-amber-900/90">Decision speed gap</p>
                  <p className="mt-2 text-sm text-muted-foreground">Elementary alignment gaps are most expensive when decisions bounce between teachers and admin without a clear owner.</p>
                </div>
              </TabsContent>

              <TabsContent value="wellness" className="mt-0">
                <div className="grid gap-3 md:grid-cols-5">
                  {wellnessSignals.map((item) => (
                    <CompactMetric
                      key={item.label}
                      label={item.label}
                      score={item.score}
                      detail={item.label === "Process friction" ? "Lower is better on this measure" : "Higher means stronger"}
                    />
                  ))}
                </div>
                <div className="mt-4 rounded-xl border bg-background/80 p-4">
                  <p className="text-sm font-semibold flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Wellness read</p>
                  <p className="mt-1 text-sm text-muted-foreground">The strongest signal is leadership support; the weakest is process friction, which suggests the cohort does not need more motivation so much as fewer blockers.</p>
                </div>
              </TabsContent>

              <TabsContent value="friction" className="mt-0">
                <div className="space-y-3">
                  {frictionDrivers.map((driver, index) => (
                    <div key={driver.label} className="rounded-xl border bg-background/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> {index + 1}. {driver.label}</p>
                          <p className="mt-1 text-sm text-muted-foreground max-w-3xl">{driver.detail}</p>
                        </div>
                        <div className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">{driver.count} incidents</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-foreground">Recommended focus</p>
                  <p className="mt-1 text-sm text-muted-foreground">Start with communication norms, then reduce decision latency, then address permission and escalation patterns. Those three causes explain most of the elementary friction story.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}

export default function ElementaryCohortLayoutShowcase() {
  return (
    <div className="container max-w-7xl py-10 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Elementary cohort page preview
          </div>
          <h1 className="mt-2 font-sans text-4xl font-semibold">Tabbed evidence stack</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            This preview matches the real elementary cohort page direction: a compact story at the top, then tabs for Alignment, Cost, Wellness, and Friction.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/premium/school-level">Back to cohort page</Link>
        </Button>
      </div>

      <Tabs defaultValue="stack" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="stack">Tabbed evidence stack</TabsTrigger>
        </TabsList>

        <TabsContent value="stack"><EvidencePageMock /></TabsContent>
      </Tabs>
    </div>
  );
}
