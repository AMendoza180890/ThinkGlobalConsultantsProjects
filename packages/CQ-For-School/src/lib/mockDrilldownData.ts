/**
 * Generates deterministic per-friction-issue and per-win scores for mock cohorts.
 * Uses a simple seeded hash so the same cohort always gets the same values.
 */
import { FRICTION_ISSUES, CQ_WINS } from "@/lib/data";

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

export interface CohortFrictionDetail {
  issueId: string;
  description: string;
  severity: number; // 0-100
}

export interface CohortWinDetail {
  winId: string;
  label: string;
  frequency: number; // 0-100 (% of respondents reporting)
}

export function getCohortFrictionDetails(cohortName: string, period = ""): CohortFrictionDetail[] {
  const base = seedHash(cohortName + period);
  return FRICTION_ISSUES.map((issue, i) => ({
    issueId: issue.id,
    description: issue.description,
    severity: seededRandom(base + i * 7, 10, 85),
  }));
}

export function getCohortWinDetails(cohortName: string, period = ""): CohortWinDetail[] {
  const base = seedHash(cohortName + "_wins" + period);
  return CQ_WINS.map((win, i) => ({
    winId: win.id,
    label: win.label,
    frequency: seededRandom(base + i * 13, 5, 90),
  }));
}

/**
 * Build bar chart data filtered to selected friction issues.
 * Returns one entry per cohort, with each selected issue as a data key.
 */
export function buildFrictionChartData(
  cohortNames: string[],
  selectedIds: string[],
  period = ""
) {
  return cohortNames.map((name) => {
    const details = getCohortFrictionDetails(name, period);
    const row: Record<string, string | number> = { name };
    selectedIds.forEach((id) => {
      const d = details.find((x) => x.issueId === id);
      const issue = FRICTION_ISSUES.find((f) => f.id === id);
      if (d && issue) {
        row[issue.description.slice(0, 30)] = d.severity;
      }
    });
    return row;
  });
}

/**
 * Build bar chart data filtered to selected CQ wins.
 */
export function buildWinsChartData(
  cohortNames: string[],
  selectedIds: string[],
  period = ""
) {
  return cohortNames.map((name) => {
    const details = getCohortWinDetails(name, period);
    const row: Record<string, string | number> = { name };
    selectedIds.forEach((id) => {
      const d = details.find((x) => x.winId === id);
      const win = CQ_WINS.find((w) => w.id === id);
      if (d && win) {
        row[win.label.slice(0, 30)] = d.frequency;
      }
    });
    return row;
  });
}

/**
 * Apply a deterministic period-based offset to an aggregate metric value.
 * Returns a value clamped to 0-100.
 */
export function applyPeriodOffset(baseValue: number, cohortName: string, metric: string, period: string): number {
  if (!period || period === "full-year") return baseValue;
  const seed = seedHash(cohortName + metric + period);
  const offset = seededRandom(seed, -12, 12);
  return Math.max(0, Math.min(100, baseValue + offset));
}

// Distinct colors for up to 12 series — teal/navy palette matching Project A
export const DRILLDOWN_COLORS = [
  "hsl(174, 63%, 40%)",   // primary teal #1a7a7a
  "hsl(189, 52%, 36%)",   // deep teal
  "hsl(196, 62%, 52%)",   // sky teal
  "hsl(158, 45%, 48%)",   // muted green-teal
  "hsl(207, 55%, 45%)",   // slate blue
  "hsl(174, 47%, 55%)",   // light teal #4db8b8
  "hsl(200, 62%, 30%)",   // dark navy-teal
  "hsl(165, 40%, 58%)",   // soft sage
  "hsl(214, 50%, 50%)",   // cool blue
  "hsl(180, 35%, 42%)",   // muted cyan
  "hsl(150, 38%, 44%)",   // forest teal
  "hsl(200, 62%, 14%)",   // deep navy #0c2f3b
];
