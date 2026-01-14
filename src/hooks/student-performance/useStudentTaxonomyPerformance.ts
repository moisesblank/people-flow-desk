// =====================================================
// useStudentTaxonomyPerformance - Hook de Performance por Taxonomia
// LEI SUPREMA: Usa question_taxonomy como FONTE ÚNICA DE VERDADE
// Constituição SYNAPSE Ω v10.4
// =====================================================

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo } from "react";
import { useQuestionTaxonomy } from "@/hooks/useQuestionTaxonomy";

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

/**
 * ============================================
 * LEI SUPREMA: Normalizador VALUE → LABEL usando BANCO
 * NUNCA expor MICRO_VALUE (slug) na UI
 * ============================================
 */
function createNormalizer(taxonomyItems: Array<{ value: string; label: string; level: string }>) {
  // Criar mapa value → label do banco
  const valueToLabel = new Map<string, string>();
  
  for (const item of taxonomyItems) {
    // Mapear pelo value técnico
    valueToLabel.set(item.value, item.label);
    // Também mapear pelo value em lowercase para tolerância
    valueToLabel.set(item.value.toLowerCase(), item.label);
    // E pelo label normalizado (sem acentos, lowercase)
    const normalizedValue = item.label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    valueToLabel.set(normalizedValue, item.label);
  }

  return function normalizeToLabel(value: string | null | undefined): string {
    if (!value) return '';
    
    // Tentar lookup direto
    const directMatch = valueToLabel.get(value);
    if (directMatch) return directMatch;
    
    // Tentar lowercase
    const lowerMatch = valueToLabel.get(value.toLowerCase());
    if (lowerMatch) return lowerMatch;
    
    // Tentar normalizado
    const normalized = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const normalizedMatch = valueToLabel.get(normalized);
    if (normalizedMatch) return normalizedMatch;
    
    // Se parece com um slug (snake_case), tentar converter para Title Case
    if (/^[a-z0-9_]+$/.test(value) && value.includes('_')) {
      console.warn(`[TAXONOMY] Possível VALUE exposto sem mapeamento: ${value}`);
      return value
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // Já é um label legível
    return value;
  };
}

// Função para construir árvore a partir dos dados flat
function buildTaxonomyTree(
  data: TaxonomyPerformanceData[],
  normalizeToLabel: (value: string | null | undefined) => string
): Map<string, TaxonomyNode> {
  const tree = new Map<string, TaxonomyNode>();

  for (const row of data) {
    // ============================================
    // LEI SUPREMA: Normalizar VALUE → LABEL
    // ============================================
    const normalizedMicro = normalizeToLabel(row.micro);
    const normalizedTema = normalizeToLabel(row.tema);
    const normalizedSubtema = normalizeToLabel(row.subtema);
    
    // Nível 1: Macro (já vem como label do banco)
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

    // Nível 2: Micro (NORMALIZADO)
    if (normalizedMicro && !macroNode.children.has(normalizedMicro)) {
      macroNode.children.set(normalizedMicro, {
        name: normalizedMicro,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracyPercent: 0,
        avgTimeSeconds: 0,
        difficultyDistribution: { facil: 0, medio: 0, dificil: 0 },
        children: new Map(),
      });
    }
    const microNode = normalizedMicro ? macroNode.children.get(normalizedMicro)! : null;

    // Nível 3: Tema (NORMALIZADO)
    if (microNode && normalizedTema && !microNode.children.has(normalizedTema)) {
      microNode.children.set(normalizedTema, {
        name: normalizedTema,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracyPercent: 0,
        avgTimeSeconds: 0,
        difficultyDistribution: { facil: 0, medio: 0, dificil: 0 },
        children: new Map(),
      });
    }
    const temaNode = microNode && normalizedTema ? microNode.children.get(normalizedTema)! : null;

    // Nível 4: Subtema (folha, NORMALIZADO)
    if (temaNode && normalizedSubtema) {
      temaNode.children.set(normalizedSubtema, {
        name: normalizedSubtema,
        totalAttempts: row.total_attempts,
        correctAttempts: row.correct_attempts,
        accuracyPercent: row.accuracy_percent,
        avgTimeSeconds: row.avg_time_seconds ?? 0,
        difficultyDistribution: row.difficulty_distribution ?? { facil: 0, medio: 0, dificil: 0 },
        children: new Map(),
      });
    }

    // Agregar para cima
    if (temaNode) {
      temaNode.totalAttempts += row.total_attempts;
      temaNode.correctAttempts += row.correct_attempts;
      temaNode.difficultyDistribution.facil += row.difficulty_distribution?.facil ?? 0;
      temaNode.difficultyDistribution.medio += row.difficulty_distribution?.medio ?? 0;
      temaNode.difficultyDistribution.dificil += row.difficulty_distribution?.dificil ?? 0;
    }

    if (microNode) {
      microNode.totalAttempts += row.total_attempts;
      microNode.correctAttempts += row.correct_attempts;
      microNode.difficultyDistribution.facil += row.difficulty_distribution?.facil ?? 0;
      microNode.difficultyDistribution.medio += row.difficulty_distribution?.medio ?? 0;
      microNode.difficultyDistribution.dificil += row.difficulty_distribution?.dificil ?? 0;
    }

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
  
  // ============================================
  // 🗄️ FONTE ÚNICA DE VERDADE: BANCO DE DADOS
  // ============================================
  const { data: taxonomyData } = useQuestionTaxonomy();

  // Criar normalizador a partir dos dados do banco
  const normalizeToLabel = useMemo(() => {
    if (!taxonomyData?.items) {
      // Fallback: retorna o valor original
      return (value: string | null | undefined) => value || '';
    }
    return createNormalizer(taxonomyData.items);
  }, [taxonomyData?.items]);

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
      const tree = buildTaxonomyTree(typedData, normalizeToLabel);
      
      return {
        raw: typedData,
        tree,
        array: treeToArray(tree),
      };
    },
    enabled: !!userId && !!taxonomyData, // Aguardar taxonomia carregar
    staleTime: 60_000,
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
