
-- =====================================================
-- SISTEMA DE CRUZAMENTO AUTOMÁTICO DE DADOS v1.0
-- Garante que dados sempre se cruzem automaticamente
-- =====================================================

-- =====================================================
-- 1. TRIGGER: Quando venda Hotmart é aprovada → Cria aluno + entrada
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_hotmart_to_aluno_entrada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aluno_id UUID;
BEGIN
  -- Só processa se for status aprovado
  IF NEW.status NOT IN ('approved', 'purchase_approved', 'completed') THEN
    RETURN NEW;
  END IF;

  -- 1. Criar ou atualizar aluno
  INSERT INTO alunos (
    email, nome, telefone, cpf, fonte, status,
    hotmart_transaction_id, valor_pago, data_matricula
  ) VALUES (
    LOWER(TRIM(NEW.buyer_email)),
    NEW.buyer_name,
    NEW.buyer_phone,
    NEW.buyer_cpf,
    'Hotmart',
    'ativo',
    NEW.transaction_id,
    COALESCE(NEW.valor_liquido, NEW.valor_bruto),
    COALESCE(NEW.data_compra, NOW())
  )
  ON CONFLICT (email) DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = COALESCE(EXCLUDED.telefone, alunos.telefone),
    cpf = COALESCE(EXCLUDED.cpf, alunos.cpf),
    hotmart_transaction_id = EXCLUDED.hotmart_transaction_id,
    valor_pago = EXCLUDED.valor_pago,
    status = 'ativo',
    updated_at = NOW()
  RETURNING id INTO v_aluno_id;

  -- 2. Criar entrada financeira automaticamente
  INSERT INTO entradas (
    descricao, valor, categoria, fonte, data,
    aluno_id, transaction_id
  ) VALUES (
    'Venda Hotmart - ' || NEW.buyer_name || ' - ' || COALESCE(NEW.product_name, 'Curso'),
    COALESCE(NEW.valor_liquido, NEW.valor_bruto),
    'Vendas',
    'Hotmart',
    COALESCE(NEW.data_compra, NOW()),
    v_aluno_id,
    NEW.transaction_id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir e criar novo
DROP TRIGGER IF EXISTS trg_hotmart_to_aluno_entrada ON transacoes_hotmart_completo;
CREATE TRIGGER trg_hotmart_to_aluno_entrada
  AFTER INSERT OR UPDATE ON transacoes_hotmart_completo
  FOR EACH ROW
  EXECUTE FUNCTION fn_hotmart_to_aluno_entrada();

-- =====================================================
-- 2. TRIGGER: Quando aluno é cancelado → Atualiza status
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_hotmart_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se status mudou para cancelado/reembolsado
  IF NEW.status IN ('cancelled', 'refunded', 'chargeback', 'expired') 
     AND OLD.status IN ('approved', 'purchase_approved', 'completed') THEN
    
    -- Atualizar aluno para inativo
    UPDATE alunos 
    SET status = 'inativo', updated_at = NOW()
    WHERE hotmart_transaction_id = NEW.transaction_id;
    
    -- Cancelar comissão pendente
    UPDATE comissoes 
    SET status = 'cancelado'
    WHERE transaction_id = NEW.transaction_id 
      AND status = 'pendente';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hotmart_cancellation ON transacoes_hotmart_completo;
CREATE TRIGGER trg_hotmart_cancellation
  AFTER UPDATE ON transacoes_hotmart_completo
  FOR EACH ROW
  EXECUTE FUNCTION fn_hotmart_cancellation();

-- =====================================================
-- 3. TRIGGER: Comissões automáticas quando há afiliado
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_auto_comissao_afiliado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_afiliado_id INTEGER;
  v_taxa_comissao NUMERIC;
  v_valor_comissao NUMERIC;
  v_aluno_id UUID;
BEGIN
  -- Só processa se tiver afiliado e for status aprovado
  IF NEW.affiliate_id IS NULL OR NEW.affiliate_name IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('approved', 'purchase_approved', 'completed') THEN
    RETURN NEW;
  END IF;

  -- Buscar afiliado pelo hotmart_id ou nome
  SELECT id, COALESCE(taxa_comissao, percentual_comissao, 20) 
  INTO v_afiliado_id, v_taxa_comissao
  FROM affiliates 
  WHERE hotmart_id = NEW.affiliate_id 
     OR LOWER(nome) = LOWER(NEW.affiliate_name)
  LIMIT 1;

  -- Se não encontrou afiliado, criar um novo
  IF v_afiliado_id IS NULL THEN
    INSERT INTO affiliates (nome, hotmart_id, status, taxa_comissao)
    VALUES (NEW.affiliate_name, NEW.affiliate_id, 'ativo', 20)
    RETURNING id INTO v_afiliado_id;
    v_taxa_comissao := 20;
  END IF;

  -- Calcular comissão
  v_valor_comissao := COALESCE(NEW.comissao_afiliado, 
                               (COALESCE(NEW.valor_liquido, NEW.valor_bruto) * v_taxa_comissao / 100));

  -- Buscar aluno
  SELECT id INTO v_aluno_id FROM alunos WHERE hotmart_transaction_id = NEW.transaction_id;

  -- Criar comissão
  INSERT INTO comissoes (
    afiliado_id, aluno_id, valor, descricao, 
    transaction_id, status, data
  ) VALUES (
    v_afiliado_id,
    v_aluno_id,
    v_valor_comissao,
    'Comissão venda: ' || NEW.buyer_name,
    NEW.transaction_id,
    'pendente',
    COALESCE(NEW.data_compra, NOW())
  )
  ON CONFLICT DO NOTHING;

  -- Atualizar totais do afiliado
  UPDATE affiliates 
  SET 
    total_vendas = COALESCE(total_vendas, 0) + 1,
    total_comissao = COALESCE(total_comissao, 0) + v_valor_comissao,
    comissao_total = COALESCE(comissao_total, 0) + v_valor_comissao
  WHERE id = v_afiliado_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_comissao_afiliado ON transacoes_hotmart_completo;
CREATE TRIGGER trg_auto_comissao_afiliado
  AFTER INSERT OR UPDATE ON transacoes_hotmart_completo
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_comissao_afiliado();

-- =====================================================
-- 4. VIEW CONSOLIDADA: Dashboard com dados cruzados
-- =====================================================
CREATE OR REPLACE VIEW public.v_dashboard_consolidado AS
SELECT 
  -- Alunos
  (SELECT COUNT(*) FROM alunos WHERE status = 'ativo') AS alunos_ativos,
  (SELECT COUNT(*) FROM alunos WHERE status = 'inativo') AS alunos_inativos,
  (SELECT COUNT(*) FROM alunos WHERE created_at >= DATE_TRUNC('month', NOW())) AS novos_alunos_mes,
  
  -- Funcionários
  (SELECT COUNT(*) FROM employees WHERE status = 'ativo') AS funcionarios_ativos,
  
  -- Afiliados
  (SELECT COUNT(*) FROM affiliates WHERE status = 'ativo') AS afiliados_ativos,
  
  -- Financeiro do mês
  (SELECT COALESCE(SUM(valor), 0) FROM entradas 
   WHERE created_at >= DATE_TRUNC('month', NOW())) AS receita_mes,
  
  (SELECT COALESCE(SUM(valor), 0) FROM company_fixed_expenses 
   WHERE mes = EXTRACT(MONTH FROM NOW()) AND ano = EXTRACT(YEAR FROM NOW())) AS despesas_fixas_mes,
  
  (SELECT COALESCE(SUM(valor), 0) FROM company_extra_expenses 
   WHERE mes = EXTRACT(MONTH FROM NOW()) AND ano = EXTRACT(YEAR FROM NOW())) AS despesas_extras_mes,
  
  -- Vendas Hotmart
  (SELECT COUNT(*) FROM transacoes_hotmart_completo 
   WHERE status IN ('approved', 'purchase_approved', 'completed')
   AND data_compra >= DATE_TRUNC('month', NOW())) AS vendas_mes,
  
  -- Comissões
  (SELECT COALESCE(SUM(valor), 0) FROM comissoes WHERE status = 'pendente') AS comissoes_pendentes,
  (SELECT COALESCE(SUM(valor), 0) FROM comissoes WHERE status = 'pago') AS comissoes_pagas,
  
  -- Timestamp
  NOW() AS updated_at;

-- =====================================================
-- 5. FUNÇÃO RPC: Obter stats do dashboard com cache
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats_realtime()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'alunos_ativos', (SELECT COUNT(*) FROM alunos WHERE status = 'ativo'),
    'alunos_novos_mes', (SELECT COUNT(*) FROM alunos WHERE created_at >= DATE_TRUNC('month', NOW())),
    'funcionarios_ativos', (SELECT COUNT(*) FROM employees WHERE status = 'ativo'),
    'afiliados_ativos', (SELECT COUNT(*) FROM affiliates WHERE status = 'ativo'),
    'receita_mes', (SELECT COALESCE(SUM(valor), 0) FROM entradas WHERE created_at >= DATE_TRUNC('month', NOW())),
    'despesas_mes', (
      SELECT COALESCE(SUM(valor), 0) FROM (
        SELECT valor FROM company_fixed_expenses WHERE mes = EXTRACT(MONTH FROM NOW()) AND ano = EXTRACT(YEAR FROM NOW())
        UNION ALL
        SELECT valor FROM company_extra_expenses WHERE mes = EXTRACT(MONTH FROM NOW()) AND ano = EXTRACT(YEAR FROM NOW())
      ) sub
    ),
    'vendas_mes', (SELECT COUNT(*) FROM transacoes_hotmart_completo 
                   WHERE status IN ('approved', 'purchase_approved', 'completed')
                   AND data_compra >= DATE_TRUNC('month', NOW())),
    'comissoes_pendentes', (SELECT COALESCE(SUM(valor), 0) FROM comissoes WHERE status = 'pendente'),
    'tarefas_hoje', (SELECT COUNT(*) FROM calendar_tasks 
                     WHERE task_date = CURRENT_DATE AND is_completed = false),
    'updated_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- 6. ÍNDICES para performance nos cruzamentos
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_alunos_email ON alunos(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_alunos_status ON alunos(status);
CREATE INDEX IF NOT EXISTS idx_alunos_hotmart_tid ON alunos(hotmart_transaction_id);
CREATE INDEX IF NOT EXISTS idx_entradas_aluno ON entradas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_entradas_transaction ON entradas(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes_hotmart_completo(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_email ON transacoes_hotmart_completo(LOWER(buyer_email));
CREATE INDEX IF NOT EXISTS idx_comissoes_afiliado ON comissoes(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_status ON comissoes(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_hotmart ON affiliates(hotmart_id);

-- =====================================================
-- 7. Adicionar constraint unique em alunos.email se não existir
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alunos_email_unique'
  ) THEN
    ALTER TABLE alunos ADD CONSTRAINT alunos_email_unique UNIQUE (email);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignorar se já existir
  NULL;
END;
$$;
