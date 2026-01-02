// ============================================
// 🏛️ BANCA NORMALIZER — PADRÃO PERMANENTE
// QUESTÃO HEADER STANDARDIZATION AS NEW NORMAL
// ============================================
// REGRAS:
// 1. Se existe banca oficial → exibir APENAS a banca oficial em UPPERCASE
// 2. Se não existe banca oficial → manter "QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS"
// 3. Nunca misturar labels genéricos com bancas oficiais
// ============================================

import { BANCAS, findBancaByValue } from "@/constants/bancas";

// Fallback padrão quando não há banca oficial
export const DEFAULT_BANCA_HEADER = "QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS";

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
  
  // Estaduais
  { pattern: /\bUERJ\b/i, value: "uerj" },
  { pattern: /\bUECE\b/i, value: "uece" },
  { pattern: /\bUEM\b/i, value: "uem" },
  { pattern: /\bUEL\b/i, value: "uel" },
  
  // Organizadoras
  { pattern: /\bVUNESP\b/i, value: "vunesp" },
  { pattern: /\bFGV\b/i, value: "fgv" },
  { pattern: /\bCESGRANRIO\b/i, value: "cesgranrio" },
  { pattern: /\bFCC\b/i, value: "fcc" },
  { pattern: /\bCONSULPLAN\b/i, value: "consulplan" },
  
  // Militares
  { pattern: /\bESA\b/i, value: "esa" },
  { pattern: /\bEFOMM\b/i, value: "efomm" },
  { pattern: /\bAFA\b/i, value: "afa" },
  { pattern: /\bESPCEX\b/i, value: "espcex" },
  
  // Nacionais
  { pattern: /\bENCCEJA\b/i, value: "encceja" },
  { pattern: /\bSAEB\b/i, value: "saeb" },
];

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
  let cleanText = text;
  for (const pattern of GENERIC_PATTERNS) {
    cleanText = cleanText.replace(pattern, " ");
  }
  cleanText = cleanText.trim();
  
  // Tenta encontrar uma banca oficial
  for (const { pattern, value } of BANCA_TEXT_PATTERNS) {
    if (pattern.test(cleanText)) {
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
  let remaining = text;
  for (const pattern of GENERIC_PATTERNS) {
    remaining = remaining.replace(pattern, "");
  }
  
  // Remove parênteses vazios e espaços
  remaining = remaining.replace(/\(\s*\)/g, "").trim();
  
  // Se só sobrou espaços ou nada, era só o label genérico
  return remaining.length === 0 || /^[\s\(\)]+$/.test(remaining);
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
  if (bancaField && bancaField !== "autoral_prof_moises" && bancaField !== "propria") {
    const bancaInfo = findBancaByValue(bancaField);
    if (bancaInfo) {
      const label = bancaInfo.label.toUpperCase();
      return ano ? `${label} (${ano})` : label;
    }
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
  if (currentBanca && currentBanca !== "autoral_prof_moises" && currentBanca !== "propria") {
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
 * Formata header da banca para exibição (substitui formatBancaHeader antigo)
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
  if (banca && banca !== "autoral_prof_moises" && banca !== "propria") {
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
  
  let cleaned = questionText;
  
  // Remove padrões genéricos
  for (const pattern of GENERIC_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  
  // Remove padrões de banca oficial com parênteses (ex: "ENEM (2023)")
  cleaned = cleaned.replace(/^[A-ZÁÉÍÓÚ\s]+\s*\(\d{4}\)\s*/i, "");
  
  // Remove apenas nome da banca no início
  for (const { pattern } of BANCA_TEXT_PATTERNS) {
    cleaned = cleaned.replace(new RegExp(`^${pattern.source}\\s*`, "i"), "");
  }
  
  return cleaned.trim();
}
