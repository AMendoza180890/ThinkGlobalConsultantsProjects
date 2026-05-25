CREATE POLICY "Anyone can create schools"
ON public.schools FOR INSERT
TO anon
WITH CHECK (true);