
-- learning_sessions: replaces pd_sessions for the new unified model
CREATE TABLE public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT NOT NULL DEFAULT 'school' CHECK (session_type IN ('platform', 'school')),
  format TEXT NOT NULL DEFAULT 'workshop' CHECK (format IN ('workshop', 'webinar', 'async')),
  standard_id TEXT,
  intervention_id UUID REFERENCES public.interventions(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_hours NUMERIC NOT NULL DEFAULT 1,
  meeting_link TEXT,
  target_group TEXT NOT NULL DEFAULT 'all',
  max_capacity INT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_sessions_school ON public.learning_sessions(school_id);
CREATE INDEX idx_learning_sessions_date ON public.learning_sessions(scheduled_date);
CREATE INDEX idx_learning_sessions_standard ON public.learning_sessions(standard_id);

ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view school sessions" ON public.learning_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.school_members WHERE school_members.school_id = learning_sessions.school_id AND school_members.user_id = auth.uid() AND school_members.is_active = true));

CREATE POLICY "Members can insert school sessions" ON public.learning_sessions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.school_members WHERE school_members.school_id = learning_sessions.school_id AND school_members.user_id = auth.uid() AND school_members.is_active = true));

CREATE POLICY "Members can update school sessions" ON public.learning_sessions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.school_members WHERE school_members.school_id = learning_sessions.school_id AND school_members.user_id = auth.uid() AND school_members.is_active = true));

-- session_registrations: staff sign-ups for sessions
CREATE TABLE public.session_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id),
  user_id UUID NOT NULL,
  registered_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'waitlisted')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_reg_session ON public.session_registrations(session_id);
CREATE INDEX idx_session_reg_user ON public.session_registrations(user_id);

ALTER TABLE public.session_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view school registrations" ON public.session_registrations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.school_members WHERE school_members.school_id = session_registrations.school_id AND school_members.user_id = auth.uid() AND school_members.is_active = true));

CREATE POLICY "Members can insert registrations" ON public.session_registrations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.school_members WHERE school_members.school_id = session_registrations.school_id AND school_members.user_id = auth.uid() AND school_members.is_active = true));

CREATE POLICY "Members can update registrations" ON public.session_registrations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.school_members WHERE school_members.school_id = session_registrations.school_id AND school_members.user_id = auth.uid() AND school_members.is_active = true));

-- session_attendance: actual attendance records per session
CREATE TABLE public.session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id),
  attendee_name TEXT NOT NULL,
  attendee_user_id UUID,
  attended BOOLEAN NOT NULL DEFAULT true,
  certificate_issued BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_att_session ON public.session_attendance(session_id);
CREATE INDEX idx_session_att_user ON public.session_attendance(attendee_user_id);

ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view school attendance" ON public.session_attendance FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.school_members WHERE school_members.school_id = session_attendance.school_id AND school_members.user_id = auth.uid() AND school_members.is_active = true));

CREATE POLICY "Members can insert school attendance" ON public.session_attendance FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.school_members WHERE school_members.school_id = session_attendance.school_id AND school_members.user_id = auth.uid() AND school_members.is_active = true));

CREATE POLICY "Members can update school attendance" ON public.session_attendance FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.school_members WHERE school_members.school_id = session_attendance.school_id AND school_members.user_id = auth.uid() AND school_members.is_active = true));

-- cpd_certificates: issued certificate records
CREATE TABLE public.cpd_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  attendance_id UUID REFERENCES public.session_attendance(id),
  staff_name TEXT NOT NULL,
  staff_user_id UUID,
  session_title TEXT NOT NULL,
  session_date TIMESTAMPTZ NOT NULL,
  duration_hours NUMERIC NOT NULL,
  standard_code TEXT,
  standard_name TEXT,
  school_name TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cpd_certs_school ON public.cpd_certificates(school_id);
CREATE INDEX idx_cpd_certs_session ON public.cpd_certificates(session_id);
CREATE INDEX idx_cpd_certs_staff ON public.cpd_certificates(staff_user_id);

ALTER TABLE public.cpd_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view school certificates" ON public.cpd_certificates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.school_members WHERE school_members.school_id = cpd_certificates.school_id AND school_members.user_id = auth.uid() AND school_members.is_active = true));

CREATE POLICY "Members can insert school certificates" ON public.cpd_certificates FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.school_members WHERE school_members.school_id = cpd_certificates.school_id AND school_members.user_id = auth.uid() AND school_members.is_active = true));
