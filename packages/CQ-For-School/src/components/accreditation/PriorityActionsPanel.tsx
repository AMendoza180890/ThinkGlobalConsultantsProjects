import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { PriorityAction } from "@/lib/cpdEvidenceStrength";
import { GapTypeBadge } from "./GapTypeBadge";

const urgencyConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  critical: { icon: <AlertTriangle className="h-4 w-4" />, color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", label: "Critical" },
  high: { icon: <AlertCircle className="h-4 w-4" />, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", label: "High" },
  moderate: { icon: <Info className="h-4 w-4" />, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", label: "Moderate" },
};

interface PriorityActionsPanelProps {
  actions: PriorityAction[];
  onMarkPlanned?: (action: PriorityAction) => void;
}

export default function PriorityActionsPanel({ actions, onMarkPlanned }: PriorityActionsPanelProps) {
  const navigate = useNavigate();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visible = actions.filter((a) => !dismissedIds.has(a.id));

  if (actions.length === 0) {
    return <p className="text-xs text-muted-foreground">No priority actions right now.</p>;
  }

  if (visible.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        All priority actions reviewed — check back next week.
      </p>
    );
  }

  return (
    <>
      {visible.map((action) => {
        const config = urgencyConfig[action.urgency];
        return (
          <div key={action.id} className="rounded-lg border border-red-200 dark:border-red-800 bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-[10px] border-0 ${config.color}`}>
                <span className="mr-1">{config.icon}</span>
                {config.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">{action.standardCode}</Badge>
              <GapTypeBadge type={action.gapType} className="ml-auto" />
            </div>
            <p className="text-sm font-medium text-foreground leading-snug">{action.title}</p>
            <div className="flex flex-col gap-2">
              {onMarkPlanned && (
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => onMarkPlanned(action)}
                >
                  Mark as planned
                </Button>
              )}
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => navigate(action.actionRoute)}
                >
                  {action.actionLabel}
                </Button>
                <button
                  onClick={() => setDismissedIds((prev) => new Set([...prev, action.id]))}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
