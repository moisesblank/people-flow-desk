// ============================================
// 📝 QUESTION ENUNCIADO — COMPONENTE UNIVERSAL
// Exibe texto + imagem de qualquer questão
// Extrai imagem de image_url ou do texto [IMAGEM: URL]
// PADRÃO ÚNICO PARA TODO O SISTEMA
// ============================================

import { memo } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionEnunciadoProps {
  /** Texto do enunciado (pode conter [IMAGEM: URL]) */
  questionText: string;
  /** URL da imagem do banco (prioridade sobre extração do texto) */
  imageUrl?: string | null;
  /** Tamanho do texto */
  textSize?: 'sm' | 'base' | 'lg';
  /** Classe adicional para o container */
  className?: string;
  /** Mostrar label "Imagem do Enunciado" */
  showImageLabel?: boolean;
  /** Altura máxima da imagem */
  maxImageHeight?: string;
  /** Modo compacto (para cards/listas) */
  compact?: boolean;
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
 * Componente universal para exibir enunciado de questão com imagem
 */
const QuestionEnunciado = memo(function QuestionEnunciado({
  questionText,
  imageUrl,
  textSize = 'base',
  className,
  showImageLabel = true,
  maxImageHeight = 'max-h-96',
  compact = false,
}: QuestionEnunciadoProps) {
  // Limpa o texto (remove tag [IMAGEM:])
  const cleanText = cleanQuestionText(questionText);
  
  // Obtém URL da imagem
  const imgUrl = getQuestionImageUrl(questionText, imageUrl);

  const textSizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  }[textSize];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Texto do Enunciado */}
      <p className={cn(
        "leading-relaxed whitespace-pre-wrap",
        textSizeClass,
        compact && "line-clamp-3"
      )}>
        {cleanText}
      </p>
      
      {/* Imagem do Enunciado */}
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
