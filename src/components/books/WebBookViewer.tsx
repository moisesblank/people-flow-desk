// ============================================
// 📖 LIVROS DO MOISA - Visualizador de Livro Web
// Leitor interativo com proteção SANCTUM
// ============================================

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { useWebBook } from '@/hooks/useWebBook';
import { useContentProtection } from '@/hooks/useContentProtection';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Minimize2,
  BookOpen,
  Bookmark,
  Highlighter,
  List,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

interface WebBookViewerProps {
  bookId: string;
  className?: string;
  onClose?: () => void;
}

// ============================================
// WATERMARK OVERLAY
// ============================================

const WatermarkOverlay = memo(function WatermarkOverlay({
  watermark,
  isOwner
}: {
  watermark?: { userName?: string; userEmail?: string; userCpf?: string; seed: string };
  isOwner?: boolean;
}) {
  if (isOwner || !watermark?.userName) return null;

  const maskCpf = (cpf?: string) => {
    if (!cpf) return '***';
    return `***.***.${cpf.slice(-6, -3)}-${cpf.slice(-2)}`;
  };

  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden"
      style={{ userSelect: 'none' }}
    >
      {/* Padrão de marcas d'água */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute text-foreground/5 text-xs font-mono whitespace-nowrap transform rotate-[-30deg]"
          style={{
            top: `${15 + i * 18}%`,
            left: `${(i % 2) * 20}%`,
          }}
        >
          {watermark.userName} • {maskCpf(watermark.userCpf)} • {watermark.seed.slice(0, 8)}
        </div>
      ))}
    </div>
  );
});
WatermarkOverlay.displayName = 'WatermarkOverlay';

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
  // Agrupar por capítulos
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
    watermark
  } = useWebBook(bookId);

  // Proteção de conteúdo
  useContentProtection('lesson', bookId, true);

  // Estado local
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Página atual
  const currentPageData = bookData?.pages?.[currentPage - 1];
  const currentPageUrl = currentPageData ? getPageUrl(currentPageData) : '';

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextPage();
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando livro...</p>
      </div>
    );
  }

  // Error state
  if (error || !bookData?.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Erro ao carregar livro</h3>
        <p className="text-muted-foreground">{error || bookData?.error}</p>
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
            <p className="text-xs text-muted-foreground">
              {bookData.book?.author}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          disabled={currentPage >= totalPages}
          className="absolute right-0 top-0 bottom-0 w-20 z-10 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity disabled:pointer-events-none"
        >
          <div className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {/* Página */}
        <div 
          className="h-full flex items-center justify-center p-4 overflow-auto"
          style={{
            // Anti print-screen CSS
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
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
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              
              <img
                src={currentPageUrl}
                alt={`Página ${currentPage}`}
                className="max-h-[calc(100vh-200px)] w-auto rounded-lg shadow-2xl"
                style={{
                  // Proteções
                  pointerEvents: 'none',
                }}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />

              {/* Watermark overlay */}
              <WatermarkOverlay watermark={watermark} isOwner={isOwner} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Progresso */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <span className="text-xs text-muted-foreground">
                {progressPercent.toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[currentPage]}
              min={1}
              max={totalPages}
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
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
});

WebBookViewer.displayName = 'WebBookViewer';

export default WebBookViewer;
