import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { INTERVENTION_LIBRARY } from "@/data/interventionLibrary";
import { WASC_DOMAINS } from "@/lib/accreditation";
import { getRecommendations, getRootCauses } from "@/lib/interventionEngine";
import { useSchoolData } from "@/hooks/useSchoolData";
import { useCPDEvidence } from "@/hooks/useCPDEvidence";
import { MOCK_INTERVENTION_GAP_TYPES } from "@/lib/cpdEvidenceStrength";
import { GapTypeBadge } from "@/components/accreditation/GapTypeBadge";
import PriorityActionsPanel from "@/components/accreditation/PriorityActionsPanel";
import { CheckCircle2, Clock, ListChecks, Download, Calendar, Play, UserCheck } from "lucide-react";
import ScheduleSessionPanel from "@/components/accreditation/ScheduleSessionPanel";
import AttendancePanel from "@/components/accreditation/AttendancePanel";

interface InterventionRecord {
  id: string;
  intervention_id: string;
  standard_id: string;
  status: string;
  planned_at: string | null;
  completed_at: string | null;
}

interface PDSession {
  id: string;
  intervention_id: string | null;
  title: string;
  format: string;
  scheduled_date: string;
  duration_hours: number;
  meeting_link: string | null;
  target_group: string;
  status: string;
  standard_id: string | null;
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

type GapFilterType = "all" | "coverage" | "distribution" | "alignment" | "compliance";

export default function InterventionActionPlan() {
  const { selectedSchoolId, schools } = useSchoolContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const schoolData = useSchoolData();
  const { priorityActions } = useCPDEvidence();
  const [interventions, setInterventions] = useState<InterventionRecord[]>([]);
  const [sessions, setSessions] = useState<PDSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleTarget, setScheduleTarget] = useState<InterventionRecord | null>(null);
  const [attendanceTarget, setAttendanceTarget] = useState<PDSession | null>(null);
  const [gapFilter, setGapFilter] = useState<GapFilterType>("all");

  const selectedSchool = schools?.find((s) => s.id === selectedSchoolId);

  useEffect(() => {
    if (!selectedSchoolId) return;
    loadData();
  }, [selectedSchoolId]);

  const loadData = async () => {
    if (!selectedSchoolId) return;
    const [intRes, sessRes] = await Promise.all([
      supabase.from("interventions").select("*").eq("school_id", selectedSchoolId) as any,
      supabase.from("pd_sessions").select("*").eq("school_id", selectedSchoolId) as any,
    ]);
    if (intRes.data) setInterventions(intRes.data);
    if (sessRes.data) setSessions(sessRes.data);
    setLoading(false);
  };

  const allRecommendations = useMemo(() => {
    const surveyResponses = schoolData.rawSurveyResponses;
    const recs: Array<{ intervention: typeof INTERVENTION_LIBRARY[0]; standardCode: string }> = [];
    WASC_DOMAINS.forEach((domain) => {
      const rootCauses = getRootCauses(domain.id, surveyResponses);
      if (rootCauses.length > 0) {
        const domainRecs = getRecommendations(rootCauses, domain.id);
        domainRecs.forEach((r) => {
          if (!recs.find((existing) => existing.intervention.id === r.intervention.id)) {
            recs.push({ intervention: r.intervention, standardCode: domain.code });
          }
        });
      }
    });
    return recs;
  }, [schoolData.rawSurveyResponses]);

  const planned = interventions.filter((i) => i.status === "planned");
  const completed = interventions.filter((i) => i.status === "completed");
  const plannedIds = new Set(interventions.map((i) => i.intervention_id));
  const recommended = allRecommendations.filter((r) => !plannedIds.has(r.intervention.id));

  // Filter recommended by gap type
  const filteredRecommended = gapFilter === "all"
    ? recommended
    : recommended.filter((r) => {
        const gapInfo = MOCK_INTERVENTION_GAP_TYPES[r.intervention.id];
        return gapInfo?.type === gapFilter;
      });

  const handleMarkPlanned = async (interventionId: string, standardCode: string) => {
    if (!selectedSchoolId || !user) return;
    const { error } = await supabase.from("interventions").insert({
      school_id: selectedSchoolId,
      intervention_id: interventionId,
      standard_id: standardCode,
      status: "planned",
      planned_at: new Date().toISOString(),
      created_by: user.id,
    } as any);
    if (!error) {
      toast({ title: "Intervention planned" });
      loadData();
    }
  };

  const handleMarkCompleted = async (id: string) => {
    const { error } = await supabase
      .from("interventions")
      .update({ status: "completed", completed_at: new Date().toISOString() } as any)
      .eq("id", id) as any;
    if (!error) {
      toast({ title: "Intervention completed" });
      loadData();
    }
  };

  const handleExportPlan = () => {
    const data = { planned, completed, recommended: recommended.map((r) => r.intervention) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "intervention-action-plan.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Plan exported" });
  };

  const getInterventionInfo = (interventionId: string) =>
    INTERVENTION_LIBRARY.find((i) => i.id === interventionId);

  const getSessionForIntervention = (interventionDbId: string) =>
    sessions.find((s) => s.intervention_id === interventionDbId && s.status === "scheduled");

  if (loading || schoolData.isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const standardsAddressed = new Set([
    ...planned.map((p) => p.standard_id),
    ...completed.map((c) => c.standard_id),
  ]).size;

  const GAP_FILTERS: { value: GapFilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "coverage", label: "Coverage" },
    { value: "distribution", label: "Distribution" },
    { value: "alignment", label: "Alignment" },
    { value: "compliance", label: "Compliance" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Intervention Action Plan</h1>
          <p className="text-muted-foreground mt-1">Plan, track, and complete interventions aligned to WASC standards</p>
        </div>
        <Button onClick={handleExportPlan} variant="outline">
          <Download className="h-4 w-4 mr-2" /> Export plan
        </Button>
      </div>


      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <ListChecks className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{planned.length}</p>
            <p className="text-xs text-muted-foreground">Planned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-2xl font-bold">{completed.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{standardsAddressed}</p>
            <p className="text-xs text-muted-foreground">Standards Addressed</p>
          </CardContent>
        </Card>
      </div>

      {/* Four-column kanban */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Priority */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Priority</h3>
          <PriorityActionsPanel
            actions={priorityActions}
            onMarkPlanned={(action) => {
              const standardCode = action.standardCode;
              const recMatch = allRecommendations.find((r) => r.standardCode === standardCode);
              if (recMatch) {
                handleMarkPlanned(recMatch.intervention.id, standardCode);
              }
            }}
          />
        </div>
        {/* Recommended */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recommended</h3>
          {/* Gap type filter */}
          <div className="flex gap-1 flex-wrap">
            {GAP_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={gapFilter === f.value ? "default" : "outline"}
                className="text-[10px] h-6 px-2"
                onClick={() => setGapFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          {filteredRecommended.length === 0 && <p className="text-xs text-muted-foreground">No recommendations match this filter.</p>}
          {filteredRecommended.map((rec) => {
            const gapInfo = MOCK_INTERVENTION_GAP_TYPES[rec.intervention.id];
            return (
              <Card key={rec.intervention.id} className="border">
                <CardContent className="p-4 space-y-2">
                  <h4 className="text-sm font-medium">{rec.intervention.title}</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge className={`text-[10px] border-0 ${formatBadgeColor[rec.intervention.format]}`}>{rec.intervention.format}</Badge>
                    <Badge variant="outline" className="text-[10px]">{rec.intervention.durationHours}h</Badge>
                    <Badge variant="outline" className="text-[10px]">{rec.standardCode}</Badge>
                    <Badge className={`text-[10px] border-0 ${impactColor[rec.intervention.expectedImpact]}`}>{rec.intervention.expectedImpact}</Badge>
                  </div>
                  {gapInfo && (
                    <div className="space-y-1">
                      <GapTypeBadge type={gapInfo.type} />
                      <p className="text-[11px] text-muted-foreground leading-snug">{gapInfo.reason}</p>
                    </div>
                  )}
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => handleMarkPlanned(rec.intervention.id, rec.standardCode)}>
                    Mark as planned
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Planned */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Planned</h3>
          {planned.length === 0 && <p className="text-xs text-muted-foreground">No planned interventions yet.</p>}
          {planned.map((item) => {
            const info = getInterventionInfo(item.intervention_id);
            if (!info) return null;
            const session = getSessionForIntervention(item.id);
            return (
              <Card key={item.id} className="border border-amber-200 dark:border-amber-800">
                <CardContent className="p-4 space-y-2">
                  <h4 className="text-sm font-medium">{info.title}</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge className={`text-[10px] border-0 ${formatBadgeColor[info.format]}`}>{info.format}</Badge>
                    <Badge variant="outline" className="text-[10px]">{info.durationHours}h</Badge>
                    <Badge variant="outline" className="text-[10px]">{item.standard_id}</Badge>
                    <Badge className={`text-[10px] border-0 ${impactColor[info.expectedImpact]}`}>{info.expectedImpact}</Badge>
                  </div>
                  {session ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Scheduled: {new Date(session.scheduled_date).toLocaleDateString()}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => setAttendanceTarget(session)}
                      >
                        <UserCheck className="h-3 w-3 mr-1" /> Record attendance
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => setScheduleTarget(item)}
                      >
                        <Play className="h-3 w-3 mr-1" /> Schedule session
                      </Button>
                      <Button size="sm" className="w-full text-xs" onClick={() => handleMarkCompleted(item.id)}>
                        Mark as completed
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Completed */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completed</h3>
          {completed.length === 0 && <p className="text-xs text-muted-foreground">No completed interventions yet.</p>}
          {completed.map((item) => {
            const info = getInterventionInfo(item.intervention_id);
            if (!info) return null;
            return (
              <Card key={item.id} className="border border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4 space-y-2">
                  <h4 className="text-sm font-medium">{info.title}</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge className={`text-[10px] border-0 ${formatBadgeColor[info.format]}`}>{info.format}</Badge>
                    <Badge variant="outline" className="text-[10px]">{info.durationHours}h</Badge>
                    <Badge variant="outline" className="text-[10px]">{item.standard_id}</Badge>
                    <Badge className={`text-[10px] border-0 ${impactColor[info.expectedImpact]}`}>{info.expectedImpact}</Badge>
                  </div>
                  {item.completed_at && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Completed: {new Date(item.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Schedule Session Panel */}
      {scheduleTarget && (() => {
        const info = getInterventionInfo(scheduleTarget.intervention_id);
        if (!info) return null;
        return (
          <ScheduleSessionPanel
            interventionTitle={info.title}
            interventionFormat={info.format}
            interventionDurationHours={info.durationHours}
            interventionDbId={scheduleTarget.id}
            standardId={scheduleTarget.standard_id}
            onClose={() => setScheduleTarget(null)}
            onSaved={loadData}
          />
        );
      })()}

      {/* Attendance Panel */}
      {attendanceTarget && (
        <AttendancePanel
          sessionId={attendanceTarget.id}
          sessionTitle={attendanceTarget.title}
          sessionDate={attendanceTarget.scheduled_date}
          durationHours={attendanceTarget.duration_hours}
          standardId={attendanceTarget.standard_id ?? ""}
          schoolName={selectedSchool?.name ?? "School"}
          interventionDbId={attendanceTarget.intervention_id ?? undefined}
          onClose={() => setAttendanceTarget(null)}
          onCompleted={loadData}
        />
      )}
    </div>
  );
}
