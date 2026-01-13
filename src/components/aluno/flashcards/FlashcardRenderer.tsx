// ============================================
// 🎴 FLASHCARD RENDERER
// Renderiza conteúdo de flashcard com suporte a:
// - Texto normal
// - Cloze deletions {{c1::resposta}}
// - Imagens [img:namespace/filename] via Signed URL
// - Image Occlusion (BASE + MASK)
// ============================================

import { memo, useMemo, useState, useEffect, Fragment } from 'react';
import { cn } from '@/lib/utils';
import { useStorageRouter } from '@/hooks/useStorageRouter';

interface FlashcardRendererProps {
  content: string | null | undefined;
  showClozeAnswer?: boolean;
  className?: string;
}

interface ImageToken {
  fullMatch: string;
  path: string;
  type?: string; // 'mask-q', 'mask-a', 'base'
  cloze?: number;
}

/**
 * Extrai tokens de imagem do conteúdo
 * Formato: [img:namespace/filename] ou [img:namespace/filename|type=mask-q|cloze=1]
 */
function extractImageTokens(content: string): ImageToken[] {
  const tokens: ImageToken[] = [];
  const regex = /\[img:([^\]|]+)(?:\|([^\]]+))?\]/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const token: ImageToken = {
      fullMatch: match[0],
      path: match[1],
    };
    
    // Parse atributos opcionais: type=mask-q|cloze=1
    if (match[2]) {
      const attrs = match[2].split('|');
      for (const attr of attrs) {
        const [key, value] = attr.split('=');
        if (key === 'type') token.type = value;
        if (key === 'cloze') token.cloze = parseInt(value, 10);
      }
    }
    
    tokens.push(token);
  }
  
  return tokens;
}

/**
 * Componente de imagem com Signed URL
 */
const FlashcardImage = memo(function FlashcardImage({ 
  path, 
  type,
  showAnswer 
}: { 
  path: string; 
  type?: string;
  showAnswer: boolean;
}) {
  const { getSignedUrl, getCachedUrl } = useStorageRouter({ bucket: 'materiais' });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    let mounted = true;
    
    async function loadImage() {
      // Checar cache primeiro
      const cached = getCachedUrl(path);
      if (cached) {
        setImageUrl(cached);
        setLoading(false);
        return;
      }
      
      try {
        const result = await getSignedUrl(path);
        if (mounted && result.success && result.url) {
          setImageUrl(result.url);
        } else if (mounted) {
          setError(true);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    loadImage();
    return () => { mounted = false; };
  }, [path, getSignedUrl, getCachedUrl]);
  
  // Para máscaras de pergunta, esconder se não é para mostrar resposta
  const isMaskQ = type === 'mask-q';
  const shouldHide = isMaskQ && !showAnswer;
  
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs text-muted-foreground animate-pulse">
        ⏳ Carregando...
      </span>
    );
  }
  
  if (error || !imageUrl) {
    return (
      <span className="inline-flex items-center gap-1 bg-destructive/10 px-2 py-1 rounded text-xs text-destructive">
        🖼️ {path.split('/').pop()}
      </span>
    );
  }
  
  return (
    <img 
      src={imageUrl} 
      alt={path.split('/').pop() || 'Flashcard image'}
      className={cn(
        "inline-block max-w-full h-auto rounded",
        isMaskQ && "absolute inset-0",
        shouldHide && "opacity-0"
      )}
      loading="lazy"
    />
  );
});

/**
 * Processa e renderiza conteúdo de flashcard
 */
export const FlashcardRenderer = memo(function FlashcardRenderer({
  content,
  showClozeAnswer = false,
  className,
}: FlashcardRendererProps) {
  const imageTokens = useMemo(() => {
    if (!content) return [];
    return extractImageTokens(content);
  }, [content]);
  
  const rendered = useMemo(() => {
    if (!content) return null;
    
    let processed = content;
    
    // 1. Processa Cloze deletions: {{c1::resposta}} → [___] ou resposta
    processed = processed.replace(
      /\{\{c\d+::([^}]+)\}\}/g, 
      (_, answer) => showClozeAnswer 
        ? `<span class="cloze-answer">${answer}</span>` 
        : '<span class="cloze-blank">[___]</span>'
    );
    
    // 2. Marca imagens para substituição por componentes React
    // Usa placeholder único que será substituído depois
    processed = processed.replace(
      /\[img:([^\]]+)\]/g, 
      (match) => `<span class="img-slot" data-token="${encodeURIComponent(match)}"></span>`
    );
    
    // 3. Converte quebras de linha para <br>
    processed = processed.replace(/\n/g, '<br />');
    
    return processed;
  }, [content, showClozeAnswer]);
  
  if (!rendered) {
    return <span className="text-muted-foreground italic">Conteúdo vazio</span>;
  }

  // Se não tem imagens, renderiza como HTML simples
  if (imageTokens.length === 0) {
    return (
      <div 
        className={cn(
          "flashcard-content whitespace-pre-wrap break-words",
          "[&_.cloze-blank]:bg-primary/20 [&_.cloze-blank]:px-2 [&_.cloze-blank]:py-0.5 [&_.cloze-blank]:rounded [&_.cloze-blank]:font-mono",
          "[&_.cloze-answer]:bg-green-500/20 [&_.cloze-answer]:px-2 [&_.cloze-answer]:py-0.5 [&_.cloze-answer]:rounded [&_.cloze-answer]:font-semibold [&_.cloze-answer]:text-green-600 dark:[&_.cloze-answer]:text-green-400",
          className
        )}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    );
  }

  // Com imagens: renderiza com componentes React
  return (
    <div className={cn(
      "flashcard-content whitespace-pre-wrap break-words relative",
      "[&_.cloze-blank]:bg-primary/20 [&_.cloze-blank]:px-2 [&_.cloze-blank]:py-0.5 [&_.cloze-blank]:rounded [&_.cloze-blank]:font-mono",
      "[&_.cloze-answer]:bg-green-500/20 [&_.cloze-answer]:px-2 [&_.cloze-answer]:py-0.5 [&_.cloze-answer]:rounded [&_.cloze-answer]:font-semibold [&_.cloze-answer]:text-green-600 dark:[&_.cloze-answer]:text-green-400",
      className
    )}>
      {imageTokens.map((token, idx) => (
        <FlashcardImage 
          key={`${token.path}-${idx}`}
          path={token.path}
          type={token.type}
          showAnswer={showClozeAnswer}
        />
      ))}
      <div dangerouslySetInnerHTML={{ 
        __html: rendered.replace(/<span class="img-slot"[^>]*><\/span>/g, '') 
      }} />
    </div>
  );
});

/**
 * Versão simples para preview (texto puro, sem HTML)
 */
export function processFlashcardText(text: string | null | undefined, showClozeAnswer = false): string {
  if (!text) return '';
  let processed = text;
  
  // Processa Cloze: {{c1::resposta}} → [___] ou resposta
  processed = processed.replace(
    /\{\{c\d+::([^}]+)\}\}/g, 
    (_, answer) => showClozeAnswer ? answer : '[___]'
  );
  
  // Imagens: [img:namespace/filename] → 🖼️ filename
  processed = processed.replace(
    /\[img:([^\]|]+)[^\]]*\]/g, 
    (_, path) => `🖼️ ${path.split('/').pop()}`
  );
  
  // Remove HTML residual
  processed = processed.replace(/<br\s*\/?>/gi, '\n');
  processed = processed.replace(/<[^>]+>/g, '');
  
  // Limpa entidades HTML
  processed = processed.replace(/&nbsp;/g, ' ');
  processed = processed.replace(/&lt;/g, '<');
  processed = processed.replace(/&gt;/g, '>');
  processed = processed.replace(/&amp;/g, '&');
  
  return processed.trim();
}

export default FlashcardRenderer;
