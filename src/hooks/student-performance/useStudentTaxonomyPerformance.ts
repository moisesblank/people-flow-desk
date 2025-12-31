// =====================================================
// useStudentTaxonomyPerformance - Hook de Performance por Taxonomia
// Busca dados agregados do backend e monta árvore hierárquica
// =====================================================

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface TaxonomyNode {
  name: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracyPercent: number;
  avgTimeSeconds: number;
  difficultyDistribution: {
    facil: number;
    medio: number;
    dificil: number;
  };
  children: Map<string, TaxonomyNode>;
}

export interface TaxonomyPerformanceData {
  macro: string;
  micro: string;
  tema: string;
  subtema: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy_percent: number;
  avg_time_seconds: number;
  difficulty_distribution: {
    facil: number;
    medio: number;
    dificil: number;
  };
}

// Função para construir árvore a partir dos dados flat
function buildTaxonomyTree(data: TaxonomyPerformanceData[]): Map<string, TaxonomyNode> {
  const tree = new Map<string, TaxonomyNode>();

  for (const row of data) {
    // Nível 1: Macro
    if (!tree.has(row.macro)) {
      tree.set(row.macro, {
        name: row.macro,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracyPercent: 0,
        avgTimeSeconds: 0,
        difficultyDistribution: { facil: 0, medio: 0, dificil: 0 },
        children: new Map(),
      });
    }
    const macroNode = tree.get(row.macro)!;

    // Nível 2: Micro
    if (!macroNode.children.has(row.micro)) {
      macroNode.children.set(row.micro, {
        name: row.micro,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracyPercent: 0,
        avgTimeSeconds: 0,
        difficultyDistribution: { facil: 0, medio: 0, dificil: 0 },
        children: new Map(),
      });
    }
    const microNode = macroNode.children.get(row.micro)!;

    // Nível 3: Tema
    if (!microNode.children.has(row.tema)) {
      microNode.children.set(row.tema, {
        name: row.tema,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracyPercent: 0,
        avgTimeSeconds: 0,
        difficultyDistribution: { facil: 0, medio: 0, dificil: 0 },
        children: new Map(),
      });
    }
    const temaNode = microNode.children.get(row.tema)!;

    // Nível 4: Subtema (folha)
    temaNode.children.set(row.subtema, {
      name: row.subtema,
      totalAttempts: row.total_attempts,
      correctAttempts: row.correct_attempts,
      accuracyPercent: row.accuracy_percent,
      avgTimeSeconds: row.avg_time_seconds ?? 0,
      difficultyDistribution: row.difficulty_distribution ?? { facil: 0, medio: 0, dificil: 0 },
      children: new Map(),
    });

    // Agregar para cima
    temaNode.totalAttempts += row.total_attempts;
    temaNode.correctAttempts += row.correct_attempts;
    temaNode.difficultyDistribution.facil += row.difficulty_distribution?.facil ?? 0;
    temaNode.difficultyDistribution.medio += row.difficulty_distribution?.medio ?? 0;
    temaNode.difficultyDistribution.dificil += row.difficulty_distribution?.dificil ?? 0;

    microNode.totalAttempts += row.total_attempts;
    microNode.correctAttempts += row.correct_attempts;
    microNode.difficultyDistribution.facil += row.difficulty_distribution?.facil ?? 0;
    microNode.difficultyDistribution.medio += row.difficulty_distribution?.medio ?? 0;
    microNode.difficultyDistribution.dificil += row.difficulty_distribution?.dificil ?? 0;

    macroNode.totalAttempts += row.total_attempts;
    macroNode.correctAttempts += row.correct_attempts;
    macroNode.difficultyDistribution.facil += row.difficulty_distribution?.facil ?? 0;
    macroNode.difficultyDistribution.medio += row.difficulty_distribution?.medio ?? 0;
    macroNode.difficultyDistribution.dificil += row.difficulty_distribution?.dificil ?? 0;
  }

  // Calcular % de acerto em cada nível
  const calculateAccuracy = (node: TaxonomyNode) => {
    if (node.totalAttempts > 0) {
      node.accuracyPercent = Math.round((node.correctAttempts / node.totalAttempts) * 100 * 100) / 100;
    }
    node.children.forEach(calculateAccuracy);
  };

  tree.forEach(calculateAccuracy);

  return tree;
}

// Converter Map para Array para facilitar renderização
export function treeToArray(tree: Map<string, TaxonomyNode>): TaxonomyNode[] {
  return Array.from(tree.values()).sort((a, b) => b.totalAttempts - a.totalAttempts);
}

export function useStudentTaxonomyPerformance(userId: string | undefined, daysBack: number = 360) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['student-taxonomy-performance', userId, daysBack],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc('get_student_taxonomy_performance', {
        p_user_id: userId,
        p_days_back: daysBack,
      });

      if (error) throw error;
      
      const typedData = (data as TaxonomyPerformanceData[]) ?? [];
      const tree = buildTaxonomyTree(typedData);
      
      return {
        raw: typedData,
        tree,
        array: treeToArray(tree),
      };
    },
    enabled: !!userId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Realtime listener para invalidar cache quando responder questão
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('taxonomy-performance-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'question_attempts',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Invalidar queries relacionadas
          queryClient.invalidateQueries({ queryKey: ['student-taxonomy-performance', userId] });
          queryClient.invalidateQueries({ queryKey: ['student-performance-stats', userId] });
          queryClient.invalidateQueries({ queryKey: ['student-trends', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}
