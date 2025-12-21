-- Adicionar campo recorrente aos gastos fixos (por padrão TRUE, pois gastos fixos são recorrentes)
ALTER TABLE public.company_fixed_expenses 
ADD COLUMN IF NOT EXISTS recorrente boolean DEFAULT true;

-- Adicionar campo para definir data de início da recorrência
ALTER TABLE public.company_fixed_expenses 
ADD COLUMN IF NOT EXISTS data_inicio_recorrencia date DEFAULT CURRENT_DATE;

-- Adicionar campo para definir data de fim da recorrência (NULL = infinito)
ALTER TABLE public.company_fixed_expenses 
ADD COLUMN IF NOT EXISTS data_fim_recorrencia date DEFAULT NULL;

-- Adicionar campo para identificar o gasto original (para gastos projetados)
ALTER TABLE public.company_fixed_expenses 
ADD COLUMN IF NOT EXISTS gasto_origem_id integer DEFAULT NULL;

-- Adicionar campo para marcar se é um registro projetado automaticamente
ALTER TABLE public.company_fixed_expenses 
ADD COLUMN IF NOT EXISTS is_projecao boolean DEFAULT false;

-- Atualizar gastos existentes para serem recorrentes por padrão
UPDATE public.company_fixed_expenses 
SET recorrente = true, 
    data_inicio_recorrencia = COALESCE(
      MAKE_DATE(ano::int, mes::int, LEAST(dia::int, 28)), 
      created_at::date
    )
WHERE recorrente IS NULL;

-- Função para projetar gastos fixos recorrentes
CREATE OR REPLACE FUNCTION public.get_projected_fixed_expenses(
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  id integer,
  nome text,
  valor integer,
  categoria text,
  ano integer,
  mes integer,
  dia integer,
  semana integer,
  status_pagamento text,
  data_vencimento date,
  data_pagamento timestamp with time zone,
  recorrente boolean,
  is_projecao boolean,
  gasto_origem_id integer,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month date;
  expense record;
BEGIN
  -- Retornar gastos reais do período
  RETURN QUERY
  SELECT 
    cfe.id,
    cfe.nome,
    cfe.valor,
    cfe.categoria,
    cfe.ano,
    cfe.mes,
    cfe.dia,
    cfe.semana,
    cfe.status_pagamento,
    cfe.data_vencimento,
    cfe.data_pagamento,
    COALESCE(cfe.recorrente, true),
    COALESCE(cfe.is_projecao, false),
    cfe.gasto_origem_id,
    cfe.created_at
  FROM company_fixed_expenses cfe
  WHERE 
    MAKE_DATE(cfe.ano::int, cfe.mes::int, 1) BETWEEN 
      DATE_TRUNC('month', p_start_date) AND 
      DATE_TRUNC('month', p_end_date);

  -- Para cada gasto fixo recorrente, projetar para meses futuros
  current_month := DATE_TRUNC('month', p_start_date);
  
  WHILE current_month <= DATE_TRUNC('month', p_end_date) LOOP
    FOR expense IN 
      SELECT DISTINCT ON (cfe.nome, cfe.valor) 
        cfe.id as orig_id,
        cfe.nome,
        cfe.valor,
        cfe.categoria,
        COALESCE(cfe.dia, 1) as dia,
        cfe.recorrente,
        cfe.data_inicio_recorrencia,
        cfe.data_fim_recorrencia
      FROM company_fixed_expenses cfe
      WHERE cfe.recorrente = true
        AND COALESCE(cfe.is_projecao, false) = false
        AND COALESCE(cfe.data_inicio_recorrencia, MAKE_DATE(cfe.ano::int, cfe.mes::int, 1)) <= current_month
        AND (cfe.data_fim_recorrencia IS NULL OR cfe.data_fim_recorrencia >= current_month)
        -- Não existe registro real para este mês
        AND NOT EXISTS (
          SELECT 1 FROM company_fixed_expenses cfe2
          WHERE cfe2.nome = cfe.nome 
            AND cfe2.valor = cfe.valor
            AND cfe2.ano = EXTRACT(YEAR FROM current_month)::int
            AND cfe2.mes = EXTRACT(MONTH FROM current_month)::int
        )
      ORDER BY cfe.nome, cfe.valor, cfe.created_at DESC
    LOOP
      RETURN QUERY
      SELECT 
        -expense.orig_id as id, -- ID negativo para indicar projeção
        expense.nome,
        expense.valor,
        expense.categoria,
        EXTRACT(YEAR FROM current_month)::int as ano,
        EXTRACT(MONTH FROM current_month)::int as mes,
        expense.dia::int,
        EXTRACT(WEEK FROM current_month)::int as semana,
        'pendente'::text as status_pagamento,
        MAKE_DATE(
          EXTRACT(YEAR FROM current_month)::int, 
          EXTRACT(MONTH FROM current_month)::int, 
          LEAST(expense.dia, 28)
        ) as data_vencimento,
        NULL::timestamp with time zone as data_pagamento,
        true as recorrente,
        true as is_projecao,
        expense.orig_id as gasto_origem_id,
        NOW() as created_at;
    END LOOP;
    
    current_month := current_month + INTERVAL '1 month';
  END LOOP;
END;
$$;

-- Função para materializar projeção (criar registro real a partir de projeção)
CREATE OR REPLACE FUNCTION public.materialize_fixed_expense(
  p_gasto_origem_id integer,
  p_ano integer,
  p_mes integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id integer;
  v_expense record;
BEGIN
  -- Buscar gasto original
  SELECT * INTO v_expense FROM company_fixed_expenses WHERE id = p_gasto_origem_id;
  
  IF v_expense IS NULL THEN
    RAISE EXCEPTION 'Gasto origem não encontrado';
  END IF;
  
  -- Verificar se já existe
  SELECT id INTO v_new_id 
  FROM company_fixed_expenses 
  WHERE nome = v_expense.nome 
    AND valor = v_expense.valor 
    AND ano = p_ano 
    AND mes = p_mes;
    
  IF v_new_id IS NOT NULL THEN
    RETURN v_new_id;
  END IF;
  
  -- Criar novo registro
  INSERT INTO company_fixed_expenses (
    nome, valor, categoria, ano, mes, dia, semana,
    status_pagamento, data_vencimento, recorrente, 
    gasto_origem_id, is_projecao, created_by
  )
  VALUES (
    v_expense.nome,
    v_expense.valor,
    v_expense.categoria,
    p_ano,
    p_mes,
    COALESCE(v_expense.dia, 1),
    EXTRACT(WEEK FROM MAKE_DATE(p_ano, p_mes, COALESCE(v_expense.dia, 1))),
    'pendente',
    MAKE_DATE(p_ano, p_mes, LEAST(COALESCE(v_expense.dia, 1), 28)),
    true,
    p_gasto_origem_id,
    false,
    v_expense.created_by
  )
  RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$;