// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ BANCA NORMALIZER — POLÍTICA PERMANENTE DE NORMALIZAÇÃO v1.0
// ═══════════════════════════════════════════════════════════════════════════════
// REGRA SUPREMA: Quando existe uma banca oficial, apenas o nome oficial e o ano
// podem ser exibidos ou armazenados. Nenhum prefixo adicional é permitido.
// ═══════════════════════════════════════════════════════════════════════════════

import { BANCAS, findBancaByValue } from "@/constants/bancas";

// Fallback padrão quando não há banca oficial
export const DEFAULT_BANCA_HEADER = "QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS";

// ═══════════════════════════════════════════════════════════════════════════════
// PREFIXOS INVÁLIDOS — DEVEM SER REMOVIDOS QUANDO HÁ BANCA OFICIAL
// ═══════════════════════════════════════════════════════════════════════════════
const INVALID_PREFIXES = [
  'QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS',
  'QUESTAO SIMULADO PROF. MOISES MEDEIROS',
  'QUESTÃO SIMULADO PROF MOISÉS MEDEIROS',
  'QUESTAO SIMULADO PROF MOISES MEDEIROS',
  'QUESTÃO PROF. MOISÉS MEDEIROS',
  'QUESTAO PROF. MOISES MEDEIROS',
  'PROF. MOISÉS MEDEIROS',
  'PROF MOISÉS MEDEIROS',
  'PROF. MOISES MEDEIROS',
  'PROF MOISES MEDEIROS',
  'MOISÉS MEDEIROS',
  'MOISES MEDEIROS',
  'SIMULADO PROF.',
  'SIMULADO PROF',
  'QUESTÃO AUTORAL',
  'AUTORAL PROF',
];

// Padrões genéricos que DEVEM ser removidos quando banca oficial é detectada
const GENERIC_PATTERNS = [
  /QUEST[ÃA]O\s+SIMULADO\s+PROF\.?\s*MOIS[ÉE]S\s*MEDEIROS/gi,
  /SIMULADO\s+PROF\.?\s*MOIS[ÉE]S\s*MEDEIROS/gi,
  /PROF\.?\s*MOIS[ÉE]S\s*MEDEIROS/gi,
  /QUEST[ÃA]O\s+AUTORAL/gi,
  /AUTORAL\s+PROF/gi,
];

// Mapeamento de padrões de texto para valores de banca
const BANCA_TEXT_PATTERNS: Array<{ pattern: RegExp; value: string }> = [
  // ENEM variantes
  { pattern: /\bENEM\s*2[ªa°]?\s*APLICA[ÇC][ÃA]O\b/i, value: "enem_ppl" },
  { pattern: /\bENEM\s*PPL\b/i, value: "enem_ppl" },
  { pattern: /\bENEM\s*DIGITAL\b/i, value: "enem_digital" },
  { pattern: /\bENEM\s*(\d{4})\b/i, value: "enem" },
  { pattern: /\bENEM\b/i, value: "enem" },
  
  // Vestibulares
  { pattern: /\bFUVEST\b/i, value: "fuvest" },
  { pattern: /\bUNICAMP\b/i, value: "unicamp" },
  { pattern: /\bUNESP\b/i, value: "unesp" },
  { pattern: /\bUNIFESP\b/i, value: "unifesp" },
  { pattern: /\bITA\b/i, value: "ita" },
  { pattern: /\bIME\b/i, value: "ime" },
  
  // Federais
  { pattern: /\bUFRJ\b/i, value: "ufrj" },
  { pattern: /\bUFMG\b/i, value: "ufmg" },
  { pattern: /\bUFPE\b/i, value: "ufpe" },
  { pattern: /\bUFPR\b/i, value: "ufpr" },
  { pattern: /\bUFSC\b/i, value: "ufsc" },
  { pattern: /\bUFRN\b/i, value: "ufrn" },
  { pattern: /\bUFRGS\b/i, value: "ufrgs" },
  { pattern: /\bUFBA\b/i, value: "ufba" },
  { pattern: /\bUFC\b/i, value: "ufc" },
  { pattern: /\bUFPB\b/i, value: "ufpb" },
  { pattern: /\bUFF\b/i, value: "uff" },
  { pattern: /\bUFES\b/i, value: "ufes" },
  { pattern: /\bUFG\b/i, value: "ufg" },
  
  // Estaduais
  { pattern: /\bUERJ\b/i, value: "uerj" },
  { pattern: /\bUECE\b/i, value: "uece" },
  { pattern: /\bUEM\b/i, value: "uem" },
  { pattern: /\bUEL\b/i, value: "uel" },
  { pattern: /\bUEPG\b/i, value: "uepg" },
  { pattern: /\bUDESC\b/i, value: "udesc" },
  { pattern: /\bUEPA\b/i, value: "uepa" },
  { pattern: /\bUEMA\b/i, value: "uema" },
  { pattern: /\bUERN\b/i, value: "uern" },
  { pattern: /\bUEPB\b/i, value: "uepb" },
  { pattern: /\bUPE\b/i, value: "upe" },
  { pattern: /\bUEG\b/i, value: "ueg" },
  
  // Organizadoras
  { pattern: /\bVUNESP\b/i, value: "vunesp" },
  { pattern: /\bFGV\b/i, value: "fgv" },
  { pattern: /\bCESGRANRIO\b/i, value: "cesgranrio" },
  { pattern: /\bFCC\b/i, value: "fcc" },
  { pattern: /\bCONSULPLAN\b/i, value: "consulplan" },
  { pattern: /\bCESPE\b/i, value: "cespe" },
  { pattern: /\bCEBRASPE\b/i, value: "cebraspe" },
  { pattern: /\bFUNDATEC\b/i, value: "fundatec" },
  { pattern: /\bIBFC\b/i, value: "ibfc" },
  { pattern: /\bQUADRIX\b/i, value: "quadrix" },
  
  // Militares
  { pattern: /\bESA\b/i, value: "esa" },
  { pattern: /\bEFOMM\b/i, value: "efomm" },
  { pattern: /\bAFA\b/i, value: "afa" },
  { pattern: /\bESPCEX\b/i, value: "espcex" },
  { pattern: /\bEPCAR\b/i, value: "epcar" },
  { pattern: /\bEEAR\b/i, value: "eear" },
  { pattern: /\bEN\b/i, value: "en" },
  
  // Olimpíadas
  { pattern: /\bOBQ\b/i, value: "obq" },
  { pattern: /\bOQSP\b/i, value: "oqsp" },
  { pattern: /\bOBQI\b/i, value: "obqi" },
  
  // Nacionais
  { pattern: /\bENCCEJA\b/i, value: "encceja" },
  { pattern: /\bSAEB\b/i, value: "saeb" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO: Remove prefixos inválidos de uma string de banca
// ═══════════════════════════════════════════════════════════════════════════════
function removeInvalidPrefixes(input: string): string {
  if (!input) return input;
  
  let result = input;
  
  for (const prefix of INVALID_PREFIXES) {
    // Remove o prefixo (case-insensitive)
    const regex = new RegExp(prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(regex, '').trim();
  }
  
  // Remove padrões via regex também
  for (const pattern of GENERIC_PATTERNS) {
    result = result.replace(pattern, '').trim();
  }
  
  // Remove parênteses vazios ou com espaços
  result = result.replace(/\(\s*\)/g, '').trim();
  
  // Remove separadores órfãos
  result = result.replace(/^\s*[-\/]\s*/g, '').trim();
  result = result.replace(/\s*[-\/]\s*$/g, '').trim();
  
  return result;
}

/**
 * Extrai ano de um texto (ex: "2023", "(2021)", "Enem 2020")
 */
export function extractYearFromText(text: string): number | null {
  if (!text) return null;
  // Procura por anos entre 1990 e 2099
  const match = text.match(/\b(19[9][0-9]|20[0-9]{2})\b/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extrai edição especial do texto (ex: "2ª aplicação", "PPL", "Digital")
 */
export function extractEditionFromText(text: string): string | null {
  if (!text) return null;
  
  // 2ª aplicação / segunda aplicação
  if (/2[ªa°]?\s*APLICA[ÇC][ÃA]O/i.test(text)) {
    return "2ª APLICAÇÃO";
  }
  
  // PPL
  if (/\bPPL\b/i.test(text)) {
    return "PPL";
  }
  
  // Digital
  if (/\bDIGITAL\b/i.test(text)) {
    return "DIGITAL";
  }
  
  return null;
}

/**
 * Detecta banca oficial a partir de texto livre
 * Retorna o value da banca se encontrado, ou null
 */
export function detectBancaFromText(text: string): string | null {
  if (!text) return null;
  
  // Remove o label genérico primeiro para análise limpa
  let cleanText = removeInvalidPrefixes(text);
  
  // Tenta encontrar uma banca oficial
  for (const { pattern, value } of BANCA_TEXT_PATTERNS) {
    if (pattern.test(cleanText) || pattern.test(text)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Verifica se uma string contém apenas o label genérico (sem banca oficial)
 */
export function isOnlyGenericLabel(text: string): boolean {
  if (!text) return false;
  
  // Remove o label genérico
  const remaining = removeInvalidPrefixes(text);
  
  // Se só sobrou espaços ou nada, era só o label genérico
  return remaining.length === 0 || /^[\s\(\)]+$/.test(remaining);
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO PRINCIPAL: Normaliza banca para formato padrão
 * FORMATO FINAL: NOME_BANCA (ANO) - sempre em MAIÚSCULAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * REGRAS PERMANENTES (Política v1.0):
 * 1. Se banca oficial detectada → APENAS a banca oficial em UPPERCASE
 * 2. Se apenas label genérico → "AUTORAL (ANO)"
 * 3. Nunca mistura labels com bancas oficiais
 * 4. Ano sempre entre parênteses
 */
export function normalizeBanca(
  input: string | null | undefined,
  year?: number | string | null
): string {
  if (!input || input.trim() === '') {
    const currentYear = new Date().getFullYear();
    const finalYear = year ? (typeof year === 'string' ? parseInt(year, 10) : year) : currentYear;
    return `AUTORAL (${finalYear})`;
  }

  const originalInput = input.trim();
  
  // Detecta se há banca oficial
  const detectedBanca = detectBancaFromText(originalInput);
  
  if (detectedBanca) {
    // Há banca oficial - remover prefixos inválidos
    const bancaInfo = findBancaByValue(detectedBanca);
    const bancaLabel = bancaInfo ? bancaInfo.label.toUpperCase() : detectedBanca.toUpperCase();
    
    // Extrai o ano do input original
    let extractedYear = extractYearFromText(originalInput);
    
    // Se não encontrou no input, usa o parâmetro year
    if (!extractedYear && year) {
      extractedYear = typeof year === 'string' ? parseInt(year, 10) : year;
    }
    
    // Extrai edição especial
    const edition = extractEditionFromText(originalInput);
    let finalLabel = bancaLabel;
    if (edition && !finalLabel.includes(edition.toUpperCase())) {
      finalLabel = `${finalLabel} ${edition}`;
    }
    
    // Retorna no formato BANCA (ANO)
    if (extractedYear) {
      return `${finalLabel} (${extractedYear})`;
    }
    return finalLabel;
  }
  
  // Não há banca oficial - verifica se é apenas o prefixo do professor
  const upperInput = originalInput.toUpperCase();
  for (const prefix of INVALID_PREFIXES) {
    if (upperInput.includes(prefix.toUpperCase())) {
      // É uma questão autoral do professor
      const currentYear = new Date().getFullYear();
      const extractedYear = extractYearFromText(originalInput) || 
        (year ? (typeof year === 'string' ? parseInt(year, 10) : year) : currentYear);
      return `AUTORAL (${extractedYear})`;
    }
  }
  
  // Outros casos - limpa e normaliza para maiúsculas
  let normalizedBoard = removeInvalidPrefixes(originalInput).toUpperCase();
  
  // Se ficou vazio após limpeza, é autoral
  if (!normalizedBoard || normalizedBoard.trim() === '') {
    const currentYear = new Date().getFullYear();
    const finalYear = year ? (typeof year === 'string' ? parseInt(year, 10) : year) : currentYear;
    return `AUTORAL (${finalYear})`;
  }
  
  // Extrai ou adiciona ano
  let finalYear = extractYearFromText(originalInput);
  if (!finalYear && year) {
    finalYear = typeof year === 'string' ? parseInt(year, 10) : year;
  }
  
  // Adiciona ano se disponível e ainda não tem
  if (finalYear && !normalizedBoard.includes(String(finalYear))) {
    return `${normalizedBoard.trim()} (${finalYear})`;
  }
  
  // Reformata se já tem ano
  const yearMatch = normalizedBoard.match(/(.+?)\s*\(?\s*(\d{4})\s*\)?$/);
  if (yearMatch) {
    return `${yearMatch[1].trim()} (${yearMatch[2]})`;
  }
  
  return normalizedBoard.trim();
}

/**
 * Normaliza o texto da banca para exibição
 * 
 * REGRAS PERMANENTES:
 * 1. Se banca oficial detectada → retorna APENAS a banca oficial em UPPERCASE
 * 2. Se apenas label genérico → mantém "QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS"
 * 3. Nunca mistura labels
 */
export function normalizeBancaHeader(
  rawText: string | null | undefined,
  bancaField?: string | null,
  ano?: number | null
): string {
  // 1. Se tem campo banca explícito, usar ele
  if (bancaField && bancaField !== "autoral_prof_moises" && bancaField !== "propria" && bancaField !== "autoral") {
    const bancaInfo = findBancaByValue(bancaField);
    if (bancaInfo) {
      const label = bancaInfo.label.toUpperCase();
      return ano ? `${label} (${ano})` : label;
    }
    // Se não encontrou na lista, usar o valor em uppercase
    const formattedBanca = bancaField.toUpperCase().replace(/_/g, " ");
    return ano ? `${formattedBanca} (${ano})` : formattedBanca;
  }
  
  // 2. Tentar detectar banca do texto
  const detectedBanca = detectBancaFromText(rawText || "");
  if (detectedBanca) {
    const bancaInfo = findBancaByValue(detectedBanca);
    if (bancaInfo) {
      // Extrair ano e edição do texto original
      const extractedYear = ano || extractYearFromText(rawText || "");
      const edition = extractEditionFromText(rawText || "");
      
      let label = bancaInfo.label.toUpperCase();
      
      // Adicionar edição especial se houver
      if (edition && !label.includes(edition.toUpperCase())) {
        label = `${label} ${edition}`;
      }
      
      return extractedYear ? `${label} (${extractedYear})` : label;
    }
  }
  
  // 3. Fallback: label genérico
  return DEFAULT_BANCA_HEADER;
}

/**
 * Normaliza o valor da banca para persistência no banco
 * Extrai a banca oficial se existir no texto
 */
export function normalizeBancaForStorage(
  rawText: string | null | undefined,
  currentBanca?: string | null
): string | null {
  // Se já tem banca definida e não é genérica, manter
  if (currentBanca && currentBanca !== "autoral_prof_moises" && currentBanca !== "propria" && currentBanca !== "autoral") {
    return currentBanca;
  }
  
  // Tentar detectar do texto
  const detected = detectBancaFromText(rawText || "");
  if (detected) {
    return detected;
  }
  
  // Manter o valor atual ou null
  return currentBanca || null;
}

/**
 * Formata header da banca para exibição (função principal para UI)
 * 
 * NOVA IMPLEMENTAÇÃO PADRÃO:
 * - Aplica normalização automática
 * - Remove labels genéricos quando banca oficial existe
 * - Sempre retorna UPPERCASE
 */
export function formatBancaHeader(
  banca?: string | null,
  ano?: number | null,
  questionText?: string | null
): string {
  // Se tem banca explícita e não é genérica
  if (banca && banca !== "autoral_prof_moises" && banca !== "propria" && banca !== "autoral") {
    const bancaInfo = findBancaByValue(banca);
    if (bancaInfo) {
      const label = bancaInfo.label.toUpperCase();
      return ano ? `${label} (${ano})` : label;
    }
    // Se não encontrou na lista, usar o valor em uppercase
    const formattedBanca = banca.toUpperCase().replace(/_/g, " ");
    return ano ? `${formattedBanca} (${ano})` : formattedBanca;
  }
  
  // Se tem texto da questão, tentar detectar banca
  if (questionText) {
    return normalizeBancaHeader(questionText, banca, ano);
  }
  
  // Fallback
  return DEFAULT_BANCA_HEADER;
}

/**
 * Extrai banca e ano do texto do enunciado para normalização na importação
 */
export function extractBancaAndYearFromQuestionText(
  questionText: string
): { banca: string | null; ano: number | null; edition: string | null } {
  const banca = detectBancaFromText(questionText);
  const ano = extractYearFromText(questionText);
  const edition = extractEditionFromText(questionText);
  
  return { banca, ano, edition };
}

/**
 * Limpa o texto do enunciado removendo o header da banca
 * (para casos onde a banca está no início do texto)
 */
export function cleanBancaFromQuestionText(questionText: string): string {
  if (!questionText) return "";
  
  let cleaned = removeInvalidPrefixes(questionText);
  
  // Remove padrões de banca oficial com parênteses (ex: "ENEM (2023)")
  cleaned = cleaned.replace(/^[A-ZÁÉÍÓÚ\s]+\s*\(\d{4}\)\s*/i, "");
  
  // Remove apenas nome da banca no início
  for (const { pattern } of BANCA_TEXT_PATTERNS) {
    cleaned = cleaned.replace(new RegExp(`^${pattern.source}\\s*`, "i"), "");
  }
  
  return cleaned.trim();
}

/**
 * Valida se uma banca está no formato correto
 */
export function isValidBancaFormat(banca: string): boolean {
  if (!banca) return false;
  
  // Deve estar em maiúsculas
  if (banca !== banca.toUpperCase()) return false;
  
  // Não deve ter prefixos inválidos
  for (const prefix of INVALID_PREFIXES) {
    if (banca.toUpperCase().includes(prefix.toUpperCase())) {
      return false;
    }
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTAR CONSTANTES PARA USO EXTERNO
// ═══════════════════════════════════════════════════════════════════════════════
export const BANCA_CONSTANTS = {
  INVALID_PREFIXES,
  DEFAULT_BANCA: 'AUTORAL'
};
