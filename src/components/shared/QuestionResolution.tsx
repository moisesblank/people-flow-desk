// ============================================
// 📚 QUESTION RESOLUTION — COMPONENTE UNIVERSAL
// PADRÃO INTERNACIONAL DE ORGANIZAÇÃO v3.0
// 
// ESTRUTURA VISUAL ORGANIZADA EM BLOCOS:
// - Parser inteligente detecta seções e alternativas
// - CADA alternativa em seu bloco visual individual
// - Separação clara entre seções
// - Deduplicação automática de seções repetidas
// - Limpeza de formatação inconsistente
// ============================================

import { memo, useMemo, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { formatChemicalFormulas } from '@/lib/chemicalFormatter';
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
 * LIMPEZA AVANÇADA DE TEXTO — PADRÃO INTERNACIONAL
 * Remove metadados, HTML, duplicatas, ruído visual
 * =====================================================
 */
/**
 * =====================================================
 * PRÉ-PROCESSAMENTO DE AFIRMAÇÕES CORRIDAS
 * Separa afirmações que vêm todas na mesma linha em blocos individuais
 * PADRÃO ENEM/INTERNACIONAL: cada afirmação em seu próprio bloco
 * =====================================================
 */
function reformatAffirmations(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // ========== DETECTAR E SEPARAR AFIRMAÇÕES CORRIDAS ==========
  // Padrão: "Afirmação 1: FALSA (F) - texto Afirmação 2: VERDADEIRA (V) - texto..."
  // Também captura: "Afirmação 1 — FALSA", "Afirmação I:", etc.
  
  // Regex para detectar início de afirmação (com número arábico ou romano)
  const afirmacaoPattern = /Afirmação\s*(\d+|[IVX]+)\s*[:\-–—]\s*(?:(FALSA|VERDADEIRA|F|V)\s*\([FV]\)\s*)?[:\-–—]?\s*/gi;
  
  // Primeiro, verificar se existem múltiplas afirmações na mesma linha
  const matches = [...result.matchAll(new RegExp(afirmacaoPattern.source, 'gi'))];
  
  if (matches.length > 1) {
    // Há múltiplas afirmações - precisamos separar cada uma em sua própria linha
    let reformatted = '';
    
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const nextMatch = matches[i + 1];
      
      const startIndex = currentMatch.index!;
      const endIndex = nextMatch ? nextMatch.index! : result.length;
      
      // Extrair o bloco desta afirmação
      let block = result.substring(startIndex, endIndex).trim();
      
      // Adicionar quebra dupla antes de cada afirmação (exceto a primeira)
      if (i > 0) {
        reformatted += '\n\n';
      }
      
      reformatted += block;
    }
    
    // Adicionar qualquer texto antes da primeira afirmação
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
  // Garantir que "FALSA (F)" ou "VERDADEIRA (V)" fique destacado
  result = result
    // Padrão: "Afirmação 1: FALSA (F) - texto" → quebra após o status
    .replace(/Afirmação\s*(\d+|[IVX]+)\s*[:\-–—]\s*(FALSA|VERDADEIRA)\s*\(([FV])\)\s*[:\-–—]?\s*/gi, 
      (_, num, status, letter) => `\n\nAfirmação ${num} — ${status.toUpperCase()} (${letter.toUpperCase()}):\n`)
    // Padrão simples: "Afirmação 1 - texto" sem status
    .replace(/Afirmação\s*(\d+|[IVX]+)\s*[:\-–—]\s*(?!FALSA|VERDADEIRA|[FV]\s*\()/gi, 
      (_, num) => `\n\nAfirmação ${num}:\n`)
    // Limpar quebras excessivas
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // ========== SEPARAR SÍNTESE DA SEQUÊNCIA FINAL ==========
  // Detectar padrões de conclusão/síntese e garantir que fiquem em bloco separado
  const sequenciaPatterns = [
    /A\s+sequência\s+correta\s+é[:\s]*/gi,
    /Sequência\s+correta[:\s]*/gi,
    /A\s+alternativa\s+correta\s+é/gi,
    /correspondente\s+à\s+alternativa/gi,
  ];
  
  for (const pattern of sequenciaPatterns) {
    result = result.replace(pattern, (match) => `\n\n${match}`);
  }
  
  // Garantir que padrões "F – V – V – F" fiquem em linha própria se no final
  result = result.replace(/([^\n])(\s+[FV]\s*[–\-]\s*[FV]\s*[–\-]\s*[FV]\s*[–\-]\s*[FV])(\s*,?\s*correspondente)?/gi, 
    '$1\n\n$2$3');
  
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

function cleanResolutionText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // ========== REMOÇÃO GLOBAL DE CARACTERES INDESEJADOS ==========
  // REGRA PERMANENTE: remover **, 里, ⚠, "", '' de TODO o texto
  cleaned = cleaned
    .replace(/\*\*/g, '')           // Remove ** (markdown bold)
    .replace(/里/g, '')             // Remove caractere chinês 里
    .replace(/⚠️?/g, '')            // Remove ⚠ (com ou sem variation selector)
    .replace(/\*/g, '')             // Remove * soltos
    .replace(/吝/g, '')             // Remove outro caractere chinês
    .replace(/離/g, '')             // Remove caractere chinês 離
    .replace(/️/g, '')              // Remove variation selectors órfãos
    .replace(/[""]/g, '')           // Remove aspas curvas (curly quotes)
    .replace(/['']/g, '')           // Remove apóstrofos curvos
    .replace(/[«»]/g, '')           // Remove aspas francesas
    .replace(/[„"]/g, '')           // Remove aspas alemãs
    .trim();
  
  // ========== PRÉ-PROCESSAMENTO: SEPARAR AFIRMAÇÕES CORRIDAS ==========
  // REGRA INTERNACIONAL: cada afirmação em seu próprio bloco, nunca corrido
  cleaned = reformatAffirmations(cleaned);
  
  // PASSO 1: Remover lixo de HTML/interface
  const contentStartPatterns = [
    /QUESTÃO\s+SIMULADO/i,
    /🔬\s*RESOLUÇÃO/i,
    /✨\s*QUESTÃO/i,
    /PASSO\s*1/i,
    /O\s+gráfico/i,
    /Observando/i,
    /Analis/i,
    /A\s+questão/i,
    /Meus\s+queridos/i,
    /Queridos/i,
    /Vamos\s+analisar/i,
    /E\s+a[ií],?\s+galera/i,
  ];
  
  for (const pattern of contentStartPatterns) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined && match.index > 0) {
      cleaned = cleaned.substring(match.index);
      break;
    }
  }
  
  // PASSO 2: Limpar metadados HTML
  cleaned = cleaned
    .replace(/\*\]:[^"]*"[^>]*>/g, '')
    .replace(/\*\]:pointer-events[^"]*"[^>]*>/g, '')
    .replace(/\*\][^"]*scroll-mt[^"]*"[^>]*>/g, '')
    .replace(/dir="auto"[^>]*>/g, '')
    .replace(/tabindex="-?\d+"[^>]*>/g, '')
    .replace(/data-[a-z-]+="[^"]*"/gi, '')
    .replace(/\*\]:[^\s]+/g, '')
    .trim();
  
  // PASSO 3: Remover duplicatas de header no corpo do texto
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
  
  // PASSO 4: Normalizar separadores visuais e pontuação
  cleaned = cleaned
    .replace(/---+/g, '\n')
    .replace(/___+/g, '\n')
    .replace(/\.{2,}/g, '.')              // Remove pontos duplos (..) → (.)
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
  
  // PASSO 5: Formatar bullet points com espaçamento REDUZIDO
  // REGRA: Cada • deve ter apenas UMA quebra de linha para legibilidade
  cleaned = cleaned
    .replace(/\n\s*•\s*/g, '\n• ')             // Bullets já em linha própria - UMA quebra
    .replace(/([^\n])\s*•\s*/g, '$1\n• ')     // Bullets no meio do texto - UMA quebra
    .replace(/\n{3,}/g, '\n\n')               // Remove quebras excessivas
    .trim();
  
  return cleaned;
}

/**
 * =====================================================
 * NORMALIZA TEXTO DE ALTERNATIVA/AFIRMAÇÃO
 * Remove marcadores redundantes, deixa só o conteúdo
 * =====================================================
 */
function normalizeAlternativeContent(content: string): string {
  let normalized = content
    // Limpeza global de caracteres indesejados
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/里/g, '')
    .replace(/吝/g, '')
    .replace(/離/g, '')
    .replace(/⚠️?/g, '')
    .replace(/️/g, '')
    .replace(/[""]/g, '')           // Remove aspas curvas
    .replace(/['']/g, '')           // Remove apóstrofos curvos
    .replace(/[«»„"]/g, '')         // Remove aspas francesas/alemãs
    // Remove prefixos de marcador
    .replace(/^Esta\s+alternativa\s+está\s+(in)?correta\.?\s*/gi, '')
    .replace(/^Esta\s+é\s+a\s+alternativa\s+CORRETA!?\s*/gi, '')
    .replace(/^(in)?correta\.?\s*/gi, '')
    .replace(/^\.+\s*/g, '')
    .replace(/^[.…]+\s*/g, '')
    // Limpa emojis redundantes do início
    .replace(/^[🔵🔹▪️•❌✅✓✗✔️✖️]\s*/g, '')
    .trim();
  
  // FORMATAÇÃO DE BULLET POINTS: Cada • em sua própria linha (espaçamento reduzido)
  normalized = normalized
    .replace(/\n\s*•\s*/g, '\n• ')             // Bullets já em linha própria - UMA quebra
    .replace(/([^\n])\s*•\s*/g, '$1\n• ')     // Bullets no meio do texto - UMA quebra
    .replace(/\n{3,}/g, '\n\n')               // Remove quebras excessivas
    .trim();
  
  return normalized;
}

/**
 * =====================================================
 * PARSER INTELIGENTE v3.0 — PADRÃO INTERNACIONAL
 * Detecta, organiza, deduplica e formata seções
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

    // ALTERNATIVAS (A-E)
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

  // Reinserção ordenada: PASSOS (1..n), ALTERNATIVAS (A-E), AFIRMAÇÕES (1..n), RESUMO, CONCLUSÃO
  const orderedStepNumbers = Array.from(seenPassos.keys()).sort((a, b) => a - b);
  for (const n of orderedStepNumbers) {
    const step = seenPassos.get(n);
    if (step) deduplicatedSections.push(step);
  }

  const orderedLetters = ['A', 'B', 'C', 'D', 'E'];
  for (const letter of orderedLetters) {
    const alt = seenAlternatives.get(letter);
    if (alt) deduplicatedSections.push(alt);
  }

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
  const mergableTypes: SectionType[] = ['pegadinhas', 'dica', 'estrategia', 'competencia', 'sintese'];
  
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
  
  for (const [type, sectionsOfType] of mergeableByType.entries()) {
    if (sectionsOfType.length === 0) continue;
    
    const allContents: string[] = [];
    
    for (const section of sectionsOfType) {
      let content = section.content
        .replace(/^[•\-\s]+/gm, '')
        .replace(/PEGADINHAS?\s*(COMUNS?)?:?\s*/gi, '')
        .replace(/DICA\s*DE\s*OURO:?\s*/gi, '')
        .replace(/DIRECIONAMENTO\s*[\/|]?\s*ESTRATÉGIA:?\s*/gi, '')
        .replace(/ESTRATÉGIA:?\s*/gi, '')
        .replace(/COMPETÊNCIAS?\s*E\s*HABILIDADES?\s*[-–]?\s*ENEM:?\s*/gi, '')
        .replace(/\*\*Gabarito:[^\*]+\*\*/gi, '')
        .replace(/---+/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      if (content) {
        const items = content.split(/\n+/).filter(item => item.trim());
        
        for (const item of items) {
          const normalizedItem = item.replace(/^[•\-\s]+/, '').trim();
          const normalized = normalizedItem.toLowerCase().replace(/[^\w\s]/g, '').trim();
          
          const isDuplicate = allContents.some(existing => {
            const existingNormalized = existing.toLowerCase().replace(/[^\w\s]/g, '').trim();
            return existingNormalized === normalized || 
                   existingNormalized.includes(normalized) ||
                   normalized.includes(existingNormalized);
          });
          
          if (!isDuplicate && normalizedItem.length > 10) {
            allContents.push(normalizedItem);
          }
        }
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
  
  // Adicionar mergeáveis consolidados no final (ordem: sintese > competencia > estrategia > pegadinhas > dica)
  const mergeOrder: SectionType[] = ['sintese', 'competencia', 'estrategia', 'pegadinhas', 'dica'];
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
 * Formata conteúdo com fórmulas químicas (sem imagens)
 */
const formatTextContent = (content: string): string => {
  // Limpeza global de caracteres indesejados antes de qualquer formatação
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
    .replace(/👉\s*/g, '\n\n• ')    // Cada 👉 vira bullet em nova linha com espaço
    .replace(/Reunindo:/gi, '\n\nReunindo:')
    // NORMALIZAÇÃO ENEM: C1-C7 e H1-H30 sempre em MAIÚSCULAS
    .replace(/\b([cC])(\d+)\b/g, (_, letter, num) => `C${num}`)
    .replace(/\b([hH])(\d+)\b/g, (_, letter, num) => `H${num}`)
    .trim();
  
  // ========== FORMATAÇÃO DE BULLET POINTS ==========
  // REGRA: Cada bullet point (•) deve ter uma quebra de linha antes para legibilidade
  // Substitui "• " no meio do texto por "\n\n• " para criar espaçamento visual
  cleaned = cleaned
    // Primeiro normaliza bullets que já estão no início de linha (evita duplicar quebras)
    .replace(/\n\s*•\s*/g, '\n\n• ')
    // Depois adiciona quebra antes de bullets no meio do texto
    .replace(/([^\n])\s*•\s*/g, '$1\n\n• ')
    // Remove quebras excessivas (mais de 2)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
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
        className="max-h-[600px] w-auto rounded-lg border border-border/50 shadow-md object-contain"
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
 * Formata conteúdo com fórmulas químicas E renderiza imagens
 */
const formatContent = (content: string) => {
  const { cleanedText, images } = extractImagesFromResolution(content);
  const formattedText = formatTextContent(cleanedText);
  
  // Se não há imagens, retorna só o texto formatado
  if (images.length === 0) {
    return formattedText;
  }
  
  // Retorna texto + imagens
  return (
    <>
      {formattedText}
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
        'px-4 py-3 border-l-4',
        isCorrect
          ? 'border-l-green-500 bg-green-500/5'
          : isAnalise
            ? 'border-l-blue-500 bg-blue-500/5'
            : 'border-l-red-500 bg-red-500/5'
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

      {/* ========== INTRO (ANÁLISE) ========== */}
      {introSection && (
        <SectionBlock section={introSection} />
      )}

      {/* ========== PASSOS — BLOCO UNIFICADO AZUL ========== */}
      {(() => {
        // Separar passos de outras seções
        const passosSections = otherSections.filter(s => s.type === 'passo');
        const nonPassosSections = otherSections.filter(s => s.type !== 'passo');
        
        // Ordenar passos por número
        const sortedPassos = [...passosSections].sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0));
        
        return (
          <>
            {/* PASSOS em área azul unificada */}
            {sortedPassos.length > 0 && (
              <div className="rounded-xl border border-blue-500/30 overflow-hidden bg-blue-500/5 border-l-4 border-l-blue-500">
                {/* Header único */}
                <div className="px-4 py-3 bg-blue-500/20 border-b border-blue-500/20 flex items-center gap-2">
                  <Cog className="h-4 w-4 text-blue-500" />
                  <h4 className="font-bold text-sm text-blue-500 uppercase tracking-wide">
                    PASSOS DA RESOLUÇÃO
                  </h4>
                </div>
                {/* Passos como tópicos dentro do bloco */}
                <div className="divide-y divide-blue-500/20">
                  {sortedPassos.map((section, index) => (
                    <div key={`passo-${index}`} className="px-4 py-3">
                      <div className="text-sm text-justify">
                        <span className="font-bold text-blue-500">
                          PASSO {section.stepNumber}
                        </span>
                        <span className="text-foreground/90 ml-2 text-justify">
                          {formatContent(section.content)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Outras seções (não-passos) */}
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

      {/* ========== ALTERNATIVAS / AFIRMAÇÕES — BLOCO ÚNICO ========== */}
      {alternativasSections.length > 0 && (
        <div className="rounded-xl border border-border/50 overflow-hidden bg-muted/10">
          {/* Header do bloco de alternativas */}
          <div className="px-4 py-3 bg-muted/30 border-b border-border/30 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-sm text-primary uppercase tracking-wide">
              Análise das Alternativas
            </h4>
          </div>

          {/* Alternativas como tópicos dentro do bloco */}
          <div className="divide-y divide-border/30">
            {alternativasSections.map((section, index) => (
              <AlternativaItem key={`alt-${section.type}-${index}`} section={section} />
            ))}
          </div>
        </div>
      )}

      {/* ========== RESUMO FINAL — BLOCO ÚNICO ========== */}
      {resumoSections.length > 0 && (
        <div className="rounded-xl border border-cyan-500/30 overflow-hidden bg-cyan-500/5 border-l-4 border-l-cyan-500">
          {/* Header */}
          <div className="px-4 py-3 bg-cyan-500/20 border-b border-cyan-500/20 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-cyan-500" />
            <h4 className="font-bold text-sm text-cyan-500 uppercase tracking-wide">
              RESUMO FINAL
            </h4>
          </div>
          {/* Conteúdos agrupados */}
          <div className="divide-y divide-cyan-500/20">
            {resumoSections.map((section, index) => (
              <div key={`resumo-${index}`} className="px-4 py-3">
                <p className="text-justify leading-relaxed text-sm text-foreground/90">
                  {formatContent(section.content)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== CONCLUSÃO E GABARITO — BLOCO ÚNICO ========== */}
      {conclusaoSections.length > 0 && (
        <div className="rounded-xl border border-emerald-500/30 overflow-hidden bg-emerald-500/10 border-l-4 border-l-emerald-500">
          {/* Header */}
          <div className="px-4 py-3 bg-emerald-500/20 border-b border-emerald-500/20 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <h4 className="font-bold text-sm text-emerald-500 uppercase tracking-wide">
              CONCLUSÃO E GABARITO
            </h4>
          </div>
          {/* Conteúdos agrupados */}
          <div className="divide-y divide-emerald-500/20">
            {conclusaoSections.map((section, index) => (
              <div key={`conclusao-${index}`} className="px-4 py-3">
                <p className="text-justify leading-relaxed text-sm text-foreground/90">
                  {formatContent(section.content)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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

// ============================================
// REGRAS OBRIGATÓRIAS v2.0:
// 1. Parser detecta ALTERNATIVAS (A-E) e AFIRMAÇÕES (I-V)
// 2. CADA alternativa em bloco visual SEPARADO
// 3. Bordas laterais coloridas para indicar correto/errado
// 4. Agrupamento inteligente por categoria
// 5. NÃO modifica conteúdo, apenas organiza visualmente
// ============================================
