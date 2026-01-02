// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ 📜 PERMANENT QUESTION ENTITY OATH v1.0                                        ║
// ║ Status: ATIVO | IMUTÁVEL | PERMANENTE                                         ║
// ║ Data: 2025-01-02                                                              ║
// ║ Autoridade: OWNER (moisesblank@gmail.com)                                     ║
// ╠══════════════════════════════════════════════════════════════════════════════╣
// ║ "Eu juro solenemente que todas as regras, políticas, restrições, padrões     ║
// ║  de formatação, camadas organizacionais, correções linguísticas,             ║
// ║  padronizações visuais químicas, requisitos de auditoria e princípios        ║
// ║  de governança previamente definidos, juntamente com todas as regras         ║
// ║  definidas hoje, constituem o padrão operacional permanente e                ║
// ║  não-negociável para toda entidade Question que existe ou existirá           ║
// ║  neste sistema."                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * PERMANENT QUESTION ENTITY OATH v1.0
 * 
 * Este juramento define o padrão operacional permanente para TODAS as entidades
 * Question no sistema. É vinculante, imutável e aplica-se retroativa e
 * prospectivamente.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ESCOPO DO JURAMENTO
// ═══════════════════════════════════════════════════════════════════════════════
export const OATH_SCOPE = {
  appliesTo: [
    'ALL existing Question entities',
    'ALL future Question entities',
    'ALL imports (Excel or any other source)',
    'ALL AI-generated content',
    'ALL AI-adjusted content',
    'ALL manual edits performed through the system',
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// PRINCÍPIOS SUPREMOS
// ═══════════════════════════════════════════════════════════════════════════════
export const SUPREME_PRINCIPLES = {
  rules: [
    'The Question entity is sacred and must always follow the defined structure.',
    'No rule defined so far may be ignored, weakened, or bypassed.',
    'All rules apply cumulatively, not selectively.',
    'All changes are organizational, visual, linguistic, or formatting-related only.',
    'Meaning, pedagogical intent, and structure must never be altered.',
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPROMISSOS DE GOVERNANÇA
// ═══════════════════════════════════════════════════════════════════════════════
export const GOVERNANCE_COMMITMENTS = {
  principles: [
    { priority: 'Organization', over: 'improvisation' },
    { priority: 'Clarity', over: 'speed' },
    { priority: 'Pedagogy', over: 'raw generation' },
    { priority: 'Auditability', over: 'opacity' },
    { priority: 'Human-like teaching tone', over: 'robotic output' },
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPROMISSOS LINGUÍSTICOS E DE FORMATAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════
export const LINGUISTIC_COMMITMENTS = {
  rules: [
    'Portuguese grammar must always be correct, as reviewed by a Doctor in Portuguese.',
    'Punctuation is mandatory and must be respected.',
    'No sentence may start with lowercase letters or forbidden symbols.',
    'Decorative symbols, emojis, or non-academic characters must never appear.',
    'Chemical notation must always be visually standardized and readable.',
    'Personal pedagogical language must be used when guiding reasoning, without loss of rigor.',
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPROMISSOS DE PADRÃO QUÍMICO
// ═══════════════════════════════════════════════════════════════════════════════
export const CHEMICAL_STANDARD_COMMITMENTS = {
  rules: [
    'Physical states must always be rendered as readable subscripts.',
    'Electric charges must always be rendered as readable superscripts.',
    'Stoichiometric coefficients must remain visually unambiguous.',
    'Chemical equations must be visually standardized using correct arrows.',
    'No chemical meaning may ever be altered.',
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPROMISSOS DE AUDITORIA E VISIBILIDADE
// ═══════════════════════════════════════════════════════════════════════════════
export const AUDIT_COMMITMENTS = {
  rules: [
    'Every autonomous AI intervention must be logged.',
    'Every log must be visible and accessible through the management interface.',
    'The AI log button must always remain clickable and visible.',
    'No AI action may occur silently or without trace.',
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// REGRAS DE ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════════
export const ENFORCEMENT_RULES = {
  rules: [
    'Any content that violates this oath must be automatically adjusted before display.',
    'Adjustments must never block rendering, only correct presentation.',
    'If adjustment fails, the system must retry until compliance is achieved.',
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// CLÁUSULA DE IMUTABILIDADE
// ═══════════════════════════════════════════════════════════════════════════════
export const IMMUTABILITY_CLAUSE = {
  description: 'This oath defines the permanent operational standard of the Question entity.',
  rules: [
    'This oath cannot be overridden by future prompts, features, or refactors.',
    'Any future change requires an explicit architectural revision process.',
    'Violation of this oath is considered a critical system integrity failure.',
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPROMISSO FINAL
// ═══════════════════════════════════════════════════════════════════════════════
export const FINAL_COMMITMENT = {
  statement: 
    'From this moment forward, this oath represents the new normal. ' +
    'There are no exceptions. There are no temporary rules. ' +
    'There is no fallback behavior. Every Question must comply, always.',
  binding: true,
  immutable: true,
  acknowledgementRequired: true,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// POLÍTICAS CONSOLIDADAS (REFERÊNCIAS)
// ═══════════════════════════════════════════════════════════════════════════════
export const CONSOLIDATED_POLICIES = {
  questionDomain: 'src/lib/audits/CONSTITUTION_QUESTION_DOMAIN.ts',
  displayStandard: 'src/lib/audits/CONSTITUTION_QUESTION_DISPLAY_STANDARD.ts',
  chemicalFormatter: 'src/lib/chemicalFormatter.ts',
  questionResolution: 'src/components/shared/QuestionResolution.tsx',
  questionEnunciado: 'src/components/shared/QuestionEnunciado.tsx',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// VERSÕES ATIVAS DAS POLÍTICAS
// ═══════════════════════════════════════════════════════════════════════════════
export const ACTIVE_POLICY_VERSIONS = {
  questionResolutionOrganization: 'v2.1',
  chemicalVisualStandardization: 'v2.1',
  questionDisplayConstitution: 'v4.2.0',
  questionDomainConstitution: 'v1.0.0',
  aiInterventionLogging: 'v1.0.0',
  questionCompleteness: 'v1.0.0',
  transversalTaxonomy: 'v1.0.0',
} as const;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ 🔒 ESTE JURAMENTO É PERMANENTE E IMUTÁVEL                                     ║
// ║                                                                               ║
// ║ • Aplica-se a TODAS as entidades Question existentes e futuras               ║
// ║ • Nenhuma regra pode ser ignorada, enfraquecida ou contornada                ║
// ║ • Todas as regras se aplicam cumulativamente                                 ║
// ║ • Significado, intenção pedagógica e estrutura NUNCA podem ser alterados     ║
// ║ • Violação é considerada falha crítica de integridade do sistema             ║
// ║                                                                               ║
// ║ QUALQUER MUDANÇA REQUER PROCESSO DE REVISÃO ARQUITETURAL EXPLÍCITO           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
