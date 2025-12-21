-- ============================================
-- DOGMA XII: SISTEMA DE ALUNOS BETA E GRATUITO
-- Beta = Aluno Pagante (365 dias acesso)
-- Aluno Gratuito = Cadastro comum (área pré-login)
-- ============================================

-- 1. Adicionar novos valores ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'beta';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aluno_gratuito';

-- 2. Criar tabela para controle de expiração de acesso BETA
CREATE TABLE IF NOT EXISTS public.user_access_expiration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role app_role NOT NULL,
  access_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  access_end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '365 days'),
  days_duration INTEGER NOT NULL DEFAULT 365,
  is_active BOOLEAN DEFAULT true,
  extended_by UUID REFERENCES auth.users(id),
  extended_at TIMESTAMP WITH TIME ZONE,
  original_end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.user_access_expiration ENABLE ROW LEVEL SECURITY;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_access_expiration_user_id ON public.user_access_expiration(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_expiration_end_date ON public.user_access_expiration(access_end_date);
CREATE INDEX IF NOT EXISTS idx_user_access_expiration_active ON public.user_access_expiration(is_active);

-- 3. Políticas RLS
CREATE POLICY "Usuários veem própria expiração"
  ON public.user_access_expiration FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner pode ver todas expirações"
  ON public.user_access_expiration FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owner pode gerenciar expirações"
  ON public.user_access_expiration FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Admin pode ver expirações"
  ON public.user_access_expiration FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Função para verificar se usuário BETA está ativo
CREATE OR REPLACE FUNCTION public.check_beta_access(_user_id UUID DEFAULT auth.uid())
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_expiration RECORD;
  v_days_remaining INTEGER;
  v_is_active BOOLEAN;
BEGIN
  -- Buscar role do usuário
  SELECT role INTO v_role 
  FROM public.user_roles 
  WHERE user_id = _user_id 
  LIMIT 1;
  
  -- Se for owner, admin ou coordenação, acesso total
  IF v_role IN ('owner', 'admin', 'coordenacao', 'suporte', 'monitoria', 'marketing', 'contabilidade', 'afiliado', 'employee') THEN
    RETURN json_build_object(
      'has_access', true,
      'role', v_role,
      'is_staff', true,
      'days_remaining', NULL,
      'expires_at', NULL
    );
  END IF;
  
  -- Se for BETA, verificar expiração
  IF v_role = 'beta' THEN
    SELECT * INTO v_expiration 
    FROM public.user_access_expiration 
    WHERE user_id = _user_id AND is_active = true
    LIMIT 1;
    
    IF NOT FOUND THEN
      RETURN json_build_object(
        'has_access', false,
        'role', v_role,
        'is_staff', false,
        'days_remaining', 0,
        'expires_at', NULL,
        'reason', 'NO_EXPIRATION_RECORD'
      );
    END IF;
    
    -- Calcular dias restantes
    v_days_remaining := EXTRACT(DAY FROM (v_expiration.access_end_date - NOW()));
    v_is_active := v_expiration.access_end_date > NOW();
    
    RETURN json_build_object(
      'has_access', v_is_active,
      'role', v_role,
      'is_staff', false,
      'days_remaining', GREATEST(v_days_remaining, 0),
      'expires_at', v_expiration.access_end_date,
      'access_start', v_expiration.access_start_date,
      'reason', CASE WHEN v_is_active THEN NULL ELSE 'EXPIRED' END
    );
  END IF;
  
  -- Se for aluno_gratuito, acesso negado à área logada
  IF v_role = 'aluno_gratuito' THEN
    RETURN json_build_object(
      'has_access', false,
      'role', v_role,
      'is_staff', false,
      'days_remaining', 0,
      'expires_at', NULL,
      'reason', 'FREE_USER',
      'allowed_area', 'area-gratuita'
    );
  END IF;
  
  -- Sem role definido
  RETURN json_build_object(
    'has_access', false,
    'role', NULL,
    'is_staff', false,
    'reason', 'NO_ROLE'
  );
END;
$$;

-- 5. Função para criar/atualizar acesso BETA
CREATE OR REPLACE FUNCTION public.grant_beta_access(
  _user_id UUID,
  _days INTEGER DEFAULT 365
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role app_role;
  v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verificar se quem está chamando é owner
  SELECT role INTO v_caller_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  IF v_caller_role != 'owner' THEN
    RETURN json_build_object('success', false, 'error', 'PERMISSION_DENIED');
  END IF;
  
  v_end_date := NOW() + (_days || ' days')::INTERVAL;
  
  -- Inserir ou atualizar role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'beta')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Inserir ou atualizar expiração
  INSERT INTO public.user_access_expiration (
    user_id, role, access_start_date, access_end_date, days_duration, is_active
  )
  VALUES (_user_id, 'beta', NOW(), v_end_date, _days, true)
  ON CONFLICT (user_id) DO UPDATE SET
    access_end_date = v_end_date,
    days_duration = _days,
    is_active = true,
    updated_at = NOW();
  
  RETURN json_build_object(
    'success', true,
    'user_id', _user_id,
    'access_end_date', v_end_date,
    'days_granted', _days
  );
END;
$$;

-- 6. Função para estender acesso BETA
CREATE OR REPLACE FUNCTION public.extend_beta_access(
  _user_id UUID,
  _additional_days INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role app_role;
  v_current_end TIMESTAMP WITH TIME ZONE;
  v_new_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verificar se quem está chamando é owner
  SELECT role INTO v_caller_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  IF v_caller_role != 'owner' THEN
    RETURN json_build_object('success', false, 'error', 'PERMISSION_DENIED');
  END IF;
  
  -- Buscar data atual de expiração
  SELECT access_end_date INTO v_current_end 
  FROM public.user_access_expiration 
  WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'NO_ACCESS_RECORD');
  END IF;
  
  -- Calcular nova data (extende a partir da data atual ou da expiração, o que for maior)
  v_new_end := GREATEST(v_current_end, NOW()) + (_additional_days || ' days')::INTERVAL;
  
  -- Atualizar
  UPDATE public.user_access_expiration SET
    original_end_date = COALESCE(original_end_date, access_end_date),
    access_end_date = v_new_end,
    days_duration = days_duration + _additional_days,
    extended_by = auth.uid(),
    extended_at = NOW(),
    updated_at = NOW()
  WHERE user_id = _user_id;
  
  RETURN json_build_object(
    'success', true,
    'user_id', _user_id,
    'previous_end_date', v_current_end,
    'new_end_date', v_new_end,
    'days_added', _additional_days
  );
END;
$$;

-- 7. Função para revogar acesso BETA
CREATE OR REPLACE FUNCTION public.revoke_beta_access(_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role app_role;
BEGIN
  -- Verificar se quem está chamando é owner
  SELECT role INTO v_caller_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  IF v_caller_role != 'owner' THEN
    RETURN json_build_object('success', false, 'error', 'PERMISSION_DENIED');
  END IF;
  
  -- Desativar acesso
  UPDATE public.user_access_expiration SET
    is_active = false,
    updated_at = NOW()
  WHERE user_id = _user_id;
  
  -- Mudar role para aluno_gratuito
  UPDATE public.user_roles SET
    role = 'aluno_gratuito'
  WHERE user_id = _user_id;
  
  RETURN json_build_object(
    'success', true,
    'user_id', _user_id,
    'new_role', 'aluno_gratuito'
  );
END;
$$;

-- 8. Trigger para criar registro de expiração automaticamente quando BETA é atribuído
CREATE OR REPLACE FUNCTION public.auto_create_beta_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'beta' THEN
    INSERT INTO public.user_access_expiration (
      user_id, role, access_start_date, access_end_date, days_duration, is_active
    )
    VALUES (
      NEW.user_id, 'beta', NOW(), NOW() + INTERVAL '365 days', 365, true
    )
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'beta',
      is_active = true,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_create_beta_expiration ON public.user_roles;
CREATE TRIGGER trigger_auto_create_beta_expiration
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_beta_expiration();

-- 9. Função para listar todos os acessos BETA (para admin)
CREATE OR REPLACE FUNCTION public.admin_list_beta_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  nome TEXT,
  access_start TIMESTAMP WITH TIME ZONE,
  access_end TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER,
  is_active BOOLEAN,
  is_expired BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role app_role;
BEGIN
  -- Verificar se quem está chamando é owner ou admin
  SELECT role INTO v_caller_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    uae.user_id,
    p.email,
    p.nome,
    uae.access_start_date AS access_start,
    uae.access_end_date AS access_end,
    GREATEST(0, EXTRACT(DAY FROM (uae.access_end_date - NOW()))::INTEGER) AS days_remaining,
    uae.is_active,
    (uae.access_end_date < NOW()) AS is_expired
  FROM public.user_access_expiration uae
  JOIN public.profiles p ON p.id = uae.user_id
  WHERE uae.role = 'beta'
  ORDER BY uae.access_end_date ASC;
END;
$$;

-- 10. Atualizar função has_area_permission para incluir novos roles
CREATE OR REPLACE FUNCTION public.has_area_permission(_user_id UUID, _area TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_access JSON;
BEGIN
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  
  -- Owner tem acesso total
  IF v_role = 'owner' THEN RETURN true; END IF;
  
  -- Admin tem quase tudo
  IF v_role = 'admin' THEN 
    RETURN _area NOT IN ('god_mode', 'personal_finance', 'vida-pessoal');
  END IF;
  
  -- BETA - verificar expiração
  IF v_role = 'beta' THEN
    v_access := check_beta_access(_user_id);
    IF (v_access->>'has_access')::BOOLEAN THEN
      RETURN _area IN ('portal-aluno', 'cursos', 'simulados', 'area-beta', 'comunidade');
    END IF;
    RETURN false;
  END IF;
  
  -- Aluno Gratuito - apenas área gratuita
  IF v_role = 'aluno_gratuito' THEN
    RETURN _area IN ('area-gratuita', 'comunidade-gratuita');
  END IF;
  
  -- Outros roles mantêm lógica anterior
  RETURN CASE v_role
    WHEN 'coordenacao' THEN _area IN ('alunos', 'cursos', 'equipe', 'turmas-online', 'turmas-presenciais')
    WHEN 'suporte' THEN _area IN ('alunos', 'portal-aluno', 'cursos')
    WHEN 'monitoria' THEN _area IN ('alunos', 'simulados', 'cursos')
    WHEN 'marketing' THEN _area IN ('marketing', 'lancamento', 'metricas')
    WHEN 'contabilidade' THEN _area IN ('financeiro', 'contabilidade', 'relatorios')
    WHEN 'afiliado' THEN _area IN ('afiliados', 'metricas')
    WHEN 'employee' THEN _area IN ('tarefas', 'ponto', 'perfil')
    ELSE false
  END;
END;
$$;

-- 11. Habilitar Realtime para monitoramento
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_access_expiration;