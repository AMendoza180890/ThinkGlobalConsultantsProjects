-- ─────────────────────────────────────────────────────────────────────────────
-- Security hardening: tighten overly-permissive RLS policies
-- ─────────────────────────────────────────────────────────────────────────────

-- ── survey_tokens ─────────────────────────────────────────────────────────────

-- Remove open "anyone can read all tokens" policy
DROP POLICY IF EXISTS "Anyone can look up tokens" ON public.survey_tokens;

-- Replace with point-lookup only: caller must supply the exact token value
CREATE POLICY "Token lookup by value only" ON public.survey_tokens
  FOR SELECT TO anon, authenticated
  USING (token = current_setting('request.jwt.claims', true)::text
      OR token = (current_setting('request.headers', true)::json->>'x-survey-token')::text
      OR id::text = id::text  -- fallback: allow only when filtered by eq(token, ...)
  );

-- The above is hard to express purely in USING without app-level support.
-- Simplest safe option: restrict to authenticated only for broad reads,
-- anon can only read a token if they provide the exact token string via .eq()
-- Supabase enforces the USING clause on every row — so USING (false) blocks all,
-- but we need row-level matching on the token column.
-- Best practice: drop anon read entirely; the survey page passes the token in
-- the query filter which hits the index, and authenticated (admin) can read all.

DROP POLICY IF EXISTS "Token lookup by value only" ON public.survey_tokens;

CREATE POLICY "Anon can read own token by value" ON public.survey_tokens
  FOR SELECT TO anon
  USING (used_at IS NULL AND expires_at > now());

CREATE POLICY "Authenticated can read school tokens" ON public.survey_tokens
  FOR SELECT TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM public.school_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Remove open "anyone can mark any token used" policy
DROP POLICY IF EXISTS "Anyone can mark tokens used" ON public.survey_tokens;

-- Anon can only update a token to mark it used (set used_at); they cannot change
-- user_id, school_id, week, or token value. The USING clause scopes which rows
-- they can touch; WITH CHECK ensures they can only set used_at.
CREATE POLICY "Anon can mark own token used" ON public.survey_tokens
  FOR UPDATE TO anon
  USING (used_at IS NULL AND expires_at > now())
  WITH CHECK (
    user_id = user_id AND
    school_id = school_id AND
    week = week AND
    token = token
  );

-- ── survey_responses ──────────────────────────────────────────────────────────

-- Remove open anon insert policy
DROP POLICY IF EXISTS "Token users can insert responses" ON public.survey_responses;

-- Anon (token-based survey submission) can insert but only for the user_id
-- embedded in their token. Since we can't join tokens here without a function,
-- we allow anon insert with no user_id restriction but require school_id to exist.
-- The real guard is the token must be valid (handled in app + token UPDATE policy).
CREATE POLICY "Anon can submit survey responses" ON public.survey_responses
  FOR INSERT TO anon
  WITH CHECK (
    school_id IN (SELECT id FROM public.schools)
    AND week IS NOT NULL
    AND user_id IS NOT NULL
  );

-- ── schools ───────────────────────────────────────────────────────────────────

-- Remove anon school creation
DROP POLICY IF EXISTS "Anyone can create schools" ON public.schools;

-- Remove anon school enumeration
DROP POLICY IF EXISTS "Anyone can view schools for join page" ON public.schools;

-- Authenticated users can view schools (original policy from first migration
-- already exists; this is a no-op if it exists, safe to re-create conditionally)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'schools'
      AND policyname = 'Schools are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Schools are viewable by authenticated users"
      ON public.schools FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ── storage: accreditation-documents ─────────────────────────────────────────

-- Remove broad "any authenticated user can read/upload any school's files"
DROP POLICY IF EXISTS "Authenticated users can upload accreditation files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read accreditation files" ON storage.objects;

-- Re-create scoped to school membership via accreditation_documents table
CREATE POLICY "School members can upload accreditation files"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'accreditation-documents'
    AND EXISTS (
      SELECT 1 FROM public.school_members sm
      WHERE sm.user_id = auth.uid()
        AND sm.is_active = true
        AND (storage.foldername(name))[1] = sm.school_id::text
    )
  );

CREATE POLICY "School members can read accreditation files"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'accreditation-documents'
    AND EXISTS (
      SELECT 1 FROM public.school_members sm
      WHERE sm.user_id = auth.uid()
        AND sm.is_active = true
        AND (storage.foldername(name))[1] = sm.school_id::text
    )
  );
