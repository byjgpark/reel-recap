-- Fix ip_usage.ip_address column: TEXT -> INET to match other tables
-- This resolves "operator does not exist: text = inet" error in process_authenticated_request
ALTER TABLE public.ip_usage
  ALTER COLUMN ip_address TYPE INET USING ip_address::inet;
