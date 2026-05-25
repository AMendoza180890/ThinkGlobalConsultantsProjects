import { Progress } from "@/components/ui/progress";
import { WASC_DOMAINS } from "@/lib/accreditation";

interface FrictionIssueData {
  issueId: string;
  description: string;
  avgSeverity: number;
  count: number;
}

interface FrictionData {
  issues?: FrictionIssueData[];
}

interface Props {
  data: FrictionData;
  domainId: string;
}

export default function FrictionSummaryContent({ data, domainId }: Props) {
  const issues = data.issues ?? [];
  if (issues.length === 0) {
    return <p className="text-sm text-muted-foreground">No friction data available yet.</p>;
  }

  const sorted = [...issues].sort((a, b) => b.count - a.count);
  const topIssue = sorted[0];
  const totalReports = issues.reduce((s, i) => s + i.count, 0);
  const avgSeverity = Math.round((issues.reduce((s, i) => s + i.avgSeverity * i.count, 0) / totalReports) * 10) / 10;

  // Estimate hours (severity as proxy: ~0.5h per severity point per report)
  const avgHoursPerStaff = Math.round(avgSeverity * 0.5 * 10) / 10;
  const orgBurden = Math.round(avgHoursPerStaff * totalReports * 10) / 10;

  const domain = WASC_DOMAINS.find((d) => d.id === domainId);
  const top3 = sorted.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Stats table */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <span className="text-muted-foreground">Most reported friction type</span>
        <span className="font-medium">{topIssue.description} ({Math.round((topIssue.count / totalReports) * 100)}%)</span>
        <span className="text-muted-foreground">Avg severity</span>
        <span className="font-medium">{avgSeverity} / 5</span>
        <span className="text-muted-foreground">Avg hours/week lost</span>
        <span className="font-medium">{avgHoursPerStaff}h per staff member</span>
        <span className="text-muted-foreground">Est. org-wide burden</span>
        <span className="font-medium">{orgBurden}h this term</span>
        <span className="text-muted-foreground">WASC standard impacted</span>
        <span className="font-medium">{domain?.code} — {domain?.name}</span>
      </div>

      {/* Top 3 friction items */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Top Friction Drivers</h4>
        {top3.map((item) => (
          <div key={item.issueId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate">{item.description}</span>
              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                {item.avgSeverity}/5 · {Math.round((item.count / totalReports) * 100)}%
              </span>
            </div>
            <Progress
              value={(item.avgSeverity / 5) * 100}
              className="h-1.5"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
