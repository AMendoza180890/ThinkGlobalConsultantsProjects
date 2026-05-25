import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "./useSchoolContext";

export interface SchoolSettings {
  id: string;
  school_id: string;
  next_review_date: string | null;
  updated_at: string;
}

export function useSchoolSettings() {
  const { selectedSchoolId } = useSchoolContext();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["school-settings", selectedSchoolId],
    queryFn: async () => {
      if (!selectedSchoolId) return null;
      const { data, error } = await supabase
        .from("school_settings")
        .select("*")
        .eq("school_id", selectedSchoolId)
        .maybeSingle();
      if (error) throw error;
      return data as SchoolSettings | null;
    },
    enabled: !!selectedSchoolId,
  });

  const upsertReviewDate = useMutation({
    mutationFn: async (date: string) => {
      // Try update first, then insert
      const { data: existing } = await supabase
        .from("school_settings")
        .select("id")
        .eq("school_id", selectedSchoolId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("school_settings")
          .update({ next_review_date: date, updated_at: new Date().toISOString() })
          .eq("school_id", selectedSchoolId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("school_settings")
          .insert({ school_id: selectedSchoolId, next_review_date: date });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-settings", selectedSchoolId] });
    },
  });

  return { settings, isLoading, upsertReviewDate };
}
