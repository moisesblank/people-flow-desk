// ============================================
// 🔥 AUDITORIA: PADRÃO UNIVERSAL DE IMAGEM EM QUESTÕES
// Componente: QuestionEnunciado
// Status: IMPLEMENTADO ✅
// Data: 2026-01-01
// ============================================

/**
 * PADRÃO UNIVERSAL — QUESTION IMAGE STANDARD v1.0
 * 
 * Todas as questões (question entity) do sistema DEVEM usar
 * o componente QuestionEnunciado para exibição.
 * 
 * Este padrão garante:
 * 1. Extração automática de imagens do texto [IMAGEM: URL]
 * 2. Priorização do campo image_url do banco
 * 3. Limpeza do texto (remove tag [IMAGEM:])
 * 4. Exibição consistente em todos os contextos
 */

export const QUESTION_IMAGE_STANDARD = {
  version: '1.0.0',
  status: 'IMPLEMENTED',
  lastUpdated: '2026-01-01',
  
  // Componente centralizado
  component: {
    path: 'src/components/shared/QuestionEnunciado.tsx',
    exports: [
      'QuestionEnunciado (default)',
      'extractImageFromText',
      'cleanQuestionText', 
      'getQuestionImageUrl'
    ]
  },

  // Locais atualizados
  implementedIn: [
    {
      file: 'src/pages/gestao/GestaoQuestoes.tsx',
      context: 'Lista de questões (cards)',
      mode: 'compact',
      line: '~1822'
    },
    {
      file: 'src/pages/gestao/GestaoQuestaoDetalhe.tsx',
      context: 'Página de detalhe da questão',
      mode: 'full',
      line: '~364'
    },
    {
      file: 'src/pages/aluno/AlunoQuestoes.tsx',
      context: 'Modal de questão + lista compacta',
      mode: 'full + cleanText',
      line: '~492, ~1109'
    },
    {
      file: 'src/components/lms/QuizPlayer.tsx',
      context: 'Player de simulados/quizzes',
      mode: 'full + cleanText',
      line: '~168, ~438'
    },
    {
      file: 'src/components/lms/QuestionPractice.tsx',
      context: 'Prática de questões em aulas',
      mode: 'full',
      line: '~267'
    }
  ],

  // Padrão de uso
  usagePattern: {
    fullMode: `
<QuestionEnunciado
  questionText={question.question_text}
  imageUrl={question.image_url}
  textSize="base"
  showImageLabel
/>`,
    compactMode: `
<QuestionEnunciado
  questionText={question.question_text}
  imageUrl={question.image_url}
  textSize="sm"
  compact
  showImageLabel={false}
/>`,
    textOnlyClean: `
import { cleanQuestionText } from '@/components/shared/QuestionEnunciado';
<p>{cleanQuestionText(question.question_text)}</p>`
  },

  // Regras do banco de dados
  databaseRules: {
    table: 'quiz_questions',
    imageColumn: 'image_url',
    textColumn: 'question_text',
    migration: '20260101111126_dc41d247-b659-47f1-b2ea-89d8c5dc8cab.sql',
    extractionQuery: `
UPDATE quiz_questions 
SET 
  image_url = substring(question_text FROM '\\[IMAGEM:\\s*(https?://[^\\]\\s]+)\\]'),
  question_text = regexp_replace(question_text, '\\[IMAGEM:\\s*https?://[^\\]]+\\]', '', 'gi')
WHERE question_text ~* '\\[IMAGEM:\\s*https?://'
  AND (image_url IS NULL OR image_url = '')`
  },

  // Regras de importação
  importRules: {
    file: 'src/components/gestao/questoes/QuestionImportDialog.tsx',
    extractionPattern: /\[IMAGEM:\s*(https?:\/\/[^\]\s]+)\]/i,
    behavior: 'Extrai imagem do texto e popula image_url automaticamente'
  },

  // Métricas atuais
  metrics: {
    totalQuestions: 927,
    questionsWithImage: 526,
    coverage: '56.7%'
  },

  // Próximos passos
  pendingItems: [
    {
      file: 'src/components/player/tabs/QuizTab.tsx',
      issue: 'Usa dados estáticos SAMPLE_QUESTIONS (não afeta produção)',
      priority: 'LOW'
    }
  ],

  // Regra de ouro
  goldenRule: `
TODA exibição de question_text DEVE usar:
1. <QuestionEnunciado /> para exibição completa
2. cleanQuestionText() para texto inline
NUNCA exibir question_text diretamente sem tratamento.
`
};

export default QUESTION_IMAGE_STANDARD;
