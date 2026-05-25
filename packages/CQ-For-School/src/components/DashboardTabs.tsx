import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import {
  TrendingUp, TrendingDown, AlertTriangle, Shield, Sparkles, Target,
  Clock, DollarSign, Flame, Award, ArrowUp, ArrowDown, Minus,
  Trophy, Star, Settings, Download, Users, BookOpen, Video,
  Lightbulb, CheckCircle2, XCircle, Activity, BarChart2, ClipboardList,
  Zap, Info, CalendarDays, ArrowRight, PlayCircle, GraduationCap,
  Printer, PlusCircle, Trash2, CalendarCheck,
  BarChart3, Flag, Edit3,
} from "lucide-react";
import type { TeacherInsight } from "@/hooks/useSchoolData";
import { FRICTION_ISSUES, LESSON_MAPPINGS } from "@/lib/data";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NSMScores {
  frictionScore: number;
  confidenceScore: number;
  cqWinsScore: number;
  nsm: number;
  turnoverRisk: number;
}
interface TimeScopedMetrics { issuesReported: number; hoursSaved: number; moneySaved: number }
interface WoWMetrics { issuesChange: number; hoursChange: number; moneyChange: number }
interface FrictionPeriodItem { issueId: string; description: string; severity: number; count?: number }
interface FrictionWoWItem { description: string; change: number }
interface WinPeriodItem { winId: string; label: string; count: number }
interface BestWinsWeek { week: string; winsCount: number; wins: string[] }
interface AdminSettings { hourlyCost: number; totalTeachers: number; adoptionFactor: number }

interface ActionLogEntry {
  id: string;
  date: string;
  week: string;
  title: string;
  description: string;
  type: "workshop" | "webinar" | "coaching" | "policy" | "other";
}

interface Goal {
  healthTarget: number;
  frictionTarget: number;
  confidenceTarget: number;
  winsTarget: number;
  targetDate: string;
}

interface FilterTab {
  id: string;
  label: string;
}

interface DashboardTabsProps {
  scores: NSMScores;
  insights: TeacherInsight[];
  trends: Array<{ week: string; nsm: number }>;
  frictionBreakdown: Array<{ category: string; avgSeverity: number; percentReporting: number }>;
  confidenceBreakdown: Array<{ week: string; colleagues: number; parents: number; administrators: number }>;
  winsTrend: Array<{ week: string; winsCount: number }>;
  lastWeek: TimeScopedMetrics;
  wow: WoWMetrics | null;
  cumulative: TimeScopedMetrics;
  streak: number;
  topImproved: { description: string; improvement: number } | null;
  lastWeekFriction: FrictionPeriodItem[];
  wowFriction: FrictionWoWItem[];
  cumulativeFriction: FrictionPeriodItem[];
  lastWeekWins: WinPeriodItem[];
  cumulativeWins: WinPeriodItem[];
  bestWinsWeek: BestWinsWeek | null;
  frictionCount: number;
  winsCount: number;
  surveyCount: number;
  avgSeverity: number;
  avgConfidenceRating: number;
  settings: AdminSettings;
  onSettingChange: (key: "hourlyCost" | "adoptionFactor" | "totalTeachers", value: string) => void;
  onExportCSV: () => void;
  rawSurveyResponses: Array<{ issueId: string; hoursSpent?: number; timestamp: string }>;
  activeFilter?: string;
  filterTabs?: FilterTab[];
  onFilterChange?: (id: string) => void;
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const UPCOMING_EVENTS = [
  {
    id: "e1", date: "2026-04-10", time: "3:00 PM CT", title: "CQ Foundations: Building Cultural Bridges",
    type: "webinar" as const, duration: "90 min", speaker: "Dr. Sarah Chen, CQ Specialist",
    description: "An introductory deep-dive into the three pillars of Cultural Intelligence and how they apply to daily staff interactions in K-12 environments.",
    topics: ["Friction reduction", "Cross-cultural communication", "CQ basics"],
    seatsLeft: 12, totalSeats: 50, relevantFor: ["friction", "health"],
  },
  {
    id: "e2", date: "2026-04-17", time: "9:00 AM CT", title: "Managing Classroom & Staff Friction",
    type: "workshop" as const, duration: "Half Day (3 hrs)", speaker: "Marcus Williams, CQ Coach",
    description: "Hands-on workshop using real friction scenarios from school environments. Participants leave with a personal friction-reduction action plan.",
    topics: ["Friction hotspots", "De-escalation", "Expectation alignment"],
    seatsLeft: 6, totalSeats: 25, relevantFor: ["friction"],
  },
  {
    id: "e3", date: "2026-04-24", time: "4:00 PM CT", title: "Building CQ Confidence Across Groups",
    type: "webinar" as const, duration: "60 min", speaker: "Priya Nair, M.Ed.",
    description: "Evidence-based strategies for building confidence when working across cultural differences with colleagues, parents, and administrators.",
    topics: ["Confidence building", "Cross-group communication", "Peer practice"],
    seatsLeft: 28, totalSeats: 75, relevantFor: ["confidence"],
  },
  {
    id: "e5", date: "2026-05-08", time: "9:00 AM CT", title: "CQ Wins Recognition Workshop",
    type: "workshop" as const, duration: "2 hrs", speaker: "Janelle Park, Culture Strategist",
    description: "Build a culture of recognition around CQ behaviors. Learn how to spot, celebrate, and amplify wins across your staff.",
    topics: ["Recognition culture", "CQ wins", "Staff engagement"],
    seatsLeft: 14, totalSeats: 30, relevantFor: ["wins"],
  },
];

const BENCHMARKS = {
  national: { nsm: 62, frictionScore: 48, confidenceScore: 71, cqWinsScore: 55 },
  topQuartile: { nsm: 80, frictionScore: 28, confidenceScore: 85, cqWinsScore: 78 },
  labels: { nsm: "CQ Health", frictionScore: "Friction", confidenceScore: "Confidence", cqWinsScore: "CQ Wins" },
};

const ACTION_LOG_KEY = "cq-action-log";
const GOALS_KEY = "cq-goals";

const DEFAULT_GOALS: Goal = {
  healthTarget: 75,
  frictionTarget: 30,
  confidenceTarget: 80,
  winsTarget: 70,
  targetDate: "2026-06-30",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ChangeIndicator({ value, suffix = "", invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  const isPositive = invert ? value < 0 : value > 0;
  const isNeutral = value === 0;
  const displayValue = Math.abs(value);
  if (isNeutral) return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Minus className="h-3 w-3" /> 0{suffix}</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isPositive ? "text-emerald-500" : "text-destructive"}`}>
      {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {displayValue}{suffix}
    </span>
  );
}

function HealthRing({ score }: { score: number }) {
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Excellent" : score >= 50 ? "Needs Attention" : "At Risk";
  const size = 160, stroke = 12, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-4xl font-bold tabular-nums" style={{ color }}>{score}</span>
          <span className="text-xs text-muted-foreground tracking-wide">out of 100</span>
        </div>
      </div>
      <Badge style={{ backgroundColor: `${color}20`, color, borderColor: `${color}40`, border: "1px solid" }} className="text-xs font-semibold">{label}</Badge>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, action }: { icon: React.ElementType; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4">
      <div className="flex items-start gap-2.5">
        <Icon className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
        <div>
          <h3 className="font-sans text-base font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function getPercentile(score: number, metric: keyof typeof BENCHMARKS.national): number {
  const national = BENCHMARKS.national[metric];
  const top = BENCHMARKS.topQuartile[metric];
  const isLowerBetter = metric === "frictionScore";
  if (isLowerBetter) {
    if (score <= top) return 95;
    if (score <= national) return 70;
    if (score <= national * 1.3) return 40;
    return 20;
  }
  if (score >= top) return 95;
  if (score >= national) return 70;
  if (score >= national * 0.8) return 40;
  return 20;
}

function getRecommendations(scores: NSMScores, avgSeverity: number, avgConfidenceRating: number) {
  const recs: Array<{ priority: "critical" | "high" | "medium"; type: "workshop" | "webinar" | "coaching"; title: string; description: string; duration: string; audience: string; trigger: string }> = [];
  if (scores.nsm < 50) recs.push({ priority: "critical", type: "workshop", title: "CQ Foundations Intensive", description: "Full-day immersive workshop addressing critical gaps in cultural intelligence across all three dimensions.", duration: "Full Day (6 hrs)", audience: "All Staff", trigger: `CQ Health Score is ${scores.nsm} — below the critical threshold of 50` });
  if (scores.frictionScore > 60) recs.push({ priority: "critical", type: "coaching", title: "Team Friction Reduction Coaching", description: "Targeted coaching sessions to identify friction hotspots and equip team leads with conflict navigation frameworks.", duration: "3 × 90-min sessions", audience: "Team Leads & Department Heads", trigger: `Friction score is ${scores.frictionScore} — elevated above 60` });
  if (scores.confidenceScore < 70) recs.push({ priority: "high", type: "webinar", title: "Building CQ Confidence Across Groups", description: "Live interactive webinar covering evidence-based strategies for building confidence when working across cultural differences.", duration: "90 minutes", audience: "All Teaching Staff", trigger: `Confidence score is ${scores.confidenceScore} — below recommended 70` });
  if (avgConfidenceRating < 3) recs.push({ priority: "high", type: "webinar", title: "CQ in Practice: Quick Wins for Educators", description: "Fast-paced webinar on applying CQ strategies immediately in classroom and staff interactions.", duration: "60 minutes", audience: "New & Mid-Career Teachers", trigger: `Average confidence rating is ${avgConfidenceRating.toFixed(1)} — below 3.0` });
  if (scores.cqWinsScore < 40) recs.push({ priority: "medium", type: "webinar", title: "Recognizing & Celebrating CQ Wins", description: "Webinar focused on building a culture of recognition around cultural intelligence behaviors.", duration: "45 minutes", audience: "All Staff", trigger: `CQ Wins score is ${scores.cqWinsScore} — opportunity to boost engagement` });
  return recs;
}

function generateInsights(scores: NSMScores, trends: DashboardTabsProps["trends"], cumulative: TimeScopedMetrics, frictionCount: number, winsCount: number): string[] {
  const insights: string[] = [];
  if (trends.length >= 3) {
    const recent = trends[trends.length - 1]?.nsm ?? 0;
    const older = trends[trends.length - 3]?.nsm ?? 0;
    const change = recent - older;
    if (change > 5) insights.push(`CQ Health has improved by ${change} points over the last 3 reporting periods — momentum is building.`);
    else if (change < -5) insights.push(`CQ Health has declined by ${Math.abs(change)} points over the last 3 reporting periods — consider a targeted intervention.`);
  }
  if (scores.turnoverRisk > 20) insights.push(`Turnover risk is elevated at ${scores.turnoverRisk}%. High-friction environments correlate with 2.3× higher attrition — early intervention is recommended.`);
  else if (scores.turnoverRisk <= 10) insights.push(`Turnover risk is low at ${scores.turnoverRisk}% — staff satisfaction indicators are healthy.`);
  if (winsCount > frictionCount * 1.5) insights.push(`CQ Wins are outpacing friction reports by ${((winsCount / Math.max(frictionCount, 1)) * 100).toFixed(0)}% — staff are actively applying CQ strategies.`);
  else if (frictionCount > winsCount * 2) insights.push(`Friction reports significantly outnumber CQ Wins. Reinforce wins recognition to shift culture toward positive reporting behaviors.`);
  if (scores.confidenceScore >= 80) insights.push(`Confidence is strong at ${scores.confidenceScore}% — staff feel equipped to navigate cross-cultural interactions.`);
  else if (scores.confidenceScore < 60) insights.push(`Confidence score of ${scores.confidenceScore}% signals staff may need more practical tools and guided practice opportunities.`);
  if (cumulative.moneySaved > 1000) insights.push(`CQ investment has yielded an estimated $${cumulative.moneySaved.toFixed(0)} in recovered productivity this school year.`);
  if (insights.length === 0) insights.push("Continue collecting survey data to unlock personalized executive insights and trend analysis.");
  return insights;
}

const priorityConfig = {
  critical: { label: "Critical", bg: "bg-destructive/5", border: "border-destructive/30", text: "text-destructive", badge: "bg-destructive/10 text-destructive border-destructive/30 border" },
  high: { label: "High Priority", bg: "bg-amber-500/5", border: "border-amber-500/30", text: "text-amber-600", badge: "bg-amber-500/10 text-amber-600 border-amber-500/30 border" },
  medium: { label: "Recommended", bg: "bg-primary/5", border: "border-primary/20", text: "text-primary", badge: "bg-primary/10 text-primary border-primary/20 border" },
} as const;

const typeConfig = {
  workshop: { icon: GraduationCap, label: "Workshop" },
  webinar: { icon: Video, label: "Webinar" },
  coaching: { icon: Users, label: "Coaching" },
} as const;

const actionTypeColors = {
  workshop: "text-primary bg-primary/10",
  webinar: "text-accent bg-accent/10",
  coaching: "text-emerald-500 bg-emerald-500/10",
  policy: "text-purple-500 bg-purple-500/10",
  other: "text-muted-foreground bg-muted",
};

// ─── Executive Report Generator ──────────────────────────────────────────────

function generateReport(props: DashboardTabsProps, schoolName: string) {
  const { scores, cumulative, lastWeek, frictionCount, winsCount, surveyCount, settings, avgSeverity, avgConfidenceRating, insights, trends } = props;
  const surveyPct = Math.min(100, Math.round((surveyCount / (settings.totalTeachers || 1)) * 100));
  const execInsights = generateInsights(scores, trends, cumulative, frictionCount, winsCount);
  const healthColor = scores.nsm >= 75 ? "#10b981" : scores.nsm >= 50 ? "#f59e0b" : "#ef4444";

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>CQ Executive Report — ${schoolName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 32px; }
    .title { font-size: 28px; font-weight: 800; color: #1a1a2e; }
    .subtitle { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .date { font-size: 12px; color: #9ca3af; text-align: right; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .kpi { background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; }
    .kpi-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; }
    .kpi-value { font-size: 32px; font-weight: 800; }
    .kpi-sub { font-size: 11px; color: #9ca3af; margin-top: 4px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
    .roi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .roi-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; text-align: center; }
    .roi-value { font-size: 28px; font-weight: 800; color: #059669; }
    .roi-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .insight { display: flex; gap: 12px; padding: 12px; background: #f5f3ff; border-radius: 8px; margin-bottom: 8px; }
    .insight-dot { width: 8px; height: 8px; border-radius: 50%; background: #6366f1; margin-top: 4px; flex-shrink: 0; }
    .insight-text { font-size: 13px; line-height: 1.5; color: #374151; }
    .table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .table th { background: #f9fafb; padding: 8px 12px; text-align: left; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    .table td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-green { background: #d1fae5; color: #059669; }
    .badge-blue { background: #dbeafe; color: #2563eb; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">CQ Executive Report</div>
      <div class="subtitle">${schoolName} — Cultural Intelligence Health Summary</div>
    </div>
    <div class="date">Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}<br/>Confidential — For Leadership Use</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">CQ Health Score</div>
      <div class="kpi-value" style="color:${healthColor}">${scores.nsm}</div>
      <div class="kpi-sub">out of 100</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Avg Friction</div>
      <div class="kpi-value" style="color:#ef4444">${avgSeverity > 0 ? avgSeverity.toFixed(1) : "N/A"}</div>
      <div class="kpi-sub">out of 5</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Avg Confidence</div>
      <div class="kpi-value" style="color:#6366f1">${avgConfidenceRating > 0 ? avgConfidenceRating.toFixed(1) : "N/A"}</div>
      <div class="kpi-sub">out of 5</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Survey Completion</div>
      <div class="kpi-value" style="color:#6366f1">${surveyPct}%</div>
      <div class="kpi-sub">${surveyCount} of ${settings.totalTeachers} staff</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ROI Impact — School Year to Date</div>
    <div class="roi-grid">
      <div class="roi-card">
        <div class="roi-value">${cumulative.issuesReported}</div>
        <div class="roi-label">Issues Addressed</div>
      </div>
      <div class="roi-card">
        <div class="roi-value">${cumulative.hoursSaved} hrs</div>
        <div class="roi-label">Staff Hours Recovered</div>
      </div>
      <div class="roi-card">
        <div class="roi-value">$${cumulative.moneySaved.toFixed(0)}</div>
        <div class="roi-label">Estimated Value Generated</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Executive Insights</div>
    ${execInsights.map(i => `<div class="insight"><div class="insight-dot"></div><div class="insight-text">${i}</div></div>`).join("")}
  </div>

  ${insights.length > 0 ? `
  <div class="section">
    <div class="section-title">Top Friction Issues & Predicted Impact</div>
    <table class="table">
      <thead><tr><th>Issue</th><th>Severity</th><th>CQ Lesson</th><th>Friction Reduction</th><th>$ Saved/wk</th></tr></thead>
      <tbody>
        ${insights.slice(0, 5).map(i => `
        <tr>
          <td>${i.issueDescription}</td>
          <td><span class="badge ${i.severityAvg >= 4 ? "badge-red" : "badge-blue"}">${i.severityAvg}</span></td>
          <td style="color:#6366f1;font-weight:600">${i.cqLessonName}</td>
          <td><span class="badge badge-green">${i.predictedFrictionReduction}%</span></td>
          <td style="font-weight:700">$${i.predictedMoneySaved.toFixed(0)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <div class="footer">
    <span>CQ for Schools — Confidential Executive Report</span>
    <span>Powered by Cultural Intelligence data analytics</span>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useActionLog() {
  const [log, setLog] = useState<ActionLogEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(ACTION_LOG_KEY) ?? "[]"); } catch { return []; }
  });
  const save = (entries: ActionLogEntry[]) => {
    setLog(entries);
    localStorage.setItem(ACTION_LOG_KEY, JSON.stringify(entries));
  };
  const add = (entry: Omit<ActionLogEntry, "id">) => save([...log, { ...entry, id: crypto.randomUUID() }]);
  const remove = (id: string) => save(log.filter(e => e.id !== id));
  return { log, add, remove };
}

function useGoals() {
  const [goals, setGoals] = useState<Goal>(() => {
    try { return { ...DEFAULT_GOALS, ...JSON.parse(localStorage.getItem(GOALS_KEY) ?? "{}") }; } catch { return DEFAULT_GOALS; }
  });
  const save = (g: Goal) => { setGoals(g); localStorage.setItem(GOALS_KEY, JSON.stringify(g)); };
  return { goals, save };
}

// ─── Upcoming Events ──────────────────────────────────────────────────────────

function UpcomingEventsSection({ scores }: { scores: NSMScores }) {
  const today = new Date();
  const future = UPCOMING_EVENTS.filter(e => new Date(e.date) >= today);

  const isRelevant = (e: typeof UPCOMING_EVENTS[0]) => {
    return (
      (e.relevantFor.includes("friction") && scores.frictionScore > 50) ||
      (e.relevantFor.includes("confidence") && scores.confidenceScore < 75) ||
      (e.relevantFor.includes("wins") && scores.cqWinsScore < 50) ||
      (e.relevantFor.includes("health") && scores.nsm < 65)
    );
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-4">
      <SectionHeader icon={CalendarCheck} title="Upcoming Webinars & Workshops" subtitle="Live sessions you can register for — recommended based on your school's data" />
      {future.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No upcoming events scheduled. Check back soon.</p>
      ) : (
        <div className="space-y-3">
          {future.map(event => {
            const rec = isRelevant(event);
            const TypeIcon = event.type === "webinar" ? Video : GraduationCap;
            const seatsPercent = (event.seatsLeft / event.totalSeats) * 100;
            const low = event.seatsLeft <= 10;
            return (
              <div key={event.id} className={`group rounded-xl border p-5 transition-all duration-200 hover:shadow-lg ${rec ? "border-primary/40 bg-gradient-to-r from-primary/5 to-background" : "border-border/60 bg-card"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${rec ? "bg-primary/10" : "bg-muted"}`}>
                      <TypeIcon className={`h-5 w-5 ${rec ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-base">{event.title}</p>
                        {rec && <Badge className="bg-primary/10 text-primary border-primary/20 border text-xs">Recommended for you</Badge>}
                        {low && <Badge className="bg-destructive/10 text-destructive border-destructive/20 border text-xs">Only {event.seatsLeft} seats left</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{fmt(event.date)} at {event.time}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.duration}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.speaker}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{event.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {event.topics.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <Button size="sm" className={`gap-1.5 ${rec ? "" : "variant-outline"}`} variant={rec ? "default" : "outline"}>
                      Register <ArrowRight className="h-3 w-3" />
                    </Button>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{event.seatsLeft} / {event.totalSeats} seats</p>
                      <Progress value={seatsPercent} className={`h-1 w-20 mt-1 ${low ? "[&>div]:bg-destructive" : ""}`} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Issues This Week ────────────────────────────────────────────────────────

type IssueSignal = {
  issueId: string;
  description: string;
  urgency: number;
  count: number;
  severityAvg: number;
  hoursAvg: number;
  change: number | null;
  reasons: string[];
  tags: Array<"friction" | "confidence" | "health" | "wins">;
};

type MatchedEvent = {
  event: typeof UPCOMING_EVENTS[number];
  matchedIssues: IssueSignal[];
  matchScore: number;
};

type ActionStatus = "planned" | "in_progress" | "done";

type CombinedActionItem = {
  id: string;
  kind: "recommendation" | "upcoming";
  title: string;
  description: string;
  sourceLabel: string;
  priorityLabel: string;
  priorityClass: string;
  typeLabel: string;
  typeIcon: React.ElementType;
  duration: string;
  audience: string;
  trigger: string;
  linkedIssues: IssueSignal[];
  matchScore: number;
  status: ActionStatus;
};

function getIssueTags(issueDescription: string) {
  const text = issueDescription.toLowerCase();
  const tags: IssueSignal["tags"] = [];

  if (/(role|responsibil|leadership expectation|mixed messaging|unclear|clarity|handoff|deadline|follow-up|delayed response)/.test(text)) {
    tags.push("friction", "health");
  }
  if (/(misunderstand|cultural|joke|norm|meeting|communication)/.test(text)) {
    tags.push("confidence", "friction");
  }
  if (/(decision|excluded|priorit|collaboration|team)/.test(text)) {
    tags.push("health", "friction");
  }
  if (/(deadline|handoff|follow-up|delay)/.test(text)) {
    tags.push("health", "friction");
  }

  return [...new Set(tags)];
}

function getIssueSignals(insights: TeacherInsight[], lastWeekFriction: FrictionPeriodItem[], wowFriction: FrictionWoWItem[] = []): IssueSignal[] {
  const issueMap = new Map<string, IssueSignal>();
  const wowMap = new Map(wowFriction.map((item) => [item.description.toLowerCase(), item.change]));

  lastWeekFriction.forEach((item) => {
    const existing = issueMap.get(item.issueId);
    const count = item.count ?? 0;
    const signal: IssueSignal = existing ?? {
      issueId: item.issueId,
      description: item.description,
      urgency: 0,
      count: 0,
      severityAvg: 0,
      hoursAvg: 0,
      change: null,
      reasons: [],
      tags: getIssueTags(item.description),
    };

    signal.count = Math.max(signal.count, count);
    signal.urgency += count * 2;
    if (count >= 3) signal.reasons.push(`${count} reports last week`);
    const wowChange = wowMap.get(item.description.toLowerCase());
    if (wowChange != null) signal.change = wowChange;
    issueMap.set(item.issueId, signal);
  });

  insights.forEach((insight) => {
    const existing = issueMap.get(insight.issueId);
    const signal: IssueSignal = existing ?? {
      issueId: insight.issueId,
      description: insight.issueDescription,
      urgency: 0,
      count: 0,
      severityAvg: 0,
      hoursAvg: 0,
      change: wowMap.get(insight.issueDescription.toLowerCase()) ?? null,
      reasons: [],
      tags: getIssueTags(insight.issueDescription),
    };

    signal.severityAvg = Math.max(signal.severityAvg, insight.severityAvg);
    signal.hoursAvg = Math.max(signal.hoursAvg, insight.hoursAvg);
    signal.urgency += insight.severityAvg * 2 + insight.hoursAvg;
    if (insight.severityAvg >= 3.5) signal.reasons.push(`severity ${insight.severityAvg.toFixed(1)}/5`);
    if (insight.hoursAvg >= 2) signal.reasons.push(`${insight.hoursAvg.toFixed(1)} hrs per report`);
    if (insight.predictedMoneySaved >= 100) signal.reasons.push(`high productivity impact`);
    issueMap.set(insight.issueId, signal);
  });

  return [...issueMap.values()]
    .map((signal) => ({ ...signal, reasons: [...new Set(signal.reasons)] }))
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, 6);
}

function getMatchedUpcomingEvents(issueSignals: IssueSignal[]): MatchedEvent[] {
  const today = new Date();

  return UPCOMING_EVENTS
    .filter((event) => new Date(event.date) >= today)
    .map((event) => {
      const matchedIssues = issueSignals.filter((issue) =>
        event.relevantFor.some((tag) => issue.tags.includes(tag))
      );
      const matchScore = matchedIssues.reduce((sum, issue) => sum + issue.urgency, 0);
      return { event, matchedIssues, matchScore };
    })
    .filter((item) => item.matchedIssues.length > 0)
    .sort((a, b) => b.matchScore - a.matchScore || a.event.date.localeCompare(b.event.date))
    .slice(0, 4);
}

function matchRecommendationIssues(rec: { title: string; description: string; trigger: string }, issueSignals: IssueSignal[]) {
  const text = `${rec.title} ${rec.description} ${rec.trigger}`.toLowerCase();
  const wantedTags = new Set<IssueSignal["tags"][number]>();

  if (text.includes("confidence")) wantedTags.add("confidence");
  if (text.includes("friction") || text.includes("coaching") || text.includes("workshop")) wantedTags.add("friction");
  if (text.includes("leadership") || text.includes("hr") || text.includes("alignment") || text.includes("foundations")) wantedTags.add("health");
  if (text.includes("wins") || text.includes("recognition")) wantedTags.add("wins");
  if (text.includes("communication") || text.includes("cross-cultural")) wantedTags.add("confidence");

  const matches = issueSignals.filter((issue) => issue.tags.some((tag) => wantedTags.has(tag)));
  return matches.length > 0 ? matches.slice(0, 3) : issueSignals.slice(0, 2);
}

function buildCombinedActionItems(
  scores: NSMScores,
  avgSeverity: number,
  avgConfidenceRating: number,
  issueSignals: IssueSignal[],
): CombinedActionItem[] {
  const recommendedActions: CombinedActionItem[] = getRecommendations(scores, avgSeverity, avgConfidenceRating).slice(0, 4).map((rec, i) => {
    const pc = priorityConfig[rec.priority];
    const tc = typeConfig[rec.type];
    const linkedIssues = matchRecommendationIssues(rec, issueSignals);

    return {
      id: `rec-${i}-${rec.title}`,
      kind: "recommendation",
      title: rec.title,
      description: rec.description,
      sourceLabel: "Recommendation",
      priorityLabel: pc.label,
      priorityClass: pc.badge,
      typeLabel: tc.label,
      typeIcon: tc.icon,
      duration: rec.duration,
      audience: rec.audience,
      trigger: rec.trigger,
      linkedIssues,
      matchScore: linkedIssues.reduce((sum, issue) => sum + issue.urgency, 0) + (rec.priority === "critical" ? 12 : rec.priority === "high" ? 8 : 4),
      status: rec.priority === "critical" ? "in_progress" : "planned",
    };
  });

  const upcomingActions: CombinedActionItem[] = getMatchedUpcomingEvents(issueSignals).map(({ event, matchedIssues }) => ({
    id: `event-${event.id}`,
    kind: "upcoming",
    title: event.title,
    description: event.description,
    sourceLabel: "Upcoming session",
    priorityLabel: "Real session",
    priorityClass: "bg-primary/10 text-primary border-primary/20 border",
    typeLabel: event.type === "webinar" ? "Webinar" : "Workshop",
    typeIcon: event.type === "webinar" ? Video : GraduationCap,
    duration: event.duration,
    audience: event.speaker,
    trigger: matchedIssues[0]
      ? `Matched to ${matchedIssues.length} issue${matchedIssues.length !== 1 ? "s" : ""}: ${matchedIssues[0].description}`
      : "Matched to current issue patterns",
    linkedIssues: matchedIssues,
    matchScore: matchedIssues.reduce((sum, issue) => sum + issue.urgency, 0),
    status: matchedIssues.length >= 3 ? "in_progress" : "planned",
  }));

  return [...recommendedActions, ...upcomingActions].sort((a, b) => b.matchScore - a.matchScore).slice(0, 6);
}

function issueImpactLabel(issue: IssueSignal) {
  const parts = [
    issue.count > 0 ? `${issue.count} rpt${issue.count !== 1 ? "s" : ""}` : null,
    issue.severityAvg > 0 ? `sev ${issue.severityAvg.toFixed(1)}` : null,
    issue.hoursAvg > 0 ? `${issue.hoursAvg.toFixed(1)} hrs` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function IssuePrioritySummary({
  title,
  subtitle,
  issues,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  issues: IssueSignal[];
  emptyLabel: string;
}) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="pt-5 pb-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
              {emptyLabel}
            </div>
          ) : issues.map((issue) => (
            <div key={issue.issueId} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-snug">{issue.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Severity {issue.severityAvg.toFixed(1)}</Badge>
                    <Badge variant="secondary" className="text-xs">{issueImpactLabel(issue)}</Badge>
                    {issue.change != null && <ChangeIndicator value={issue.change} invert />}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">Impact</p>
                  <p className="text-sm font-semibold">{issue.urgency.toFixed(0)}</p>
                </div>
              </div>
              {issue.reasons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {issue.reasons.slice(0, 3).map((reason) => (
                    <Badge key={reason} variant="outline" className="text-xs">{reason}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CombinedRecommendationsSection({
  scores,
  avgSeverity,
  avgConfidenceRating,
  insights,
  lastWeekFriction,
  wowFriction,
}: {
  scores: NSMScores;
  avgSeverity: number;
  avgConfidenceRating: number;
  insights: TeacherInsight[];
  lastWeekFriction: FrictionPeriodItem[];
  wowFriction: FrictionWoWItem[];
}) {
  const issueSignals = getIssueSignals(insights, lastWeekFriction, wowFriction);
  const recurringIssues = issueSignals.filter((issue) => issue.count >= 3 || issue.severityAvg >= 3.5);
  const nonRecurringIssues = issueSignals.filter((issue) => !(issue.count >= 3 || issue.severityAvg >= 3.5));
  const recurringHours = recurringIssues.reduce((sum, issue) => sum + issue.hoursAvg, 0);
  const nonRecurringHours = nonRecurringIssues.reduce((sum, issue) => sum + issue.hoursAvg, 0);
  const combinedItems = buildCombinedActionItems(scores, avgSeverity, avgConfidenceRating, issueSignals);
  const [statuses, setStatuses] = useState<Record<string, ActionStatus>>({});

  useEffect(() => {
    setStatuses((current) => {
      const next: Record<string, ActionStatus> = { ...current };
      combinedItems.forEach((item) => {
        if (!next[item.id]) next[item.id] = item.status;
      });
      return next;
    });
  }, [combinedItems]);

  const cycleStatus = (id: string) => {
    setStatuses((current) => {
      const currentStatus = current[id] ?? "planned";
      const nextStatus: ActionStatus =
        currentStatus === "planned" ? "in_progress" : currentStatus === "in_progress" ? "done" : "planned";
      return { ...current, [id]: nextStatus };
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader icon={PlayCircle} title="Recurring and One-Off Issues" subtitle="Patterns and isolated incidents from staff reports" />
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-background">
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recurring Issues</p>
                <p className="text-3xl font-bold mt-2">{recurringHours.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">hrs/period</span></p>
                <p className="text-xs text-muted-foreground mt-2">{recurringIssues.length} issue{recurringIssues.length !== 1 ? "s" : ""} with repeat signals</p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-background">
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">One-Off Issues</p>
                <p className="text-3xl font-bold mt-2">{nonRecurringHours.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">hrs/period</span></p>
                <p className="text-xs text-muted-foreground mt-2">{nonRecurringIssues.length} isolated or emerging issue{nonRecurringIssues.length !== 1 ? "s" : ""}</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <IssuePrioritySummary
              title="Recurring Issues"
              subtitle="Issues that keep showing up or already have strong repetition signals"
              issues={recurringIssues.slice(0, 3)}
              emptyLabel="No recurring issues surfaced yet."
            />
            <IssuePrioritySummary
              title="Non-Recurring Issues"
              subtitle="Issues that appear more isolated or are still emerging"
              issues={nonRecurringIssues.slice(0, 3)}
              emptyLabel="No non-recurring issues surfaced yet."
            />
          </div>
          {combinedItems.map((item) => {
            const TypeIcon = item.typeIcon;
            const status = statuses[item.id] ?? item.status;
            const statusClass =
              status === "done"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border"
                : status === "in_progress"
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20 border"
                  : "bg-primary/10 text-primary border-primary/20 border";

            return (
              <div
                key={item.id}
                className={`group rounded-xl border ${item.kind === "upcoming" ? "border-primary/20 bg-gradient-to-r from-primary/5 to-background" : "border-border/60 bg-card"} p-5 transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl border ${item.kind === "upcoming" ? "border-primary/20 bg-primary/10" : "border-border/40 bg-background"}`}>
                      <TypeIcon className={`h-5 w-5 ${item.kind === "upcoming" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-base">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`text-xs ${item.priorityClass}`}>{item.priorityLabel}</Badge>
                        <Badge variant="outline" className="text-xs">{item.sourceLabel}</Badge>
                        <Badge variant="secondary" className="text-xs">{item.typeLabel}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {item.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    {item.kind === "upcoming" ? "Open Session" : "Assign"} <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.description}</p>

                <div className="grid gap-3 md:grid-cols-2 mb-3">
                  <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Why this is shown</p>
                    <p className="text-sm leading-relaxed text-foreground">{item.trigger}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Linked issues</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.linkedIssues.slice(0, 3).map((issue) => (
                        <Badge key={issue.issueId} variant="outline" className="text-xs">
                          {issue.description}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      <span>Audience: <span className="font-medium text-foreground">{item.audience}</span></span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Info className="h-3 w-3" />
                      <span>Match score {item.matchScore.toFixed(0)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${statusClass}`}>
                      {status === "done" ? "Done" : status === "in_progress" ? "In Progress" : "Planned"}
                    </Badge>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => cycleStatus(item.id)}>
                      Change status
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RecommendationsSection({
  scores,
  avgSeverity,
  avgConfidenceRating,
  insights,
  lastWeekFriction,
}: {
  scores: NSMScores;
  avgSeverity: number;
  avgConfidenceRating: number;
  insights: TeacherInsight[];
  lastWeekFriction: FrictionPeriodItem[];
}) {
  const recs = getRecommendations(scores, avgSeverity, avgConfidenceRating).slice(0, 4);
  const issueSignals = getIssueSignals(insights, lastWeekFriction);
  const matchedEvents = getMatchedUpcomingEvents(issueSignals);

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader icon={PlayCircle} title="Recommendations" subtitle="Priority interventions tailored to the current school data" />
        <div className="space-y-4">
          {recs.map((rec, i) => {
            const pc = priorityConfig[rec.priority];
            const tc = typeConfig[rec.type];
            const TypeIcon = tc.icon;

            return (
              <div key={i} className={`group rounded-xl border ${pc.border} ${pc.bg} p-5 hover:shadow-md transition-all duration-200`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${pc.border} bg-background`}>
                      <TypeIcon className={`h-5 w-5 ${pc.text}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-base">{rec.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`text-xs ${pc.badge}`}>{pc.label}</Badge>
                        <Badge variant="outline" className="text-xs">{tc.label}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {rec.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    Schedule <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{rec.description}</p>
                <div className="flex items-center justify-between text-xs gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>Audience: <span className="font-medium text-foreground">{rec.audience}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>{rec.trigger}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <SectionHeader
          icon={CalendarCheck}
          title="Upcoming Workshops & Webinars"
          subtitle="Real sessions from our list that match recurring or urgent issues from the issue detail section"
        />
        {matchedEvents.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="pt-8 pb-8 text-center">
              <p className="text-sm text-muted-foreground">No upcoming sessions match the currently surfaced issue patterns.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {matchedEvents.map(({ event, matchedIssues }) => {
              const TypeIcon = event.type === "webinar" ? Video : GraduationCap;
              const primaryIssue = matchedIssues[0];
              return (
                <div
                  key={event.id}
                  className="group rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-background p-5 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-primary/10">
                        <TypeIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold text-base">{event.title}</p>
                          <Badge className="bg-primary/10 text-primary border-primary/20 border text-xs">Recommended for your issues</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {event.time}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.duration}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.speaker}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{event.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {event.topics.map((topic) => (
                            <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
                          ))}
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Why this fits</p>
                          <p className="text-sm text-foreground leading-relaxed">
                            {primaryIssue.description}
                            {primaryIssue.reasons.length > 0 ? ` • ${primaryIssue.reasons.join(" • ")}` : ""}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {matchedIssues.slice(0, 3).map((issue) => (
                              <Badge key={issue.issueId} variant="outline" className="text-xs">
                                {issue.description}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5">
                        View Details <ArrowRight className="h-3 w-3" />
                      </Button>
                      <p className="text-xs text-muted-foreground text-right max-w-[180px]">
                        Matches {matchedIssues.length} issue{matchedIssues.length !== 1 ? "s" : ""} in the current issue detail section.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface IssuesThisWeekProps {
  lastWeekFriction: FrictionPeriodItem[];
  insights: TeacherInsight[];
}

function IssuesThisWeek({ lastWeekFriction, insights }: IssuesThisWeekProps) {
  if (lastWeekFriction.length === 0) return (
    <div>
      <SectionHeader icon={CalendarDays} title="Issues This Week" subtitle="Most reported and most time-consuming friction issues in the latest period" />
      <Card className="border-dashed border-border/60">
        <CardContent className="py-12 flex flex-col items-center text-center gap-2">
          <CalendarDays className="h-8 w-8 text-muted-foreground/30 mb-1" />
          <p className="text-sm font-medium">No reports this period</p>
          <p className="text-xs text-muted-foreground max-w-xs">Friction issues will appear here once staff submit survey responses for this period.</p>
        </CardContent>
      </Card>
    </div>
  );

  // Top by count
  const topByCount = [...lastWeekFriction]
    .filter(f => (f.count ?? 0) > 0)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 5);

  // Top by time: cross-reference issue IDs with insights.hoursAvg
  const topByTime = [...lastWeekFriction]
    .map(f => {
      const insight = insights.find(i => i.issueId === f.issueId);
      return { ...f, hoursAvg: insight?.hoursAvg ?? 0 };
    })
    .filter(f => f.hoursAvg > 0)
    .sort((a, b) => b.hoursAvg - a.hoursAvg)
    .slice(0, 5);

  const maxCount = topByCount[0]?.count ?? 1;
  const maxHrs = topByTime[0]?.hoursAvg ?? 1;

  return (
    <div>
      <SectionHeader icon={CalendarDays} title="Issues This Week" subtitle="Most reported and most time-consuming friction issues in the latest period" />
      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Reported */}
        <Card className="border-destructive/20">
          <CardContent className="pt-6 pb-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Flag className="h-3.5 w-3.5 text-destructive" /> Most Reported
            </p>
            {topByCount.length > 0 ? (
              <div className="space-y-4">
                {topByCount.map((f, i) => {
                  const pct = Math.round(((f.count ?? 0) / maxCount) * 100);
                  return (
                    <div key={f.issueId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground/60 w-4 shrink-0 tabular-nums">{i + 1}</span>
                          <span className="text-sm font-medium truncate">{f.description}</span>
                        </div>
                        <span className="text-sm font-bold ml-3 shrink-0 text-destructive">{f.count}×</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-destructive/60 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No issues reported this period.</p>
            )}
          </CardContent>
        </Card>

        {/* Most Time Spent */}
        <Card className="border-amber-500/20">
          <CardContent className="pt-6 pb-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-amber-500" /> Most Time Spent
            </p>
            {topByTime.length > 0 ? (
              <div className="space-y-4">
                {topByTime.map((f, i) => {
                  const pct = Math.round((f.hoursAvg / maxHrs) * 100);
                  return (
                    <div key={f.issueId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground/60 w-4 shrink-0 tabular-nums">{i + 1}</span>
                          <span className="text-sm font-medium truncate">{f.description}</span>
                        </div>
                        <span className="text-sm font-bold ml-3 shrink-0 text-amber-600">{f.hoursAvg} hrs</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500/60 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No time data yet for this period.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Issue Timeline ───────────────────────────────────────────────────────────

const TIMELINE_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

const INTERVENTION_ICONS: Record<ActionLogEntry["type"], string> = {
  workshop: "🎓",
  webinar: "📺",
  coaching: "🧑‍💼",
  policy: "📋",
  other: "📌",
};

interface IssueTimelineProps {
  rawSurveyResponses: Array<{ issueId: string; hoursSpent?: number; timestamp: string }>;
  actionLog: ActionLogEntry[];
}

function IssueTimeline({ rawSurveyResponses, actionLog }: IssueTimelineProps) {
  const [view, setView] = useState<"week" | "month">("week");

  if (rawSurveyResponses.length === 0) return null;

  const hasHours = rawSurveyResponses.some(r => (r.hoursSpent ?? 0) > 0);
  // Fall back to report count when no hours data exists
  const workingResponses = hasHours
    ? rawSurveyResponses.filter(r => (r.hoursSpent ?? 0) > 0)
    : rawSurveyResponses;

  // Find top 5 issues by total hours (or count when no hours)
  const totalByIssue: Record<string, number> = {};
  workingResponses.forEach(r => {
    totalByIssue[r.issueId] = (totalByIssue[r.issueId] ?? 0) + (hasHours ? (r.hoursSpent ?? 0) : 1);
  });
  const topIssueIds = Object.entries(totalByIssue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  // Label lookup
  const issueLabel = (id: string) => {
    const found = FRICTION_ISSUES.find(f => f.id === id);
    if (!found) return id;
    return found.description.length > 32 ? found.description.slice(0, 30) + "…" : found.description;
  };

  // Period helpers — consistent between data grouping and action log matching
  const getPeriodKey = (timestamp: string) =>
    view === "week" ? timestamp.slice(0, 10) : timestamp.slice(0, 7);

  const formatPeriodLabel = (key: string) =>
    view === "week"
      ? new Date(key).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : new Date(key + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" });

  // Build { period → { issueId → totalHours (or count) } }
  const byPeriod: Record<string, Record<string, number>> = {};
  workingResponses.forEach(r => {
    if (!topIssueIds.includes(r.issueId)) return;
    const key = getPeriodKey(r.timestamp);
    if (!byPeriod[key]) byPeriod[key] = {};
    byPeriod[key][r.issueId] = (byPeriod[key][r.issueId] ?? 0) + (hasHours ? (r.hoursSpent ?? 0) : 1);
  });

  const timelineData = Object.entries(byPeriod)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, issueHours]) => {
      const row: Record<string, string | number> = { label: formatPeriodLabel(key), _key: key };
      topIssueIds.forEach(id => { row[id] = Math.round((issueHours[id] ?? 0) * 10) / 10; });
      return row;
    });

  if (timelineData.length === 0) return null;

  // Map action log entries to the period labels that appear in timelineData.
  // Each entry's `week` is a full date — match by period prefix.
  const interventionsByLabel: Record<string, ActionLogEntry[]> = {};
  actionLog.forEach(entry => {
    const periodKey = getPeriodKey(entry.week);
    const match = timelineData.find(d => d._key === periodKey);
    if (!match) return;
    const lbl = match.label as string;
    if (!interventionsByLabel[lbl]) interventionsByLabel[lbl] = [];
    interventionsByLabel[lbl].push(entry);
  });

  // Compute per-period totals to detect if hours dropped after an intervention
  const periodTotals = timelineData.map(d =>
    topIssueIds.reduce((s, id) => s + ((d[id] as number) ?? 0), 0)
  );

  // Reference line color: green if next period is lower, neutral otherwise
  const refLineColor = (label: string) => {
    const idx = timelineData.findIndex(d => d.label === label);
    if (idx < 0 || idx >= timelineData.length - 1) return "hsl(var(--primary))";
    return periodTotals[idx + 1] < periodTotals[idx]
      ? "#10b981"   // green — hours dropped after intervention
      : "hsl(var(--primary))";
  };

  const unit = hasHours ? " hrs" : " reports";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
    const interventions = interventionsByLabel[label] ?? [];
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-xl text-xs max-w-[240px]">
        <p className="font-semibold mb-2">{label}</p>
        {[...payload].reverse().map((p: any) => p.value > 0 && (
          <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.fill }} />
              <span className="text-muted-foreground truncate max-w-[140px]">{issueLabel(p.dataKey)}</span>
            </span>
            <span className="font-semibold shrink-0">{p.value}{unit}</span>
          </div>
        ))}
        <div className="border-t border-border/50 mt-2 pt-2 flex justify-between font-semibold">
          <span>Total</span><span>{Math.round(total * 10) / 10}{unit}</span>
        </div>
        {interventions.length > 0 && (
          <div className="border-t border-border/50 mt-2 pt-2 space-y-1">
            {interventions.map(e => (
              <div key={e.id} className="flex items-start gap-1.5">
                <span>{INTERVENTION_ICONS[e.type]}</span>
                <span className="text-primary font-medium leading-tight">{e.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const hasInterventions = Object.keys(interventionsByLabel).length > 0;

  return (
    <div>
      <SectionHeader
        icon={Activity}
        title="Issue Timeline"
        subtitle={hasHours ? "Hours spent per friction issue — interventions marked with a dashed line" : "Reports per friction issue over time — interventions marked with a dashed line"}
        action={
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              Monthly
            </button>
          </div>
        }
      />
      <Card className="border-border/50">
        <CardContent className="pt-6 pb-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={timelineData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--border))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--border))" unit={unit} width={52} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
              <Legend
                formatter={(value) => <span className="text-xs text-foreground">{issueLabel(value)}</span>}
                wrapperStyle={{ paddingTop: 16 }}
              />
              {topIssueIds.map((id, i) => (
                <Bar key={id} dataKey={id} stackId="hours" fill={TIMELINE_COLORS[i % TIMELINE_COLORS.length]} radius={i === topIssueIds.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
              {Object.keys(interventionsByLabel).map(label => (
                <ReferenceLine
                  key={label}
                  x={label}
                  stroke={refLineColor(label)}
                  strokeDasharray="5 3"
                  strokeWidth={2}
                  label={{ value: interventionsByLabel[label].map(e => INTERVENTION_ICONS[e.type]).join(" "), position: "top", fontSize: 13 }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          {hasInterventions && (
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 pt-3 border-t border-border/40">
              {(["workshop", "webinar", "coaching", "policy", "other"] as ActionLogEntry["type"][])
                .filter(t => actionLog.some(e => e.type === t))
                .map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                    {INTERVENTION_ICONS[t]} {t}
                    <span className="ml-1 text-emerald-500 font-medium">— green line = hours dropped after</span>
                  </span>
                )).slice(0, 1)}
              <span className="text-xs text-muted-foreground">Dashed lines = logged interventions. <span className="text-emerald-500 font-medium">Green</span> = hours dropped the next period.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Time Spent on Friction ───────────────────────────────────────────────────

const FRICTION_BAR_COLORS = ["#1a7a7a", "#2a9d8f", "#38b2ac", "#4db8b8", "#0d5c5c", "#52c7c7"];

interface TimeSpentProps {
  insights: TeacherInsight[];
  frictionCount: number;
  winsCount: number;
}

function TimeSpentOnFriction({ insights, frictionCount, winsCount }: TimeSpentProps) {
  // Total hours = sum of (hoursAvg × count of responses per issue)
  // We use hoursAvg as the per-report estimate; frictionCount is total friction reports
  const issuesWithHours = insights.filter(i => i.hoursAvg > 0);
  const totalHours = Math.round(issuesWithHours.reduce((s, i) => s + i.hoursAvg, 0) * 10) / 10;
  const avgHrsPerIssue = issuesWithHours.length > 0
    ? Math.round((totalHours / issuesWithHours.length) * 10) / 10
    : 0;

  // Top issues sorted by hours descending
  const topByTime = [...insights]
    .filter(i => i.hoursAvg > 0)
    .sort((a, b) => b.hoursAvg - a.hoursAvg)
    .slice(0, 5);

  const maxHrs = topByTime[0]?.hoursAvg ?? 1;

  return (
    <div>
      <SectionHeader
        icon={Clock}
        title="Time Spent on Friction"
        subtitle="Staff hours consumed by friction issues this period, based on survey reports"
      />

      {/* Summary row */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-background">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-destructive/10"><Clock className="h-4 w-4 text-destructive" /></div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Hrs Reported</p>
            </div>
            <p className="text-3xl font-bold">{totalHours > 0 ? totalHours : "—"}<span className="text-sm font-normal text-muted-foreground"> hrs</span></p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-background">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10"><AlertTriangle className="h-4 w-4 text-amber-500" /></div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Hrs / Issue</p>
            </div>
            <p className="text-3xl font-bold">{avgHrsPerIssue > 0 ? avgHrsPerIssue : "—"}<span className="text-sm font-normal text-muted-foreground"> hrs</span></p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-primary/10"><Flag className="h-4 w-4 text-primary" /></div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Friction Issues</p>
            </div>
            <p className="text-3xl font-bold">{frictionCount}<span className="text-sm font-normal text-muted-foreground"> reports</span></p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-background">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/10"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CQ Wins</p>
            </div>
            <p className="text-3xl font-bold">{winsCount}<span className="text-sm font-normal text-muted-foreground"> reported</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Top issues by time */}
      {topByTime.length > 0 ? (
        <Card className="border-border/50">
          <CardContent className="pt-6 pb-5">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">Top Issues by Time Spent</p>
            <div className="space-y-4">
              {topByTime.map((f, i) => {
                const pct = Math.round((f.hoursAvg / maxHrs) * 100);
                const color = FRICTION_BAR_COLORS[i % FRICTION_BAR_COLORS.length];
                return (
                  <div key={f.issueId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground/60 w-4 shrink-0 tabular-nums">{i + 1}</span>
                        <span className="text-sm font-medium truncate">{f.issueDescription}</span>
                      </div>
                      <span className="text-sm font-bold ml-3 shrink-0" style={{ color }}>{f.hoursAvg} hrs</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-12 flex flex-col items-center text-center gap-2">
            <Clock className="h-8 w-8 text-muted-foreground/30 mb-1" />
            <p className="text-sm font-medium">No time data yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">Staff will report hours spent per issue when submitting friction surveys.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Cultural Friction Breakdown ─────────────────────────────────────────────

// Interaction type labels from survey issueId prefixes or context field
// These are reference patterns — the heatmap below is illustrative of cultural dimensions
// until full cultural-dimension tagging is added to the survey
const CULTURAL_FRICTION_SAMPLE = {
  rows: [
    { interaction: "Teacher ↔ Teacher", short: "T↔T", powerDistance: 12, riskTolerance: 8, communicationStyle: 34, decisionSpeed: 18 },
    { interaction: "Teacher ↔ Parents", short: "T↔P", powerDistance: 5, riskTolerance: 3, communicationStyle: 41, decisionSpeed: 11 },
    { interaction: "Teacher ↔ Admin",   short: "T↔A", powerDistance: 38, riskTolerance: 9, communicationStyle: 22, decisionSpeed: 29 },
  ],
  drivers: [
    { rank: 1, dimension: "Communication Style", interaction: "T↔Parents", pct: 41, description: "Teachers and parents differ in how directly they communicate. Consider a parent communication norms workshop." },
    { rank: 2, dimension: "Power Distance",       interaction: "T↔Admin",   pct: 38, description: "Hierarchy expectations differ between teachers and leadership. A shared decision-making protocol session is recommended." },
    { rank: 3, dimension: "Decision Speed",       interaction: "T↔Admin",   pct: 29, description: "Decision-making pace is misaligned between staff and admin. A planning alignment session could reduce this friction." },
  ],
};

function heatColor(pct: number) {
  if (pct >= 35) return { bg: "bg-destructive/80", text: "text-white" };
  if (pct >= 20) return { bg: "bg-amber-400/80", text: "text-white" };
  if (pct >= 10) return { bg: "bg-amber-200/70", text: "text-amber-900" };
  return { bg: "bg-muted/40", text: "text-muted-foreground" };
}

function CulturalFrictionBreakdown({ insights }: { insights: TeacherInsight[] }) {
  const { rows, drivers } = CULTURAL_FRICTION_SAMPLE;
  const cols: { key: keyof typeof rows[0]; label: string }[] = [
    { key: "powerDistance", label: "Power Distance" },
    { key: "riskTolerance", label: "Risk Tolerance" },
    { key: "communicationStyle", label: "Comm. Style" },
    { key: "decisionSpeed", label: "Decision Speed" },
  ];

  // Build per-issue time chart from real data
  const issueTimeData = insights
    .filter(i => i.hoursAvg > 0)
    .sort((a, b) => b.hoursAvg - a.hoursAvg)
    .slice(0, 6)
    .map(i => ({ name: i.issueDescription.length > 30 ? i.issueDescription.slice(0, 28) + "…" : i.issueDescription, hours: i.hoursAvg }));

  return (
    <div>
      <SectionHeader
        icon={BarChart2}
        title="Cultural Friction Breakdown"
        subtitle="Where cultural differences are creating friction — and how much time each issue takes"
      />

      {/* Time per issue bar chart — real data */}
      {issueTimeData.length > 0 && (
        <Card className="mb-6 border-border/50">
          <CardContent className="pt-6 pb-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Avg Hours Spent per Friction Issue</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={issueTimeData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--border))" unit=" hrs" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
                <RechartsTooltip
                  formatter={(v: number) => [`${v} hrs/report`, "Avg Time"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                />
                <Bar dataKey="hours" fill="#1a7a7a" opacity={0.8} radius={[0, 4, 4, 0]} name="Avg hrs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Cultural dimension heatmap */}
      <Card className="mb-4 overflow-hidden">
        <CardContent className="pt-5 pb-5">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Cultural Dimension Hotspots by Interaction Type</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-xs text-muted-foreground font-medium pb-3 pr-4 w-40">Interaction</th>
                  {cols.map(c => (
                    <th key={c.key} className="text-center text-xs font-semibold uppercase tracking-wider pb-3 px-3">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="space-y-2">
                {rows.map(row => (
                  <tr key={row.short}>
                    <td className="pr-4 py-2">
                      <span className="text-sm font-medium text-foreground">{row.interaction}</span>
                    </td>
                    {cols.map(c => {
                      const val = row[c.key] as number;
                      const { bg, text } = heatColor(val);
                      return (
                        <td key={c.key} className="px-3 py-2 text-center">
                          <div className={`inline-flex items-center justify-center rounded-lg w-14 h-9 font-bold text-sm ${bg} ${text}`}>
                            {val}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground font-medium">Intensity:</p>
            {[
              { label: "Low (< 10%)", bg: "bg-muted/40", text: "text-muted-foreground" },
              { label: "Moderate (10–20%)", bg: "bg-amber-200/70", text: "text-amber-900" },
              { label: "High (20–35%)", bg: "bg-amber-400/80", text: "text-white" },
              { label: "Hotspot (≥ 35%)", bg: "bg-destructive/80", text: "text-white" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded ${l.bg}`} />
                <span className="text-xs text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top clash drivers */}
      <div className="space-y-3">
        {drivers.map(d => {
          const priorityStyle = d.rank === 1
            ? "border-destructive/30 bg-destructive/5"
            : d.rank === 2
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-primary/20 bg-primary/5";
          const badgeStyle = d.rank === 1
            ? "bg-destructive/10 text-destructive border-destructive/30 border"
            : d.rank === 2
            ? "bg-amber-500/10 text-amber-600 border-amber-500/30 border"
            : "bg-primary/10 text-primary border-primary/20 border";

          return (
            <div key={d.rank} className={`flex items-start gap-4 p-4 rounded-xl border ${priorityStyle}`}>
              <div className="shrink-0 w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold">
                {d.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm">{d.dimension} mismatch</span>
                  <Badge className={`text-xs ${badgeStyle}`}>{d.interaction}</Badge>
                  <span className="text-xs text-muted-foreground font-medium">{d.pct}% of incidents</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Executive Summary ───────────────────────────────────────────────────

function ExecutiveSummaryTab(props: DashboardTabsProps & { schoolName: string; onPrintReport: () => void; actionLog: ActionLogEntry[] }) {
  const { insights, frictionCount, winsCount, surveyCount, settings, rawSurveyResponses, lastWeekFriction, wowFriction, actionLog, scores, avgSeverity, avgConfidenceRating } = props;

  return (
    <div className="space-y-8 pt-2">

      {/* Issues This Week */}
      <IssuesThisWeek lastWeekFriction={lastWeekFriction} insights={insights} />

      {/* Issue Timeline */}
      <IssueTimeline rawSurveyResponses={rawSurveyResponses} actionLog={actionLog} />

      {/* Recommendations */}
      <CombinedRecommendationsSection
        scores={scores}
        avgSeverity={avgSeverity}
        avgConfidenceRating={avgConfidenceRating}
        insights={insights}
        lastWeekFriction={lastWeekFriction}
        wowFriction={wowFriction}
      />

    </div>
  );
}

// ─── Tab: Trends ──────────────────────────────────────────────────────────────

function TrendsTab({ trends, frictionBreakdown, confidenceBreakdown, winsTrend, lastWeek, wow, actionLog }: Pick<DashboardTabsProps, "trends" | "frictionBreakdown" | "confidenceBreakdown" | "winsTrend" | "lastWeek" | "wow"> & { actionLog: ActionLogEntry[] }) {
  const noData = trends.length === 0 && frictionBreakdown.length === 0 && confidenceBreakdown.length === 0 && winsTrend.length === 0;
  const chartCfg = { grid: { stroke: "hsl(var(--border))", strokeDasharray: "3 3" } as const, axis: { tick: { fontSize: 11 }, stroke: "hsl(var(--border))" } as const };

  // Build action log week markers
  const logWeeks = new Set(actionLog.map(e => e.week));

  if (noData) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BarChart2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <p className="text-lg font-semibold">No trend data yet</p>
      <p className="text-sm text-muted-foreground">Collect 2+ weeks of survey data to see trends.</p>
    </div>
  );

  const ActionTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    const entries = actionLog.filter(e => e.week === label);
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-xl text-xs max-w-[220px]">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any) => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
        {entries.length > 0 && <div className="mt-2 pt-2 border-t border-border/50 space-y-1">{entries.map(e => <p key={e.id} className="text-primary font-medium">📌 {e.title}</p>)}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <SectionHeader icon={Activity} title="Metric Timeline" subtitle="Track all four core metrics over time. 📌 marks indicate logged interventions." />

      <div className="grid gap-6 md:grid-cols-2">
        {trends.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-primary" /> CQ Health Score</span>
                {trends.length >= 2 && <ChangeIndicator value={(trends[trends.length - 1]?.nsm ?? 0) - (trends[trends.length - 2]?.nsm ?? 0)} />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trends}>
                  <defs><linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid {...chartCfg.grid} />
                  <XAxis dataKey="week" {...chartCfg.axis} />
                  <YAxis domain={[0, 100]} {...chartCfg.axis} />
                  <RechartsTooltip content={<ActionTooltip />} />
                  {[...logWeeks].map(w => <ReferenceLine key={w} x={w} stroke="hsl(var(--primary))" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: "📌", position: "top", fontSize: 10 }} />)}
                  <Area type="monotone" dataKey="nsm" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#healthGrad)" name="CQ Health" dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {frictionBreakdown.length > 0 && (
          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-destructive" /> Friction by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={frictionBreakdown} barGap={2}>
                  <defs>
                    <linearGradient id="frGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.9} /><stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} /></linearGradient>
                    <linearGradient id="frGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} /></linearGradient>
                  </defs>
                  <CartesianGrid {...chartCfg.grid} />
                  <XAxis dataKey="category" tick={{ fontSize: 9 }} angle={-12} textAnchor="end" height={55} />
                  <YAxis {...chartCfg.axis} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="avgSeverity" fill="url(#frGrad)" radius={[4, 4, 0, 0]} name="Avg Severity" />
                  <Bar dataKey="percentReporting" fill="url(#frGrad2)" radius={[4, 4, 0, 0]} name="% Reporting" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {confidenceBreakdown.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-primary" /> Confidence Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={confidenceBreakdown}>
                  <CartesianGrid {...chartCfg.grid} />
                  <XAxis dataKey="week" {...chartCfg.axis} />
                  <YAxis domain={[1, 5]} {...chartCfg.axis} />
                  <RechartsTooltip content={<ActionTooltip />} />
                  {[...logWeeks].map(w => <ReferenceLine key={w} x={w} stroke="hsl(var(--primary))" strokeDasharray="4 2" strokeWidth={1.5} />)}
                  <Legend iconType="circle" iconSize={8} />
                  <Line type="monotone" dataKey="colleagues" stroke="hsl(var(--primary))" strokeWidth={2.5} name="Colleagues" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="parents" stroke="hsl(var(--accent))" strokeWidth={2.5} name="Parents" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="administrators" stroke="#8b5cf6" strokeWidth={2.5} name="Administrators" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {winsTrend.length > 0 && (
          <Card className="border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-accent" /> CQ Wins Over Time</span>
                {winsTrend.length >= 2 && <ChangeIndicator value={(winsTrend[winsTrend.length - 1]?.winsCount ?? 0) - (winsTrend[winsTrend.length - 2]?.winsCount ?? 0)} />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={winsTrend}>
                  <defs><linearGradient id="winsGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid {...chartCfg.grid} />
                  <XAxis dataKey="week" {...chartCfg.axis} />
                  <YAxis {...chartCfg.axis} />
                  <RechartsTooltip content={<ActionTooltip />} />
                  {[...logWeeks].map(w => <ReferenceLine key={w} x={w} stroke="hsl(var(--accent))" strokeDasharray="4 2" strokeWidth={1.5} />)}
                  <Area type="monotone" dataKey="winsCount" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#winsGrad)" name="CQ Wins" dot={{ r: 4, fill: "hsl(var(--accent))" }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Period comparison */}
      <div>
        <SectionHeader icon={CalendarDays} title="Period Comparison" subtitle="Last week vs. week-over-week change" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: TrendingDown, label: "Issues", color: "destructive" },
            { icon: Clock, label: "Hours Saved", color: "primary" },
            { icon: DollarSign, label: "Money Saved", color: "emerald-500" },
          ].map(({ icon: Icon, label, color }) => (
            <Card key={label} className={`border-${color}/20`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3"><Icon className={`h-4 w-4 text-${color}`} /><p className="text-sm font-medium text-muted-foreground">{label}</p></div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Last Week</p>
                    <p className="text-2xl font-bold">{label === "Issues" ? lastWeek.issuesReported : label === "Hours Saved" ? lastWeek.hoursSaved : `$${lastWeek.moneySaved.toFixed(0)}`}</p>
                  </div>
                  {wow && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">vs Prior Week</p>
                      <ChangeIndicator value={label === "Issues" ? wow.issuesChange : label === "Hours Saved" ? wow.hoursChange : wow.moneyChange} invert={label === "Issues"} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Insights ────────────────────────────────────────────────────────────

function InsightsTab({ scores, insights, trends, lastWeekFriction, wowFriction, cumulativeFriction, lastWeekWins, cumulativeWins, bestWinsWeek, frictionCount, winsCount, cumulative, actionLog, onAddLog, onRemoveLog, trendWeeks }: Pick<DashboardTabsProps, "scores" | "insights" | "trends" | "lastWeekFriction" | "wowFriction" | "cumulativeFriction" | "lastWeekWins" | "cumulativeWins" | "bestWinsWeek" | "frictionCount" | "winsCount" | "cumulative"> & { actionLog: ActionLogEntry[]; onAddLog: (e: Omit<ActionLogEntry, "id">) => void; onRemoveLog: (id: string) => void; trendWeeks: string[] }) {
  const execInsights = generateInsights(scores, trends, cumulative, frictionCount, winsCount);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), week: trendWeeks[trendWeeks.length - 1] ?? "", title: "", description: "", type: "webinar" as ActionLogEntry["type"] });

  const submit = () => {
    if (!form.title.trim()) return;
    onAddLog(form);
    setForm({ date: new Date().toISOString().slice(0, 10), week: trendWeeks[trendWeeks.length - 1] ?? "", title: "", description: "", type: "webinar" });
    setShowForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Executive Insights */}
      <div>
        <SectionHeader icon={Lightbulb} title="Executive Insights" subtitle="Data-driven observations for HR and leadership" />
        <div className="grid gap-3 md:grid-cols-2">
          {execInsights.map((insight, i) => (
            <div key={i} className="group flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors"><Zap className="h-4 w-4 text-primary" /></div>
              <p className="text-sm leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Log */}
      <div>
        <SectionHeader
          icon={CalendarCheck}
          title="Action Log"
          subtitle="Log interventions to see their impact on trend charts"
          action={
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowForm(v => !v)}>
              <PlusCircle className="h-4 w-4" /> Log Action
            </Button>
          }
        />

        {showForm && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="pt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Title</Label>
                  <Input className="mt-1.5" placeholder="e.g. Ran CQ Foundations webinar" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as ActionLogEntry["type"] }))}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="coaching">Coaching</SelectItem>
                      <SelectItem value="policy">Policy Change</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Date</Label>
                  <Input type="date" className="mt-1.5" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Mark on Chart (Week)</Label>
                  <Select value={form.week} onValueChange={v => setForm(f => ({ ...f, week: v }))} disabled={trendWeeks.length === 0}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder={trendWeeks.length === 0 ? "No trend data yet" : "Select week"} />
                    </SelectTrigger>
                    <SelectContent>
                      {trendWeeks.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Notes (optional)</Label>
                <Textarea className="mt-1.5 resize-none" rows={2} placeholder="Any additional context..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={submit} disabled={!form.title.trim()}>Save Entry</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {actionLog.length === 0 ? (
          <div className="flex flex-col items-center text-center py-10 gap-2 border border-dashed border-border/60 rounded-xl">
            <CalendarCheck className="h-7 w-7 text-muted-foreground/30 mb-1" />
            <p className="text-sm font-medium text-foreground">No actions logged</p>
            <p className="text-xs text-muted-foreground max-w-xs">Log a webinar, workshop, or coaching session to see it marked on trend charts and measure its impact.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {actionLog.slice().reverse().map(entry => (
              <div key={entry.id} className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/20 transition-colors group">
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${actionTypeColors[entry.type]}`}>
                  <Flag className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{entry.title}</p>
                    <Badge variant="secondary" className="text-xs capitalize">{entry.type}</Badge>
                    {entry.week && <span className="text-xs text-muted-foreground">→ chart week: {entry.week}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.date}</p>
                  {entry.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{entry.description}</p>}
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0" onClick={() => onRemoveLog(entry.id)} aria-label="Remove entry">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Friction */}
      <div>
        <SectionHeader icon={AlertTriangle} title="Friction Analysis" subtitle="Top issues by time period" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Last Week", items: lastWeekFriction, isWow: false, hasCounts: false, empty: "No issues last week" },
            { title: "Week-over-Week", items: wowFriction as any[], isWow: true, hasCounts: false, empty: "Need 2+ weeks of data" },
            { title: "School Year", items: cumulativeFriction, isWow: false, hasCounts: true, empty: "No data yet" },
          ].map(({ title, items, isWow, hasCounts, empty }) => (
            <Card key={title} className="border-destructive/15">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />{title}</CardTitle></CardHeader>
              <CardContent>
                {items.length > 0 ? (
                  <div className="space-y-2.5">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between gap-2 group">
                        <span className="text-sm truncate flex-1 text-muted-foreground group-hover:text-foreground transition-colors">{item.description}</span>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {isWow ? <ChangeIndicator value={item.change} invert /> : <><Badge variant="secondary" className="text-xs">{item.severity}</Badge>{hasCounts && item.count && <span className="text-xs text-muted-foreground">×{item.count}</span>}</>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground text-center py-4">{empty}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CQ Wins */}
      <div>
        <SectionHeader icon={Trophy} title="CQ Wins" subtitle="Positive cultural intelligence behaviors reported" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Last Week", icon: Star, items: lastWeekWins, isWow: false },
            { title: "Best Week Ever", icon: Trophy, items: bestWinsWeek ? bestWinsWeek.wins.map((w, i) => ({ winId: String(i), label: w, count: 1 })) : [], isBest: true },
            { title: "School Year", icon: Star, items: cumulativeWins, isWow: false },
          ].map(({ title, icon: Icon, items, isBest }) => (
            <Card key={title} className="border-accent/20">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-accent" />{title}</CardTitle></CardHeader>
              <CardContent>
                {isBest && bestWinsWeek ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 border">{bestWinsWeek.winsCount} wins</Badge>
                      <span className="text-xs text-muted-foreground">{bestWinsWeek.week}</span>
                    </div>
                    <div className="space-y-1.5">{bestWinsWeek.wins.map((w, i) => <div key={i} className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /><p className="text-xs text-muted-foreground">{w}</p></div>)}</div>
                  </div>
                ) : items.length > 0 ? (
                  <div className="space-y-2.5">
                    {items.map((item: any) => (
                      <div key={item.winId} className="flex items-center justify-between gap-2">
                        <span className="text-sm truncate flex-1 text-muted-foreground">{item.label}</span>
                        <Badge className="shrink-0 bg-accent/10 text-accent border-accent/20 border text-xs">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detail Table */}
      {insights.length > 0 && (
        <div>
          <SectionHeader icon={BarChart2} title="Friction Issues Detail" subtitle="Predictive impact of addressing each friction point" />
          <Card>
            <CardContent className="overflow-x-auto pt-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-xs">Issue</TableHead>
                    <TableHead className="text-center text-xs">Severity</TableHead>
                    <TableHead className="text-center text-xs">Hrs Avg</TableHead>
                    <TableHead className="text-xs">CQ Lesson</TableHead>
                    <TableHead className="text-center text-xs">Friction Reduction</TableHead>
                    <TableHead className="text-center text-xs">Hrs Saved</TableHead>
                    <TableHead className="text-right text-xs">$ Saved/wk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insights.map(i => (
                    <TableRow key={i.issueId} className="border-border/30 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-sm">{i.issueDescription}</TableCell>
                      <TableCell className="text-center"><Badge variant={i.severityAvg >= 4 ? "destructive" : "secondary"} className="text-xs">{i.severityAvg}</Badge></TableCell>
                      <TableCell className="text-center text-sm">{i.hoursAvg}</TableCell>
                      <TableCell className="text-sm text-primary font-medium">{i.cqLessonName}</TableCell>
                      <TableCell className="text-center"><span className="text-xs font-semibold text-emerald-500">{i.predictedFrictionReduction}%</span></TableCell>
                      <TableCell className="text-center text-sm">{i.predictedHoursSaved}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">${i.predictedMoneySaved.toFixed(0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Actions ─────────────────────────────────────────────────────────────

function ActionsTab({ scores, avgSeverity, avgConfidenceRating }: Pick<DashboardTabsProps, "scores" | "avgSeverity" | "avgConfidenceRating">) {
  const recs = getRecommendations(scores, avgSeverity, avgConfidenceRating);
  return (
    <div className="space-y-10">
      <UpcomingEventsSection scores={scores} />

      <div>
        <SectionHeader icon={PlayCircle} title="Personalized Recommendations" subtitle="Programs selected based on your school's current data" />
        <div className="space-y-4">
          {recs.map((rec, i) => {
            const pc = priorityConfig[rec.priority];
            const tc = typeConfig[rec.type];
            const TypeIcon = tc.icon;
            return (
              <div key={i} className={`group rounded-xl border ${pc.border} ${pc.bg} p-5 hover:shadow-md transition-all duration-200`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${pc.border} bg-background`}><TypeIcon className={`h-5 w-5 ${pc.text}`} /></div>
                    <div>
                      <p className="font-semibold text-base">{rec.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${pc.badge}`}>{pc.label}</Badge>
                        <Badge variant="outline" className="text-xs">{tc.label}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {rec.duration}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    Schedule <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{rec.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3 w-3" /><span>Audience: <span className="font-medium text-foreground">{rec.audience}</span></span></div>
                  <div className="flex items-center gap-1.5 text-muted-foreground"><Info className="h-3 w-3" /><span>{rec.trigger}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <SectionHeader icon={BookOpen} title="Friction → CQ Lesson Mapping" subtitle="Recommended learning paths for each friction pattern" />
        <Card>
          <CardContent className="overflow-x-auto pt-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-xs">Friction Issue</TableHead>
                  <TableHead className="text-xs">Recommended CQ Lesson</TableHead>
                  <TableHead className="text-xs">Coaching Tip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FRICTION_ISSUES.map((fi, i) => {
                  const mapping = LESSON_MAPPINGS.find(lm => lm.frictionId === fi.id);
                  return (
                    <TableRow key={i} className="border-border/30 hover:bg-muted/30 transition-colors">
                      <TableCell className="text-sm">{fi.description}</TableCell>
                      <TableCell><span className="text-sm text-primary font-medium">{mapping?.cqLessonName ?? "—"}</span></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[320px] leading-relaxed">{mapping?.tip ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Tab: Progress ────────────────────────────────────────────────────────────

function ProgressTab({ scores, lastWeek, wow, cumulative, streak, bestWinsWeek, settings, onSettingChange, onExportCSV, surveyCount, frictionCount, winsCount }: Pick<DashboardTabsProps, "scores" | "lastWeek" | "wow" | "cumulative" | "streak" | "bestWinsWeek" | "settings" | "onSettingChange" | "onExportCSV" | "surveyCount" | "frictionCount" | "winsCount">) {
  const { goals, save: saveGoals } = useGoals();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goals);
  const surveyPct = Math.min(100, Math.round((surveyCount / (settings.totalTeachers || 1)) * 100));

  const goalMetrics = [
    { label: "CQ Health Score", key: "healthTarget" as const, current: scores.nsm, target: goals.healthTarget, color: "primary", higher: true },
    { label: "Friction Score", key: "frictionTarget" as const, current: scores.frictionScore, target: goals.frictionTarget, color: "destructive", higher: false },
    { label: "Confidence Score", key: "confidenceTarget" as const, current: scores.confidenceScore, target: goals.confidenceTarget, color: "primary", higher: true },
    { label: "CQ Wins Score", key: "winsTarget" as const, current: scores.cqWinsScore, target: goals.winsTarget, color: "accent", higher: true },
  ];

  const milestones = [
    { label: "First Survey Submitted", done: surveyCount > 0, detail: `${surveyCount} surveys collected` },
    { label: "25% Staff Participation", done: surveyPct >= 25, detail: `Currently ${surveyPct}%` },
    { label: "50% Staff Participation", done: surveyPct >= 50, detail: `Currently ${surveyPct}%` },
    { label: "CQ Health Score Above 50", done: scores.nsm >= 50, detail: `Currently ${scores.nsm}` },
    { label: "CQ Health Score Above 75", done: scores.nsm >= 75, detail: `Currently ${scores.nsm}` },
    { label: "3-Week Reporting Streak", done: streak >= 3, detail: `Current streak: ${streak} week${streak !== 1 ? "s" : ""}` },
    { label: "10+ CQ Wins Reported", done: winsCount >= 10, detail: `${winsCount} wins logged` },
    { label: "Friction Score Below 40", done: scores.frictionScore < 40, detail: `Currently ${scores.frictionScore}` },
  ];

  return (
    <div className="space-y-8">
      {/* Goal Tracker */}
      <div>
        <SectionHeader
          icon={Flag}
          title="Goal Tracker"
          subtitle={`Targets set for ${goals.targetDate}`}
          action={
            editing ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { saveGoals(draft); setEditing(false); }}>Save Goals</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setDraft(goals); setEditing(true); }}>
                <Edit3 className="h-3.5 w-3.5" /> Edit Goals
              </Button>
            )
          }
        />

        {editing && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="pt-5">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {goalMetrics.map(({ label, key }) => (
                  <div key={key}>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label} Target</Label>
                    <Input type="number" min={0} max={100} className="mt-1.5" value={draft[key]} onChange={e => setDraft(d => ({ ...d, [key]: parseInt(e.target.value) || 0 }))} />
                  </div>
                ))}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Target Date</Label>
                  <Input type="date" className="mt-1.5" value={draft.targetDate} onChange={e => setDraft(d => ({ ...d, targetDate: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {goalMetrics.map(({ label, key, current, target, color, higher }) => {
            const achieved = higher ? current >= target : current <= target;
            const progress = higher
              ? Math.min(100, Math.round((current / Math.max(target, 1)) * 100))
              : Math.min(100, Math.round(((target - current + target) / Math.max(target, 1)) * 100));
            const gap = higher ? target - current : current - target;
            return (
              <Card key={key} className={`border-${color}/20 ${achieved ? "border-emerald-500/30 bg-emerald-500/5" : ""}`}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">{label}</p>
                    {achieved
                      ? <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border text-xs">Goal Reached</Badge>
                      : <Badge variant="secondary" className="text-xs">{gap > 0 ? `${gap} to go` : "On track"}</Badge>
                    }
                  </div>
                  <div className="flex items-end gap-3 mb-3">
                    <p className={`text-3xl font-bold text-${achieved ? "emerald-500" : color}`}>{current}</p>
                    <p className="text-sm text-muted-foreground mb-1">/ target: <strong>{target}</strong></p>
                  </div>
                  <Progress value={Math.min(progress, 100)} className={`h-2 ${achieved ? "[&>div]:bg-emerald-500" : ""}`} />
                  <p className="text-xs text-muted-foreground mt-2">
                    {achieved ? "Target achieved!" : higher ? `${gap} points below target` : `${gap} points above target (lower is better)`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Milestones */}
      <div>
        <SectionHeader icon={Trophy} title="Progress Milestones" subtitle="Track your school's CQ journey" />
        <div className="grid gap-3 md:grid-cols-2">
          {milestones.map((m, i) => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${m.done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50 bg-muted/20"}`}>
              <div className={`p-2 rounded-lg shrink-0 ${m.done ? "bg-emerald-500/10" : "bg-muted"}`}>
                {m.done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${m.done ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.detail}</p>
              </div>
              {m.done && <Badge className="shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border text-xs">Achieved</Badge>}
            </div>
          ))}
        </div>
      </div>

      {/* Cumulative */}
      <div>
        <SectionHeader icon={CalendarDays} title="School Year Totals" subtitle="Cumulative impact since program start" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: AlertTriangle, label: "Issues Addressed", value: `${cumulative.issuesReported}`, color: "destructive" },
            { icon: Clock, label: "Hours Recovered", value: `${cumulative.hoursSaved} hrs`, color: "primary" },
            { icon: DollarSign, label: "Value Generated", value: `$${cumulative.moneySaved.toFixed(0)}`, color: "emerald-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className={`border-${color}/20`}>
              <CardContent className="pt-6 pb-5 text-center">
                <div className={`p-3 rounded-xl bg-${color}/10 w-fit mx-auto mb-3`}><Icon className={`h-6 w-6 text-${color}`} /></div>
                <p className={`text-4xl font-bold text-${color}`}>{value}</p>
                <p className="text-sm text-muted-foreground mt-2">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Best Week */}
      {bestWinsWeek && (
        <div>
          <SectionHeader icon={Star} title="Best CQ Wins Week" subtitle="Your school's peak performance period" />
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-background">
            <CardContent className="pt-6 pb-5">
              <div className="flex items-start gap-6">
                <div className="text-center shrink-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Week of</p>
                  <p className="text-base font-bold">{bestWinsWeek.week}</p>
                  <Badge className="mt-2 bg-amber-500/10 text-amber-600 border-amber-500/30 border">{bestWinsWeek.winsCount} wins</Badge>
                </div>
                <div className="border-l border-border/50 pl-6 flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Wins Reported</p>
                  <div className="grid grid-cols-2 gap-2">
                    {bestWinsWeek.wins.map((w, i) => (
                      <div key={i} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /><span className="text-sm text-muted-foreground">{w}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings + Export */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4" /> Impact Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "hourlyCost" as const, label: "Hourly Cost ($)", min: 0, max: undefined },
              { key: "totalTeachers" as const, label: "Total Staff", min: 1, max: undefined },
              { key: "adoptionFactor" as const, label: "Adoption Factor (%)", min: 0, max: 100 },
            ].map(({ key, label, min, max }) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
                <Input type="number" min={min} max={max} className="mt-1.5" value={key === "totalTeachers" ? settings[key] || 50 : settings[key]} onChange={e => onSettingChange(key, e.target.value)} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Download className="h-4 w-4" /> Export & Reports</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Export a full impact report with friction issues, predicted savings, and recommended CQ lessons.</p>
            <Button onClick={onExportCSV} className="w-full gap-2" variant="outline"><Download className="h-4 w-4" /> Export CQ Impact Report (CSV)</Button>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground">Report includes {frictionCount} friction reports, {winsCount} CQ wins, and predictive ROI projections.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardTabs(props: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState("executive");
  const { log: actionLog, add: addLog, remove: removeLog } = useActionLog();
  const trendWeeks = props.trends.map(t => t.week);
  const schoolName = "Your School"; // passed from context if needed

  const handlePrintReport = () => generateReport(props, schoolName);

  const { activeFilter, filterTabs, onFilterChange } = props;

  return (
    <div className="mt-0">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="executive" className="mt-0">
          <ExecutiveSummaryTab {...props} schoolName={schoolName} onPrintReport={handlePrintReport} actionLog={actionLog} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
