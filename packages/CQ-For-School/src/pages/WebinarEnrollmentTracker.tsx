import { useState } from "react";
import { BarChart2, Video, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Quarter = "Q3 2025" | "Q4 2025" | "Q1 2026";
type Urgency = "high" | "medium" | "low";
type BreakdownDim = "role" | "tenure" | "level" | "tenure+level";

interface Segment {
  label: string;       // e.g. "Teachers · 0–2 yrs · Middle"
  role: string;        // "Teachers" | "Staff" | "Admin" | "Parents"
  tenure?: string;     // "0–2 yrs" | "3–5 yrs" | "6–10 yrs" | "10+ yrs"
  level?: string;      // "Elementary" | "Middle" | "High School"
  enrolled: number;
  capacity: number;
}

interface TrackedWebinar {
  id: string;
  title: string;
  description: string;
  urgency: Urgency;
  quarter: Quarter;
  date: string;
  reductionPct: number;
  facilitator: string;
  segments: Segment[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const WEBINARS: TrackedWebinar[] = [
  {
    id: "authority-q3",
    title: "Navigating Hierarchy & Voice Across Cultures",
    description: "For staff experiencing friction around authority, decision-making, and being heard.",
    urgency: "high",
    quarter: "Q3 2025",
    date: "Aug 14, 2025",
    reductionPct: 42,
    facilitator: "Dr. Aisha Osei",
    segments: [
      { role: "Teachers", tenure: "0–2 yrs", level: "Elementary", enrolled: 2, capacity: 6 },
      { role: "Teachers", tenure: "0–2 yrs", level: "Middle",     enrolled: 3, capacity: 6 },
      { role: "Teachers", tenure: "0–2 yrs", level: "High School", enrolled: 1, capacity: 4 },
      { role: "Teachers", tenure: "3–5 yrs", level: "Elementary", enrolled: 1, capacity: 4 },
      { role: "Teachers", tenure: "3–5 yrs", level: "Middle",     enrolled: 1, capacity: 4 },
      { role: "Staff",    tenure: "0–2 yrs",                       enrolled: 2, capacity: 5 },
      { role: "Staff",    tenure: "3–5 yrs",                       enrolled: 1, capacity: 5 },
      { role: "Admin",                                              enrolled: 4, capacity: 6 },
    ],
  },
  {
    id: "pace-q3",
    title: "Agile Decision-Making Across Cultural Styles",
    description: "For teams where speed mismatches are creating blocked approvals and bypassed processes.",
    urgency: "high",
    quarter: "Q3 2025",
    date: "Sep 4, 2025",
    reductionPct: 38,
    facilitator: "Dr. Aisha Osei",
    segments: [
      { role: "Teachers", tenure: "0–2 yrs", level: "Elementary", enrolled: 3, capacity: 7 },
      { role: "Teachers", tenure: "0–2 yrs", level: "Middle",     enrolled: 4, capacity: 8 },
      { role: "Teachers", tenure: "0–2 yrs", level: "High School", enrolled: 2, capacity: 5 },
      { role: "Teachers", tenure: "3–5 yrs", level: "Elementary", enrolled: 2, capacity: 5 },
      { role: "Teachers", tenure: "3–5 yrs", level: "Middle",     enrolled: 1, capacity: 5 },
      { role: "Staff",    tenure: "0–2 yrs",                       enrolled: 3, capacity: 5 },
      { role: "Staff",    tenure: "3–5 yrs",                       enrolled: 2, capacity: 5 },
      { role: "Admin",                                              enrolled: 5, capacity: 6 },
    ],
  },
  {
    id: "communication-q4",
    title: "Communication Styles Across Cultures",
    description: "For staff and teams where direct/indirect style gaps are causing misreads and broken trust.",
    urgency: "medium",
    quarter: "Q4 2025",
    date: "Oct 9, 2025",
    reductionPct: 45,
    facilitator: "Marcus Tan",
    segments: [
      { role: "Teachers", tenure: "0–2 yrs", level: "Elementary", enrolled: 5, capacity: 8 },
      { role: "Teachers", tenure: "0–2 yrs", level: "Middle",     enrolled: 6, capacity: 8 },
      { role: "Teachers", tenure: "0–2 yrs", level: "High School", enrolled: 3, capacity: 6 },
      { role: "Teachers", tenure: "3–5 yrs", level: "Elementary", enrolled: 4, capacity: 6 },
      { role: "Teachers", tenure: "3–5 yrs", level: "Middle",     enrolled: 3, capacity: 5 },
      { role: "Teachers", tenure: "3–5 yrs", level: "High School", enrolled: 3, capacity: 5 },
      { role: "Staff",    tenure: "0–2 yrs",                       enrolled: 4, capacity: 6 },
      { role: "Staff",    tenure: "3–5 yrs",                       enrolled: 3, capacity: 6 },
      { role: "Admin",                                              enrolled: 3, capacity: 6 },
      { role: "Parents",  level: "Elementary",                     enrolled: 8, capacity: 15 },
      { role: "Parents",  level: "Middle",                         enrolled: 6, capacity: 15 },
      { role: "Parents",  level: "High School",                    enrolled: 4, capacity: 10 },
    ],
  },
  {
    id: "change-q4",
    title: "Change Readiness Across Cultural Styles",
    description: "For teams where resistance to new initiatives is creating deadlock between new and veteran staff.",
    urgency: "medium",
    quarter: "Q4 2025",
    date: "Nov 6, 2025",
    reductionPct: 44,
    facilitator: "Marcus Tan",
    segments: [
      { role: "Teachers", tenure: "0–2 yrs", level: "Elementary", enrolled: 3, capacity: 7 },
      { role: "Teachers", tenure: "0–2 yrs", level: "Middle",     enrolled: 4, capacity: 8 },
      { role: "Teachers", tenure: "0–2 yrs", level: "High School", enrolled: 2, capacity: 5 },
      { role: "Teachers", tenure: "3–5 yrs", level: "Elementary", enrolled: 1, capacity: 5 },
      { role: "Teachers", tenure: "3–5 yrs", level: "Middle",     enrolled: 2, capacity: 5 },
      { role: "Staff",    tenure: "0–2 yrs",                       enrolled: 2, capacity: 5 },
      { role: "Staff",    tenure: "3–5 yrs",                       enrolled: 2, capacity: 5 },
      { role: "Admin",                                              enrolled: 2, capacity: 6 },
    ],
  },
  {
    id: "belonging-q1",
    title: "Building Collective Identity in Diverse Teams",
    description: "For staff where individual vs. collective orientation is weakening team cohesion.",
    urgency: "low",
    quarter: "Q1 2026",
    date: "Jan 15, 2026",
    reductionPct: 36,
    facilitator: "Dr. Aisha Osei",
    segments: [
      { role: "Teachers", tenure: "0–2 yrs", level: "Elementary", enrolled: 2, capacity: 7 },
      { role: "Teachers", tenure: "0–2 yrs", level: "Middle",     enrolled: 3, capacity: 8 },
      { role: "Teachers", tenure: "0–2 yrs", level: "High School", enrolled: 1, capacity: 5 },
      { role: "Teachers", tenure: "3–5 yrs", level: "Middle",     enrolled: 2, capacity: 5 },
      { role: "Teachers", tenure: "3–5 yrs", level: "High School", enrolled: 1, capacity: 5 },
      { role: "Staff",    tenure: "0–2 yrs",                       enrolled: 1, capacity: 5 },
      { role: "Staff",    tenure: "3–5 yrs",                       enrolled: 1, capacity: 5 },
      { role: "Admin",                                              enrolled: 1, capacity: 6 },
    ],
  },
];

const QUARTERS: Quarter[] = ["Q3 2025", "Q4 2025", "Q1 2026"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const URGENCY_STYLES: Record<Urgency, { pill: string; label: string }> = {
  high:   { pill: "bg-red-50 text-red-700 border border-red-200",        label: "Urgent" },
  medium: { pill: "bg-amber-50 text-amber-700 border border-amber-200",  label: "Recommended" },
  low:    { pill: "bg-slate-100 text-slate-600 border border-slate-200", label: "Upcoming" },
};

const ROLE_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  "Teachers": { bar: "bg-indigo-400", bg: "bg-indigo-50",  text: "text-indigo-700" },
  "Staff":    { bar: "bg-violet-400", bg: "bg-violet-50",  text: "text-violet-700" },
  "Admin":    { bar: "bg-sky-400",    bg: "bg-sky-50",     text: "text-sky-700"    },
  "Parents":  { bar: "bg-rose-400",   bg: "bg-rose-50",    text: "text-rose-700"   },
};

const TENURE_ORDER = ["0–2 yrs", "3–5 yrs", "6–10 yrs", "10+ yrs"];
const LEVEL_ORDER  = ["Elementary", "Middle", "High School"];
const ROLE_ORDER   = ["Teachers", "Staff", "Admin", "Parents"];

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}

function sumSegments(segs: Segment[]) {
  return {
    enrolled: segs.reduce((s, x) => s + x.enrolled, 0),
    capacity: segs.reduce((s, x) => s + x.capacity, 0),
  };
}

function pctColor(pct: number) {
  return pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-slate-400";
}

// ─── Breakdown row ────────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  sublabel,
  colorClass,
  barClass,
  enrolled,
  capacity,
  indent = false,
}: {
  label: string;
  sublabel?: string;
  colorClass: string;
  barClass: string;
  enrolled: number;
  capacity: number;
  indent?: boolean;
}) {
  if (capacity === 0) return null;
  const pct = Math.round((enrolled / capacity) * 100);
  const seats = capacity - enrolled;
  return (
    <div className={`flex items-center gap-3 ${indent ? "pl-4" : ""}`}>
      <div className="w-40 shrink-0">
        <span className={`text-[11px] font-semibold ${colorClass}`}>{label}</span>
        {sublabel && <span className="text-[11px] text-slate-400 ml-1">{sublabel}</span>}
      </div>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barClass} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-32 text-right shrink-0 flex items-center justify-end gap-1.5">
        <span className="text-[11px] text-slate-700 tabular-nums font-medium">{enrolled}/{capacity}</span>
        <span className={`text-[10px] font-semibold tabular-nums ${pctColor(pct)}`}>({pct}%)</span>
        {seats === 0 && <span className="text-[10px] text-emerald-600 font-medium">Full</span>}
      </div>
    </div>
  );
}

// ─── Breakdown panel ──────────────────────────────────────────────────────────

function BreakdownPanel({ segments, dim }: { segments: Segment[]; dim: BreakdownDim }) {

  if (dim === "role") {
    const byRole = groupBy(segments, s => s.role);
    return (
      <div className="space-y-1.5">
        {ROLE_ORDER.filter(r => byRole.has(r)).map(role => {
          const segs = byRole.get(role)!;
          const { enrolled, capacity } = sumSegments(segs);
          const c = ROLE_COLORS[role] ?? ROLE_COLORS["Staff"];
          return (
            <BreakdownRow
              key={role}
              label={role}
              colorClass={c.text}
              barClass={c.bar}
              enrolled={enrolled}
              capacity={capacity}
            />
          );
        })}
      </div>
    );
  }

  if (dim === "tenure") {
    // Group: role → tenure
    const byRole = groupBy(segments, s => s.role);
    return (
      <div className="space-y-3">
        {ROLE_ORDER.filter(r => byRole.has(r)).map(role => {
          const roleSegs = byRole.get(role)!;
          const { enrolled: rEnrolled, capacity: rCapacity } = sumSegments(roleSegs);
          const c = ROLE_COLORS[role] ?? ROLE_COLORS["Staff"];
          const byTenure = groupBy(roleSegs, s => s.tenure ?? "—");
          const hasTenure = [...byTenure.keys()].some(k => k !== "—");
          return (
            <div key={role}>
              <BreakdownRow
                label={role}
                colorClass={c.text}
                barClass={c.bar}
                enrolled={rEnrolled}
                capacity={rCapacity}
              />
              {hasTenure && (
                <div className="mt-1 space-y-1">
                  {TENURE_ORDER.filter(t => byTenure.has(t)).map(tenure => {
                    const { enrolled, capacity } = sumSegments(byTenure.get(tenure)!);
                    return (
                      <BreakdownRow
                        key={tenure}
                        label={tenure}
                        colorClass="text-slate-500"
                        barClass={c.bar + " opacity-60"}
                        enrolled={enrolled}
                        capacity={capacity}
                        indent
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (dim === "level") {
    // Group: role → school level
    const byRole = groupBy(segments, s => s.role);
    return (
      <div className="space-y-3">
        {ROLE_ORDER.filter(r => byRole.has(r)).map(role => {
          const roleSegs = byRole.get(role)!;
          const { enrolled: rEnrolled, capacity: rCapacity } = sumSegments(roleSegs);
          const c = ROLE_COLORS[role] ?? ROLE_COLORS["Staff"];
          const byLevel = groupBy(roleSegs, s => s.level ?? "—");
          const hasLevel = [...byLevel.keys()].some(k => k !== "—");
          return (
            <div key={role}>
              <BreakdownRow
                label={role}
                colorClass={c.text}
                barClass={c.bar}
                enrolled={rEnrolled}
                capacity={rCapacity}
              />
              {hasLevel && (
                <div className="mt-1 space-y-1">
                  {LEVEL_ORDER.filter(l => byLevel.has(l)).map(level => {
                    const { enrolled, capacity } = sumSegments(byLevel.get(level)!);
                    return (
                      <BreakdownRow
                        key={level}
                        label={level}
                        colorClass="text-slate-500"
                        barClass={c.bar + " opacity-60"}
                        enrolled={enrolled}
                        capacity={capacity}
                        indent
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // tenure+level: role → tenure → school level
  const byRole = groupBy(segments, s => s.role);
  return (
    <div className="space-y-4">
      {ROLE_ORDER.filter(r => byRole.has(r)).map(role => {
        const roleSegs = byRole.get(role)!;
        const { enrolled: rEnrolled, capacity: rCapacity } = sumSegments(roleSegs);
        const c = ROLE_COLORS[role] ?? ROLE_COLORS["Staff"];
        const byTenure = groupBy(roleSegs, s => s.tenure ?? "—");
        return (
          <div key={role}>
            <BreakdownRow
              label={role}
              colorClass={c.text}
              barClass={c.bar}
              enrolled={rEnrolled}
              capacity={rCapacity}
            />
            <div className="mt-1.5 space-y-1.5 pl-4 border-l-2 border-slate-100 ml-2">
              {TENURE_ORDER.filter(t => byTenure.has(t)).map(tenure => {
                const tenureSegs = byTenure.get(tenure)!;
                const { enrolled: tEnrolled, capacity: tCapacity } = sumSegments(tenureSegs);
                const byLevel = groupBy(tenureSegs, s => s.level ?? "—");
                return (
                  <div key={tenure}>
                    <BreakdownRow
                      label={tenure}
                      colorClass="text-slate-600"
                      barClass={c.bar + " opacity-70"}
                      enrolled={tEnrolled}
                      capacity={tCapacity}
                    />
                    <div className="mt-0.5 space-y-0.5 pl-4">
                      {LEVEL_ORDER.filter(l => byLevel.has(l)).map(level => {
                        const { enrolled, capacity } = sumSegments(byLevel.get(level)!);
                        return (
                          <BreakdownRow
                            key={level}
                            label={level}
                            colorClass="text-slate-400"
                            barClass={c.bar + " opacity-40"}
                            enrolled={enrolled}
                            capacity={capacity}
                            indent
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Webinar card ─────────────────────────────────────────────────────────────

const DIM_LABELS: Record<BreakdownDim, string> = {
  "role":         "By role",
  "tenure":       "Role + tenure",
  "level":        "Role + school level",
  "tenure+level": "Role + tenure + level",
};

function RoleSummaryChips({ segments }: { segments: Segment[] }) {
  const byRole = groupBy(segments, s => s.role);
  return (
    <div className="flex flex-wrap gap-1.5">
      {ROLE_ORDER.filter(r => byRole.has(r)).map(role => {
        const { enrolled, capacity } = sumSegments(byRole.get(role)!);
        if (capacity === 0) return null;
        const pct = Math.round((enrolled / capacity) * 100);
        const c = ROLE_COLORS[role] ?? ROLE_COLORS["Staff"];
        return (
          <div key={role} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${c.bg}`}>
            <span className={`text-[11px] font-semibold ${c.text}`}>{role}</span>
            <span className="text-[11px] text-slate-600 tabular-nums">{enrolled}/{capacity}</span>
            <span className={`text-[10px] font-medium ${pctColor(pct)}`}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

function WebinarCard({ w }: { w: TrackedWebinar }) {
  const [open, setOpen] = useState(false);
  const [dim, setDim] = useState<BreakdownDim>("role");
  const sty = URGENCY_STYLES[w.urgency];
  const { enrolled: totalEnrolled, capacity: totalCapacity } = sumSegments(w.segments);
  const overallPct = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mt-0.5">
          <Video className="h-4 w-4 text-indigo-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sty.pill}`}>{sty.label}</span>
            <span className="text-[11px] text-slate-400">{w.date} · {w.reductionPct}% avg friction reduction</span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 leading-snug">{w.title}</h3>

          <div className="mt-2.5">
            <RoleSummaryChips segments={w.segments} />
          </div>

          <button
            onClick={() => setOpen(v => !v)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            Enrollment detail
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="shrink-0 text-right mt-0.5">
          <div className={`text-lg font-bold tabular-nums ${pctColor(overallPct)}`}>{overallPct}%</div>
          <div className="text-[10px] text-slate-400 whitespace-nowrap">{totalEnrolled}/{totalCapacity} total</div>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 rounded-b-xl">
          {/* Dimension toggle */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {(Object.keys(DIM_LABELS) as BreakdownDim[]).map(d => (
              <button
                key={d}
                onClick={() => setDim(d)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                  dim === d
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-200 text-slate-500 hover:text-slate-700"
                }`}
              >
                {DIM_LABELS[d]}
              </button>
            ))}
          </div>

          <BreakdownPanel segments={w.segments} dim={dim} />

          <p className="text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-100">
            Facilitated by <span className="font-medium text-slate-600">{w.facilitator}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Quarter summary strip ────────────────────────────────────────────────────

function QuarterSummary({ webinars }: { webinars: TrackedWebinar[] }) {
  const allSegs = webinars.flatMap(w => w.segments);
  const { enrolled: totalEnrolled, capacity: totalCapacity } = sumSegments(allSegs);
  const pct = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  const byRole = groupBy(allSegs, s => s.role);

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-3 flex items-center gap-6 flex-wrap">
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total enrollment</div>
        <div className="text-base font-bold text-slate-700 tabular-nums mt-0.5">
          {totalEnrolled}/{totalCapacity}{" "}
          <span className="text-sm font-normal text-slate-400">({pct}%)</span>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {ROLE_ORDER.filter(r => byRole.has(r)).map(role => {
          const { enrolled, capacity } = sumSegments(byRole.get(role)!);
          const c = ROLE_COLORS[role];
          return (
            <div key={role} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${c.bar}`} />
              <span className={`text-[11px] font-medium ${c.text}`}>{role}</span>
              <span className="text-[11px] text-slate-500 tabular-nums">{enrolled}/{capacity}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WebinarEnrollmentTracker() {
  const [activeQuarter, setActiveQuarter] = useState<Quarter | "all">("all");

  const visibleWebinars = activeQuarter === "all"
    ? WEBINARS
    : WEBINARS.filter(w => w.quarter === activeQuarter);

  return (
    <div className="p-6 space-y-6">

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <BarChart2 className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold font-sans text-slate-800">Enrollment Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Who's signed up — broken down by role, tenure, and school level.
          </p>
        </div>
      </div>

      {/* Quarter filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", ...QUARTERS] as const).map(q => (
          <button
            key={q}
            onClick={() => setActiveQuarter(q)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              activeQuarter === q
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {q === "all" ? "All quarters" : q}
          </button>
        ))}
      </div>

      {visibleWebinars.length > 0 && <QuarterSummary webinars={visibleWebinars} />}

      <div className="space-y-3">
        {visibleWebinars.map(w => <WebinarCard key={w.id} w={w} />)}
        {visibleWebinars.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No webinars scheduled for this quarter yet.</div>
        )}
      </div>

    </div>
  );
}
