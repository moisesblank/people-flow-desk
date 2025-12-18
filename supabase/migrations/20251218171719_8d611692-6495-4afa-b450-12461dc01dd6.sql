-- Correção da coluna name -> nome na tabela whatsapp_leads
-- Primeiro verificar se a coluna 'name' existe e renomear para 'nome'

DO $$
BEGIN
  -- Se a coluna 'name' existir, renomear para 'nome'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_leads' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.whatsapp_leads RENAME COLUMN name TO nome;
  END IF;
END $$;