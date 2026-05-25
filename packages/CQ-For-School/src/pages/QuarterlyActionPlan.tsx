import { useState } from "react";
import { NavLink } from "react-router-dom";
import { HelpCircle, Check, ChevronDown, ChevronUp, TrendingUp, Circle, Globe, ListChecks } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ThemeKey = "authority" | "change" | "pace" | "communication" | "belonging";
type Urgency = "high" | "medium" | "low";

interface Webinar {
  key: ThemeKey;
  title: string;
  description: string;
  urgency: Urgency;
  teachersCovered: number;
  pendingCount: number;
  reductionPct: number;
  scheduled: boolean;
  audience: string;
  duration: string;
  owner: string;
  upcomingDates: { date: string; time: string }[];
  ahaStat: string;
  ahaInsight: string;
  rootCause: string;
  whySummary: string;
  whyBullets: { label: string; href: string }[];
  whySources: ("cultural" | "cq")[];
  signals: { label: string; detail: string; source: "cultural" | "cq" | "wellness" | "issues"; href: string }[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const WEBINARS: Webinar[] = [
  {
    key: "authority",
    title: "Navigating Hierarchy & Voice Across Cultures",
    description: "For staff experiencing friction around authority, decision-making, and being heard.",
    urgency: "high",
    teachersCovered: 8,
    pendingCount: 36,
    reductionPct: 42,
    scheduled: false,
    audience: "All staff",
    duration: "60 min",
    owner: "Zach Dorroh",
    upcomingDates: [
      { date: "Wed May 20", time: "13:00" },
      { date: "Mon Jun 1",  time: "10:00" },
      { date: "Tue Jun 9",  time: "14:00" },
    ],
    ahaStat: "3 of 9",
    ahaInsight: "teachers who departed this year flagged leadership support below 4/10 in their last 3 surveys.",
    rootCause: "Admin score 50+ pts higher on Power Distance than new teachers. Staff expect to defer; teachers expect to be heard — creating silent resentment and unresolved grievances.",
    whySummary: "5 of 11 teams flagged authority and voice as their top friction source in the last survey cycle.",
    whyBullets: [
      { label: "New teachers defer silently instead of raising concerns", href: "/analytics/cultural-fingerprint?tab=comparator&a=tenure:0-2|or&b=role:admin|or" },
      { label: "Admin interpret silence as agreement or compliance", href: "/analytics/cq-navigator" },
      { label: "Grievances go unresolved until they escalate or cause attrition", href: "/staff/issues?filter=teacher-admin" },
    ],
    whySources: ["cultural", "cq"],
    signals: [
      { source: "cultural", label: "Power Distance gap",         detail: "New teachers avg 27 vs admin avg 74 — a 47pt gap, in the worst 5 spreads school-wide.", href: "/analytics/cultural-fingerprint?tab=comparator&a=tenure:0-2|or&b=role:admin|or" },
      { source: "cq",       label: "Low CQ Drive",               detail: "High-friction staff score 2.7pts lower on CQ Drive — they've lost motivation to bridge the gap.", href: "/analytics/cq-navigator" },
      { source: "wellness", label: "Leadership support at risk",  detail: "Leadership support scored 5.8/10 this week, below the 6.0 threshold.", href: "/staff/wellness" },
      { source: "issues",   label: "12 teacher→admin incidents",  detail: "Feedback ignored in staff meetings (5), decisions made without team input (4), concerns dismissed (3).", href: "/staff/issues?filter=teacher-admin" },
    ],
  },
  {
    key: "pace",
    title: "Agile Decision-Making Across Cultural Styles",
    description: "For teams where speed mismatches are creating blocked approvals and bypassed processes.",
    urgency: "high",
    teachersCovered: 12,
    pendingCount: 32,
    reductionPct: 38,
    scheduled: false,
    audience: "Department heads",
    duration: "90 min",
    owner: "Zach Dorroh",
    upcomingDates: [
      { date: "Wed Jun 3",  time: "11:00" },
      { date: "Mon Jun 15", time: "09:30" },
    ],
    ahaStat: "3 weeks",
    ahaInsight: "of consecutive friction reduction among the 12 teachers who attended — vs no change in the group who didn't.",
    rootCause: "Admin avg Decision Speed: 29. New teachers avg: 68. Nearly 40pts apart. Fast-moving teachers feel blocked; admin feel bypassed.",
    whySummary: "6 of 11 teams flagged decision-making speed as their top friction source in the last survey cycle.",
    whyBullets: [
      { label: "Fast-moving teachers feel blocked waiting for approvals", href: "/analytics/cultural-fingerprint?tab=comparator&a=tenure:0-2|or&b=role:admin|or" },
      { label: "Admin feel bypassed when decisions are made without them", href: "/analytics/cq-navigator" },
      { label: "Unclear ownership leaves initiatives stalled mid-execution", href: "/staff/issues" },
    ],
    whySources: ["cultural", "cq"],
    signals: [
      { source: "cultural", label: "Decision Speed gap",      detail: "39pt spread between admin and teachers 0–2 yrs — one of the widest gaps across all dimensions.", href: "/analytics/cultural-fingerprint?tab=comparator&a=tenure:0-2|or&b=role:admin|or" },
      { source: "cq",       label: "Low CQ Strategy",         detail: "Teachers 3–5 yrs Middle School scored 4.8 — critical, bottom of school-wide CQ scores.", href: "/analytics/cq-navigator" },
      { source: "wellness", label: "Process friction rising",  detail: "Process friction score dropped to 5.1 this week — lowest reading in 4 weeks.", href: "/staff/wellness" },
      { source: "issues",   label: "7 incidents",              detail: "Delayed approvals blocking lesson planning (7), unclear decision ownership (4).", href: "/staff/issues" },
    ],
  },
  {
    key: "communication",
    title: "Communication Styles Across Cultures",
    description: "For staff and teams where direct/indirect style gaps are causing misreads and broken trust.",
    urgency: "medium",
    teachersCovered: 24,
    pendingCount: 14,
    reductionPct: 45,
    scheduled: false,
    audience: "All staff",
    duration: "45 min",
    owner: "Zach Dorroh",
    upcomingDates: [
      { date: "Thu Jun 11", time: "15:00" },
      { date: "Tue Jun 23", time: "11:00" },
    ],
    ahaStat: "47%",
    ahaInsight: "of all process friction hours are teacher-parent — but only 24 of 38 teachers have completed this webinar.",
    rootCause: "Teachers avg 76/100 on Communication Style (very direct); parents avg 44 (indirect). Neither group realises the other is interpreting the same message differently.",
    whySummary: "4 of 11 teams flagged communication breakdowns as their top friction source in the last survey cycle.",
    whyBullets: [
      { label: "High-context communicators interpret silence as agreement", href: "/analytics/cultural-fingerprint?tab=comparator&a=role:teacher|or&b=parent:all|or" },
      { label: "Low-context peers expect explicit pushback", href: "/analytics/cq-navigator" },
      { label: "Decisions left unvalidated and errors uncorrected until they escalate", href: "/staff/issues?filter=teacher-parent" },
    ],
    whySources: ["cultural", "cq"],
    signals: [
      { source: "cultural", label: "Communication Style gap",    detail: "32pt gap between teachers and parents — trust breakdowns at parent conferences.", href: "/analytics/cultural-fingerprint?tab=comparator&a=role:teacher|or&b=parent:all|or" },
      { source: "cq",       label: "Low CQ Knowledge",           detail: "Teachers 0–2 yrs STEM scored 5.3 — critical, in bottom 5 school-wide.", href: "/analytics/cq-navigator" },
      { source: "wellness", label: "Psychological safety",       detail: "Psychological safety at 5.4 this week — below threshold.", href: "/staff/wellness" },
      { source: "issues",   label: "9 teacher→parent incidents", detail: "Parent felt tone too blunt (5), parent conference misunderstandings (4).", href: "/staff/issues?filter=teacher-parent" },
    ],
  },
  {
    key: "change",
    title: "Change Readiness Across Cultural Styles",
    description: "For teams where resistance to new initiatives is creating deadlock between new and veteran staff.",
    urgency: "medium",
    teachersCovered: 12,
    pendingCount: 30,
    reductionPct: 44,
    scheduled: true,
    audience: "Department heads",
    duration: "90 min",
    owner: "Zach Dorroh",
    upcomingDates: [
      { date: "Thu May 14", time: "14:00" },
      { date: "Mon Jun 2",  time: "10:00" },
    ],
    ahaStat: "44%",
    ahaInsight: "fewer friction incidents around new initiatives among teachers who attended vs those who haven't.",
    rootCause: "New teachers (0–2 yrs) score 40+ pts higher on Risk Tolerance than veterans and admin — new hires push for change while experienced staff resist.",
    whySummary: "3 of 11 teams flagged change resistance as their top friction source in the last survey cycle.",
    whyBullets: [
      { label: "New teachers push for change; veterans resist without clear dialogue", href: "/analytics/cultural-fingerprint?tab=comparator&a=tenure:0-2|or&b=tenure:10+|or" },
      { label: "Risk tolerance gap leaves rollouts stalled or contested", href: "/analytics/cq-navigator" },
      { label: "Low adaptability scores predict continued resistance to new initiatives", href: "/staff/issues" },
    ],
    whySources: ["cultural", "cq"],
    signals: [
      { source: "cultural", label: "Risk Tolerance gap",       detail: "40pt spread between new teachers and 10+ yr staff — highest among tenure groups.", href: "/analytics/cultural-fingerprint?tab=comparator&a=tenure:0-2|or&b=tenure:10+|or" },
      { source: "cq",       label: "Low CQ Knowledge",         detail: "Multiple critical CQ Knowledge scores linked to resistance and low adaptability.", href: "/analytics/cq-navigator" },
      { source: "wellness", label: "Professional growth dip",  detail: "Professional growth score 6.2 — approaching risk threshold.", href: "/staff/wellness" },
      { source: "issues",   label: "6 incidents",              detail: "Resistance to new curriculum rollout (6), push-back on PD schedule changes (3).", href: "/staff/issues" },
    ],
  },
  {
    key: "belonging",
    title: "Building Collective Identity in Diverse Teams",
    description: "For staff where individual vs. collective orientation is weakening team cohesion.",
    urgency: "low",
    teachersCovered: 9,
    pendingCount: 29,
    reductionPct: 36,
    scheduled: false,
    audience: "Team leads",
    duration: "60 min",
    owner: "Zach Dorroh",
    upcomingDates: [
      { date: "Thu Jun 18", time: "13:00" },
      { date: "Tue Jun 30", time: "11:00" },
    ],
    ahaStat: "2.7pts",
    ahaInsight: "lower CQ Drive among high-friction staff — they've lost motivation to bridge cultural gaps, not just the skills.",
    rootCause: "Admin and long-tenured teachers score 65+ on Group orientation; newer teachers score below 40 — 'we move together' vs 'I need autonomy' clash.",
    whySummary: "3 of 11 teams flagged belonging and cohesion as their top friction source in the last survey cycle.",
    whyBullets: [
      { label: "Newer teachers opt out of collaborative planning, feeling unseen", href: "/analytics/cultural-fingerprint?tab=comparator&a=tenure:0-2|or&b=tenure:10+|or" },
      { label: "Veterans interpret autonomy-seeking as disengagement or disrespect", href: "/analytics/cq-navigator" },
      { label: "Low CQ Drive means staff have stopped trying to bridge the gap", href: "/staff/issues" },
    ],
    whySources: ["cultural", "cq"],
    signals: [
      { source: "cultural", label: "Group vs Individual gap", detail: "35pt spread between new and veteran teachers across department groups.", href: "/analytics/cultural-fingerprint?tab=comparator&a=tenure:0-2|or&b=tenure:10+|or" },
      { source: "cq",       label: "Low CQ Drive",            detail: "High-friction staff CQ Drive significantly below school average.", href: "/analytics/cq-navigator" },
      { source: "wellness", label: "Workload pressure",       detail: "Workload score 6.2 — approaching risk threshold for at-risk groups.", href: "/staff/wellness" },
      { source: "issues",   label: "7 incidents",             detail: "Teacher opted out of collaborative planning (4), excluded from team decision (3).", href: "/staff/issues" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const URGENCY_DOT: Record<Urgency, string> = {
  high:   "bg-red-500",
  medium: "bg-amber-400",
  low:    "bg-slate-400",
};

const URGENCY_ESTIMATE: Record<Urgency, string> = {
  high:   "Urgent · friction signal",
  medium: "Recommended · friction signal",
  low:    "Upcoming · friction signal",
};


// ─── Main ─────────────────────────────────────────────────────────────────────

export default function QuarterlyActionPlan() {
  const [expandedWhy, setExpandedWhy] = useState<ThemeKey | null>(null);
  const [scheduled, setScheduled] = useState<Set<ThemeKey>>(
    () => new Set(WEBINARS.filter(w => w.scheduled).map(w => w.key))
  );

  const sorted = [...WEBINARS].sort((a, b) => {
    const order: Record<Urgency, number> = { high: 0, medium: 1, low: 2 };
    return order[a.urgency] - order[b.urgency];
  }).slice(0, 3);

  return (
    <div className="flex flex-col min-h-0">

      {/* Header */}
      <div className="border-b bg-background">
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <ListChecks className="h-7 w-7 text-primary shrink-0" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-sans text-3xl font-semibold text-foreground">Quarterly Action Plan</h1>
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Q2 · Apr–Jun 2026
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Here are your priorities over the next 9 weeks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-4">

      {/* Priority list */}
      {sorted.map((w, idx) => {
        const isScheduled = scheduled.has(w.key);
        const whyOpen = expandedWhy === w.key;
        const coverage = Math.round((w.teachersCovered / (w.teachersCovered + w.pendingCount)) * 100);
        const bookedDates = isScheduled ? [w.upcomingDates[0]] : [];

        return (
          <div key={w.key} className="bg-white rounded-xl border border-border shadow-sm p-6">
            <div className="flex gap-6">

              {/* Priority number */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Priority</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold text-foreground">{idx + 1}</span>
                  <div className={`w-2 h-2 rounded-full ${URGENCY_DOT[w.urgency]}`} />
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground mb-1">{w.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{w.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-muted-foreground">
                    <Circle className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {URGENCY_ESTIMATE[w.urgency]}
                  </span>
                  <span className="text-muted-foreground">
                    Audience: <span className="font-medium text-foreground">{w.audience}</span>
                  </span>
                  <span className="text-muted-foreground">{w.duration}</span>
                  <span className="text-muted-foreground">
                    Presenter: <span className="font-medium text-foreground">{w.owner}</span>
                  </span>
                </div>

                {/* Booked webinars */}
                <div className="mt-6">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Booked Webinars</h4>
                  {bookedDates.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                      <Circle className="w-4 h-4 shrink-0" />
                      <span>No webinars booked yet — send an invitation from the upcoming sessions to get started.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bookedDates.map((d, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="flex items-center gap-2 min-w-[220px]">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-sm font-medium text-emerald-700">Booked</span>
                            <span className="text-sm text-foreground">{d.date} · {d.time}</span>
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[200px]">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${coverage}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {w.teachersCovered} attending · {w.pendingCount} pending
                            </span>
                            <button className="text-xs text-muted-foreground hover:text-foreground">
                              Manage attendees
                            </button>
                            <button
                              onClick={() => setScheduled(prev => { const next = new Set(prev); next.delete(w.key); return next; })}
                              className="text-xs text-destructive hover:text-destructive/80"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Why this priority button + panel */}
                <div className="mt-4">
                  <button
                    onClick={() => setExpandedWhy(whyOpen ? null : w.key)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1a7a7a] text-white text-sm font-medium transition-colors hover:bg-[#155f5f]"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Why this priority?
                    {whyOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {whyOpen && (
                    <div className="mt-3 border border-border rounded-xl px-5 py-4 bg-card">
                      <p className="text-sm text-foreground mb-3">
                        <span className="font-semibold">{w.whySummary.split(' ').slice(0, 3).join(' ')}</span>
                        {' '}{w.whySummary.split(' ').slice(3).join(' ')}
                      </p>
                      <ul className="space-y-2 mb-4">
                        {w.whyBullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                            <span className="flex-1 text-foreground">{b.label}</span>
                            <NavLink
                              to={b.href}
                              className="shrink-0 text-emerald-600 text-sm whitespace-nowrap"
                            >
                              Review source data →
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                        <span>Data from:</span>
                        {w.whySources.includes("cultural") && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            Cultural Preferences
                          </span>
                        )}
                        {w.whySources.includes("cq") && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            CQ Navigator
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming webinars column */}
              <div className="w-[260px] shrink-0">
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Upcoming Webinars</h4>
                <div className="space-y-2">
                  {w.upcomingDates.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">
                        {d.date} · <span className="font-medium">{d.time}</span>
                      </span>
                      <button
                        onClick={() => setScheduled(prev => { const next = new Set(prev); next.add(w.key); return next; })}
                        className="text-xs font-medium text-[#1a7a7a] hover:text-[#155f5f] uppercase tracking-wide"
                      >
                        Send Invite
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        );
      })}

      {/* Footer note */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shrink-0" />
          Friction signals are early estimates from survey responses. Confidence improves once sessions are scheduled and attended.
        </p>
      </div>
    </div>
    </div>
  );
}
