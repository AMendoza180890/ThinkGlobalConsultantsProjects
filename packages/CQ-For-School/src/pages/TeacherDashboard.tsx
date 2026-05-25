import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getLatestNSMScores,
  getSurveyResponses,
  getConfidenceEntries,
  getWinsEntries,
  getReflections,
  calculateInsights,
  getWeeklyTrends,
  getLastWeekMetrics,
  getWoWChange,
  getCumulativeMetrics,
  getReportingStreak,
  getTopImprovedIssue,
  getLastWeekTopFriction,
  getWoWFrictionChange,
  getCumulativeTopFriction,
  getLastWeekTopWins,
  getCumulativeTopWins,
  getBestWinsWeek,
  type TopFrictionItem,
  type TopWinItem,
} from "@/lib/data";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  BookOpen, TrendingUp, Shield, Sparkles, AlertTriangle, Clock, DollarSign,
  TrendingDown, Flame, ArrowUp, ArrowDown, Minus, Award, Trophy, Star,
} from "lucide-react";

function ScoreCard({
  label, value, icon: Icon, color, description,
}: {
  label: string; value: number; icon: React.ElementType; color: string; description: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
        <Progress value={value} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </CardContent>
    </Card>
  );
}

function ChangeIndicator({ value, suffix = "", invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  // invert: for issues, fewer = better so negative change is good
  const isPositive = invert ? value < 0 : value > 0;
  const isNeutral = value === 0;
  const displayValue = Math.abs(value);

  if (isNeutral) return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="h-3 w-3" /> 0{suffix}
    </span>
  );

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isPositive ? "text-primary" : "text-destructive"}`}>
      {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {displayValue}{suffix}
    </span>
  );
}

export default function TeacherDashboard() {
  const scores = useMemo(getLatestNSMScores, []);
  const responses = useMemo(getSurveyResponses, []);
  const confidenceEntries = useMemo(getConfidenceEntries, []);
  const winsEntries = useMemo(getWinsEntries, []);
  const reflections = useMemo(getReflections, []);
  const insights = useMemo(calculateInsights, []);
  const trends = useMemo(getWeeklyTrends, []);
  const lastWeek = useMemo(getLastWeekMetrics, []);
  const wow = useMemo(getWoWChange, []);
  const cumulative = useMemo(getCumulativeMetrics, []);
  const streak = useMemo(getReportingStreak, []);
  const topImproved = useMemo(getTopImprovedIssue, []);
  const lastWeekFriction = useMemo(getLastWeekTopFriction, []);
  const wowFriction = useMemo(getWoWFrictionChange, []);
  const cumulativeFriction = useMemo(getCumulativeTopFriction, []);
  const lastWeekWins = useMemo(getLastWeekTopWins, []);
  const cumulativeWins = useMemo(getCumulativeTopWins, []);
  const bestWinsWeek = useMemo(getBestWinsWeek, []);

  const hasData = responses.length > 0 || confidenceEntries.length > 0 || winsEntries.length > 0;

  if (!hasData) {
    return (
      <div className="container max-w-3xl py-16 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-sans text-2xl font-semibold mb-2">No data yet</h1>
        <p className="text-muted-foreground">Complete your first weekly survey to see insights here.</p>
      </div>
    );
  }

  const riskColor = scores.turnoverRisk > 20 ? "text-destructive" : scores.turnoverRisk > 10 ? "text-accent" : "text-primary";

  const chartData = insights.slice(0, 5).map((i) => ({
    name: i.issueDescription.length > 20 ? i.issueDescription.slice(0, 20) + "…" : i.issueDescription,
    "Hours Saved": i.predictedHoursSaved,
    "$ Saved": i.predictedMoneySaved,
  }));

  return (
    <div className="container max-w-6xl py-10">
      <h1 className="font-sans text-3xl font-semibold mb-2">My Dashboard</h1>
      <p className="text-muted-foreground mb-8">Your CQ pulse scores and trends</p>

      {/* CQ Health Score Hero */}
      <Card className="mb-8 border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">North Star Metric</p>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="10"
                    strokeDasharray={`${(scores.nsm / 100) * 327} 327`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-3xl font-bold">{scores.nsm}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Higher = lower risk</p>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Friction</p>
                <p className="text-xl font-bold">{scores.frictionScore}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-xl font-bold">{scores.confidenceScore}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">CQ Wins</p>
                <p className="text-xl font-bold">{scores.cqWinsScore}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Burnout Risk</p>
                <p className={`text-xl font-bold ${riskColor}`}>{scores.turnoverRisk}%</p>
                {scores.turnoverRisk > 20 && <AlertTriangle className="h-4 w-4 text-destructive mx-auto mt-1" />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <ScoreCard
          label="Friction Score"
          value={scores.frictionScore}
          icon={AlertTriangle}
          color="bg-destructive/10 text-destructive"
          description="Lower is better. Based on weighted challenge severity."
        />
        <ScoreCard
          label="Confidence Score"
          value={scores.confidenceScore}
          icon={Shield}
          color="bg-primary/10 text-primary"
          description="Higher is better. Weighted across colleagues, parents, admins."
        />
        <ScoreCard
          label="CQ Wins Score"
          value={scores.cqWinsScore}
          icon={Sparkles}
          color="bg-accent/10 text-accent"
          description="Higher is better. Techniques applied this week."
        />
      </div>

      {/* CQ Health Trend */}
      {trends.length > 1 && (
        <Card className="mb-8">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> CQ Health Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="nsm" stroke="hsl(var(--primary))" strokeWidth={2.5} name="CQ Health Score" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="turnoverRisk" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" name="Burnout Risk %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* CQ Issues Section */}
      <h2 className="font-sans text-2xl font-semibold mb-6">CQ Issues</h2>

      {/* Streak + Top Improved */}
      <div className="flex flex-wrap gap-4 mb-6">
        {streak > 0 && (
          <Card className="flex-1 min-w-[200px]">
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/10">
                <Flame className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reporting Streak</p>
                <p className="text-xl font-bold">{streak} week{streak !== 1 ? "s" : ""}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {topImproved && (
          <Card className="flex-1 min-w-[200px]">
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Improved Issue</p>
                <p className="text-sm font-semibold">{topImproved.description}</p>
                <p className="text-xs text-primary font-medium">↓ {topImproved.improvement} severity</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Three Time-Scoped Views */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {/* Last Week */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Last Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Issues</span>
              </div>
              <span className="text-lg font-bold">{lastWeek.issuesReported}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Hrs Saved</span>
              </div>
              <span className="text-lg font-bold">{lastWeek.hoursSaved}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">$ Saved</span>
              </div>
              <span className="text-lg font-bold">${lastWeek.moneySaved.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Week-over-Week Change */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Week-over-Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {wow ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Issues</span>
                  </div>
                  <ChangeIndicator value={wow.issuesChange} invert />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Hrs Saved</span>
                  </div>
                  <ChangeIndicator value={wow.hoursChange} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">$ Saved</span>
                  </div>
                  <ChangeIndicator value={wow.moneyChange} suffix="" />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Need 2+ weeks of data</p>
            )}
          </CardContent>
        </Card>

        {/* Cumulative School Year */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">School Year Total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Issues</span>
              </div>
              <span className="text-lg font-bold">{cumulative.issuesReported}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Hrs Saved</span>
              </div>
              <span className="text-lg font-bold">{cumulative.hoursSaved}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">$ Saved</span>
              </div>
              <span className="text-lg font-bold">${cumulative.moneySaved.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Friction Issues by Period */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Top Issues — Last Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastWeekFriction.length > 0 ? (
              <div className="space-y-2">
                {lastWeekFriction.map((item) => (
                  <div key={item.issueId} className="flex items-center justify-between gap-2">
                    <span className="text-sm truncate flex-1">{item.description}</span>
                    <Badge variant="secondary" className="shrink-0">{item.severity}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No issues last week 🎉</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Issues — Week-over-Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wowFriction.length > 0 ? (
              <div className="space-y-2">
                {wowFriction.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <span className="text-sm truncate flex-1">{item.description}</span>
                    <ChangeIndicator value={item.change} invert />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Need 2+ weeks of data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Top Issues — School Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cumulativeFriction.length > 0 ? (
              <div className="space-y-2">
                {cumulativeFriction.map((item) => (
                  <div key={item.issueId} className="flex items-center justify-between gap-2">
                    <span className="text-sm truncate flex-1">{item.description}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary">{item.severity}</Badge>
                      <span className="text-xs text-muted-foreground">×{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top CQ Wins by Period */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" /> Top Wins — Last Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastWeekWins.length > 0 ? (
              <div className="space-y-2">
                {lastWeekWins.map((item) => (
                  <div key={item.winId} className="flex items-center justify-between gap-2">
                    <span className="text-sm truncate flex-1">{item.label}</span>
                    <Badge className="shrink-0 bg-accent text-accent-foreground">{item.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No wins reported</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" /> Best CQ Wins Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestWinsWeek ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-accent text-accent-foreground">{bestWinsWeek.winsCount} wins</Badge>
                  <span className="text-xs text-muted-foreground">{bestWinsWeek.week}</span>
                </div>
                <div className="space-y-1">
                  {bestWinsWeek.wins.map((w, i) => (
                    <p key={i} className="text-xs text-muted-foreground">✓ {w}</p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No wins data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" /> Top Wins — School Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cumulativeWins.length > 0 ? (
              <div className="space-y-2">
                {cumulativeWins.map((item) => (
                  <div key={item.winId} className="flex items-center justify-between gap-2">
                    <span className="text-sm truncate flex-1">{item.label}</span>
                    <Badge className="shrink-0 bg-accent text-accent-foreground">{item.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Impact Chart */}
      {chartData.length > 0 && (
        <Card className="mb-8">
          <CardHeader><CardTitle>Predicted Impact by Issue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Hours Saved" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="$ Saved" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Friction Issues Table */}
      {insights.length > 0 && (
        <Card className="mb-8">
          <CardHeader><CardTitle>Top Friction Issues &amp; CQ Lessons</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead className="text-center">Severity</TableHead>
                  <TableHead className="text-center">Hrs/wk</TableHead>
                  <TableHead>CQ Lesson</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="text-center">Friction Reduction</TableHead>
                  <TableHead className="text-center">Hrs Saved</TableHead>
                  <TableHead className="text-right">$ Saved/wk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.map((i) => (
                  <TableRow key={i.issueId}>
                    <TableCell className="font-medium max-w-[160px]">{i.issueDescription}</TableCell>
                    <TableCell className="text-center">{i.severityAvg}</TableCell>
                    <TableCell className="text-center">{i.hoursAvg}</TableCell>
                    <TableCell className="text-sm text-primary font-medium max-w-[160px]">{i.cqLessonName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">{i.tip}</TableCell>
                    <TableCell className="text-center">{i.predictedFrictionReduction}%</TableCell>
                    <TableCell className="text-center">{i.predictedHoursSaved}</TableCell>
                    <TableCell className="text-right">${i.predictedMoneySaved.toFixed(0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* CQ Lessons */}
      <Card>
        <CardHeader><CardTitle>CQ Lessons Received</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.filter((i) => i.cqLessonName !== "—").map((i) => (
              <div key={i.issueId} className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">{i.cqLessonName}</p>
                  <p className="text-xs text-muted-foreground">{i.issueDescription}</p>
                  {reflections[i.issueId] !== undefined && (
                    <p className="text-xs mt-1">
                      {reflections[i.issueId] ? "✅ Tried this tip" : "⏳ Haven't tried yet"}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {insights.filter((i) => i.cqLessonName !== "—").length === 0 && (
              <p className="text-sm text-muted-foreground">No lessons received yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
