// ============================================
// 🎴 FLASHCARD RENDERER
// Renderiza conteúdo de flashcard com suporte a:
// - Texto normal
// - Cloze deletions {{c1::resposta}}
// - Imagens [img:filename]
// - Fórmulas LaTeX (futuro)
// ============================================

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface FlashcardRendererProps {
  content: string | null | undefined;
  showClozeAnswer?: boolean;
  className?: string;
}

/**
 * Processa e renderiza conteúdo de flashcard
 * Suporta tokens:
 * - [img:filename] → Imagem (placeholder por enquanto, futuramente signed URL)
 * - {{c1::resposta}} → Cloze deletion
 */
export const FlashcardRenderer = memo(function FlashcardRenderer({
  content,
  showClozeAnswer = false,
  className,
}: FlashcardRendererProps) {
  const rendered = useMemo(() => {
    if (!content) return null;
    
    let processed = content;
    
    // 1. Processa Cloze deletions: {{c1::resposta}} → [___] ou resposta
    processed = processed.replace(
      /\{\{c\d+::([^}]+)\}\}/g, 
      (_, answer) => showClozeAnswer ? `<span class="cloze-answer">${answer}</span>` : '<span class="cloze-blank">[___]</span>'
    );
    
    // 2. Processa imagens: [img:filename] → placeholder visual
    processed = processed.replace(
      /\[img:([^\]]+)\]/g, 
      (_, filename) => `<span class="img-placeholder" data-filename="${filename}">🖼️ ${filename}</span>`
    );
    
    // 3. Converte quebras de linha para <br>
    processed = processed.replace(/\n/g, '<br />');
    
    return processed;
  }, [content, showClozeAnswer]);
  
  if (!rendered) {
    return <span className="text-muted-foreground italic">Conteúdo vazio</span>;
  }

  return (
    <div 
      className={cn(
        "flashcard-content whitespace-pre-wrap break-words",
        "[&_.cloze-blank]:bg-primary/20 [&_.cloze-blank]:px-2 [&_.cloze-blank]:py-0.5 [&_.cloze-blank]:rounded [&_.cloze-blank]:font-mono",
        "[&_.cloze-answer]:bg-green-500/20 [&_.cloze-answer]:px-2 [&_.cloze-answer]:py-0.5 [&_.cloze-answer]:rounded [&_.cloze-answer]:font-semibold [&_.cloze-answer]:text-green-600 dark:[&_.cloze-answer]:text-green-400",
        "[&_.img-placeholder]:inline-flex [&_.img-placeholder]:items-center [&_.img-placeholder]:gap-1 [&_.img-placeholder]:bg-muted [&_.img-placeholder]:px-2 [&_.img-placeholder]:py-1 [&_.img-placeholder]:rounded [&_.img-placeholder]:text-xs [&_.img-placeholder]:text-muted-foreground",
        className
      )}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
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
  
  // Imagens: [img:filename] → 🖼️ filename
  processed = processed.replace(
    /\[img:([^\]]+)\]/g, 
    (_, filename) => `🖼️ ${filename}`
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
