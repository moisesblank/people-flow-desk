-- ============================================
-- PATCH: Otimizar update_user_activity para evitar UPDATE duplicados
-- ANTES: UPDATE a cada chamada (11/segundo detectado!)
-- DEPOIS: UPDATE apenas se last_activity_at > 1 minuto atrás
-- Redução estimada: ~95% dos updates eliminados
-- ============================================

CREATE OR REPLACE FUNCTION public.update_user_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _last_activity timestamp with time zone;
BEGIN
  -- Verificar última atividade ANTES de fazer UPDATE
  SELECT last_activity_at INTO _last_activity
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- PATCH-CUSTO: Só atualiza se passaram mais de 60 segundos
  -- Evita writes desnecessários quando atividade é recente
  IF _last_activity IS NULL OR (NOW() - _last_activity) > INTERVAL '60 seconds' THEN
    UPDATE public.profiles 
    SET last_activity_at = NOW(), is_online = true 
    WHERE id = auth.uid();
  END IF;
  
  -- Atualizar sessão também com mesma lógica
  UPDATE public.user_sessions 
  SET last_activity_at = NOW() 
  WHERE user_id = auth.uid() 
    AND is_active = true
    AND (last_activity_at IS NULL OR (NOW() - last_activity_at) > INTERVAL '60 seconds');
END;
$$;