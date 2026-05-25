CREATE TABLE public.survey_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  school_id uuid NOT NULL REFERENCES public.schools(id),
  week text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week)
);

ALTER TABLE public.survey_tokens ENABLE ROW LEVEL SECURITY;

-- No RLS needed for direct access - edge function uses service role
-- But allow token lookup from anon for the survey page
CREATE POLICY "Anyone can look up tokens" ON public.survey_tokens
  FOR SELECT TO anon, authenticated
  USING (true);