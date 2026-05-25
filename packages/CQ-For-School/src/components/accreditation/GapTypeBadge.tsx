import { Badge } from "@/components/ui/badge";
import type { GapType } from "@/lib/cpdEvidenceStrength";
import { cn } from "@/lib/utils";

const gapTypeStyles: Record<GapType, string> = {
  coverage: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  distribution: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  alignment: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  compliance: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const gapTypeLabels: Record<GapType, string> = {
  coverage: "Coverage",
  distribution: "Distribution",
  alignment: "Alignment",
  compliance: "Compliance",
};

interface GapTypeBadgeProps {
  type: GapType;
  className?: string;
}

export function GapTypeBadge({ type, className }: GapTypeBadgeProps) {
  return (
    <Badge className={cn("text-[10px] border-0", gapTypeStyles[type], className)}>
      {gapTypeLabels[type]}
    </Badge>
  );
}
