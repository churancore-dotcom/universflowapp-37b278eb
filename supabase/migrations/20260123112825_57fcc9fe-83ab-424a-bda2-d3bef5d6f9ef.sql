-- Fix the overly permissive donations INSERT policy
DROP POLICY IF EXISTS "Users can insert donations" ON public.donations;

-- Create a more restrictive policy - allow authenticated users to insert donations
CREATE POLICY "Authenticated users can insert donations"
  ON public.donations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);