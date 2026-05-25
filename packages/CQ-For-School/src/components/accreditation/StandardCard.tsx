import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";
import type { RiskLevel } from "@/lib/accreditation";

interface StandardCardProps {
  code: string;
  name: string;
  score: number;
  riskLevel: RiskLevel;
  cpdEvidenceScore?: number;
  onClick: () => void;
}

const riskScoreColor: Record<RiskLevel, string> = {
  high: "text-red-600 dark:text-red-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-emerald-600 dark:text-emerald-400",
};

const riskBadgeColor: Record<RiskLevel, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const riskCodeBadge: Record<RiskLevel, string> = {
  high: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
};

const riskProgressColor: Record<RiskLevel, string> = {
  high: "[&>div]:bg-red-500",
  medium: "[&>div]:bg-amber-500",
  low: "[&>div]:bg-emerald-500",
};

const riskLabel: Record<RiskLevel, string> = {
  high: "High risk",
  medium: "At risk",
  low: "Strong",
};

function cpdPillColor(score: number) {
  if (score < 50) return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  if (score < 75) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
}

function cpdProgressColor(score: number) {
  if (score < 50) return "[&>div]:bg-red-400";
  if (score < 75) return "[&>div]:bg-amber-400";
  return "[&>div]:bg-emerald-400";
}

export default function StandardCard({ code, name, score, riskLevel, cpdEvidenceScore, onClick }: StandardCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer group"
    >
      {/* Top row: name + code badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-sm font-medium text-foreground leading-tight">
          {name}
        </span>
        <Badge variant="outline" className={`shrink-0 text-[11px] font-mono ${riskCodeBadge[riskLevel]}`}>
          {code}
        </Badge>
      </div>

      {/* Score */}
      <div className={`text-[28px] font-bold leading-none ${riskScoreColor[riskLevel]}`}>
        {score}
      </div>

      {/* Progress bar */}
      <Progress
        value={score}
        className={`h-1.5 mt-3 ${riskProgressColor[riskLevel]}`}
      />

      {/* CPD Evidence Score */}
      {cpdEvidenceScore !== undefined && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">CPD Evidence</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">{cpdEvidenceScore}</span>
              <Badge className={`text-[9px] border-0 py-0 px-1.5 ${cpdPillColor(cpdEvidenceScore)}`}>
                {cpdEvidenceScore < 50 ? "Low" : cpdEvidenceScore < 75 ? "Moderate" : "Strong"}
              </Badge>
            </div>
          </div>
          <Progress
            value={cpdEvidenceScore}
            className={`h-1 ${cpdProgressColor(cpdEvidenceScore)}`}
          />
        </div>
      )}

      {/* Bottom row: risk pill + chevron */}
      <div className="flex items-center justify-between mt-3">
        <Badge className={`text-[11px] border-0 ${riskBadgeColor[riskLevel]}`}>
          {riskLabel[riskLevel]}
        </Badge>
        <span className="text-xs text-muted-foreground flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          Details
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}
