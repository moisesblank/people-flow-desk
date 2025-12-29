-- Garantir permissões para anon e authenticated chamarem a função via RPC
GRANT EXECUTE ON FUNCTION public.force_logout_other_sessions(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.force_logout_other_sessions(TEXT) TO authenticated;