/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COMPONENTE: QuestionMetadataBadges
 * CONSTITUIÇÃO TRANSVERSAL v2.0 — Exibição Visual Unificada de Metadados
 * 
 * Exibe todas as associações de uma questão:
 * - LINHA 1: Dificuldade | Banca+Ano | Tipo | MACRO
 * - LINHA 2: MICRO | TEMA | SUBTEMA (se existirem)
 * - BADGE MODO: Treino ou Simulado (opcional, exibido abaixo do enunciado)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ══════════════════════════════════════════════════════════════
// INTERFACES
// ══════════════════════════════════════════════════════════════

export interface QuestionMetadata {
  difficulty?: 'facil' | 'medio' | 'dificil' | string;
  banca?: string | null;
  ano?: number | null;
  question_type?: 'multiple_choice' | 'discursive' | 'true_false' | 'essay' | string;
  macro?: string | null;
  micro?: string | null;
  tema?: string | null;
  subtema?: string | null;
  tags?: string[] | null;
  points?: number | null;
}

export interface QuestionMetadataBadgesProps {
  question: QuestionMetadata;
  /** Variante de exibição: completa (gestão) ou compacta (aluno) */
  variant?: 'full' | 'compact';
  /** Mostrar badge de modo (Treino/Simulado) - geralmente separado do header */
  showModeBadge?: boolean;
  /** Classe adicional para o container */
  className?: string;
  /** Formatar header da banca+ano */
  formatBancaHeader?: (banca?: string | null, ano?: number | null, text?: string) => string;
}

// ══════════════════════════════════════════════════════════════
// CONSTANTES DE CONFIGURAÇÃO VISUAL
// ══════════════════════════════════════════════════════════════

const DIFFICULTY_CONFIG = {
  facil: { label: 'Fácil', class: 'bg-green-500 text-white border-0' },
  medio: { label: 'Médio', class: 'bg-yellow-500 text-white border-0' },
  dificil: { label: 'Difícil', class: 'bg-red-500 text-white border-0' },
} as const;

// MACRO_CONFIG — ZERO EMOJIS (Constituição v10.4)
const MACRO_CONFIG: Record<string, { label: string; badge: string }> = {
  'Química Geral': {
    label: 'Química Geral',
    badge: 'bg-amber-500/90 text-white',
  },
  'Química Orgânica': {
    label: 'Química Orgânica',
    badge: 'bg-purple-600/90 text-white',
  },
  'Físico-Química': {
    label: 'Físico-Química',
    badge: 'bg-cyan-500/90 text-white',
  },
  'Química Ambiental': {
    label: 'Química Ambiental',
    badge: 'bg-emerald-500/90 text-white',
  },
  'Bioquímica': {
    label: 'Bioquímica',
    badge: 'bg-pink-500/90 text-white',
  },
};

const getQuestionTypeLabel = (type?: string) => {
  switch (type) {
    case 'multiple_choice': return 'Múltipla Escolha';
    case 'discursive': return 'Discursiva';
    case 'true_false': return 'V/F';
    case 'essay': return 'Dissertativa';
    default: return 'Questão';
  }
};

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════

export function QuestionMetadataBadges({
  question,
  variant = 'full',
  showModeBadge = false,
  className,
  formatBancaHeader,
}: QuestionMetadataBadgesProps) {
  const diffConfig = DIFFICULTY_CONFIG[question.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medio;
  const macroConfig = MACRO_CONFIG[question.macro || ''] || {
    label: question.macro || 'Química Geral',
    badge: 'bg-amber-500/90 text-white',
  };
  
  // Formatar banca + ano
  const bancaAnoLabel = formatBancaHeader
    ? formatBancaHeader(question.banca, question.ano, '')
    : question.banca && question.ano
      ? `${question.banca} (${question.ano})`
      : question.banca || (question.ano ? `(${question.ano})` : null);

  const hasTransversalLayers = question.micro || question.tema || question.subtema;
  
  // Detectar modo (Treino ou Simulado)
  const isSimulado = question.tags?.includes('SIMULADOS');
  const isTreino = question.tags?.includes('MODO_TREINO');

  return (
    <div className={cn("space-y-2", className)}>
      {/* ══════════════════════════════════════════════════════════════
          LINHA 1: Dificuldade | Banca+Ano | Tipo | MACRO
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Dificuldade */}
        <Badge className={cn("text-sm px-4 py-1.5 font-semibold", diffConfig.class)}>
          {diffConfig.label}
        </Badge>
        
        {/* Banca + Ano */}
        {bancaAnoLabel && (
          <Badge className="text-sm px-4 py-1.5 bg-muted text-foreground border border-border/50 font-medium flex items-center gap-1">
            🏛 {bancaAnoLabel}
          </Badge>
        )}
        
        {/* Tipo de Questão - só mostra se tiver tipo definido */}
        {question.question_type && question.question_type !== 'outros' && (
          <Badge className="text-sm px-4 py-1.5 bg-primary/80 text-primary-foreground border-0 font-semibold flex items-center gap-1">
            ⭐ {getQuestionTypeLabel(question.question_type)}
          </Badge>
        )}
        
        {/* MACRO (Identidade Principal) */}
        <Badge className={cn("text-sm px-4 py-1.5 border-0 font-bold", macroConfig.badge)}>
          {macroConfig.label}
        </Badge>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          LINHA 2: MICRO | TEMA | SUBTEMA (Camadas Transversais)
      ══════════════════════════════════════════════════════════════ */}
      {hasTransversalLayers && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {question.micro && (
            <Badge className="text-sm px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-medium">
              📚 Micro: {variant === 'compact' && question.micro.length > 20 
                ? question.micro.substring(0, 20) + '...' 
                : question.micro.length > 30 
                  ? question.micro.substring(0, 30) + '...' 
                  : question.micro}
            </Badge>
          )}
          {question.tema && (
            <Badge className="text-sm px-3 py-1 bg-violet-500/20 text-violet-300 border border-violet-500/40 font-medium">
              🎯 Tema: {variant === 'compact' && question.tema.length > 20 
                ? question.tema.substring(0, 20) + '...' 
                : question.tema.length > 30 
                  ? question.tema.substring(0, 30) + '...' 
                  : question.tema}
            </Badge>
          )}
          {question.subtema && (
            <Badge className="text-sm px-3 py-1 bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 font-medium">
              🔹 Subtema: {variant === 'compact' && question.subtema.length > 20 
                ? question.subtema.substring(0, 20) + '...' 
                : question.subtema.length > 30 
                  ? question.subtema.substring(0, 30) + '...' 
                  : question.subtema}
            </Badge>
          )}
        </div>
      )}
      
      {/* ══════════════════════════════════════════════════════════════
          BADGE DE MODO: Treino ou Simulado (opcional)
      ══════════════════════════════════════════════════════════════ */}
      {showModeBadge && (
        <div className="flex items-center justify-start mt-2">
          {isSimulado ? (
            <Badge className="px-4 py-1.5 bg-red-600 text-white border-0 font-bold">
              🎯 Simulados
            </Badge>
          ) : isTreino ? (
            <Badge className="px-4 py-1.5 bg-purple-600 text-white border-0 font-bold">
              💪 MODO_TREINO
            </Badge>
          ) : (
            <Badge className="px-4 py-1.5 bg-muted text-muted-foreground border border-border/50 font-medium">
              📋 Sem grupo
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Badge de Modo separado para usar abaixo do enunciado
 */
export function QuestionModeBadge({ tags }: { tags?: string[] | null }) {
  const isSimulado = tags?.includes('SIMULADOS');
  const isTreino = tags?.includes('MODO_TREINO');
  
  return (
    <div className="flex items-center">
      {isSimulado ? (
        <Badge className="px-4 py-1.5 bg-red-600 text-white border-0 font-bold">
          🎯 Simulados
        </Badge>
      ) : isTreino ? (
        <Badge className="px-4 py-1.5 bg-purple-600 text-white border-0 font-bold">
          💪 MODO_TREINO
        </Badge>
      ) : (
        <Badge className="px-4 py-1.5 bg-muted text-muted-foreground border border-border/50 font-medium">
          📋 Sem grupo
        </Badge>
      )}
    </div>
  );
}

/**
 * Versão compacta para listagens com espaço limitado
 */
export function QuestionBadgesCompact({ question, className }: { question: QuestionMetadata; className?: string }) {
  const diffConfig = DIFFICULTY_CONFIG[question.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medio;
  const macroConfig = MACRO_CONFIG[question.macro || ''] || {
    label: question.macro || 'Química Geral',
    badge: 'bg-amber-500/90 text-white',
  };
  
  const bancaAno = question.banca && question.ano
    ? `${question.banca} (${question.ano})`
    : question.banca || (question.ano ? `${question.ano}` : null);

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <Badge className={cn("text-xs px-2 py-0.5 font-medium", diffConfig.class)}>
        {diffConfig.label}
      </Badge>
      {bancaAno && (
        <Badge variant="outline" className="text-xs px-2 py-0.5">
          🏛 {bancaAno}
        </Badge>
      )}
      <Badge className={cn("text-xs px-2 py-0.5", macroConfig.badge)}>
        {macroConfig.label}
      </Badge>
      {question.micro && (
        <Badge className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
          📚 {question.micro.length > 15 ? question.micro.substring(0, 15) + '...' : question.micro}
        </Badge>
      )}
      {question.tema && (
        <Badge className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/40">
          🎯 {question.tema.length > 15 ? question.tema.substring(0, 15) + '...' : question.tema}
        </Badge>
      )}
    </div>
  );
}

export default QuestionMetadataBadges;
