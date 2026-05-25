import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export type EvidenceStatus = "green" | "amber" | "red";

interface EvidenceStatusBadgeProps {
  status: EvidenceStatus;
}

const config: Record<EvidenceStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  green: { label: "Complete", className: "bg-emerald-100 text-emerald-800", Icon: CheckCircle2 },
  amber: { label: "Partial", className: "bg-amber-100 text-amber-800", Icon: AlertTriangle },
  red: { label: "Missing", className: "bg-red-100 text-red-800", Icon: XCircle },
};

export default function EvidenceStatusBadge({ status }: EvidenceStatusBadgeProps) {
  const { label, className, Icon } = config[status];
  return (
    <Badge className={`${className} text-xs gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
