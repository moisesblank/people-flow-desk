// ============================================
// HOOK: useAreasAnalysis - Análise por Área
// SANTUÁRIO v9.0 - Lei I: Performance Máxima
// Análise específica para áreas de Química
// ============================================

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubspaceQuery, SUBSPACE_CACHE_PROFILES } from './useSubspaceCommunication';

// Tipos
export interface AreaPerformance {
  areaId: string;
  areaName: string;
  areaIcon: string | null;
  areaColor: string | null;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  averageTime: number | null;
  lastAttempt: string | null;
  trend: 'up' | 'down' | 'stable';
  level: 'iniciante' | 'intermediario' | 'avancado' | 'mestre';
  xpEarned: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  progressPercent: number;
}

export interface AreasAnalysisStats {
  totalAreas: number;
  areasWithActivity: number;
  strongestArea: AreaPerformance | null;
  weakestArea: AreaPerformance | null;
  averageAccuracy: number;
  totalXP: number;
  recommendations: AreaRecommendation[];
}

export interface AreaRecommendation {
  areaId: string;
  areaName: string;
  type: 'focus' | 'review' | 'advance' | 'maintain';
  priority: 'alta' | 'media' | 'baixa';
  reason: string;
  action: string;
}

// Áreas de Química — ZERO EMOJIS (Constituição v10.4)
const CHEMISTRY_AREAS = {
  // 5 MACROS CANÔNICOS
  'quimica-geral': { name: 'Química Geral', color: '#F59E0B' },
  'quimica-organica': { name: 'Química Orgânica', color: '#8B5CF6' },
  'fisico-quimica': { name: 'Físico-Química', color: '#06B6D4' },
  'quimica-ambiental': { name: 'Química Ambiental', color: '#10B981' },
  'bioquimica': { name: 'Bioquímica', color: '#EC4899' },
  // Subáreas para análises detalhadas
  'estequiometria': { name: 'Estequiometria', color: '#EF4444' },
  'eletroquimica': { name: 'Eletroquímica', color: '#3B82F6' },
  'termoquimica': { name: 'Termoquímica', color: '#F97316' },
  'cinetica': { name: 'Cinética Química', color: '#84CC16' },
  'equilibrio': { name: 'Equilíbrio Químico', color: '#A855F7' },
  'solucoes': { name: 'Soluções', color: '#14B8A6' },
};

export interface UseAreasAnalysisOptions {
  includeInactive?: boolean;
  minAttempts?: number;
}

/**
 * Hook para análise de desempenho por área de estudo
 * Foco em áreas de Química com métricas detalhadas
 */
export function useAreasAnalysis(options: UseAreasAnalysisOptions = {}) {
  const { user } = useAuth();
  const { includeInactive = false, minAttempts = 1 } = options;

  // 🌌 Query migrada para useSubspaceQuery - Cache localStorage
  const {
    data: areasPerformance,
    isLoading,
    error,
    refetch
  } = useSubspaceQuery<AreaPerformance[]>(
    ['areas-analysis', user?.id || 'anon', String(includeInactive), String(minAttempts)],
    async (): Promise<AreaPerformance[]> => {
      if (!user?.id) return [];

      // 1. Buscar todas as áreas de estudo
      const { data: areas, error: areasError } = await supabase
        .from('study_areas')
        .select('id, name, icon, color')
        .order('name');

      if (areasError) throw areasError;

      // 2. Buscar tentativas de questões por área
      const { data: attempts, error: attemptsError } = await supabase
        .from('question_attempts')
        .select(`
          id,
          is_correct,
          time_spent_seconds,
          created_at,
          question:sanctuary_questions!inner(
            area_id
          )
        `)
        .eq('user_id', user.id);

      if (attemptsError) throw attemptsError;

      // 3. Buscar progresso de aulas por área
      const { data: lessonProgress, error: lessonsError } = await supabase
        .from('lesson_progress')
        .select(`
          id,
          completed,
          lesson:lessons!inner(
            module:modules!inner(
              course:courses(category)
            )
          )
        `)
        .eq('user_id', user.id);

      if (lessonsError) throw lessonsError;

      // 4. Buscar XP por área (via xp_history)
      const { data: xpHistory } = await supabase
        .from('xp_history')
        .select('amount, source, source_id, created_at')
        .eq('user_id', user.id);

      // 5. Calcular métricas por área
      const areaMetrics = new Map<string, {
        correct: number;
        wrong: number;
        totalTime: number;
        attempts: any[];
        xp: number;
        lessonsCompleted: number;
        lessonsTotal: number;
      }>();

      // Inicializar todas as áreas
      areas?.forEach(area => {
        areaMetrics.set(area.id, {
          correct: 0,
          wrong: 0,
          totalTime: 0,
          attempts: [],
          xp: 0,
          lessonsCompleted: 0,
          lessonsTotal: 0
        });
      });

      // Agregar tentativas
      attempts?.forEach(attempt => {
        const areaId = (attempt.question as any)?.area_id;
        if (!areaId) return;

        const metrics = areaMetrics.get(areaId);
        if (!metrics) return;

        if (attempt.is_correct) {
          metrics.correct++;
        } else {
          metrics.wrong++;
        }
        metrics.totalTime += attempt.time_spent_seconds || 0;
        metrics.attempts.push(attempt);
      });

      // Calcular tendência (últimas 10 vs anteriores)
      const calculateTrend = (attempts: any[]): 'up' | 'down' | 'stable' => {
        if (attempts.length < 5) return 'stable';
        
        const sorted = [...attempts].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const recent = sorted.slice(0, 5);
        const older = sorted.slice(5, 10);
        
        if (older.length === 0) return 'stable';
        
        const recentAcc = recent.filter(a => a.is_correct).length / recent.length;
        const olderAcc = older.filter(a => a.is_correct).length / older.length;
        
        if (recentAcc > olderAcc + 0.1) return 'up';
        if (recentAcc < olderAcc - 0.1) return 'down';
        return 'stable';
      };

      // Determinar nível baseado em accuracy e quantidade
      const getLevel = (accuracy: number, total: number): AreaPerformance['level'] => {
        if (total < 10) return 'iniciante';
        if (accuracy >= 90 && total >= 50) return 'mestre';
        if (accuracy >= 75 && total >= 30) return 'avancado';
        if (accuracy >= 60 && total >= 15) return 'intermediario';
        return 'iniciante';
      };

      // Construir resultado
      const performance: AreaPerformance[] = [];

      areas?.forEach(area => {
        const metrics = areaMetrics.get(area.id)!;
        const totalQuestions = metrics.correct + metrics.wrong;

        // Pular áreas sem atividade se não incluir inativas
        if (!includeInactive && totalQuestions < minAttempts) return;

        const accuracy = totalQuestions > 0 
          ? (metrics.correct / totalQuestions) * 100 
          : 0;

        const lastAttempt = metrics.attempts.length > 0
          ? metrics.attempts.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0].created_at
          : null;

        performance.push({
          areaId: area.id,
          areaName: area.name,
          areaIcon: area.icon,
          areaColor: area.color,
          totalQuestions,
          correctAnswers: metrics.correct,
          wrongAnswers: metrics.wrong,
          accuracy: Math.round(accuracy * 10) / 10,
          averageTime: totalQuestions > 0 
            ? Math.round(metrics.totalTime / totalQuestions) 
            : null,
          lastAttempt,
          trend: calculateTrend(metrics.attempts),
          level: getLevel(accuracy, totalQuestions),
          xpEarned: metrics.xp,
          lessonsCompleted: metrics.lessonsCompleted,
          lessonsTotal: metrics.lessonsTotal,
          progressPercent: metrics.lessonsTotal > 0 
            ? (metrics.lessonsCompleted / metrics.lessonsTotal) * 100 
            : 0
        });
      });

      // Ordenar por atividade recente
      return performance.sort((a, b) => {
        if (!a.lastAttempt && !b.lastAttempt) return 0;
        if (!a.lastAttempt) return 1;
        if (!b.lastAttempt) return -1;
        return new Date(b.lastAttempt).getTime() - new Date(a.lastAttempt).getTime();
      });
    },
    {
      profile: 'user', // Cache por 5min, persistência
      persistKey: `areas_analysis_${user?.id}`,
      enabled: !!user?.id,
    }
  );

  // Query: estatísticas gerais - MIGRADO PARA useSubspaceQuery
  const { data: stats } = useSubspaceQuery<AreasAnalysisStats>(
    ['areas-analysis-stats', user?.id || 'anon'],
    async (): Promise<AreasAnalysisStats> => {
      if (!areasPerformance || areasPerformance.length === 0) {
        return {
          totalAreas: 0,
          areasWithActivity: 0,
          strongestArea: null,
          weakestArea: null,
          averageAccuracy: 0,
          totalXP: 0,
          recommendations: []
        };
      }

      const activeAreas = areasPerformance.filter(a => a.totalQuestions > 0);
      
      // Encontrar área mais forte e mais fraca
      const sortedByAccuracy = [...activeAreas].sort((a, b) => b.accuracy - a.accuracy);
      const strongestArea = sortedByAccuracy[0] || null;
      const weakestArea = activeAreas.length > 1 
        ? sortedByAccuracy[sortedByAccuracy.length - 1] 
        : null;

      // Média de accuracy
      const totalAccuracy = activeAreas.reduce((sum, a) => sum + a.accuracy, 0);
      const averageAccuracy = activeAreas.length > 0 
        ? Math.round((totalAccuracy / activeAreas.length) * 10) / 10 
        : 0;

      // Total XP
      const totalXP = areasPerformance.reduce((sum, a) => sum + a.xpEarned, 0);

      // Gerar recomendações
      const recommendations: AreaRecommendation[] = [];

      // Áreas com baixa accuracy
      activeAreas
        .filter(a => a.accuracy < 60 && a.totalQuestions >= 5)
        .forEach(area => {
          recommendations.push({
            areaId: area.areaId,
            areaName: area.areaName,
            type: 'focus',
            priority: 'alta',
            reason: `Accuracy de ${area.accuracy}% está abaixo do ideal`,
            action: 'Revisar conteúdo e praticar mais questões'
          });
        });

      // Áreas em declínio
      activeAreas
        .filter(a => a.trend === 'down')
        .forEach(area => {
          recommendations.push({
            areaId: area.areaId,
            areaName: area.areaName,
            type: 'review',
            priority: 'media',
            reason: 'Desempenho em queda nas últimas questões',
            action: 'Fazer revisão rápida dos conceitos'
          });
        });

      // Áreas prontas para avançar
      activeAreas
        .filter(a => a.accuracy >= 85 && a.trend !== 'down' && a.level !== 'mestre')
        .forEach(area => {
          recommendations.push({
            areaId: area.areaId,
            areaName: area.areaName,
            type: 'advance',
            priority: 'baixa',
            reason: `Excelente accuracy de ${area.accuracy}%!`,
            action: 'Avançar para questões mais difíceis'
          });
        });

      return {
        totalAreas: areasPerformance.length,
        areasWithActivity: activeAreas.length,
        strongestArea,
        weakestArea,
        averageAccuracy,
        totalXP,
        recommendations: recommendations.slice(0, 5)
      };
    },
    {
      profile: 'user',
      persistKey: `areas_stats_${user?.id}`,
      enabled: !!areasPerformance,
    }
  );

  // Helpers
  const getAreaById = (areaId: string) => 
    areasPerformance?.find(a => a.areaId === areaId) || null;

  const getAreasNeedingAttention = () => 
    areasPerformance?.filter(a => a.accuracy < 70 && a.totalQuestions >= 5) || [];

  const getMasteredAreas = () => 
    areasPerformance?.filter(a => a.level === 'mestre') || [];

  const getAreasSortedByAccuracy = (ascending = false) => {
    if (!areasPerformance) return [];
    return [...areasPerformance].sort((a, b) => 
      ascending ? a.accuracy - b.accuracy : b.accuracy - a.accuracy
    );
  };

  return {
    // Dados
    areas: areasPerformance || [],
    stats,
    
    // Estados
    isLoading,
    error,
    
    // Helpers
    getAreaById,
    getAreasNeedingAttention,
    getMasteredAreas,
    getAreasSortedByAccuracy,
    refetch,
    
    // Computed
    hasData: (areasPerformance?.length || 0) > 0,
    needsImprovement: (stats?.recommendations.filter(r => r.priority === 'alta').length || 0) > 0,
  };
}

/**
 * Hook simplificado para área específica
 */
export function useAreaPerformance(areaId: string) {
  const { areas, isLoading, error } = useAreasAnalysis({ includeInactive: true });
  
  const area = areas.find(a => a.areaId === areaId) || null;
  
  return {
    area,
    isLoading,
    error,
    hasData: area !== null && area.totalQuestions > 0
  };
}
