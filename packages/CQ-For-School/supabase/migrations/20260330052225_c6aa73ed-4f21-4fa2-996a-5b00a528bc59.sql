
-- Table for saved reports
CREATE TABLE public.accreditation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  report_type TEXT NOT NULL DEFAULT 'wasc',
  domain_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  narrative_text TEXT NOT NULL,
  admin_notes TEXT DEFAULT '',
  generated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.accreditation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view school reports"
  ON public.accreditation_reports FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = accreditation_reports.school_id
      AND school_members.user_id = auth.uid()
      AND school_members.is_active = true
  ));

CREATE POLICY "Members can insert school reports"
  ON public.accreditation_reports FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = accreditation_reports.school_id
      AND school_members.user_id = auth.uid()
      AND school_members.is_active = true
  ));

-- Table for school settings (review date etc.)
CREATE TABLE public.school_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE UNIQUE,
  next_review_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view school settings"
  ON public.school_settings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_settings.school_id
      AND school_members.user_id = auth.uid()
      AND school_members.is_active = true
  ));

CREATE POLICY "Members can upsert school settings"
  ON public.school_settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_settings.school_id
      AND school_members.user_id = auth.uid()
      AND school_members.is_active = true
  ));

CREATE POLICY "Members can update school settings"
  ON public.school_settings FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = school_settings.school_id
      AND school_members.user_id = auth.uid()
      AND school_members.is_active = true
  ));
