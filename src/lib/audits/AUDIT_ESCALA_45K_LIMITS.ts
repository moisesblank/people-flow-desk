// ============================================
// 📋 AUDITORIA DE LIMITES — ESCALA 45K
// LEI CONSTITUCIONAL - PADRÃO OBRIGATÓRIO
// ============================================
// 
// Este documento define os LIMITES DE ESCALA para
// TODAS as queries que buscam dados massivos no sistema.
//
// Data de vigência: 2026-01-02
// Status: ATIVO E OBRIGATÓRIO
// ============================================

export const ESCALA_45K_LIMITS = {
  version: '1.0.0',
  status: 'CONSTITUTIONAL_LAW',
  lastUpdated: '2026-01-02',
  
  // ================================================
  // LIMITE MÁXIMO SUPORTADO
  // ================================================
  maxSupportedRecords: 45000,
  
  // ================================================
  // REGRAS DE LIMITE POR TIPO DE DADO
  // ================================================
  limits: {
    // QUESTÕES - Sem limite artificial (paginação client-side)
    quiz_questions: {
      limit: null, // Sem .limit() - carrega tudo
      pagination: 'client-side',
      itemsPerPage: 100,
      rationale: 'Questões são carregadas integralmente para filtros rápidos'
    },
    
    // TENTATIVAS DE QUESTÃO - Limite alto por usuário
    quiz_answers: {
      limit: 45000,
      filter: 'user_id',
      rationale: 'Filtrado por usuário para evitar sobrecarga'
    },
    
    // FLASHCARDS - Limite alto por usuário
    study_flashcards: {
      limit: 45000,
      filter: 'user_id',
      rationale: 'Suporta usuários com muitos cards'
    },
    
    // LOGS DE AUDITORIA - Limite moderado (diagnóstico)
    audit_logs: {
      limit: 10000,
      rationale: 'Logs de diagnóstico, não precisa de escala total'
    },
    
    // ARQUIVOS DE STORAGE - Limite alto
    storage_files: {
      limit: 10000,
      rationale: 'Listagem de arquivos por bucket'
    },
    
    // IMPORT HISTORY - Limite baixo (apenas recentes)
    question_import_history: {
      limit: 50,
      rationale: 'Apenas histórico recente é relevante'
    },
    
    // INTEGRATION EVENTS - Limite moderado
    integration_events: {
      limit: 100,
      rationale: 'Diagnóstico de integrações recentes'
    }
  },
  
  // ================================================
  // ARQUIVOS AUDITADOS E CORRIGIDOS
  // ================================================
  auditedFiles: [
    {
      file: 'src/pages/gestao/GestaoQuestoes.tsx',
      status: 'CORRIGIDO',
      previousLimit: 'default (1000)',
      newLimit: 45000,
      notes: 'Adicionado .limit(45000) para superar default Supabase'
    },
    {
      file: 'src/pages/aluno/AlunoQuestoes.tsx',
      status: 'CORRIGIDO',
      previousLimit: 'default (1000)',
      newLimit: 45000,
      notes: 'Adicionado .limit(45000) para MODO_TREINO'
    },
    {
      file: 'src/pages/aluno/AlunoSimulados.tsx',
      status: 'CORRIGIDO',
      previousLimit: 100,
      newLimit: null,
      notes: 'Removido .limit(100)'
    },
    {
      file: 'src/pages/Simulados.tsx',
      status: 'CORRIGIDO',
      previousLimit: 100,
      newLimit: null,
      notes: 'Removido .limit(100)'
    },
    {
      file: 'src/hooks/useQuestionPractice.ts',
      status: 'CORRIGIDO',
      previousLimit: 1000,
      newLimit: 45000,
      notes: 'Aumentado para escala 45K'
    },
    {
      file: 'src/hooks/useFlashcards.ts',
      status: 'CORRIGIDO',
      previousLimit: 1000,
      newLimit: 45000,
      notes: 'Aumentado para escala 45K'
    },
    {
      file: 'src/hooks/useAuditLog.ts',
      status: 'CORRIGIDO',
      previousLimit: 1000,
      newLimit: 10000,
      notes: 'Aumentado para diagnóstico amplo'
    },
    {
      file: 'src/components/layout/StorageAndBackupWidget.tsx',
      status: 'CORRIGIDO',
      previousLimit: 1000,
      newLimit: 10000,
      notes: 'Aumentado para listar mais arquivos'
    }
  ],
  
  // ================================================
  // LIMITES PROIBIDOS
  // ================================================
  forbiddenLimits: [
    {
      value: 1000,
      reason: 'Limite padrão do Supabase - NUNCA usar implicitamente'
    }
  ],
  
  // ================================================
  // REGRA DE OURO
  // ================================================
  goldenRule: `
TODA query de dados massivos DEVE:

1. NÃO usar .limit() se for carregar para paginação client-side
2. Usar .limit(45000) se precisar de limite explícito
3. NUNCA usar .limit(1000) - este é o default do Supabase

Para questões e conteúdo acadêmico:
- Carregar tudo e paginar no frontend (100 itens/página)
- Total exibido deve refletir o COUNT real do banco

Esta regra é CONSTITUCIONAL e IMUTÁVEL.
`
} as const;

export default ESCALA_45K_LIMITS;
