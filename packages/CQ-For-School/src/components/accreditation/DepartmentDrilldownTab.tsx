import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MOCK_DEPARTMENT_BREAKDOWN, MOCK_UNASSIGNED_ROW, type DepartmentBreakdown } from "@/lib/cpdEvidenceStrength";

const SCHOOL_LEVELS = ["All", "Elementary", "Middle School", "High School"] as const;

function cpdPillColor(score: number) {
  if (score < 0) return "bg-muted text-muted-foreground";
  if (score < 50) return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  if (score < 75) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
}

export default function DepartmentDrilldownTab() {
  const navigate = useNavigate();
  const [levelFilter, setLevelFilter] = useState<string>("All");

  const rows: DepartmentBreakdown[] = [...MOCK_DEPARTMENT_BREAKDOWN, MOCK_UNASSIGNED_ROW];

  // Filter mock: in real data this would filter by school level
  const filtered = levelFilter === "All" ? rows : rows.filter((r) => r.department.toLowerCase().includes(levelFilter.toLowerCase()) || r.department === "Unassigned");

  const handleAction = (row: DepartmentBreakdown) => {
    if (row.actionRoute) {
      navigate(row.actionRoute);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        By Department
      </h3>

      {/* Level filter */}
      <div className="flex gap-1.5 flex-wrap">
        {SCHOOL_LEVELS.map((level) => (
          <Button
            key={level}
            size="sm"
            variant={levelFilter === level ? "default" : "outline"}
            className="text-xs h-7 px-3"
            onClick={() => setLevelFilter(level)}
          >
            {level}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Department</th>
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground">CPD Evidence</th>
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Completion</th>
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Key Gap</th>
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((row) => (
              <tr key={row.department} className="hover:bg-muted/30">
                <td className="px-3 py-2.5 font-medium text-foreground">{row.department}</td>
                <td className="px-3 py-2.5">
                  <Badge className={`text-[10px] border-0 ${cpdPillColor(row.cpdScore)}`}>
                    {row.cpdScore >= 0 ? `${row.cpdScore} / 100` : "—"}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {row.completionRate >= 0 ? `${row.completionRate}%` : "—"}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground text-xs">{row.keyGap}</td>
                <td className="px-3 py-2.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-6 px-2"
                    onClick={() => handleAction(row)}
                  >
                    {row.actionLabel}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground italic">
        Departments with fewer than 5 staff are not shown to protect individual privacy.
      </p>
    </div>
  );
}
