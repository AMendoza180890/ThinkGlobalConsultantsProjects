import { FRICTION_ISSUES, type SurveyResponse } from "@/lib/data";
import { INTERVENTION_LIBRARY, type InterventionEntry } from "@/data/interventionLibrary";
import { WASC_DOMAINS, type DomainRiskAssessment } from "@/lib/accreditation";
import type { AreaKey, AreaSignal, RecommendationSignalSnapshot } from "@/lib/recommendationSignals";

// ── Types ──

export interface RootCause {
  subItemId: string;
  name: string;
  burden: number;
  urgency: number;
  severity: number;
  prevalence: number;
  hoursPerWeek: number;
  trendDirection: "worsening" | "stable" | "improving";
}

export interface Recommendation {
  intervention: InterventionEntry;
  relevance: number;
  priority: number;
}

export interface AreaScore {
  score: number;
  signals: string[];
}

export interface RankedRecommendation {
  intervention: InterventionEntry;
  score: number;
  areaScores: Record<AreaKey, AreaScore>;
  overlapAreas: AreaKey[];
  reasons: string[];
}

// ── Root Cause Analysis ──

export function getRootCauses(
  standardId: string,
  surveyResponses: SurveyResponse[]
): RootCause[] {
  const domain = WASC_DOMAINS.find((d) => d.code === standardId || d.id === standardId);
  if (!domain) return [];

  // Get friction issue IDs for this domain
  const domainIssueIds = FRICTION_ISSUES
    .filter((fi) => domain.frictionCategoryIds.includes(fi.categoryId))
    .map((fi) => fi.id);

  const domainResponses = surveyResponses.filter((r) => domainIssueIds.includes(r.issueId));
  if (domainResponses.length === 0) return [];

  // Find p99 hours for normalization
  const allHours = domainResponses.map((r) => r.hoursSpent ?? 0).filter((h) => h > 0).sort((a, b) => a - b);
  const p99Hours = allHours.length > 0 ? allHours[Math.min(Math.floor(allHours.length * 0.99), allHours.length - 1)] : 1;

  // Total unique respondent-dates (proxy for total staff)
  const totalRespondentDates = new Set(domainResponses.map((r) => r.timestamp.slice(0, 10))).size || 1;

  // Group by sub-item
  const grouped: Record<string, SurveyResponse[]> = {};
  domainResponses.forEach((r) => {
    if (!grouped[r.issueId]) grouped[r.issueId] = [];
    grouped[r.issueId].push(r);
  });

  const rootCauses: RootCause[] = Object.entries(grouped).map(([issueId, responses]) => {
    const issue = FRICTION_ISSUES.find((fi) => fi.id === issueId);
    const avgSeverity = responses.reduce((s, r) => s + r.severity, 0) / responses.length;
    const avgHours = responses.reduce((s, r) => s + (r.hoursSpent ?? 0), 0) / responses.length;
    const uniqueDates = new Set(responses.map((r) => r.timestamp.slice(0, 10))).size;
    const prevalenceRate = uniqueDates / totalRespondentDates;

    // Burden
    const burden = (avgSeverity / 5) * (avgHours / Math.max(p99Hours, 0.1)) * prevalenceRate;

    // Trend: compare first half vs second half of responses sorted by time
    const sorted = [...responses].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, Math.max(mid, 1));
    const secondHalf = sorted.slice(mid);
    const firstAvg = firstHalf.reduce((s, r) => s + r.severity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, r) => s + r.severity, 0) / secondHalf.length;
    const trendPct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    let trendMult = 1.0;
    if (trendPct > 15) trendMult = 1.4;
    else if (trendPct > 8) trendMult = 1.2;
    else if (trendPct > 0) trendMult = 1.1;

    const trendDirection: RootCause["trendDirection"] =
      trendPct > 8 ? "worsening" : trendPct < -8 ? "improving" : "stable";

    const urgency = burden * trendMult;

    return {
      subItemId: issueId,
      name: issue?.description ?? "Unknown",
      burden: Math.round(burden * 1000) / 1000,
      urgency: Math.round(urgency * 1000) / 1000,
      severity: Math.round(avgSeverity * 10) / 10,
      prevalence: Math.round(prevalenceRate * 100),
      hoursPerWeek: Math.round(avgHours * 10) / 10,
      trendDirection,
    };
  });

  // Sort by urgency descending
  rootCauses.sort((a, b) => b.urgency - a.urgency);

  // Filter out items below 10% of top urgency
  if (rootCauses.length > 0) {
    const threshold = rootCauses[0].urgency * 0.1;
    return rootCauses.filter((rc) => rc.urgency >= threshold);
  }

  return rootCauses;
}

// ── Recommendation Engine ──

export function getRecommendations(
  rootCauses: RootCause[],
  standardId: string
): Recommendation[] {
  if (rootCauses.length === 0) return [];

  const rootCauseIds = rootCauses.map((rc) => rc.subItemId);

  // Find domain code
  const domain = WASC_DOMAINS.find((d) => d.code === standardId || d.id === standardId);
  const domainCode = domain?.code ?? standardId;

  const scored = INTERVENTION_LIBRARY
    .filter((intervention) => {
      // Must target at least one of the root cause sub-items OR this standard
      const matchesSubItem = intervention.targetSubItems.some((s) => rootCauseIds.includes(s));
      const matchesStandard = intervention.targetStandards.includes(domainCode);
      return matchesSubItem || matchesStandard;
    })
    .map((intervention) => {
      // Relevance = sum of urgency for matched sub-items
      const relevance = intervention.targetSubItems
        .filter((s) => rootCauseIds.includes(s))
        .reduce((sum, s) => {
          const rc = rootCauses.find((r) => r.subItemId === s);
          return sum + (rc?.urgency ?? 0);
        }, 0);

      const priority = relevance / intervention.effortScore;

      return { intervention, relevance, priority };
    })
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.priority - a.priority);

  return scored.slice(0, 3);
}

// â”€â”€ Content-library recommendation engine â”€â”€

const AREA_WEIGHTS: Record<AreaKey, number> = {
  atRiskGroups: 0.2,
  cqConcerns: 0.25,
  issueTracking: 0.35,
  staffWellness: 0.2,
};

const CATEGORY_AREA_BIAS: Record<string, Record<AreaKey, number>> = {
  "cat-1": { atRiskGroups: 0.9, cqConcerns: 0.9, issueTracking: 0.8, staffWellness: 0.5 },
  "cat-2": { atRiskGroups: 0.6, cqConcerns: 0.7, issueTracking: 0.95, staffWellness: 0.8 },
  "cat-3": { atRiskGroups: 0.8, cqConcerns: 0.75, issueTracking: 0.95, staffWellness: 0.95 },
  "cat-4": { atRiskGroups: 0.95, cqConcerns: 0.95, issueTracking: 0.85, staffWellness: 0.7 },
  "cat-5": { atRiskGroups: 0.75, cqConcerns: 0.8, issueTracking: 0.95, staffWellness: 0.85 },
};

const AREA_KEYWORDS: Record<AreaKey, string[]> = {
  atRiskGroups: ["leadership", "parent", "onboarding", "peer", "coaching", "belonging", "reflective", "data", "checklist", "support"],
  cqConcerns: ["cultural", "communication", "strategy", "action", "listening", "feedback", "norms", "adaptation", "planning", "decision"],
  issueTracking: ["meeting", "handoff", "conflict", "friction", "unclear", "mixed", "delay", "misunderstanding", "follow-up", "breakdown"],
  staffWellness: ["safety", "stress", "belonging", "fatigue", "workload", "frustration", "psychological", "clarity", "emotional", "support"],
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function logScale(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return clamp(Math.log1p(value) / Math.log1p(max));
}

function recentWeight(criticalSince?: string): number {
  if (!criticalSince) return 0.8;
  const since = new Date(`${criticalSince}T00:00:00Z`);
  const now = new Date();
  const days = Math.max(0, (now.getTime() - since.getTime()) / 86400000);
  if (days <= 30) return 1;
  if (days <= 60) return 0.9;
  if (days <= 120) return 0.8;
  return 0.65;
}

function interventionText(intervention: InterventionEntry): string {
  return `${intervention.title} ${intervention.description} ${intervention.wascAlignment}`.toLowerCase();
}

function inferAreaFit(intervention: InterventionEntry): Record<AreaKey, number> {
  const text = interventionText(intervention);
  const fit: Record<AreaKey, number> = {
    atRiskGroups: 0.1,
    cqConcerns: 0.1,
    issueTracking: 0.1,
    staffWellness: 0.1,
  };

  intervention.targetSubItems.forEach((subItemId) => {
    const issue = FRICTION_ISSUES.find((fi) => fi.id === subItemId);
    if (!issue) return;
    const categoryBias = CATEGORY_AREA_BIAS[issue.categoryId] ?? {};
    (Object.keys(categoryBias) as AreaKey[]).forEach((area) => {
      fit[area] += categoryBias[area] * 0.35;
    });
  });

  (Object.keys(AREA_KEYWORDS) as AreaKey[]).forEach((area) => {
    const boost = AREA_KEYWORDS[area].reduce((sum, keyword) => {
      return sum + (text.includes(keyword) ? 0.14 : 0);
    }, 0);
    fit[area] += boost;
  });

  if (text.includes("leadership")) fit.atRiskGroups += 0.15;
  if (text.includes("parent")) fit.atRiskGroups += 0.12;
  if (text.includes("belonging")) fit.staffWellness += 0.18;
  if (text.includes("conflict")) fit.issueTracking += 0.2;
  if (text.includes("handoff")) fit.issueTracking += 0.2;
  if (text.includes("feedback")) fit.cqConcerns += 0.12;
  if (text.includes("strategy")) fit.cqConcerns += 0.12;

  (Object.keys(fit) as AreaKey[]).forEach((area) => {
    fit[area] = clamp(fit[area], 0, 1);
  });

  return fit;
}

function topSignals(signals: AreaSignal[], limit = 3): AreaSignal[] {
  return [...signals]
    .sort((a, b) => signalUrgency(b) - signalUrgency(a))
    .slice(0, limit);
}

function signalUrgency(signal: AreaSignal): number {
  const scale = signal.score > 10 ? signal.score / 100 : signal.score / 10;
  const inverse = clamp(1 - scale);
  const severityBoost =
    signal.severity === "critical" ? 1.25 :
    signal.severity === "watch" ? 1.0 : 0.85;
  const respondentsBoost = 0.55 + 0.45 * logScale(signal.respondents, 25);
  const gapBoost = signal.gap != null ? 0.75 + clamp(signal.gap / 3, 0, 0.35) : 1;
  const hoursBoost = signal.hoursLost != null ? 0.8 + clamp(signal.hoursLost / 20, 0, 0.4) : 1;
  const recencyBoost = recentWeight(signal.criticalSince);
  const trendBoost = signal.trend === "worsening" ? 1.1 : signal.trend === "improving" ? 0.85 : 1;

  return inverse * severityBoost * respondentsBoost * gapBoost * hoursBoost * recencyBoost * trendBoost;
}

function signalFitScore(signal: AreaSignal, area: AreaKey): number {
  const scale = signal.score > 10 ? signal.score / 100 : signal.score / 10;
  const inverse = clamp(1 - scale);
  const urgency = signalUrgency(signal);

  if (area === "issueTracking") {
    const hoursComponent = signal.hoursLost != null ? clamp(signal.hoursLost / 20, 0, 1) : 0;
    const countComponent = clamp(signal.respondents / 8, 0, 1);
    return clamp((inverse * 0.4) + (urgency * 0.45) + (hoursComponent * 0.1) + (countComponent * 0.05));
  }

  if (area === "staffWellness") {
    const risk = signal.severity === "critical" ? 1 : signal.severity === "watch" ? 0.75 : 0.55;
    return clamp((inverse * 0.55) + (risk * 0.2) + (urgency * 0.25));
  }

  return clamp((inverse * 0.5) + (urgency * 0.35) + (logScale(signal.respondents, 25) * 0.15));
}

export function buildRecommendationSnapshot(
  snapshot: RecommendationSignalSnapshot
): RankedRecommendation[] {
  return INTERVENTION_LIBRARY.map((intervention) => {
    const areaFit = inferAreaFit(intervention);
    const areaScores = {} as Record<AreaKey, AreaScore>;
    const reasons: string[] = [];

    (Object.keys(areaFit) as AreaKey[]).forEach((area) => {
      const signals = snapshot[area];
      const strongest = topSignals(signals, 3);
      const weighted = strongest.reduce((sum, signal, index) => {
        const signalWeight = area === "issueTracking"
          ? signalFitScore(signal, area)
          : signalFitScore(signal, area);
        return sum + signalWeight * (index === 0 ? 1 : index === 1 ? 0.7 : 0.5);
      }, 0);

      const fit = areaFit[area];
      const areaWeight = AREA_WEIGHTS[area];
      const score = clamp(weighted * fit * areaWeight) * 100;

      areaScores[area] = {
        score: Math.round(score * 10) / 10,
        signals: strongest.map((signal) => signal.label),
      };

      if (score >= 35 && strongest[0]) {
        reasons.push(`${area}: ${strongest[0].label}`);
      }
    });

    const overlapAreas = (Object.keys(areaScores) as AreaKey[]).filter((area) => areaScores[area].score >= 30);
    const strongestAreaScore = Math.max(...(Object.values(areaScores).map((entry) => entry.score)));
    const overlapBonus = overlapAreas.length * 5;
    const effortPenalty = intervention.effortScore * 4;
    const impactBonus =
      intervention.expectedImpact === "High" ? 6 :
      intervention.expectedImpact === "Medium" ? 3 : 1;
    const breadthBonus = intervention.targetSubItems.length > 2 ? 4 : intervention.targetSubItems.length > 1 ? 2 : 0;
    const total = Math.round((strongestAreaScore + overlapBonus + impactBonus + breadthBonus - effortPenalty) * 10) / 10;

    return {
      intervention,
      score: total,
      areaScores,
      overlapAreas,
      reasons: reasons.slice(0, 3),
    };
  })
    .sort((a, b) => b.score - a.score);
}

export function buildDefaultRecommendationSnapshot(
  data: RecommendationSignalSnapshot
): RankedRecommendation[] {
  return buildRecommendationSnapshot(data);
}

// ── Root Cause Summary ──

export function getRootCauseSummary(primaryDriver: RootCause): string {
  const severityLabel =
    primaryDriver.severity >= 4 ? "critically high" :
    primaryDriver.severity >= 3 ? "elevated" :
    primaryDriver.severity >= 2 ? "moderate" : "low";

  const trendLabel =
    primaryDriver.trendDirection === "worsening" ? "and trending upward" :
    primaryDriver.trendDirection === "improving" ? "but showing signs of improvement" :
    "and holding steady";

  const prevalenceLabel =
    primaryDriver.prevalence >= 70 ? "widespread across the school" :
    primaryDriver.prevalence >= 40 ? "affecting a significant portion of staff" :
    "concentrated among a subset of staff";

  return `${primaryDriver.name} shows ${severityLabel} severity (${primaryDriver.severity}/5) ${trendLabel}. ` +
    `This issue is ${prevalenceLabel} (${primaryDriver.prevalence}% prevalence) ` +
    `and consuming approximately ${primaryDriver.hoursPerWeek} hours per week. ` +
    `Addressing this root cause is likely to have the greatest impact on this standard's readiness score.`;
}
