-- ============================================================
-- CANONICAL CHEMISTRY GENERAL TAXONOMY RESET v2.0
-- SINGLE SOURCE OF TRUTH - PERMANENT AND AUTHORITATIVE
-- ============================================================

-- STEP 1: Delete all existing taxonomy for Química Geral (keep the macro)
DELETE FROM question_taxonomy 
WHERE parent_id IN (
  SELECT id FROM question_taxonomy 
  WHERE parent_id IN (
    SELECT id FROM question_taxonomy 
    WHERE parent_id = 'f4f5013d-f91c-4497-b42c-dad45fda92fc'
  )
);

DELETE FROM question_taxonomy 
WHERE parent_id IN (
  SELECT id FROM question_taxonomy 
  WHERE parent_id = 'f4f5013d-f91c-4497-b42c-dad45fda92fc'
);

DELETE FROM question_taxonomy 
WHERE parent_id = 'f4f5013d-f91c-4497-b42c-dad45fda92fc';

-- STEP 2: Insert CANONICAL MICROs for Química Geral using gen_random_uuid()
INSERT INTO question_taxonomy (label, value, level, parent_id, position, is_active) VALUES
('Introdução à Química Inorgânica', 'introducao_quimica_inorganica', 'micro', 'f4f5013d-f91c-4497-b42c-dad45fda92fc', 1, true),
('Atomística', 'atomistica', 'micro', 'f4f5013d-f91c-4497-b42c-dad45fda92fc', 2, true),
('Tabela Periódica', 'tabela_periodica', 'micro', 'f4f5013d-f91c-4497-b42c-dad45fda92fc', 3, true),
('Número de Oxidação (NOX)', 'numero_oxidacao_nox', 'micro', 'f4f5013d-f91c-4497-b42c-dad45fda92fc', 4, true),
('Ligações Químicas', 'ligacoes_quimicas', 'micro', 'f4f5013d-f91c-4497-b42c-dad45fda92fc', 5, true),
('Funções Inorgânicas', 'funcoes_inorganicas', 'micro', 'f4f5013d-f91c-4497-b42c-dad45fda92fc', 6, true),
('Teorias Ácido-Base', 'teorias_acido_base', 'micro', 'f4f5013d-f91c-4497-b42c-dad45fda92fc', 7, true),
('Reações Inorgânicas', 'reacoes_inorganicas', 'micro', 'f4f5013d-f91c-4497-b42c-dad45fda92fc', 8, true),
('Cálculos Químicos', 'calculos_quimicos', 'micro', 'f4f5013d-f91c-4497-b42c-dad45fda92fc', 9, true),
('Estequiometria', 'estequiometria', 'micro', 'f4f5013d-f91c-4497-b42c-dad45fda92fc', 10, true),
('Gases', 'gases', 'micro', 'f4f5013d-f91c-4497-b42c-dad45fda92fc', 11, true);