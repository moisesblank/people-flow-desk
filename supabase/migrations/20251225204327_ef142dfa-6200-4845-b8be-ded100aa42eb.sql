-- ============================================
-- 🛡️ SECURITY FIX v2: Remover policies permissivas antigas
-- Prompt C - Limpeza completa de conflitos
-- ============================================

-- 1. team_chat_messages - Remover policies antigas permissivas
DROP POLICY IF EXISTS "Authenticated users can view all team messages" ON public.team_chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.team_chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.team_chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.team_chat_messages;
DROP POLICY IF EXISTS "team_chat_read_v32" ON public.team_chat_messages;

-- 2. event_consumers - Remover policy permissiva
DROP POLICY IF EXISTS "Sistema pode ler consumidores" ON public.event_consumers;

-- 3. video_domain_whitelist - Remover policies permissivas
DROP POLICY IF EXISTS "vdw_public_select" ON public.video_domain_whitelist;
DROP POLICY IF EXISTS "vdw_select" ON public.video_domain_whitelist;
DROP POLICY IF EXISTS "video_domain_read" ON public.video_domain_whitelist;
DROP POLICY IF EXISTS "video_domain_admin" ON public.video_domain_whitelist;

-- 4. xp_rules - Remover policy permissiva
DROP POLICY IF EXISTS "Todos podem ver regras de XP" ON public.xp_rules;

-- 5. event_consumers - Remover policy duplicada
DROP POLICY IF EXISTS "Owner pode gerenciar consumidores" ON public.event_consumers;

-- 6. xp_rules - Remover policy duplicada
DROP POLICY IF EXISTS "Owner pode gerenciar regras" ON public.xp_rules;