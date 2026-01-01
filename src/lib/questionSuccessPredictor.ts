// ============================================
// 🎯 QUESTION SUCCESS PREDICTOR
// Gera previsão inteligente de taxa de acerto
// Baseado em análise das características da questão
// ============================================

interface QuestionAnalysisInput {
  difficulty: string;
  questionText: string;
  options?: { text: string }[];
  explanation?: string | null;
  hasImage?: boolean;
  tema?: string | null;
  macro?: string | null;
}

interface PredictionResult {
  rate: number;
  confidence: 'low' | 'medium' | 'high';
  factors: string[];
}

// Palavras que indicam complexidade alta
const HIGH_COMPLEXITY_KEYWORDS = [
  'calcule', 'determine', 'demonstre', 'justifique', 'compare',
  'analise', 'interprete', 'equilibrio', 'equilíbrio', 'reação',
  'mecanismo', 'cinética', 'termodinâmica', 'eletroquímica',
  'estequiometria', 'mol', 'concentração', 'ph', 'poh',
  'entropia', 'entalpia', 'gibbs', 'nernst', 'henderson',
  'hibridização', 'ressonância', 'isomeria', 'quiralidade',
];

// Palavras que indicam pegadinhas comuns
const TRAP_KEYWORDS = [
  'exceto', 'incorreta', 'não', 'falsa', 'errada',
  'apenas', 'somente', 'necessariamente', 'sempre', 'nunca',
  'obrigatoriamente', 'exclusivamente',
];

// Palavras que indicam cálculos
const CALCULATION_KEYWORDS = [
  'calcule', 'determine', 'qual o valor', 'quanto',
  'massa', 'volume', 'concentração', 'mol', 'molar',
  'rendimento', 'pureza', 'diluição', 'titulação',
];

// Palavras que indicam interpretação de gráficos/tabelas
const VISUAL_ANALYSIS_KEYWORDS = [
  'gráfico', 'tabela', 'diagrama', 'figura', 'imagem',
  'observe', 'analise a figura', 'de acordo com o gráfico',
  'segundo a tabela', 'conforme o diagrama',
];

// Palavras de contextualização (aumenta dificuldade de interpretação)
const CONTEXTUALIZATION_KEYWORDS = [
  'cotidiano', 'dia a dia', 'indústria', 'medicamento',
  'ambiente', 'poluição', 'sustentável', 'tecnologia',
  'alimento', 'cosmético', 'agricultura', 'saúde',
];

/**
 * Conta ocorrências de palavras-chave no texto
 */
function countKeywords(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword.toLowerCase(), 'gi');
    const matches = lowerText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
}

/**
 * Analisa comprimento e complexidade textual
 */
function analyzeTextComplexity(text: string): number {
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / Math.max(sentences, 1);
  
  // Textos muito longos são mais difíceis
  let complexity = 0;
  if (words > 200) complexity += 10;
  if (words > 350) complexity += 10;
  if (avgWordsPerSentence > 25) complexity += 5;
  
  return complexity;
}

/**
 * Conta fórmulas químicas no texto
 */
function countChemicalFormulas(text: string): number {
  // Padrão simples para fórmulas químicas
  const formulaRegex = /[A-Z][a-z]?\d*(?:[A-Z][a-z]?\d*)*/g;
  const matches = text.match(formulaRegex) || [];
  // Filtra matches muito curtos ou que são palavras comuns
  return matches.filter(m => m.length > 1 && /\d/.test(m)).length;
}

/**
 * Detecta se há cálculos numéricos
 */
function hasNumericalCalculations(text: string): boolean {
  // Procura por padrões numéricos com operações
  const hasNumbers = /\d+[,.]?\d*\s*(g|mol|L|mL|M|kg|mg)/i.test(text);
  const hasOperations = /[×÷\+\-\*\/]\s*\d/.test(text);
  const hasCalcKeywords = countKeywords(text, CALCULATION_KEYWORDS) > 0;
  
  return hasNumbers || hasOperations || hasCalcKeywords;
}

/**
 * Gera um valor pseudo-aleatório baseado no hash do texto
 * Para garantir consistência (mesma questão = mesma previsão)
 */
function getConsistentRandom(text: string, seed: number = 0): number {
  let hash = seed;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash % 100) / 100;
}

/**
 * Prediz a taxa de sucesso esperada para uma questão
 * Retorna um valor entre 0-100%
 */
export function predictSuccessRate(input: QuestionAnalysisInput): PredictionResult {
  const { difficulty, questionText, options, explanation, hasImage, tema } = input;
  const factors: string[] = [];
  
  // 1. Base range por dificuldade
  let baseMin: number;
  let baseMax: number;
  
  switch (difficulty?.toLowerCase()) {
    case 'facil':
      baseMin = 70;
      baseMax = 95;
      factors.push('Dificuldade: Fácil');
      break;
    case 'medio':
      baseMin = 40;
      baseMax = 70;
      factors.push('Dificuldade: Médio');
      break;
    case 'dificil':
      baseMin = 5;
      baseMax = 35;
      factors.push('Dificuldade: Difícil');
      break;
    default:
      baseMin = 40;
      baseMax = 60;
      factors.push('Dificuldade: Não definida');
  }

  // 2. Análise do texto
  const fullText = [
    questionText,
    options?.map(o => o.text).join(' ') || '',
    explanation || '',
  ].join(' ');

  // Fatores que DIMINUEM a taxa de acerto
  let penalty = 0;

  // Complexidade textual
  const textComplexity = analyzeTextComplexity(questionText);
  if (textComplexity > 0) {
    penalty += textComplexity;
    if (textComplexity > 15) factors.push('Texto extenso');
  }

  // Palavras de alta complexidade
  const highComplexityCount = countKeywords(fullText, HIGH_COMPLEXITY_KEYWORDS);
  if (highComplexityCount > 0) {
    penalty += Math.min(highComplexityCount * 3, 15);
    if (highComplexityCount >= 2) factors.push('Conceitos avançados');
  }

  // Pegadinhas
  const trapCount = countKeywords(fullText, TRAP_KEYWORDS);
  if (trapCount > 0) {
    penalty += Math.min(trapCount * 4, 12);
    factors.push('Contém pegadinhas');
  }

  // Cálculos
  if (hasNumericalCalculations(fullText)) {
    penalty += 8;
    factors.push('Requer cálculos');
  }

  // Fórmulas químicas complexas
  const formulaCount = countChemicalFormulas(questionText);
  if (formulaCount > 3) {
    penalty += 5;
    factors.push('Múltiplas fórmulas');
  }

  // Análise visual (gráficos, tabelas)
  const visualAnalysis = countKeywords(fullText, VISUAL_ANALYSIS_KEYWORDS);
  if (visualAnalysis > 0 || hasImage) {
    penalty += 5;
    factors.push('Análise visual');
  }

  // Contextualização
  const contextualization = countKeywords(fullText, CONTEXTUALIZATION_KEYWORDS);
  if (contextualization > 0) {
    penalty += Math.min(contextualization * 2, 6);
    if (contextualization >= 2) factors.push('Contextualizada');
  }

  // 3. Calcular range ajustado
  const adjustedMax = Math.max(baseMax - penalty, baseMin + 5);
  const adjustedMin = Math.max(baseMin - (penalty / 2), 5);

  // 4. Gerar valor consistente dentro do range
  const randomFactor = getConsistentRandom(questionText, questionText.length);
  const range = adjustedMax - adjustedMin;
  const rate = Math.round(adjustedMin + (randomFactor * range));

  // 5. Determinar confiança
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  if (factors.length <= 2) confidence = 'high';
  if (factors.length >= 5) confidence = 'low';

  return {
    rate: Math.max(5, Math.min(95, rate)),
    confidence,
    factors,
  };
}

/**
 * Formata a taxa de sucesso para exibição
 */
export function formatSuccessRate(rate: number): string {
  return `${rate}%`;
}

/**
 * Retorna cor semântica baseada na taxa
 */
export function getSuccessRateColor(rate: number): string {
  if (rate >= 70) return 'text-green-500';
  if (rate >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

// ============================================
// REGRAS:
// 1. Previsão é INTELIGENTE, não estática
// 2. Mesma questão = mesma previsão (consistência)
// 3. Exibir APENAS após aluno responder
// 4. Fatores influenciam o resultado final
// ============================================
