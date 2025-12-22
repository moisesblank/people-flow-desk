-- ============================================================
-- 🧠 SISTEMA NERVOSO AUTÔNOMO (SNA) OMEGA v5.0 - PARTE 6
-- FORTALEZA DIGITAL — AUTOMAÇÃO IA NÍVEL 2300
-- ============================================================

-- Garantir extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums avançados para SNA
DO $$ BEGIN
  CREATE TYPE public.sna_job_status AS ENUM (
    'pending',      -- Aguardando processamento
    'scheduled',    -- Agendado para futuro
    'running',      -- Em execução
    'succeeded',    -- Sucesso
    'failed',       -- Falhou (retry possível)
    'dead',         -- Morto (sem retry)
    'cancelled',    -- Cancelado
    'paused'        -- Pausado
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sna_priority AS ENUM ('p0_critical', 'p1_urgent', 'p2_high', 'p3_normal', 'p4_low', 'p5_batch');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sna_provider AS ENUM (
    'gemini_flash',     -- Rápido, barato
    'gemini_pro',       -- Robusto
    'gpt5',             -- Crítico, máxima qualidade
    'gpt5_mini',        -- Balanceado
    'gpt5_nano',        -- Ultra rápido
    'claude_opus',      -- Raciocínio complexo
    'perplexity',       -- Pesquisa web
    'firecrawl',        -- Extração
    'elevenlabs',       -- Voz
    'whisper',          -- Transcrição
    'dall_e',           -- Imagens
    'internal'          -- Interno
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sna_agent_role AS ENUM (
    'router',           -- Roteador TRAMON
    'tutor',            -- Tutor IA
    'curator',          -- Curador de conteúdo
    'moderator',        -- Moderador de chat
    'marketing',        -- Marketing
    'operations',       -- Operações
    'financial',        -- Financeiro
    'support'           -- Suporte
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Comentários de documentação dos tipos
COMMENT ON TYPE public.sna_job_status IS '🧠 SNA: Status do job de automação IA';
COMMENT ON TYPE public.sna_priority IS '🧠 SNA: Níveis de prioridade para fila de jobs';
COMMENT ON TYPE public.sna_provider IS '🧠 SNA: Provedores de IA disponíveis no sistema';
COMMENT ON TYPE public.sna_agent_role IS '🧠 SNA: Papéis dos agentes IA no sistema';