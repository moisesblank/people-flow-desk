-- Criar tabela para logs de vencimentos enviados (evitar emails duplicados)
CREATE TABLE IF NOT EXISTS public.vencimentos_notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_notificacao DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_notificacao TEXT NOT NULL DEFAULT 'email',
  total_itens INTEGER NOT NULL DEFAULT 0,
  valor_total BIGINT NOT NULL DEFAULT 0,
  itens_ids TEXT[] DEFAULT '{}',
  enviado_para TEXT NOT NULL,
  sucesso BOOLEAN DEFAULT true,
  erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para evitar notificações duplicadas no mesmo dia
CREATE UNIQUE INDEX IF NOT EXISTS idx_vencimentos_notificacoes_dia 
ON public.vencimentos_notificacoes (data_notificacao, enviado_para) 
WHERE sucesso = true;

-- Enable RLS
ALTER TABLE public.vencimentos_notificacoes ENABLE ROW LEVEL SECURITY;

-- Policy para owner ver tudo
CREATE POLICY "Owner pode ver todas as notificações" 
ON public.vencimentos_notificacoes 
FOR ALL 
USING (true);

-- Criar função para verificar vencimentos automaticamente
CREATE OR REPLACE FUNCTION check_and_update_overdue_expenses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Atualizar gastos fixos atrasados (data_vencimento < hoje e status pendente)
  UPDATE company_fixed_expenses
  SET status_pagamento = 'atrasado',
      updated_at = now()
  WHERE data_vencimento::DATE < today_date
    AND status_pagamento = 'pendente';

  -- Atualizar gastos extras atrasados
  UPDATE company_extra_expenses
  SET status_pagamento = 'atrasado',
      updated_at = now()
  WHERE data_vencimento::DATE < today_date
    AND status_pagamento = 'pendente';

  -- Atualizar payments atrasados
  UPDATE payments
  SET status = 'atrasado'
  WHERE data_vencimento::DATE < today_date
    AND status = 'pendente';
END;
$$;

-- Comentário para documentação
COMMENT ON FUNCTION check_and_update_overdue_expenses() IS 
'Atualiza automaticamente o status de gastos/pagamentos para atrasado quando a data de vencimento passa';