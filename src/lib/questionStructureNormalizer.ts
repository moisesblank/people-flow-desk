/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║   NORMALIZADOR DE ESTRUTURA DE QUESTÃO v1.0                                  ║
 * ║   Question Structure Normalizer                                              ║
 * ║                                                                              ║
 * ║   LEI PERMANENTE: Aplica as regras constitucionais de estrutura:             ║
 * ║   - ENUNCIADO: texto corrido, sem enumeração solta                           ║
 * ║   - AFIRMATIVAS: reorganizadas internamente                                  ║
 * ║   - ALTERNATIVAS: cada uma em sua própria linha                              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

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
  
  // 2. Converter listas de afirmativas (I - ..., II - ...) em texto corrido
  // Detectar padrões como "I - texto" ou "I. texto" ou "I) texto"
  const affirmativePattern = /^([IVX]+)\s*[\.\)\-–—]\s*/gm;
  
  // Se há afirmativas numeradas, convertê-las para texto corrido
  if (affirmativePattern.test(normalized)) {
    // Encontrar todas as afirmativas
    const lines = normalized.split('\n');
    const processedLines: string[] = [];
    let isInAffirmativeBlock = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Verificar se é uma afirmativa numerada
      if (/^[IVX]+\s*[\.\)\-–—]/.test(trimmed)) {
        isInAffirmativeBlock = true;
        // Remover o prefixo romano e adicionar como texto corrido
        const content = trimmed.replace(/^[IVX]+\s*[\.\)\-–—]\s*/, '').trim();
        if (content) {
          // Adicionar ponto final se não tiver
          const finalContent = content.endsWith('.') || content.endsWith('?') || content.endsWith('!')
            ? content
            : content + '.';
          processedLines.push(finalContent);
        }
      } else {
        // Linha normal
        if (trimmed) {
          processedLines.push(trimmed);
        }
        isInAffirmativeBlock = false;
      }
    }
    
    // Juntar as linhas em texto corrido
    normalized = processedLines.join(' ').replace(/\s+/g, ' ').trim();
  }
  
  // 3. Limpar espaços múltiplos e quebras excessivas
  normalized = normalized
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  return normalized;
}

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

/**
 * Normalização completa de estrutura de questão
 * Aplica todas as regras constitucionais
 */
export function normalizeQuestionStructure(question: {
  question_text?: string | null;
  options?: string[] | { [key: string]: string } | null;
}): {
  question_text: string;
  options: string[];
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
  
  return {
    question_text: normalizedText,
    options: normalizedOptions,
    wasModified,
    modifications,
  };
}

export default {
  normalizeAlternatives,
  splitConcatenatedAlternatives,
  normalizeEnunciado,
  formatAlternativesForDisplay,
  checkAlternativesCompliance,
  checkEnunciadoCompliance,
  normalizeQuestionStructure,
};
