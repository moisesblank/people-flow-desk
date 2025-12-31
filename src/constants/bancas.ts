// ============================================
// BANCAS BRASILEIRAS - CONSTANTES CENTRALIZADAS
// Fonte única de verdade para todas as bancas
// ============================================

export interface Banca {
  value: string;
  label: string;
  categoria: 'nacional' | 'vestibular' | 'federal' | 'estadual' | 'privada' | 'militar' | 'propria';
  organizadora?: string;
  perfil?: string[];
}

// ============= EXAMES NACIONAIS =============
const EXAMES_NACIONAIS: Banca[] = [
  { value: 'enem', label: 'ENEM', categoria: 'nacional', organizadora: 'INEP', perfil: ['contextualizacao', 'interdisciplinaridade', 'habilidades_e_competencias'] },
  { value: 'enem_2009_2012', label: 'ENEM 2009-2012', categoria: 'nacional', organizadora: 'INEP', perfil: ['contextualizacao_moderada', 'interdisciplinaridade_inicial'] },
  { value: 'enem_2013_2016', label: 'ENEM 2013-2016', categoria: 'nacional', organizadora: 'INEP', perfil: ['contextualizacao_forte', 'habilidades_e_competencias'] },
  { value: 'enem_2017_2020', label: 'ENEM 2017-2020', categoria: 'nacional', organizadora: 'INEP', perfil: ['menos_conta', 'mais_interpretacao'] },
  { value: 'enem_2021_2024', label: 'ENEM 2021-2024', categoria: 'nacional', organizadora: 'INEP', perfil: ['alta_contextualizacao', 'interdisciplinaridade_total'] },
  { value: 'enem_digital', label: 'ENEM Digital', categoria: 'nacional', organizadora: 'INEP', perfil: ['interface_digital', 'itens_adaptados'] },
  { value: 'enem_ppl', label: 'ENEM PPL', categoria: 'nacional', organizadora: 'INEP', perfil: ['mesma_matriz_do_enem_regular'] },
  { value: 'encceja', label: 'ENCCEJA', categoria: 'nacional', organizadora: 'INEP', perfil: ['educacao_de_jovens_e_adultos', 'conteudo_basico'] },
  { value: 'saeb', label: 'SAEB', categoria: 'nacional', organizadora: 'INEP', perfil: ['avaliacao_em_larga_escala', 'diagnostico_educacional'] },
];

// ============= VESTIBULARES TRADICIONAIS =============
const VESTIBULARES_TRADICIONAIS: Banca[] = [
  { value: 'fuvest', label: 'FUVEST', categoria: 'vestibular', organizadora: 'USP', perfil: ['conteudo_teorico_forte', 'interpretacao_textual', 'questoes_analiticas'] },
  { value: 'unicamp', label: 'UNICAMP', categoria: 'vestibular', organizadora: 'UNICAMP', perfil: ['contextualizacao_real', 'questoes_abertas', 'linguagem_cientifica'] },
  { value: 'unesp', label: 'UNESP', categoria: 'vestibular', organizadora: 'VUNESP', perfil: ['conteudo_equilibrado', 'objetividade'] },
  { value: 'unifesp', label: 'UNIFESP', categoria: 'vestibular', organizadora: 'VUNESP', perfil: ['alta_dificuldade', 'foco_biomedico'] },
  { value: 'ita', label: 'ITA', categoria: 'vestibular', organizadora: 'ITA', perfil: ['nivel_extremo', 'matematizacao', 'fisico_quimica_pesada'] },
  { value: 'ime', label: 'IME', categoria: 'vestibular', organizadora: 'IME', perfil: ['nivel_extremo', 'demonstracoes', 'modelagem_matematica'] },
];

// ============= UNIVERSIDADES FEDERAIS =============
const FEDERAIS: Banca[] = [
  { value: 'ufrj', label: 'UFRJ', categoria: 'federal', perfil: ['conteudo_tradicional', 'analise_conceitual'] },
  { value: 'ufmg', label: 'UFMG', categoria: 'federal', perfil: ['contextualizacao', 'conteudo_classico'] },
  { value: 'ufpe', label: 'UFPE', categoria: 'federal', perfil: ['conteudo_denso', 'interpretacao'] },
  { value: 'ufpr', label: 'UFPR', categoria: 'federal', perfil: ['primeira_fase_objetiva', 'segunda_fase_discursiva'] },
  { value: 'ufsc', label: 'UFSC', categoria: 'federal', perfil: ['conteudo_tecnico', 'objetividade'] },
  { value: 'ufrn', label: 'UFRN', categoria: 'federal', perfil: ['contextualizacao_regional'] },
];

// ============= UNIVERSIDADES ESTADUAIS =============
const ESTADUAIS: Banca[] = [
  { value: 'uerj', label: 'UERJ', categoria: 'estadual', perfil: ['conteudo_classico', 'questoes_contextualizadas'] },
  { value: 'uece', label: 'UECE', categoria: 'estadual', perfil: ['conteudo_extenso', 'objetividade'] },
  { value: 'uem', label: 'UEM', categoria: 'estadual', perfil: ['conteudo_tradicional'] },
  { value: 'uel', label: 'UEL', categoria: 'estadual', perfil: ['questoes_interpretativas'] },
];

// ============= BANCAS PRIVADAS/ORGANIZADORAS =============
const PRIVADAS: Banca[] = [
  { value: 'vunesp', label: 'VUNESP', categoria: 'privada', perfil: ['linguagem_direta', 'conteudo_objetivo'] },
  { value: 'fgv', label: 'FGV', categoria: 'privada', perfil: ['contextualizacao_economica', 'leitura_critica', 'nivel_alto'] },
  { value: 'cesgranrio', label: 'CESGRANRIO', categoria: 'privada', perfil: ['enunciados_longos', 'interpretacao'] },
  { value: 'fcc', label: 'FCC', categoria: 'privada', perfil: ['conteudo_tecnico', 'objetividade'] },
  { value: 'consulplan', label: 'CONSULPLAN', categoria: 'privada', perfil: ['conteudo_extenso', 'menos_interpretacao'] },
];

// ============= BANCAS MILITARES =============
const MILITARES: Banca[] = [
  { value: 'esa', label: 'ESA', categoria: 'militar', perfil: ['conteudo_basico', 'objetividade'] },
  { value: 'efomm', label: 'EFOMM', categoria: 'militar', perfil: ['fisico_quimica_forte', 'nivel_medio_alto'] },
  { value: 'afa', label: 'AFA', categoria: 'militar', perfil: ['conteudo_extenso', 'raciocinio_logico'] },
  { value: 'espcex', label: 'EsPCEx', categoria: 'militar', perfil: ['conteudo_tradicional', 'objetividade'] },
];

// ============= BANCAS PRÓPRIAS =============
const PROPRIAS: Banca[] = [
  { value: 'autoral_prof_moises', label: 'Questão Autoral Prof. Moisés Medeiros', categoria: 'propria', perfil: ['inedita', 'autoral', 'alinhada_ao_enem', 'alta_qualidade_didatica'] },
  { value: 'propria', label: 'Própria', categoria: 'propria', perfil: ['adaptativa', 'nivel_variavel', 'baseada_em_dados'] },
];

// ============= LISTA COMPLETA ORDENADA =============
export const BANCAS: Banca[] = [
  // Nacionais primeiro (mais usados)
  ...EXAMES_NACIONAIS,
  // Vestibulares tradicionais
  ...VESTIBULARES_TRADICIONAIS,
  // Federais
  ...FEDERAIS,
  // Estaduais
  ...ESTADUAIS,
  // Privadas
  ...PRIVADAS,
  // Militares
  ...MILITARES,
  // Próprias por último
  ...PROPRIAS,
];

// ============= LISTA SIMPLIFICADA (value/label apenas) =============
export const BANCAS_SIMPLES = BANCAS.map(b => ({ value: b.value, label: b.label }));

// ============= AGRUPADO POR CATEGORIA =============
export const BANCAS_POR_CATEGORIA = {
  nacional: EXAMES_NACIONAIS,
  vestibular: VESTIBULARES_TRADICIONAIS,
  federal: FEDERAIS,
  estadual: ESTADUAIS,
  privada: PRIVADAS,
  militar: MILITARES,
  propria: PROPRIAS,
};

// ============= LABELS DAS CATEGORIAS =============
export const CATEGORIA_LABELS: Record<Banca['categoria'], string> = {
  nacional: 'Exames Nacionais',
  vestibular: 'Vestibulares Tradicionais',
  federal: 'Universidades Federais',
  estadual: 'Universidades Estaduais',
  privada: 'Bancas Organizadoras',
  militar: 'Concursos Militares',
  propria: 'Questões Próprias',
};

// ============= HELPER: Encontrar banca por value =============
export function findBancaByValue(value: string): Banca | undefined {
  return BANCAS.find(b => b.value === value);
}

// ============= HELPER: Obter label da banca =============
export function getBancaLabel(value: string): string {
  return findBancaByValue(value)?.label || value;
}
