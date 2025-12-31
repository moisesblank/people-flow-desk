// =====================================================
// useStudentTips - Hook de Dicas Personalizadas
// Gera recomendações de estudo baseadas em performance + trends
// =====================================================

import { useMemo } from "react";
import { PerformanceStats } from "./useStudentPerformanceStats";
import { TrendData } from "./useStudentTrends";
import { TaxonomyNode } from "./useStudentTaxonomyPerformance";

export interface StudyTip {
  id: string;
  priority: 'high' | 'medium' | 'low';
  icon: 'alert' | 'trending-down' | 'target' | 'clock' | 'star' | 'book';
  title: string;
  description: string;
  macro?: string;
  micro?: string;
  actionLabel?: string;
}

interface UseStudentTipsParams {
  stats: PerformanceStats | null | undefined;
  trends: TrendData[] | undefined;
  taxonomyArray: TaxonomyNode[] | undefined;
  isLoading: boolean;
}

export function useStudentTips({ stats, trends, taxonomyArray, isLoading }: UseStudentTipsParams) {
  return useMemo(() => {
    if (isLoading || !stats) {
      return { tips: [], isLoading: true };
    }

    const tips: StudyTip[] = [];

    // 1. Pior área (prioridade alta se < 50%)
    if (stats.worstMacro !== 'N/A' && stats.worstMacroAccuracy < 50) {
      tips.push({
        id: 'worst-area-critical',
        priority: 'high',
        icon: 'alert',
        title: `Atenção: ${stats.worstMacro}`,
        description: `Seu aproveitamento em ${stats.worstMacro} está em ${stats.worstMacroAccuracy}%. Foque nessa área para melhorar.`,
        macro: stats.worstMacro,
        actionLabel: 'Estudar agora',
      });
    } else if (stats.worstMacro !== 'N/A' && stats.worstMacroAccuracy < 70) {
      tips.push({
        id: 'worst-area-medium',
        priority: 'medium',
        icon: 'target',
        title: `Melhore: ${stats.worstMacro}`,
        description: `${stats.worstMacro} tem ${stats.worstMacroAccuracy}% de acerto. Um pouco mais de prática pode fazer diferença.`,
        macro: stats.worstMacro,
        actionLabel: 'Praticar',
      });
    }

    // 2. Tendências de queda (prioridade alta)
    const decliningTrends = (trends || []).filter(
      t => t.trend === 'down' && t.isStatisticallyValid
    );
    
    for (const trend of decliningTrends.slice(0, 2)) {
      tips.push({
        id: `declining-${trend.macro}`,
        priority: 'high',
        icon: 'trending-down',
        title: `Queda em ${trend.macro}`,
        description: `Seu desempenho caiu de ${trend.previousAccuracy}% para ${trend.recentAccuracy}% nas últimas 2 semanas.`,
        macro: trend.macro,
        actionLabel: 'Revisar',
      });
    }

    // 3. Áreas com pouca prática (< 10 questões)
    const lowPracticeAreas = (taxonomyArray || []).filter(
      node => node.totalAttempts < 10 && node.totalAttempts > 0
    );
    
    if (lowPracticeAreas.length > 0) {
      tips.push({
        id: 'low-practice',
        priority: 'medium',
        icon: 'book',
        title: 'Pratique mais',
        description: `Você tem ${lowPracticeAreas.length} área(s) com menos de 10 questões. Pratique mais para ter dados confiáveis.`,
        actionLabel: 'Ver áreas',
      });
    }

    // 4. Tempo médio alto (> 120s)
    if (stats.avgTimeSeconds > 120) {
      tips.push({
        id: 'slow-time',
        priority: 'medium',
        icon: 'clock',
        title: 'Otimize seu tempo',
        description: `Sua média de ${Math.round(stats.avgTimeSeconds)}s por questão está alta. Pratique para ganhar velocidade.`,
        actionLabel: 'Treinar velocidade',
      });
    }

    // 5. Melhor área (reconhecimento positivo)
    if (stats.bestMacro !== 'N/A' && stats.bestMacroAccuracy >= 80) {
      tips.push({
        id: 'best-area',
        priority: 'low',
        icon: 'star',
        title: `Parabéns: ${stats.bestMacro}`,
        description: `Você está excelente em ${stats.bestMacro} com ${stats.bestMacroAccuracy}% de acerto!`,
        macro: stats.bestMacro,
      });
    }

    // 6. Tendências de melhora (positivo)
    const improvingTrends = (trends || []).filter(
      t => t.trend === 'up' && t.isStatisticallyValid
    );
    
    if (improvingTrends.length > 0) {
      tips.push({
        id: 'improving',
        priority: 'low',
        icon: 'star',
        title: 'Você está evoluindo!',
        description: `Melhoria detectada em ${improvingTrends.map(t => t.macro).join(', ')}. Continue assim!`,
      });
    }

    // 7. Sem questões ainda
    if (stats.totalQuestions === 0) {
      tips.push({
        id: 'no-questions',
        priority: 'high',
        icon: 'book',
        title: 'Comece a praticar!',
        description: 'Você ainda não respondeu nenhuma questão. Comece agora para ver suas estatísticas.',
        actionLabel: 'Iniciar prática',
      });
    }

    // Ordenar por prioridade
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return { tips: tips.slice(0, 5), isLoading: false };
  }, [stats, trends, taxonomyArray, isLoading]);
}
