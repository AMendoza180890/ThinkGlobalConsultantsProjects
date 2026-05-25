CREATE POLICY "Anyone can view schools for join page"
ON public.schools
FOR SELECT
TO anon
USING (true);