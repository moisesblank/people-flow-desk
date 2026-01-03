/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║   NORMALIZADOR DE ESTRUTURA DE QUESTÃO v2.0                                  ║
 * ║   Question Structure Normalizer                                              ║
 * ║                                                                              ║
 * ║   LEI PERMANENTE: Aplica as regras constitucionais de estrutura:             ║
 * ║   - ENUNCIADO: texto corrido, sem enumeração solta                           ║
 * ║   - AFIRMATIVAS: reorganizadas internamente                                  ║
 * ║   - ALTERNATIVAS: cada uma em sua própria linha                              ║
 * ║   - BLOCOS AUXILIARES: organização estrutural sem alteração de conteúdo      ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// SÍMBOLOS E PADRÕES PARA LIMPEZA
// ═══════════════════════════════════════════════════════════════════════════

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu;
const NUMBERED_LIST_REGEX = /^\s*(\d+[\.\)\-–]|\•|\-\s|\–\s|\*\s)/gm;

/**
 * Remove emojis e símbolos decorativos do texto
 */
function removeEmojisAndSymbols(text: string): string {
  if (!text) return '';
  return text
    .replace(EMOJI_REGEX, '')
    .replace(/[★☆✓✗✔✘●○◆◇▶►▷▸◀◁◂◃⚡⚙️🔧🔨🛠️]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Remove numeração visual de listas
 */
function removeListNumbering(text: string): string {
  if (!text) return '';
  return text
    .replace(NUMBERED_LIST_REGEX, '')
    .replace(/^\s*[\-–—•·»«]+\s*/gm, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Transforma lista em texto corrido contínuo
 */
function listToContinuousText(text: string): string {
  if (!text) return '';
  
  // Remover numeração e bullets
  let cleaned = removeListNumbering(text);
  
  // Juntar linhas em texto corrido
  cleaned = cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1️⃣ NORMALIZAÇÃO DE ALTERNATIVAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normaliza alternativas para formato obrigatório (cada uma em sua linha)
 * REGRA: PROIBIDO alternativas coladas ou em sequência contínua
 */
export function normalizeAlternatives(options: string[] | { [key: string]: string } | null): string[] {
  if (!options) return [];
  
  // Se já é array, limpar cada item
  if (Array.isArray(options)) {
    return options.map((opt, idx) => {
      const letter = String.fromCharCode(65 + idx); // A, B, C, D, E
      let text = opt.trim();
      
      // Remover prefixos duplicados como "A) A)" ou "A - A)"
      text = text.replace(/^[A-E][\)\.\-\s]+/i, '').trim();
      
      return `${letter}) ${text}`;
    });
  }
  
  // Se é objeto, converter para array
  if (typeof options === 'object') {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    return letters
      .filter(l => options[l] || options[l.toLowerCase()])
      .map(l => {
        const text = (options[l] || options[l.toLowerCase()] || '').trim();
        return `${l}) ${text}`;
      });
  }
  
  return [];
}

/**
 * Separa alternativas que estão coladas em um único texto
 * REGRA: Detecta padrões como "A) texto B) texto C) texto" e separa
 */
export function splitConcatenatedAlternatives(text: string): string[] {
  if (!text) return [];
  
  // Padrão: A) texto B) texto C) texto D) texto E) texto
  const pattern = /([A-E])\s*[\)\.\-]\s*([^A-E]*?)(?=\s*[A-E]\s*[\)\.\-]|$)/gi;
  const matches = [...text.matchAll(pattern)];
  
  if (matches.length >= 2) {
    return matches.map(match => {
      const letter = match[1].toUpperCase();
      const content = match[2].trim();
      return `${letter}) ${content}`;
    });
  }
  
  return [text];
}

// ═══════════════════════════════════════════════════════════════════════════
// 2️⃣ NORMALIZAÇÃO DE ENUNCIADO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normaliza enunciado para texto corrido
 * REGRA: Converter enumerações soltas (I, II, III) em texto coeso
 */
export function normalizeEnunciado(text: string): string {
  if (!text) return '';
  
  let normalized = text;
  
  // 1. Remover padrões proibidos: "Analise as afirmativas I, II e III..."
  const forbiddenIntros = [
    /Analise\s+as?\s+afirmativas?\s+[IVX,\s]+(?:e\s+[IVX]+)?\.?\s*/gi,
    /Considere\s+as?\s+proposições?\s+[IVX,\s]+(?:e\s+[IVX]+)?\.?\s*/gi,
    /Verifique\s+os?\s+itens?\s+[IVX,\s]+(?:e\s+[IVX]+)?\.?\s*/gi,
    /Julgue\s+os?\s+itens?\s+[IVX,\s]+(?:e\s+[IVX]+)?\.?\s*/gi,
    /Observe\s+as?\s+afirmativas?\s+[IVX,\s]+(?:e\s+[IVX]+)?\.?\s*/gi,
  ];
  
  for (const pattern of forbiddenIntros) {
    normalized = normalized.replace(pattern, '');
  }
  
  // 2. Organizar listas de itens (I - ..., II - ...) em linhas separadas
  // Detectar padrões como "I - texto" ou "I. texto" ou "I) texto"
  const affirmativePattern = /^([IVX]+)\s*[\.\)\-–—]\s*/gm;

  // Se itens romanizados aparecerem no meio de uma linha, quebrar para nova linha
  // Ex: "... fenilalanina. II. ..." -> "... fenilalanina.\nII. ..."
  normalized = normalized.replace(
    /(\S)\s+(?=([IVX]+)\s*[\.\)\-–—]\s+)/g,
    "$1\n"
  );

  // Se há afirmativas numeradas, garantir 1 item por linha (com prefixo)
  if (affirmativePattern.test(normalized)) {
    const lines = normalized.split('\n');
    const processedLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(/^([IVX]+)\s*[\.\)\-–—]\s*(.*)$/);
      if (match) {
        const roman = (match[1] || '').toUpperCase();
        const contentRaw = (match[2] || '').trim();
        if (contentRaw) {
          const content = contentRaw.endsWith('.') || contentRaw.endsWith('?') || contentRaw.endsWith('!')
            ? contentRaw
            : `${contentRaw}.`;
          processedLines.push(`${roman}. ${content}`);
        }
        continue;
      }

      processedLines.push(trimmed);
    }

    // Mantém quebras de linha (whitespace-pre-wrap no render garante exibição)
    normalized = processedLines.join('\n').replace(/[ \t]{2,}/g, ' ').trim();
  }
  
  // 3. Limpar espaços múltiplos e quebras excessivas
  normalized = normalized
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  return normalized;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3️⃣ ORGANIZAÇÃO DE BLOCOS AUXILIARES — LEI PERMANENTE v2.0
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Organiza COMPETÊNCIA E HABILIDADE em campos separados
 * REGRA: Separar em campos distintos, cada um em sua própria linha
 * NÃO adicionar explicações, comentários ou exemplos
 */
export function normalizeCompetenciaHabilidade(text: string): string {
  if (!text) return '';
  
  let cleaned = removeEmojisAndSymbols(text);
  
  // Detectar padrões de competência e habilidade misturados
  const competenciaMatch = cleaned.match(/(?:Competência|C)\s*(?:de\s*área)?:?\s*(\d+|[^\.]+?)(?=\s*(?:Habilidade|H)|$)/i);
  const habilidadeMatch = cleaned.match(/(?:Habilidade|H):?\s*(\d+|[^\.]+)/i);
  
  // Se encontrou ambos, formatar corretamente
  if (competenciaMatch || habilidadeMatch) {
    const parts: string[] = [];
    
    if (competenciaMatch) {
      const compValue = competenciaMatch[1]?.trim();
      if (compValue) {
        parts.push(`Competência de área: ${compValue}`);
      }
    }
    
    if (habilidadeMatch) {
      const habValue = habilidadeMatch[1]?.trim();
      if (habValue) {
        parts.push(`Habilidade: ${habValue}`);
      }
    }
    
    if (parts.length > 0) {
      return parts.join('\n');
    }
  }
  
  // Se não detectou padrões específicos, apenas limpar
  return listToContinuousText(cleaned);
}

/**
 * Organiza DIRECIONAMENTO / ESTRATÉGIA
 * REGRA: Remover numeração visual, emojis, símbolos
 * Transformar listas em texto corrido contínuo
 * NÃO adicionar orientações novas
 */
export function normalizeDirecionamento(text: string): string {
  if (!text) return '';
  
  // 1. Remover emojis e símbolos
  let cleaned = removeEmojisAndSymbols(text);
  
  // 2. Remover numeração e transformar em texto corrido
  cleaned = listToContinuousText(cleaned);
  
  return cleaned;
}

/**
 * Organiza PEGADINHAS COMUNS
 * REGRA: Manter texto original, ajustar para texto corrido
 * Remover redundâncias visuais, NÃO acrescentar novas pegadinhas
 */
export function normalizePegadinhas(text: string): string {
  if (!text) return '';
  
  // 1. Remover emojis e símbolos
  let cleaned = removeEmojisAndSymbols(text);
  
  // 2. Remover numeração e transformar em texto corrido
  cleaned = listToContinuousText(cleaned);
  
  return cleaned;
}

/**
 * Organiza DICA DE OURO (REGRA PERMANENTE v2.0)
 * 
 * NOVA REGRA: Cada dica em sua própria linha, separadas por quebra de linha.
 * - Detecta múltiplas dicas (numeradas, com bullet, ou frases distintas)
 * - Garante uma dica por linha para legibilidade
 * - Remove emojis decorativos, mantém conteúdo original
 * - Aplica regras gramaticais básicas do português
 */
export function normalizeDicaDeOuro(text: string): string {
  if (!text) return '';
  
  // 1. Remover emojis e símbolos decorativos
  let cleaned = removeEmojisAndSymbols(text);
  
  // 2. Normalizar quebras de linha e espaços
  cleaned = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // 3. Detectar padrões de múltiplas dicas e separar
  // Padrão: "1." "2." ou "•" ou "-" ou "Dica 1:" etc.
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Se já tem múltiplas linhas, preservar estrutura
  if (lines.length > 1) {
    return lines
      .map(line => {
        // Limpar prefixos de lista (bullets, números) mas manter conteúdo
        return line
          .replace(/^[\d]+[.\)]\s*/, '')   // Remove "1." "2)" etc.
          .replace(/^[•\-–—]\s*/, '')       // Remove bullets
          .replace(/^Dica\s*\d*[:\-]?\s*/i, '') // Remove "Dica 1:" etc.
          .trim();
      })
      .filter(l => l.length > 0)
      .join('\n');
  }
  
  // 4. Texto corrido: detectar múltiplas sentenças/dicas e separar
  // Padrão: frases terminadas em "." seguidas de maiúscula
  const singleLine = lines[0] || '';
  
  // Detectar separadores naturais de dicas
  // Ex: "Memorize isso. Lembre-se daquilo." → 2 dicas
  const sentences = singleLine
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ])/g)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Só frases significativas (>10 chars)
  
  if (sentences.length > 1) {
    return sentences.join('\n');
  }
  
  // 5. Se é uma única dica, retornar limpa
  return singleLine;
}

/**
 * Aplica organização estrutural em todos os blocos auxiliares
 * REGRA ABSOLUTA: Organizar NÃO é reescrever, explicar ou interpretar
 * Somente estruturar, separar, padronizar e limpar visualmente
 */
export function normalizeAuxiliaryBlocks(blocks: {
  competencia_habilidade?: string | null;
  direcionamento?: string | null;
  pegadinhas?: string | null;
  dica_de_ouro?: string | null;
}): {
  competencia_habilidade: string;
  direcionamento: string;
  pegadinhas: string;
  dica_de_ouro: string;
  wasModified: boolean;
  modifications: string[];
} {
  const modifications: string[] = [];
  let wasModified = false;
  
  // Normalizar cada bloco
  const normalizedCompetencia = normalizeCompetenciaHabilidade(blocks.competencia_habilidade || '');
  const normalizedDirecionamento = normalizeDirecionamento(blocks.direcionamento || '');
  const normalizedPegadinhas = normalizePegadinhas(blocks.pegadinhas || '');
  const normalizedDica = normalizeDicaDeOuro(blocks.dica_de_ouro || '');
  
  // Verificar modificações
  if (normalizedCompetencia !== (blocks.competencia_habilidade || '')) {
    wasModified = true;
    modifications.push('Competência e Habilidade organizadas');
  }
  
  if (normalizedDirecionamento !== (blocks.direcionamento || '')) {
    wasModified = true;
    modifications.push('Direcionamento organizado');
  }
  
  if (normalizedPegadinhas !== (blocks.pegadinhas || '')) {
    wasModified = true;
    modifications.push('Pegadinhas organizadas');
  }
  
  if (normalizedDica !== (blocks.dica_de_ouro || '')) {
    wasModified = true;
    modifications.push('Dica de Ouro organizada');
  }
  
  return {
    competencia_habilidade: normalizedCompetencia,
    direcionamento: normalizedDirecionamento,
    pegadinhas: normalizedPegadinhas,
    dica_de_ouro: normalizedDica,
    wasModified,
    modifications,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4️⃣ FORMATAÇÃO E VERIFICAÇÃO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Formata alternativas para exibição (cada uma em sua linha)
 * REGRA: Formato obrigatório com quebras de linha
 */
export function formatAlternativesForDisplay(options: string[]): string {
  if (!options || options.length === 0) return '';
  
  return options
    .map((opt, idx) => {
      const letter = String.fromCharCode(65 + idx);
      let text = opt.trim();
      
      // Garantir que tenha o prefixo correto
      if (!text.match(/^[A-E]\)/i)) {
        // Remover qualquer prefixo existente
        text = text.replace(/^[A-E][\)\.\-\s]+/i, '').trim();
        text = `${letter}) ${text}`;
      }
      
      return text;
    })
    .join('\n');
}

/**
 * Verifica se as alternativas estão em conformidade
 */
export function checkAlternativesCompliance(options: string[] | null): {
  isCompliant: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!options || options.length === 0) {
    issues.push('Alternativas ausentes');
    return { isCompliant: false, issues };
  }
  
  // Verificar se cada alternativa está em formato correto
  options.forEach((opt, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const trimmed = opt.trim();
    
    // Verificar prefixo
    if (!trimmed.match(new RegExp(`^${letter}\\)`, 'i'))) {
      issues.push(`Alternativa ${letter} sem prefixo correto`);
    }
    
    // Verificar se está vazia
    if (trimmed.replace(/^[A-E]\)/i, '').trim().length === 0) {
      issues.push(`Alternativa ${letter} vazia`);
    }
  });
  
  return {
    isCompliant: issues.length === 0,
    issues,
  };
}

/**
 * Verifica se o enunciado está em conformidade
 */
export function checkEnunciadoCompliance(text: string): {
  isCompliant: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!text || text.trim().length === 0) {
    issues.push('Enunciado vazio');
    return { isCompliant: false, issues };
  }
  
  // Verificar padrões proibidos
  const forbiddenPatterns = [
    { pattern: /Analise\s+as?\s+afirmativas?\s+[IVX,\s]+/i, issue: 'Contém "Analise as afirmativas I, II..."' },
    { pattern: /Considere\s+as?\s+proposições?\s+[IVX,\s]+/i, issue: 'Contém "Considere as proposições I, II..."' },
    { pattern: /^[IVX]+\s*[\.\)\-]/m, issue: 'Contém enumeração romana solta (I., II., etc.)' },
  ];
  
  for (const { pattern, issue } of forbiddenPatterns) {
    if (pattern.test(text)) {
      issues.push(issue);
    }
  }
  
  return {
    isCompliant: issues.length === 0,
    issues,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5️⃣ NORMALIZAÇÃO COMPLETA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalização completa de estrutura de questão
 * Aplica todas as regras constitucionais
 */
export function normalizeQuestionStructure(question: {
  question_text?: string | null;
  options?: string[] | { [key: string]: string } | null;
  competencia_habilidade?: string | null;
  direcionamento?: string | null;
  pegadinhas?: string | null;
  dica_de_ouro?: string | null;
}): {
  question_text: string;
  options: string[];
  competencia_habilidade: string;
  direcionamento: string;
  pegadinhas: string;
  dica_de_ouro: string;
  wasModified: boolean;
  modifications: string[];
} {
  const modifications: string[] = [];
  let wasModified = false;
  
  // 1. Normalizar enunciado
  const originalText = question.question_text || '';
  const normalizedText = normalizeEnunciado(originalText);
  
  if (normalizedText !== originalText) {
    wasModified = true;
    modifications.push('Enunciado convertido para texto corrido');
  }
  
  // 2. Normalizar alternativas
  const normalizedOptions = normalizeAlternatives(question.options);
  
  // Verificar se houve mudança nas alternativas
  const originalOptionsStr = JSON.stringify(question.options);
  const normalizedOptionsStr = JSON.stringify(normalizedOptions);
  
  if (originalOptionsStr !== normalizedOptionsStr) {
    wasModified = true;
    modifications.push('Alternativas normalizadas para formato padrão');
  }
  
  // 3. Normalizar blocos auxiliares
  const auxiliaryResult = normalizeAuxiliaryBlocks({
    competencia_habilidade: question.competencia_habilidade,
    direcionamento: question.direcionamento,
    pegadinhas: question.pegadinhas,
    dica_de_ouro: question.dica_de_ouro,
  });
  
  if (auxiliaryResult.wasModified) {
    wasModified = true;
    modifications.push(...auxiliaryResult.modifications);
  }
  
  return {
    question_text: normalizedText,
    options: normalizedOptions,
    competencia_habilidade: auxiliaryResult.competencia_habilidade,
    direcionamento: auxiliaryResult.direcionamento,
    pegadinhas: auxiliaryResult.pegadinhas,
    dica_de_ouro: auxiliaryResult.dica_de_ouro,
    wasModified,
    modifications,
  };
}

export default {
  // Enunciado e Alternativas
  normalizeAlternatives,
  splitConcatenatedAlternatives,
  normalizeEnunciado,
  formatAlternativesForDisplay,
  checkAlternativesCompliance,
  checkEnunciadoCompliance,
  
  // Blocos Auxiliares
  normalizeCompetenciaHabilidade,
  normalizeDirecionamento,
  normalizePegadinhas,
  normalizeDicaDeOuro,
  normalizeAuxiliaryBlocks,
  
  // Estrutura Completa
  normalizeQuestionStructure,
};
