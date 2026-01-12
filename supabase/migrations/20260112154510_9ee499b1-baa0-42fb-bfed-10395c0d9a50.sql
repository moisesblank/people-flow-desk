-- PATCH: Normalizar labels de taxonomia em quiz_questions (remover prefixos de ícones/emoji)
-- Motivo: /alunos/questoes filtra por label humano (sem ícone), então macros/micros com emoji prefixado causam resultado 0.

-- 1) Normalizar MACRO
UPDATE public.quiz_questions
SET macro = NULLIF(btrim(regexp_replace(macro, '^[^[:alnum:]]+\s*', '')), ''),
    updated_at = now()
WHERE macro IS NOT NULL
  AND macro <> btrim(regexp_replace(macro, '^[^[:alnum:]]+\s*', ''));

-- 2) Normalizar MICRO
UPDATE public.quiz_questions
SET micro = NULLIF(btrim(regexp_replace(micro, '^[^[:alnum:]]+\s*', '')), ''),
    updated_at = now()
WHERE micro IS NOT NULL
  AND micro <> btrim(regexp_replace(micro, '^[^[:alnum:]]+\s*', ''));

-- 3) Normalizar TEMA
UPDATE public.quiz_questions
SET tema = NULLIF(btrim(regexp_replace(tema, '^[^[:alnum:]]+\s*', '')), ''),
    updated_at = now()
WHERE tema IS NOT NULL
  AND tema <> btrim(regexp_replace(tema, '^[^[:alnum:]]+\s*', ''));

-- 4) Normalizar SUBTEMA
UPDATE public.quiz_questions
SET subtema = NULLIF(btrim(regexp_replace(subtema, '^[^[:alnum:]]+\s*', '')), ''),
    updated_at = now()
WHERE subtema IS NOT NULL
  AND subtema <> btrim(regexp_replace(subtema, '^[^[:alnum:]]+\s*', ''));
