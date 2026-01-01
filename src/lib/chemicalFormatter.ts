// ============================================
// 🧪 CHEMICAL FORMULA FORMATTER
// Converte números em fórmulas químicas para subscript
// Regra científica: índices numéricos SEMPRE subscript
// ============================================

// Mapa de dígitos para subscript Unicode
const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
};

// Mapa de dígitos para superscript Unicode (para cargas iônicas)
const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
};

/**
 * Converte dígitos para subscript Unicode
 */
function toSubscript(num: string): string {
  return num.split('').map(d => SUBSCRIPT_MAP[d] || d).join('');
}

/**
 * Converte dígitos e sinais para superscript Unicode (cargas iônicas)
 */
function toSuperscript(str: string): string {
  return str.split('').map(c => SUPERSCRIPT_MAP[c] || c).join('');
}

/**
 * Regex para detectar fórmulas químicas
 * Captura: Elemento (1-2 letras, primeira maiúscula) + Número
 * Exemplos: H2, Na2, CO2, H2SO4
 */
const CHEMICAL_FORMULA_REGEX = /([A-Z][a-z]?)(\d+)/g;

/**
 * Formata texto convertendo fórmulas químicas para notação científica correta
 * - Números após elementos → subscript
 * - Cargas iônicas → superscript
 * 
 * @param text Texto a ser formatado
 * @returns Texto com fórmulas químicas formatadas
 */
export function formatChemicalFormulas(text: string): string {
  if (!text) return '';

  let result = text;

  // 1. Converter índices (números após elementos) para subscript
  // Reset regex lastIndex
  CHEMICAL_FORMULA_REGEX.lastIndex = 0;
  result = result.replace(CHEMICAL_FORMULA_REGEX, (_, element, number) => {
    return element + toSubscript(number);
  });

  // 2. Converter cargas iônicas para superscript
  // Padrão: ^2+ ou ^- após elemento/parêntese
  result = result.replace(/\^(\d*[+-])/g, (_, charge) => {
    return toSuperscript(charge);
  });

  // 3. Padrão alternativo sem ^: Na+ Ca2+ Cl-
  // Apenas quando seguido por espaço ou fim de string
  result = result.replace(/([A-Z][a-z]?(?:₀|₁|₂|₃|₄|₅|₆|₇|₈|₉)*)(\d*[+-])(?=\s|$|[,.\)])/g, (_, base, charge) => {
    return base + toSuperscript(charge);
  });

  return result;
}

// ============================================
// REGRAS CIENTÍFICAS:
// 1. Índices numéricos SEMPRE subscript (H₂O, CO₂)
// 2. Cargas iônicas SEMPRE superscript (Na⁺, Ca²⁺, Cl⁻)
// 3. Símbolos de elementos NUNCA alterados
// 4. Aplicar apenas na camada de renderização
// ============================================
