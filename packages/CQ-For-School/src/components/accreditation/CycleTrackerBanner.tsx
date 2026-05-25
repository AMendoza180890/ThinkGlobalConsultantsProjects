import { useState } from "react";
import { differenceInDays, format } from "date-fns";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { useAccreditationData } from "@/hooks/useAccreditationData";
import { useAccreditationReports } from "@/hooks/useAccreditationReports";
import { DOCUMENT_ONLY_DOMAIN_IDS } from "@/lib/accreditation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Target, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CycleTrackerBanner() {
  const { settings, upsertReviewDate } = useSchoolSettings();
  const { summary } = useAccreditationData();
  const { reports } = useAccreditationReports();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);

  const reviewDate = settings?.next_review_date ? new Date(settings.next_review_date) : null;

  const handleSetDate = (d: Date | undefined) => {
    if (!d) return;
    setDate(d);
    upsertReviewDate.mutate(format(d, "yyyy-MM-dd"), {
      onSuccess: () => {
        toast({ title: "Review date saved" });
        setOpen(false);
      },
      onError: () => toast({ title: "Failed to save date", variant: "destructive" }),
    });
  };

  // Compute readiness
  const { domainAssessments } = summary;
  const readyCount = domainAssessments.filter(d => d.riskLevel === "low" || d.riskLevel === "medium").length;
  const readinessScore = domainAssessments.length > 0
    ? Math.round((readyCount / domainAssessments.length) * 100)
    : 0;

  // Compute priorities
  const priorities: string[] = [];
  const highRiskCount = domainAssessments.filter(d => d.riskLevel === "high").length;
  const surveyDomains = domainAssessments.filter(d => !DOCUMENT_ONLY_DOMAIN_IDS.includes(d.domain.id));
  const noEvidence = surveyDomains.filter(d => d.evidenceCount === 0).length;

  if (highRiskCount > 0) priorities.push(`${highRiskCount} standard${highRiskCount > 1 ? "s" : ""} at high risk`);
  if (noEvidence > 0) priorities.push(`${noEvidence} standard${noEvidence > 1 ? "s" : ""} need evidence`);
  if (reports.length === 0) priorities.push("1 report to generate");

  if (!reviewDate) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Set your ACS WASC review date</p>
            <p className="text-xs text-muted-foreground">Track readiness and countdown to your next review</p>
          </div>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-3 w-3 mr-1" /> Set date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSetDate}
              disabled={(d) => d < new Date()}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  const daysUntil = differenceInDays(reviewDate, new Date());

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Days until review */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-full p-2",
            daysUntil <= 30 ? "bg-red-100 dark:bg-red-900/30" :
            daysUntil <= 90 ? "bg-amber-100 dark:bg-amber-900/30" :
            "bg-emerald-100 dark:bg-emerald-900/30"
          )}>
            <Clock className={cn(
              "h-4 w-4",
              daysUntil <= 30 ? "text-red-600 dark:text-red-400" :
              daysUntil <= 90 ? "text-amber-600 dark:text-amber-400" :
              "text-emerald-600 dark:text-emerald-400"
            )} />
          </div>
          <div>
            <p className={cn(
              "text-2xl font-bold",
              daysUntil <= 30 ? "text-red-600 dark:text-red-400" :
              daysUntil <= 90 ? "text-amber-600 dark:text-amber-400" :
              "text-emerald-600 dark:text-emerald-400"
            )}>
              {daysUntil > 0 ? daysUntil : 0}
            </p>
            <p className="text-xs text-muted-foreground">
              days until review · {format(reviewDate, "MMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Readiness score */}
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-primary/10">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{readinessScore}%</p>
            <p className="text-xs text-muted-foreground">readiness score</p>
          </div>
        </div>

        {/* Priority list */}
        <div className="flex items-start gap-3">
          <div className="rounded-full p-2 bg-amber-100 dark:bg-amber-900/30 mt-0.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Priorities</p>
            {priorities.length === 0 ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">All caught up!</p>
            ) : (
              <ul className="space-y-0.5">
                {priorities.slice(0, 3).map((p, i) => (
                  <li key={i} className="text-xs text-foreground">• {p}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
