// ============================================
// 🔥 AUDITORIA: PADRÃO UNIVERSAL DE QUESTÕES
// Componente: QuestionEnunciado
// Status: IMPLEMENTADO ✅
// Data: 2026-01-01
// ============================================

/**
 * PADRÃO UNIVERSAL — QUESTION ENTITY STANDARD v2.0
 * 
 * Todas as questões (question entity) do sistema DEVEM usar
 * o componente QuestionEnunciado para exibição.
 * 
 * ESTRUTURA OBRIGATÓRIA:
 * ┌─────────────────────────────────────────┐
 * │    BANCA HEADER (centralizado, bold)    │
 * │         ex: ENEM (2023)                 │
 * ├─────────────────────────────────────────┤
 * │                                         │
 * │    TEXTO DO ENUNCIADO (justificado)     │
 * │                                         │
 * ├─────────────────────────────────────────┤
 * │    IMAGEM (se houver, centralizada)     │
 * └─────────────────────────────────────────┘
 */

export const QUESTION_ENTITY_STANDARD = {
  version: '3.0.0',
  status: 'IMPLEMENTED',
  lastUpdated: '2026-01-03',
  
  // Componente centralizado
  component: {
    path: 'src/components/shared/QuestionEnunciado.tsx',
    exports: [
      'QuestionEnunciado (default)',
      'extractImageFromText',
      'cleanQuestionText', 
      'getQuestionImageUrl',
      'formatBancaHeader'
    ]
  },

  // Estrutura obrigatória
  mandatoryStructure: {
    bancaHeader: {
      position: 'TOP_OF_ENUNCIADO',
      alignment: 'CENTER',
      fontWeight: 'BOLD',
      textTransform: 'UPPERCASE',
      fallback: 'QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS',
      format: 'BANCA (ANO)' // ex: ENEM (2023)
    },
    questionText: {
      alignment: 'JUSTIFIED',
      whiteSpace: 'pre-wrap'
    },
    image: {
      position: 'BELOW_TEXT',
      alignment: 'CENTER',
      lazy: true,
      // POLÍTICA v1.1: Imagens 25% menores para melhor layout
      minHeight: 'min-h-[300px]',
      maxHeight: 'max-h-[900px]',
      compactMinHeight: 'max-h-48', // Modo compacto mais legível
    }
  },

  // PADRÕES DE TAMANHO PEDAGÓGICO v1.1 (25% menores)
  imageSizeStandards: {
    enunciado: {
      minHeight: 'min-h-[300px]',
      maxHeight: 'max-h-[900px]',
      compactHeight: 'max-h-48',
      principle: 'Imagens instrucionais devem ser legíveis sem zoom'
    },
    alternatives: {
      minHeight: 'min-h-[225px]',
      maxHeight: 'max-h-[600px]',
      principle: 'Tabelas, fórmulas e diagramas devem ser claramente visíveis'
    },
    resolution: {
      minHeight: 'min-h-[300px]',
      maxHeight: 'max-h-[750px]',
      principle: 'Suporte visual para explicação passo a passo'
    }
  },

  // Locais atualizados
  implementedIn: [
    {
      file: 'src/pages/gestao/GestaoQuestoes.tsx',
      context: 'Lista de questões (cards)',
      mode: 'compact (sem header)',
      props: 'banca, ano, imageUrl'
    },
    {
      file: 'src/pages/gestao/GestaoQuestaoDetalhe.tsx',
      context: 'Página de detalhe da questão',
      mode: 'full (com header)',
      props: 'banca, ano, imageUrl'
    },
    {
      file: 'src/pages/aluno/AlunoQuestoes.tsx',
      context: 'Modal de questão do aluno',
      mode: 'full (com header)',
      props: 'banca, ano, imageUrl'
    },
    {
      file: 'src/components/lms/QuizPlayer.tsx',
      context: 'Player de simulados/quizzes',
      mode: 'full (com header)',
      props: 'banca, ano, imageUrl'
    },
    {
      file: 'src/components/lms/QuestionPractice.tsx',
      context: 'Prática de questões em aulas',
      mode: 'full (com header)',
      props: 'banca, ano, imageUrl'
    }
  ],

  // Padrão de uso
  usagePattern: {
    fullMode: `
<QuestionEnunciado
  questionText={question.question_text}
  imageUrl={question.image_url}
  banca={question.banca}
  ano={question.ano}
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

  // Regras proibidas
  forbiddenPatterns: [
    'Colocar banca dentro do corpo da questão',
    'Misturar texto da banca com texto da questão',
    'Renderizar banca como texto normal',
    'Alinhar banca à esquerda',
    'Justificar header da banca'
  ],

  // Regras de banco de dados
  databaseRules: {
    table: 'quiz_questions',
    requiredColumns: ['question_text', 'banca', 'ano', 'image_url'],
    bancaColumn: 'banca (código como enem, unicamp, etc)',
    labels: 'src/constants/bancas.ts → getBancaLabel()'
  },

  // Regras de importação
  importRules: {
    file: 'src/components/gestao/questoes/QuestionImportDialog.tsx',
    behavior: 'Extrai banca/ano do Excel e popula colunas separadas'
  },

  // Métricas atuais
  metrics: {
    totalQuestions: 927,
    questionsWithBanca: 'verificar',
    questionsWithImage: 526
  },

  // Regra de ouro
  goldenRule: `
TODA exibição de questão DEVE:
1. Usar <QuestionEnunciado /> com props banca e ano
2. Mostrar header centralizado e bold (modo full)
3. Justificar texto do enunciado
4. NUNCA misturar banca no corpo do texto
`
};

export default QUESTION_ENTITY_STANDARD;
