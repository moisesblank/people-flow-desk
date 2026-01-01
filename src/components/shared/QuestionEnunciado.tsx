// ============================================
// 📝 QUESTION ENUNCIADO — COMPONENTE UNIVERSAL
// PADRÃO OBRIGATÓRIO PARA TODAS AS QUESTÕES
// 
// ESTRUTURA:
// 1. BANCA HEADER (centralizado, bold, uppercase)
// 2. TEXTO DO ENUNCIADO (justificado)
// 3. IMAGEM (se houver)
// ============================================

import { memo } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBancaLabel } from '@/constants/bancas';

// Fallback padrão quando não há banca
const DEFAULT_BANCA_HEADER = 'QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS';

interface QuestionEnunciadoProps {
  /** Texto do enunciado (pode conter [IMAGEM: URL]) */
  questionText: string;
  /** URL da imagem do banco (prioridade sobre extração do texto) */
  imageUrl?: string | null;
  /** Código da banca (ex: 'enem', 'unicamp') */
  banca?: string | null;
  /** Ano da questão */
  ano?: number | null;
  /** Tamanho do texto */
  textSize?: 'sm' | 'base' | 'lg';
  /** Classe adicional para o container */
  className?: string;
  /** Mostrar label "Imagem do Enunciado" */
  showImageLabel?: boolean;
  /** Altura máxima da imagem */
  maxImageHeight?: string;
  /** Modo compacto (para cards/listas) - não mostra header */
  compact?: boolean;
  /** Esconder header da banca */
  hideHeader?: boolean;
}

/**
 * Extrai URL de imagem do texto no formato [IMAGEM: URL]
 */
export const extractImageFromText = (text: string): string | null => {
  if (!text) return null;
  const match = text.match(/\[IMAGEM:\s*(https?:\/\/[^\]\s]+)\]/i);
  return match && match[1] ? match[1].trim() : null;
};

/**
 * Remove tags [IMAGEM: URL] do texto
 */
export const cleanQuestionText = (text: string): string => {
  if (!text) return '';
  return text.replace(/\[IMAGEM:\s*https?:\/\/[^\]]+\]/gi, '').trim();
};

/**
 * Obtém a URL da imagem (prioriza imageUrl, senão extrai do texto)
 */
export const getQuestionImageUrl = (questionText: string, imageUrl?: string | null): string | null => {
  // Prioriza image_url do banco
  if (imageUrl) return imageUrl;
  // Fallback: extrai do texto
  return extractImageFromText(questionText);
};

/**
 * Formata o header da banca
 * Regras:
 * - Se tem banca + ano: "BANCA (ANO)"
 * - Se tem só banca: "BANCA"
 * - Se não tem nada: fallback padrão
 */
export const formatBancaHeader = (banca?: string | null, ano?: number | null): string => {
  if (banca) {
    const bancaLabel = getBancaLabel(banca);
    return ano ? `${bancaLabel} (${ano})` : bancaLabel;
  }
  return DEFAULT_BANCA_HEADER;
};

/**
 * Componente universal para exibir enunciado de questão
 * 
 * ESTRUTURA OBRIGATÓRIA:
 * 1. Header da Banca (centralizado, bold, uppercase)
 * 2. Texto do Enunciado (justificado)
 * 3. Imagem (se houver)
 */
const QuestionEnunciado = memo(function QuestionEnunciado({
  questionText,
  imageUrl,
  banca,
  ano,
  textSize = 'base',
  className,
  showImageLabel = true,
  maxImageHeight = 'max-h-96',
  compact = false,
  hideHeader = false,
}: QuestionEnunciadoProps) {
  // Limpa o texto (remove tag [IMAGEM:])
  const cleanText = cleanQuestionText(questionText);
  
  // Obtém URL da imagem
  const imgUrl = getQuestionImageUrl(questionText, imageUrl);

  // Header da banca
  const bancaHeader = formatBancaHeader(banca, ano);

  const textSizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  }[textSize];

  const headerSizeClass = {
    sm: 'text-xl',
    base: 'text-2xl',
    lg: 'text-3xl',
  }[textSize];

  return (
    <div className={cn("space-y-4", className)}>
      {/* 1. BANCA HEADER — Centralizado, Bold, Uppercase */}
      {!compact && !hideHeader && (
        <div className="text-center mb-4">
          <h3 className={cn(
            "font-bold uppercase tracking-wide text-primary",
            headerSizeClass
          )}>
            {bancaHeader}
          </h3>
        </div>
      )}

      {/* 2. TEXTO DO ENUNCIADO — Justificado */}
      <p className={cn(
        "leading-relaxed whitespace-pre-wrap",
        textSizeClass,
        compact ? "line-clamp-3" : "text-justify",
      )}>
        {cleanText}
      </p>
      
      {/* 3. IMAGEM DO ENUNCIADO */}
      {imgUrl && (
        <div className={cn(
          "rounded-lg border border-border/50 overflow-hidden",
          !compact && "p-4 bg-muted/30"
        )}>
          {showImageLabel && !compact && (
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              Imagem do Enunciado
            </p>
          )}
          <img 
            src={imgUrl} 
            alt="Imagem da questão"
            className={cn(
              "rounded-lg border border-border/50 object-contain",
              compact ? "max-h-32 w-full" : maxImageHeight,
              !compact && "mx-auto max-w-full"
            )}
            loading="lazy"
            onError={(e) => {
              const container = (e.target as HTMLImageElement).parentElement;
              if (container) container.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
});

export default QuestionEnunciado;

// ============================================
// REGRAS DE USO OBRIGATÓRIAS:
// 
// 1. TODA questão DEVE usar este componente
// 2. SEMPRE passar banca e ano quando disponíveis
// 3. Modo compact=true ESCONDE o header (para listas)
// 4. Texto é SEMPRE justificado (exceto compact)
// 5. Header é SEMPRE centralizado e bold
// ============================================
