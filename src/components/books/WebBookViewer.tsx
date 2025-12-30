// ============================================
// 📖 LIVROS DO MOISA - Visualizador v3.0
// Leitor interativo com SANCTUM Integration
// Suporta PDF direto + Signed URLs + Prefetch
// ============================================

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { useWebBook } from '@/hooks/useWebBook';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Minimize2,
  BookOpen,
  List,
  X,
  Loader2,
  Shield,
  AlertTriangle,
  MessageCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PdfPageViewer } from './PdfPageViewer';

// ============================================
// TIPOS
// ============================================

interface WebBookViewerProps {
  bookId: string;
  className?: string;
  onClose?: () => void;
}

// ============================================
// SANCTUM WATERMARK OVERLAY
// Com padrão de marca d'água distribuído
// ============================================

const SanctumWatermark = memo(function SanctumWatermark({
  text,
  isOwner
}: {
  text: string;
  isOwner?: boolean;
}) {
  if (isOwner || !text) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden"
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
      }}
    >
      {/* Padrão de marcas d'água diagonal */}
      <div className="absolute inset-0 grid grid-cols-3 gap-12 p-8 opacity-[0.06]">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="text-foreground font-mono text-xs whitespace-nowrap transform rotate-[-30deg] select-none"
            style={{ 
              fontSize: '11px',
              letterSpacing: '0.05em'
            }}
          >
            {text}
          </div>
        ))}
      </div>
      
      {/* Marca central grande */}
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
SanctumWatermark.displayName = 'SanctumWatermark';

// ============================================
// PROTECTION BADGE
// ============================================

const ProtectionBadge = memo(function ProtectionBadge({ isOwner }: { isOwner: boolean }) {
  if (isOwner) {
    return (
      <Badge variant="outline" className="gap-1 text-green-500 border-green-500/30">
        <Shield className="w-3 h-3" />
        OWNER
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="gap-1 text-primary border-primary/30">
      <Shield className="w-3 h-3" />
      PROTEGIDO
    </Badge>
  );
});
ProtectionBadge.displayName = 'ProtectionBadge';

// ============================================
// SUMÁRIO SIDEBAR
// ============================================

const TableOfContents = memo(function TableOfContents({
  pages,
  currentPage,
  onPageSelect,
  isOpen,
  onClose
}: {
  pages: any[];
  currentPage: number;
  onPageSelect: (page: number) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const chapters = pages.reduce((acc, page) => {
    const chapter = page.chapterTitle || 'Páginas';
    if (!acc[chapter]) acc[chapter] = [];
    acc[chapter].push(page);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute left-0 top-0 bottom-0 w-80 bg-background/95 backdrop-blur-xl border-r border-border z-30 flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <List className="w-4 h-4" />
              Sumário
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {Object.entries(chapters).map(([chapter, chapterPages]) => (
                <div key={chapter}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">{chapter}</h4>
                  <div className="space-y-1">
                    {(chapterPages as any[]).map((page) => (
                      <button
                        key={page.pageNumber}
                        onClick={() => {
                          onPageSelect(page.pageNumber);
                          onClose();
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          page.pageNumber === currentPage
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                      >
                        <span className="text-muted-foreground mr-2">p.{page.pageNumber}</span>
                        {page.sectionTitle || `Página ${page.pageNumber}`}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
TableOfContents.displayName = 'TableOfContents';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const WebBookViewer = memo(function WebBookViewer({
  bookId,
  className,
  onClose
}: WebBookViewerProps) {
  const {
    bookData,
    currentPage,
    isLoading,
    error,
    goToPage,
    nextPage,
    previousPage,
    getPageUrl,
    totalPages,
    progressPercent,
    isOwner,
    getWatermarkText,
    reportViolation,
    threatScore,
    needsPdfMode,
    getOriginalPdfPath,
    pdfModeData
  } = useWebBook(bookId);

  // Estado local
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Hook de renderização de PDF (quando necessário)
  const pdfRenderer = usePdfRenderer(bookId, pdfPath || undefined);

  // Carregar caminho do PDF se precisar de modo PDF
  useEffect(() => {
    if (needsPdfMode && !pdfPath) {
      // Primeiro: tentar usar dados do pdfModeData (já vem do RPC)
      if (pdfModeData?.originalPath) {
        setPdfPath(pdfModeData.originalPath);
      } else {
        // Fallback: buscar via getOriginalPdfPath
        getOriginalPdfPath().then(path => {
          if (path) {
            setPdfPath(path);
          }
        });
      }
    }
  }, [needsPdfMode, pdfPath, pdfModeData?.originalPath, getOriginalPdfPath]);

  // Carregar PDF quando tiver o caminho
  useEffect(() => {
    // ✅ P0: Sem retry infinito — se deu erro, só recarrega via ação explícita do usuário
    if (
      pdfPath &&
      needsPdfMode &&
      !pdfRenderer.pdfLoaded &&
      !pdfRenderer.isLoading &&
      !pdfRenderer.error
    ) {
      pdfRenderer.loadPdf();
    }
  }, [
    pdfPath,
    needsPdfMode,
    pdfRenderer.pdfLoaded,
    pdfRenderer.isLoading,
    pdfRenderer.error,
    pdfRenderer.loadPdf,
  ]);

  // Renderizar página do PDF quando mudar de página
  useEffect(() => {
    if (needsPdfMode && pdfRenderer.pdfLoaded && currentPage > 0) {
      pdfRenderer.renderPage(currentPage);
      pdfRenderer.prefetchPages(currentPage);
    }
  }, [needsPdfMode, pdfRenderer.pdfLoaded, currentPage, pdfRenderer.renderPage, pdfRenderer.prefetchPages]);

  // Página atual (modo imagem ou modo PDF)
  const currentPageData = bookData?.pages?.[currentPage - 1];
  const currentPageUrl = needsPdfMode 
    ? pdfRenderer.currentPageData?.dataUrl || ''
    : (currentPageData ? getPageUrl(currentPageData) : '');
  const watermarkText = getWatermarkText();

  // Total de páginas (priorizar PDF se disponível)
  const effectiveTotalPages = needsPdfMode && pdfRenderer.totalPages > 0 
    ? pdfRenderer.totalPages 
    : totalPages;

  // Fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // SANCTUM: Bloquear ações perigosas
  useEffect(() => {
    if (isOwner) return; // Owner não tem bloqueios

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation('context_menu');
      toast.warning('Ação bloqueada pelo SANCTUM');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const blocked = [
        e.ctrlKey && e.key === 's',
        e.ctrlKey && e.key === 'p',
        e.ctrlKey && e.key === 'c',
        e.ctrlKey && e.key === 'u',
        e.key === 'F12',
        e.key === 'PrintScreen',
      ];

      if (blocked.some(Boolean)) {
        e.preventDefault();
        reportViolation('keyboard_shortcut', { key: e.key, ctrl: e.ctrlKey });
        toast.warning('Ação bloqueada pelo SANCTUM');
      }
    };

    const handleBeforePrint = () => {
      reportViolation('print_attempt');
      toast.error('Impressão bloqueada pelo SANCTUM');
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation('copy_attempt');
      toast.warning('Cópia bloqueada pelo SANCTUM');
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [isOwner, reportViolation]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          if (!e.ctrlKey) {
            e.preventDefault();
            nextPage();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousPage();
          break;
        case 'Escape':
          if (showToc) setShowToc(false);
          else if (onClose) onClose();
          break;
        case 'Home':
          goToPage(1);
          break;
        case 'End':
          goToPage(totalPages);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, previousPage, goToPage, totalPages, showToc, onClose]);

  // Reset image loading on page change
  useEffect(() => {
    setImageLoading(true);
  }, [currentPage]);

  // Loading state (inclui loading do PDF)
  const isLoadingAnything = isLoading || (needsPdfMode && pdfRenderer.isLoading && !pdfRenderer.pdfLoaded);
  
  if (isLoadingAnything) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {needsPdfMode ? 'Carregando PDF...' : 'Carregando livro...'}
        </p>
        {needsPdfMode && (
          <Badge variant="outline" className="gap-1">
            <FileText className="w-3 h-3" />
            Modo Renderização Direta
          </Badge>
        )}
      </div>
    );
  }

  // Error state
  const effectiveError = error || pdfRenderer.error;
  if (effectiveError || !bookData?.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h3 className="text-lg font-semibold">Erro ao carregar livro</h3>
        <p className="text-muted-foreground">{effectiveError || bookData?.error}</p>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative flex flex-col h-full min-h-[600px] bg-background",
        isFullscreen && "fixed inset-0 z-50",
        className
      )}
      style={{
        // Anti-screenshot CSS
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowToc(true)}>
            <List className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-sm md:text-base line-clamp-1">
              {bookData.book?.title}
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {bookData.book?.author}
              </p>
              <ProtectionBadge isOwner={isOwner} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Threat indicator */}
          {threatScore > 0 && !isOwner && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {threatScore}
            </Badge>
          )}

          {/* Zoom controls */}
          <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg px-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              disabled={zoom >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>

          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Sumário */}
      <TableOfContents
        pages={bookData.pages || []}
        currentPage={currentPage}
        onPageSelect={goToPage}
        isOpen={showToc}
        onClose={() => setShowToc(false)}
      />

      {/* Área principal */}
      <div className="flex-1 relative overflow-hidden">
        {/* Navegação lateral esquerda */}
        <button
          onClick={previousPage}
          disabled={currentPage <= 1}
          className="absolute left-0 top-0 bottom-0 w-20 z-10 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity disabled:pointer-events-none"
        >
          <div className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg">
            <ChevronLeft className="w-6 h-6" />
          </div>
        </button>

        {/* Navegação lateral direita */}
        <button
          onClick={nextPage}
          disabled={currentPage >= effectiveTotalPages}
          className="absolute right-0 top-0 bottom-0 w-20 z-10 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity disabled:pointer-events-none"
        >
          <div className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {/* Página */}
        <div 
          className="h-full flex items-center justify-center p-4 overflow-auto"
          onDragStart={(e) => e.preventDefault()}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="relative"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            >
              {/* Loading indicator */}
              {(imageLoading || (needsPdfMode && pdfRenderer.isLoading)) && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg min-w-[300px] min-h-[400px]">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    {needsPdfMode && (
                      <span className="text-xs text-muted-foreground">Renderizando página {currentPage}...</span>
                    )}
                  </div>
                </div>
              )}
              
              {currentPageUrl ? (
                <img
                  src={currentPageUrl}
                  alt={`Página ${currentPage}`}
                  className="max-h-[calc(100vh-200px)] w-auto rounded-lg shadow-2xl"
                  style={{ pointerEvents: 'none' }}
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : (
                <div className="flex flex-col items-center justify-center bg-muted rounded-lg min-w-[300px] min-h-[400px] gap-3">
                  <BookOpen className="w-12 h-12 text-muted-foreground" />
                  {needsPdfMode && !pdfRenderer.pdfLoaded && (
                    <p className="text-sm text-muted-foreground">Aguardando PDF...</p>
                  )}
                </div>
              )}

              {/* SANCTUM Watermark overlay */}
              <SanctumWatermark text={watermarkText} isOwner={isOwner} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Modo PDF indicator */}
          {needsPdfMode && (
            <Badge variant="outline" className="gap-1 text-xs">
              <FileText className="w-3 h-3" />
              PDF
            </Badge>
          )}

          {/* Progresso */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                Página {currentPage} de {effectiveTotalPages}
              </span>
              <span className="text-xs text-muted-foreground">
                {effectiveTotalPages > 0 ? Math.round((currentPage / effectiveTotalPages) * 100) : 0}%
              </span>
            </div>
            <Slider
              value={[currentPage]}
              min={1}
              max={effectiveTotalPages || 1}
              step={1}
              onValueChange={([value]) => goToPage(value)}
              className="w-full"
            />
          </div>

          {/* Navegação */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={previousPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextPage}
              disabled={currentPage >= effectiveTotalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </footer>

      {/* Chat flutuante (placeholder) */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-24 right-6 w-12 h-12 rounded-full shadow-lg z-40"
        onClick={() => toast.info('Chat em breve!')}
      >
        <MessageCircle className="w-5 h-5" />
      </Button>
    </div>
  );
});

WebBookViewer.displayName = 'WebBookViewer';

export default WebBookViewer;
