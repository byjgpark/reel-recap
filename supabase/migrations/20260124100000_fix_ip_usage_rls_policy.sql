-- Fix overly permissive RLS policy on ip_usage table
-- The previous policy "Service role full access to ip_usage" used USING (true)
-- which allowed ALL users (including anon/authenticated) full access.
-- This was inconsistent with the fix applied to other tables in 20251223_security_fixes.sql
--
-- The service_role bypasses RLS automatically, so it doesn't need an explicit policy.
-- We need to remove the dangerous policy and revoke direct table access.

-- Remove the dangerous "allow all" policy
DROP POLICY IF EXISTS "Service role full access to ip_usage" ON public.ip_usage;

-- Revoke all permissions from anon and authenticated roles
-- The ip_usage table should only be accessed via SECURITY DEFINER functions
REVOKE ALL ON public.ip_usage FROM anon;
REVOKE ALL ON public.ip_usage FROM authenticated;

-- Ensure service_role has access (it bypasses RLS, but explicit GRANT for clarity)
GRANT ALL ON public.ip_usage TO service_role;

-- Add a restrictive policy that denies all direct access
-- (RLS is already enabled on the table, this ensures no access without service_role)
DROP POLICY IF EXISTS "Deny direct access to ip_usage" ON public.ip_usage;
CREATE POLICY "Deny direct access to ip_usage" ON public.ip_usage
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Add comment documenting the security fix
COMMENT ON TABLE public.ip_usage IS 'IP-based usage tracking. Direct access denied - use SECURITY DEFINER functions only. Security fix applied 2026-01-24.';
