-- FASE 1A: Adicionar novos valores ao enum (commit separado)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coordenacao';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'suporte';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'monitoria';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'afiliado';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'contabilidade';