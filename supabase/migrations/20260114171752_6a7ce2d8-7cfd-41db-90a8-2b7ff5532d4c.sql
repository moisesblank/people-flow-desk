
-- ============================================
-- 🔧 NORMALIZAÇÃO UNIVERSAL DE TAXONOMIA
-- Constituição v10.4 — IMUTÁVEL PARA SEMPRE
-- ============================================
-- REGRA: ZERO EMOJIS EM LABELS E ICONS
-- ============================================

-- 1. Remover TODOS os ícones da tabela question_taxonomy
UPDATE question_taxonomy
SET icon = NULL
WHERE icon IS NOT NULL;

-- 2. Limpar MACROs em question_taxonomy (os 5 soberanos)
UPDATE question_taxonomy SET label = 'Química Geral' WHERE label LIKE '%Química Geral%' AND level = 'macro';
UPDATE question_taxonomy SET label = 'Química Orgânica' WHERE label LIKE '%Química Orgânica%' AND level = 'macro';
UPDATE question_taxonomy SET label = 'Físico-Química' WHERE label LIKE '%Físico-Química%' AND level = 'macro';
UPDATE question_taxonomy SET label = 'Química Ambiental' WHERE label LIKE '%Química Ambiental%' AND level = 'macro';
UPDATE question_taxonomy SET label = 'Bioquímica' WHERE label LIKE '%Bioquímica%' AND level = 'macro';

-- 3. Limpar MICROs específicos que têm emoji
UPDATE question_taxonomy SET label = 'Aminoácidos' WHERE label = '🔗 Aminoácidos' OR label LIKE '%🔗%Aminoácidos%';
UPDATE question_taxonomy SET label = 'Chuva Ácida' WHERE label = '🌧️ Chuva Ácida' OR label LIKE '%🌧️%Chuva Ácida%';
UPDATE question_taxonomy SET label = 'Poluição Hídrica' WHERE label = '💧 Poluição Hídrica' OR label LIKE '%💧%Poluição Hídrica%';
UPDATE question_taxonomy SET label = 'Sustentabilidade' WHERE label = '♻️ Sustentabilidade' OR label LIKE '%♻️%Sustentabilidade%';

-- 4. Garantir quiz_questions.macro sem emojis
UPDATE quiz_questions SET macro = 'Química Geral' WHERE macro LIKE '%⚗️%' OR macro LIKE '⚗️%';
UPDATE quiz_questions SET macro = 'Química Orgânica' WHERE macro LIKE '%🧪%' OR macro LIKE '🧪%';
UPDATE quiz_questions SET macro = 'Físico-Química' WHERE macro LIKE '%📊%' OR macro LIKE '📊%';
UPDATE quiz_questions SET macro = 'Química Ambiental' WHERE macro LIKE '%🌍%' OR macro LIKE '🌍%';
UPDATE quiz_questions SET macro = 'Bioquímica' WHERE macro LIKE '%🧬%' OR macro LIKE '🧬%';

-- 5. Garantir quiz_questions.micro sem emojis
UPDATE quiz_questions SET micro = 'Aminoácidos' WHERE micro LIKE '%🔗%';
UPDATE quiz_questions SET micro = 'Chuva Ácida' WHERE micro LIKE '%🌧️%';
UPDATE quiz_questions SET micro = 'Poluição Hídrica' WHERE micro LIKE '%💧%';
UPDATE quiz_questions SET micro = 'Sustentabilidade' WHERE micro LIKE '%♻️%';

-- 6. Comentário de auditoria
COMMENT ON TABLE question_taxonomy IS 'TAXONOMIA CANÔNICA v10.4 - NORMALIZADA 2026-01-14 - ZERO EMOJIS - IMUTÁVEL';
