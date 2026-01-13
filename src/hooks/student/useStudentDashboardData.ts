// ============================================
// 📊 useStudentDashboardData — DADOS 100% REAIS
// ZERO mocks, ZERO estimativas, ZERO IA
// Fonte única: Supabase Database
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Interface de dados do dashboard do aluno
export interface StudentDashboardData {
  // Gamificação (user_gamification)
  xpTotal: number;
  nivel: number;
  diasConsecutivos: number;
  maiorSequencia: number;
  aulasCompletadas: number;
  cursosCompletados: number;
  badgesConquistados: number;
  ultimaAtividade: string | null;
  
  // Calculado de lesson_progress
  horasEstudadas: number;
  
  // Calculado de question_attempts
  questoesResolvidas: number;
  questoesCorretas: number;
  taxaAcerto: number;
  
  // Metadados
  dataCarregamento: string;
  fontesDados: string[];
}

// Níveis baseados em XP (fórmula determinística)
export function calcularNivel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function calcularXpProximoNivel(nivelAtual: number): number {
  return nivelAtual * 100;
}

export function getTituloNivel(nivel: number): string {
  if (nivel < 5) return "Iniciante";
  if (nivel < 10) return "Estudante";
  if (nivel < 15) return "Dedicado";
  if (nivel < 20) return "Cientista";
  if (nivel < 30) return "Mestre";
  if (nivel < 50) return "Grão-Mestre";
  return "Lenda";
}

// Hook principal - DADOS 100% REAIS
export function useStudentDashboardData(userId: string | undefined) {
  return useQuery({
    queryKey: ['student-dashboard-data', userId],
    queryFn: async (): Promise<StudentDashboardData> => {
      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      const fontesDados: string[] = [];
      const agora = new Date().toISOString();

      // 1. Buscar dados de gamificação
      const { data: gamification, error: gamError } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (gamError) {
        console.error('[DASHBOARD] Erro ao buscar gamificação:', gamError);
      }
      
      if (gamification) {
        fontesDados.push('user_gamification');
      }

      // 2. Buscar progresso de aulas (horas estudadas)
      const { data: lessonProgress, error: lpError } = await supabase
        .from('lesson_progress')
        .select('watch_time_seconds, completed')
        .eq('user_id', userId);
      
      if (lpError) {
        console.error('[DASHBOARD] Erro ao buscar lesson_progress:', lpError);
      }

      if (lessonProgress && lessonProgress.length > 0) {
        fontesDados.push('lesson_progress');
      }

      // 3. Buscar tentativas de questões
      const { data: questionAttempts, error: qaError } = await supabase
        .from('question_attempts')
        .select('is_correct')
        .eq('user_id', userId);
      
      if (qaError) {
        console.error('[DASHBOARD] Erro ao buscar question_attempts:', qaError);
      }

      if (questionAttempts && questionAttempts.length > 0) {
        fontesDados.push('question_attempts');
      }

      // Calcular métricas de lesson_progress
      const totalWatchTimeSeconds = lessonProgress?.reduce(
        (acc, lp) => acc + (lp.watch_time_seconds || 0), 
        0
      ) || 0;
      const horasEstudadas = Math.round((totalWatchTimeSeconds / 3600) * 10) / 10; // 1 casa decimal

      // Calcular métricas de question_attempts
      const questoesResolvidas = questionAttempts?.length || 0;
      const questoesCorretas = questionAttempts?.filter(qa => qa.is_correct)?.length || 0;
      const taxaAcerto = questoesResolvidas > 0 
        ? Math.round((questoesCorretas / questoesResolvidas) * 100) 
        : 0;

      // Montar resposta com dados REAIS (zero quando não existe)
      const resultado: StudentDashboardData = {
        // Gamificação
        xpTotal: gamification?.total_xp ?? 0,
        nivel: gamification?.current_level ?? calcularNivel(gamification?.total_xp ?? 0),
        diasConsecutivos: gamification?.current_streak ?? 0,
        maiorSequencia: gamification?.longest_streak ?? 0,
        aulasCompletadas: gamification?.lessons_completed ?? 0,
        cursosCompletados: gamification?.courses_completed ?? 0,
        badgesConquistados: gamification?.badges_earned ?? 0,
        ultimaAtividade: gamification?.last_activity_date ?? null,
        
        // Calculados
        horasEstudadas,
        questoesResolvidas,
        questoesCorretas,
        taxaAcerto,
        
        // Metadados (auditabilidade)
        dataCarregamento: agora,
        fontesDados,
      };

      console.log('[DASHBOARD] ✅ Dados REAIS carregados:', {
        userId,
        fontes: fontesDados,
        xp: resultado.xpTotal,
        questoes: resultado.questoesResolvidas,
        horas: resultado.horasEstudadas,
      });

      return resultado;
    },
    enabled: !!userId,
    staleTime: 30_000, // 30s - dados relativamente frescos
    gcTime: 5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Hook para dias restantes até ENEM (cálculo determinístico, não estimativa)
export function useDiasParaENEM(): number {
  // ENEM 2025: 2 e 9 de novembro de 2025 (usar primeira data)
  const dataENEM = new Date('2025-11-02');
  const hoje = new Date();
  const diffTime = dataENEM.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
