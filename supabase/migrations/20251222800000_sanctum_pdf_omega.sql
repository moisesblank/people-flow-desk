-- ============================================
-- 🌌 SANCTUM 3.0 — PROTECT PDF OMEGA
-- PROTEÇÃO TOTAL DE CONTEÚDO DIGITAL
-- ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
-- ============================================
-- 
-- 📍 MAPA DE URLs DEFINITIVO:
--   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ (viewer)
--   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (beta)
--   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao (funcionario)
--   👑 OWNER: TODAS (owner = moisesblank@gmail.com = MASTER)
--
-- ============================================

-- ============================================
-- PARTE 1: TABELAS DE ASSETS
-- ============================================

-- 1.1 Assets (PDFs, livros, imagens premium)
CREATE TABLE IF NOT EXISTS public.ena_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('pdf', 'web_text', 'image', 'attachment')),
  title TEXT,
  description TEXT,
  
  -- Storage
  raw_bucket TEXT NOT NULL DEFAULT 'ena-assets-raw',
  raw_path TEXT NOT NULL,
  transmuted_bucket TEXT NOT NULL DEFAULT 'ena-assets-transmuted',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'failed')),
  page_count INT DEFAULT 0,
  sha256 TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  
  -- Controle de acesso
  required_role TEXT DEFAULT 'beta',
  is_premium BOOLEAN DEFAULT true,
  
  -- Relação com curso/aula (opcional)
  course_id UUID,
  lesson_id UUID,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ena_assets IS 'Assets protegidos do sistema (PDFs, textos, imagens)';

-- 1.2 Páginas de assets (PDFs transmutados em imagens)
CREATE TABLE IF NOT EXISTS public.ena_asset_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.ena_assets(id) ON DELETE CASCADE,
  page_index INT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Dimensões
  width INT,
  height INT,
  bytes INT,
  format TEXT DEFAULT 'webp',
  
  -- Watermark queimada no servidor
  watermark_burned BOOLEAN DEFAULT false,
  watermark_text TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(asset_id, page_index)
);

COMMENT ON TABLE public.ena_asset_pages IS 'Páginas renderizadas dos assets (imagens webp/avif)';

-- 1.3 Fila de jobs de transmutação
CREATE TABLE IF NOT EXISTS public.sanctum_jobs_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('transmute_pdf', 'rebuild_watermark', 'purge_asset', 'generate_text_pages')),
  payload JSONB NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'dead')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  last_error TEXT,
  
  -- Lock para processamento
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  run_after TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.sanctum_jobs_queue IS 'Fila de jobs de transmutação de PDFs';

-- 1.4 Estado de risco de segurança (por usuário)
CREATE TABLE IF NOT EXISTS public.sanctum_risk_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_score INT NOT NULL DEFAULT 0,
  last_event_at TIMESTAMPTZ,
  locked_until TIMESTAMPTZ,
  lock_reason TEXT,
  total_violations INT NOT NULL DEFAULT 0,
  total_access INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sanctum_risk_state IS 'Estado de risco de segurança por usuário (locks automáticos)';

-- 1.5 Acesso a assets (forense completo)
CREATE TABLE IF NOT EXISTS public.sanctum_asset_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Usuário
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_role TEXT,
  session_id TEXT,
  
  -- Asset
  asset_id UUID REFERENCES public.ena_assets(id),
  asset_kind TEXT,
  
  -- Ação
  action TEXT NOT NULL, -- 'manifest_issued', 'page_viewed', 'violation_detected', 'protected_surface_opened'
  
  -- Contexto de rede (hashed para privacidade)
  ip_hash TEXT,
  ua_hash TEXT,
  domain TEXT,
  route TEXT,
  
  -- Metadados extras
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.sanctum_asset_access IS 'Log forense de acesso a assets protegidos';

-- ============================================
-- PARTE 2: ÍNDICES OTIMIZADOS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ena_assets_status ON public.ena_assets(status);
CREATE INDEX IF NOT EXISTS idx_ena_assets_kind ON public.ena_assets(kind);
CREATE INDEX IF NOT EXISTS idx_ena_assets_created_by ON public.ena_assets(created_by);
CREATE INDEX IF NOT EXISTS idx_ena_assets_course ON public.ena_assets(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ena_assets_lesson ON public.ena_assets(lesson_id) WHERE lesson_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ena_asset_pages_asset ON public.ena_asset_pages(asset_id);
CREATE INDEX IF NOT EXISTS idx_ena_asset_pages_asset_page ON public.ena_asset_pages(asset_id, page_index);

CREATE INDEX IF NOT EXISTS idx_sanctum_jobs_status ON public.sanctum_jobs_queue(status, run_after);
CREATE INDEX IF NOT EXISTS idx_sanctum_jobs_locked ON public.sanctum_jobs_queue(locked_at) WHERE locked_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sanctum_risk_user ON public.sanctum_risk_state(user_id);
CREATE INDEX IF NOT EXISTS idx_sanctum_risk_locked ON public.sanctum_risk_state(locked_until) WHERE locked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sanctum_risk_score ON public.sanctum_risk_state(risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_sanctum_access_user ON public.sanctum_asset_access(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sanctum_access_asset ON public.sanctum_asset_access(asset_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sanctum_access_action ON public.sanctum_asset_access(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sanctum_access_violations ON public.sanctum_asset_access(user_id, created_at DESC) 
  WHERE action = 'violation_detected';

-- ============================================
-- PARTE 3: FUNÇÕES
-- ============================================

-- 3.1 Aplicar risco após violação detectada
CREATE OR REPLACE FUNCTION public.fn_apply_sanctum_risk()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_score INT;
  lock_until TIMESTAMPTZ;
  severity_value INT;
BEGIN
  -- Só processa se tiver user_id
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Extrair severidade do metadata
  severity_value := COALESCE((NEW.metadata->>'severity')::INT, 10);
  
  -- Inserir ou atualizar estado de risco
  INSERT INTO public.sanctum_risk_state(user_id, risk_score, last_event_at, total_violations)
  VALUES (NEW.user_id, severity_value, now(), 1)
  ON CONFLICT (user_id) DO UPDATE SET
    risk_score = public.sanctum_risk_state.risk_score + severity_value,
    last_event_at = now(),
    total_violations = public.sanctum_risk_state.total_violations + 1,
    updated_at = now();
  
  -- Buscar score atualizado
  SELECT risk_score INTO new_score 
  FROM public.sanctum_risk_state 
  WHERE user_id = NEW.user_id;
  
  -- Aplicar lock baseado no score (escalonado)
  IF new_score >= 300 THEN
    lock_until := now() + INTERVAL '24 hours';
    UPDATE public.sanctum_risk_state 
    SET locked_until = lock_until, lock_reason = 'CRITICAL_RISK_SCORE_300+', updated_at = now() 
    WHERE user_id = NEW.user_id;
  ELSIF new_score >= 200 THEN
    lock_until := now() + INTERVAL '6 hours';
    UPDATE public.sanctum_risk_state 
    SET locked_until = lock_until, lock_reason = 'HIGH_RISK_SCORE_200+', updated_at = now() 
    WHERE user_id = NEW.user_id;
  ELSIF new_score >= 150 THEN
    lock_until := now() + INTERVAL '2 hours';
    UPDATE public.sanctum_risk_state 
    SET locked_until = lock_until, lock_reason = 'MEDIUM_RISK_SCORE_150+', updated_at = now() 
    WHERE user_id = NEW.user_id;
  ELSIF new_score >= 100 THEN
    lock_until := now() + INTERVAL '30 minutes';
    UPDATE public.sanctum_risk_state 
    SET locked_until = lock_until, lock_reason = 'LOW_RISK_SCORE_100+', updated_at = now() 
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para aplicar risco em violações
DROP TRIGGER IF EXISTS trg_apply_sanctum_risk ON public.sanctum_asset_access;
CREATE TRIGGER trg_apply_sanctum_risk
AFTER INSERT ON public.sanctum_asset_access
FOR EACH ROW
WHEN (NEW.action = 'violation_detected')
EXECUTE FUNCTION public.fn_apply_sanctum_risk();

-- 3.2 Verificar se usuário está bloqueado
CREATE OR REPLACE FUNCTION public.fn_check_sanctum_lock(p_user_id UUID)
RETURNS TABLE(is_locked BOOLEAN, locked_until TIMESTAMPTZ, lock_reason TEXT, risk_score INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN sr.locked_until > now() THEN true ELSE false END AS is_locked,
    sr.locked_until,
    sr.lock_reason,
    sr.risk_score
  FROM public.sanctum_risk_state sr
  WHERE sr.user_id = p_user_id;
  
  -- Se não encontrou, retorna desbloqueado
  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::TIMESTAMPTZ, NULL::TEXT, 0::INT;
  END IF;
END;
$$;

-- 3.3 Decay de score (executar via cron diário)
CREATE OR REPLACE FUNCTION public.fn_decay_sanctum_scores()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INT;
BEGIN
  -- Reduz 10 pontos por dia de inatividade
  UPDATE public.sanctum_risk_state
  SET 
    risk_score = GREATEST(0, risk_score - 10),
    updated_at = now()
  WHERE 
    risk_score > 0
    AND (last_event_at IS NULL OR last_event_at < now() - INTERVAL '24 hours');
  
  GET DIAGNOSTICS affected = ROW_COUNT;
  
  -- Limpar locks expirados
  UPDATE public.sanctum_risk_state
  SET locked_until = NULL, lock_reason = NULL, updated_at = now()
  WHERE locked_until IS NOT NULL AND locked_until < now();
  
  RETURN affected;
END;
$$;

-- 3.4 Obter manifest de asset (com verificação de permissões)
CREATE OR REPLACE FUNCTION public.fn_get_asset_manifest(
  p_asset_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset RECORD;
  v_profile RECORD;
  v_lock RECORD;
  v_pages JSONB;
BEGIN
  -- 1) Verificar lock
  SELECT * INTO v_lock FROM public.fn_check_sanctum_lock(p_user_id);
  IF v_lock.is_locked THEN
    RETURN jsonb_build_object(
      'error', 'USER_LOCKED', 
      'locked_until', v_lock.locked_until,
      'reason', v_lock.lock_reason
    );
  END IF;
  
  -- 2) Buscar perfil
  SELECT id, role, access_expires_at, name, cpf, email INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'PROFILE_NOT_FOUND');
  END IF;
  
  -- 3) Verificar permissões (owner ignora TUDO)
  IF v_profile.role = 'owner' OR v_profile.email = 'moisesblank@gmail.com' THEN
    -- Owner passa direto
    NULL;
  ELSIF v_profile.role = 'beta' THEN
    -- Verificar expiração de acesso
    IF v_profile.access_expires_at IS NOT NULL AND v_profile.access_expires_at < now() THEN
      RETURN jsonb_build_object('error', 'ACCESS_EXPIRED');
    END IF;
  ELSIF v_profile.role IN ('funcionario', 'admin', 'professor') THEN
    -- Funcionários podem acessar
    NULL;
  ELSE
    RETURN jsonb_build_object('error', 'FORBIDDEN');
  END IF;
  
  -- 4) Buscar asset
  SELECT * INTO v_asset FROM public.ena_assets WHERE id = p_asset_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'ASSET_NOT_FOUND');
  END IF;
  
  IF v_asset.status != 'ready' THEN
    RETURN jsonb_build_object('error', 'ASSET_NOT_READY', 'status', v_asset.status);
  END IF;
  
  -- 5) Buscar páginas
  SELECT jsonb_agg(jsonb_build_object(
    'page', page_index,
    'path', storage_path,
    'width', width,
    'height', height,
    'format', format
  ) ORDER BY page_index)
  INTO v_pages
  FROM public.ena_asset_pages
  WHERE asset_id = p_asset_id;
  
  -- 6) Registrar acesso (forense)
  INSERT INTO public.sanctum_asset_access(
    user_id, user_email, user_role, asset_id, asset_kind, action, metadata
  )
  VALUES (
    p_user_id, 
    v_profile.email, 
    v_profile.role, 
    p_asset_id, 
    v_asset.kind, 
    'manifest_issued', 
    jsonb_build_object('page_count', v_asset.page_count, 'title', v_asset.title)
  );
  
  -- 7) Atualizar total de acessos
  INSERT INTO public.sanctum_risk_state(user_id, total_access)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    total_access = public.sanctum_risk_state.total_access + 1,
    updated_at = now();
  
  -- 8) Retornar manifest
  RETURN jsonb_build_object(
    'asset_id', p_asset_id,
    'title', v_asset.title,
    'kind', v_asset.kind,
    'page_count', v_asset.page_count,
    'pages', COALESCE(v_pages, '[]'::jsonb),
    'watermark_seed', COALESCE(v_profile.name, v_profile.email, 'ALUNO') || ' • ' || 
      COALESCE(LEFT(v_profile.cpf, 3) || '.***.***-' || RIGHT(v_profile.cpf, 2), LEFT(p_user_id::TEXT, 8))
  );
END;
$$;

-- 3.5 Registrar violação (chamado pela Edge Function)
CREATE OR REPLACE FUNCTION public.fn_register_sanctum_violation(
  p_user_id UUID,
  p_user_email TEXT,
  p_violation_type TEXT,
  p_severity INT,
  p_asset_id UUID DEFAULT NULL,
  p_domain TEXT DEFAULT NULL,
  p_route TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL,
  p_ua_hash TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lock RECORD;
BEGIN
  -- Inserir violação
  INSERT INTO public.sanctum_asset_access(
    user_id, user_email, asset_id, action, domain, route, ip_hash, ua_hash, metadata
  )
  VALUES (
    p_user_id, 
    p_user_email, 
    p_asset_id, 
    'violation_detected',
    p_domain,
    p_route,
    p_ip_hash,
    p_ua_hash,
    jsonb_build_object('violation_type', p_violation_type, 'severity', p_severity) || p_metadata
  );
  
  -- Verificar se foi bloqueado
  SELECT * INTO v_lock FROM public.fn_check_sanctum_lock(p_user_id);
  
  RETURN jsonb_build_object(
    'ok', true,
    'is_locked', v_lock.is_locked,
    'locked_until', v_lock.locked_until,
    'risk_score', v_lock.risk_score
  );
END;
$$;

-- 3.6 Obter estatísticas de risco (para dashboard owner)
CREATE OR REPLACE FUNCTION public.fn_get_sanctum_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_assets', (SELECT COUNT(*) FROM public.ena_assets),
    'assets_ready', (SELECT COUNT(*) FROM public.ena_assets WHERE status = 'ready'),
    'assets_queued', (SELECT COUNT(*) FROM public.ena_assets WHERE status = 'queued'),
    'total_pages', (SELECT COUNT(*) FROM public.ena_asset_pages),
    'total_access_logs', (SELECT COUNT(*) FROM public.sanctum_asset_access),
    'total_violations', (SELECT COUNT(*) FROM public.sanctum_asset_access WHERE action = 'violation_detected'),
    'users_locked', (SELECT COUNT(*) FROM public.sanctum_risk_state WHERE locked_until > now()),
    'high_risk_users', (SELECT COUNT(*) FROM public.sanctum_risk_state WHERE risk_score >= 100),
    'violations_last_24h', (
      SELECT COUNT(*) FROM public.sanctum_asset_access 
      WHERE action = 'violation_detected' AND created_at > now() - INTERVAL '24 hours'
    ),
    'top_violators', (
      SELECT jsonb_agg(jsonb_build_object('user_id', user_id, 'violations', total_violations, 'score', risk_score))
      FROM (
        SELECT user_id, total_violations, risk_score 
        FROM public.sanctum_risk_state 
        ORDER BY total_violations DESC 
        LIMIT 10
      ) t
    )
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$;

-- ============================================
-- PARTE 4: RLS (ROW LEVEL SECURITY)
-- ============================================

ALTER TABLE public.ena_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ena_asset_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctum_jobs_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctum_risk_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctum_asset_access ENABLE ROW LEVEL SECURITY;

-- Helper: verificar se é admin ou owner
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin')
  )
$$;

-- Assets: visualização baseada em permissões
DROP POLICY IF EXISTS "ena_assets_select" ON public.ena_assets;
CREATE POLICY "ena_assets_select" ON public.ena_assets FOR SELECT USING (
  is_premium = false 
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND (p.role IN ('owner', 'admin', 'beta', 'funcionario', 'professor') 
         OR p.email = 'moisesblank@gmail.com')
  )
);

DROP POLICY IF EXISTS "ena_assets_admin" ON public.ena_assets;
CREATE POLICY "ena_assets_admin" ON public.ena_assets FOR ALL USING (
  public.is_admin_or_owner()
);

-- Asset pages: mesma regra
DROP POLICY IF EXISTS "ena_asset_pages_select" ON public.ena_asset_pages;
CREATE POLICY "ena_asset_pages_select" ON public.ena_asset_pages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.ena_assets a
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE a.id = ena_asset_pages.asset_id
    AND (a.is_premium = false 
         OR p.role IN ('owner', 'admin', 'beta', 'funcionario', 'professor')
         OR p.email = 'moisesblank@gmail.com')
  )
);

DROP POLICY IF EXISTS "ena_asset_pages_admin" ON public.ena_asset_pages;
CREATE POLICY "ena_asset_pages_admin" ON public.ena_asset_pages FOR ALL USING (
  public.is_admin_or_owner()
);

-- Jobs: apenas admin/owner
DROP POLICY IF EXISTS "sanctum_jobs_admin" ON public.sanctum_jobs_queue;
CREATE POLICY "sanctum_jobs_admin" ON public.sanctum_jobs_queue FOR ALL USING (
  public.is_admin_or_owner()
);

-- Risk state: apenas owner pode ver tudo
DROP POLICY IF EXISTS "sanctum_risk_owner" ON public.sanctum_risk_state;
CREATE POLICY "sanctum_risk_owner" ON public.sanctum_risk_state FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND (p.role = 'owner' OR p.email = 'moisesblank@gmail.com')
  )
);

-- Próprio usuário pode ver seu risco
DROP POLICY IF EXISTS "sanctum_risk_self" ON public.sanctum_risk_state;
CREATE POLICY "sanctum_risk_self" ON public.sanctum_risk_state FOR SELECT USING (
  user_id = auth.uid()
);

-- Asset access: owner vê tudo
DROP POLICY IF EXISTS "sanctum_access_owner" ON public.sanctum_asset_access;
CREATE POLICY "sanctum_access_owner" ON public.sanctum_asset_access FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND (p.role = 'owner' OR p.email = 'moisesblank@gmail.com')
  )
);

-- Próprio usuário pode ver seus acessos
DROP POLICY IF EXISTS "sanctum_access_self" ON public.sanctum_asset_access;
CREATE POLICY "sanctum_access_self" ON public.sanctum_asset_access FOR SELECT USING (
  user_id = auth.uid()
);

-- ============================================
-- PARTE 5: TRIGGERS DE UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ena_assets_updated_at ON public.ena_assets;
CREATE TRIGGER trg_ena_assets_updated_at
BEFORE UPDATE ON public.ena_assets
FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

DROP TRIGGER IF EXISTS trg_sanctum_jobs_updated_at ON public.sanctum_jobs_queue;
CREATE TRIGGER trg_sanctum_jobs_updated_at
BEFORE UPDATE ON public.sanctum_jobs_queue
FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- ============================================
-- PARTE 6: COMENTÁRIOS FINAIS
-- ============================================

COMMENT ON FUNCTION public.fn_apply_sanctum_risk IS 'Aplica score de risco após violação detectada';
COMMENT ON FUNCTION public.fn_check_sanctum_lock IS 'Verifica se usuário está bloqueado';
COMMENT ON FUNCTION public.fn_decay_sanctum_scores IS 'Decay diário de scores (executar via cron)';
COMMENT ON FUNCTION public.fn_get_asset_manifest IS 'Retorna manifest de asset com verificação de permissões';
COMMENT ON FUNCTION public.fn_register_sanctum_violation IS 'Registra violação de segurança';
COMMENT ON FUNCTION public.fn_get_sanctum_stats IS 'Estatísticas do SANCTUM para dashboard owner';

-- ============================================
-- ✅ SANCTUM 3.0 — PROTECT PDF OMEGA INSTALADO
-- ============================================
