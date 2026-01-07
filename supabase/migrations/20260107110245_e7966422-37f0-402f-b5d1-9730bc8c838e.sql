-- =====================================================
-- CONSOLIDAÇÃO DE MICROTEMAS: 3 → 1
-- "Introdução à Química Orgânica" + "Classificação de Carbonos e Cadeias" + "Hidrocarbonetos"
-- → "Introdução à orgânica"
-- =====================================================

-- PASSO 1: Renomear o primeiro micro para o novo nome consolidado
UPDATE question_taxonomy
SET 
  label = 'Introdução à orgânica',
  value = 'introducao_organica',
  updated_at = NOW()
WHERE id = 'ba6f364f-afa4-4c7b-8f13-dd3d91ef461f';

-- PASSO 2: Mover todos os temas dos outros 2 micros para o micro consolidado
UPDATE question_taxonomy
SET 
  parent_id = 'ba6f364f-afa4-4c7b-8f13-dd3d91ef461f',
  updated_at = NOW()
WHERE parent_id IN (
  '6b7ed6b3-7ff2-426c-adc1-3e83a70d60c0',  -- Classificação de Carbonos e Cadeias
  '54a37ab6-e1c5-4d2f-8178-600b2c7cc63d'   -- Hidrocarbonetos
);

-- PASSO 3: Atualizar todas as questões que usavam os micros antigos
UPDATE quiz_questions
SET 
  micro = 'Introdução à orgânica',
  updated_at = NOW()
WHERE micro IN (
  'Introdução à Química Orgânica',
  'introducao_quimica_organica',
  'Classificação de Carbonos e Cadeias',
  'classificacao_carbonos_cadeias',
  'Hidrocarbonetos',
  'hidrocarbonetos'
);

-- PASSO 4: Deletar os micros obsoletos (agora vazios)
DELETE FROM question_taxonomy
WHERE id IN (
  '6b7ed6b3-7ff2-426c-adc1-3e83a70d60c0',  -- Classificação de Carbonos e Cadeias
  '54a37ab6-e1c5-4d2f-8178-600b2c7cc63d'   -- Hidrocarbonetos
);

-- PASSO 5: Reorganizar posições dos micros restantes em Química Orgânica
UPDATE question_taxonomy
SET position = 1, updated_at = NOW()
WHERE id = 'ba6f364f-afa4-4c7b-8f13-dd3d91ef461f'; -- Introdução à orgânica (novo)

UPDATE question_taxonomy
SET position = 2, updated_at = NOW()
WHERE id = 'e3f5eb3a-8258-49cd-abbb-e59a5f67971e'; -- Nomenclatura Orgânica

UPDATE question_taxonomy
SET position = 3, updated_at = NOW()
WHERE id = '34b435ea-7316-449e-b713-bd5449a43a51'; -- Funções Orgânicas

UPDATE question_taxonomy
SET position = 4, updated_at = NOW()
WHERE id = 'dbaf7be8-fe98-4186-bb69-7c67618d3bb5'; -- Propriedades Orgânicas

UPDATE question_taxonomy
SET position = 5, updated_at = NOW()
WHERE id = '491c4313-2925-483d-bf93-a69a8ebde393'; -- Isomeria

UPDATE question_taxonomy
SET position = 6, updated_at = NOW()
WHERE id = 'ab72e0b2-0dc5-4cd7-8cea-3eb1a96abf81'; -- Reações Orgânicas

UPDATE question_taxonomy
SET position = 7, updated_at = NOW()
WHERE id = 'b62855d7-57a5-4530-bc49-d4e0fa1ed219'; -- Polímeros