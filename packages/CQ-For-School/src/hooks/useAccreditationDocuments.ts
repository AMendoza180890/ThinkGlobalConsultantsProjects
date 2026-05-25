import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "./useSchoolContext";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface AccreditationDocument {
  id: string;
  school_id: string;
  domain_id: string;
  file_name: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
}

export function useAccreditationDocuments() {
  const { selectedSchoolId } = useSchoolContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["accreditation-documents", selectedSchoolId],
    queryFn: async () => {
      if (!selectedSchoolId) return [];
      const { data, error } = await supabase
        .from("accreditation_documents")
        .select("*")
        .eq("school_id", selectedSchoolId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AccreditationDocument[];
    },
    enabled: !!selectedSchoolId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ domainId, file }: { domainId: string; file: File }) => {
      if (!selectedSchoolId || !user) throw new Error("Not authenticated");

      const filePath = `${selectedSchoolId}/${domainId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("accreditation-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("accreditation_documents")
        .insert({
          school_id: selectedSchoolId,
          domain_id: domainId,
          file_name: file.name,
          file_path: filePath,
          uploaded_by: user.id,
        });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accreditation-documents", selectedSchoolId] });
      toast({ title: "Document uploaded", description: "Evidence document saved successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: AccreditationDocument) => {
      const { error: storageError } = await supabase.storage
        .from("accreditation-documents")
        .remove([doc.file_path]);
      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from("accreditation_documents")
        .delete()
        .eq("id", doc.id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accreditation-documents", selectedSchoolId] });
      toast({ title: "Document removed" });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const getDocumentsForDomain = (domainId: string) =>
    documents.filter((d) => d.domain_id === domainId);

  return {
    documents,
    isLoading,
    uploadDocument: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    getDocumentsForDomain,
  };
}
