// ============================================
// 🏛️ CONSTITUIÇÃO SYNAPSE Ω v10.4 — TAXONOMIA CANÔNICA
// ============================================
// FONTE ÚNICA DA VERDADE para TODA a taxonomia do sistema.
// QUALQUER componente que precise de MACRO, MICRO, TEMA ou SUBTEMA
// DEVE importar daqui. PROIBIDO definir listas em outros lugares.
// ============================================

import { Atom, Beaker, FlaskConical, Leaf, Dna, type LucideIcon } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// TIPOS CANÔNICOS
// ══════════════════════════════════════════════════════════════

export interface MacroConfig {
  value: string;          // Slug técnico (quimica_geral)
  label: string;          // Label para UI (Química Geral)
  icon: LucideIcon;       // Ícone Lucide
  color: string;          // Classe de cor do texto (text-amber-500)
  bgColor: string;        // Classe de fundo com opacidade (bg-amber-500/10)
  borderColor: string;    // Classe de borda (border-amber-500/30)
  hoverBg: string;        // Classe de hover (hover:bg-amber-500/20)
  gradient: string;       // Gradiente para cards (from-amber-500 to-orange-500)
  badgeClass: string;     // Classes para badges (bg-amber-500/90 text-white)
  hexColor: string;       // Cor hexadecimal para gráficos (#F59E0B)
}

// ══════════════════════════════════════════════════════════════
// 5 MACROS CANÔNICOS — CONSTITUIÇÃO v10.4
// ══════════════════════════════════════════════════════════════
// REGRA ABSOLUTA: São exatamente 5 macros. Nem mais, nem menos.
// Qualquer adição ou remoção requer INTERNAL_SECRET do OWNER.
// ══════════════════════════════════════════════════════════════

export const CANONICAL_MACROS: readonly MacroConfig[] = [
  {
    value: 'quimica_geral',
    label: 'Química Geral',
    icon: Beaker,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    hoverBg: 'hover:bg-amber-500/20',
    gradient: 'from-amber-500 to-orange-500',
    badgeClass: 'bg-amber-500/90 text-white',
    hexColor: '#F59E0B',
  },
  {
    value: 'fisico_quimica',
    label: 'Físico-Química',
    icon: Atom,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    hoverBg: 'hover:bg-cyan-500/20',
    gradient: 'from-cyan-500 to-blue-500',
    badgeClass: 'bg-cyan-500/90 text-white',
    hexColor: '#06B6D4',
  },
  {
    value: 'quimica_organica',
    label: 'Química Orgânica',
    icon: FlaskConical,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    hoverBg: 'hover:bg-purple-500/20',
    gradient: 'from-purple-500 to-violet-500',
    badgeClass: 'bg-purple-600/90 text-white',
    hexColor: '#8B5CF6',
  },
  {
    value: 'quimica_ambiental',
    label: 'Química Ambiental',
    icon: Leaf,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    hoverBg: 'hover:bg-green-500/20',
    gradient: 'from-green-500 to-emerald-500',
    badgeClass: 'bg-emerald-500/90 text-white',
    hexColor: '#10B981',
  },
  {
    value: 'bioquimica',
    label: 'Bioquímica',
    icon: Dna,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    hoverBg: 'hover:bg-pink-500/20',
    gradient: 'from-pink-500 to-rose-500',
    badgeClass: 'bg-pink-500/90 text-white',
    hexColor: '#EC4899',
  },
] as const;

// ══════════════════════════════════════════════════════════════
// HELPERS DE LOOKUP — Use estes ao invés de criar novos objetos
// ══════════════════════════════════════════════════════════════

/**
 * Mapa de VALUE → CONFIG (para lookups por slug)
 */
export const MACRO_BY_VALUE: Record<string, MacroConfig> = Object.fromEntries(
  CANONICAL_MACROS.map(m => [m.value, m])
);

/**
 * Mapa de LABEL → CONFIG (para lookups por label)
 */
export const MACRO_BY_LABEL: Record<string, MacroConfig> = Object.fromEntries(
  CANONICAL_MACROS.map(m => [m.label, m])
);

/**
 * Lista de todos os labels (para comparações, expandidos iniciais, etc.)
 */
export const ALL_MACRO_LABELS: readonly string[] = CANONICAL_MACROS.map(m => m.label);

/**
 * Lista de todos os values (para filtros, queries, etc.)
 */
export const ALL_MACRO_VALUES: readonly string[] = CANONICAL_MACROS.map(m => m.value);

// ══════════════════════════════════════════════════════════════
// FUNÇÕES DE NORMALIZAÇÃO
// ══════════════════════════════════════════════════════════════

/**
 * Slugifica qualquer string para formato de value (quimica_geral)
 */
export function slugifyTaxonomy(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Encontra config de macro por qualquer identificador (value, label, slug, hífen)
 * Retorna undefined se não encontrar
 */
export function findMacroConfig(identifier: string): MacroConfig | undefined {
  if (!identifier) return undefined;
  
  const slug = slugifyTaxonomy(identifier);
  
  // Busca direta por value ou label
  if (MACRO_BY_VALUE[identifier]) return MACRO_BY_VALUE[identifier];
  if (MACRO_BY_LABEL[identifier]) return MACRO_BY_LABEL[identifier];
  
  // Busca por slug normalizado
  return CANONICAL_MACROS.find(m => 
    slugifyTaxonomy(m.value) === slug || slugifyTaxonomy(m.label) === slug
  );
}

/**
 * Retorna o label canônico para qualquer identificador de macro
 * Retorna string vazia se não encontrar (NUNCA expõe value técnico)
 */
export function getMacroLabel(identifier: string): string {
  return findMacroConfig(identifier)?.label ?? '';
}

/**
 * Retorna o value canônico para qualquer identificador de macro
 */
export function getMacroValue(identifier: string): string {
  return findMacroConfig(identifier)?.value ?? '';
}

// ══════════════════════════════════════════════════════════════
// FORMATOS PRONTOS PARA USO EM COMPONENTES ESPECÍFICOS
// ══════════════════════════════════════════════════════════════

/**
 * Formato para Selects/Filters: { value, label }[]
 */
export const MACRO_SELECT_OPTIONS = CANONICAL_MACROS.map(m => ({
  value: m.value,
  label: m.label,
}));

/**
 * Formato para Badges: label → badgeClass
 */
export const MACRO_BADGE_CLASSES: Record<string, string> = Object.fromEntries(
  CANONICAL_MACROS.map(m => [m.label, m.badgeClass])
);

/**
 * Formato para Gráficos: value → { name, color }
 */
export const MACRO_CHART_CONFIG: Record<string, { name: string; color: string }> = Object.fromEntries(
  CANONICAL_MACROS.map(m => [m.value, { name: m.label, color: m.hexColor }])
);

// ══════════════════════════════════════════════════════════════
// VALIDAÇÕES
// ══════════════════════════════════════════════════════════════

/**
 * Verifica se um identificador corresponde a um macro válido
 */
export function isValidMacro(identifier: string): boolean {
  return findMacroConfig(identifier) !== undefined;
}

/**
 * Filtra uma lista mantendo apenas macros válidos
 */
export function filterValidMacros(identifiers: string[]): string[] {
  return identifiers.filter(isValidMacro);
}
