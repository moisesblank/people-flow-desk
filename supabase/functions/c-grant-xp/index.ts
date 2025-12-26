// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// SISTEMA NERVOSO DIVINO - Gamificação por Eventos
// Processa eventos de XP e atualiza pontuação do usuário
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

interface EventPayload {
  event: {
    id: number;
    name: string;
    user_id: string | null;
    entity_type: string | null;
    entity_id: string | null;
    payload: {
      user_id?: string;
      quiz_id?: string;
      lesson_id?: string;
      course_id?: string;
      question_id?: string;
      score?: number;
      duration_ms?: number;
      streak_days?: number;
      new_level?: number;
      previous_level?: number;
    };
  };
}

interface XpRule {
  action: string;
  xp_amount: number;
}

interface UserGamification {
  current_level: number;
  total_xp: number;
  current_streak?: number;
}

interface Badge {
  id: string;
  name: string;
  requirement_type: string;
  requirement_value: number | null;
  xp_reward: number | null;
}

interface UserAchievement {
  achievement_id: string;
}

// Tabela de XP padrão (fallback se não existir na tabela xp_rules)
const DEFAULT_XP_RULES: Record<string, number> = {
  "correct.answer": 10,
  "wrong.answer": 0,
  "lesson.started": 5,
  "lesson.completed": 50,
  "quiz.started": 5,
  "quiz.passed": 100,
  "quiz.failed": 10,
  "daily.login": 5,
  "streak.achieved": 25,
  "content.viewed": 2,
};

// Multiplicadores de bônus
const STREAK_MULTIPLIERS: Record<number, number> = {
  7: 1.5,   // 1 semana
  30: 2.0,  // 1 mês
  100: 3.0, // 100 dias
  365: 5.0, // 1 ano
};

serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ========================================
    // 🛡️ LEI VI - PROTEÇÃO INTERNA (P0-3 CORRIGIDO)
    // REMOVIDO fallback de User-Agent - apenas x-internal-secret
    // ========================================
    const internalSecret = req.headers.get('x-internal-secret');
    const userAgent = req.headers.get('user-agent') || '';
    const INTERNAL_SECRET = Deno.env.get('INTERNAL_SECRET');
    
    // CRÍTICO: Verificar se INTERNAL_SECRET está configurado
    if (!INTERNAL_SECRET) {
      console.error("🚨 [SECURITY] INTERNAL_SECRET não configurado!");
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Validação ESTRITA: apenas x-internal-secret válido (SEM fallback de User-Agent)
    const isInternalCall = internalSecret === INTERNAL_SECRET;

    if (!isInternalCall) {
      console.log('[C-GRANT-XP] ❌ BLOQUEADO: Chamada externa não autorizada');
      
      await supabaseAdmin.from('security_events').insert({
        event_type: 'GRANT_XP_EXTERNAL_CALL',
        severity: 'warning',
        description: 'Tentativa de concessão de XP via chamada externa bloqueada',
        payload: {
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
          user_agent: userAgent.substring(0, 255)
        }
      });
      
      return new Response(JSON.stringify({ 
        error: 'Acesso restrito a chamadas internas' 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log('[C-GRANT-XP] ✅ Chamada interna autorizada');

    const { event }: EventPayload = await req.json();

    // Determinar user_id do evento
    const userId = event.user_id || event.payload?.user_id;
    
    if (!userId) {
      console.log("⚠️ Evento sem user_id, ignorando XP");
      return new Response(
        JSON.stringify({ success: true, message: "No user_id, XP not granted" }),
        { headers: corsHeaders }
      );
    }

    console.log(`🎮 Processando XP para usuário: ${userId}, evento: ${event.name}`);

    // 1. Buscar regra de XP para este evento
    const { data: xpRule } = await supabaseAdmin
      .from("xp_rules")
      .select("xp_amount")
      .eq("action", event.name)
      .single() as { data: XpRule | null };

    let baseXp = xpRule?.xp_amount || DEFAULT_XP_RULES[event.name] || 0;

    if (baseXp === 0) {
      console.log(`⚠️ Nenhum XP configurado para: ${event.name}`);
      return new Response(
        JSON.stringify({ success: true, xp_granted: 0 }),
        { headers: corsHeaders }
      );
    }

    // 2. Aplicar multiplicadores de bônus
    let multiplier = 1.0;
    let bonusReason = "";

    // Bônus por quiz perfeito
    if (event.name === "quiz.passed" && event.payload.score === 100) {
      multiplier = 1.5;
      bonusReason = "Quiz perfeito! 🎯";
    }

    // Bônus por streak
    if (event.payload.streak_days) {
      const streakDays = event.payload.streak_days;
      for (const [days, mult] of Object.entries(STREAK_MULTIPLIERS).reverse()) {
        if (streakDays >= parseInt(days)) {
          multiplier = Math.max(multiplier, mult);
          bonusReason = `Streak de ${streakDays} dias! 🔥`;
          break;
        }
      }
    }

    const finalXp = Math.round(baseXp * multiplier);

    // 3. Atualizar XP do usuário usando a função RPC existente
    const { data: newTotal, error: xpError } = await supabaseAdmin.rpc("add_user_xp", {
      p_user_id: userId,
      p_amount: finalXp,
      p_source: event.name,
      p_source_id: event.entity_id || null,
      p_description: bonusReason || `XP por ${event.name}`,
    });

    if (xpError) {
      console.error("❌ Erro ao adicionar XP:", xpError);
      throw xpError;
    }

    // 4. Verificar level up
    const { data: gamification } = await supabaseAdmin
      .from("user_gamification")
      .select("current_level, total_xp")
      .eq("user_id", userId)
      .single() as { data: UserGamification | null };

    const newLevel = Math.floor((gamification?.total_xp || 0) / 100) + 1;
    const previousLevel = gamification?.current_level || 1;

    if (newLevel > previousLevel) {
      console.log(`🎉 Level Up! ${previousLevel} → ${newLevel}`);
      
      // Publicar evento de level up
      await supabaseAdmin.rpc("publish_event", {
        p_name: "level.up",
        p_payload: JSON.parse(JSON.stringify({
          user_id: userId,
          new_level: newLevel,
          previous_level: previousLevel,
          total_xp: gamification?.total_xp,
        })),
        p_entity_type: "user",
        p_entity_id: userId,
      });
    }

    // 5. Atualizar streak se for daily.login
    if (event.name === "daily.login") {
      const { data: streak } = await supabaseAdmin.rpc("update_user_streak", {
        p_user_id: userId,
      });

      // Verificar conquistas de streak
      const streakMilestones = [7, 30, 60, 100, 365];
      if (streak && streakMilestones.includes(streak as number)) {
        await supabaseAdmin.rpc("publish_event", {
          p_name: "streak.achieved",
          p_payload: JSON.parse(JSON.stringify({
            user_id: userId,
            streak_days: streak,
          })),
          p_entity_type: "user",
          p_entity_id: userId,
        });
      }
    }

    // 6. Verificar badges/conquistas
    await checkAndGrantBadges(supabaseAdmin, userId, event.name, gamification);

    console.log(`✅ XP concedido: +${finalXp} (base: ${baseXp}, mult: ${multiplier}x)`);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        xp_granted: finalXp,
        base_xp: baseXp,
        multiplier,
        bonus_reason: bonusReason,
        new_total: newTotal,
        level: newLevel,
        level_up: newLevel > previousLevel,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro em c-grant-xp:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// Verificar e conceder badges automaticamente
// deno-lint-ignore no-explicit-any
async function checkAndGrantBadges(
  supabase: any,
  userId: string,
  eventName: string,
  userProgress: UserGamification | null
) {
  try {
    // Buscar badges disponíveis para este tipo de evento
    const { data: badgesData } = await supabase
      .from("badges")
      .select("*")
      .eq("requirement_type", eventName);

    const badges = badgesData as Badge[] | null;
    if (!badges || badges.length === 0) return;

    // Buscar badges já obtidos
    const { data: userBadgesData } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    const userBadges = userBadgesData as UserAchievement[] | null;
    const earnedBadgeIds = new Set(userBadges?.map(b => b.achievement_id) || []);

    for (const badge of badges) {
      // Pular se já tem este badge
      if (earnedBadgeIds.has(badge.id)) continue;

      // Verificar se atingiu o requisito
      let qualified = false;
      
      switch (badge.requirement_type) {
        case "lesson.completed":
          // Contar aulas completadas
          const { count: lessonsCount } = await supabase
            .from("lesson_progress")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_completed", true);
          qualified = (lessonsCount || 0) >= (badge.requirement_value || 1);
          break;

        case "quiz.passed":
          // Contar quizzes passados
          const { count: quizzesCount } = await supabase
            .from("user_quiz_attempts")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("passed", true);
          qualified = (quizzesCount || 0) >= (badge.requirement_value || 1);
          break;

        case "daily.login":
          // Verificar streak
          qualified = (userProgress?.current_streak || 0) >= (badge.requirement_value || 1);
          break;
      }

      if (qualified) {
        // Conceder badge
        await supabase.from("user_achievements").insert({
          user_id: userId,
          achievement_id: badge.id,
        });

        // Conceder XP do badge
        if (badge.xp_reward) {
          await supabase.rpc("add_user_xp", {
            p_user_id: userId,
            p_amount: badge.xp_reward,
            p_source: "badge.earned",
            p_source_id: badge.id,
            p_description: `Badge: ${badge.name}`,
          });
        }

        // Publicar evento de badge
        await supabase.rpc("publish_event", {
          p_name: "badge.earned",
          p_payload: JSON.parse(JSON.stringify({
            user_id: userId,
            badge_id: badge.id,
            badge_name: badge.name,
            xp_reward: badge.xp_reward,
          })),
          p_entity_type: "badge",
          p_entity_id: badge.id,
        });

        console.log(`🏆 Badge concedido: ${badge.name}`);
      }
    }
  } catch (error) {
    console.warn("⚠️ Erro ao verificar badges:", error);
  }
}
