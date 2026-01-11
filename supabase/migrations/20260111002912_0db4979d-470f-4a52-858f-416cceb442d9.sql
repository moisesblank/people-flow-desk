
-- ============================================
-- FIX CRÍTICO: RLS e RPC de envios_correios
-- O aluno_id é o ID da tabela alunos, não auth.uid()
-- Precisa fazer JOIN com profiles via email
-- ============================================

-- 1. Criar função helper para verificar se o usuário autenticado é dono do envio
CREATE OR REPLACE FUNCTION public.is_envio_owner(envio_aluno_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM alunos a
    INNER JOIN profiles p ON LOWER(p.email) = LOWER(a.email)
    WHERE a.id = envio_aluno_id
    AND p.id = auth.uid()
  )
$$;

-- 2. Remover policies antigas do aluno que estão quebradas
DROP POLICY IF EXISTS "Students can view own dispatches" ON envios_correios;
DROP POLICY IF EXISTS "Students can update own dispatch seen status" ON envios_correios;

-- 3. Criar policies corrigidas usando a função helper
CREATE POLICY "Students can view own dispatches" ON envios_correios
FOR SELECT
USING (
  public.is_envio_owner(aluno_id)
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Students can update own dispatch seen status" ON envios_correios
FOR UPDATE
USING (public.is_envio_owner(aluno_id))
WITH CHECK (public.is_envio_owner(aluno_id));

-- 4. Recriar a função mark_dispatch_seen com a lógica correta
CREATE OR REPLACE FUNCTION public.mark_dispatch_seen(p_envio_id uuid, p_seen_via text DEFAULT 'tracking_click'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_aluno_id uuid;
  v_current_state text;
  v_is_owner boolean;
BEGIN
  -- Buscar dados do envio
  SELECT aluno_id, dispatch_state INTO v_aluno_id, v_current_state
  FROM envios_correios
  WHERE id = p_envio_id;
  
  IF v_aluno_id IS NULL THEN
    RAISE EXCEPTION 'Envio não encontrado';
  END IF;
  
  -- Verificar se o usuário autenticado é o dono do envio (via email match)
  SELECT EXISTS (
    SELECT 1
    FROM alunos a
    INNER JOIN profiles p ON LOWER(p.email) = LOWER(a.email)
    WHERE a.id = v_aluno_id
    AND p.id = auth.uid()
  ) INTO v_is_owner;
  
  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Acesso negado: você não é o destinatário deste envio';
  END IF;
  
  -- Só pode marcar como visto se estiver em sent_confirmed
  IF v_current_state != 'sent_confirmed' THEN
    RETURN false;
  END IF;
  
  -- Atualizar estado do envio
  UPDATE envios_correios
  SET 
    dispatch_state = 'seen_by_student',
    student_seen_at = now(),
    student_seen_via = p_seen_via
  WHERE id = p_envio_id
    AND dispatch_state = 'sent_confirmed';
  
  -- Log de auditoria
  INSERT INTO dispatch_audit_log (envio_id, event_type, actor_id, actor_role, metadata)
  VALUES (p_envio_id, 'student_acknowledged', auth.uid(), 'student', 
    jsonb_build_object('seen_via', p_seen_via, 'seen_at', now()));
  
  RETURN true;
END;
$$;

-- 5. Criar função para verificar se aluno tem endereço cadastrado
CREATE OR REPLACE FUNCTION public.get_student_address_by_auth()
RETURNS TABLE(
  aluno_id uuid,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    a.id,
    a.cep,
    a.logradouro,
    a.numero,
    a.complemento,
    a.bairro,
    a.cidade,
    a.estado
  FROM alunos a
  INNER JOIN profiles p ON LOWER(p.email) = LOWER(a.email)
  WHERE p.id = auth.uid()
  LIMIT 1
$$;
