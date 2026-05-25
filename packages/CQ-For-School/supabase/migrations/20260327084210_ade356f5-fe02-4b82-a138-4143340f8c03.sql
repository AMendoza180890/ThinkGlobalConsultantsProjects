-- Allow anon to update survey_tokens (mark as used)
CREATE POLICY "Anyone can mark tokens used" ON public.survey_tokens
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon to insert survey responses via token
CREATE POLICY "Token users can insert responses" ON public.survey_responses
  FOR INSERT TO anon
  WITH CHECK (true);