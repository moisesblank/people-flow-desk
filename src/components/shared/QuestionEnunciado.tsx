// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║ 📝 QUESTION ENUNCIADO — COMPONENTE UNIVERSAL E OBRIGATÓRIO                    ║
// ║ PADRÃO OBRIGATÓRIO PARA TODAS AS QUESTÕES                                      ║
// ╠═══════════════════════════════════════════════════════════════════════════════╣
// ║                                                                                ║
// ║ 🔒 LEI PERMANENTE — CONSTITUIÇÃO DO QUESTION DOMAIN                           ║
// ║                                                                                ║
// ║ Este componente é a ÚNICA fonte de verdade para renderização de enunciados.   ║
// ║ TODAS as questões (SIMULADOS, MODO TREINO, atuais e futuras) DEVEM usar       ║
// ║ este componente para garantir formatação consistente.                         ║
// ║                                                                                ║
// ║ REGRAS IMUTÁVEIS:                                                              ║
// ║ 1. Header da banca: centralizado, bold, UPPERCASE                             ║
// ║ 2. Remoção de caracteres bugados: "", '', etc.                                ║
// ║ 3. Formatação química científica automática (H2O → H₂O)                        ║
// ║ 4. Imagens: max-h-[900px] com navegação para múltiplas                        ║
// ║ 5. Texto justificado com espaçamento adequado                                 ║
// ║                                                                                ║
// ║ JAMAIS MODIFICAR ESTAS REGRAS SEM AUTORIZAÇÃO DO OWNER.                        ║
// ║                                                                                ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝
// 
// ESTRUTURA:
// 1. BANCA HEADER (centralizado, bold, uppercase)
// 2. TEXTO DO ENUNCIADO (justificado)
// 3. IMAGENS (múltiplas suportadas)

import { memo, useState } from 'react';
import { ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatChemicalFormulas } from '@/lib/chemicalFormatter';
import { 
  formatBancaHeader as formatBancaHeaderNormalized,
  DEFAULT_BANCA_HEADER 
} from '@/lib/bancaNormalizer';

interface QuestionEnunciadoProps {
  /** Texto do enunciado (pode conter [IMAGEM: URL]) */
  questionText: string;
  /** URL da imagem do banco (prioridade sobre extração do texto) - LEGACY */
  imageUrl?: string | null;
  /** Array de URLs de imagens do enunciado (NOVO - suporta múltiplas) */
  imageUrls?: string[] | null;
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
 * Extrai TODAS as URLs de imagem do texto no formato [IMAGEM: URL]
 */
export const extractAllImagesFromText = (text: string): string[] => {
  if (!text) return [];
  const matches = text.matchAll(/\[IMAGEM:\s*(https?:\/\/[^\]\s]+)\]/gi);
  return Array.from(matches).map(m => m[1].trim()).filter(Boolean);
};

/**
 * Remove tags [IMAGEM: URL] do texto
 */
export const cleanQuestionText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\[IMAGEM:\s*https?:\/\/[^\]]+\]/gi, '')
    .replace(/[""]/g, '')  // Remove aspas curvas (bugs)
    .replace(/['']/g, '')  // Remove apóstrofos curvos
    .trim();
};

/**
 * Obtém a URL da imagem (prioriza imageUrl, senão extrai do texto) - LEGACY
 */
export const getQuestionImageUrl = (questionText: string, imageUrl?: string | null): string | null => {
  // Prioriza image_url do banco
  if (imageUrl) return imageUrl;
  // Fallback: extrai do texto
  return extractImageFromText(questionText);
};

/**
 * Tipo para imagem do banco (pode ser string ou objeto com url)
 */
type ImageUrlItem = string | { url: string; [key: string]: unknown };

/**
 * Obtém TODAS as URLs de imagens do enunciado (combina imageUrls, imageUrl e texto)
 * Suporta tanto array de strings quanto array de objetos com { url: string }
 */
export const getAllQuestionImages = (
  questionText: string, 
  imageUrl?: string | null, 
  imageUrls?: (string | ImageUrlItem)[] | null
): string[] => {
  const images: string[] = [];
  
  // 1. Prioridade: array imageUrls do banco
  if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
    for (const item of imageUrls) {
      if (typeof item === 'string' && item) {
        // É uma string direta
        images.push(item);
      } else if (typeof item === 'object' && item !== null && 'url' in item && typeof item.url === 'string' && item.url) {
        // É um objeto com propriedade url
        images.push(item.url);
      }
    }
  }
  
  // 2. Fallback: imageUrl único do banco (se não estiver já no array)
  if (imageUrl && !images.includes(imageUrl)) {
    images.push(imageUrl);
  }
  
  // 3. Fallback final: extrair do texto (se ainda não tiver nenhuma)
  if (images.length === 0) {
    const textImages = extractAllImagesFromText(questionText);
    images.push(...textImages);
  }
  
  return images;
};

/**
 * Formata o header da banca
 * 
 * PADRÃO PERMANENTE (QUESTION_HEADER_STANDARDIZATION_AS_NEW_NORMAL):
 * 1. Se banca oficial existe → exibir APENAS a banca em UPPERCASE
 * 2. Se não existe banca → usar "QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS"
 * 3. Nunca misturar labels genéricos com bancas oficiais
 */
export const formatBancaHeader = (
  banca?: string | null, 
  ano?: number | null,
  questionText?: string | null
): string => {
  return formatBancaHeaderNormalized(banca, ano, questionText);
};

/**
 * Componente universal para exibir enunciado de questão
 * 
 * ESTRUTURA OBRIGATÓRIA:
 * 1. Header da Banca (centralizado, bold, uppercase)
 * 2. Texto do Enunciado (justificado)
 * 3. Imagens (suporta múltiplas)
 */
const QuestionEnunciado = memo(function QuestionEnunciado({
  questionText,
  imageUrl,
  imageUrls,
  banca,
  ano,
  textSize = 'base',
  className,
  showImageLabel = true,
  maxImageHeight = 'max-h-[1200px]',
  compact = false,
  hideHeader = false,
}: QuestionEnunciadoProps) {
  // Limpa o texto (remove tags [IMAGEM:])
  const cleanText = cleanQuestionText(questionText);
  
  // Obtém TODAS as URLs de imagens
  const allImages = getAllQuestionImages(questionText, imageUrl, imageUrls);
  
  // Estado para navegação entre imagens
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Header da banca — usa normalização automática incluindo texto da questão
  const bancaHeader = formatBancaHeader(banca, ano, questionText);

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

  // Navegação entre imagens
  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : allImages.length - 1));
  };
  
  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

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

      {/* 2. TEXTO DO ENUNCIADO — Justificado + Fórmulas Químicas Formatadas */}
      <p className={cn(
        "leading-relaxed whitespace-pre-wrap text-justify",
        textSizeClass,
        compact && "line-clamp-3",
      )}>
        {formatChemicalFormulas(cleanText)}
      </p>
      
      {/* 3. IMAGENS DO ENUNCIADO (suporta múltiplas) */}
      {allImages.length > 0 && (
        <div className={cn(
          "rounded-lg border border-border/50 overflow-hidden",
          !compact && "p-4 bg-muted/30"
        )}>
          {/* Label e contador */}
          {showImageLabel && !compact && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {allImages.length > 1 
                  ? `Imagem ${currentImageIndex + 1} de ${allImages.length}` 
                  : 'Imagem do Enunciado'}
              </p>
            </div>
          )}
          
          {/* Container da imagem com navegação */}
          <div className="relative">
            {/* Imagem atual */}
            <img 
              src={allImages[currentImageIndex]} 
              alt={`Imagem ${currentImageIndex + 1} da questão`}
              className={cn(
                "rounded-lg border border-border/50 object-contain",
                compact ? "max-h-64 w-full" : `min-h-[400px] ${maxImageHeight}`,
                !compact && "mx-auto max-w-full"
              )}
              loading="lazy"
              onError={(e) => {
                const container = (e.target as HTMLImageElement).parentElement?.parentElement;
                if (container && allImages.length === 1) {
                  container.style.display = 'none';
                }
              }}
            />
            
            {/* Controles de navegação (só aparece se tiver mais de 1 imagem) */}
            {allImages.length > 1 && !compact && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background border border-border shadow-lg transition-colors"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background border border-border shadow-lg transition-colors"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          
          {/* Indicadores de página (dots) */}
          {allImages.length > 1 && !compact && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    idx === currentImageIndex 
                      ? "bg-primary" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Ir para imagem ${idx + 1}`}
                />
              ))}
            </div>
          )}
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
// 6. SUPORTA múltiplas imagens via imageUrls[]
// ============================================
// REGRAS DE USO OBRIGATÓRIAS:
// 
// 1. TODA questão DEVE usar este componente
// 2. SEMPRE passar banca e ano quando disponíveis
// 3. Modo compact=true ESCONDE o header (para listas)
// 4. Texto é SEMPRE justificado (exceto compact)
// 5. Header é SEMPRE centralizado e bold
// ============================================
