import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "./useSchoolContext";

export interface AccreditationReport {
  id: string;
  school_id: string;
  generated_at: string;
  report_type: string;
  domain_scores: Record<string, number>;
  narrative_text: string;
  admin_notes: string;
  generated_by: string;
}

export function useAccreditationReports() {
  const { selectedSchoolId } = useSchoolContext();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["accreditation-reports", selectedSchoolId],
    queryFn: async () => {
      if (!selectedSchoolId) return [];
      const { data, error } = await supabase
        .from("accreditation_reports")
        .select("*")
        .eq("school_id", selectedSchoolId)
        .order("generated_at", { ascending: false });
      if (error) throw error;
      return data as AccreditationReport[];
    },
    enabled: !!selectedSchoolId,
  });

  const saveReport = useMutation({
    mutationFn: async (params: {
      reportType: string;
      domainScores: Record<string, number>;
      narrativeText: string;
      adminNotes: string;
      generatedBy: string;
    }) => {
      const { error } = await supabase.from("accreditation_reports").insert({
        school_id: selectedSchoolId,
        report_type: params.reportType,
        domain_scores: params.domainScores,
        narrative_text: params.narrativeText,
        admin_notes: params.adminNotes,
        generated_by: params.generatedBy,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accreditation-reports", selectedSchoolId] });
    },
  });

  return { reports, isLoading, saveReport };
}
