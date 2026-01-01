// ============================================
// 🔒 CONSTITUIÇÃO DO PADRÃO DE EXIBIÇÃO DE QUESTÕES
// STATUS: VIGENTE E IMUTÁVEL
// VERSÃO: 1.0.0
// DATA: 2026-01-01
// AUTORIDADE: OWNER (moisesblank@gmail.com)
// ============================================

/**
 * REGRA DE OURO:
 * TODA questão DEVE usar QuestionEnunciado + QuestionResolution
 * NUNCA usar <p> simples para renderizar explanation
 * IMAGENS sempre max-h-[900px]
 * FÓRMULAS QUÍMICAS sempre formatadas
 */

export const QUESTION_DISPLAY_STANDARD = {
  version: '1.0.0',
  status: 'VIGENTE_E_IMUTAVEL',
  lastUpdated: '2026-01-01',
  authority: 'OWNER',

  // ============================================
  // 1. COMPONENTE DE ENUNCIADO
  // ============================================
  enunciado: {
    component: 'QuestionEnunciado',
    path: 'src/components/shared/QuestionEnunciado.tsx',
    
    structure: {
      bancaHeader: {
        position: 'TOP',
        alignment: 'CENTER',
        fontWeight: 'BOLD',
        textTransform: 'UPPERCASE',
        fallback: 'QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS',
        format: 'BANCA (ANO)',
      },
      questionText: {
        position: 'MIDDLE',
        alignment: 'JUSTIFY',
        formatting: 'CHEMICAL_FORMULAS_ENABLED',
        lineClamp: 'NONE (full) | 3 (compact mode)',
      },
      image: {
        position: 'BOTTOM',
        maxHeight: 'max-h-[900px]',
        objectFit: 'contain',
        lazyLoading: true,
        showLabel: true,
      },
    },

    props: {
      required: ['questionText'],
      optional: ['imageUrl', 'banca', 'ano', 'textSize', 'className', 'showImageLabel', 'maxImageHeight', 'compact', 'hideHeader'],
    },

    usage: `
      <QuestionEnunciado
        questionText={question.question_text}
        imageUrl={question.image_url}
        banca={question.banca}
        ano={question.ano}
        textSize="base"
        showImageLabel
        maxImageHeight="max-h-[900px]"
      />
    `,
  },

  // ============================================
  // 2. COMPONENTE DE RESOLUÇÃO
  // ============================================
  resolution: {
    component: 'QuestionResolution',
    path: 'src/components/shared/QuestionResolution.tsx',
    version: '2.0.0',
    lastUpdated: '2026-01-01',

    parserIntelligente: {
      enabled: true,
      description: 'Parser AVANÇADO que detecta ALTERNATIVAS (A-E), AFIRMAÇÕES (I-V) e seções especiais, organizando em blocos visuais SEPARADOS',
      features: [
        'Detecção de alternativas corretas/erradas/análise',
        'Detecção de afirmações corretas/incorretas',
        'Agrupamento inteligente por categoria',
        'Bordas laterais coloridas para indicar status',
        'Header + conteúdo em cada bloco',
      ],
    },

    sections: [
      {
        type: 'alternativa_correta',
        pattern: /[✅✔️✓]\s*Alternativa\s*([A-E])/gi,
        icon: 'CheckCircle',
        color: 'green',
        borderStyle: 'border-l-4 border-l-green-500',
        title: '✅ ALTERNATIVA {letter} — CORRETA',
      },
      {
        type: 'alternativa_errada',
        pattern: /[❌✖️✗]\s*Alternativa\s*([A-E])/gi,
        icon: 'XCircle',
        color: 'red',
        borderStyle: 'border-l-4 border-l-red-500',
        title: '❌ ALTERNATIVA {letter} — ERRADA',
      },
      {
        type: 'alternativa_analise',
        pattern: /[🔵🔹▪️•]\s*Alternativa\s*([A-E])/gi,
        icon: 'CircleDot',
        color: 'blue',
        borderStyle: 'border-l-4 border-l-blue-500',
        title: '🔵 ALTERNATIVA {letter}',
      },
      {
        type: 'afirmacao_correta',
        pattern: /[✅✔️]\s*AFIRMAÇÃO\s*([IVX]+)/gi,
        icon: 'CheckCircle',
        color: 'green',
        borderStyle: 'border-l-4 border-l-green-500',
        title: '✅ AFIRMAÇÃO {number} — CORRETA',
      },
      {
        type: 'afirmacao_incorreta',
        pattern: /[❌✖️]\s*AFIRMAÇÃO\s*([IVX]+)/gi,
        icon: 'XCircle',
        color: 'red',
        borderStyle: 'border-l-4 border-l-red-500',
        title: '❌ AFIRMAÇÃO {number} — ERRADA',
      },
      {
        type: 'passo',
        pattern: /[📊⚗️⚙️🔬]\s*PASSO\s*(\d+)[:\s]*/gi,
        icon: 'Cog | Beaker | BarChart3 | CheckCircle',
        color: 'blue',
        borderStyle: 'border-l-4 border-l-blue-500',
        title: '📊 PASSO {number}',
      },
      {
        type: 'conclusao',
        pattern: /[🧬📊✅]\s*CONCLUSÃO[:\s]*/gi,
        icon: 'CheckCircle',
        color: 'emerald',
        borderStyle: 'border-l-4 border-l-emerald-500',
        title: '✅ CONCLUSÃO E GABARITO',
      },
      {
        type: 'competencia',
        pattern: /🎯\s*COMPETÊNCIA E HABILIDADE\s*[-–]?\s*ENEM[:\s]*/gi,
        icon: 'GraduationCap',
        color: 'purple',
        borderStyle: 'border-l-4 border-l-purple-500',
        title: '🎯 COMPETÊNCIA E HABILIDADE - ENEM',
      },
      {
        type: 'estrategia',
        pattern: /📌\s*DIRECIONAMENTO\s*[\/]?\s*ESTRATÉGIA[:\s]*/gi,
        icon: 'Compass',
        color: 'amber',
        borderStyle: 'border-l-4 border-l-amber-500',
        title: '📌 DIRECIONAMENTO / ESTRATÉGIA',
      },
      {
        type: 'pegadinhas',
        pattern: /⚠️\s*PEGADINHAS?(\s*COMUNS?)?[:\s]*/gi,
        icon: 'AlertTriangle',
        color: 'orange',
        borderStyle: 'border-l-4 border-l-orange-500',
        title: '⚠️ PEGADINHAS COMUNS',
      },
      {
        type: 'dica',
        pattern: /💡\s*DICA DE OURO[:\s]*/gi,
        icon: 'Lightbulb',
        color: 'yellow',
        borderStyle: 'border-l-4 border-l-yellow-500',
        title: '💡 DICA DE OURO',
      },
      {
        type: 'resumo',
        pattern: /Reunindo tudo|Agora reunindo/gi,
        icon: 'MessageCircle',
        color: 'cyan',
        borderStyle: 'border-l-4 border-l-cyan-500',
        title: '📋 RESUMO FINAL',
      },
    ],

    structure: {
      header: {
        content: 'BANCA (ANO)',
        alignment: 'CENTER',
        fontWeight: 'BOLD',
        textTransform: 'UPPERCASE',
        borderBottom: 'border-b-2 border-primary/20',
      },
      metadata: {
        cards: ['NÍVEL + TEMA', 'CLASSIFICAÇÃO (MACRO/MICRO)'],
        layout: 'grid 2 cols',
        style: 'rounded-xl with gradients',
      },
      title: {
        content: '🔬 RESOLUÇÃO COMENTADA PELO PROF. MOISÉS MEDEIROS',
        alignment: 'CENTER',
        color: 'emerald',
        fontSize: 'text-xl',
        wrapper: 'rounded-2xl with gradient background',
      },
      sections: {
        layout: 'vertical stack',
        spacing: 'space-y-4',
        grouping: 'ALTERNATIVAS agrupadas com separador visual',
        eachSection: 'rounded-xl with border-l-4 colored + header + content',
      },
    },

    usage: `
      <QuestionResolution
        resolutionText={question.explanation}
        banca={question.banca}
        ano={question.ano}
        difficulty={question.difficulty}
        tema={question.tema}
        macro={question.macro}
        micro={question.micro}
        competenciaEnem={question.competencia_enem}
        habilidadeEnem={question.habilidade_enem}
      />
    `,
  },

  // ============================================
  // 3. APLICAÇÃO UNIVERSAL
  // ============================================
  aplicacaoUniversal: {
    obrigatorio: [
      {
        route: '/gestaofc/questoes/:id',
        component: 'GestaoQuestaoDetalhe',
        path: 'src/pages/gestao/GestaoQuestaoDetalhe.tsx',
        uses: ['QuestionEnunciado', 'QuestionResolution'],
      },
      {
        route: '/gestaofc/questoes',
        component: 'GestaoQuestoes',
        path: 'src/pages/gestao/GestaoQuestoes.tsx',
        uses: ['QuestionEnunciado (compact)'],
      },
      {
        route: '/alunos/questoes',
        component: 'AlunoQuestoes',
        path: 'src/pages/aluno/AlunoQuestoes.tsx',
        uses: ['QuestionEnunciado', 'QuestionResolution'],
      },
      {
        component: 'QuizPlayer',
        path: 'src/components/lms/QuizPlayer.tsx',
        uses: ['QuestionEnunciado', 'QuestionResolution'],
      },
      {
        component: 'QuestionPractice',
        path: 'src/components/lms/QuestionPractice.tsx',
        uses: ['QuestionEnunciado', 'QuestionResolution'],
      },
    ],
  },

  // ============================================
  // 4. FORMATAÇÃO QUÍMICA
  // ============================================
  chemicalFormatting: {
    enabled: true,
    utility: 'formatChemicalFormulas',
    path: 'src/lib/chemicalFormatter.ts',
    transforms: [
      { from: 'H2O', to: 'H₂O' },
      { from: 'CO2', to: 'CO₂' },
      { from: 'Na+', to: 'Na⁺' },
      { from: 'sp2', to: 'sp²' },
      { from: 'sp3', to: 'sp³' },
    ],
    appliedAt: 'RENDER_LAYER_ONLY',
    modifiesDatabase: false,
  },

  // ============================================
  // 5. PROIBIÇÕES ABSOLUTAS
  // ============================================
  proibicoes: [
    'NUNCA usar <p> simples para renderizar explanation',
    'NUNCA usar imagens com max-h menor que 900px',
    'NUNCA exibir enunciado sem o header da banca',
    'NUNCA exibir resolução sem o parser inteligente',
    'NUNCA bypassar os componentes universais',
    'NUNCA modificar a estrutura de seções sem INTERNAL_SECRET',
  ],

  // ============================================
  // 6. REGRA FINAL
  // ============================================
  regraFinal: `
    ╔══════════════════════════════════════════════════════════════════════════════╗
    ║                                                                              ║
    ║   🔒 ESTE PADRÃO É PERMANENTE E OBRIGATÓRIO                                 ║
    ║                                                                              ║
    ║   • QuestionEnunciado: ÚNICO componente para enunciados                     ║
    ║   • QuestionResolution: ÚNICO componente para resoluções                    ║
    ║   • Imagens: SEMPRE max-h-[900px]                                           ║
    ║   • Fórmulas: SEMPRE formatadas (subscrito/sobrescrito)                     ║
    ║   • Parser: SEMPRE ativo para organizar seções                              ║
    ║   • Aplicação: TODAS as rotas e componentes listados                        ║
    ║                                                                              ║
    ║   QUALQUER DESVIO DESTE PADRÃO É CRIME CONTRA A CONSTITUIÇÃO                ║
    ║                                                                              ║
    ╚══════════════════════════════════════════════════════════════════════════════╝
  `,
} as const;

// Exportar para referência
export default QUESTION_DISPLAY_STANDARD;
