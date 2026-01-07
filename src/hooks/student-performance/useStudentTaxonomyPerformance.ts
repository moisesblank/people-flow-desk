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

// ============================================
// LEI SUPREMA: MAPEADOR VALUE → LABEL
// Garante que NUNCA expomos MICRO_VALUE na UI
// ============================================
const MICRO_VALUE_TO_LABEL: Record<string, string> = {
  // QUÍMICA GERAL
  introducao_quimica_inorganica: "Introdução à Química Inorgânica",
  atomistica: "Atomística",
  tabela_periodica: "Tabela Periódica",
  numero_oxidacao_nox: "Número de Oxidação (NOX)",
  ligacoes_quimicas: "Ligações Químicas",
  funcoes_inorganicas: "Funções Inorgânicas",
  teorias_acido_base: "Teorias Ácido-Base",
  reacoes_inorganicas: "Reações Inorgânicas",
  calculos_quimicos: "Cálculos Químicos",
  estequiometria: "Estequiometria",
  gases: "Gases",
  balanceamento: "Balanceamento",
  conceitos_modernos: "Conceitos Modernos",
  // QUÍMICA ORGÂNICA
  introducao_organica: "Introdução à orgânica",
  nomenclatura_organica: "Nomenclatura Orgânica",
  funcoes_organicas: "Funções Orgânicas",
  propriedades_organicas: "Propriedades Orgânicas",
  isomeria: "Isomeria",
  reacoes_organicas: "Reações Orgânicas",
  polimeros: "Polímeros",
  // FÍSICO-QUÍMICA
  solucoes: "Soluções",
  propriedades_coligativas: "Propriedades Coligativas",
  termoquimica: "Termoquímica",
  cinetica_quimica: "Cinética Química",
  equilibrio_quimico: "Equilíbrio Químico",
  equilibrio_ionico: "Equilíbrio Iônico",
  produto_solubilidade_kps: "Produto de Solubilidade (Kps)",
  solucoes_tampao: "Soluções Tampão",
  eletroquimica: "Eletroquímica",
  radioatividade: "Radioatividade",
  // QUÍMICA AMBIENTAL
  agua_e_seu_ciclo: "Água e Seu Ciclo",
  agua_e_seu_tratamento: "Água e Seu Tratamento",
  atmosfera_ambiental: "Atmosfera",
  camada_de_ozonio: "Camada de Ozônio",
  ciclos_biogeoquimicos: "Ciclos Biogeoquímicos",
  chuva_acida: "Chuva Ácida",
  contaminacao_cidades: "Contaminação Cidades",
  contaminacao_solo: "Contaminação Solo",
  efeito_estufa: "Efeito Estufa",
  eutrofizacao: "Eutrofização",
  fontes_renovaveis: "Fontes Renováveis",
  metais_pesados: "Metais Pesados",
  poluicao_atmosferica: "Poluição Atmosférica",
  poluicao_hidrica: "Poluição Hídrica",
  qualidade_da_agua: "Qualidade da Água",
  quimica_verde: "Química Verde",
  tratamento_de_efluentes: "Tratamento de Efluentes",
  residuos_solidos: "Resíduos Sólidos",
  quimica_dos_agrotoxicos: "Química dos Agrotóxicos",
  sustentabilidade: "Sustentabilidade",
  mudancas_climaticas: "Mudanças Climáticas",
  radioatividade_ambiental: "Radioatividade Ambiental",
  // BIOQUÍMICA
  proteinas: "Proteínas",
  carboidratos: "Carboidratos",
  enzimas: "Enzimas",
  lipidios: "Lipídios",
  acidos_nucleicos: "Ácidos Nucleicos",
  vitaminas: "Vitaminas",
  sais_minerais: "Sais Minerais",
  metabolismo_bio: "Metabolismo",
  respiracao_celular: "Respiração Celular",
  fotossintese: "Fotossíntese",
  hormonios: "Hormônios",
  bioquimica_membranas: "Bioquímica das Membranas",
  bioenergetica: "Bioenergética",
  aminoacidos: "Aminoácidos",
};

const TEMA_VALUE_TO_LABEL: Record<string, string> = {
  modelos_atomicos: "Modelos Atômicos",
  distribuicao_eletronica: "Distribuição Eletrônica",
  propriedades_magneticas: "Propriedades Magnéticas",
  numeros_quanticos: "Números Quânticos",
  origem_quimica_organica: "Origem da Química Orgânica",
  caracteristicas_gerais_ligacoes: "Características Gerais das Ligações",
  caracteristicas_gases: "Características dos Gases",
  caracteristicas_origem_tabela: "Características e Origem da Tabela Periódica",
  funcoes_oxigenadas: "Funções Oxigenadas",
  acidos: "Ácidos",
};

// Micros legados que devem ser normalizados
const LEGACY_MICRO_NORMALIZATION: Record<string, string> = {
  "Química Orgânica Geral": "Funções Orgânicas",
  "quimica_organica_geral": "Funções Orgânicas",
};

/**
 * Converte VALUE para LABEL se necessário
 * LEI SUPREMA: NUNCA expor MICRO_VALUE
 */
function normalizeToLabel(value: string | null | undefined, type: 'micro' | 'tema' | 'subtema'): string {
  if (!value) return '';
  
  // Verificar se é um legado que precisa normalização
  if (LEGACY_MICRO_NORMALIZATION[value]) {
    return LEGACY_MICRO_NORMALIZATION[value];
  }
  
  // Verificar mapeamento de micro
  if (type === 'micro' && MICRO_VALUE_TO_LABEL[value]) {
    return MICRO_VALUE_TO_LABEL[value];
  }
  
  // Verificar mapeamento de tema
  if (type === 'tema' && TEMA_VALUE_TO_LABEL[value]) {
    return TEMA_VALUE_TO_LABEL[value];
  }
  
  // Se parece com um slug (snake_case), retornar vazio para não expor
  if (/^[a-z0-9_]+$/.test(value) && value.includes('_')) {
    console.warn(`[TAXONOMY] Possível VALUE exposto: ${value}`);
    // Tentar converter snake_case para Title Case como fallback
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Já é um label legível
  return value;
}

// Função para construir árvore a partir dos dados flat
// LEI SUPREMA: Normaliza VALUE → LABEL antes de exibir
function buildTaxonomyTree(data: TaxonomyPerformanceData[]): Map<string, TaxonomyNode> {
  const tree = new Map<string, TaxonomyNode>();

  for (const row of data) {
    // ============================================
    // LEI SUPREMA: Normalizar VALUE → LABEL
    // ============================================
    const normalizedMicro = normalizeToLabel(row.micro, 'micro');
    const normalizedTema = normalizeToLabel(row.tema, 'tema');
    const normalizedSubtema = normalizeToLabel(row.subtema, 'subtema');
    
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
    if (!macroNode.children.has(normalizedMicro)) {
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
    const microNode = macroNode.children.get(normalizedMicro)!;

    // Nível 3: Tema (NORMALIZADO)
    if (!microNode.children.has(normalizedTema)) {
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
    const temaNode = microNode.children.get(normalizedTema)!;

    // Nível 4: Subtema (folha, NORMALIZADO)
    temaNode.children.set(normalizedSubtema, {
      name: normalizedSubtema,
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
    staleTime: 60_000, // PATCH 5K: 60s cache para performance de usuário
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
