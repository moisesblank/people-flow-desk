-- Permitir que gestão (owner/admin) possa inserir/atualizar overlay no system_settings
-- Policy para INSERT de configurações de overlay
CREATE POLICY "Gestao pode inserir config overlay"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (
  setting_key = 'video_overlay_url' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Policy para UPDATE de configurações de overlay  
CREATE POLICY "Gestao pode atualizar config overlay"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (
  setting_key = 'video_overlay_url' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  setting_key = 'video_overlay_url' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);