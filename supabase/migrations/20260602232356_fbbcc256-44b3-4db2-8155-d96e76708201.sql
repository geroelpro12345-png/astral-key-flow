
ALTER FUNCTION public.touch_updated_at() SECURITY INVOKER SET search_path = public;
ALTER FUNCTION public.create_tracker_for_report() SECURITY INVOKER SET search_path = public;
ALTER FUNCTION public.log_tracker_stage_change() SECURITY INVOKER SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_tracker_for_report() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_tracker_stage_change() FROM PUBLIC, anon, authenticated;
