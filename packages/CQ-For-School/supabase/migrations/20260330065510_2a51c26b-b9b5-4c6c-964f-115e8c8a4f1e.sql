
-- Interventions tracking table
CREATE TABLE public.interventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  intervention_id TEXT NOT NULL,
  standard_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'recommended' CHECK (status IN ('recommended', 'planned', 'completed')),
  planned_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view school interventions"
  ON public.interventions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = interventions.school_id
    AND school_members.user_id = auth.uid()
    AND school_members.is_active = true
  ));

CREATE POLICY "Members can insert school interventions"
  ON public.interventions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = interventions.school_id
    AND school_members.user_id = auth.uid()
    AND school_members.is_active = true
  ));

CREATE POLICY "Members can update school interventions"
  ON public.interventions FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = interventions.school_id
    AND school_members.user_id = auth.uid()
    AND school_members.is_active = true
  ));

-- PD Sessions table
CREATE TABLE public.pd_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'workshop',
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_hours NUMERIC NOT NULL DEFAULT 1,
  meeting_link TEXT,
  target_group TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  standard_id TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pd_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view school pd sessions"
  ON public.pd_sessions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = pd_sessions.school_id
    AND school_members.user_id = auth.uid()
    AND school_members.is_active = true
  ));

CREATE POLICY "Members can insert school pd sessions"
  ON public.pd_sessions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = pd_sessions.school_id
    AND school_members.user_id = auth.uid()
    AND school_members.is_active = true
  ));

CREATE POLICY "Members can update school pd sessions"
  ON public.pd_sessions FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = pd_sessions.school_id
    AND school_members.user_id = auth.uid()
    AND school_members.is_active = true
  ));

-- PD Attendance table
CREATE TABLE public.pd_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.pd_sessions(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  attendee_user_id UUID,
  attended BOOLEAN NOT NULL DEFAULT true,
  certificate_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pd_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view school pd attendance"
  ON public.pd_attendance FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = pd_attendance.school_id
    AND school_members.user_id = auth.uid()
    AND school_members.is_active = true
  ));

CREATE POLICY "Members can insert school pd attendance"
  ON public.pd_attendance FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = pd_attendance.school_id
    AND school_members.user_id = auth.uid()
    AND school_members.is_active = true
  ));

CREATE POLICY "Members can update school pd attendance"
  ON public.pd_attendance FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = pd_attendance.school_id
    AND school_members.user_id = auth.uid()
    AND school_members.is_active = true
  ));
