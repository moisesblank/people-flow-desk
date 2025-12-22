-- ============================================
-- 🌌🔥 SANCTUM OMEGA ULTRA — MIGRAÇÃO DEFINITIVA NÍVEL NASA 🔥🌌
-- ANO 2300 — PROTEÇÃO MÁXIMA DE CONTEÚDO
-- ============================================

-- ============================================
-- 1) TIPOS ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE asset_type AS ENUM ('pdf', 'ebook', 'worksheet', 'video', 'image', 'audio');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_status AS ENUM ('pending', 'processing', 'ready', 'error', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE violation_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sanctum_job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2) TABELA: ena_assets (Assets protegidos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ena_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadados
  title TEXT NOT NULL,
  description TEXT,
  asset_type asset_type NOT NULL DEFAULT 'pdf',
  status asset_status NOT NULL DEFAULT 'pending',
  
  -- Armazenamento
  original_bucket TEXT NOT NULL DEFAULT 'ena-assets-raw',
  original_path TEXT NOT NULL,
  transmuted_bucket TEXT DEFAULT 'ena-assets-transmuted',
  
  -- Métricas
  total_pages INTEGER DEFAULT 0,
  file_size_bytes BIGINT DEFAULT 0,
  
  -- Acesso
  is_premium BOOLEAN NOT NULL DEFAULT true,
  required_roles TEXT[] NOT NULL DEFAULT ARRAY['beta', 'owner', 'admin'],
  course_id UUID,
  lesson_id UUID,
  
  -- Proteção
  watermark_enabled BOOLEAN NOT NULL DEFAULT true,
  watermark_template TEXT DEFAULT '{name} • {cpf} • {session} • {time}',
  drm_level TEXT DEFAULT 'high',
  
  -- Timestamps
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Índices para ena_assets
CREATE INDEX IF NOT EXISTS idx_ena_assets_status ON public.ena_assets(status);
CREATE INDEX IF NOT EXISTS idx_ena_assets_type ON public.ena_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_ena_assets_course ON public.ena_assets(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ena_assets_lesson ON public.ena_assets(lesson_id) WHERE lesson_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ena_assets_premium ON public.ena_assets(is_premium) WHERE is_premium = true;

-- ============================================
-- 3) TABELA: ena_asset_pages (Páginas rasterizadas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ena_asset_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.ena_assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Página
  page_number INTEGER NOT NULL,
  
  -- Armazenamento
  storage_path TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'webp',
  
  -- Dimensões
  width INTEGER,
  height INTEGER,
  file_size_bytes INTEGER,
  
  -- Proteção
  has_burned_watermark BOOLEAN NOT NULL DEFAULT false,
  watermark_hash TEXT,
  
  UNIQUE(asset_id, page_number)
);

-- Índices para ena_asset_pages
CREATE INDEX IF NOT EXISTS idx_ena_asset_pages_asset ON public.ena_asset_pages(asset_id);
CREATE INDEX IF NOT EXISTS idx_ena_asset_pages_order ON public.ena_asset_pages(asset_id, page_number);

-- ============================================
-- 4) TABELA: sanctum_risk_state (Score de risco por usuário)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sanctum_risk_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Score
  risk_score INTEGER NOT NULL DEFAULT 0,
  total_violations INTEGER NOT NULL DEFAULT 0,
  
  -- Bloqueio
  locked_until TIMESTAMPTZ,
  lock_reason TEXT,
  lock_count INTEGER NOT NULL DEFAULT 0,
  
  -- Último evento
  last_violation_at TIMESTAMPTZ,
  last_violation_type TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para sanctum_risk_state
CREATE INDEX IF NOT EXISTS idx_sanctum_risk_user ON public.sanctum_risk_state(user_id);
CREATE INDEX IF NOT EXISTS idx_sanctum_risk_score ON public.sanctum_risk_state(risk_score) WHERE risk_score > 50;
CREATE INDEX IF NOT EXISTS idx_sanctum_risk_locked ON public.sanctum_risk_state(locked_until) WHERE locked_until IS NOT NULL;

-- ============================================
-- 5) TABELA: sanctum_asset_access (Log de acessos e violações)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sanctum_asset_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Usuário
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  
  -- Asset
  asset_id UUID REFERENCES public.ena_assets(id) ON DELETE SET NULL,
  asset_type TEXT,
  
  -- Evento
  event_type TEXT NOT NULL,
  violation_type TEXT,
  severity INTEGER DEFAULT 0,
  violation_detected BOOLEAN DEFAULT false,
  
  -- Contexto
  domain TEXT,
  route TEXT,
  session_id TEXT,
  
  -- Fingerprint (hashed for privacy)
  ip_hash TEXT,
  ua_hash TEXT,
  device_fingerprint TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para sanctum_asset_access
CREATE INDEX IF NOT EXISTS idx_sanctum_access_user ON public.sanctum_asset_access(user_id);
CREATE INDEX IF NOT EXISTS idx_sanctum_access_asset ON public.sanctum_asset_access(asset_id);
CREATE INDEX IF NOT EXISTS idx_sanctum_access_time ON public.sanctum_asset_access(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sanctum_access_violations ON public.sanctum_asset_access(user_id, created_at DESC) 
  WHERE violation_detected = true;
CREATE INDEX IF NOT EXISTS idx_sanctum_access_event ON public.sanctum_asset_access(event_type);

-- ============================================
-- 6) TABELA: sanctum_jobs_queue (Fila de processamento)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sanctum_jobs_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Job
  job_type TEXT NOT NULL,
  status sanctum_job_status NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 5,
  
  -- Referência
  asset_id UUID REFERENCES public.ena_assets(id) ON DELETE CASCADE,
  
  -- Payload
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_data JSONB,
  
  -- Execução
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Erros
  error_message TEXT,
  error_stack TEXT,
  
  -- Lock
  locked_by TEXT,
  locked_at TIMESTAMPTZ
);

-- Índices para sanctum_jobs_queue
CREATE INDEX IF NOT EXISTS idx_sanctum_jobs_status ON public.sanctum_jobs_queue(status);
CREATE INDEX IF NOT EXISTS idx_sanctum_jobs_pending ON public.sanctum_jobs_queue(scheduled_for, priority DESC) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_sanctum_jobs_asset ON public.sanctum_jobs_queue(asset_id);

-- ============================================
-- 7) FUNÇÃO: fn_check_sanctum_lock
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_check_sanctum_lock(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked BOOLEAN := false;
BEGIN
  SELECT locked_until > now()
  INTO v_locked
  FROM public.sanctum_risk_state
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_locked, false);
END;
$$;

-- ============================================
-- 8) FUNÇÃO: fn_apply_sanctum_risk
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_apply_sanctum_risk()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_score INTEGER;
  v_new_score INTEGER;
  v_lock_until TIMESTAMPTZ;
  v_user_email TEXT;
BEGIN
  IF NEW.violation_detected IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT email INTO v_user_email 
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  -- OWNER BYPASS: moisesblank@gmail.com é IMUNE
  IF LOWER(v_user_email) = 'moisesblank@gmail.com' THEN
    RETURN NEW;
  END IF;
  
  INSERT INTO public.sanctum_risk_state (user_id, risk_score, total_violations, last_violation_at, last_violation_type)
  VALUES (NEW.user_id, NEW.severity, 1, now(), NEW.violation_type)
  ON CONFLICT (user_id) DO UPDATE SET
    risk_score = sanctum_risk_state.risk_score + EXCLUDED.risk_score,
    total_violations = sanctum_risk_state.total_violations + 1,
    last_violation_at = now(),
    last_violation_type = EXCLUDED.last_violation_type,
    updated_at = now();
  
  SELECT risk_score INTO v_new_score
  FROM public.sanctum_risk_state
  WHERE user_id = NEW.user_id;
  
  -- Sistema de bloqueio progressivo
  IF v_new_score >= 400 THEN
    v_lock_until := now() + INTERVAL '48 hours';
    UPDATE public.sanctum_risk_state
    SET locked_until = v_lock_until, lock_reason = 'CRITICAL_RISK_400+', lock_count = lock_count + 1, updated_at = now()
    WHERE user_id = NEW.user_id AND (locked_until IS NULL OR locked_until < now());
  ELSIF v_new_score >= 300 THEN
    v_lock_until := now() + INTERVAL '24 hours';
    UPDATE public.sanctum_risk_state
    SET locked_until = v_lock_until, lock_reason = 'HIGH_RISK_300+', lock_count = lock_count + 1, updated_at = now()
    WHERE user_id = NEW.user_id AND (locked_until IS NULL OR locked_until < now());
  ELSIF v_new_score >= 200 THEN
    v_lock_until := now() + INTERVAL '6 hours';
    UPDATE public.sanctum_risk_state
    SET locked_until = v_lock_until, lock_reason = 'ELEVATED_RISK_200+', lock_count = lock_count + 1, updated_at = now()
    WHERE user_id = NEW.user_id AND (locked_until IS NULL OR locked_until < now());
  ELSIF v_new_score >= 100 THEN
    v_lock_until := now() + INTERVAL '30 minutes';
    UPDATE public.sanctum_risk_state
    SET locked_until = v_lock_until, lock_reason = 'RISK_100+', lock_count = lock_count + 1, updated_at = now()
    WHERE user_id = NEW.user_id AND (locked_until IS NULL OR locked_until < now());
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para aplicar risco
DROP TRIGGER IF EXISTS trg_apply_sanctum_risk ON public.sanctum_asset_access;
CREATE TRIGGER trg_apply_sanctum_risk
  AFTER INSERT ON public.sanctum_asset_access
  FOR EACH ROW
  WHEN (NEW.violation_detected = true)
  EXECUTE FUNCTION public.fn_apply_sanctum_risk();

-- ============================================
-- 9) FUNÇÃO: fn_decay_sanctum_scores
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_decay_sanctum_scores()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  -- Decaimento de 10% do score após 24h sem atividade
  UPDATE public.sanctum_risk_state
  SET risk_score = GREATEST(0, risk_score - (risk_score * 0.1)::integer), updated_at = now()
  WHERE risk_score > 0 AND updated_at < now() - INTERVAL '24 hours';
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  
  -- Limpar bloqueios expirados
  UPDATE public.sanctum_risk_state
  SET locked_until = NULL, lock_reason = NULL, updated_at = now()
  WHERE locked_until IS NOT NULL AND locked_until < now();
  
  RETURN v_affected;
END;
$$;

-- ============================================
-- 10) FUNÇÃO: fn_get_asset_manifest
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_get_asset_manifest(p_user_id UUID, p_asset_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset RECORD;
  v_user RECORD;
  v_pages JSONB;
  v_is_locked BOOLEAN;
  v_has_access BOOLEAN;
  v_is_owner BOOLEAN;
  v_user_role TEXT;
BEGIN
  -- Buscar dados do usuário
  SELECT u.email, p.role, p.cpf, p.nome INTO v_user
  FROM auth.users u 
  LEFT JOIN public.profiles p ON p.id = u.id 
  WHERE u.id = p_user_id;
  
  v_is_owner := LOWER(v_user.email) = 'moisesblank@gmail.com' OR v_user.role = 'owner';
  v_user_role := COALESCE(v_user.role, 'viewer');
  
  -- Verificar bloqueio (OWNER é imune)
  IF NOT v_is_owner THEN
    v_is_locked := public.fn_check_sanctum_lock(p_user_id);
    IF v_is_locked THEN
      RETURN jsonb_build_object('success', false, 'error', 'USER_LOCKED', 'errorCode', 'LOCKED');
    END IF;
  END IF;
  
  -- Buscar asset
  SELECT * INTO v_asset FROM public.ena_assets WHERE id = p_asset_id;
  IF v_asset IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ASSET_NOT_FOUND', 'errorCode', 'NOT_FOUND');
  END IF;
  
  -- Verificar status
  IF v_asset.status != 'ready' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ASSET_NOT_READY', 'errorCode', 'NOT_READY', 'status', v_asset.status);
  END IF;
  
  -- Verificar acesso
  v_has_access := v_is_owner;
  IF NOT v_has_access THEN
    v_has_access := v_user_role = ANY(v_asset.required_roles);
    IF v_asset.is_premium AND NOT v_has_access THEN
      SELECT EXISTS (
        SELECT 1 FROM public.alunos a 
        WHERE a.email = v_user.email 
        AND a.status = 'ativo'
      ) INTO v_has_access;
    END IF;
  END IF;
  
  IF NOT v_has_access THEN
    RETURN jsonb_build_object('success', false, 'error', 'ACCESS_DENIED', 'errorCode', 'UNAUTHORIZED');
  END IF;
  
  -- Buscar páginas
  SELECT jsonb_agg(
    jsonb_build_object(
      'page', page_number, 
      'path', storage_path, 
      'width', width, 
      'height', height
    ) ORDER BY page_number
  ) INTO v_pages 
  FROM public.ena_asset_pages 
  WHERE asset_id = p_asset_id;
  
  -- Log de acesso
  INSERT INTO public.sanctum_asset_access (
    user_id, user_email, user_role, asset_id, asset_type, event_type, domain, route
  ) VALUES (
    p_user_id, v_user.email, v_user_role, p_asset_id, v_asset.asset_type::text, 'access', '', ''
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'assetId', v_asset.id, 
    'title', v_asset.title, 
    'description', v_asset.description, 
    'assetType', v_asset.asset_type, 
    'totalPages', v_asset.total_pages, 
    'pages', COALESCE(v_pages, '[]'::jsonb), 
    'watermarkSeed', encode(digest(p_user_id::text || v_asset.id::text || now()::text, 'sha256'), 'hex'), 
    'watermarkEnabled', v_asset.watermark_enabled, 
    'drmLevel', v_asset.drm_level, 
    'isOwner', v_is_owner
  );
END;
$$;

-- ============================================
-- 11) RLS POLICIES - SEGURANÇA NÍVEL NASA
-- ============================================

-- Enable RLS em todas as tabelas
ALTER TABLE public.ena_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ena_asset_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctum_risk_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctum_asset_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctum_jobs_queue ENABLE ROW LEVEL SECURITY;

-- ena_assets: Owner vê tudo, outros veem apenas assets permitidos
CREATE POLICY "ena_assets_owner_all" ON public.ena_assets
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()));

CREATE POLICY "ena_assets_select_allowed" ON public.ena_assets
  FOR SELECT TO authenticated
  USING (
    status = 'ready' 
    AND (
      NOT is_premium 
      OR (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1)::text = ANY(required_roles)
    )
  );

-- ena_asset_pages: Acesso via asset parent
CREATE POLICY "ena_asset_pages_owner_all" ON public.ena_asset_pages
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()));

CREATE POLICY "ena_asset_pages_select" ON public.ena_asset_pages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ena_assets a 
      WHERE a.id = asset_id 
      AND a.status = 'ready'
    )
  );

-- sanctum_risk_state: Owner vê tudo, usuário vê apenas o seu
CREATE POLICY "sanctum_risk_owner_all" ON public.sanctum_risk_state
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()));

CREATE POLICY "sanctum_risk_self" ON public.sanctum_risk_state
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- sanctum_asset_access: Owner vê tudo, usuário vê apenas o seu
CREATE POLICY "sanctum_access_owner_all" ON public.sanctum_asset_access
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()));

CREATE POLICY "sanctum_access_self" ON public.sanctum_asset_access
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- sanctum_jobs_queue: Apenas owner
CREATE POLICY "sanctum_jobs_owner_only" ON public.sanctum_jobs_queue
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()));

-- ============================================
-- 12) TRIGGERS de updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_update_sanctum_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ena_assets_updated_at ON public.ena_assets;
CREATE TRIGGER trg_ena_assets_updated_at
  BEFORE UPDATE ON public.ena_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_sanctum_updated_at();

DROP TRIGGER IF EXISTS trg_sanctum_risk_updated_at ON public.sanctum_risk_state;
CREATE TRIGGER trg_sanctum_risk_updated_at
  BEFORE UPDATE ON public.sanctum_risk_state
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_sanctum_updated_at();

DROP TRIGGER IF EXISTS trg_sanctum_jobs_updated_at ON public.sanctum_jobs_queue;
CREATE TRIGGER trg_sanctum_jobs_updated_at
  BEFORE UPDATE ON public.sanctum_jobs_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_sanctum_updated_at();