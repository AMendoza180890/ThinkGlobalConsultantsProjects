import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

export type TimePeriod = "last-week" | "last-4-weeks" | "this-semester" | "full-year";

const PERIOD_LABELS: Record<TimePeriod, string> = {
  "last-week": "Last Week",
  "last-4-weeks": "Last 4 Weeks",
  "this-semester": "This Semester",
  "full-year": "Full Year",
};

interface Props {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

export function TimePeriodSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
      <Select value={value} onValueChange={(v) => onChange(v as TimePeriod)}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
