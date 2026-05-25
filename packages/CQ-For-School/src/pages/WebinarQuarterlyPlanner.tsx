import { useState } from "react";
import { CalendarDays, Video, CalendarPlus, Check, ChevronDown, ChevronUp, Lightbulb, Users, AlertTriangle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Quarter = "Q3 2025" | "Q4 2025" | "Q1 2026";
type Urgency = "high" | "medium" | "low";
type RoleKey = "teachers" | "staff" | "admin" | "parents";

interface RoleEnrollment {
  role: RoleKey;
  enrolled: number;
  capacity: number;
}

interface ScheduledWebinar {
  id: string;
  title: string;
  description: string;
  urgency: Urgency;
  quarter: Quarter;
  date: string;
  time: string;
  enrollment: RoleEnrollment[];
  reductionPct: number;
  facilitator: string;
}

interface BacklogWebinar {
  id: string;
  title: string;
  description: string;
  urgency: Urgency;
  reductionPct: number;
  pendingCount: number;
  reason: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SCHEDULED: ScheduledWebinar[] = [
  {
    id: "authority-q3",
    title: "Navigating Hierarchy & Voice Across Cultures",
    description: "For staff experiencing friction around authority, decision-making, and being heard.",
    urgency: "high",
    quarter: "Q3 2025",
    date: "Aug 14, 2025",
    time: "3:30 PM",
    reductionPct: 42,
    facilitator: "Dr. Aisha Osei",
    enrollment: [
      { role: "teachers", enrolled: 8,  capacity: 24 },
      { role: "staff",    enrolled: 3,  capacity: 10 },
      { role: "admin",    enrolled: 4,  capacity: 6  },
      { role: "parents",  enrolled: 0,  capacity: 0  },
    ],
  },
  {
    id: "pace-q3",
    title: "Agile Decision-Making Across Cultural Styles",
    description: "For teams where speed mismatches are creating blocked approvals and bypassed processes.",
    urgency: "high",
    quarter: "Q3 2025",
    date: "Sep 4, 2025",
    time: "4:00 PM",
    reductionPct: 38,
    facilitator: "Dr. Aisha Osei",
    enrollment: [
      { role: "teachers", enrolled: 12, capacity: 30 },
      { role: "staff",    enrolled: 5,  capacity: 10 },
      { role: "admin",    enrolled: 5,  capacity: 6  },
      { role: "parents",  enrolled: 0,  capacity: 0  },
    ],
  },
  {
    id: "communication-q4",
    title: "Communication Styles Across Cultures",
    description: "For staff and teams where direct/indirect style gaps are causing misreads and broken trust.",
    urgency: "medium",
    quarter: "Q4 2025",
    date: "Oct 9, 2025",
    time: "3:30 PM",
    reductionPct: 45,
    facilitator: "Marcus Tan",
    enrollment: [
      { role: "teachers", enrolled: 24, capacity: 38 },
      { role: "staff",    enrolled: 7,  capacity: 12 },
      { role: "admin",    enrolled: 3,  capacity: 6  },
      { role: "parents",  enrolled: 18, capacity: 40 },
    ],
  },
  {
    id: "change-q4",
    title: "Change Readiness Across Cultural Styles",
    description: "For teams where resistance to new initiatives is creating deadlock between new and veteran staff.",
    urgency: "medium",
    quarter: "Q4 2025",
    date: "Nov 6, 2025",
    time: "4:00 PM",
    reductionPct: 44,
    facilitator: "Marcus Tan",
    enrollment: [
      { role: "teachers", enrolled: 12, capacity: 30 },
      { role: "staff",    enrolled: 4,  capacity: 10 },
      { role: "admin",    enrolled: 2,  capacity: 6  },
      { role: "parents",  enrolled: 0,  capacity: 0  },
    ],
  },
];

const BACKLOG: BacklogWebinar[] = [
  {
    id: "belonging-backlog",
    title: "Building Collective Identity in Diverse Teams",
    description: "For staff where individual vs. collective orientation is weakening team cohesion.",
    urgency: "low",
    reductionPct: 36,
    pendingCount: 29,
    reason: "35pt gap between new and veteran teachers — 29 staff still pending",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const URGENCY_STYLES: Record<Urgency, { pill: string; dot: string; label: string }> = {
  high:   { pill: "bg-red-50 text-red-700 border border-red-200",       dot: "bg-red-500",    label: "Urgent" },
  medium: { pill: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400",  label: "Recommended" },
  low:    { pill: "bg-slate-100 text-slate-600 border border-slate-200", dot: "bg-slate-400", label: "Upcoming" },
};

const ROLE_LABELS: Record<RoleKey, string> = {
  teachers: "Teachers",
  staff:    "Staff",
  admin:    "Admin",
  parents:  "Parents",
};

const ROLE_COLORS: Record<RoleKey, { bar: string; text: string }> = {
  teachers: { bar: "bg-indigo-400",  text: "text-indigo-600" },
  staff:    { bar: "bg-violet-400",  text: "text-violet-600" },
  admin:    { bar: "bg-sky-400",     text: "text-sky-600"    },
  parents:  { bar: "bg-rose-400",    text: "text-rose-600"   },
};

const QUARTERS: Quarter[] = ["Q3 2025", "Q4 2025", "Q1 2026"];

function fillPct(e: RoleEnrollment) {
  if (e.capacity === 0) return null;
  return Math.round((e.enrolled / e.capacity) * 100);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function EnrollmentRow({ e }: { e: RoleEnrollment }) {
  if (e.capacity === 0) return null;
  const pct = fillPct(e)!;
  const colors = ROLE_COLORS[e.role];
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[11px] font-medium w-16 shrink-0 ${colors.text}`}>{ROLE_LABELS[e.role]}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-slate-500 tabular-nums w-16 text-right shrink-0">
        {e.enrolled}/{e.capacity}
        <span className="text-slate-400 ml-1">({pct}%)</span>
      </span>
    </div>
  );
}

function ScheduledCard({ w }: { w: ScheduledWebinar }) {
  const [open, setOpen] = useState(false);
  const sty = URGENCY_STYLES[w.urgency];
  const totalEnrolled = w.enrollment.reduce((s, e) => s + e.enrolled, 0);
  const totalCapacity = w.enrollment.reduce((s, e) => s + e.capacity, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mt-0.5">
          <Video className="h-4 w-4 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sty.pill}`}>{sty.label}</span>
            <span className="text-[11px] text-slate-400">{w.reductionPct}% avg friction reduction</span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 leading-snug">{w.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{w.description}</p>

          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <CalendarDays className="h-3 w-3 text-slate-400" />
              <span className="font-medium text-slate-700">{w.date}</span>
              <span>at {w.time}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Users className="h-3 w-3 text-slate-400" />
              <span>{totalEnrolled}/{totalCapacity} enrolled</span>
            </div>
          </div>

          <button
            onClick={() => setOpen(v => !v)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            Enrollment by role
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
          <Check className="h-3.5 w-3.5" />
          Scheduled
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 rounded-b-xl space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Enrollment by role</p>
          {w.enrollment.map(e => <EnrollmentRow key={e.role} e={e} />)}
          <p className="text-[11px] text-slate-400 mt-1 pt-2 border-t border-slate-100">
            Facilitated by <span className="font-medium text-slate-600">{w.facilitator}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function BacklogCard({ w, onSchedule }: { w: BacklogWebinar; onSchedule: () => void }) {
  const sty = URGENCY_STYLES[w.urgency];
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white hover:shadow-sm transition-shadow">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center mt-0.5">
          <Video className="h-4 w-4 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sty.pill}`}>{sty.label}</span>
            <span className="text-[11px] text-slate-400">{w.reductionPct}% avg friction reduction</span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 leading-snug">{w.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{w.description}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            <span>{w.reason}</span>
          </div>
        </div>
        <button
          onClick={onSchedule}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors mt-0.5"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Schedule
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WebinarQuarterlyPlanner() {
  const [scheduledIds, setScheduledIds] = useState<Set<string>>(
    () => new Set(SCHEDULED.map(w => w.id))
  );

  function handleScheduleBacklog(id: string) {
    setScheduledIds(prev => new Set([...prev, id]));
  }

  return (
    <div className="p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold font-sans text-slate-800">Quarterly Planner</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            What's scheduled this quarter and next — and what still needs a date.
          </p>
        </div>
      </div>

      {/* Quarters */}
      {QUARTERS.map(quarter => {
        const webinars = SCHEDULED.filter(w => w.quarter === quarter);
        if (webinars.length === 0) return null;
        return (
          <section key={quarter}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{quarter}</h2>
              <div className="flex-1 border-t border-slate-100" />
              <span className="text-[11px] text-slate-400 tabular-nums">{webinars.length} webinar{webinars.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-3">
              {webinars.map(w => <ScheduledCard key={w.id} w={w} />)}
            </div>
          </section>
        );
      })}

      {/* Backlog */}
      {BACKLOG.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Backlog — needs a date</h2>
            <div className="flex-1 border-t border-slate-200 border-dashed" />
            <span className="text-[11px] text-slate-400 tabular-nums">{BACKLOG.length} unscheduled</span>
          </div>
          <div className="space-y-3">
            {BACKLOG.map(w => (
              <BacklogCard
                key={w.id}
                w={w}
                onSchedule={() => handleScheduleBacklog(w.id)}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
