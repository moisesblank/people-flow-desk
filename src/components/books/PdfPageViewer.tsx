// ============================================
// 📄 PDF PAGE VIEWER — Renderizador Direto
// Renderiza páginas do PDF client-side
// Fallback para livros sem imagens processadas
// ============================================

import React, { memo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, BookOpen, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PdfPageViewerProps {
  pageNumber: number;
  dataUrl: string | null;
  isLoading: boolean;
  error?: string | null;
  zoom: number;
  watermarkText?: string;
  isOwner?: boolean;
  onRetry?: () => void;
  className?: string;
}

// ============================================
// SANCTUM WATERMARK (duplicado para encapsulamento)
// ============================================

const PdfWatermark = memo(function PdfWatermark({
  text,
  isOwner
}: {
  text?: string;
  isOwner?: boolean;
}) {
  if (isOwner || !text) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden"
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Padrão de marcas d'água */}
      <div className="absolute inset-0 grid grid-cols-3 gap-12 p-8 opacity-[0.06]">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="text-foreground font-mono text-xs whitespace-nowrap transform rotate-[-30deg] select-none"
            style={{ fontSize: '11px', letterSpacing: '0.05em' }}
          >
            {text}
          </div>
        ))}
      </div>
      
      {/* Marca central */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
        <div 
          className="text-foreground font-mono text-2xl whitespace-nowrap transform rotate-[-30deg] select-none"
          style={{ letterSpacing: '0.1em' }}
        >
          {text}
        </div>
      </div>
    </div>
  );
});
PdfWatermark.displayName = 'PdfWatermark';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const PdfPageViewer = memo(function PdfPageViewer({
  pageNumber,
  dataUrl,
  isLoading,
  error,
  zoom,
  watermarkText,
  isOwner,
  onRetry,
  className
}: PdfPageViewerProps) {

  // Estado de loading da imagem
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset ao mudar página
  useEffect(() => {
    setImageLoaded(false);
  }, [pageNumber, dataUrl]);

  // Loading state
  if (isLoading && !dataUrl) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-lg min-w-[300px] min-h-[400px]",
        className
      )}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Renderizando página {pageNumber}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center bg-muted rounded-lg min-w-[300px] min-h-[400px] gap-4",
        className
      )}>
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-sm text-muted-foreground text-center max-w-xs">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  // No content
  if (!dataUrl) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-lg min-w-[300px] min-h-[400px]",
        className
      )}>
        <BookOpen className="w-12 h-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`page-${pageNumber}`}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.2 }}
        className={cn("relative", className)}
        style={{ 
          transform: `scale(${zoom})`, 
          transformOrigin: 'center'
        }}
      >
        {/* Loading overlay */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-lg z-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Imagem renderizada */}
        <img
          src={dataUrl}
          alt={`Página ${pageNumber}`}
          className={cn(
            "max-h-[calc(100vh-200px)] w-auto rounded-lg shadow-2xl transition-opacity",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{ 
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          onLoad={() => setImageLoaded(true)}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Watermark overlay */}
        <PdfWatermark text={watermarkText} isOwner={isOwner} />
      </motion.div>
    </AnimatePresence>
  );
});

PdfPageViewer.displayName = 'PdfPageViewer';

export default PdfPageViewer;
