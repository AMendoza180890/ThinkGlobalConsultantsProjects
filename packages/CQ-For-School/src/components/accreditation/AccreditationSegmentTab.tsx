import { useMemo, useState } from "react";
import { WASC_DOMAINS, DOCUMENT_ONLY_DOMAIN_IDS, type RiskLevel } from "@/lib/accreditation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TimePeriodSelector, type TimePeriod } from "@/components/TimePeriodSelector";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { applyPeriodOffset, DRILLDOWN_COLORS } from "@/lib/mockDrilldownData";

// Seeded random for deterministic mock data
function seedHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number, min: number, max: number): number {
  const x = Math.sin(seed) * 10000;
  const t = x - Math.floor(x);
  return Math.round(min + t * (max - min));
}

function getRiskLevel(score: number): RiskLevel {
  if (score < 50) return "high";
  if (score < 70) return "medium";
  return "low";
}

const riskBadgeColor: Record<RiskLevel, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const riskProgressColor: Record<RiskLevel, string> = {
  high: "[&>div]:bg-red-500",
  medium: "[&>div]:bg-amber-500",
  low: "[&>div]:bg-emerald-500",
};

export type SegmentType = "department" | "school-level" | "tenure";

// Domain-specific insights for the cohort breakdown panel
const DOMAIN_INSIGHTS: Record<string, { gaps: string[]; strongSchools: string[] }> = {
  "wasc-c1": {
    gaps: [
      "Only 62% safeguarding coverage",
      "Low alignment with wellbeing goals",
      "Uneven participation across departments",
    ],
    strongSchools: [
      "95%+ staff participation",
      "Balanced CPD across departments",
      "Clear link to strategic priorities",
    ],
  },
  "wasc-a4": {
    gaps: [
      "Data review cycles inconsistent across teams",
      "Limited use of trend data in planning",
      "Improvement plans lack measurable targets",
    ],
    strongSchools: [
      "Quarterly data review embedded in calendar",
      "All departments set SMART improvement goals",
      "Evidence of plan-do-review cycles",
    ],
  },
  "wasc-a3": {
    gaps: [
      "CPD not aligned to individual growth plans",
      "Low engagement in peer observation",
      "Limited collaborative planning time",
    ],
    strongSchools: [
      "Personalised PD pathways for all staff",
      "Weekly collaborative planning blocks",
      "Peer coaching embedded in school culture",
    ],
  },
  "wasc-c2": {
    gaps: [
      "Referral pathways unclear to staff",
      "Wellbeing support reactive, not proactive",
      "Inconsistent follow-up on flagged concerns",
    ],
    strongSchools: [
      "Tiered support system with clear protocols",
      "Proactive wellbeing check-ins for all staff",
      "Integrated student and staff support tracking",
    ],
  },
  "wasc-a2": {
    gaps: [
      "Decision-making processes not transparent",
      "Middle leaders underrepresented in governance",
      "Strategic plan not revisited mid-cycle",
    ],
    strongSchools: [
      "Shared leadership model with clear accountability",
      "Regular stakeholder feedback on governance",
      "Strategic plan reviewed and updated termly",
    ],
  },
  "wasc-c3": {
    gaps: [
      "Parent engagement below 40% in surveys",
      "Community partnerships lack formal agreements",
      "Limited evidence of alumni engagement",
    ],
    strongSchools: [
      "80%+ parent participation in feedback",
      "Formalised partnership MOUs in place",
      "Active community advisory board",
    ],
  },
  "wasc-b2": {
    gaps: [
      "Differentiation inconsistent across subjects",
      "Student voice underused in lesson design",
      "Limited formative assessment variety",
    ],
    strongSchools: [
      "Universal Design for Learning embedded",
      "Student feedback loops in every class",
      "Rich formative assessment toolkit",
    ],
  },
};

const SEGMENT_COHORTS: Record<SegmentType, string[]> = {
  department: ["Elementary", "Middle School", "High School"],
  "school-level": ["Elementary", "Middle School", "High School"],
  tenure: ["0–2 years", "3–5 years", "6–10 years", "10+ years"],
};

const SEGMENT_LABELS: Record<SegmentType, string> = {
  department: "By Department",
  "school-level": "By School Level",
  tenure: "By Tenure",
};

// Only show survey-mapped domains in segmentation charts
const SURVEY_DOMAINS = WASC_DOMAINS.filter(d => !DOCUMENT_ONLY_DOMAIN_IDS.includes(d.id));

function generateAllCohortDomainScores(
  cohorts: string[],
  period: string,
  baseScores: Record<string, number>,
) {
  return cohorts.map((cohort, cohortIndex) => {
    const rawDomains = SURVEY_DOMAINS.map(domain => {
      const realScore = baseScores[domain.id] ?? 60;
      const seed = seedHash(cohort + domain.id);
      const spreadFactor = (cohortIndex - (cohorts.length - 1) / 2) / Math.max(cohorts.length - 1, 1);
      const offset = Math.round(spreadFactor * 16 + seededRandom(seed, -4, 4));
      return { domain, rawScore: Math.max(10, Math.min(95, realScore + offset)) };
    });
    return { cohort, rawDomains };
  });
}

/** Normalize so the average across cohorts for each domain equals the baseScore exactly */
function normalizeAndFinalize(
  allRaw: ReturnType<typeof generateAllCohortDomainScores>,
  period: string,
  baseScores: Record<string, number>,
) {
  return allRaw.map(({ cohort, rawDomains }) => ({
    cohort,
    domains: rawDomains.map(({ domain, rawScore }) => {
      const realScore = baseScores[domain.id] ?? 60;
      // Compute current average for this domain across all cohorts
      const avg = allRaw.reduce((sum, c) => {
        const d = c.rawDomains.find(x => x.domain.id === domain.id);
        return sum + (d?.rawScore ?? realScore);
      }, 0) / allRaw.length;
      // Shift so average matches realScore
      const adjusted = Math.max(0, Math.min(100, Math.round(rawScore + (realScore - avg))));
      const score = applyPeriodOffset(adjusted, cohort, domain.id, period);
      return { domain, score, riskLevel: getRiskLevel(score) };
    }),
  }));
}

interface Props {
  segmentType: SegmentType;
  /** Real domain scores from the Overview tab (domain.id → score 0-100) */
  baseScores?: Record<string, number>;
}

export default function AccreditationSegmentTab({ segmentType, baseScores = {} }: Props) {
  const [period, setPeriod] = useState<TimePeriod>("full-year");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const cohorts = SEGMENT_COHORTS[segmentType];

  const allData = useMemo(() => {
    const raw = generateAllCohortDomainScores(cohorts, period, baseScores);
    return normalizeAndFinalize(raw, period, baseScores);
  }, [cohorts, period, baseScores]);

  // Bar chart: one bar per cohort, grouped by domain
  const barChartData = useMemo(() => {
    return SURVEY_DOMAINS.map(domain => {
      const row: Record<string, string | number> = { domain: `${domain.code} ${domain.name}` };
      cohorts.forEach(cohort => {
        const entry = allData.find(d => d.cohort === cohort);
        const domainScore = entry?.domains.find(d => d.domain.id === domain.id);
        row[cohort] = domainScore?.score ?? 0;
      });
      return row;
    });
  }, [allData, cohorts]);

  // Bar chart: one bar per domain, grouped by cohort (inverse view)
  const cohortGroupedData = useMemo(() => {
    return cohorts.map(cohort => {
      const entry = allData.find(d => d.cohort === cohort);
      const row: Record<string, string | number> = { cohort };
      SURVEY_DOMAINS.forEach(domain => {
        const domainScore = entry?.domains.find(d => d.domain.id === domain.id);
        row[`${domain.code} ${domain.name}`] = domainScore?.score ?? 0;
      });
      return row;
    });
  }, [allData, cohorts]);

  // Radar chart data
  const radarData = useMemo(() => {
    return SURVEY_DOMAINS.map(domain => {
      const row: Record<string, string | number> = { domain: `${domain.code} ${domain.name}` };
      cohorts.forEach(cohort => {
        const entry = allData.find(d => d.cohort === cohort);
        const domainScore = entry?.domains.find(d => d.domain.id === domain.id);
        row[cohort] = domainScore?.score ?? 0;
      });
      return row;
    });
  }, [allData, cohorts]);

  // Detail view for a selected domain
  const selectedDomainData = useMemo(() => {
    if (!selectedDomain) return null;
    return allData.map(({ cohort, domains }) => {
      const d = domains.find(x => x.domain.id === selectedDomain);
      return { cohort, score: d?.score ?? 0, riskLevel: d?.riskLevel ?? "low" as RiskLevel };
    });
  }, [selectedDomain, allData]);

  const selectedDomainInfo = SURVEY_DOMAINS.find(d => d.id === selectedDomain);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{SEGMENT_LABELS[segmentType]}</h2>
          <p className="text-sm text-muted-foreground">WASC domain scores segmented by {segmentType === "school-level" ? "school level" : segmentType}</p>
        </div>
        <TimePeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Domain cards grid — click to see cohort breakdown */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Click a domain to see cohort breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SURVEY_DOMAINS.map(domain => {
            const scores = allData.map(d => d.domains.find(x => x.domain.id === domain.id)?.score ?? 0);
            const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            const risk = getRiskLevel(avg);
            const isSelected = selectedDomain === domain.id;

            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => setSelectedDomain(isSelected ? null : domain.id)}
                className={`text-left rounded-lg border bg-card p-3 transition-all hover:shadow-md cursor-pointer ${isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/40"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[10px] font-mono">{domain.code}</Badge>
                  <Badge className={`text-[10px] border-0 ${riskBadgeColor[risk]}`}>
                    {risk === "high" ? "High risk" : risk === "medium" ? "At risk" : "Strong"}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-foreground truncate">{domain.name}</p>
                <p className="text-lg font-bold text-foreground mt-1">{avg}</p>
                <Progress value={avg} className={`h-1 mt-1 ${riskProgressColor[risk]}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected domain cohort breakdown */}
      {selectedDomainData && selectedDomainInfo && (() => {
        const insights = DOMAIN_INSIGHTS[selectedDomainInfo.id];
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedDomainInfo.code} — {selectedDomainInfo.name}: Cohort Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                {selectedDomainData.map(({ cohort, score, riskLevel }) => (
                  <div key={cohort} className="flex items-center gap-4">
                    <span className="text-sm text-foreground w-36 shrink-0">{cohort}</span>
                    <Progress value={score} className={`h-2 flex-1 ${riskProgressColor[riskLevel]}`} />
                    <span className="text-sm font-semibold w-10 text-right">{score}</span>
                    <Badge className={`text-[10px] border-0 w-16 justify-center ${riskBadgeColor[riskLevel]}`}>
                      {riskLevel === "high" ? "High" : riskLevel === "medium" ? "At risk" : "Strong"}
                    </Badge>
                  </div>
                ))}
              </div>

              {insights && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div>
                    <h4 className="text-sm font-semibold text-destructive mb-2">Key Gaps</h4>
                    <ul className="space-y-1.5">
                      {insights.gaps.map((gap, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-destructive mt-0.5">•</span>
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">What Strong Schools Do</h4>
                    <ul className="space-y-1.5">
                      {insights.strongSchools.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Bar chart comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domain Scores by {SEGMENT_LABELS[segmentType].replace("By ", "")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="domain" className="text-xs" angle={-25} textAnchor="end" height={80} interval={0} tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} className="text-xs" />
              <Tooltip />
              <Legend />
              {cohorts.map((cohort, i) => (
                <Bar
                  key={cohort}
                  dataKey={cohort}
                  fill={DRILLDOWN_COLORS[i % DRILLDOWN_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar chart: grouped by cohort */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{SEGMENT_LABELS[segmentType].replace("By ", "")} Scores by Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={cohortGroupedData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="cohort" className="text-xs" interval={0} tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} className="text-xs" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {SURVEY_DOMAINS.map((domain, i) => (
                <Bar
                  key={domain.id}
                  dataKey={`${domain.code} ${domain.name}`}
                  fill={DRILLDOWN_COLORS[i % DRILLDOWN_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Radar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domain Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="domain" className="text-xs" />
              <PolarRadiusAxis domain={[0, 100]} />
              {cohorts.map((cohort, i) => (
                <Radar
                  key={cohort}
                  name={cohort}
                  dataKey={cohort}
                  stroke={DRILLDOWN_COLORS[i % DRILLDOWN_COLORS.length]}
                  fill={DRILLDOWN_COLORS[i % DRILLDOWN_COLORS.length]}
                  fillOpacity={0.1}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
