// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ 🧪 CHEMICAL VISUAL STANDARDIZATION & CLEANUP — Policy v2.1                   ║
// ╠══════════════════════════════════════════════════════════════════════════════╣
// ║ Padronização visual + limpeza de notação química sem alterar significado     ║
// ║                                                                               ║
// ║ REGRAS VISUAIS IMUTÁVEIS:                                                    ║
// ║ 1. Índices numéricos (H2O) → SUBSCRIPT (H₂O)                                  ║
// ║ 2. Cargas iônicas (Na+, Ca2+) → SUPERSCRIPT (Na⁺, Ca²⁺)                       ║
// ║ 3. Estados físicos (s), (l), (g), (aq) → SUBSCRIPT legível                   ║
// ║ 4. Coeficientes estequiométricos → separação visual clara                    ║
// ║ 5. Setas de reação: → (direta), ⇌ (equilíbrio)                               ║
// ║ 6. LIMPEZA: Remover símbolos decorativos/emoji-like (里, ⚠️, etc.)            ║
// ║                                                                               ║
// ║ JAMAIS ALTERAR SIGNIFICADO QUÍMICO — APENAS VISUAL/TIPOGRÁFICO/LIMPEZA       ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ═══════════════════════════════════════════════════════════════════════════════
// SÍMBOLOS PROIBIDOS EM NOTAÇÃO QUÍMICA (Policy v2.2)
// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTANTE: NÃO remover setas (→ ⇌ ← ⇒) ou símbolos científicos (Δ ° ± × ÷)
// Apenas emojis decorativos e símbolos sem significado químico
const FORBIDDEN_CHEMICAL_SYMBOLS = /[里吝溺✨]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]/gu;

// SÍMBOLOS CIENTÍFICOS PRESERVADOS (NUNCA REMOVER):
// → ⇌ ← ⇒ (setas de reação)
// Δ (delta termodinâmico)
// ° (graus)
// ± × ÷ (operadores matemáticos)
// ₀₁₂₃₄₅₆₇₈₉ (subscripts)
// ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ (superscripts)

/**
 * Remove símbolos decorativos e emoji-like da notação química
 * Policy v2.2: Limpeza visual SEM remover setas ou símbolos científicos
 */
function cleanChemicalSymbols(text: string): string {
  return text.replace(FORBIDDEN_CHEMICAL_SYMBOLS, '').replace(/\s{2,}/g, ' ').trim();
}

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

  // ═══════════════════════════════════════════════════════════════════
  // 0. LIMPEZA DE SÍMBOLOS PROIBIDOS (Policy v2.1)
  // ═══════════════════════════════════════════════════════════════════
  let result = cleanChemicalSymbols(text);

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
  // 4. PADRONIZAR ESTADOS FÍSICOS — TOKEN SEGURO (renderizado em React)
  // ═══════════════════════════════════════════════════════════════════
  // Motivo: strings em React escapam HTML, então usamos um token e renderizamos
  // como <sub> no componente (QuestionEnunciado/QuestionResolution).
  // Ex.: CO2(g) -> CO₂⟦state:g⟧ -> CO₂(g) com tamanho igual ao "₂".
  result = result
    .replace(/\(\s*s\s*\)/gi, '⟦state:s⟧')
    .replace(/\(\s*l\s*\)/gi, '⟦state:l⟧')
    .replace(/\(\s*g\s*\)/gi, '⟦state:g⟧')
    .replace(/\(\s*v\s*\)/gi, '⟦state:v⟧')
    .replace(/\(\s*aq\s*\)/gi, '⟦state:aq⟧');

  // ═══════════════════════════════════════════════════════════════════
  // 5. PADRONIZAR E RESTAURAR SETAS DE REAÇÃO — LEI v2.3
  // ═══════════════════════════════════════════════════════════════════
  // Seta simples: -> ou --> vira →
  result = result.replace(/\s*-+>\s*/g, ' → ');
  // Seta dupla (equilíbrio): <-> ou <--> vira ⇌
  result = result.replace(/\s*<-+>\s*/g, ' ⇌ ');
  // Seta reversa: <- vira ←
  result = result.replace(/\s*<-+\s*/g, ' ← ');
  
  // ═══════════════════════════════════════════════════════════════════
  // 5b. RESTAURAR SETAS AUSENTES EM REAÇÕES QUÍMICAS — LEI v2.3
  // ═══════════════════════════════════════════════════════════════════
  // Detecta padrão: estado físico + espaço + coeficiente + fórmula (sem seta)
  // Ex: "C₃H₈(g) + 5 O₂(g) 3 CO₂(g)" → "C₃H₈(g) + 5 O₂(g) → 3 CO₂(g)"
  // Padrão: ⟦state:X⟧ ou ₍X₎ seguido de espaço e número + elemento (sem +)
  
  // Padrão com token de estado: ⟦state:g⟧ 3 CO₂
  result = result.replace(
    /(⟦state:[sglvaq]+⟧)\s+(\d+)\s*([A-Z][a-z]?)/g,
    (match, state, coef, element) => {
      // Verificar se já tem seta antes
      const beforeMatch = result.substring(0, result.indexOf(match));
      const lastChars = beforeMatch.slice(-5);
      if (lastChars.includes('→') || lastChars.includes('⇌') || lastChars.includes('←')) {
        return match; // Já tem seta, não adicionar
      }
      return `${state} → ${coef}${element}`;
    }
  );
  
  // Padrão com subscript de estado: ₍g₎ 3 CO₂ ou (g) 3 CO₂
  result = result.replace(
    /(\([sglvaq]+\)|₍[sglvaq]+₎)\s+(\d+)\s*([A-Z][a-z]?)/gi,
    (match, state, coef, element) => {
      // Verificar se já tem seta antes (checagem simples)
      return `${state} → ${coef}${element}`;
    }
  );
  
  // Padrão genérico: fórmula química + espaço + coeficiente + fórmula (sem +/→ entre)
  // Ex: "H₂O 2 CO₂" → "H₂O → 2 CO₂" (quando não há + entre eles)
  result = result.replace(
    /([A-Z][a-z]?(?:₀|₁|₂|₃|₄|₅|₆|₇|₈|₉)+(?:⟦state:[sglvaq]+⟧)?)\s+(\d+)\s*([A-Z][a-z]?(?:₀|₁|₂|₃|₄|₅|₆|₇|₈|₉)*)/g,
    (match, formula1, coef, formula2) => {
      // Não inserir seta se for parte de uma soma (+ antes ou depois)
      if (match.includes('+')) return match;
      return `${formula1} → ${coef}${formula2}`;
    }
  );

  // ═══════════════════════════════════════════════════════════════════
  // 6. SEPARAR COEFICIENTES ESTEQUIOMÉTRICOS DE FÓRMULAS
  // ═══════════════════════════════════════════════════════════════════
  // Coeficiente no início: "2H2O" já está correto (2 não vira subscript porque não segue elemento)
  // Coeficiente após seta: "→ 2CO2" - garantir espaço
  result = result.replace(/(→|⇌|←)\s*(\d+)\s*([A-Z])/g, '$1 $2$3');

  // ═══════════════════════════════════════════════════════════════════
  // 7. NORMALIZAÇÃO DO DELTA (Δ) — TERMOQUÍMICA E FÍSICO-QUÍMICA
  // ═══════════════════════════════════════════════════════════════════
  // Corrige casos onde o Δ foi removido ou nunca existiu
  // Padrões: "H = -393 kJ" → "ΔH = -393 kJ"
  //          "S = +50 J" → "ΔS = +50 J"
  //          "G = -100 kJ" → "ΔG = -100 kJ"
  // Apenas em contextos termodinâmicos (seguido de = e valor numérico)
  
  // Padrão: H/S/G isolado seguido de = e número (com possível sinal)
  // NÃO captura: pH, CH4, OH-, NH3, etc.
  // Suporta unidades por mol: kJ/mol, kJ mol-1, kJ·mol⁻¹
  result = result.replace(
    /(?<![A-Za-zα-ωΑ-Ω₀-₉])([HSG])\s*=\s*([\-−–+]?\s*\d+[.,]?\d*)\s*(kJ|kcal|J|cal)(\s*(?:\/\s*mol|mol\s*-?1|\u00B7\s*mol\u207B\u00B9|\u00B7\s*mol-1))?/gi,
    (_match, letter, value, unit, perMol) => {
      const cleanValue = String(value).replace(/\s/g, '').replace(/[−–]/g, '-');
      const suffix = (perMol || '').replace(/\s{2,}/g, ' ').trim();
      const unitWithSuffix = suffix ? `${unit}${suffix.startsWith('/') ? '' : ' '}${suffix}` : unit;
      return `Δ${String(letter).toUpperCase()} = ${cleanValue} ${unitWithSuffix}`;
    }
  );
  
  // Padrão: ΔH já existe mas com espaçamento inconsistente
  result = result.replace(/Δ\s+([HSG])\s*=/gi, 'Δ$1 =');
  
  // Padrão: DeltaH ou deltaH → ΔH
  result = result.replace(/\b[Dd]elta\s*([HSG])\b/g, 'Δ$1');
  
  // Padrão: variação de entalpia sem símbolo
  result = result.replace(/\bvaria[çc][ãa]o\s+de\s+entalpia\b/gi, 'ΔH (variação de entalpia)');

  return result;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ REGRAS CIENTÍFICAS IMUTÁVEIS v2.2:                                           ║
// ║ 1. Índices numéricos SEMPRE subscript (H₂O, CO₂, Na₂SO₄)                     ║
// ║ 2. Cargas iônicas SEMPRE superscript (Na⁺, Ca²⁺, Cl⁻, SO₄²⁻)                 ║
// ║ 3. Estados físicos formatados: ₍s₎, ₍l₎, ₍g₎, ₍aq₎                           ║
// ║ 4. Setas padronizadas: → (direta), ⇌ (equilíbrio), ← (reversa)               ║
// ║ 5. Coeficientes claramente separados das fórmulas                            ║
// ║ 6. Símbolos de elementos NUNCA alterados                                     ║
// ║ 7. LIMPEZA: Símbolos decorativos/emoji removidos automaticamente             ║
// ║ 8. Aplicar apenas na camada de renderização                                  ║
// ║ 9. DELTA (Δ) OBRIGATÓRIO: ΔH, ΔS, ΔG em contextos termodinâmicos             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
