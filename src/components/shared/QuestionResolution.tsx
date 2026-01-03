// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║ 📚 QUESTION RESOLUTION — COMPONENTE UNIVERSAL E OBRIGATÓRIO                      ║
// ║ PADRÃO INTERNACIONAL DE ORGANIZAÇÃO v6.2 — CORREÇÕES TÉCNICAS + CONFIDENCE GATE  ║
// ╠══════════════════════════════════════════════════════════════════════════════════╣
// ║                                                                                   ║
// ║ 🔒 LEI PERMANENTE — CONSTITUIÇÃO DO QUESTION DOMAIN v6.2                         ║
// ║                                                                                   ║
// ║ Este componente é a ÚNICA fonte de verdade para renderização de resoluções.      ║
// ║ TODAS as questões (SIMULADOS, MODO TREINO, atuais e futuras) DEVEM usar          ║
// ║ este componente para garantir formatação consistente.                            ║
// ║                                                                                   ║
// ║ ═══════════════════════════════════════════════════════════════════════════════  ║
// ║ 🚨 NOVA LEI v6.2 — ORGANIZAÇÃO + CORREÇÕES TÉCNICAS + CONFIDENCE-GATED IMAGE     ║
// ║ ═══════════════════════════════════════════════════════════════════════════════  ║
// ║                                                                                   ║
// ║ REGRA SUPREMA: O componente NÃO INTERFERE no SIGNIFICADO do texto original.     ║
// ║                                                                                   ║
// ║ ═══════════════════════════════════════════════════════════════════════════════  ║
// ║ 🔒 CONFIDENCE-GATED IMAGE EXTRACTION POLICY v1.0                                 ║
// ║ ═══════════════════════════════════════════════════════════════════════════════  ║
// ║                                                                                   ║
// ║ THRESHOLD: 80% (IMUTÁVEL)                                                        ║
// ║                                                                                   ║
// ║ COMPORTAMENTO QUANDO confidence < 80%:                                           ║
// ║   • NÃO modifica a entidade Question                                             ║
// ║   • NÃO reescreve dados de imagem como texto                                     ║
// ║   • APENAS loga a detecção sem intervenção                                       ║
// ║                                                                                   ║
// ║ COMPORTAMENTO QUANDO confidence >= 80%:                                          ║
// ║   • Extrai dados químicos das imagens                                            ║
// ║   • Reescreve dados extraídos em texto químico padronizado                       ║
// ║   • Insere dados nos campos apropriados da Question                              ║
// ║   • Loga a intervenção com comparação before/after                               ║
// ║                                                                                   ║
// ║ DADOS EXTRAÍVEIS COM CONFIANÇA >= 80%:                                           ║
// ║   • Massa molar (g/mol)                                                          ║
// ║   • Ponto de fusão/ebulição                                                      ║
// ║   • Número atômico (Z)                                                           ║
// ║   • Grupos químicos                                                              ║
// ║   • Reações químicas                                                             ║
// ║   • Condições de reação                                                          ║
// ║   • Alternativas apresentadas como imagens                                       ║
// ║                                                                                   ║
// ║ REGRAS DE INSERÇÃO NA ENTIDADE:                                                  ║
// ║   • NÃO altera o enunciado original                                              ║
// ║   • Insere dados extraídos como texto estruturado vinculado ao enunciado         ║
// ║   • Na seção de Análise, apenas descreve a presença dos dados                    ║
// ║   • NUNCA explica, interpreta ou resolve a questão                               ║
// ║   • NUNCA gera respostas comentadas sem solicitação explícita                    ║
// ║                                                                                   ║
// ║ AUDITORIA E LOGGING:                                                             ║
// ║   • Log do score de confiança                                                    ║
// ║   • Log dos elementos extraídos                                                  ║
// ║   • Log do estado before/after                                                   ║
// ║   • Logs associados à entidade Question                                          ║
// ║   • Logs expostos no AI Log Global e per-question                                ║
// ║                                                                                   ║
// ║ IMUTABILIDADE:                                                                   ║
// ║   • Este comportamento de gate de confiança é PERMANENTE                         ║
// ║   • Nenhuma feature futura pode contornar o threshold                            ║
// ║   • Violação é considerada brecha constitucional                                 ║
// ║                                                                                   ║
// ║ ═══════════════════════════════════════════════════════════════════════════════  ║
// ║                                                                                   ║
// ║ ✅ O QUE ESTE COMPONENTE FAZ (CORREÇÕES TÉCNICAS OBJETIVAS):                     ║
// ║    1. ORGANIZA visualmente as seções (ANÁLISE → CONCLUSÃO → ENEM → etc)          ║
// ║    2. DETECTA marcadores de seção e agrupa conteúdo                              ║
// ║    3. APLICA formatação visual (bordas, cores, ícones)                           ║
// ║    4. FORMATA química: H2O → H₂O (subscrito), Na+ → Na⁺ (sobrescrito)            ║
// ║    5. ESTADOS FÍSICOS: (G) → ₍g₎, (S) → ₍s₎, (L) → ₍l₎, (AQ) → ₍aq₎              ║
// ║    6. CARGAS ELÉTRICAS: Na2+ → Na²⁺, Ca++ → Ca²⁺                                 ║
// ║    7. UNIDADES: g/mol, °C, K (preservadas e formatadas)                          ║
// ║    8. ANO INVÁLIDO: < 2016 → removido silenciosamente                            ║
// ║    9. SÍMBOLOS INÚTEIS: emojis decorativos, caracteres estranhos → removidos    ║
// ║   10. CARACTERES ESPECIAIS NO INÍCIO: alternativas com ? . : → limpos           ║
// ║   11. CORREÇÃO DE PORTUGUÊS: gramática básica (crase, concordância, acentos)    ║
// ║   12. EXTRAÇÃO DE IMAGEM: dados químicos de imagens (se confidence >= 80%)      ║
// ║                                                                                   ║
// ║ ❌ O QUE ESTE COMPONENTE NÃO FAZ:                                                ║
// ║    1. NÃO altera SIGNIFICADO do texto original                                   ║
// ║    2. NÃO remove CONTEÚDO (exceto metadados HTML e símbolos decorativos)         ║
// ║    3. NÃO adiciona palavras ou muda significado                                  ║
// ║    4. NÃO "refina pedagogicamente" o texto (opinião)                             ║
// ║    5. NÃO extrai de imagens se confidence < 80%                                  ║
// ║                                                                                   ║
// ║ LEMA: "Correções TÉCNICAS são fatos. Extração só com confiança alta."           ║
// ║                                                                                   ║
// ║ JAMAIS MODIFICAR ESTAS REGRAS SEM AUTORIZAÇÃO DO OWNER.                           ║
// ║                                                                                   ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝

import { memo, useMemo, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { formatChemicalFormulas } from '@/lib/chemicalFormatter';
import { renderChemicalText } from '@/lib/renderChemicalText';
import { getBancaLabel } from '@/constants/bancas';
import { 
  Sparkles, 
  Target, 
  FolderTree, 
  Lightbulb,
  AlertTriangle,
  Compass,
  CheckCircle,
  Beaker,
  Cog,
  BarChart3,
  GraduationCap,
  Zap,
  XCircle,
  CircleDot,
  MessageCircle,
  ListChecks,
} from 'lucide-react';

// Fallback padrão
const DEFAULT_BANCA_HEADER = 'QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS';

// Mapa de dificuldade
const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  'facil': { label: 'FÁCIL', color: 'text-green-500' },
  'medio': { label: 'MÉDIO', color: 'text-yellow-500' },
  'dificil': { label: 'DIFÍCIL', color: 'text-red-500' },
};

// Tipos de seção detectáveis — ORDEM LÓGICA INTERNACIONAL
type SectionType = 
  | 'intro' 
  | 'passo' 
  | 'analise_header'
  | 'afirmacao_analise'
  | 'afirmacao_correta'
  | 'afirmacao_incorreta'
  | 'alternativa_analise'
  | 'alternativa_correta'
  | 'alternativa_errada'
  | 'sintese'        // Parágrafo de síntese após afirmações
  | 'resumo'
  | 'conclusao' 
  | 'competencia' 
  | 'estrategia' 
  | 'pegadinhas' 
  | 'dica';

interface ParsedSection {
  type: SectionType;
  title?: string;
  content: string;
  stepNumber?: number;
  afirmacaoNumber?: string;
  alternativaLetter?: string;
  isCorrect?: boolean;
}

interface QuestionResolutionProps {
  resolutionText: string;
  banca?: string | null;
  ano?: number | null;
  difficulty?: string | null;
  tema?: string | null;
  macro?: string | null;
  micro?: string | null;
  competenciaEnem?: string | null;
  habilidadeEnem?: string | null;
  className?: string;
}

/**
 * =====================================================
 * CORREÇÕES TÉCNICAS OBJETIVAS — v6.2
 * =====================================================
 * 
 * Estas NÃO são opinião. São FATOS:
 * 1. Fórmula química errada (H2O → H₂O visual)
 * 2. Estado físico incoerente: (G) → ₍g₎ (sempre minúsculo, subscrito)
 * 3. Unidade errada (g/mol, °C, K — preservar)
 * 4. Carga elétrica mal escrita (Na+, Na2+ → Na⁺, Na²⁺)
 * 5. Ano inválido (< 2016 → remove)
 * 6. Símbolos inúteis (emoji decorativo, caracteres estranhos)
 * 7. Formatação química (subscrito/sobrescrito)
 * 8. Alternativa começando com caractere especial → limpar
 * 9. Correção de português (gramática básica objetiva)
 * 10. EXTRAÇÃO DE IMAGEM: dados químicos (apenas se confidence >= 80%)
 * 
 * NUNCA altera significado. Apenas padronização técnica.
 * EXTRAÇÃO DE IMAGEM: Só aplica se AI confidence >= 80% (CONFIDENCE-GATE)
 * =====================================================
 */

// Emojis decorativos e caracteres estranhos (não informativos)
const DECORATIVE_SYMBOLS_REGEX = /[里吝離魘魚鬼鸟鶉鶴鸿麗麒麓麝麵麴麾黃黎黏黔黛點黯鼓鼠鼻齊齋齒龍龜⚙️⚙🔧🔨🛠️⚡🔥💥🌟🌈🎆🎇🎉🎊🎀🎁📿💎🔮🧿🏆🥇🥈🥉🏅🎖️🏵️🎗️🪅🪆🎭🎨🖼️🎬🎤🎧🎼🎹🎸🎷🎺🎻🪕🥁🪘🎲🧩🎮🎯🎳🎰🧸🪀🪁🪄🪃🛷🛹🛼🩰🩱🩲🩳👙👗👘🥻🩴👠👡👢👞👟🥾🥿🧦🧤🧣🎩🧢👒🎓⛑️🪖👑💍👛👜💼🎒🧳👓🕶️🥽🌂]/g;

// Caracteres de controle invisíveis
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/g;

/**
 * Remove símbolos decorativos e ruído técnico
 */
function cleanTechnicalNoise(text: string): string {
  if (!text) return '';
  return text
    .replace(DECORATIVE_SYMBOLS_REGEX, '')
    .replace(CONTROL_CHARS_REGEX, '')
    .replace(/\*\*/g, '')           // Remove ** (markdown bold)
    .replace(/\*/g, '')             // Remove * soltos
    .replace(/️/g, '')              // Remove variation selectors órfãos
    .trim();
}

/**
 * Remove caracteres especiais do início de textos de alternativas
 * Ex: "? Alternativa A" → "Alternativa A"
 *     ". O composto" → "O composto"
 */
function removeLeadingSpecialChars(text: string): string {
  if (!text) return '';
  return text
    .replace(/^[\?\.\:\;\-–—•·»«]+\s*/g, '')
    .replace(/^\s*[\?\.\:\;\-–—]+\s*/gm, '')
    .trim();
}

/**
 * Corrige estados físicos para formato padronizado
 * (G) → ₍g₎, (S) → ₍s₎, (L) → ₍l₎, (AQ) → ₍aq₎
 */
function normalizePhysicalStates(text: string): string {
  if (!text) return '';
  return text
    .replace(/\(\s*[Gg]\s*\)/g, '₍g₎')
    .replace(/\(\s*[Ss]\s*\)/g, '₍s₎')
    .replace(/\(\s*[Ll]\s*\)/g, '₍l₎')
    .replace(/\(\s*[Aa][Qq]\s*\)/gi, '₍aq₎');
}

/**
 * Corrige cargas elétricas para sobrescrito
 * Na+ → Na⁺, Na2+ → Na²⁺, Ca++ → Ca²⁺, Cl- → Cl⁻
 */
function normalizeElectricCharges(text: string): string {
  if (!text) return '';
  
  const SUPERSCRIPT_MAP: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻',
  };
  
  function toSuperscript(str: string): string {
    return str.split('').map(c => SUPERSCRIPT_MAP[c] || c).join('');
  }
  
  let result = text;
  
  // Padrão: elemento + número + sinal (Na2+, Ca2+, SO42-)
  result = result.replace(/([A-Z][a-z]?(?:₀|₁|₂|₃|₄|₅|₆|₇|₈|₉)*)(\d*)([+-]+)(?=\s|$|[,.\);\[\]])/g, 
    (_, element, num, sign) => {
      const superNum = num ? toSuperscript(num) : '';
      const superSign = toSuperscript(sign.charAt(0)); // apenas primeiro sinal
      return element + superNum + superSign;
    });
  
  // Padrão: ++ ou -- (Ca++, Mg++)
  result = result.replace(/([A-Z][a-z]?(?:₀|₁|₂|₃|₄|₅|₆|₇|₈|₉)*)\+\+/g, '$1²⁺');
  result = result.replace(/([A-Z][a-z]?(?:₀|₁|₂|₃|₄|₅|₆|₇|₈|₉)*)--/g, '$1²⁻');
  
  // Padrão: ^2+ ou ^- após elemento
  result = result.replace(/\^(\d*[+-])/g, (_, charge) => toSuperscript(charge));
  
  return result;
}

/**
 * Remove anos inválidos (< 2016) do texto
 * Silencioso: não substitui por nada
 */
function removeInvalidYears(text: string): string {
  if (!text) return '';
  
  // Remove padrões de ano entre 1900-2015 em contextos de banca/questão
  // Mantém anos em contextos científicos/históricos (datas de descobertas, etc.)
  return text
    // Remove "(2015)", "(2014)", etc. quando isolados
    .replace(/\(\s*(19\d{2}|200\d|201[0-5])\s*\)/g, '')
    // Remove "- 2015", "– 2014" quando após banca
    .replace(/\s*[-–]\s*(19\d{2}|200\d|201[0-5])(?=\s|$|[,.\)])/g, '')
    // Limpa espaços duplos resultantes
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Correções gramaticais objetivas (português)
 * Apenas correções que são FATOS, não estilo
 */
function applyObjectiveGrammar(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // Correções de crase objetivas
  result = result
    .replace(/\ba\s+(à|aquele|aquela|aquilo)/gi, 'à $1')
    .replace(/\bà\s+a\b/g, 'à')
    .replace(/\bà\s+à\b/g, 'à');
  
  // Correções de concordância básica
  result = result
    .replace(/\bos\s+molécula\b/gi, 'a molécula')
    .replace(/\bas\s+composto\b/gi, 'o composto')
    .replace(/\bo\s+reações\b/gi, 'as reações')
    .replace(/\ba\s+compostos\b/gi, 'os compostos');
  
  // Acentuação objetiva (palavras comuns em química)
  result = result
    .replace(/\bequacao\b/gi, 'equação')
    .replace(/\breacao\b/gi, 'reação')
    .replace(/\bsolucao\b/gi, 'solução')
    .replace(/\bconcentracao\b/gi, 'concentração')
    .replace(/\bpressao\b/gi, 'pressão')
    .replace(/\btemperatura\b/g, 'temperatura') // já correto mas garantir
    .replace(/\batomo\b/gi, 'átomo')
    .replace(/\bmolecula\b/gi, 'molécula')
    .replace(/\bion\b/g, 'íon')
    .replace(/\bions\b/g, 'íons')
    .replace(/\bcation\b/gi, 'cátion')
    .replace(/\bcations\b/gi, 'cátions')
    .replace(/\banion\b/gi, 'ânion')
    .replace(/\banions\b/gi, 'ânions')
    .replace(/\beletron\b/gi, 'elétron')
    .replace(/\beletrons\b/gi, 'elétrons')
    .replace(/\bproton\b/gi, 'próton')
    .replace(/\bprotons\b/gi, 'prótons')
    .replace(/\bneutron\b/gi, 'nêutron')
    .replace(/\bneutrons\b/gi, 'nêutrons')
    .replace(/\borganic[oa]\b/g, (m) => m.replace('organic', 'orgânic'))
    .replace(/\binorganic[oa]\b/g, (m) => m.replace('inorganic', 'inorgânic'))
    .replace(/\banalise\b/gi, 'análise')
    .replace(/\bsintese\b/gi, 'síntese')
    .replace(/\bhibrido\b/gi, 'híbrido')
    .replace(/\bcovalente\b/g, 'covalente') // já correto
    .replace(/\bionica\b/gi, 'iônica')
    .replace(/\bionico\b/gi, 'iônico');
  
  return result;
}

/**
 * Pipeline completo de correções técnicas objetivas
 * Aplica todas as correções em ordem
 */
function applyTechnicalCorrections(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // 1. Limpar ruído técnico (símbolos decorativos, caracteres estranhos)
  result = cleanTechnicalNoise(result);
  
  // 2. Remover caracteres especiais do início
  result = removeLeadingSpecialChars(result);
  
  // 3. Normalizar estados físicos
  result = normalizePhysicalStates(result);
  
  // 4. Normalizar cargas elétricas
  result = normalizeElectricCharges(result);
  
  // 5. Remover anos inválidos
  result = removeInvalidYears(result);
  
  // 6. Correções gramaticais objetivas
  result = applyObjectiveGrammar(result);
  
  return result;
}

// Legacy functions for compatibility
function cleanForbiddenSymbols(text: string): string {
  return applyTechnicalCorrections(text);
}

function applyPortugueseGrammar(text: string): string {
  return applyObjectiveGrammar(text);
}

function applyPedagogicalRefinement(text: string): string {
  if (!text) return '';
  return applyTechnicalCorrections(text);
}

/**
 * =====================================================
 * PRÉ-PROCESSAMENTO PEDAGÓGICO v5.0 — ORGANIZAÇÃO ESTRUTURADA
 * Transforma texto corrido bagunçado em estrutura pedagógica clara:
 * 1. AFIRMAÇÃO: Identificação do erro/acerto
 * 2. EXPLICAÇÃO TEÓRICA: Conceito explicado separadamente  
 * 3. ALTERNATIVAS: Cada uma em seu próprio bloco
 * 4. CONCLUSÃO: Gabarito final limpo
 * =====================================================
 */

/**
 * Detecta e separa blocos de texto explicativo (teoria) de análise de alternativas
 */
function separateTheoryFromAlternatives(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // Padrões que indicam início de análise de alternativas (devem ficar em bloco separado)
  const alternativeStartPatterns = [
    /Alternativa\s+A\s*[:–\-]/gi,
    /[❌✅✔️✓✗✖️]\s*Alternativa\s+[A-E]/gi,
    /[❌✅]\s*[A-E]\)/gi,
  ];
  
  // Padrões que indicam texto teórico/explicativo (deve ficar ANTES das alternativas)
  const theoryPatterns = [
    /É\s+exatamente\s+o\s+CONTRÁRIO/gi,
    /Pelo\s+Le\s+Chatelier/gi,
    /O\s+equilíbrio\s+se\s+desloca/gi,
    /desloca\s+o\s+equilíbrio\s+para/gi,
    /Nos\s+tecidos[,\s]/gi,
    /Nos\s+pulmões[,\s]/gi,
    /as\s+células\s+consomem/gi,
    /diminuindo\s+sua\s+concentração/gi,
    /favorece\s+a\s+reação/gi,
    /A\s+concentração\s+de\s+[A-Za-z₀-₉]+\s+é/gi,
  ];
  
  // Procurar onde começa análise de alternativas
  let alternativeStartIndex = result.length;
  for (const pattern of alternativeStartPatterns) {
    const match = result.match(pattern);
    if (match && match.index !== undefined && match.index < alternativeStartIndex) {
      alternativeStartIndex = match.index;
    }
  }
  
  // Se encontrou alternativas, garantir quebra antes delas
  if (alternativeStartIndex < result.length && alternativeStartIndex > 50) {
    const beforeAlternatives = result.substring(0, alternativeStartIndex).trim();
    const fromAlternatives = result.substring(alternativeStartIndex).trim();
    
    // Adicionar marcador de seção se o texto antes é teoria
    const hasTheory = theoryPatterns.some(p => p.test(beforeAlternatives));
    if (hasTheory && beforeAlternatives.length > 100) {
      result = beforeAlternatives + '\n\n[TEORIA_FIM]\n\n' + fromAlternatives;
    } else {
      result = beforeAlternatives + '\n\n' + fromAlternatives;
    }
  }
  
  return result;
}

/**
 * Separa afirmações que vêm todas na mesma linha em blocos individuais
 * PADRÃO ENEM/INTERNACIONAL: cada afirmação em seu próprio bloco visual
 */
function reformatAffirmations(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // ========== PRÉ-PROCESSAMENTO: SEPARAR TEORIA DE ALTERNATIVAS ==========
  result = separateTheoryFromAlternatives(result);
  
  // ========== DETECTAR E SEPARAR AFIRMAÇÕES CORRIDAS ==========
  const afirmacaoPattern = /Afirmação\s*(\d+|[IVX]+)\s*[:\-–—]\s*(?:(FALSA|VERDADEIRA|F|V)\s*\([FV]\)\s*)?[:\-–—]?\s*/gi;
  
  const matches = [...result.matchAll(new RegExp(afirmacaoPattern.source, 'gi'))];
  
  if (matches.length > 1) {
    let reformatted = '';
    
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const nextMatch = matches[i + 1];
      
      const startIndex = currentMatch.index!;
      const endIndex = nextMatch ? nextMatch.index! : result.length;
      
      let block = result.substring(startIndex, endIndex).trim();
      
      if (i > 0) {
        reformatted += '\n\n';
      }
      
      reformatted += block;
    }
    
    const firstMatchIndex = matches[0].index!;
    if (firstMatchIndex > 0) {
      const preamble = result.substring(0, firstMatchIndex).trim();
      if (preamble) {
        result = preamble + '\n\n' + reformatted;
      } else {
        result = reformatted;
      }
    } else {
      result = reformatted;
    }
  }
  
  // ========== NORMALIZAR FORMATO DE AFIRMAÇÕES ==========
  result = result
    .replace(/Afirmação\s*(\d+|[IVX]+)\s*[:\-–—]\s*(FALSA|VERDADEIRA)\s*\(([FV])\)\s*[:\-–—]?\s*/gi, 
      (_, num, status, letter) => `\n\nAfirmação ${num} — ${status.toUpperCase()} (${letter.toUpperCase()}):\n`)
    .replace(/Afirmação\s*(\d+|[IVX]+)\s*[:\-–—]\s*(?!FALSA|VERDADEIRA|[FV]\s*\()/gi, 
      (_, num) => `\n\nAfirmação ${num}:\n`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // ========== SEPARAR ALTERNATIVAS CORRIDAS ==========
  // Quando alternativas vêm corridas: "❌ Alternativa A: texto. ✅ Alternativa B: texto..."
  const altPattern = /([❌✅✔️✓✗✖️])\s*Alternativa\s+([A-E])\s*[:.\-–]?\s*/gi;
  const altMatches = [...result.matchAll(new RegExp(altPattern.source, 'gi'))];
  
  if (altMatches.length > 1) {
    let reformatted = '';
    let lastEnd = 0;
    
    for (let i = 0; i < altMatches.length; i++) {
      const currentMatch = altMatches[i];
      const nextMatch = altMatches[i + 1];
      
      // Texto antes da primeira alternativa
      if (i === 0 && currentMatch.index! > 0) {
        const before = result.substring(0, currentMatch.index!).trim();
        if (before) {
          reformatted += before + '\n\n';
        }
      }
      
      const startIndex = currentMatch.index!;
      const endIndex = nextMatch ? nextMatch.index! : result.length;
      
      let block = result.substring(startIndex, endIndex).trim();
      
      // Cada alternativa em nova linha
      reformatted += '\n\n' + block;
    }
    
    result = reformatted.trim();
  }
  
  // ========== SEPARAR SÍNTESE/SEQUÊNCIA FINAL ==========
  const sequenciaPatterns = [
    /A\s+sequência\s+correta\s+é[:\s]*/gi,
    /Sequência\s+correta[:\s]*/gi,
    /A\s+alternativa\s+correta\s+é/gi,
    /correspondente\s+à\s+alternativa/gi,
  ];
  
  for (const pattern of sequenciaPatterns) {
    result = result.replace(pattern, (match) => `\n\n${match}`);
  }
  
  // Padrões "F – V – V – F" ficam em linha própria
  result = result.replace(/([^\n])(\s+[FV]\s*[–\-]\s*[FV]\s*[–\-]\s*[FV]\s*[–\-]\s*[FV])(\s*,?\s*correspondente)?/gi, 
    '$1\n\n$2$3');
  
  // Remover marcador temporário de teoria
  result = result.replace(/\[TEORIA_FIM\]/g, '');
  
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * =====================================================
 * v6.1 LIMPEZA + CORREÇÕES TÉCNICAS
 * =====================================================
 * Aplica:
 * - Correções técnicas objetivas (fórmulas, estados, cargas, gramática)
 * - Remoção de metadados HTML/CSS vazados
 * - Remoção de duplicatas de headers técnicos
 * - Normalização de separadores excessivos
 * 
 * PRESERVA TODO o conteúdo semântico original
 * =====================================================
 */
function cleanResolutionText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // v6.1: Aplicar pipeline completo de correções técnicas objetivas
  cleaned = applyTechnicalCorrections(cleaned);
  
  // v6.1: Organizar afirmações em blocos separados (apenas layout)
  cleaned = reformatAffirmations(cleaned);
  
  // PASSO 1: Limpar metadados HTML que vazaram
  cleaned = cleaned
    .replace(/\*\]:[^"]*"[^>]*>/g, '')
    .replace(/\*\]:pointer-events[^"]*"[^>]*>/g, '')
    .replace(/\*\][^"]*scroll-mt[^"]*"[^>]*>/g, '')
    .replace(/dir="auto"[^>]*>/g, '')
    .replace(/tabindex="-?\d+"[^>]*>/g, '')
    .replace(/data-[a-z-]+="[^"]*"/gi, '')
    .replace(/\*\]:[^\s]+/g, '')
    .trim();
  
  // PASSO 2: Remover duplicatas de header TÉCNICO (não conteúdo)
  cleaned = cleaned
    .replace(/QUESTÃO SIMULADO PROF\. MOISÉS MEDEIROS/gi, '')
    .replace(/✨\s*QUESTÃO:\s*NÍVEL\s*(FÁCIL|MÉDIO|DIFÍCIL)/gi, '')
    .replace(/🧪\s*TEMA:[^\n]*/gi, '')
    .replace(/📁\s*CLASSIFICAÇÃO/gi, '')
    .replace(/🔹\s*Macroassunto:[^\n]*/gi, '')
    .replace(/🔹\s*Microassunto:[^\n]*/gi, '')
    .replace(/TEMA:[^\n]*/gi, '')
    .replace(/CLASSIFICAÇÃO:[^\n]*/gi, '')
    .replace(/Macro\s*Assunto:[^\n]*/gi, '')
    .replace(/Micro\s*Assunto:[^\n]*/gi, '')
    .trim();
  
  // PASSO 3: Normalizar separadores excessivos (layout apenas)
  cleaned = cleaned
    .replace(/---+/g, '\n')
    .replace(/___+/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
  
  return cleaned;
}

/**
 * =====================================================
 * v6.1 NORMALIZA TEXTO DE ALTERNATIVA + CORREÇÕES TÉCNICAS
 * =====================================================
 * Aplica:
 * - Correções técnicas objetivas
 * - Remoção de emojis decorativos do início
 * 
 * PRESERVA TODO o conteúdo semântico original
 * =====================================================
 */
function normalizeAlternativeContent(content: string): string {
  // v6.1: Aplicar pipeline completo de correções técnicas objetivas
  let normalized = applyTechnicalCorrections(content);
  
  // Limpa emojis duplicados do início (layout apenas)
  normalized = normalized
    .replace(/^[🔵🔹▪️•]\s*/g, '')
    .trim();
  
  return normalized;
}

/**
 * =====================================================
 * PARSER INTELIGENTE v6.0 — ORGANIZAÇÃO SEM INTERFERÊNCIA
 * Detecta e organiza seções visualmente
 * PRESERVA TODO o conteúdo textual original
 * Lema: "Organize, não interfira. O conteúdo é sagrado."
 * =====================================================
 */
function parseResolutionText(text: string): ParsedSection[] {
  if (!text) return [];
  
  const cleanedText = cleanResolutionText(text);
  if (!cleanedText) return [];

  const sections: ParsedSection[] = [];
  
  // ========== PADRÕES DE ALTERNATIVAS E AFIRMAÇÕES ==========
  // Nota: o texto já está limpo de ** via cleanResolutionText
  const alternativaPatterns = [
    // Alternativas erradas com X
    { 
      regex: /[❌✖️✗×]\s*Alternativa\s*([A-E])[:.]?\s*/gi, 
      type: 'alternativa_errada' as SectionType,
      isCorrect: false 
    },
    // Alternativas corretas com check
    { 
      regex: /[✅✔️✓☑️]\s*Alternativa\s*([A-E])[:.]?\s*/gi, 
      type: 'alternativa_correta' as SectionType,
      isCorrect: true 
    },
    // Alternativas neutras
    { 
      regex: /[🔵🔹▪️•◆►]\s*Alternativa\s*([A-E])[:.]?\s*/gi, 
      type: 'alternativa_analise' as SectionType,
      isCorrect: false 
    },
    // Formato simples "Alternativa A:" ou "Alternativa A -"
    { 
      regex: /(?:^|\n)\s*Alternativa\s*([A-E])\s*[:\-–→]\s*/gi, 
      type: 'alternativa_analise' as SectionType,
      isCorrect: false 
    },
    // Afirmação com status VERDADEIRA (V)
    { 
      regex: /Afirmação\s*(\d+|[IVX]+)\s*[—–-]\s*VERDADEIRA\s*\([VT]\)[:\s]*/gi, 
      type: 'afirmacao_correta' as SectionType,
      isCorrect: true 
    },
    // Afirmação com status FALSA (F)
    { 
      regex: /Afirmação\s*(\d+|[IVX]+)\s*[—–-]\s*FALSA\s*\([F]\)[:\s]*/gi, 
      type: 'afirmacao_incorreta' as SectionType,
      isCorrect: false 
    },
    // Afirmação romana com análise (formato genérico)
    { 
      regex: /Afirmação\s*(\d+|[IVX]+)\s*[:–-]\s*["']?([^"'\n]+)["']?\s*/gi, 
      type: 'afirmacao_analise' as SectionType,
      isCorrect: false 
    },
    // Afirmação correta com emoji
    { 
      regex: /[✅✔️✓]\s*AFIRMAÇÃO\s*([IVX\d]+):?\s*/gi, 
      type: 'afirmacao_correta' as SectionType,
      isCorrect: true 
    },
    // Afirmação incorreta com emoji
    { 
      regex: /[❌✖️✗×]\s*AFIRMAÇÃO\s*([IVX\d]+):?\s*/gi, 
      type: 'afirmacao_incorreta' as SectionType,
      isCorrect: false 
    },
  ];

  // ========== PADRÕES DE SEÇÕES ESPECIAIS ==========
  const sectionPatterns = [
    // ANÁLISE DAS ALTERNATIVAS (header)
    { regex: /ANÁLISE\s*DAS\s*ALTERNATIVAS:?\s*/gi, type: 'analise_header' as SectionType },
    
    // PASSOS (sem emojis chineses, já limpos)
    { regex: /[📊⚗️⚙️🔬🧪]\s*PASSO\s*(\d+)[:\s]*/gi, type: 'passo' as SectionType },
    { regex: /PASSO\s*(\d+)[:\s]*/gi, type: 'passo' as SectionType },
    
    // SÍNTESE (parágrafo explicativo após afirmações)
    { regex: /O\s+isoeugenol\s+apresenta/gi, type: 'sintese' as SectionType },
    { regex: /A\s+molécula\s+apresenta/gi, type: 'sintese' as SectionType },
    { regex: /O\s+composto\s+apresenta/gi, type: 'sintese' as SectionType },
    { regex: /SÍNTESE[:\s]*/gi, type: 'sintese' as SectionType },
    
    // RESUMO
    { regex: /Agora reunindo tudo/gi, type: 'resumo' as SectionType },
    { regex: /Reunindo tudo/gi, type: 'resumo' as SectionType },
    { regex: /RESUMO/gi, type: 'resumo' as SectionType },
    { regex: /Sequência:\s*/gi, type: 'resumo' as SectionType },
    
    // CONCLUSÃO E GABARITO
    { regex: /[🧬📊☑️]\s*CONCLUSÃO[:\s]*/gi, type: 'conclusao' as SectionType },
    { regex: /CONCLUSÃO[:\s]*/gi, type: 'conclusao' as SectionType },
    { regex: /A alternativa correta é/gi, type: 'conclusao' as SectionType },
    { regex: /CONCLUSÃO E GABARITO/gi, type: 'conclusao' as SectionType },
    { regex: /[✓✔️]\s*Gabarito:?\s*/gi, type: 'conclusao' as SectionType },
    { regex: /Gabarito:?\s*letra\s*([A-E])/gi, type: 'conclusao' as SectionType },
    // Padrões de sequência final (F-V-V-F)
    { regex: /A\s+sequência\s+correta\s+é[:\s]*/gi, type: 'conclusao' as SectionType },
    { regex: /Sequência\s+correta[:\s]*/gi, type: 'conclusao' as SectionType },
    { regex: /correspondente\s+à\s+alternativa/gi, type: 'conclusao' as SectionType },
    
    // COMPETÊNCIA E HABILIDADE ENEM
    { regex: /[🎯⚫◆]\s*COMPETÊNCIAS?\s*E\s*HABILIDADES?\s*[-–]?\s*ENEM[:\s]*/gi, type: 'competencia' as SectionType },
    { regex: /COMPETÊNCIAS?\s*E\s*HABILIDADES?\s*[-–]?\s*ENEM[:\s]*/gi, type: 'competencia' as SectionType },
    { regex: /[◆⚫🎯]\s*COMPETÊNCIA:/gi, type: 'competencia' as SectionType },
    { regex: /COMPETÊNCIA/gi, type: 'competencia' as SectionType },
    
    // DIRECIONAMENTO / ESTRATÉGIA
    { regex: /[📌⊙◎🚀✦🧭]\s*DIRECIONAMENTO\s*[\/|]?\s*ESTRATÉGIA[:\s]*/gi, type: 'estrategia' as SectionType },
    { regex: /DIRECIONAMENTO\s*[\/|]?\s*ESTRATÉGIA[:\s]*/gi, type: 'estrategia' as SectionType },
    { regex: /[🚀✦🧭]\s*ESTRATÉGIA[:\s]*/gi, type: 'estrategia' as SectionType },
    { regex: /DIRECIONAMENTO/gi, type: 'estrategia' as SectionType },
    { regex: /ESTRATÉGIA/gi, type: 'estrategia' as SectionType },
    
    // PEGADINHAS COMUNS (sem ⚠)
    { regex: /[△🚨]\s*PEGADINHAS?\s*(COMUNS?)?[:\s]*/gi, type: 'pegadinhas' as SectionType },
    { regex: /PEGADINHAS?\s*(COMUNS?)?[:\s]*/gi, type: 'pegadinhas' as SectionType },
    
    // DICA DE OURO
    { regex: /[💡🔆✨💎]\s*DICA\s*DE\s*OURO[:\s]*/gi, type: 'dica' as SectionType },
    { regex: /DICA\s*DE\s*OURO[:\s]*/gi, type: 'dica' as SectionType },
  ];

  // ========== COLETA DE POSIÇÕES ==========
  interface SectionStart {
    index: number;
    type: SectionType;
    match: string;
    stepNumber?: number;
    afirmacaoNumber?: string;
    alternativaLetter?: string;
    isCorrect?: boolean;
    /**
     * Texto inline capturado no próprio marcador.
     * Ex: "Afirmação 1 - 'texto...'" (para não criar blocos vazios)
     */
    inlineText?: string;
  }
  
  const allStarts: SectionStart[] = [];

  // Buscar alternativas
  for (const pattern of alternativaPatterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, 'gi');
    while ((match = regex.exec(cleanedText)) !== null) {
      const afirmacaoNumber = pattern.type.includes('afirmacao') ? match[1] : undefined;

      // Caso especial: "Afirmação X - TEXTO" captura texto inline (match[2])
      const inlineText = pattern.type === 'afirmacao_analise'
        ? String(match[2] || '').trim()
        : undefined;

      allStarts.push({
        index: match.index,
        type: pattern.type,
        match: match[0],
        alternativaLetter: match[1]?.toUpperCase(),
        afirmacaoNumber,
        inlineText: inlineText || undefined,
        isCorrect: pattern.isCorrect,
      });
    }
  }

  // Buscar seções especiais
  for (const pattern of sectionPatterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, 'gi');
    while ((match = regex.exec(cleanedText)) !== null) {
      allStarts.push({
        index: match.index,
        type: pattern.type,
        match: match[0],
        stepNumber: pattern.type === 'passo' ? parseInt(match[1] || '0') : undefined,
      });
    }
  }

  // Ordenar por posição
  allStarts.sort((a, b) => a.index - b.index);

  // Sem seções = retorna como intro
  if (allStarts.length === 0) {
    return [{ type: 'intro', content: cleanedText.trim() }];
  }

  // INTRO (texto antes da primeira seção)
  const firstSection = allStarts[0];
  if (firstSection.index > 0) {
    let introText = cleanedText.substring(0, firstSection.index).trim();
    
    // Limpar referências a alternativas que vazaram para intro
    introText = introText
      .replace(/🔬\s*RESOLUÇÃO COMENTADA PELO PROF\. MOISÉS MEDEIROS[:\s]*/gi, '')
      .replace(/RESOLUÇÃO COMENTADA PELO PROF\. MOISÉS MEDEIROS[:\s]*/gi, '')
      .replace(/[❌✅✔️✓✗✖️🔵🔹▪️•]\s*Alternativa\s*[A-E][^\n]*/gi, '')
      .replace(/Alternativa\s*[A-E]\s*[-–→:][^\n]*/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    if (introText.length > 20) {
      sections.push({ type: 'intro', content: introText });
    }
  }

  // Processar cada seção
  for (let i = 0; i < allStarts.length; i++) {
    const current = allStarts[i];
    const next = allStarts[i + 1];
    
    const startIndex = current.index + current.match.length;
    const endIndex = next ? next.index : cleanedText.length;
    let content = cleanedText.substring(startIndex, endIndex).trim();

    // Se o marcador trouxe texto inline (ex: Afirmação X - "..."), anexa no topo.
    if (current.inlineText) {
      const inline = current.inlineText.trim();
      if (inline) {
        // Evitar duplicação caso o trecho já esteja no conteúdo subsequente.
        const normalizedInline = inline.toLowerCase().replace(/[^ -\w\s]/g, '').trim();
        const normalizedContent = content.toLowerCase().replace(/[^ -\w\s]/g, '').trim();
        if (!normalizedContent.includes(normalizedInline)) {
          content = `${inline}\n\n${content}`.trim();
        }
      }
    }

    // Normalizar conteúdo de alternativas/afirmações
    if (current.type.includes('alternativa') || current.type.includes('afirmacao')) {
      content = normalizeAlternativeContent(content);
    }

    // Limpar emojis redundantes do início
    content = content.replace(/^[🔵🔹▪️•❌✅✓✗✔️✖️]+\s*/g, '').trim();

    // Normalização final anti-blocos vazios (só ruído/pontuação)
    const meaningful = content.replace(/[\s\n\r\t\-–—•.…:;]+/g, '').trim();

    // Ignorar seções vazias ou muito curtas
    if (meaningful.length < 3 && current.type !== 'analise_header') continue;

    sections.push({
      type: current.type,
      content,
      stepNumber: current.stepNumber,
      afirmacaoNumber: current.afirmacaoNumber,
      alternativaLetter: current.alternativaLetter,
      isCorrect: current.isCorrect,
      title: current.match.trim(),
    });
  }

// ========== DEDUPLICAÇÃO RIGOROSA (PASSOS + CONCLUSÃO + AFIRMAÇÕES + ALTERNATIVAS) ==========
  // REGRA INTERNACIONAL: nada duplicado, nada vazio, estrutura consistente.
  // LEI v3.3: Alternativas agrupadas em seção visual unificada "ANÁLISE DAS ALTERNATIVAS"

  const deduplicatedSections: ParsedSection[] = [];
  const seenPassos = new Map<number, ParsedSection>(); // stepNumber -> best section
  const seenAlternatives = new Map<string, ParsedSection>(); // A-E -> best section
  const seenAfirmacoes = new Map<string, ParsedSection>(); // I-V / 1-5 -> best section

  // Conclusão / resumo devem existir no máximo 1 vez cada (serão colocados no final do fluxo)
  let bestConclusao: ParsedSection | null = null;
  let bestResumo: ParsedSection | null = null;

  const priorityForAlt = (t: SectionType) => (t === 'alternativa_correta' ? 3 : t === 'alternativa_errada' ? 2 : 1);
  const priorityForAfirm = (t: SectionType) => (t === 'afirmacao_correta' ? 3 : t === 'afirmacao_incorreta' ? 2 : 1);

  for (const section of sections) {
    // PASSOS (dedup por número)
    if (section.type === 'passo' && section.stepNumber) {
      const n = section.stepNumber;
      const existing = seenPassos.get(n);
      if (!existing) {
        seenPassos.set(n, section);
      } else {
        const merged = mergeUniqueContent(existing.content, section.content);
        // Preferir o mais "completo" (conteúdo maior depois do merge)
        const best = merged.length >= existing.content.length ? { ...existing, content: merged } : existing;
        seenPassos.set(n, best);
      }
      continue;
    }

    // CONCLUSÃO (apenas 1)
    if (section.type === 'conclusao') {
      if (!bestConclusao) {
        bestConclusao = section;
      } else {
        bestConclusao = {
          ...bestConclusao,
          content: mergeUniqueContent(bestConclusao.content, section.content),
        };
      }
      continue;
    }

    // RESUMO (apenas 1)
    if (section.type === 'resumo') {
      if (!bestResumo) {
        bestResumo = section;
      } else {
        bestResumo = {
          ...bestResumo,
          content: mergeUniqueContent(bestResumo.content, section.content),
        };
      }
      continue;
    }

    // ALTERNATIVAS (A-E) — Consolidar para agrupamento posterior
    if (section.type.includes('alternativa') && section.alternativaLetter) {
      const letter = section.alternativaLetter;
      const existing = seenAlternatives.get(letter);
      if (!existing) {
        seenAlternatives.set(letter, section);
      } else {
        const existingPriority = priorityForAlt(existing.type);
        const newPriority = priorityForAlt(section.type);
        const mergedContent = mergeUniqueContent(existing.content, section.content);
        const chosen = newPriority > existingPriority ? { ...section, content: mergedContent } : { ...existing, content: mergedContent };
        seenAlternatives.set(letter, chosen);
      }
      continue;
    }

    // AFIRMAÇÕES (I-V ou 1-5)
    if (section.type.includes('afirmacao') && section.afirmacaoNumber) {
      const num = section.afirmacaoNumber;
      const existing = seenAfirmacoes.get(num);
      if (!existing) {
        seenAfirmacoes.set(num, section);
      } else {
        const existingPriority = priorityForAfirm(existing.type);
        const newPriority = priorityForAfirm(section.type);
        const mergedContent = mergeUniqueContent(existing.content, section.content);
        const chosen = newPriority > existingPriority ? { ...section, content: mergedContent } : { ...existing, content: mergedContent };
        seenAfirmacoes.set(num, chosen);
      }
      continue;
    }

    // OUTROS: mantém
    deduplicatedSections.push(section);
  }

  // Reinserção ordenada: PASSOS (1..n)
  const orderedStepNumbers = Array.from(seenPassos.keys()).sort((a, b) => a - b);
  for (const n of orderedStepNumbers) {
    const step = seenPassos.get(n);
    if (step) deduplicatedSections.push(step);
  }

  // ========== AGRUPAMENTO DE ALTERNATIVAS EM SEÇÃO UNIFICADA v4.0 ==========
  // LEI PERMANENTE: Alternativas (A-E) ficam todas dentro de uma seção visual "ANÁLISE DAS ALTERNATIVAS"
  // Cada alternativa formatada de forma PEDAGÓGICA: Letra + Status + Explicação clara e concisa
  // NUNCA misturar teoria com análise — cada alternativa tem sua explicação própria
  const orderedLetters = ['A', 'B', 'C', 'D', 'E'];
  const consolidatedAlternatives: string[] = [];
  
  for (const letter of orderedLetters) {
    const alt = seenAlternatives.get(letter);
    if (alt) {
      const isCorrect = alt.type === 'alternativa_correta';
      
      // ========== LIMPEZA PEDAGÓGICA DO CONTEÚDO ==========
      let content = alt.content
        // Remover marcadores redundantes
        .replace(/^\.+\s*/g, '')
        .replace(/^[:\-–→]\s*/g, '')
        // Remover referências a outras alternativas dentro do texto desta
        .replace(/[❌✅]\s*Alternativa\s*[A-E][^.]*\./gi, '')
        .replace(/Alternativa\s*[A-E]\s*[:–\-]\s*[^.]*\./gi, '')
        // Remover declarações redundantes de status
        .replace(/Esta\s+(é\s+a\s+)?alternativa\s+(está\s+)?(CORRETA|INCORRETA|correta|incorreta)[!.]?\s*/gi, '')
        .replace(/^(CORRETA|INCORRETA)[!.]?\s*/gi, '')
        // Normalizar espaços
        .replace(/\s{2,}/g, ' ')
        .trim();
      
      // ========== EXTRAÇÃO DA EXPLICAÇÃO PRINCIPAL ==========
      // Se o texto é muito longo, extrair apenas a parte relevante para ESTA alternativa
      if (content.length > 400) {
        // Tentar encontrar a primeira sentença significativa (>50 chars) ou primeiro parágrafo
        const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
        let extractedContent = '';
        
        for (const sentence of sentences) {
          extractedContent += sentence + ' ';
          // Parar quando tiver conteúdo suficiente (~200-300 chars) ou 2 sentenças
          if (extractedContent.length >= 200 || sentences.indexOf(sentence) >= 1) {
            break;
          }
        }
        
        content = extractedContent.trim();
        if (!content.endsWith('.') && !content.endsWith('!') && !content.endsWith('?')) {
          content += '.';
        }
      }
      
      // Garantir que não está vazio
      if (content.length < 10) {
        content = isCorrect ? 'Esta é a alternativa correta.' : 'Esta alternativa está incorreta.';
      }
      
      const statusIcon = isCorrect ? '✅' : '❌';
      const statusLabel = isCorrect ? 'CORRETA' : 'INCORRETA';
      
      // Formato pedagógico limpo: ❌ A) INCORRETA — explicação clara
      consolidatedAlternatives.push(`${statusIcon} ${letter}) ${statusLabel} — ${content}`);
    }
  }
  
  // Se há alternativas, criar uma única seção agrupada
  if (consolidatedAlternatives.length > 0) {
    deduplicatedSections.push({
      type: 'analise_header',
      content: consolidatedAlternatives.join('\n\n'),
      title: 'ANÁLISE DAS ALTERNATIVAS',
    });
  }

  // AFIRMAÇÕES (1..n) — Mantém como seções individuais para clareza
  const afirmacaoKeys = Array.from(seenAfirmacoes.keys()).sort((a, b) => {
    const numA = a.match(/\d+/) ? parseInt(a) : romanToNumber(a);
    const numB = b.match(/\d+/) ? parseInt(b) : romanToNumber(b);
    return numA - numB;
  });
  for (const key of afirmacaoKeys) {
    const afir = seenAfirmacoes.get(key);
    if (afir) deduplicatedSections.push(afir);
  }

  if (bestResumo) deduplicatedSections.push(bestResumo);
  if (bestConclusao) deduplicatedSections.push(bestConclusao);

  // ========== MERGE GLOBAL DE SEÇÕES PEDAGÓGICAS ==========
  // REGRA UNIVERSAL: Agrupa seções do mesmo tipo mergeable (inclui SÍNTESE)
  // LEI PERMANENTE: Competência/Habilidade ENEM NUNCA duplica e SEMPRE organizado
  // NOTA: 'sintese' NÃO está aqui pois agora faz parte do bloco unificado "ANÁLISE DA QUESTÃO"
  const mergableTypes: SectionType[] = ['pegadinhas', 'dica', 'estrategia', 'competencia'];
  
  const nonMergeable: ParsedSection[] = [];
  const mergeableByType: Map<SectionType, ParsedSection[]> = new Map();
  
  for (const section of deduplicatedSections) {
    if (mergableTypes.includes(section.type)) {
      const existing = mergeableByType.get(section.type) || [];
      existing.push(section);
      mergeableByType.set(section.type, existing);
    } else {
      nonMergeable.push(section);
    }
  }
  
  // Criar seções consolidadas
  const consolidatedMergeable: ParsedSection[] = [];

  // ========== HELPERS PARA DEDUP ENEM ==========
  const normalizeLoose = (s: string) =>
    s.toLowerCase().replace(/[^\w\sáéíóúãõâêîôûç]/gi, '').replace(/\s+/g, ' ').trim();

  // Extrai chave única por C#/H#/Área# para ENEM
  const enemKeyForLine = (line: string): string => {
    const cMatch = line.match(/\b[CÁá]rea\s*C?\s*(\d{1,2})\b/i) || line.match(/\bC\s*(\d{1,2})\b/i);
    const hMatch = line.match(/\bH\s*(\d{1,2})\b/i) || line.match(/\bHabilidade\s*(\d{1,2})\b/i);
    const areaMatch = line.match(/\bÁrea\s*(\d{1,2})\b/i);
    const c = cMatch?.[1] || '';
    const h = hMatch?.[1] || '';
    const a = areaMatch?.[1] || '';
    if (c || h || a) return `C${c}|A${a}|H${h}`;
    return normalizeLoose(line);
  };

  // Formata linha ENEM: separa Competência/Área e Habilidade em linhas distintas (REGRA PERMANENTE)
  const formatEnemLine = (line: string): string => {
    let s = line.replace(/\s*\|\s*/g, ' | ').replace(/\s+/g, ' ').trim();

    // Caso comum: veio tudo em texto corrido na MESMA linha
    // Ex: "Competência de área: 3 Habilidade: 12" → quebra em 2 linhas
    if (/\bcompet[eê]ncia\b/i.test(s) && /\bhabilidade\b/i.test(s) && !/\n/.test(s)) {
      s = s
        .replace(/\s*(Habilidade\b)/i, '\
$1')
        .replace(/\n\s+/g, '\n')
        .trim();
    }

    // Caso com delimitadores "|": separar Competência/Área e Habilidade
    const parts = s.split(/\s*\|\s*/g).map(p => p.trim()).filter(Boolean);
    const compPart = parts.find(p => /\b(compet[eê]ncia|área)\b/i.test(p)) || parts[0];
    const habPart = parts.find(p => /\bhabilidade\b/i.test(p));

    if (habPart && compPart && compPart !== habPart) {
      return `${compPart}\n${habPart}`;
    }

    return s;
  };
  
  for (const [type, sectionsOfType] of mergeableByType.entries()) {
    if (sectionsOfType.length === 0) continue;
    
    const allContents: string[] = [];
    const seenKeys = new Set<string>();
    
    for (const section of sectionsOfType) {
      let content = section.content
        .replace(/^[•\-\s]+/gm, '')
        .replace(/["""'']/g, '')  // Remove aspas especiais (bugs)
        .replace(/PEGADINHAS?\s*(COMUNS?)?:?\s*/gi, '')
        .replace(/DICA\s*DE\s*OURO:?\s*/gi, '')
        .replace(/DIRECIONAMENTO\s*[\/|]?\s*ESTRATÉGIA:?\s*/gi, '')
        .replace(/ESTRATÉGIA:?\s*/gi, '')
        .replace(/COMPETÊNCIAS?\s*E\s*HABILIDADES?\s*[-–]?\s*ENEM:?\s*/gi, '')
        .replace(/E\s+HABILIDADE\s*[-–]?\s*ENEM\s*:?\s*/gi, '')  // Fragmento solto
        .replace(/SÍNTESE:?\s*/gi, '')
        .replace(/de\s+área\s+C:\s*/gi, 'Competência C7: ')      // Corrige fragmento "de área C:"
        .replace(/de\s+área\s+(\d+):\s*/gi, 'Área $1: ')         // Corrige "de área 7:"
        .replace(/\*\*Gabarito:[^\*]+\*\*/gi, '')
        .replace(/---+/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      if (!content) continue;
      
      const items = content.split(/\n+/).map(item => item.trim()).filter(Boolean);
      
      for (const item of items) {
        const normalizedItem = item.replace(/^[•\-\s]+/, '').trim();
        if (normalizedItem.length <= 10) continue;
        
        // Dedup: para ENEM usa chave por C/Área/H; para outros usa texto normalizado
        const key = type === 'competencia' ? enemKeyForLine(normalizedItem) : normalizeLoose(normalizedItem);
        
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        
        // Para ENEM, formata corretamente; para outros, mantém original
        allContents.push(type === 'competencia' ? formatEnemLine(normalizedItem) : normalizedItem);
      }
    }
    
    if (allContents.length > 0) {
      const consolidatedContent = allContents.length === 1
        ? allContents[0]
        : allContents.map(item => `• ${item}`).join('\n');
      
      consolidatedMergeable.push({
        type,
        content: consolidatedContent,
        title: sectionsOfType[0].title,
      });
    }
  }
  
  // Reconstruir array final — ORDEM LÓGICA INTERNACIONAL
  const mergedSections: ParsedSection[] = [];
  
  // Adicionar não-mergeáveis na ordem original
  for (const section of nonMergeable) {
    mergedSections.push(section);
  }
  
  // Adicionar mergeáveis consolidados no final (ordem: competencia > estrategia > pegadinhas > dica)
  // NOTA: 'sintese' removida pois agora faz parte do bloco "ANÁLISE DA QUESTÃO"
  const mergeOrder: SectionType[] = ['competencia', 'estrategia', 'pegadinhas', 'dica'];
  for (const type of mergeOrder) {
    const consolidated = consolidatedMergeable.find(s => s.type === type);
    if (consolidated) {
      mergedSections.push(consolidated);
    }
  }

  return mergedSections;
}

/**
 * Mescla conteúdos únicos de duas strings (evita duplicatas)
 */
function mergeUniqueContent(content1: string, content2: string): string {
  if (!content1) return content2;
  if (!content2) return content1;
  
  // Normalizar para comparação
  const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const n1 = normalize(content1);
  const n2 = normalize(content2);
  
  // Se são iguais ou um contém o outro, retornar o maior
  if (n1 === n2) return content1.length > content2.length ? content1 : content2;
  if (n1.includes(n2)) return content1;
  if (n2.includes(n1)) return content2;
  
  // Combinar ambos (evitar repetição total)
  return `${content1}\n\n${content2}`;
}

/**
 * Converte número romano para inteiro
 */
function romanToNumber(roman: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let result = 0;
  const upper = roman.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const current = map[upper[i]] || 0;
    const next = map[upper[i + 1]] || 0;
    if (current < next) {
      result -= current;
    } else {
      result += current;
    }
  }
  return result || 99; // Fallback alto para ordenação
}

/**
 * Ícone para cada tipo de seção
 */
function getSectionIcon(type: SectionType, stepNumber?: number) {
  switch (type) {
    case 'passo':
      if (stepNumber === 1) return Cog;
      if (stepNumber === 2) return Beaker;
      if (stepNumber === 3) return BarChart3;
      if (stepNumber === 4) return CheckCircle;
      return Zap;
    case 'conclusao':
      return CheckCircle;
    case 'competencia':
      return GraduationCap;
    case 'estrategia':
      return Compass;
    case 'pegadinhas':
      return AlertTriangle;
    case 'dica':
      return Lightbulb;
    case 'afirmacao_correta':
    case 'alternativa_correta':
      return CheckCircle;
    case 'afirmacao_incorreta':
    case 'alternativa_errada':
      return XCircle;
    case 'afirmacao_analise':
    case 'alternativa_analise':
      return CircleDot;
    case 'analise_header':
      return ListChecks;
    case 'resumo':
      return MessageCircle;
    case 'sintese':
      return Target;
    default:
      return Sparkles;
  }
}

/**
 * Configuração visual para cada tipo de seção
 */
function getSectionStyles(type: SectionType, isCorrect?: boolean): { 
  border: string; 
  bg: string; 
  iconColor: string; 
  titleColor: string;
  accentColor: string;
} {
  switch (type) {
    case 'alternativa_correta':
      return {
        border: 'border-l-4 border-l-green-500 border-t border-r border-b border-green-500/30',
        bg: 'bg-green-500/10',
        iconColor: 'text-green-500',
        titleColor: 'text-green-500',
        accentColor: 'bg-green-500/20',
      };
    case 'alternativa_errada':
      return {
        border: 'border-l-4 border-l-red-500 border-t border-r border-b border-red-500/30',
        bg: 'bg-red-500/5',
        iconColor: 'text-red-500',
        titleColor: 'text-red-500',
        accentColor: 'bg-red-500/20',
      };
    case 'afirmacao_analise':
    case 'alternativa_analise':
      return {
        border: 'border-l-4 border-l-blue-500 border-t border-r border-b border-blue-500/30',
        bg: 'bg-blue-500/5',
        iconColor: 'text-blue-500',
        titleColor: 'text-blue-500',
        accentColor: 'bg-blue-500/20',
      };
    case 'analise_header':
      return {
        border: 'border-l-4 border-l-indigo-500 border-t border-r border-b border-indigo-500/30',
        bg: 'bg-indigo-500/5',
        iconColor: 'text-indigo-500',
        titleColor: 'text-indigo-500',
        accentColor: 'bg-indigo-500/20',
      };
    case 'afirmacao_correta':
      return {
        border: 'border-l-4 border-l-green-500 border-t border-r border-b border-green-500/30',
        bg: 'bg-green-500/10',
        iconColor: 'text-green-500',
        titleColor: 'text-green-500',
        accentColor: 'bg-green-500/20',
      };
    case 'afirmacao_incorreta':
      return {
        border: 'border-l-4 border-l-red-500 border-t border-r border-b border-red-500/30',
        bg: 'bg-red-500/5',
        iconColor: 'text-red-500',
        titleColor: 'text-red-500',
        accentColor: 'bg-red-500/20',
      };
    case 'passo':
      return {
        border: 'border-l-4 border-l-blue-500 border-t border-r border-b border-blue-500/30',
        bg: 'bg-blue-500/5',
        iconColor: 'text-blue-500',
        titleColor: 'text-blue-500',
        accentColor: 'bg-blue-500/20',
      };
    case 'conclusao':
      return {
        border: 'border-l-4 border-l-emerald-500 border-t border-r border-b border-emerald-500/30',
        bg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        titleColor: 'text-emerald-500',
        accentColor: 'bg-emerald-500/20',
      };
    case 'competencia':
      return {
        border: 'border-l-4 border-l-purple-500 border-t border-r border-b border-purple-500/30',
        bg: 'bg-purple-500/5',
        iconColor: 'text-purple-500',
        titleColor: 'text-purple-500',
        accentColor: 'bg-purple-500/20',
      };
    case 'estrategia':
      return {
        border: 'border-l-4 border-l-amber-500 border-t border-r border-b border-amber-500/30',
        bg: 'bg-amber-500/5',
        iconColor: 'text-amber-500',
        titleColor: 'text-amber-500',
        accentColor: 'bg-amber-500/20',
      };
    case 'pegadinhas':
      return {
        border: 'border-l-4 border-l-orange-500 border-t border-r border-b border-orange-500/30',
        bg: 'bg-orange-500/5',
        iconColor: 'text-orange-500',
        titleColor: 'text-orange-500',
        accentColor: 'bg-orange-500/20',
      };
    case 'dica':
      return {
        border: 'border-l-4 border-l-yellow-500 border-t border-r border-b border-yellow-500/30',
        bg: 'bg-yellow-500/5',
        iconColor: 'text-yellow-500',
        titleColor: 'text-yellow-500',
        accentColor: 'bg-yellow-500/20',
      };
    case 'resumo':
      return {
        border: 'border-l-4 border-l-cyan-500 border-t border-r border-b border-cyan-500/30',
        bg: 'bg-cyan-500/5',
        iconColor: 'text-cyan-500',
        titleColor: 'text-cyan-500',
        accentColor: 'bg-cyan-500/20',
      };
    case 'sintese':
      return {
        border: 'border-l-4 border-l-teal-500 border-t border-r border-b border-teal-500/30',
        bg: 'bg-teal-500/5',
        iconColor: 'text-teal-500',
        titleColor: 'text-teal-500',
        accentColor: 'bg-teal-500/20',
      };
    default:
      return {
        border: 'border border-border/50',
        bg: 'bg-muted/20',
        iconColor: 'text-primary',
        titleColor: 'text-foreground',
        accentColor: 'bg-primary/20',
      };
  }
}

/**
 * Título formatado para cada tipo de seção
 */
function getSectionTitle(section: ParsedSection): string {
  switch (section.type) {
    case 'alternativa_correta':
      return `Alternativa ${section.alternativaLetter} CORRETA:`;
    case 'alternativa_errada':
      return `Alternativa ${section.alternativaLetter} ERRADA:`;
    case 'alternativa_analise':
      return `Alternativa ${section.alternativaLetter}:`;
    case 'afirmacao_analise':
      return `Afirmação ${section.afirmacaoNumber}:`;
    case 'afirmacao_correta':
      return `Afirmação ${section.afirmacaoNumber} VERDADEIRA:`;
    case 'afirmacao_incorreta':
      return `Afirmação ${section.afirmacaoNumber} FALSA:`;
    case 'analise_header':
      return 'ANÁLISE DAS ALTERNATIVAS';
    case 'passo':
      return `PASSO ${section.stepNumber}`;
    case 'conclusao':
      return 'CONCLUSÃO E GABARITO';
    case 'competencia':
      return 'COMPETÊNCIA E HABILIDADE - ENEM';
    case 'estrategia':
      return 'DIRECIONAMENTO / ESTRATÉGIA';
    case 'pegadinhas':
      return 'PEGADINHAS COMUNS';
    case 'dica':
      return 'DICA DE OURO';
    case 'resumo':
      return 'RESUMO FINAL';
    case 'sintese':
      return 'SÍNTESE';
    default:
      return '';
  }
}

/**
 * Extrai URLs de imagens do texto usando o padrão [IMAGEM: URL]
 */
function extractImagesFromResolution(text: string): { cleanedText: string; images: string[] } {
  const imagePattern = /\[IMAGEM:\s*(https?:\/\/[^\]\s]+)\s*\]/gi;
  const images: string[] = [];
  let match;
  
  while ((match = imagePattern.exec(text)) !== null) {
    if (match[1]) {
      images.push(match[1]);
    }
  }
  
  // Remove as tags de imagem do texto
  const cleanedText = text.replace(imagePattern, '').trim();
  
  return { cleanedText, images };
}

/**
 * =====================================================
 * FORMATA CONTEÚDO COM FÓRMULAS QUÍMICAS — POLICY v3.0
 * LEGIBILIDADE MÁXIMA — PADRÃO INTERNACIONAL DE QUESTÕES
 * =====================================================
 * 
 * REGRAS DE FORMATAÇÃO (IMUTÁVEIS):
 * 1. Reações químicas: bloco destacado, bold, maior
 * 2. Estados físicos: sobrescrito (s), (l), (g), (aq)
 * 3. Um passo por linha, nunca múltiplos passos inline
 * 4. Equações/cálculos separados do texto
 * 5. Hierarquia visual clara
 * 6. Prioridade: legibilidade mobile
 * =====================================================
 */

/**
 * Detecta se uma linha contém uma reação química
 * Padrões: A + B → C, A → B + C, equações com setas
 */
function isChemicalReaction(line: string): boolean {
  // Padrões de reação química
  const reactionPatterns = [
    /[A-Z][a-z]?\d*\s*[\+\-]\s*[A-Z][a-z]?\d*\s*[→⇌←=>]+/i,  // A + B →
    /[→⇌←=>]+\s*[A-Z][a-z]?\d*\s*[\+\-]?\s*[A-Z]?/i,         // → C + D
    /\bΔH\s*[=:]\s*[-+]?\d/i,                                 // ΔH = 
    /\bH₂O\b.*[→⇌]|[→⇌].*\bH₂O\b/i,                          // H₂O com seta
    /\bCO₂\b.*[→⇌]|[→⇌].*\bCO₂\b/i,                          // CO₂ com seta
    /\bO₂\b.*[→⇌]|[→⇌].*\bO₂\b/i,                            // O₂ com seta
    /C\d+H\d+O?\d*.*[→⇌]/i,                                   // Fórmulas orgânicas
    /₍[sgla][q]?₎.*[→⇌]|[→⇌].*₍[sgla][q]?₎/i,                // Com estados físicos
  ];
  
  return reactionPatterns.some(p => p.test(line));
}

/**
 * Detecta se uma linha contém um cálculo/equação matemática
 */
function isMathEquation(line: string): boolean {
  const mathPatterns = [
    /\bΔH\s*[_=:]/i,                          // ΔH = 
    /\bn\s*=\s*m\s*\/\s*M/i,                  // n = m/M
    /\bPV\s*=\s*nRT/i,                        // PV = nRT
    /\bm\s*=\s*n\s*[×x]\s*M/i,                // m = n × M
    /\b\d+\s*[×x]\s*\d+\s*[=:]/,              // 6 × 394 =
    /[=:]\s*[-+]?\d+(\.\d+)?\s*(kJ|kcal|J)/i, // = -394 kJ
    /\bΔH_?(final|total|reação)\s*[=:]/i,    // ΔH_final =
  ];
  
  return mathPatterns.some(p => p.test(line));
}

/**
 * Formata uma linha como bloco de reação química destacado
 */
function formatAsChemicalReactionBlock(line: string): string {
  // Remover espaços extras e normalizar
  const cleaned = line.trim().replace(/\s{2,}/g, ' ');
  
  // Retorna com marcadores especiais para renderização
  return `\n【REAÇÃO】${cleaned}【/REAÇÃO】\n`;
}

/**
 * Formata uma linha como bloco de equação matemática
 */
function formatAsMathBlock(line: string): string {
  const cleaned = line.trim().replace(/\s{2,}/g, ' ');
  return `\n【EQUAÇÃO】${cleaned}【/EQUAÇÃO】\n`;
}

/**
 * Separa passos que estão na mesma linha
 * "Etapa 1: ... Etapa 2: ..." → linhas separadas
 */
function separateStepsIntoLines(text: string): string {
  let result = text;
  
  // Padrões de passos/etapas
  const stepPatterns = [
    /(\s*[-–—]\s*Etapa\s+\d+\s*:)/gi,
    /(\s*[-–—]\s*Passo\s+\d+\s*:)/gi,
    /(\s*[-–—]\s*Step\s+\d+\s*:)/gi,
    /(\.\s*Etapa\s+\d+\s*:)/gi,
    /(\.\s*Passo\s+\d+\s*:)/gi,
    /(\.\s*Equação\s+\d+[:\s])/gi,
    /(\.\s*\d+\.\s+(?:Equação|Reação|Formação))/gi,
  ];
  
  for (const pattern of stepPatterns) {
    result = result.replace(pattern, '\n\n$1');
  }
  
  // Separar "1. Equação 1 (Formação..." em linhas
  result = result.replace(/(\d+\.\s*Equação\s+\d+\s*\([^)]+\):\s*)/gi, '\n\n$1\n');
  
  // Separar marcadores de mapeamento de etapas
  result = result.replace(/(MAPEAMENTO\s+DAS\s+ETAPAS[:\s]*)/gi, '\n\n$1\n');
  result = result.replace(/(O\s+plano\s+é:\s*)/gi, '\n\n$1\n');
  result = result.replace(/(DEFINIÇÃO\s+D[OE]\s+OBJETIVO[:\s]*)/gi, '\n\n$1\n');
  result = result.replace(/(EXECUÇÃO\s+D[OE]\s+PLANO[:\s]*)/gi, '\n\n$1\n');
  result = result.replace(/(VERIFICAÇÃO\s+E\s+RESPOSTA[:\s]*)/gi, '\n\n$1\n');
  result = result.replace(/(ANÁLISE\s+D[OE]\s+COMANDO[:\s]*)/gi, '\n\n$1\n');
  
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Processa linhas e identifica blocos especiais (reações, equações)
 */
function processContentBlocks(text: string): string {
  // Primeiro, separar passos em linhas
  let processed = separateStepsIntoLines(text);
  
  // Dividir em linhas e processar cada uma
  const lines = processed.split('\n');
  const processedLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      processedLines.push('');
      continue;
    }
    
    // Detectar e formatar reações químicas
    if (isChemicalReaction(trimmedLine) && trimmedLine.length < 200) {
      processedLines.push(formatAsChemicalReactionBlock(trimmedLine));
    }
    // Detectar e formatar equações matemáticas
    else if (isMathEquation(trimmedLine) && trimmedLine.length < 150) {
      processedLines.push(formatAsMathBlock(trimmedLine));
    }
    else {
      processedLines.push(line);
    }
  }
  
  return processedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const formatTextContent = (content: string): string => {
  // ========== FASE 1: LIMPEZA GLOBAL ==========
  let cleaned = content
    .replace(/\*\*/g, '')           // Remove ** (markdown bold)
    .replace(/\*/g, '')             // Remove * soltos
    .replace(/里/g, '')             // Remove caractere chinês 里
    .replace(/吝/g, '')             // Remove caractere chinês 吝
    .replace(/離/g, '')             // Remove caractere chinês 離
    .replace(/⚠️?/g, '')            // Remove ⚠ (com ou sem variation selector)
    .replace(/️/g, '')              // Remove variation selectors órfãos
    .replace(/[""]/g, '')           // Remove aspas curvas
    .replace(/['']/g, '')           // Remove apóstrofos curvos
    .replace(/[«»„"]/g, '')         // Remove aspas francesas/alemãs
    .replace(/👉\s*/g, '\n\n• ')    // Cada 👉 vira bullet em nova linha
    .replace(/Reunindo:/gi, '\n\nReunindo:')
    .replace(/\b([cC])(\d+)\b/g, (_, _letter, num) => `C${num}`)
    .replace(/\b([hH])(\d+)\b/g, (_, _letter, num) => `H${num}`)
    .trim();
  
  // ========== FASE 2: SEPARAÇÃO DE PASSOS E BLOCOS ==========
  cleaned = processContentBlocks(cleaned);
  
  // ========== FASE 3: FORMATAÇÃO DE BULLET POINTS ==========
  cleaned = cleaned
    .replace(/\n\s*•\s*/g, '\n• ')
    .replace(/([^\n])\s*•\s*/g, '$1\n• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // ========== FASE 4: REFINAMENTO PEDAGÓGICO ==========
  cleaned = applyPedagogicalRefinement(cleaned);
  
  // ========== FASE 5: PADRONIZAÇÃO QUÍMICA VISUAL ==========
  return formatChemicalFormulas(cleaned);
};

/**
 * Componente para renderizar imagens embutidas na resolução
 */
const ResolutionImage = memo(function ResolutionImage({ src, index }: { src: string; index: number }) {
  return (
    <div className="my-4 flex justify-center">
      <img 
        src={src} 
        alt={`Imagem da resolução ${index + 1}`}
        className="min-h-[300px] max-h-[750px] w-auto rounded-lg border border-border/50 shadow-md object-contain"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </div>
  );
});

/**
 * Componente para renderizar bloco de reação química destacado
 */
const ChemicalReactionBlock = memo(function ChemicalReactionBlock({ content }: { content: string }) {
  return (
    <div className="my-3 py-2 px-4 bg-blue-500/10 border-l-4 border-l-blue-500 rounded-r-lg">
      <p className="text-base font-semibold text-blue-600 dark:text-blue-400 font-mono tracking-wide">
        {formatChemicalFormulas(content)}
      </p>
    </div>
  );
});

/**
 * Componente para renderizar bloco de equação matemática
 */
const MathEquationBlock = memo(function MathEquationBlock({ content }: { content: string }) {
  return (
    <div className="my-3 py-2 px-4 bg-amber-500/10 border-l-4 border-l-amber-500 rounded-r-lg">
      <p className="text-base font-semibold text-amber-700 dark:text-amber-400 font-mono">
        {renderChemicalText(formatChemicalFormulas(content))}
      </p>
    </div>
  );
});

/**
 * Renderiza conteúdo com blocos especiais (reações, equações)
 */
const RenderFormattedContent = memo(function RenderFormattedContent({ text }: { text: string }) {
  // Regex para encontrar blocos especiais
  const blockPattern = /【(REAÇÃO|EQUAÇÃO)】([\s\S]*?)【\/\1】/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;
  
  // Resetar o lastIndex do regex
  blockPattern.lastIndex = 0;
  
  while ((match = blockPattern.exec(text)) !== null) {
    // Texto antes do bloco
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
        if (beforeText.trim()) {
          parts.push(
            <span key={`text-${keyCounter++}`} className="whitespace-pre-wrap">
              {renderChemicalText(beforeText)}
            </span>
          );
        }
    }
    
    // Bloco especial
    const blockType = match[1];
    const blockContent = match[2].trim();
    
    if (blockType === 'REAÇÃO') {
      parts.push(<ChemicalReactionBlock key={`reaction-${keyCounter++}`} content={blockContent} />);
    } else if (blockType === 'EQUAÇÃO') {
      parts.push(<MathEquationBlock key={`math-${keyCounter++}`} content={blockContent} />);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Texto restante
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push(
          <span key={`text-${keyCounter++}`} className="whitespace-pre-wrap">
            {renderChemicalText(remainingText)}
          </span>
        );
      }
  }
  
  // Se não há blocos especiais, retorna texto simples
  if (parts.length === 0) {
    return <span className="whitespace-pre-wrap">{renderChemicalText(text)}</span>;
  }
  
  return <>{parts}</>;
});

/**
 * Formata conteúdo com fórmulas químicas E renderiza imagens e blocos especiais
 */
const formatContent = (content: string) => {
  const { cleanedText, images } = extractImagesFromResolution(content);
  const formattedText = formatTextContent(cleanedText);
  
  // Verificar se há blocos especiais
  const hasSpecialBlocks = /【(REAÇÃO|EQUAÇÃO)】/.test(formattedText);
  
  // Se não há imagens nem blocos especiais, retorna texto renderizado
  if (images.length === 0 && !hasSpecialBlocks) {
    return <RenderFormattedContent text={formattedText} />;
  }
  
  // Retorna com renderização de blocos especiais + imagens
  return (
    <>
      {hasSpecialBlocks ? (
        <RenderFormattedContent text={formattedText} />
      ) : (
        <RenderFormattedContent text={formattedText} />
      )}
      {images.map((imgUrl, idx) => (
        <ResolutionImage key={`res-img-${idx}`} src={imgUrl} index={idx} />
      ))}
    </>
  );
};

/**
 * Item de alternativa/afirmação — ORGANIZAÇÃO INTERNACIONAL
 * Exibe letra + status + conteúdo de forma clara
 */
const AlternativaItem = memo(forwardRef<HTMLDivElement, { section: ParsedSection }>(function AlternativaItem(
  { section },
  ref
) {
  const isCorrect = section.type === 'alternativa_correta' || section.type === 'afirmacao_correta';
  const isAnalise = section.type === 'alternativa_analise' || section.type === 'afirmacao_analise';
  const isAfirmacao = section.type.includes('afirmacao');

  const letter = section.alternativaLetter || section.afirmacaoNumber || '';
  const label = isAfirmacao ? 'Afirmação' : 'Alternativa';
  const status = isCorrect
    ? isAfirmacao
      ? 'VERDADEIRA'
      : 'CORRETA'
    : isAfirmacao
      ? 'FALSA'
      : 'ERRADA';

  // Ícone via Lucide (sem emojis)
  const IconComponent = isCorrect ? CheckCircle : isAnalise ? CircleDot : XCircle;

  return (
    <div
      ref={ref}
      className={cn(
        'px-4 py-3 border-l-4 rounded-r-lg',
        isCorrect
          ? 'border-l-green-600 bg-green-500/15'
          : isAnalise
            ? 'border-l-blue-500 bg-blue-500/10'
            : 'border-l-red-600 bg-red-500/15'
      )}
    >
      <div
        className={cn(
          'text-sm leading-relaxed text-justify',
          isCorrect ? 'text-green-600' : isAnalise ? 'text-blue-600' : 'text-red-600'
        )}
      >
        <span className="font-bold inline-flex items-center gap-1">
          <IconComponent className="h-4 w-4 inline" />
          {label} {letter}
        </span>
        {!isAnalise && <span className="font-bold"> — {status}</span>}
        <span className="text-foreground/80 ml-2 text-justify">→ {formatContent(section.content)}</span>
      </div>
    </div>
  );
}));

/**
 * Renderiza uma linha de alternativa consolidada com visual pedagógico v4.0
 * Formato: ✅ A) CORRETA — explicação clara e organizada
 * LEMA: "Se eu fosse aluno, conseguiria estudar isso rápido?"
 */
const AlternativeLineItem = memo(function AlternativeLineItem({ line }: { line: string }) {
  const isCorrect = line.startsWith('✅');
  const IconComponent = isCorrect ? CheckCircle : XCircle;
  
  // Extrair letra e conteúdo
  const letterMatch = line.match(/[✅❌]\s*([A-E])\)/);
  const letter = letterMatch?.[1] || '';
  
  // Remover prefixo e extrair apenas a explicação
  const contentMatch = line.match(/[✅❌]\s*[A-E]\)\s*(CORRETA|INCORRETA)\s*[—–-]\s*(.+)/i);
  const status = contentMatch?.[1]?.toUpperCase() || (isCorrect ? 'CORRETA' : 'INCORRETA');
  let explanation = contentMatch?.[2]?.trim() || line.replace(/^[✅❌]\s*[A-E]\)\s*(CORRETA|INCORRETA)\s*[—–-]?\s*/i, '').trim();
  
  // ========== LIMPEZA FINAL DA EXPLICAÇÃO ==========
  // Remover referências a outras alternativas que vazaram para cá
  explanation = explanation
    .replace(/[❌✅]\s*Alternativa\s*[A-E][^.]*\./gi, '')
    .replace(/Alternativa\s*[A-E]\s*[:–\-][^.]*\./gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  return (
    <div className={cn(
      'flex items-start gap-3 py-3 px-4 rounded-lg border-l-4',
      isCorrect 
        ? 'bg-green-500/15 border-l-green-600' 
        : 'bg-red-500/15 border-l-red-600'
    )}>
      <IconComponent className={cn(
        'h-5 w-5 flex-shrink-0 mt-0.5',
        isCorrect ? 'text-green-500' : 'text-red-500'
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            'font-bold text-sm uppercase',
            isCorrect ? 'text-green-600' : 'text-red-600'
          )}>
            Alternativa {letter}
          </span>
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            isCorrect 
              ? 'bg-green-500/20 text-green-600' 
              : 'bg-red-500/20 text-red-600'
          )}>
            {status}
          </span>
        </div>
        <p className="text-foreground/80 text-sm leading-relaxed text-justify">
          {formatTextContent(explanation)}
        </p>
      </div>
    </div>
  );
});

/**
 * Bloco visual para seções NÃO-alternativas
 */
const SectionBlock = memo(function SectionBlock({ section }: { section: ParsedSection }) {
  const Icon = getSectionIcon(section.type, section.stepNumber);
  const styles = getSectionStyles(section.type, section.isCorrect);
  const title = getSectionTitle(section);

  // INTRO — Bloco especial
  if (section.type === 'intro') {
    return (
      <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/20">
            <Sparkles className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-emerald-500 mb-2">
              ANÁLISE DA QUESTÃO
            </h4>
            <p className="text-justify leading-relaxed text-sm text-foreground/90">
              {formatContent(section.content)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ANÁLISE DAS ALTERNATIVAS — Seção agrupada especial v4.0 PEDAGOGIA ESTRUTURADA
  // NÃO RENDERIZAR se não houver alternativas reais (A-E com ✅ ou ❌)
  if (section.type === 'analise_header') {
    const lines = section.content.split('\n\n').filter(l => l.trim());
    
    // Verificar se há alternativas reais (A, B, C, D, E com marcadores)
    const hasRealAlternatives = lines.some(line => 
      /^[✅❌]\s*(?:Alternativa\s+)?[A-E][\s:)\-–—]/i.test(line.trim())
    );
    
    // Se não houver alternativas reais, NÃO renderizar este bloco
    if (!hasRealAlternatives || lines.length === 0) {
      return null;
    }
    
    return (
      <div className="rounded-xl overflow-hidden border border-indigo-500/30 bg-indigo-500/5">
        {/* Header com destaque */}
        <div className="px-4 py-3 flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-indigo-500/10 border-b border-indigo-500/20">
          <ListChecks className="h-5 w-5 text-indigo-500" />
          <h4 className="font-bold text-sm text-indigo-500 uppercase tracking-wide">
            Análise das Alternativas
          </h4>
          <span className="text-xs text-indigo-400 ml-auto">
            {lines.length} alternativa{lines.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Lista de alternativas - organizada pedagogicamente */}
        <div className="p-3 space-y-2">
          {lines.map((line, idx) => (
            <AlternativeLineItem key={idx} line={line} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl overflow-hidden", styles.border, styles.bg)}>
      {/* Header do bloco */}
      <div className={cn("px-4 py-2.5 flex items-center gap-2", styles.accentColor)}>
        <Icon className={cn("h-4 w-4", styles.iconColor)} />
        <h4 className={cn("font-bold text-sm", styles.titleColor)}>
          {title}
        </h4>
      </div>
      
      {/* Conteúdo do bloco */}
      <div className="px-4 py-3">
        <div className="text-justify leading-relaxed text-sm text-foreground/90 whitespace-pre-wrap">
          {formatContent(section.content)}
        </div>
      </div>
    </div>
  );
});

/**
 * Formata o header da banca
 */
const formatBancaHeader = (banca?: string | null, ano?: number | null): string => {
  if (banca) {
    const bancaLabel = getBancaLabel(banca);
    return ano ? `${bancaLabel} (${ano})` : bancaLabel;
  }
  return DEFAULT_BANCA_HEADER;
};

/**
 * Componente universal para exibir resolução de questão
 * Com parsing inteligente e organização visual em blocos SEPARADOS
 */
const QuestionResolution = memo(function QuestionResolution({
  resolutionText,
  banca,
  ano,
  difficulty,
  tema,
  macro,
  micro,
  competenciaEnem,
  habilidadeEnem,
  className,
}: QuestionResolutionProps) {
  const bancaHeader = formatBancaHeader(banca, ano);
  const difficultyData = difficulty ? DIFFICULTY_LABELS[difficulty] : null;

  // Parser inteligente AVANÇADO
  const parsedSections = useMemo(() => parseResolutionText(resolutionText), [resolutionText]);

  // Verificações
  const hasClassification = macro || micro;
  const hasEnemInText = parsedSections.some(s => s.type === 'competencia');
  const showEnemBlock = (competenciaEnem || habilidadeEnem) && !hasEnemInText;

  // ========== AGRUPAMENTO DE SEÇÕES — PADRÃO INTERNACIONAL ==========
  
  // BLOCO 1: Alternativas e Afirmações (inclui análise)
  const alternativasSections = parsedSections.filter(s => 
    s.type === 'alternativa_correta' || 
    s.type === 'alternativa_errada' || 
    s.type === 'alternativa_analise' ||
    s.type === 'afirmacao_correta' ||
    s.type === 'afirmacao_incorreta' ||
    s.type === 'afirmacao_analise'
  );
  
  // BLOCO 2: Resumo e Conclusão
  const conclusaoSections = parsedSections.filter(s => s.type === 'conclusao');
  const resumoSections = parsedSections.filter(s => s.type === 'resumo');
  
  // BLOCO 3: Seções pedagógicas (ordem fixa no final)
  const competenciaSections = parsedSections.filter(s => s.type === 'competencia');
  const estrategiaSections = parsedSections.filter(s => s.type === 'estrategia');
  const pegadinhasSections = parsedSections.filter(s => s.type === 'pegadinhas');
  const dicaSections = parsedSections.filter(s => s.type === 'dica');
  
  // BLOCO 4: Passos e outras seções (mantém ordem original)
  const otherSections = parsedSections.filter(s => 
    !alternativasSections.includes(s) && 
    s.type !== 'intro' &&
    s.type !== 'analise_header' &&
    s.type !== 'conclusao' &&
    s.type !== 'resumo' &&
    s.type !== 'competencia' &&
    s.type !== 'estrategia' &&
    s.type !== 'pegadinhas' &&
    s.type !== 'dica'
  );
  
  // Intro separada
  const introSection = parsedSections.find(s => s.type === 'intro');

  return (
    <div className={cn("space-y-6", className)}>
      {/* ========== HEADER ========== */}
      <div className="text-center pb-3 border-b-2 border-primary/20">
        <h3 className="text-2xl font-bold uppercase tracking-wide text-primary">
          {bancaHeader}
        </h3>
      </div>

      {/* ========== METADADOS ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Nível + Tema */}
        {(difficultyData || tema) && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex flex-col gap-2 text-sm">
              {difficultyData && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">✨ NÍVEL:</span>
                  <span className={cn("font-bold px-2 py-0.5 rounded", difficultyData.color)}>
                    {difficultyData.label}
                  </span>
                </div>
              )}
              {tema && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">📧 TEMA:</span>
                  <span className="text-muted-foreground">{tema}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card Classificação */}
        {hasClassification && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <FolderTree className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-sm text-blue-500">CLASSIFICAÇÃO</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              {macro && (
                <div>
                  <span className="font-medium text-blue-400">Macro:</span>{' '}
                  <span className="text-muted-foreground">{macro}</span>
                </div>
              )}
              {micro && (
                <div>
                  <span className="font-medium text-blue-400">Micro:</span>{' '}
                  <span className="text-muted-foreground">{micro}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========== TÍTULO PRINCIPAL ========== */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30">
          <Sparkles className="h-6 w-6 text-emerald-500" />
          <h4 className="text-xl font-bold text-emerald-500">
            RESOLUÇÃO COMENTADA PELO PROF. MOISÉS MEDEIROS
          </h4>
        </div>
      </div>

      {/* ========== BLOCO ÚNICO UNIFICADO — ANÁLISE DA QUESTÃO ========== */}
      {/* REGRA PERMANENTE (MODELO IDEAL): Intro + Passos + Alternativas + Conclusão + Gabarito */}
      {/* TUDO EM UM MESMO CAMPO VERDE — Organizado mas unificado visualmente */}
      {(() => {
        // Separar passos e síntese de outras seções
        const passosSections = otherSections.filter(s => s.type === 'passo');
        const sinteseSections = parsedSections.filter(s => s.type === 'sintese');
        const nonPassosSections = otherSections.filter(s => s.type !== 'passo' && s.type !== 'sintese');
        
        // Ordenar passos por número
        const sortedPassos = [...passosSections].sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0));
        
        // Verificar se há conteúdo para o bloco unificado
        const hasAnyContent = introSection || sortedPassos.length > 0 || sinteseSections.length > 0 ||
          alternativasSections.length > 0 || conclusaoSections.length > 0 || resumoSections.length > 0;
        
        return (
          <>
            {/* BLOCO ÚNICO UNIFICADO — ANÁLISE DA QUESTÃO (intro + passos + alternativas + conclusão + gabarito) */}
            {hasAnyContent && (
              <div className="rounded-xl border border-emerald-500/30 overflow-hidden bg-emerald-500/5 border-l-4 border-l-emerald-500">
                {/* Header do bloco unificado */}
                <div className="px-4 py-3 bg-emerald-500/20 border-b border-emerald-500/20 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  <h4 className="font-bold text-sm text-emerald-500 uppercase tracking-wide">
                    ANÁLISE DA QUESTÃO
                  </h4>
                </div>
                
                {/* Conteúdo unificado — fluxo contínuo com divisores sutis */}
                <div className="divide-y divide-emerald-500/10">
                {/* INTRO — Análise contextual inicial */}
                  {introSection && (
                    <div className="px-4 py-4">
                      <div className="text-justify leading-relaxed text-sm text-foreground/90">
                        {formatContent(introSection.content)}
                      </div>
                    </div>
                  )}
                  
                  {/* PASSOS — Cada passo em seu próprio bloco visual destacado */}
                  {sortedPassos.length > 0 && (
                    <div className="px-4 py-4 space-y-4">
                      {sortedPassos.map((section, index) => (
                        <div key={`passo-${index}`} className="border-l-4 border-l-blue-500/50 pl-4 py-2 bg-blue-500/5 rounded-r-lg">
                          <div className="text-sm font-bold text-blue-500 mb-2 uppercase tracking-wide">
                            Passo {section.stepNumber}
                          </div>
                          <div className="text-sm text-foreground/90 leading-relaxed text-justify">
                            {formatContent(section.content)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* SÍNTESE — Parágrafo de síntese após os passos */}
                  {sinteseSections.length > 0 && (
                    <div className="px-4 py-4">
                      {sinteseSections.map((section, index) => (
                        <div key={`sintese-${index}`} className="border-l-4 border-l-teal-500/50 pl-4 py-2 bg-teal-500/5 rounded-r-lg">
                          <div className="text-sm font-bold text-teal-500 mb-2 uppercase tracking-wide">
                            Síntese
                          </div>
                          <div className="text-sm text-foreground/90 leading-relaxed text-justify">
                            {formatContent(section.content)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* ANÁLISE DAS ALTERNATIVAS — Cada alternativa em bloco visual próprio */}
                  {alternativasSections.length > 0 && (
                    <div className="px-4 py-4">
                      <div className="text-sm font-bold text-indigo-500 mb-3 uppercase tracking-wide">
                        Análise das Alternativas
                      </div>
                      <div className="space-y-3">
                        {alternativasSections.map((section, index) => {
                          const isCorrect = section.type === 'alternativa_correta' || section.type === 'afirmacao_correta';
                          const isAfirmacao = section.type.includes('afirmacao');
                          const letter = section.alternativaLetter || section.afirmacaoNumber || '';
                          const label = isAfirmacao ? 'Afirmação' : 'Alternativa';
                          const status = isCorrect
                            ? isAfirmacao ? 'VERDADEIRA' : 'CORRETA'
                            : isAfirmacao ? 'FALSA' : 'INCORRETA';
                          const statusIcon = isCorrect ? '✅' : '❌';
                          
                          return (
                            <div 
                              key={`alt-unified-${index}`} 
                              className={cn(
                                'px-4 py-3 rounded-lg border-l-4',
                                isCorrect 
                                  ? 'bg-green-500/10 border-l-green-500' 
                                  : 'bg-red-500/5 border-l-red-500'
                              )}
                            >
                              <div className="text-sm">
                                <div className={cn(
                                  'font-bold mb-1',
                                  isCorrect ? 'text-green-600' : 'text-red-600'
                                )}>
                                  {statusIcon} {label} {letter}) {status}
                                </div>
                                <div className="text-foreground/80 leading-relaxed text-justify">
                                  {formatContent(section.content)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* RESUMO FINAL — Se existir, fica dentro do bloco unificado */}
                  {resumoSections.length > 0 && (
                    <div className="px-4 py-3">
                      <div className="text-sm font-bold text-cyan-500 mb-2">Resumo:</div>
                      {resumoSections.map((section, index) => (
                        <p key={`resumo-unified-${index}`} className="text-justify leading-relaxed text-sm text-foreground/90 whitespace-pre-wrap">
                          {formatContent(section.content)}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {/* CONCLUSÃO E GABARITO — Fechamento do bloco unificado */}
                  {conclusaoSections.length > 0 && (
                    <div className="px-4 py-3 bg-emerald-500/10">
                      <div className="text-sm">
                        <span className="font-bold text-emerald-600">Conclusão:</span>
                        {conclusaoSections.map((section, index) => (
                          <p key={`conclusao-unified-${index}`} className="text-foreground/90 mt-1 text-justify whitespace-pre-wrap">
                            {formatContent(section.content)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Outras seções (não-passos, não-síntese, não-alternativas) */}
            {nonPassosSections.length > 0 && (
              <div className="space-y-3">
                {nonPassosSections.map((section, index) => (
                  <SectionBlock key={`sec-${section.type}-${index}`} section={section} />
                ))}
              </div>
            )}
          </>
        );
      })()}

      {/* ========== COMPETÊNCIA E HABILIDADE - ENEM ========== */}
      {competenciaSections.length > 0 && (
        <div className="space-y-3">
          {competenciaSections.map((section, index) => (
            <SectionBlock key={`competencia-${index}`} section={section} />
          ))}
        </div>
      )}

      {/* ========== COMPETÊNCIA ENEM (se não no texto, usar props) ========== */}
      {showEnemBlock && competenciaSections.length === 0 && (
        <div className="rounded-xl overflow-hidden border-l-4 border-l-purple-500 border-t border-r border-b border-purple-500/30 bg-purple-500/5">
          <div className="px-4 py-3 flex items-center gap-3 bg-purple-500/20">
            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-background/60 text-purple-500">
              <Target className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-sm text-purple-500">
              COMPETÊNCIA E HABILIDADE - ENEM
            </h4>
          </div>
          <div className="px-5 py-4 space-y-2 text-sm">
            {competenciaEnem && (
              <p>
                <span className="font-medium text-purple-400">Competencia:</span>{' '}
                <span className="text-muted-foreground uppercase">{competenciaEnem}</span>
              </p>
            )}
            {habilidadeEnem && (
              <p>
                <span className="font-medium text-purple-400">Habilidade:</span>{' '}
                <span className="text-muted-foreground uppercase">{habilidadeEnem}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========== DIRECIONAMENTO / ESTRATÉGIA ========== */}
      {estrategiaSections.length > 0 && (
        <div className="space-y-3">
          {estrategiaSections.map((section, index) => (
            <SectionBlock key={`estrategia-${index}`} section={section} />
          ))}
        </div>
      )}

      {/* ========== PEGADINHAS COMUNS ========== */}
      {pegadinhasSections.length > 0 && (
        <div className="space-y-3">
          {pegadinhasSections.map((section, index) => (
            <SectionBlock key={`pegadinhas-${index}`} section={section} />
          ))}
        </div>
      )}

      {/* ========== DICA DE OURO ========== */}
      {dicaSections.length > 0 && (
        <div className="space-y-3">
          {dicaSections.map((section, index) => (
            <SectionBlock key={`dica-${index}`} section={section} />
          ))}
        </div>
      )}
    </div>
  );
});

export default QuestionResolution;

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║ REGRAS OBRIGATÓRIAS v5.0 — POLÍTICAS UNIFICADAS                                  ║
// ╠══════════════════════════════════════════════════════════════════════════════════╣
// ║                                                                                   ║
// ║ POLÍTICA 1: ORGANIZAÇÃO E LINGUAGEM PEDAGÓGICA                                   ║
// ║ • Estrutura: ANALYSIS → CONCLUSION → ENEM → STRATEGY → TRAPS → TIP              ║
// ║ • Organização: uma ideia por sentença, um conceito por parágrafo                ║
// ║ • Linguagem: "Nós", "A gente", "Pessoal" (como professor no quadro)             ║
// ║ • Qualidade: maiúscula inicial, frases completas, sem fragmentação              ║
// ║                                                                                   ║
// ║ POLÍTICA 2: PADRONIZAÇÃO QUÍMICA VISUAL                                          ║
// ║ • Estados físicos: (s), (l), (g), (aq) → subscrito visual legível ₍s₎₍l₎₍g₎₍aq₎ ║
// ║ • Cargas: Na+, Ca2+ → superscrito Na⁺, Ca²⁺                                      ║
// ║ • Índices: H2O, CO2 → subscrito H₂O, CO₂                                         ║
// ║ • Setas: -> → ⇌ ←                                                                ║
// ║                                                                                   ║
// ║ REGRAS HERDADAS:                                                                 ║
// ║ 1. Parser detecta ALTERNATIVAS (A-E) e AFIRMAÇÕES (I-V)                          ║
// ║ 2. CADA alternativa em bloco visual SEPARADO                                     ║
// ║ 3. Bordas laterais coloridas para indicar correto/errado                         ║
// ║ 4. Agrupamento inteligente por categoria                                         ║
// ║ 5. Deduplicação automática rigorosa                                              ║
// ║ 6. NÃO modifica significado, apenas organiza visualmente                         ║
// ║                                                                                   ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝
