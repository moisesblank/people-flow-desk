
-- ============================================
-- 🔧 NORMALIZAÇÃO DE MACROS (UNIFICAÇÃO)
-- Constituição v10.4 — Question Domain
-- ============================================
-- REGRA: Labels canônicos SEM emoji
-- ============================================

-- 1. FÍSICA-QUÍMICA: Juntar as duas variantes
UPDATE quiz_questions
SET macro = 'Físico-Química'
WHERE macro = '📊 Físico-Química';

-- 2. QUÍMICA GERAL: Juntar as duas variantes
UPDATE quiz_questions
SET macro = 'Química Geral'
WHERE macro = '⚗️ Química Geral';

-- 3. QUÍMICA ORGÂNICA: Juntar as duas variantes
UPDATE quiz_questions
SET macro = 'Química Orgânica'
WHERE macro = '🧪 Química Orgânica';

-- 4. BIOQUÍMICA: Normalizar se houver variantes
UPDATE quiz_questions
SET macro = 'Bioquímica'
WHERE macro LIKE '%Bioquímica%' AND macro != 'Bioquímica';

-- 5. QUÍMICA AMBIENTAL: Normalizar se houver variantes
UPDATE quiz_questions
SET macro = 'Química Ambiental'
WHERE macro LIKE '%Química Ambiental%' AND macro != 'Química Ambiental';
