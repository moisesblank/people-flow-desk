// ============================================
// 🧠 AXIOMA I - CONTEXTO PREDITIVO UNIVERSAL
// Compila a "alma" do aluno em um instante
// Para interações trilhões de vezes mais inteligentes
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserContext {
  aluno_id: string;
  perfil_aprendizagem: 'visual' | 'auditivo' | 'cinestesico' | 'leitura' | 'misto';
  top_3_dificuldades: string[];
  top_3_forcas: string[];
  ultima_aula_assistida: string | null;
  progresso_geral: number;
  tempo_medio_estudo_diario: number;
  estado_emocional_inferido: 'motivado' | 'focado' | 'cansado' | 'frustrado' | 'neutro';
  nivel_engajamento: 'alto' | 'medio' | 'baixo';
  dias_desde_ultimo_acesso: number;
  streaks: {
    atual: number;
    maior: number;
  };
  xp_e_nivel: {
    total_xp: number;
    nivel: number;
    xp_para_proximo_nivel: number;
  };
  areas_recomendadas: string[];
  risco_churn: number;
  hora_preferida_estudo: string;
  dispositivo_preferido: 'desktop' | 'mobile' | 'tablet' | 'misto';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Validação ESTRITA: apenas x-internal-secret válido (SEM fallback de User-Agent)
    const isInternalCall = internalSecret === INTERNAL_SECRET;

    if (!isInternalCall) {
      console.log('[GENERATE-CONTEXT] ❌ BLOQUEADO: Chamada externa não autorizada');
      
      await supabase.from('security_events').insert({
        event_type: 'GENERATE_CONTEXT_EXTERNAL_CALL',
        severity: 'warning',
        description: 'Tentativa de geração de contexto via chamada externa bloqueada',
        payload: {
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
          user_agent: userAgent.substring(0, 255)
        }
      });
      
      return new Response(JSON.stringify({ 
        error: 'Acesso restrito a chamadas internas' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[GENERATE-CONTEXT] ✅ Chamada interna autorizada');

    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🧠 Gerando contexto preditivo para: ${userId}`);

    // ========================================
    // COLETA DE DADOS EM PARALELO (PERFORMANCE)
    // ========================================
    const [
      profileResult,
      lessonsResult,
      questionsResult,
      eventsResult,
      progressResult,
      badgesResult
    ] = await Promise.all([
      // Perfil do usuário com XP e nível
      supabase.from('profiles').select('*').eq('id', userId).single(),
      
      // Últimas aulas assistidas
      supabase.from('lesson_progress')
        .select('lesson_id, progress_percentage, time_spent_seconds, updated_at, lessons(title)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10),
      
      // Tentativas de questões (para análise de dificuldades)
      supabase.from('question_attempts')
        .select('question_id, is_correct, created_at, questions(area, difficulty)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      
      // Eventos recentes (para inferir comportamento)
      supabase.from('events')
        .select('name, payload, created_at')
        .eq('payload->>user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Progresso geral do curso
      supabase.from('course_progress')
        .select('progress_percentage, time_spent_seconds, last_accessed_at')
        .eq('user_id', userId)
        .single(),
      
      // Conquistas e badges
      supabase.from('user_badges')
        .select('badge_id, earned_at, badges(name, category)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(10)
    ]);

    // ========================================
    // ANÁLISE DE DIFICULDADES E FORÇAS
    // ========================================
    const questions = questionsResult.data || [];
    const areaStats: Record<string, { correct: number; total: number }> = {};
    
    for (const attempt of questions) {
      const area = (attempt.questions as any)?.area || 'Geral';
      if (!areaStats[area]) {
        areaStats[area] = { correct: 0, total: 0 };
      }
      areaStats[area].total++;
      if (attempt.is_correct) {
        areaStats[area].correct++;
      }
    }

    // Ordenar por performance
    const areaPerformance = Object.entries(areaStats)
      .map(([area, stats]) => ({
        area,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        total: stats.total
      }))
      .filter(a => a.total >= 3) // Mínimo 3 questões
      .sort((a, b) => a.accuracy - b.accuracy);

    const dificuldades = areaPerformance.slice(0, 3).map(a => a.area);
    const forcas = [...areaPerformance].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3).map(a => a.area);

    // ========================================
    // INFERIR PERFIL DE APRENDIZAGEM
    // ========================================
    const events = eventsResult.data || [];
    let perfilAprendizagem: UserContext['perfil_aprendizagem'] = 'misto';
    
    const eventCounts = {
      video: events.filter(e => e.name?.includes('lesson') || e.name?.includes('video')).length,
      quiz: events.filter(e => e.name?.includes('quiz') || e.name?.includes('question')).length,
      flashcard: events.filter(e => e.name?.includes('flashcard')).length,
      reading: events.filter(e => e.name?.includes('content') || e.name?.includes('material')).length
    };

    const maxEvent = Object.entries(eventCounts).sort((a, b) => b[1] - a[1])[0];
    if (maxEvent && maxEvent[1] > 10) {
      switch (maxEvent[0]) {
        case 'video': perfilAprendizagem = 'visual'; break;
        case 'quiz': case 'flashcard': perfilAprendizagem = 'cinestesico'; break;
        case 'reading': perfilAprendizagem = 'leitura'; break;
      }
    }

    // ========================================
    // CALCULAR ENGAJAMENTO E RISCO DE CHURN
    // ========================================
    const profile = profileResult.data;
    const progress = progressResult.data;
    
    let diasSemAcesso = 0;
    if (progress?.last_accessed_at) {
      diasSemAcesso = Math.floor((Date.now() - new Date(progress.last_accessed_at).getTime()) / (1000 * 60 * 60 * 24));
    } else if (profile?.last_sign_in_at) {
      diasSemAcesso = Math.floor((Date.now() - new Date(profile.last_sign_in_at).getTime()) / (1000 * 60 * 60 * 24));
    }

    // Risco de churn baseado em inatividade e progresso
    let riscoChurn = 0;
    if (diasSemAcesso > 30) riscoChurn = 0.9;
    else if (diasSemAcesso > 14) riscoChurn = 0.7;
    else if (diasSemAcesso > 7) riscoChurn = 0.4;
    else if (diasSemAcesso > 3) riscoChurn = 0.2;
    else riscoChurn = 0.05;

    // Ajustar por progresso
    const progressoGeral = progress?.progress_percentage || 0;
    if (progressoGeral < 10 && diasSemAcesso > 3) riscoChurn = Math.min(1, riscoChurn + 0.2);

    // Nível de engajamento
    let nivelEngajamento: UserContext['nivel_engajamento'] = 'baixo';
    const eventosRecentes = events.filter(e => {
      const eventDate = new Date(e.created_at);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return eventDate >= sevenDaysAgo;
    }).length;
    
    if (eventosRecentes > 20) nivelEngajamento = 'alto';
    else if (eventosRecentes > 5) nivelEngajamento = 'medio';

    // ========================================
    // INFERIR ESTADO EMOCIONAL
    // ========================================
    let estadoEmocional: UserContext['estado_emocional_inferido'] = 'neutro';
    
    const questoesRecentes = questions.slice(0, 10);
    const acertosRecentes = questoesRecentes.filter(q => q.is_correct).length;
    const taxaAcertoRecente = questoesRecentes.length > 0 ? (acertosRecentes / questoesRecentes.length) * 100 : 50;

    if (taxaAcertoRecente >= 80 && nivelEngajamento === 'alto') estadoEmocional = 'motivado';
    else if (taxaAcertoRecente >= 60) estadoEmocional = 'focado';
    else if (taxaAcertoRecente < 40 && questoesRecentes.length >= 5) estadoEmocional = 'frustrado';
    else if (diasSemAcesso > 5) estadoEmocional = 'cansado';

    // ========================================
    // IDENTIFICAR HORA PREFERIDA DE ESTUDO
    // ========================================
    const hourCounts: Record<number, number> = {};
    for (const event of events) {
      const hour = new Date(event.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    
    const horaPreferida = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    const horaPreferidaFormatada = horaPreferida 
      ? `${String(parseInt(horaPreferida[0])).padStart(2, '0')}:00`
      : '20:00';

    // ========================================
    // ÚLTIMA AULA ASSISTIDA
    // ========================================
    const lessonsData = lessonsResult.data || [];
    const primeiraAula = lessonsData[0] as any;
    const ultimaAula = primeiraAula?.lessons?.title || null;

    // ========================================
    // XP E NÍVEL
    // ========================================
    const totalXp = profile?.total_xp || 0;
    const nivel = profile?.level || 1;
    const xpParaProximoNivel = (nivel + 1) * 1000 - totalXp;

    // ========================================
    // STREAKS
    // ========================================
    const streakAtual = profile?.current_streak || 0;
    const maiorStreak = profile?.max_streak || 0;

    // ========================================
    // ÁREAS RECOMENDADAS
    // ========================================
    const areasRecomendadas = dificuldades.length > 0 
      ? dificuldades 
      : ['Química Orgânica', 'Estequiometria', 'Eletroquímica'];

    // ========================================
    // TEMPO MÉDIO DE ESTUDO
    // ========================================
    const tempoMedioEstudo = lessonsData.length > 0
      ? Math.round(lessonsData.reduce((sum: number, l: any) => sum + (l.time_spent_seconds || 0), 0) / lessonsData.length / 60)
      : 0;

    // ========================================
    // MONTAR CONTEXTO FINAL
    // ========================================
    const context: UserContext = {
      aluno_id: userId,
      perfil_aprendizagem: perfilAprendizagem,
      top_3_dificuldades: dificuldades,
      top_3_forcas: forcas,
      ultima_aula_assistida: ultimaAula,
      progresso_geral: progressoGeral,
      tempo_medio_estudo_diario: tempoMedioEstudo,
      estado_emocional_inferido: estadoEmocional,
      nivel_engajamento: nivelEngajamento,
      dias_desde_ultimo_acesso: diasSemAcesso,
      streaks: {
        atual: streakAtual,
        maior: maiorStreak
      },
      xp_e_nivel: {
        total_xp: totalXp,
        nivel,
        xp_para_proximo_nivel: Math.max(0, xpParaProximoNivel)
      },
      areas_recomendadas: areasRecomendadas,
      risco_churn: riscoChurn,
      hora_preferida_estudo: horaPreferidaFormatada,
      dispositivo_preferido: 'misto' // Poderia ser inferido de user-agent
    };

    const processingTime = Date.now() - startTime;
    console.log(`✅ Contexto gerado em ${processingTime}ms para: ${userId}`);

    return new Response(JSON.stringify({
      success: true,
      context,
      processing_time_ms: processingTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro ao gerar contexto:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
