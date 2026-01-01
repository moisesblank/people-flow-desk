// ============================================
// 📚 QUESTION RESOLUTION — COMPONENTE UNIVERSAL
// PADRÃO OBRIGATÓRIO PARA TODAS AS RESOLUÇÕES
// 
// ESTRUTURA:
// 1. BANCA HEADER (centralizado, bold, uppercase)
// 2. QUEST METADATA (Nível + Tema)
// 3. CLASSIFICATION BLOCK (Macro + Micro)
// 4. RESOLUTION BODY (texto justificado)
// 5. ENEM COMPETENCE/SKILLS
// 6. STRATEGY BLOCK (opcional)
// 7. COMMON TRAPS BLOCK (opcional)
// 8. GOLDEN TIP BLOCK (opcional)
// ============================================

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { getBancaLabel } from '@/constants/bancas';
import { 
  Sparkles, 
  Target, 
  FolderTree, 
  BookOpen, 
  Lightbulb,
  AlertTriangle,
  Compass
} from 'lucide-react';

// Fallback padrão quando não há banca
const DEFAULT_BANCA_HEADER = 'QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS';

// Mapa de dificuldade para exibição
const DIFFICULTY_LABELS: Record<string, string> = {
  'facil': 'FÁCIL',
  'medio': 'MÉDIO',
  'dificil': 'DIFÍCIL',
};

interface QuestionResolutionProps {
  /** Texto da resolução/explicação */
  resolutionText: string;
  /** Código da banca (ex: 'enem', 'unicamp') */
  banca?: string | null;
  /** Ano da questão */
  ano?: number | null;
  /** Dificuldade (facil, medio, dificil) */
  difficulty?: string | null;
  /** Tema da questão */
  tema?: string | null;
  /** Macro assunto */
  macro?: string | null;
  /** Micro assunto */
  micro?: string | null;
  /** Competência ENEM */
  competenciaEnem?: string | null;
  /** Habilidade ENEM */
  habilidadeEnem?: string | null;
  /** Texto de estratégia (opcional - pode ser extraído do texto) */
  strategyText?: string | null;
  /** Texto de pegadinhas comuns (opcional) */
  commonTrapsText?: string | null;
  /** Dica de ouro (opcional) */
  goldenTipText?: string | null;
  /** Classe adicional para o container */
  className?: string;
}

/**
 * Bloco de seção com título e conteúdo
 */
const ResolutionSection = memo(function ResolutionSection({
  icon: Icon,
  title,
  children,
  iconColor = 'text-primary',
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div className="space-y-2">
      <h4 className={cn("font-bold flex items-center gap-2", iconColor)}>
        <Icon className="h-5 w-5" />
        {title}
      </h4>
      <div className="pl-7">
        {children}
      </div>
    </div>
  );
});

/**
 * Item de metadado com label e valor
 */
const MetadataItem = memo(function MetadataItem({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string;
  emoji?: string;
}) {
  return (
    <p className="text-sm">
      <span className="font-semibold">
        {emoji && <span className="mr-1">{emoji}</span>}
        {label}:
      </span>{' '}
      <span className="text-muted-foreground">{value}</span>
    </p>
  );
});

/**
 * Formata o header da banca
 */
const formatBancaHeader = (banca?: string | null, ano?: number | null): string => {
  if (banca) {
    const bancaLabel = getBancaLabel(banca);
    return ano ? `${bancaLabel} (${ano})` : bancaLabel;
  }
  return DEFAULT_BANCA_HEADER;
};

/**
 * Componente universal para exibir resolução de questão
 * 
 * ESTRUTURA OBRIGATÓRIA:
 * 1. Header da Banca (centralizado, bold, uppercase)
 * 2. Metadados (Nível + Tema)
 * 3. Classificação (Macro + Micro)
 * 4. Corpo da Resolução (justificado)
 * 5. Competência/Habilidade ENEM
 * 6. Estratégia (opcional)
 * 7. Pegadinhas (opcional)
 * 8. Dica de Ouro (opcional)
 */
const QuestionResolution = memo(function QuestionResolution({
  resolutionText,
  banca,
  ano,
  difficulty,
  tema,
  macro,
  micro,
  competenciaEnem,
  habilidadeEnem,
  strategyText,
  commonTrapsText,
  goldenTipText,
  className,
}: QuestionResolutionProps) {
  const bancaHeader = formatBancaHeader(banca, ano);
  const difficultyLabel = difficulty ? DIFFICULTY_LABELS[difficulty] || difficulty.toUpperCase() : null;

  // Verifica se tem classificação
  const hasClassification = macro || micro;
  
  // Verifica se tem metadados ENEM
  const hasEnemData = competenciaEnem || habilidadeEnem;

  return (
    <div className={cn("space-y-6", className)}>
      {/* 1. BANCA HEADER — Centralizado, Bold, Uppercase */}
      <div className="text-center">
        <h3 className="text-2xl font-bold uppercase tracking-wide text-primary">
          {bancaHeader}
        </h3>
      </div>

      {/* 2. QUEST METADATA — Nível + Tema */}
      {(difficultyLabel || tema) && (
        <div className="flex flex-wrap gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          {difficultyLabel && (
            <MetadataItem 
              emoji="✨" 
              label="QUESTÃO" 
              value={`NÍVEL ${difficultyLabel}`} 
            />
          )}
          {tema && (
            <MetadataItem 
              emoji="🧪" 
              label="TEMA" 
              value={tema} 
            />
          )}
        </div>
      )}

      {/* 3. CLASSIFICATION BLOCK — Macro + Micro */}
      {hasClassification && (
        <ResolutionSection 
          icon={FolderTree} 
          title="🗂️ CLASSIFICAÇÃO"
          iconColor="text-blue-500"
        >
          <div className="space-y-1">
            {macro && (
              <p className="text-sm">
                <span className="font-semibold text-blue-400">🔹 Macro Assunto:</span>{' '}
                <span className="text-muted-foreground">{macro}</span>
              </p>
            )}
            {micro && (
              <p className="text-sm">
                <span className="font-semibold text-blue-400">🔹 Micro Assunto:</span>{' '}
                <span className="text-muted-foreground">{micro}</span>
              </p>
            )}
          </div>
        </ResolutionSection>
      )}

      {/* 4. RESOLUTION BODY — Texto Justificado */}
      <ResolutionSection 
        icon={Sparkles} 
        title="🔬 RESOLUÇÃO COMENTADA PELO PROF. MOISÉS MEDEIROS"
        iconColor="text-emerald-500"
      >
        <p className="text-justify leading-relaxed whitespace-pre-wrap">
          {resolutionText}
        </p>
      </ResolutionSection>

      {/* 5. ENEM COMPETENCE/SKILLS */}
      {hasEnemData && (
        <ResolutionSection 
          icon={Target} 
          title="🎯 COMPETÊNCIA E HABILIDADE - ENEM"
          iconColor="text-purple-500"
        >
          <div className="space-y-1">
            {competenciaEnem && (
              <p className="text-sm">
                <span className="font-semibold text-purple-400">📘 Competência:</span>{' '}
                <span className="text-muted-foreground">{competenciaEnem}</span>
              </p>
            )}
            {habilidadeEnem && (
              <p className="text-sm">
                <span className="font-semibold text-purple-400">📘 Habilidade:</span>{' '}
                <span className="text-muted-foreground">{habilidadeEnem}</span>
              </p>
            )}
          </div>
        </ResolutionSection>
      )}

      {/* 6. STRATEGY BLOCK — Opcional */}
      {strategyText && (
        <ResolutionSection 
          icon={Compass} 
          title="📌 DIRECIONAMENTO / ESTRATÉGIA"
          iconColor="text-amber-500"
        >
          <p className="text-justify leading-relaxed whitespace-pre-wrap">
            {strategyText}
          </p>
        </ResolutionSection>
      )}

      {/* 7. COMMON TRAPS BLOCK — Opcional */}
      {commonTrapsText && (
        <ResolutionSection 
          icon={AlertTriangle} 
          title="⚠️ PEGADINHAS COMUNS"
          iconColor="text-orange-500"
        >
          <p className="text-justify leading-relaxed whitespace-pre-wrap">
            {commonTrapsText}
          </p>
        </ResolutionSection>
      )}

      {/* 8. GOLDEN TIP BLOCK — Opcional */}
      {goldenTipText && (
        <ResolutionSection 
          icon={Lightbulb} 
          title="💡 DICA DE OURO"
          iconColor="text-yellow-500"
        >
          <p className="text-justify leading-relaxed whitespace-pre-wrap">
            {goldenTipText}
          </p>
        </ResolutionSection>
      )}
    </div>
  );
});

export default QuestionResolution;

// ============================================
// REGRAS DE USO OBRIGATÓRIAS:
// 
// 1. TODA resolução DEVE usar este componente
// 2. SEMPRE passar banca, ano, difficulty, tema quando disponíveis
// 3. Campos opcionais só aparecem se preenchidos
// 4. Texto é SEMPRE justificado
// 5. Header é SEMPRE centralizado e bold
// 6. NÃO MODIFICA o conteúdo original, apenas organiza
// ============================================
