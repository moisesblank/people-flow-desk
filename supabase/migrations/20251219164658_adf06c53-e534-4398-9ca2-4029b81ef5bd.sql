-- Remover policy permissiva que permite SELECT público
DROP POLICY IF EXISTS "social_media_metrics_select" ON public.social_media_metrics;

-- A policy social_media_select_admin já existe e restringe corretamente a owner/admin/marketing