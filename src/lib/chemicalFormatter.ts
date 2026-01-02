// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ 🧪 CHEMICAL VISUAL STANDARDIZATION — Policy v2.0                             ║
// ╠══════════════════════════════════════════════════════════════════════════════╣
// ║ Padronização visual de notação química sem alterar significado químico       ║
// ║                                                                               ║
// ║ REGRAS VISUAIS IMUTÁVEIS:                                                    ║
// ║ 1. Índices numéricos (H2O) → SUBSCRIPT (H₂O)                                  ║
// ║ 2. Cargas iônicas (Na+, Ca2+) → SUPERSCRIPT (Na⁺, Ca²⁺)                       ║
// ║ 3. Estados físicos (s), (l), (g), (aq) → SUBSCRIPT legível                   ║
// ║ 4. Coeficientes estequiométricos → separação visual clara                    ║
// ║ 5. Setas de reação: → (direta), ⇌ (equilíbrio)                               ║
// ║                                                                               ║
// ║ JAMAIS ALTERAR SIGNIFICADO QUÍMICO — APENAS VISUAL/TIPOGRÁFICO               ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

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

// Mapa de letras para subscript Unicode (para estados físicos)
const SUBSCRIPT_LETTERS: Record<string, string> = {
  's': 'ₛ',
  'l': 'ₗ',
  'g': '₉', // g não existe em subscript Unicode, usar alternativa visual
  'a': 'ₐ',
  'q': 'q', // q não existe em subscript Unicode
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
  'n': 'ⁿ',
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
 * POLICY v2.0: Padronização visual completa
 * 
 * - Números após elementos → subscript
 * - Cargas iônicas → superscript
 * - Estados físicos → formatação consistente
 * - Coeficientes → separação clara
 * - Setas de reação → padronização
 * 
 * @param text Texto a ser formatado
 * @returns Texto com fórmulas químicas formatadas
 */
export function formatChemicalFormulas(text: string): string {
  if (!text) return '';

  let result = text;

  // ═══════════════════════════════════════════════════════════════════
  // 1. CONVERTER ÍNDICES (números após elementos) PARA SUBSCRIPT
  // ═══════════════════════════════════════════════════════════════════
  CHEMICAL_FORMULA_REGEX.lastIndex = 0;
  result = result.replace(CHEMICAL_FORMULA_REGEX, (_, element, number) => {
    return element + toSubscript(number);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 2. CONVERTER HIBRIDIZAÇÕES PARA SUPERSCRIPT (sp², sp³, sp³d², etc.)
  // ═══════════════════════════════════════════════════════════════════
  result = result.replace(/\b(sp|sp)(\d)(?=d|\b)/g, (_, base, num) => {
    return base + toSuperscript(num);
  });
  result = result.replace(/(sp[²³]?d)(\d)/g, (_, base, num) => {
    return base + toSuperscript(num);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 3. CONVERTER CARGAS IÔNICAS PARA SUPERSCRIPT
  // ═══════════════════════════════════════════════════════════════════
  // Padrão: ^2+ ou ^- após elemento/parêntese
  result = result.replace(/\^(\d*[+-])/g, (_, charge) => {
    return toSuperscript(charge);
  });

  // Padrão alternativo sem ^: Na+ Ca2+ Cl- SO42-
  result = result.replace(/([A-Z][a-z]?(?:₀|₁|₂|₃|₄|₅|₆|₇|₈|₉)*)(\d*[+-])(?=\s|$|[,.\)])/g, (_, base, charge) => {
    return base + toSuperscript(charge);
  });

  // Cargas em parênteses: (aq)2- ou SO4(2-)
  result = result.replace(/\((\d*[+-])\)/g, (_, charge) => {
    return toSuperscript(charge);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 4. PADRONIZAR ESTADOS FÍSICOS — VISUAL CONSISTENTE
  // ═══════════════════════════════════════════════════════════════════
  // Estados: (s) sólido, (l) líquido, (g) gasoso, (aq) aquoso
  // Manter legíveis mas com estilo visual consistente (parênteses pequenos)
  result = result
    .replace(/\(\s*s\s*\)/gi, '₍s₎')
    .replace(/\(\s*l\s*\)/gi, '₍l₎')
    .replace(/\(\s*g\s*\)/gi, '₍g₎')
    .replace(/\(\s*aq\s*\)/gi, '₍aq₎');

  // ═══════════════════════════════════════════════════════════════════
  // 5. PADRONIZAR SETAS DE REAÇÃO
  // ═══════════════════════════════════════════════════════════════════
  // Seta simples: -> ou --> vira →
  result = result.replace(/\s*-+>\s*/g, ' → ');
  // Seta dupla (equilíbrio): <-> ou <--> vira ⇌
  result = result.replace(/\s*<-+>\s*/g, ' ⇌ ');
  // Seta reversa: <- vira ←
  result = result.replace(/\s*<-+\s*/g, ' ← ');

  // ═══════════════════════════════════════════════════════════════════
  // 6. SEPARAR COEFICIENTES ESTEQUIOMÉTRICOS DE FÓRMULAS
  // ═══════════════════════════════════════════════════════════════════
  // Coeficiente no início: "2H2O" já está correto (2 não vira subscript porque não segue elemento)
  // Coeficiente após seta: "→ 2CO2" - garantir espaço
  result = result.replace(/(→|⇌|←)\s*(\d+)\s*([A-Z])/g, '$1 $2$3');

  return result;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ REGRAS CIENTÍFICAS IMUTÁVEIS v2.0:                                           ║
// ║ 1. Índices numéricos SEMPRE subscript (H₂O, CO₂, Na₂SO₄)                     ║
// ║ 2. Cargas iônicas SEMPRE superscript (Na⁺, Ca²⁺, Cl⁻, SO₄²⁻)                 ║
// ║ 3. Estados físicos formatados: ₍s₎, ₍l₎, ₍g₎, ₍aq₎                           ║
// ║ 4. Setas padronizadas: → (direta), ⇌ (equilíbrio), ← (reversa)               ║
// ║ 5. Coeficientes claramente separados das fórmulas                            ║
// ║ 6. Símbolos de elementos NUNCA alterados                                     ║
// ║ 7. Aplicar apenas na camada de renderização                                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
