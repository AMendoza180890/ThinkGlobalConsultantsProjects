import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CohortFilter, useCohortFilter } from "@/components/CohortFilter";
import { WASC_DOMAINS, type DomainRiskAssessment } from "@/lib/accreditation";
import { TrendingUp, TrendingDown, Minus, Award, AlertTriangle, Lightbulb, Crown } from "lucide-react";

// Generate mock cohort averages based on selected cohort (seeded by cohort string)
function generateCohortScores(cohort: string): Record<string, number> {
  let seed = 0;
  for (let i = 0; i < cohort.length; i++) seed += cohort.charCodeAt(i);
  const scores: Record<string, number> = {};
  WASC_DOMAINS.forEach((d, idx) => {
    const base = 45 + ((seed * (idx + 1) * 7) % 30);
    scores[d.id] = Math.min(95, Math.max(30, base));
  });
  return scores;
}

function getPercentile(yourScore: number, cohortScore: number): number {
  const diff = yourScore - cohortScore;
  return Math.min(99, Math.max(1, 50 + Math.round(diff * 1.5)));
}

interface Props {
  domainAssessments: DomainRiskAssessment[];
}

export default function AccreditationBenchmarkTab({ domainAssessments }: Props) {
  const { filterProps, selectedCohort } = useCohortFilter();

  const cohortScores = useMemo(() => generateCohortScores(selectedCohort), [selectedCohort]);

  const radarData = domainAssessments.map((a) => ({
    domain: a.domain.code,
    fullName: a.domain.name,
    yourSchool: 100 - a.riskScore,
    cohortAvg: cohortScores[a.domain.id],
  }));

  const tableData = domainAssessments.map((a) => {
    const yourScore = 100 - a.riskScore;
    const cohortAvg = cohortScores[a.domain.id];
    const percentile = getPercentile(yourScore, cohortAvg);
    const diff = yourScore - cohortAvg;
    return {
      ...a,
      yourScore,
      cohortAvg,
      percentile,
      diff,
    };
  }).sort((a, b) => b.diff - a.diff);

  const strengths = tableData.filter((d) => d.diff > 5);
  const gaps = tableData.filter((d) => d.diff < -5);
  const overallPercentile = Math.round(
    tableData.reduce((sum, d) => sum + d.percentile, 0) / tableData.length
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-lg font-semibold text-foreground">Accreditation Benchmarking</h2>
        <Badge className="bg-accent/15 text-accent border-accent/30">
          <Crown className="h-3 w-3 mr-1" /> Premium
        </Badge>
      </div>

      <CohortFilter {...filterProps} />

      {/* Overall percentile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">Overall Readiness Percentile</p>
            <p className="text-3xl font-bold text-primary mt-1">
              {overallPercentile}<sup className="text-xs">th</sup>
            </p>
            <Progress value={overallPercentile} className="h-1.5 mt-3" />
            <p className="text-xs text-muted-foreground mt-2">vs. {selectedCohort} schools</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">Domains Above Peers</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{strengths.length}</p>
            <p className="text-xs text-muted-foreground mt-2">of {domainAssessments.length} domains</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">Domains Below Peers</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{gaps.length}</p>
            <p className="text-xs text-muted-foreground mt-2">need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Radar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domain Readiness vs. Cohort Average</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={420}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid className="stroke-border" />
              <PolarAngleAxis dataKey="domain" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="Your School"
                dataKey="yourSchool"
                stroke="hsl(168, 55%, 38%)"
                fill="hsl(168, 55%, 38%)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Radar
                name="Cohort Average"
                dataKey="cohortAvg"
                stroke="hsl(28, 80%, 55%)"
                fill="hsl(28, 80%, 55%)"
                fillOpacity={0.15}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Domain comparison table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domain-by-Domain Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead className="text-right">Your Score</TableHead>
                <TableHead className="text-right">Cohort Avg</TableHead>
                <TableHead className="text-right">Diff</TableHead>
                <TableHead className="text-right">Percentile</TableHead>
                <TableHead className="text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => (
                <TableRow key={row.domain.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">{row.domain.code}</Badge>
                      <span className="text-sm">{row.domain.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{row.yourScore}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{row.cohortAvg}</TableCell>
                  <TableCell className="text-right">
                    <span className={row.diff > 0 ? "text-emerald-600 dark:text-emerald-400" : row.diff < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}>
                      {row.diff > 0 ? "+" : ""}{row.diff}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={row.percentile >= 70 ? "default" : row.percentile >= 40 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {row.percentile}th
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.trendDirection === "improving" && <TrendingUp className="h-4 w-4 text-emerald-500 inline" />}
                    {row.trendDirection === "declining" && <TrendingDown className="h-4 w-4 text-red-500 inline" />}
                    {row.trendDirection === "stable" && <Minus className="h-4 w-4 text-muted-foreground inline" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Insight cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-500" />
                Strengths vs. Peers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {strengths.slice(0, 4).map((s) => (
                <div key={s.domain.id} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-sm font-medium">
                    {s.domain.code} {s.domain.name}
                    <span className="ml-2 text-emerald-600 dark:text-emerald-400 text-xs">+{s.diff} pts above cohort</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {s.percentile}th percentile · Score {s.yourScore} vs. avg {s.cohortAvg}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {gaps.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Gaps to Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {gaps.slice(0, 4).map((g) => (
                <div key={g.domain.id} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <p className="text-sm font-medium">
                    {g.domain.code} {g.domain.name}
                    <span className="ml-2 text-red-600 dark:text-red-400 text-xs">{g.diff} pts below cohort</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {g.percentile}th percentile · Score {g.yourScore} vs. avg {g.cohortAvg}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your school is performing at or above cohort averages across all domains. Continue strengthening evidence documentation for the upcoming review cycle.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
