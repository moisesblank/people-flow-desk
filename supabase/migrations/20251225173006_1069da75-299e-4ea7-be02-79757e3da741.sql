
-- ============================================
-- MIGRAÇÃO CRÍTICA: Corrigir políticas "true" perigosas
-- ============================================

-- 1. ACHIEVEMENTS - público para leitura é OK (badges de gamificação)
-- Manter mas documentar que é intencional

-- 2. API_RATE_LIMITS - Remover política "true" e criar correta
DROP POLICY IF EXISTS "Service role only api_rate_limits" ON public.api_rate_limits;
CREATE POLICY "api_rate_limits_service_only" ON public.api_rate_limits
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. BADGES - público para leitura é OK (gamificação)
-- Manter mas documentar

-- 4. BRANDING_SETTINGS - público para leitura é OK (configurações visuais)
-- Manter mas documentar

-- 5. CATEGORIES - público para leitura é OK (categorias de cursos)
-- Manter mas documentar

-- 6. COMPANY_MONTHLY_CLOSURES - CORRIGIR UPDATE true
DROP POLICY IF EXISTS "Authenticated users can update company monthly closures" ON public.company_monthly_closures;
CREATE POLICY "company_monthly_update_admin" ON public.company_monthly_closures
FOR UPDATE TO authenticated USING (is_admin_or_owner(auth.uid())) WITH CHECK (is_admin_or_owner(auth.uid()));

-- 7. COMPANY_YEARLY_CLOSURES - CORRIGIR UPDATE true
DROP POLICY IF EXISTS "Authenticated users can update company yearly closures" ON public.company_yearly_closures;
CREATE POLICY "company_yearly_update_admin" ON public.company_yearly_closures
FOR UPDATE TO authenticated USING (is_admin_or_owner(auth.uid())) WITH CHECK (is_admin_or_owner(auth.uid()));

-- 8. Adicionar comentários de segurança para políticas "true" intencionais
COMMENT ON POLICY "Achievements são públicos" ON public.achievements IS 'SEGURO: Badges de gamificação são públicos intencionalmente';
COMMENT ON POLICY "Badges são públicos" ON public.badges IS 'SEGURO: Conquistas são públicas intencionalmente';
COMMENT ON POLICY "Anyone can view branding" ON public.branding_settings IS 'SEGURO: Configurações visuais são públicas intencionalmente';
COMMENT ON POLICY "Categorias são públicas para leitura" ON public.categories IS 'SEGURO: Categorias de cursos são públicas intencionalmente';
