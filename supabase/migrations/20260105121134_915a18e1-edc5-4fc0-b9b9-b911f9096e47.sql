-- ============================================
-- MIGRAÇÃO: ADICIONAR 5 MACROS CANÔNICOS
-- Adiciona Química Ambiental e Bioquímica como MACROs de primeiro nível
-- ============================================

-- Inserir Química Ambiental se não existir
INSERT INTO public.question_taxonomy (level, value, label, icon, position, is_active)
SELECT 'macro', 'Química Ambiental', 'Química Ambiental', '🌍', 4, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.question_taxonomy 
  WHERE level = 'macro' AND (value = 'Química Ambiental' OR value = 'quimica_ambiental')
);

-- Inserir Bioquímica se não existir
INSERT INTO public.question_taxonomy (level, value, label, icon, position, is_active)
SELECT 'macro', 'Bioquímica', 'Bioquímica', '🧬', 5, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.question_taxonomy 
  WHERE level = 'macro' AND (value = 'Bioquímica' OR value = 'bioquimica')
);

-- Inserir MICROs para Química Ambiental
DO $$
DECLARE
  ambiental_id uuid;
BEGIN
  SELECT id INTO ambiental_id FROM public.question_taxonomy 
  WHERE level = 'macro' AND (value = 'Química Ambiental' OR label = 'Química Ambiental')
  LIMIT 1;
  
  IF ambiental_id IS NOT NULL THEN
    INSERT INTO public.question_taxonomy (level, value, label, parent_id, icon, position, is_active)
    VALUES 
      ('micro', 'Poluição Atmosférica', 'Poluição Atmosférica', ambiental_id, '💨', 1, true),
      ('micro', 'Poluição Hídrica', 'Poluição Hídrica', ambiental_id, '💧', 2, true),
      ('micro', 'Efeito Estufa', 'Efeito Estufa', ambiental_id, '🌡️', 3, true),
      ('micro', 'Camada de Ozônio', 'Camada de Ozônio', ambiental_id, '☀️', 4, true),
      ('micro', 'Chuva Ácida', 'Chuva Ácida', ambiental_id, '🌧️', 5, true),
      ('micro', 'Ciclos Biogeoquímicos', 'Ciclos Biogeoquímicos', ambiental_id, '🔄', 6, true),
      ('micro', 'Sustentabilidade', 'Sustentabilidade', ambiental_id, '♻️', 7, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Inserir MICROs para Bioquímica
DO $$
DECLARE
  bioquimica_id uuid;
BEGIN
  SELECT id INTO bioquimica_id FROM public.question_taxonomy 
  WHERE level = 'macro' AND (value = 'Bioquímica' OR label = 'Bioquímica')
  LIMIT 1;
  
  IF bioquimica_id IS NOT NULL THEN
    INSERT INTO public.question_taxonomy (level, value, label, parent_id, icon, position, is_active)
    VALUES 
      ('micro', 'Carboidratos', 'Carboidratos', bioquimica_id, '🍞', 1, true),
      ('micro', 'Lipídios', 'Lipídios', bioquimica_id, '🥑', 2, true),
      ('micro', 'Proteínas', 'Proteínas', bioquimica_id, '🥩', 3, true),
      ('micro', 'Aminoácidos', 'Aminoácidos', bioquimica_id, '🔗', 4, true),
      ('micro', 'Enzimas', 'Enzimas', bioquimica_id, '⚙️', 5, true),
      ('micro', 'Ácidos Nucleicos', 'Ácidos Nucleicos', bioquimica_id, '🧬', 6, true),
      ('micro', 'Metabolismo', 'Metabolismo', bioquimica_id, '🔥', 7, true),
      ('micro', 'Vitaminas', 'Vitaminas', bioquimica_id, '💊', 8, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Padronizar valores existentes de macro (unificar nomenclatura)
UPDATE public.question_taxonomy 
SET value = 'Química Geral', label = 'Química Geral'
WHERE level = 'macro' AND value = 'quimica_geral';

UPDATE public.question_taxonomy 
SET value = 'Química Orgânica', label = 'Química Orgânica'
WHERE level = 'macro' AND value = 'quimica_organica';

UPDATE public.question_taxonomy 
SET value = 'Físico-Química', label = 'Físico-Química'
WHERE level = 'macro' AND value = 'fisico_quimica';