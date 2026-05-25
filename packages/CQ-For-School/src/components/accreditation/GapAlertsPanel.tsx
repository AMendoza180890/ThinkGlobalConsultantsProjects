import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Users, BarChart3, Target, ShieldAlert } from "lucide-react";
import type { DetectedGap, GapType } from "@/lib/cpdEvidenceStrength";

const gapTypeConfig: Record<GapType, { icon: React.ReactNode; label: string; borderColor: string }> = {
  coverage: { icon: <Users className="h-4 w-4" />, label: "Coverage", borderColor: "border-l-blue-500" },
  distribution: { icon: <BarChart3 className="h-4 w-4" />, label: "Distribution", borderColor: "border-l-purple-500" },
  alignment: { icon: <Target className="h-4 w-4" />, label: "Alignment", borderColor: "border-l-amber-500" },
  compliance: { icon: <ShieldAlert className="h-4 w-4" />, label: "Compliance", borderColor: "border-l-red-500" },
};

interface GapAlertsPanelProps {
  gaps: DetectedGap[];
  onViewStandard: (domainId: string) => void;
}

export default function GapAlertsPanel({ gaps, onViewStandard }: GapAlertsPanelProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const topGaps = gaps.slice(0, 3);
  const visibleGaps = topGaps.filter((g) => !dismissedIds.has(`${g.standardId}-${g.type}`));

  if (topGaps.length === 0) return null;

  if (visibleGaps.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {topGaps.length} gaps detected this term — <button className="text-primary hover:underline font-medium" onClick={() => setDismissedIds(new Set())}>review your action plan</button>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {visibleGaps.map((gap) => {
        const config = gapTypeConfig[gap.type];
        return (
          <div
            key={`${gap.standardId}-${gap.type}`}
            className={`rounded-lg border border-l-4 ${config.borderColor} bg-card p-4 space-y-2 relative`}
          >
            <button
              onClick={() => setDismissedIds((prev) => new Set([...prev, `${gap.standardId}-${gap.type}`]))}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{config.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{config.label}</span>
              <Badge variant="outline" className="text-[10px] font-mono ml-auto mr-5">
                {gap.standardCode}
              </Badge>
            </div>

            <p className="text-sm text-foreground leading-snug pr-4">{gap.message}</p>

            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-xs"
              onClick={() => onViewStandard(gap.standardId)}
            >
              View standard →
            </Button>
          </div>
        );
      })}
    </div>
  );
}
