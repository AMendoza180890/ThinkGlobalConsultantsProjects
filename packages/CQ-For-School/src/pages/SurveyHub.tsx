import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ClipboardList, ChevronLeft, ChevronRight, Bell,
  CheckCircle2, Clock, Users, TrendingUp, AlertTriangle,
  CalendarDays, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_ENROLLED = 86;

// ─── Mock data ────────────────────────────────────────────────────────────────
// Replace with Supabase queries when data layer is ready.
// Each week: Monday date as key.

interface WeekData {
  week: string;          // "YYYY-MM-DD" (Monday)
  label: string;         // e.g. "Apr 14"
  status: "open" | "closed" | "upcoming";
  responses: number;
  frictionReports: number;   // respondents who logged ≥1 friction
  webinarGate: boolean;      // webinar CQ wins section was triggered
  monthlyWeek: boolean;      // CQ quadrant section shown
  followUpsOpen: number;     // unresolved frictions carried forward
  recurringIssues: number;   // frictions open 3+ weeks
}

const MOCK_WEEKS: WeekData[] = [
  { week: "2026-04-19", label: "Apr 19", status: "open",     responses: 38, frictionReports: 11, webinarGate: true,  monthlyWeek: false, followUpsOpen: 7,  recurringIssues: 2 },
  { week: "2026-04-12", label: "Apr 12", status: "closed",   responses: 71, frictionReports: 18, webinarGate: false, monthlyWeek: false, followUpsOpen: 9,  recurringIssues: 3 },
  { week: "2026-04-05", label: "Apr 5",  status: "closed",   responses: 68, frictionReports: 14, webinarGate: true,  monthlyWeek: true,  followUpsOpen: 6,  recurringIssues: 1 },
  { week: "2026-03-29", label: "Mar 29", status: "closed",   responses: 74, frictionReports: 16, webinarGate: false, monthlyWeek: false, followUpsOpen: 8,  recurringIssues: 4 },
  { week: "2026-03-22", label: "Mar 22", status: "closed",   responses: 66, frictionReports: 13, webinarGate: false, monthlyWeek: false, followUpsOpen: 5,  recurringIssues: 2 },
  { week: "2026-03-15", label: "Mar 15", status: "closed",   responses: 70, frictionReports: 17, webinarGate: true,  monthlyWeek: false, followUpsOpen: 7,  recurringIssues: 3 },
  { week: "2026-03-08", label: "Mar 8",  status: "closed",   responses: 72, frictionReports: 15, webinarGate: false, monthlyWeek: false, followUpsOpen: 6,  recurringIssues: 1 },
  { week: "2026-03-01", label: "Mar 1",  status: "closed",   responses: 69, frictionReports: 12, webinarGate: false, monthlyWeek: true,  followUpsOpen: 4,  recurringIssues: 2 },
  { week: "2026-02-22", label: "Feb 22", status: "closed",   responses: 63, frictionReports: 10, webinarGate: false, monthlyWeek: false, followUpsOpen: 3,  recurringIssues: 1 },
  { week: "2026-02-15", label: "Feb 15", status: "closed",   responses: 67, frictionReports: 14, webinarGate: true,  monthlyWeek: false, followUpsOpen: 6,  recurringIssues: 2 },
  { week: "2026-02-08", label: "Feb 8",  status: "closed",   responses: 71, frictionReports: 16, webinarGate: false, monthlyWeek: false, followUpsOpen: 7,  recurringIssues: 3 },
  { week: "2026-02-01", label: "Feb 1",  status: "closed",   responses: 65, frictionReports: 11, webinarGate: false, monthlyWeek: true,  followUpsOpen: 5,  recurringIssues: 2 },
  { week: "2026-04-26", label: "Apr 26", status: "upcoming", responses: 0,  frictionReports: 0,  webinarGate: false, monthlyWeek: false, followUpsOpen: 0,  recurringIssues: 0 },
  { week: "2026-05-03", label: "May 3",  status: "upcoming", responses: 0,  frictionReports: 0,  webinarGate: false, monthlyWeek: true,  followUpsOpen: 0,  recurringIssues: 0 },
  { week: "2026-05-10", label: "May 10", status: "upcoming", responses: 0,  frictionReports: 0,  webinarGate: false, monthlyWeek: false, followUpsOpen: 0,  recurringIssues: 0 },
  { week: "2026-05-17", label: "May 17", status: "upcoming", responses: 0,  frictionReports: 0,  webinarGate: false, monthlyWeek: false, followUpsOpen: 0,  recurringIssues: 0 },
];

// ─── Special survey events ────────────────────────────────────────────────────
// These sit on specific dates and are distinct from the weekly pulse survey.

type SurveyEventType = "initial" | "end-of-semester" | "end-of-year";

interface SurveyEvent {
  id: string;
  date: string;          // "YYYY-MM-DD" — the day it sends
  type: SurveyEventType;
  label: string;         // short display name
  description: string;   // one-line purpose
  status: "sent" | "scheduled" | "draft";
  responses?: number;    // if sent
}

// School year = 10 months (Aug → May/Jun).
// Initial survey: week 1 of school year (August).
// End of Semester: end of month 6 (late January / early February).
// End of Year: end of month 10 (late May / early June).
const SURVEY_EVENTS: SurveyEvent[] = [
  // ── 2025–26 school year ──────────────────────────────────────────────────────
  {
    id: "initial-aug-2025",
    date: "2025-08-18",  // Week 1 — school year opens
    type: "initial",
    label: "Initial Survey",
    description: "Onboarding baseline — cultural profile, tenure, role, working style",
    status: "sent",
    responses: 79,
  },
  {
    id: "eos-feb-2026",
    date: "2026-02-02",  // End of month 6 (Aug→Jan = 6 months)
    type: "end-of-semester",
    label: "End of Semester",
    description: "Mid-year check — satisfaction, clarity, friction themes, retention intent",
    status: "sent",
    responses: 74,
  },
  {
    id: "eoy-jun-2026",
    date: "2026-06-01",  // End of month 10 (Aug→May = 10 months)
    type: "end-of-year",
    label: "End of Year",
    description: "Annual survey — turnover intent, CQ growth reflection, leadership assessment",
    status: "scheduled",
  },
  // ── 2026–27 school year ──────────────────────────────────────────────────────
  {
    id: "initial-aug-2026",
    date: "2026-08-17",  // Week 1 of next school year
    type: "initial",
    label: "Initial Survey",
    description: "Onboarding baseline for staff joining in Fall 2026",
    status: "draft",
  },
];

// primary teal = hsl(168,55%,38%) → #1a7a7a
// accent orange = hsl(28,80%,55%) → #e07b39
// destructive   = hsl(0,72%,51%)  → #d93025
const EVENT_STYLES: Record<SurveyEventType, { bg: string; text: string; dot: string; label: string }> = {
  "initial":          { bg: "bg-primary/10 border-primary/20",          text: "text-primary",    dot: "bg-primary",    label: "Initial" },
  "end-of-semester":  { bg: "bg-accent/10 border-accent/20",             text: "text-accent",     dot: "bg-accent",     label: "End of Semester" },
  "end-of-year":      { bg: "bg-destructive/10 border-destructive/20",   text: "text-destructive",dot: "bg-destructive",label: "End of Year" },
};

// ─── Response tracker breakdown data ─────────────────────────────────────────

interface BreakdownGroup {
  label: string;
  total: number;
  responded: number;
}

const BREAKDOWN_DIMS: { key: string; label: string; groups: BreakdownGroup[] }[] = [
  {
    key: "role",
    label: "By Role",
    groups: [
      { label: "All Teachers",   total: 75, responded: 31 },
      { label: "Administration", total: 11, responded: 7  },
    ],
  },
  {
    key: "dept",
    label: "By Department",
    groups: [
      { label: "Humanities", total: 29, responded: 12 },
      { label: "STEM",       total: 27, responded: 11 },
      { label: "Arts & PE",  total: 19, responded: 8  },
      { label: "Admin",      total: 11, responded: 7  },
    ],
  },
  {
    key: "level",
    label: "By School Level",
    groups: [
      { label: "Elementary",   total: 24, responded: 11 },
      { label: "Middle School", total: 25, responded: 10 },
      { label: "High School",  total: 26, responded: 10 },
      { label: "Admin",        total: 11, responded: 7  },
    ],
  },
  {
    key: "tenure",
    label: "By Tenure",
    groups: [
      { label: "0–2 Years",  total: 22, responded: 7  },
      { label: "3–5 Years",  total: 26, responded: 11 },
      { label: "6–10 Years", total: 21, responded: 10 },
      { label: "10+ Years",  total: 17, responded: 10 },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, d: number) {
  if (d === 0) return 0;
  return Math.round((n / d) * 100);
}

function responseRateColor(rate: number) {
  if (rate >= 75) return "text-primary";
  if (rate >= 50) return "text-accent";
  return "text-destructive";
}

function responseRateBg(rate: number) {
  if (rate >= 75) return "bg-primary";
  if (rate >= 50) return "bg-accent";
  return "bg-destructive";
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

// Build a 6-row × 7-col grid for a given month (year, month 0-indexed)
function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  // Monday-first: 0=Mon … 6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells  = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = i - startOffset + 1;
    cells.push(d >= 1 && d <= lastDay.getDate() ? new Date(year, month, d) : null);
  }
  const rows: (Date | null)[][] = [];
  for (let r = 0; r < cells.length / 7; r++) rows.push(cells.slice(r * 7, r * 7 + 7));
  return rows;
}

// Given a date, return the Monday of its week as "YYYY-MM-DD"
function getMondayKey(d: Date): string {
  const copy = new Date(d);
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return copy.toISOString().slice(0, 10);
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ─── WeekDetail ───────────────────────────────────────────────────────────────

function WeekDetail({ week, onSendReminder }: {
  week: WeekData;
  onSendReminder: () => void;
}) {
  const rate = pct(week.responses, TOTAL_ENROLLED);
  const pending = TOTAL_ENROLLED - week.responses;
  const frictionRate = pct(week.frictionReports, week.responses);
  const resolutionRate = week.followUpsOpen > 0
    ? pct(week.followUpsOpen - week.recurringIssues, week.followUpsOpen)
    : null;

  const stats = [
    {
      label: "Response rate",
      value: week.status === "open" ? `${week.responses} / ${TOTAL_ENROLLED}` : `${rate}%`,
      sub: week.status === "open" ? `${rate}% so far` : `${week.responses} of ${TOTAL_ENROLLED} staff`,
      icon: Users,
      color: responseRateColor(rate),
      iconBg: null as string | null,
      iconBgStyle: { backgroundColor: "#f0fafa", color: "#1a7a7a" },
    },
    {
      label: "Friction reports",
      value: `${week.frictionReports}`,
      sub: `${frictionRate}% of respondents`,
      icon: AlertTriangle,
      color: frictionRate > 30 ? "text-destructive" : frictionRate > 15 ? "text-accent" : "text-slate-700",
      iconBg: "bg-accent/10 text-accent",
      iconBgStyle: null as React.CSSProperties | null,
    },
    ...(week.followUpsOpen > 0 ? [{
      label: "Follow-up frictions",
      value: `${week.followUpsOpen}`,
      sub: week.recurringIssues > 0
        ? `${week.recurringIssues} recurring (3+ weeks)`
        : "All resolved or recent",
      icon: Clock,
      color: week.recurringIssues > 0 ? "text-destructive" : "text-accent",
      iconBg: "bg-accent/10 text-accent",
      iconBgStyle: null as React.CSSProperties | null,
    }] : []),
    ...(resolutionRate !== null ? [{
      label: "Resolution rate",
      value: `${resolutionRate}%`,
      sub: "Follow-ups resolved within 2 weeks",
      icon: CheckCircle2,
      color: resolutionRate >= 70 ? "text-primary" : resolutionRate >= 40 ? "text-accent" : "text-destructive",
      iconBg: "bg-primary/10 text-primary",
      iconBgStyle: null as React.CSSProperties | null,
    }] : []),
    ...(week.monthlyWeek ? [{
      label: "Monthly CQ",
      value: "Active",
      sub: "CQ quadrant questions shown",
      icon: TrendingUp,
      color: null as string | null,
      iconBg: null as string | null,
      iconBgStyle: { backgroundColor: "#f0fafa", color: "#1a7a7a" },
      colorStyle: { color: "#1a7a7a" },
    }] : []),
  ];

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/3 px-4 py-3 space-y-3">
      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => {
          const Icon = s.icon;
          const cs = (s as { colorStyle?: React.CSSProperties }).colorStyle;
          const ibs = s.iconBgStyle;
          return (
            <div key={s.label} className="rounded-lg bg-white border border-border/60 px-2.5 py-2 flex gap-2 items-start">
              <div
                className={cn("rounded-md p-1 shrink-0 mt-0.5", !ibs && s.iconBg)}
                style={ibs ?? undefined}
              >
                <Icon className="h-3 w-3" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mb-0.5">{s.label}</p>
                <p className={cn("text-base font-bold leading-none tabular-nums", !cs && s.color)} style={cs ?? undefined}>{s.value}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Response bar */}
      <div>
        <div className="flex items-center justify-between mb-1 text-[10px] text-muted-foreground">
          <span className="font-medium">Response progress</span>
          <span className="tabular-nums">{week.responses} responded · {pending} pending</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", responseRateBg(rate))}
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      {/* Send reminder — only for open weeks with pending responders */}
      {week.status === "open" && pending > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{pending} staff</span> haven't responded yet.
          </p>
          <button
            type="button"
            onClick={onSendReminder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0 ml-3"
          >
            <Bell className="h-3 w-3" />
            Send reminder
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Calendar tab ─────────────────────────────────────────────────────────────

function CalendarTab() {
  const { toast } = useToast();

  // Start display on the month containing today (Apr 2026)
  const today = new Date(2026, 3, 24); // matches mock "today"
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedWeek,  setSelectedWeek]  = useState<string | null>(
    MOCK_WEEKS.find(w => w.status === "open")?.week ?? null
  );
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // Index weeks by their Monday key for fast lookup
  const weekIndex = useMemo(() => {
    const idx: Record<string, WeekData> = {};
    MOCK_WEEKS.forEach(w => { idx[w.week] = w; });
    return idx;
  }, []);

  // Index special events by their exact date
  const eventIndex = useMemo(() => {
    const idx: Record<string, SurveyEvent> = {};
    SURVEY_EVENTS.forEach(e => { idx[e.date] = e; });
    return idx;
  }, []);

  const rows = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const selectedWeekData  = useMemo(() => selectedWeek  ? weekIndex[selectedWeek]   ?? null : null, [selectedWeek,  weekIndex]);
  const selectedEventData = useMemo(() => selectedEvent ? SURVEY_EVENTS.find(e => e.id === selectedEvent) ?? null : null, [selectedEvent]);

  const current = useMemo(() => MOCK_WEEKS.find(w => w.status === "open") ?? null, []);

  // Unified clear
  const clearSelection = () => { setSelectedWeek(null); setSelectedEvent(null); };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleSendReminder = () => {
    toast({
      title: "Reminder queued",
      description: `A reminder will go out to all ${TOTAL_ENROLLED - (current?.responses ?? 0)} pending staff in the next email batch.`,
    });
  };

  // Determine the week-stripe style for a day cell
  // Returns { cls, style } — cls is for classes that are in Tailwind output; style overrides for teal
  function weekBg(mondayKey: string): { cls: string; style?: React.CSSProperties } {
    const w = weekIndex[mondayKey];
    if (!w) return { cls: "" };
    if (w.status === "open")     return { cls: "border", style: { backgroundColor: "hsl(168 55% 38% / 0.07)", borderColor: "hsl(168 55% 38% / 0.25)" } };
    if (w.status === "upcoming") {
      if (w.monthlyWeek) return { cls: "border", style: { backgroundColor: "#f0fafa", borderColor: "#99d6d6" } };
      return { cls: "bg-slate-50 border-slate-200" };
    }
    if (w.monthlyWeek) return { cls: "border", style: { backgroundColor: "#f0fafa", borderColor: "#99d6d6" } };
    const r = pct(w.responses, TOTAL_ENROLLED);
    if (r >= 75) return { cls: "border", style: { backgroundColor: "hsl(168 55% 38% / 0.06)", borderColor: "hsl(168 55% 38% / 0.18)" } };
    if (r >= 50) return { cls: "border", style: { backgroundColor: "hsl(28 80% 55% / 0.07)", borderColor: "hsl(28 80% 55% / 0.25)" } };
    return { cls: "border", style: { backgroundColor: "hsl(0 72% 51% / 0.06)", borderColor: "hsl(0 72% 51% / 0.20)" } };
  }

  function weekTextColor(mondayKey: string): string {
    const w = weekIndex[mondayKey];
    if (!w) return "text-foreground";
    if (w.status === "open")     return "text-primary";
    if (w.status === "upcoming") return "text-slate-500";
    const r = pct(w.responses, TOTAL_ENROLLED);
    if (r >= 75) return "text-primary";
    if (r >= 50) return "text-accent";
    return "text-destructive";
  }

  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  return (
    <div className="space-y-5">
      {/* Two-column layout: calendar left, detail right */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">

        {/* ── Month grid ── */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">

          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50/60">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-semibold text-slate-900 text-sm">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </p>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b">
            {DAY_LABELS.map(d => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div>
            {rows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 border-b last:border-b-0">
                {row.map((day, ci) => {
                  if (!day) {
                    return <div key={ci} className="h-20 border-r last:border-r-0 bg-slate-50/40" />;
                  }

                  const dateKey   = day.toISOString().slice(0, 10);
                  const mondayKey = getMondayKey(day);
                  const weekData  = weekIndex[mondayKey];
                  const eventData = eventIndex[dateKey];
                  const isMon     = (day.getDay() + 6) % 7 === 0;
                  const isSun     = day.getDay() === 0;
                  const isWeekSelected  = selectedWeek  === mondayKey && !!weekData;
                  const isEventSelected = selectedEvent !== null && eventData?.id === selectedEvent;
                  const rate = weekData ? pct(weekData.responses, TOTAL_ENROLLED) : 0;

                  const eventStyle = eventData ? EVENT_STYLES[eventData.type] : null;

                  // Tooltip flips left for columns 4-6 (Thu-Sun) to stay in viewport
                  const tooltipLeft = ci <= 3;

                  const wbg = weekData ? weekBg(mondayKey) : { cls: "bg-white" };

                  return (
                    <div
                      key={ci}
                      className={cn(
                        "h-20 border-r last:border-r-0 relative flex flex-col p-1.5 transition-all group/cell",
                        wbg.cls,
                        isWeekSelected && "ring-2 ring-inset ring-primary/60",
                      )}
                      style={wbg.style}
                    >
                      {/* Day number — clickable to select week */}
                      <button
                        onClick={() => {
                          setSelectedEvent(null);
                          if (weekData) setSelectedWeek(prev => prev === mondayKey ? null : mondayKey);
                        }}
                        className={cn(
                          "text-xs font-semibold leading-none w-5 h-5 flex items-center justify-center rounded-full mb-1 shrink-0 transition-colors",
                          isToday(day)
                            ? "bg-primary text-primary-foreground"
                            : weekData
                            ? cn(weekTextColor(mondayKey), "hover:bg-black/10")
                            : "text-slate-400 hover:bg-black/5"
                        )}
                      >
                        {day.getDate()}
                      </button>

                      {/* Monday: show weekly survey label + date */}
                      {isMon && weekData && (
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={cn("text-[9px] font-semibold leading-none", !weekData.monthlyWeek && weekTextColor(mondayKey))}
                            style={weekData.monthlyWeek ? { color: "#1a7a7a" } : undefined}
                          >
                            {weekData.monthlyWeek ? "Monthly" : "Weekly"} · {weekData.label}
                          </span>
                          {weekData.status === "open" && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold leading-none text-primary">
                              <span className="w-1 h-1 rounded-full bg-primary animate-pulse inline-block" />
                              Open · {weekData.responses}/{TOTAL_ENROLLED}
                            </span>
                          )}
                          {weekData.status === "closed" && (
                            <span className={cn("text-[9px] font-bold leading-none", weekTextColor(mondayKey))}>
                              {rate}% · {weekData.responses}/{TOTAL_ENROLLED}
                            </span>
                          )}
                          {weekData.status === "upcoming" && (
                            <span className="text-[9px] font-medium leading-none text-slate-400">Scheduled</span>
                          )}
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {weekData.recurringIssues > 0 && (
                              <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-destructive/10 text-destructive leading-none">
                                {weekData.recurringIssues}↺
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Special survey event pill — sits at bottom of cell */}
                      {eventData && eventStyle && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWeek(null);
                            setSelectedEvent(prev => prev === eventData.id ? null : eventData.id);
                          }}
                          className={cn(
                            "absolute bottom-1 left-1 right-1 rounded px-1 py-0.5 border text-left transition-all",
                            eventStyle.bg,
                            isEventSelected && "ring-2 ring-offset-0 ring-primary"
                          )}
                        >
                          <div className="flex items-center gap-0.5">
                            <span className={cn("w-1 h-1 rounded-full shrink-0", eventStyle.dot)} />
                            <span className={cn("text-[8px] font-bold leading-none truncate", eventStyle.text)}>
                              {eventData.label}
                            </span>
                          </div>
                        </button>
                      )}

                      {/* Response rate mini-bar on Sunday */}
                      {isSun && weekData && weekData.status === "closed" && !eventData && (
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 h-1 rounded-full bg-white/60 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", responseRateBg(rate))}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      )}

                      {/* Hover tooltip — shown for any day in a known week */}
                      {weekData && weekData.status !== "upcoming" && (
                        <div className={cn(
                          "absolute top-0 z-50 w-52 rounded-xl border border-border bg-white shadow-xl p-3 space-y-2",
                          "opacity-0 pointer-events-none group-hover/cell:opacity-100 transition-opacity duration-150",
                          tooltipLeft ? "left-full ml-1" : "right-full mr-1",
                          // Keep tooltip below top edge for first row
                          ri === 0 ? "top-0" : "-top-2",
                        )}>
                          {/* Header */}
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-foreground">
                              {weekData.monthlyWeek ? "Monthly CQ" : "Weekly"} · {weekData.label}
                            </p>
                            <span className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                              weekData.status === "open"
                                ? "bg-primary/10 text-primary"
                                : "bg-slate-100 text-slate-500"
                            )}>
                              {weekData.status === "open" ? "Live" : "Closed"}
                            </span>
                          </div>

                          {/* Response bar */}
                          <div>
                            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                              <span>Responses</span>
                              <span className={cn("font-bold", responseRateColor(rate))}>{rate}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={cn("h-full rounded-full", responseRateBg(rate))} style={{ width: `${rate}%` }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                              {weekData.responses} of {TOTAL_ENROLLED} staff
                            </p>
                          </div>

                          {/* Stat rows */}
                          <div className="space-y-1 pt-1 border-t border-border/50">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">Friction reports</span>
                              <span className="font-semibold tabular-nums">{weekData.frictionReports}</span>
                            </div>
                            {weekData.followUpsOpen > 0 && (
                              <div className="flex justify-between text-[10px]">
                                <span className="text-muted-foreground">Open follow-ups</span>
                                <span className="font-semibold tabular-nums text-accent">{weekData.followUpsOpen}</span>
                              </div>
                            )}
                            {weekData.recurringIssues > 0 && (
                              <div className="flex justify-between text-[10px]">
                                <span className="text-muted-foreground">Recurring (3+ wks)</span>
                                <span className="font-semibold tabular-nums text-destructive">{weekData.recurringIssues}</span>
                              </div>
                            )}
                            {weekData.monthlyWeek && (
                              <div className="flex justify-between text-[10px]">
                                <span className="text-muted-foreground">Monthly CQ</span>
                                <span className="font-semibold" style={{ color: "#1a7a7a" }}>Included</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Hover tooltip for special survey events */}
                      {eventData && eventStyle && (
                        <div className={cn(
                          "absolute z-50 w-52 rounded-xl border shadow-xl p-3 space-y-2",
                          "opacity-0 pointer-events-none group-hover/cell:opacity-100 transition-opacity duration-150",
                          eventStyle.bg,
                          tooltipLeft ? "left-full ml-1" : "right-full mr-1",
                          ri === 0 ? "top-0" : "-top-2",
                          // If both week and event tooltips would show, offset event one lower
                          weekData ? "top-16" : "",
                        )}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", eventStyle.dot)} />
                            <p className={cn("text-xs font-bold", eventStyle.text)}>{eventData.label}</p>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-snug">{eventData.description}</p>
                          <div className="flex flex-wrap gap-2 pt-1 border-t border-black/5">
                            <div>
                              <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Date</p>
                              <p className="text-[10px] font-semibold text-slate-700">{eventData.date}</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Status</p>
                              <p className={cn("text-[10px] font-semibold capitalize", eventStyle.text)}>{eventData.status}</p>
                            </div>
                            {eventData.responses != null && (
                              <div>
                                <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Responses</p>
                                <p className="text-[10px] font-semibold text-slate-700">{eventData.responses}/{TOTAL_ENROLLED}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t bg-slate-50/40 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-500">
            <span className="font-semibold text-slate-400 uppercase tracking-wide mr-1">Weekly pulse</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded inline-block border" style={{ backgroundColor: "hsl(168 55% 38% / 0.10)", borderColor: "hsl(168 55% 38% / 0.30)" }} />Open</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded inline-block border" style={{ backgroundColor: "hsl(168 55% 38% / 0.06)", borderColor: "hsl(168 55% 38% / 0.18)" }} />≥75%</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded inline-block border" style={{ backgroundColor: "hsl(28 80% 55% / 0.07)", borderColor: "hsl(28 80% 55% / 0.25)" }} />50–74%</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded inline-block border" style={{ backgroundColor: "hsl(0 72% 51% / 0.06)", borderColor: "hsl(0 72% 51% / 0.20)" }} />&lt;50%</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" />Upcoming</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded inline-block border" style={{ backgroundColor: "#f0fafa", borderColor: "#99d6d6" }} />Monthly CQ</span>
            <span className="mx-1 text-slate-300">|</span>
            <span className="font-semibold text-slate-400 uppercase tracking-wide mr-1">Special surveys</span>
            {Object.entries(EVENT_STYLES).map(([, s]) => (
              <span key={s.label} className="flex items-center gap-1.5">
                <span className={cn("w-3 h-3 rounded border inline-block", s.bg)} />
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Detail panel ── */}
        <div className="sticky top-4 space-y-4">

          {/* Special survey event detail */}
          {selectedEventData && (() => {
            const s = EVENT_STYLES[selectedEventData.type];
            return (
              <div className={cn("rounded-xl border p-4 space-y-3", s.bg)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", s.dot)} />
                      <p className={cn("text-sm font-bold", s.text)}>{selectedEventData.label}</p>
                    </div>
                    <p className="text-xs text-slate-600">{selectedEventData.description}</p>
                  </div>
                  <button onClick={clearSelection} className="text-xs text-slate-400 hover:text-slate-700 underline underline-offset-2 shrink-0">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="rounded-lg bg-white/70 border border-white px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">Send date</p>
                    <p className="font-semibold text-slate-800">{selectedEventData.date}</p>
                  </div>
                  <div className="rounded-lg bg-white/70 border border-white px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">Status</p>
                    <p className={cn("font-semibold capitalize", s.text)}>{selectedEventData.status}</p>
                  </div>
                  {selectedEventData.responses != null && (
                    <div className="rounded-lg bg-white/70 border border-white px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">Responses</p>
                      <p className="font-semibold text-slate-800">{selectedEventData.responses} / {TOTAL_ENROLLED}</p>
                    </div>
                  )}
                </div>
                {selectedEventData.status !== "sent" && (
                  <button
                    onClick={() => toast({ title: "Reminder scheduled", description: `Staff will be notified before the ${selectedEventData.label} sends on ${selectedEventData.date}.` })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-white text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
                  >
                    <Bell className="h-3 w-3" />
                    Schedule reminder
                  </button>
                )}
              </div>
            );
          })()}

          {/* Weekly survey detail */}
          {!selectedEventData && selectedWeekData && selectedWeekData.status !== "upcoming" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Week of {selectedWeekData.label}</p>
                <button onClick={clearSelection} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">Clear</button>
              </div>
              <WeekDetail week={selectedWeekData} onSendReminder={handleSendReminder} />
            </>
          )}

          {/* Upcoming weekly week */}
          {!selectedEventData && selectedWeekData?.status === "upcoming" && (
            <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 px-6 py-8 text-center space-y-3">
              <CalendarDays className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-foreground">Week of {selectedWeekData.label}</p>
              <p className="text-xs text-muted-foreground">Weekly survey not yet sent.</p>
              {selectedWeekData.monthlyWeek && (
                <p className="text-xs font-medium" style={{ color: "#1a7a7a" }}>Monthly CQ quadrant questions will be included.</p>
              )}
              <button
                onClick={() => toast({ title: "Reminder scheduled", description: `Staff will be notified when the ${selectedWeekData.label} survey opens.` })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Bell className="h-3 w-3" />
                Schedule reminder
              </button>
            </div>
          )}

          {/* Empty state */}
          {!selectedEventData && !selectedWeekData && (
            <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 px-6 py-10 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Click a survey week or event to see details</p>
            </div>
          )}

          {/* Current week quick stats — shown when nothing else selected */}
          {current && !selectedWeekData && !selectedEventData && (
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50/60 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                <p className="text-sm font-semibold text-slate-900">This week — {current.label}</p>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                <div className="flex items-end justify-between">
                  <span className={cn("text-3xl font-bold tabular-nums", responseRateColor(pct(current.responses, TOTAL_ENROLLED)))}>
                    {current.responses}
                  </span>
                  <span className="text-sm text-muted-foreground">of {TOTAL_ENROLLED} staff</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", responseRateBg(pct(current.responses, TOTAL_ENROLLED)))}
                    style={{ width: `${pct(current.responses, TOTAL_ENROLLED)}%` }}
                  />
                </div>
                <button
                  onClick={handleSendReminder}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Bell className="h-3 w-3" />
                  Send reminder to {TOTAL_ENROLLED - current.responses} pending
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Response Tracker tab ─────────────────────────────────────────────────────

// Weeks available for selection: open + closed, newest first
const SELECTABLE_WEEKS = MOCK_WEEKS
  .filter(w => w.status !== "upcoming")
  .sort((a, b) => b.week.localeCompare(a.week));

function ResponseTrackerTab() {
  const { toast } = useToast();
  const [activeDim, setActiveDim] = useState("role");
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(
    SELECTABLE_WEEKS[0]?.week ?? ""
  );

  const selectedWeek = SELECTABLE_WEEKS.find(w => w.week === selectedWeekKey) ?? SELECTABLE_WEEKS[0];
  const totalResponded = selectedWeek?.responses ?? 0;
  const totalPending = TOTAL_ENROLLED - totalResponded;
  const overallRate = pct(totalResponded, TOTAL_ENROLLED);

  const dim = BREAKDOWN_DIMS.find(d => d.key === activeDim)!;

  const handleBulkReminder = () => {
    toast({
      title: "Reminder queued",
      description: `A reminder will go out to all ${totalPending} staff who haven't responded yet.`,
    });
  };

  // Trend: compare selected week rate to the week immediately before it
  const selectedIdx = SELECTABLE_WEEKS.findIndex(w => w.week === selectedWeekKey);
  const prevWeek = SELECTABLE_WEEKS[selectedIdx + 1] ?? null;
  const prevRate = prevWeek ? pct(prevWeek.responses, TOTAL_ENROLLED) : null;
  const rateDiff = prevRate !== null ? overallRate - prevRate : null;

  return (
    <div className="space-y-6">

      {/* Week selector */}
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
        <label htmlFor="week-select" className="text-sm font-medium text-foreground whitespace-nowrap">Week of</label>
        <select
          id="week-select"
          value={selectedWeekKey}
          onChange={e => setSelectedWeekKey(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {SELECTABLE_WEEKS.map(w => (
            <option key={w.week} value={w.week}>
              {w.label}{w.status === "open" ? " (open)" : ""}{w.monthlyWeek ? " · Monthly CQ" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Responded",
            value: totalResponded,
            sub: `of ${TOTAL_ENROLLED} enrolled`,
            color: "text-primary",
            bg: "bg-primary/5 border-primary/20",
            icon: CheckCircle2,
            iconCls: "text-primary",
          },
          {
            label: "Pending",
            value: totalPending,
            sub: "haven't responded yet",
            color: "text-accent",
            bg: "bg-accent/10 border-accent/20",
            icon: Clock,
            iconCls: "text-accent",
          },
          {
            label: "Response rate",
            value: `${overallRate}%`,
            sub: rateDiff !== null
              ? `${rateDiff >= 0 ? "+" : ""}${rateDiff}% vs last week`
              : "selected week",
            color: responseRateColor(overallRate),
            bg: "",
            bgStyle: { backgroundColor: "#f0fafa", borderColor: "#99d6d6" },
            icon: BarChart3,
            iconCls: "",
            iconStyle: { color: "#1a7a7a" },
          },
          {
            label: "Recurring issues",
            value: selectedWeek?.recurringIssues ?? 0,
            sub: "frictions open 3+ weeks",
            color: (selectedWeek?.recurringIssues ?? 0) > 0 ? "text-destructive" : "text-primary",
            bg: (selectedWeek?.recurringIssues ?? 0) > 0 ? "bg-destructive/5 border-destructive/20" : "bg-primary/5 border-primary/20",
            icon: AlertTriangle,
            iconCls: (selectedWeek?.recurringIssues ?? 0) > 0 ? "text-destructive" : "text-primary",
          },
        ].map(s => {
          const Icon = s.icon;
          const bgs = (s as { bgStyle?: React.CSSProperties }).bgStyle;
          const ics = (s as { iconStyle?: React.CSSProperties }).iconStyle;
          return (
            <div key={s.label} className={cn("rounded-xl border p-4", s.bg)} style={bgs}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("h-4 w-4", !ics && s.iconCls)} style={ics} />
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{s.label}</p>
              </div>
              <p className={cn("text-3xl font-bold tabular-nums", s.color)}>{s.value}</p>
              <p className="text-[11px] text-slate-500 mt-1">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Breakdown */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b bg-slate-50/60 flex-wrap">
          <div>
            <p className="font-semibold text-slate-900 text-sm">Response breakdown — {selectedWeek?.label ?? "this week"}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Aggregated — no individual data shown</p>
          </div>
          {/* Dim selector */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 text-xs font-medium">
            {BREAKDOWN_DIMS.map(d => (
              <button
                key={d.key}
                onClick={() => setActiveDim(d.key)}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors",
                  activeDim === d.key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {dim.groups.map(g => {
            const groupRate = pct(g.responded, g.total);
            const groupPending = g.total - g.responded;
            return (
              <div key={g.label} className="px-5 py-3 flex items-center gap-4">
                <div className="w-32 shrink-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{g.label}</p>
                  <p className="text-[11px] text-muted-foreground">{g.total} enrolled</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", responseRateBg(groupRate))}
                        style={{ width: `${groupRate}%` }}
                      />
                    </div>
                    <span className={cn("text-xs font-bold tabular-nums w-8 shrink-0 text-right", responseRateColor(groupRate))}>
                      {groupRate}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {g.responded} responded · {groupPending} pending
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: bulk reminder */}
        <div className="px-5 py-3 border-t bg-slate-50/40 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{totalPending} staff</span> hadn't responded for week of {selectedWeek?.label}.
          </p>
          <button
            type="button"
            onClick={handleBulkReminder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
          >
            <Bell className="h-3 w-3" />
            Send reminder to all pending
          </button>
        </div>
      </div>

      {/* Historical response rate sparkline table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50/60">
          <p className="font-semibold text-slate-900 text-sm">Historical response rates</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Last 8 closed weeks</p>
        </div>
        <div className="divide-y divide-border/50">
          {MOCK_WEEKS
            .filter(w => w.status === "closed")
            .sort((a, b) => b.week.localeCompare(a.week))
            .slice(0, 8)
            .map(w => {
              const r = pct(w.responses, TOTAL_ENROLLED);
              return (
                <div key={w.week} className="px-5 py-2.5 flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-14 shrink-0">{w.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full", responseRateBg(r))} style={{ width: `${r}%` }} />
                  </div>
                  <span className={cn("text-xs font-bold tabular-nums w-8 text-right", responseRateColor(r))}>{r}%</span>
                  <div className="flex items-center gap-1 w-28 justify-end">
                    {w.monthlyWeek && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: "#d4f0ee", color: "#1a7a7a" }}>CQ</span>
                    )}
                    {w.recurringIssues > 0 && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-destructive/10 text-destructive">
                        {w.recurringIssues} recurring
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "calendar", label: "Survey Calendar", icon: CalendarDays },
  { id: "tracker",  label: "Response Tracker", icon: Users },
] as const;

type TabId = typeof TABS[number]["id"];

export default function SurveyHub() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const activeTab: TabId = TABS.find(t => t.id === tab)?.id ?? "calendar";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b bg-background px-6 pt-6 pb-0 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
            <ClipboardList className="h-4 w-4 text-primary" />
          </span>
          <div>
            <h1 className="font-sans text-2xl font-semibold text-foreground leading-tight">Survey Hub</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Weekly survey calendar, response tracking, and issue follow-ups
            </p>
          </div>
        </div>
        <div className="flex gap-0 -mb-px">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/survey-hub/${tab.id}`, { replace: true })}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-foreground font-semibold text-foreground"
                    : "border-transparent font-normal text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "calendar" && <CalendarTab />}
        {activeTab === "tracker"  && <ResponseTrackerTab />}
      </div>
    </div>
  );
}
