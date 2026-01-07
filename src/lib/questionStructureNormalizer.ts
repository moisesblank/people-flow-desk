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
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ORGANIZAR ITENS/SEQUÊNCIAS EM LINHAS SEPARADAS — LEI PERMANENTE v3.1
  // ═══════════════════════════════════════════════════════════════════════════
  // Padrões suportados:
  //   • Romanos: I. II. III. IV. V. (com ., ), -, –, —)
  //   • Numéricos: 01. 02. 03. ou 1. 2. 3. ou (1) (2) (3)
  //   • Letras maiúsculas: A) B) C) D) E) (alternativas)
  // REGRA: Cada item DEVE começar em uma nova linha

  // 2a. Quebra de linha ANTES de itens romanos no meio do texto
  // Ex: "... fenilalanina. II. ..." -> "... fenilalanina.\nII. ..."
  normalized = normalized.replace(
    /(\S)\s+(?=([IVX]+)\s*[\.\)\-–—]\s+)/g,
    "$1\n"
  );

  // 2b. Quebra de linha ANTES de itens numéricos (01. 02. ou 1) 2) etc.) no meio do texto
  // Ex: "... natureza. 01. A evaporação..." -> "... natureza.\n01. A evaporação..."
  normalized = normalized.replace(
    /(\S)\s+(?=(0?\d{1,2})\s*[\.\)\-–—]\s+)/g,
    "$1\n"
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 2c. REMOVER ALTERNATIVAS SOLTAS DO ENUNCIADO — LEI PERMANENTE v1.0
  // ═══════════════════════════════════════════════════════════════════════════
  // Alternativas (A, B, C, D, E) NÃO pertencem ao enunciado — ficam no campo options
  // Esta regra aplica-se a TODA ENTIDADE QUESTÃO do sistema
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Padrão 1: Sequência completa no final do texto
  // Exemplos: "texto a) b) c) d) e)." ou "texto A) B) C) D) E)"
  normalized = normalized.replace(
    /\s*[aA]\s*[\)\.\-–—]\s*[bB]\s*[\)\.\-–—]\s*[cC]\s*[\)\.\-–—]\s*[dD]\s*[\)\.\-–—]\s*[eE]\s*[\)\.\-–—]?\.?\s*$/g,
    ''
  );
  
  // Padrão 2: Sequência sem separadores (letras grudadas)
  // Exemplos: "texto a)b)c)d)e)" ou "texto abcde)"
  normalized = normalized.replace(
    /\s*[aA]\)?[bB]\)?[cC]\)?[dD]\)?[eE]\)?\.?\s*$/g,
    ''
  );
  
  // Padrão 3: Alternativas parciais (pode faltar algumas letras)
  // Exemplos: "texto a) b) c)" ou "texto d) e)"
  normalized = normalized.replace(
    /\s+(?:[aA]\s*[\)\.\-–—]\s*)?(?:[bB]\s*[\)\.\-–—]\s*)?(?:[cC]\s*[\)\.\-–—]\s*)?(?:[dD]\s*[\)\.\-–—]\s*)?[eE]\s*[\)\.\-–—]\.?\s*$/g,
    ''
  );
  
  // Padrão 4: Alternativas em linha separada
  // Exemplo: linha contendo apenas "a) b) c) d) e)"
  normalized = normalized
    .split('\n')
    .filter(line => !(/^\s*[aA]\s*[\)\.\-–—]?\s*[bB]\s*[\)\.\-–—]?\s*[cC]\s*[\)\.\-–—]?\s*[dD]\s*[\)\.\-–—]?\s*[eE]\s*[\)\.\-–—]?\.?\s*$/.test(line)))
    .join('\n');
  
  // Padrão 5: Alternativas individuais soltas no final (última verificação)
  // Remove qualquer "a)" ou "b)" etc. perdidos no final do texto
  normalized = normalized.replace(/\s+[a-eA-E]\s*[\)\.\-–—]\s*$/g, '').trim();

  // 2d. Processar cada linha para garantir formatação correta de itens romanos
  const affirmativePattern = /^([IVX]+)\s*[\.\)\-–—]\s*/gm;
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

    normalized = processedLines.join('\n').replace(/[ \t]{2,}/g, ' ').trim();
  }

  // 2e. Processar itens numéricos (01. 02. 03. etc.)
  const numericPattern = /^(0?\d{1,2})\s*[\.\)\-–—]\s*/gm;
  if (numericPattern.test(normalized)) {
    const lines = normalized.split('\n');
    const processedLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(/^(0?\d{1,2})\s*[\.\)\-–—]\s*(.*)$/);
      if (match) {
        const num = match[1] || '';
        const contentRaw = (match[2] || '').trim();
        if (contentRaw) {
          // Manter formato original (01. ou 1.)
          const prefix = num.length === 1 ? `0${num}` : num;
          const content = contentRaw.endsWith('.') || contentRaw.endsWith('?') || contentRaw.endsWith('!')
            ? contentRaw
            : `${contentRaw}.`;
          processedLines.push(`${prefix}. ${content}`);
        }
        continue;
      }

      processedLines.push(trimmed);
    }

    normalized = processedLines.join('\n').replace(/[ \t]{2,}/g, ' ').trim();
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 2f. QUEBRA DE LINHA ANTES DO COMANDO FINAL (PERGUNTA) — LEI PERMANENTE v3.2
  // ═══════════════════════════════════════════════════════════════════════════
  // Padrões de comando final que DEVEM estar em nova linha:
  // - "Assinale a alternativa...", "Utilizando... assinale...", "Marque...",
  // - "Com base nisso, é correto afirmar...", "Determine...", "Indique...",
  // - "É correto afirmar que...", "Pode-se concluir que...", etc.
  const commandPatterns = [
    // Padrões iniciados por verbos de comando
    /(\S)\s+(Assinale\s+a\s+alternativa)/gi,
    /(\S)\s+(Marque\s+a\s+(?:alternativa|opção))/gi,
    /(\S)\s+(Indique\s+(?:a\s+alternativa|o\s+valor|qual))/gi,
    /(\S)\s+(Determine\s+(?:o\s+valor|a\s+(?:alternativa|resposta)))/gi,
    /(\S)\s+(Identifique\s+(?:a\s+alternativa|qual))/gi,
    /(\S)\s+(Selecione\s+a\s+(?:alternativa|opção))/gi,
    // Padrões com contexto + comando
    /(\S)\s+(Utilizando\s+(?:as?\s+)?(?:equações?|informações?|dados?).*?,?\s*assinale)/gi,
    /(\S)\s+(Com\s+base\s+(?:nos?\s+)?(?:dados?|informações?|texto).*?,?\s*(?:assinale|é\s+correto|pode-se))/gi,
    /(\S)\s+(A\s+partir\s+(?:dos?\s+)?(?:dados?|informações?).*?,?\s*(?:assinale|é\s+correto))/gi,
    /(\S)\s+(De\s+acordo\s+com\s+(?:o\s+)?(?:texto|enunciado).*?,?\s*(?:assinale|é\s+correto))/gi,
    // Padrões de afirmação/conclusão
    /(\S)\s+(É\s+correto\s+afirmar\s+que)/gi,
    /(\S)\s+(Pode-se\s+(?:afirmar|concluir)\s+que)/gi,
    /(\S)\s+(Conclui-se\s+(?:corretamente\s+)?que)/gi,
    // Padrão genérico: kJ/mol ou similar seguido de comando
    /([Jj]\/mol|kJ|kcal)\s+(Utilizando|Assinale|Com\s+base|A\s+partir)/gi,
    // ═══════════════════════════════════════════════════════════════════════════
    // LEI v3.3: Após item (romano/numérico) terminado em ponto, quebra antes de conclusão
    // ═══════════════════════════════════════════════════════════════════════════
    // Padrões após ponto final de item: "Das afirmações...", "São corretas...", "Está(ão) correta(s)..."
    /(\.\s*)(Das\s+afirmações?\s+(?:acima|anteriores?))/gi,
    /(\.\s*)(São\s+corretas?,?\s*apenas)/gi,
    /(\.\s*)(Está(?:ão)?\s+correta\(?s?\)?)/gi,
    /(\.\s*)(A(?:s)?\s+alternativa(?:s)?\s+correta(?:s)?)/gi,
    /(\.\s*)(Qual(?:is)?\s+(?:das?\s+)?alternativas?)/gi,
    /(\.\s*)(Sobre\s+(?:as?\s+)?(?:afirmações?|proposições?))/gi,
    /(\.\s*)(Em\s+relação\s+(?:às?\s+)?afirmações?)/gi,
    /(\.\s*)(Analise\s+as?\s+(?:afirmações?|proposições?))/gi,
    /(\.\s*)(Julgue\s+(?:os?\s+)?itens?)/gi,
    /(\.\s*)(Considerando\s+(?:as?\s+)?(?:afirmações?|informações?))/gi,
  ];
  
  for (const pattern of commandPatterns) {
    normalized = normalized.replace(pattern, '$1\n$2');
  }

  // 3. Limpar espaços múltiplos e quebras excessivas
  normalized = normalized
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  
  return normalized;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3️⃣ ORGANIZAÇÃO DE BLOCOS AUXILIARES — LEI PERMANENTE v2.0
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Organiza COMPETÊNCIA E HABILIDADE em campos separados
 * REGRA: Separar em campos distintos, cada um em sua própria linha
 * LEI v3.4: COMPETÊNCIA e HABILIDADE DEVEM estar em linhas SEPARADAS (Enter obrigatório)
 * NÃO adicionar explicações, comentários ou exemplos
 */
export function normalizeCompetenciaHabilidade(text: string): string {
  if (!text) return '';
  
  let cleaned = removeEmojisAndSymbols(text);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LEI v3.4: SEPARAÇÃO OBRIGATÓRIA ENTRE COMPETÊNCIA E HABILIDADE
  // ═══════════════════════════════════════════════════════════════════════════
  // REGRA PRINCIPAL: Inserir quebra de linha ANTES de "Habilidade"
  // Padrão: "...contextos.  Habilidade H₂₄..." → "...contextos.\nHabilidade H₂₄..."
  
  // Primeiro: forçar quebra de linha antes de "Habilidade" (qualquer contexto)
  cleaned = cleaned.replace(
    /(\S)\s+(Habilidade\s+H)/gi,
    '$1\n$2'
  );
  
  // Também capturar padrão com ponto final antes
  cleaned = cleaned.replace(
    /(\.\s+)(Habilidade\s+H)/gi,
    '.\n$2'
  );
  
  // Limpar espaços excessivos mas manter quebras de linha
  cleaned = cleaned
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return cleaned;
}

/**
 * Organiza DIRECIONAMENTO / ESTRATÉGIA
 * LEI v3.5: Cada numeração (1⃣, 2⃣, 1., 2. etc.) DEVE estar em sua própria linha
 * REGRA: Quebrar linha ANTES de cada item numerado
 * NÃO adicionar orientações novas
 */
export function normalizeDirecionamento(text: string): string {
  if (!text) return '';
  
  // 1. Limpar emojis decorativos (exceto números em círculo que são estruturais)
  let cleaned = text
    .replace(/[★☆✓✗✔✘●○◆◇▶►▷▸◀◁◂◃⚡⚙️🔧🔨🛠️]/g, '')
    .trim();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LEI v3.5: QUEBRA DE LINHA ANTES DE CADA NUMERAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  // Padrões de numeração que devem iniciar nova linha:
  // - Números com emoji: 1⃣ 2⃣ 3⃣ etc.
  // - Números com ponto: 1. 2. 3. ou 1) 2) 3)
  // - Bullets: • - –
  
  // Números em círculo/emoji (1⃣, 2⃣, 3⃣, etc.)
  cleaned = cleaned.replace(/(\S)\s*([\d]⃣)/g, '$1\n$2');
  
  // Números com ponto ou parêntese no meio do texto
  cleaned = cleaned.replace(/(\S)\s+(\d+[\.\)])\s+/g, '$1\n$2 ');
  
  // Bullets no meio do texto
  cleaned = cleaned.replace(/(\S)\s+([•\-–])\s+/g, '$1\n$2 ');
  
  // Limpar espaços múltiplos e linhas vazias excessivas
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  
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
