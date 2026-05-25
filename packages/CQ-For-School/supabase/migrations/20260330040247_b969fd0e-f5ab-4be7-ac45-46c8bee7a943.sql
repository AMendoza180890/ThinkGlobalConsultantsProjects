
-- Create storage bucket for accreditation documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('accreditation-documents', 'accreditation-documents', false);

-- Create table for tracking uploaded accreditation documents
CREATE TABLE public.accreditation_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  domain_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accreditation_documents ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can view documents for their school
CREATE POLICY "Members can view school accreditation docs"
  ON public.accreditation_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.school_members
      WHERE school_members.school_id = accreditation_documents.school_id
        AND school_members.user_id = auth.uid()
        AND school_members.is_active = true
    )
  );

-- RLS: authenticated users can insert documents for their school
CREATE POLICY "Members can upload accreditation docs"
  ON public.accreditation_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.school_members
      WHERE school_members.school_id = accreditation_documents.school_id
        AND school_members.user_id = auth.uid()
        AND school_members.is_active = true
    )
  );

-- RLS: users can delete their own uploads
CREATE POLICY "Users can delete own accreditation docs"
  ON public.accreditation_documents
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Storage RLS: allow authenticated uploads
CREATE POLICY "Authenticated users can upload accreditation files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'accreditation-documents');

-- Storage RLS: allow reading files from same school
CREATE POLICY "Authenticated users can read accreditation files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'accreditation-documents');

-- Storage RLS: allow deleting own files
CREATE POLICY "Users can delete own accreditation files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'accreditation-documents');
