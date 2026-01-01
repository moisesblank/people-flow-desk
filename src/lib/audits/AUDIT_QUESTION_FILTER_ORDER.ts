// ============================================
// 📋 ORDEM CANÔNICA DE FILTROS DE QUESTÕES
// LEI CONSTITUCIONAL - PADRÃO OBRIGATÓRIO
// ============================================
// 
// Este documento define a ORDEM IMUTÁVEL de filtros em
// TODAS as áreas de questões do sistema.
//
// Data de vigência: 2026-01-01
// Status: ATIVO E OBRIGATÓRIO
// ============================================

export const QUESTION_FILTER_ORDER_STANDARD = {
  version: '1.0.0',
  status: 'CONSTITUTIONAL_LAW',
  lastUpdated: '2026-01-01',
  
  // ================================================
  // ORDEM CANÔNICA DOS FILTROS (OBRIGATÓRIO)
  // ================================================
  canonicalOrder: [
    { position: 1, name: 'Macroassuntos', stateKey: 'macroFilter', placeholder: 'Macroassuntos: Todos' },
    { position: 2, name: 'Micro Assunto', stateKey: 'microFilter', placeholder: 'Micro: Todos' },
    { position: 3, name: 'Ano', stateKey: 'anoFilter', placeholder: 'Ano: Todos' },
    { position: 4, name: 'Banca', stateKey: 'bancaFilter', placeholder: 'Banca: Todas' },
    { position: 5, name: 'Dificuldade', stateKey: 'difficultyFilter', placeholder: 'Dificuldade: Todas' },
    { position: 6, name: 'Ordenação', stateKey: 'sortOrder', placeholder: 'Mais recentes' },
  ],

  // ================================================
  // OPÇÕES DE ORDENAÇÃO (OBRIGATÓRIO)
  // ================================================
  sortOrderOptions: [
    { value: 'newest', label: '📅 Mais recentes' },
    { value: 'oldest', label: '📅 Mais antigas' },
    { value: 'ano_desc', label: '🗓️ Ano ↓' },
    { value: 'ano_asc', label: '🗓️ Ano ↑' },
    { value: 'difficulty_asc', label: '📊 Fácil → Difícil' },
    { value: 'difficulty_desc', label: '📊 Difícil → Fácil' },
    { value: 'alphabetical', label: '🔤 Alfabética' },
  ],

  // ================================================
  // OPÇÕES DE DIFICULDADE (OBRIGATÓRIO)
  // ================================================
  difficultyOptions: [
    { value: 'all', label: 'Dificuldade: Todas' },
    { value: 'facil', label: '🟢 Fácil' },
    { value: 'medio', label: '🟡 Médio' },
    { value: 'dificil', label: '🔴 Difícil' },
  ],

  // ================================================
  // ARQUIVOS IMPLEMENTADOS
  // ================================================
  implementedIn: [
    {
      file: 'src/pages/gestao/GestaoQuestoes.tsx',
      context: 'Gestão de Questões (Admin)',
      status: 'COMPLETO',
      layout: 'Grid 6 colunas (lg:grid-cols-6)',
      linha: 'Filtros em grid único',
    },
    {
      file: 'src/pages/aluno/AlunoQuestoes.tsx',
      context: 'Banco de Questões (Aluno)',
      status: 'COMPLETO',
      layout: 'Grid + Linha flexível',
      linha: 'Hierárquico (Macro→Micro→Tema→Subtema) + Secundário (Ano→Banca→Dificuldade→Ordenação)',
    },
  ],

  // ================================================
  // ARQUIVOS SEM UI DE FILTROS (RECEBEM PROPS)
  // ================================================
  noFilterUI: [
    {
      file: 'src/components/lms/QuestionPractice.tsx',
      reason: 'Recebe filtros como props (subject, topic, difficulty)',
    },
    {
      file: 'src/components/lms/QuizPlayer.tsx',
      reason: 'Recebe questões já filtradas de um simulado',
    },
  ],

  // ================================================
  // REGRAS PROIBIDAS
  // ================================================
  forbiddenPatterns: [
    'Dificuldade antes de Macroassuntos',
    'Banca antes de Ano',
    'Ordenação em qualquer posição exceto a última',
    'Macro depois de Micro',
    'Filtros sem placeholder padrão',
    'Ordem inconsistente entre Gestão e Aluno',
  ],

  // ================================================
  // REGRA DE OURO
  // ================================================
  goldenRule: `
TODA interface de filtros de questões DEVE seguir:

ORDEM: Macroassuntos → Micro → Ano → Banca → Dificuldade → Ordenação

Esta ordem é CONSTITUCIONAL e IMUTÁVEL.
Aplica-se a TODAS as áreas: Gestão, Aluno, Simulados, etc.
Novos filtros devem ser inseridos ANTES de Ordenação.
`,
} as const;

export default QUESTION_FILTER_ORDER_STANDARD;
