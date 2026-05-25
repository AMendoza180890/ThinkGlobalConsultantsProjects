import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRootCauses, getRecommendations, getRootCauseSummary, type RootCause, type Recommendation } from "@/lib/interventionEngine";
import type { DomainRiskAssessment } from "@/lib/accreditation";
import type { SurveyResponse } from "@/lib/data";
import { AlertTriangle, Clock, Zap, Target, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { useAuth } from "@/hooks/useAuth";

interface InterventionsTabProps {
  assessment: DomainRiskAssessment;
  surveyResponses: SurveyResponse[];
}

const formatBadgeColor: Record<string, string> = {
  workshop: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  webinar: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  async: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
};

const impactColor: Record<string, string> = {
  High: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Low: "bg-muted text-muted-foreground",
};

export default function InterventionsTab({ assessment, surveyResponses }: InterventionsTabProps) {
  const { toast } = useToast();
  const { selectedSchoolId } = useSchoolContext();
  const { user } = useAuth();

  if (assessment.riskLevel === "low") {
    return (
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-medium">No interventions needed — this standard is performing well.</p>
        </div>
      </div>
    );
  }

  const rootCauses = getRootCauses(assessment.domain.id, surveyResponses);
  const recommendations = getRecommendations(rootCauses, assessment.domain.id);
  const primaryDriver = rootCauses[0];
  const secondaryDrivers = rootCauses.slice(1);

  if (!primaryDriver) {
    return (
      <div className="p-5">
        <p className="text-sm text-muted-foreground">
          Insufficient survey data to identify root causes for this standard. Continue collecting responses.
        </p>
      </div>
    );
  }

  const summary = getRootCauseSummary(primaryDriver);

  const handleMarkPlanned = async (rec: Recommendation) => {
    if (!selectedSchoolId || !user) {
      toast({ title: "Error", description: "You must be logged in and have a school selected.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("interventions").insert({
      school_id: selectedSchoolId,
      intervention_id: rec.intervention.id,
      standard_id: assessment.domain.code,
      status: "planned",
      planned_at: new Date().toISOString(),
      created_by: user.id,
    } as any);

    if (error) {
      toast({ title: "Error", description: "Failed to save intervention plan.", variant: "destructive" });
    } else {
      toast({ title: "Intervention planned", description: `"${rec.intervention.title}" added to your action plan.` });
    }
  };

  return (
    <div className="space-y-0">
      {/* Root Cause Block */}
      <div className="p-5 border-b space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Root Cause Analysis
        </h3>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            The primary driver of risk in <span className="font-semibold">{assessment.domain.name}</span> is{" "}
            <span className="text-red-600 dark:text-red-400 font-semibold">{primaryDriver.name}</span>
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Severity {primaryDriver.severity}/5
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {primaryDriver.prevalence}% of staff
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {primaryDriver.hoursPerWeek} hrs/week
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {primaryDriver.trendDirection}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>
          {secondaryDrivers.length > 0 && (
            <p className="text-xs text-muted-foreground/70 italic">
              Also contributing: {secondaryDrivers.map((d) => d.name).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recommended Interventions — ranked by impact and effort
        </h3>
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No matching interventions found in the library for these root causes.
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <Card key={rec.intervention.id} className="border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <h4 className="text-sm font-medium text-foreground">{rec.intervention.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.intervention.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className={`text-[10px] border-0 ${formatBadgeColor[rec.intervention.format]}`}>
                      {rec.intervention.format}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {rec.intervention.durationHours}h
                    </Badge>
                    <Badge className={`text-[10px] border-0 ${impactColor[rec.intervention.expectedImpact]}`}>
                      {rec.intervention.expectedImpact} impact
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {rec.intervention.wascAlignment}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-1 text-xs"
                    onClick={() => handleMarkPlanned(rec)}
                  >
                    Mark as planned
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
