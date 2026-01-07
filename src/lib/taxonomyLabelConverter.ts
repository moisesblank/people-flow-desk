// ============================================
// 🏛️ UTILITÁRIO CENTRAL: Taxonomia Value → Label
// Constituição SYNAPSE Ω v10.4 — Question Domain
// 
// PROBLEMA: Os selects de taxonomia usam `value` (slugs normalizados),
// mas a tabela quiz_questions armazena `label` (texto original).
// 
// SOLUÇÃO: Converter value→label antes de aplicar filtros no banco.
// ============================================

/**
 * Remove emojis/ícones do início do label (ex: "⚗️ Química Geral" → "Química Geral")
 */
export function stripTaxonomyEmoji(label?: string | null): string {
  if (!label) return '';
  return label.replace(/^[^\p{L}\p{N}]+/gu, '').trim();
}

/**
 * Interface para item de taxonomia (usado nos selects)
 */
export interface TaxonomySelectItem {
  value: string;
  label: string;
  children?: TaxonomySelectItem[];
}

/**
 * Converte o value de um macro select para o label armazenado no banco
 */
export function convertMacroValueToLabel(
  macroValue: string,
  macros: TaxonomySelectItem[]
): string {
  if (!macroValue || macroValue === 'all' || macroValue === 'todas') {
    return macroValue;
  }
  const found = macros.find(m => m.value === macroValue);
  return stripTaxonomyEmoji(found?.label) || macroValue;
}

/**
 * Converte o value de um micro select para o label armazenado no banco
 */
export function convertMicroValueToLabel(
  microValue: string,
  macroValue: string,
  getMicrosForSelect: (macro: string) => TaxonomySelectItem[]
): string {
  if (!microValue || microValue === 'all' || microValue === 'todas') {
    return microValue;
  }
  const effectiveMacro = macroValue === 'todas' || macroValue === 'all' ? '' : macroValue;
  const micros = getMicrosForSelect(effectiveMacro);
  const found = micros.find(m => m.value === microValue);
  return stripTaxonomyEmoji(found?.label) || microValue;
}

/**
 * Converte o value de um tema select para o label armazenado no banco
 */
export function convertTemaValueToLabel(
  temaValue: string,
  microValue: string,
  getTemasForSelect: (micro: string) => TaxonomySelectItem[]
): string {
  if (!temaValue || temaValue === 'all' || temaValue === 'todas') {
    return temaValue;
  }
  const effectiveMicro = microValue === 'todas' || microValue === 'all' ? '' : microValue;
  const temas = getTemasForSelect(effectiveMicro);
  const found = temas.find(t => t.value === temaValue);
  return stripTaxonomyEmoji(found?.label) || temaValue;
}

/**
 * Converte o value de um subtema select para o label armazenado no banco
 */
export function convertSubtemaValueToLabel(
  subtemaValue: string,
  temaValue: string,
  getSubtemasForSelect: (tema: string) => TaxonomySelectItem[]
): string {
  if (!subtemaValue || subtemaValue === 'all' || subtemaValue === 'todas') {
    return subtemaValue;
  }
  const effectiveTema = temaValue === 'todas' || temaValue === 'all' ? '' : temaValue;
  const subtemas = getSubtemasForSelect(effectiveTema);
  const found = subtemas.find(s => s.value === subtemaValue);
  return stripTaxonomyEmoji(found?.label) || subtemaValue;
}

/**
 * Tipo para os filtros de taxonomia já convertidos para labels
 */
export interface TaxonomyLabelsForQuery {
  macroLabel: string | null;
  microLabel: string | null;
  temaLabel: string | null;
  subtemaLabel: string | null;
}

/**
 * Converte todos os filtros de taxonomia de uma vez
 */
export function convertAllTaxonomyFiltersToLabels(
  filters: {
    macro?: string;
    micro?: string;
    tema?: string;
    subtema?: string;
  },
  taxonomyHelpers: {
    macros: TaxonomySelectItem[];
    getMicrosForSelect: (macro: string) => TaxonomySelectItem[];
    getTemasForSelect?: (micro: string) => TaxonomySelectItem[];
    getSubtemasForSelect?: (tema: string) => TaxonomySelectItem[];
  }
): TaxonomyLabelsForQuery {
  const { macro, micro, tema, subtema } = filters;
  const { macros, getMicrosForSelect, getTemasForSelect, getSubtemasForSelect } = taxonomyHelpers;

  const macroLabel = macro && macro !== 'all' && macro !== 'todas'
    ? convertMacroValueToLabel(macro, macros)
    : null;

  const microLabel = micro && micro !== 'all' && micro !== 'todas'
    ? convertMicroValueToLabel(micro, macro || '', getMicrosForSelect)
    : null;

  const temaLabel = tema && tema !== 'all' && tema !== 'todas' && getTemasForSelect
    ? convertTemaValueToLabel(tema, micro || '', getTemasForSelect)
    : null;

  const subtemaLabel = subtema && subtema !== 'all' && subtema !== 'todas' && getSubtemasForSelect
    ? convertSubtemaValueToLabel(subtema, tema || '', getSubtemasForSelect)
    : null;

  return { macroLabel, microLabel, temaLabel, subtemaLabel };
}
