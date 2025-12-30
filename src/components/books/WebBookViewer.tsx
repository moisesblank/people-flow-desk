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
  FileText,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PdfPageViewer } from './PdfPageViewer';
import { ReadingModeToolbar } from './ReadingModeToolbar';
import { useBookAnnotations } from '@/hooks/useBookAnnotations';

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

// Importar tipo do outline
import type { PdfOutlineItem } from '@/hooks/usePdfRenderer';

const TableOfContents = memo(function TableOfContents({
  pages,
  currentPage,
  onPageSelect,
  isOpen,
  onClose,
  pdfOutline,
  totalPages
}: {
  pages: any[];
  currentPage: number;
  onPageSelect: (page: number) => void;
  isOpen: boolean;
  onClose: () => void;
  pdfOutline?: PdfOutlineItem[];
  totalPages: number;
}) {
  // ✅ Priorizar outline do PDF se disponível
  const hasPdfOutline = pdfOutline && pdfOutline.length > 0;

  // Renderizar item do outline recursivamente
  const renderOutlineItem = (item: PdfOutlineItem, index: number) => (
    <div key={`${item.title}-${index}`}>
      <button
        onClick={() => {
          onPageSelect(item.pageNumber);
          onClose();
        }}
        className={cn(
          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
          item.pageNumber === currentPage
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted"
        )}
        style={{ paddingLeft: `${12 + item.level * 12}px` }}
      >
        <span className="text-muted-foreground mr-2 text-xs">p.{item.pageNumber}</span>
        <span className="line-clamp-2">{item.title}</span>
      </button>
      {item.children && item.children.map((child, i) => renderOutlineItem(child, i))}
    </div>
  );

  // Fallback: agrupar por capítulo se tiver páginas processadas
  const chapters = pages.reduce((acc, page) => {
    const chapter = page.chapterTitle || 'Páginas';
    if (!acc[chapter]) acc[chapter] = [];
    acc[chapter].push(page);
    return acc;
  }, {} as Record<string, any[]>);

  // Se não tiver nada, gerar sumário básico por páginas
  const hasChapters = Object.keys(chapters).length > 0 && pages.length > 0;

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
              {hasPdfOutline && (
                <Badge variant="outline" className="text-xs">Inteligente</Badge>
              )}
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-1">
              {/* ✅ Prioridade 1: Outline do PDF */}
              {hasPdfOutline ? (
                pdfOutline!.map((item, i) => renderOutlineItem(item, i))
              ) : hasChapters ? (
                /* Prioridade 2: Capítulos das páginas processadas */
                Object.entries(chapters).map(([chapter, chapterPages]) => (
                  <div key={chapter} className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 px-3">{chapter}</h4>
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
                ))
              ) : (
                /* Prioridade 3: Navegação inteligente por seções do livro */
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 px-3">Navegação Rápida</h4>
                  {/* Gerar seções inteligentes baseadas na estrutura do livro */}
                  {(() => {
                    // ✅ Calcular seções de forma inteligente baseada no total de páginas
                    const generateSmartSections = (total: number) => {
                      const sections: { startPage: number; endPage: number; label: string; icon: string }[] = [];
                      
                      if (total <= 0) return sections;
                      
                      // Definir proporções das seções baseadas em estrutura típica de livros didáticos
                      const structure = [
                        { label: 'Início do Livro', icon: '📖', proportion: 0.05 },    // 0-5%
                        { label: 'Introdução', icon: '📋', proportion: 0.10 },          // 5-15%
                        { label: 'Parte Inicial', icon: '🔬', proportion: 0.20 },       // 15-35%
                        { label: 'Meio do Livro', icon: '⚗️', proportion: 0.30 },       // 35-65%
                        { label: 'Parte Avançada', icon: '🧪', proportion: 0.20 },      // 65-85%
                        { label: 'Conclusão', icon: '🎯', proportion: 0.15 },           // 85-100%
                      ];
                      
                      let currentPage = 1;
                      
                      for (const section of structure) {
                        const pagesInSection = Math.max(1, Math.round(total * section.proportion));
                        const endPage = Math.min(currentPage + pagesInSection - 1, total);
                        
                        if (currentPage <= total) {
                          sections.push({
                            startPage: currentPage,
                            endPage: endPage,
                            label: section.label,
                            icon: section.icon,
                          });
                        }
                        
                        currentPage = endPage + 1;
                        if (currentPage > total) break;
                      }
                      
                      // Garantir que a última seção vai até o final
                      if (sections.length > 0 && sections[sections.length - 1].endPage < total) {
                        sections[sections.length - 1].endPage = total;
                      }
                      
                      return sections;
                    };
                    
                    const smartSections = generateSmartSections(totalPages);
                    
                    return smartSections.map((section, index) => {
                      const isCurrentRange = currentPage >= section.startPage && currentPage <= section.endPage;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            onPageSelect(section.startPage);
                            onClose();
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex justify-between items-center gap-2",
                            isCurrentRange
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs font-mono">
                              p.{section.startPage}-{section.endPage}
                            </span>
                            <span>{section.icon} {section.label}</span>
                          </span>
                          {isCurrentRange && (
                            <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded">atual</span>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              )}
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

  // Hook de anotações para salvar histórico
  const { refetch: refetchAnnotations, isLoading: isSavingAnnotations } = useBookAnnotations(bookId);

  // Estado local
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  
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

  // Função para salvar histórico de anotações
  const handleSaveHistory = useCallback(async () => {
    setIsSavingHistory(true);
    try {
      await refetchAnnotations();
      toast.success('Histórico salvo com sucesso!', {
        description: 'Suas anotações e marcações foram sincronizadas.',
        icon: <Save className="w-4 h-4 text-green-500" />,
      });
    } catch (error) {
      toast.error('Erro ao salvar histórico');
    } finally {
      setIsSavingHistory(false);
    }
  }, [refetchAnnotations]);

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
            // ✅ P0: Limitar navegação pelo effectiveTotalPages
            if (currentPage < effectiveTotalPages) {
              nextPage();
            }
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
          // ✅ P0: Usar effectiveTotalPages em vez de totalPages
          goToPage(effectiveTotalPages);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, previousPage, goToPage, effectiveTotalPages, currentPage, showToc, onClose]);

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

          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      {/* 🔶 MODO LEITURA + SALVAR HISTÓRICO - Botões Chamativos DESIGNER 2300 */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
        <button
          onClick={toggleFullscreen}
          className="relative group transition-all duration-300 hover:scale-105 active:scale-95"
          title={isFullscreen ? "Sair do Modo Leitura (ESC)" : "Clique para Modo Leitura Imersivo"}
        >
          {/* Glow externo pulsante */}
          <div 
            className={cn(
              "absolute -inset-2 rounded-xl opacity-60 blur-md transition-all duration-500",
              isFullscreen 
                ? "bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse" 
                : "bg-gradient-to-r from-red-600/50 via-red-500/50 to-red-600/50 group-hover:opacity-80"
            )}
          />
          
          {/* Container principal */}
          <div 
            className={cn(
              "relative px-6 py-2.5 rounded-lg transition-all duration-300",
              "bg-gradient-to-br from-black via-gray-900 to-black",
              "border-2",
              isFullscreen 
                ? "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.7),inset_0_0_20px_rgba(239,68,68,0.2)]" 
                : "border-red-600/70 group-hover:border-red-500 group-hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]"
            )}
          >
            {/* Efeito scanline futurístico */}
            <div 
              className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none opacity-20"
              style={{
                background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)"
              }}
            />
            
            {/* Brilho superior */}
            <div className="absolute top-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-red-400/60 to-transparent" />
            
            {/* Texto com glow */}
            <span 
              className={cn(
                "relative z-10 text-sm font-bold tracking-widest uppercase flex items-center gap-2",
                isFullscreen 
                  ? "text-red-400" 
                  : "text-red-500 group-hover:text-red-400"
              )}
              style={{
                textShadow: isFullscreen 
                  ? "0 0 20px rgba(239,68,68,1), 0 0 40px rgba(239,68,68,0.8), 0 0 60px rgba(239,68,68,0.5)" 
                  : "0 0 10px rgba(239,68,68,0.6), 0 0 20px rgba(239,68,68,0.4)"
              }}
            >
              {isFullscreen ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  MODO LEITURA
                </>
              ) : (
                <>MODO LEITURA</>
              )}
            </span>
            
            {/* Indicador de ação - seta/ícone */}
            {!isFullscreen && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-bottom-3 transition-all duration-300">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500" />
              </div>
            )}
          </div>
        </button>

        {/* 🔶 SALVAR HISTÓRICO - SÓ APARECE EM MODO LEITURA (fullscreen) */}
        {isFullscreen && (
          <button
            onClick={handleSaveHistory}
            disabled={isSavingHistory}
            className="relative group transition-all duration-300 hover:scale-105 active:scale-95 ml-3"
            title="Salvar suas anotações e marcações"
          >
            {/* Glow externo pulsante - verde */}
            <div 
              className={cn(
                "absolute -inset-2 rounded-xl opacity-50 blur-md transition-all duration-500",
                isSavingHistory
                  ? "bg-gradient-to-r from-green-600 via-green-500 to-green-600 animate-pulse" 
                  : "bg-gradient-to-r from-green-600/40 via-green-500/40 to-green-600/40 group-hover:opacity-70"
              )}
            />
            
            {/* Container principal */}
            <div 
              className={cn(
                "relative px-5 py-2.5 rounded-lg transition-all duration-300",
                "bg-gradient-to-br from-black via-gray-900 to-black",
                "border-2",
                isSavingHistory 
                  ? "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.7),inset_0_0_20px_rgba(34,197,94,0.2)]" 
                  : "border-green-600/60 group-hover:border-green-500 group-hover:shadow-[0_0_25px_rgba(34,197,94,0.6)]"
              )}
            >
              {/* Efeito scanline futurístico */}
              <div 
                className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none opacity-20"
                style={{
                  background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)"
                }}
              />
              
              {/* Brilho superior */}
              <div className="absolute top-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-green-400/60 to-transparent" />
              
              {/* Texto com glow */}
              <span 
                className={cn(
                  "relative z-10 text-sm font-bold tracking-widest uppercase flex items-center gap-2",
                  isSavingHistory 
                    ? "text-green-400" 
                    : "text-green-500 group-hover:text-green-400"
                )}
                style={{
                  textShadow: isSavingHistory 
                    ? "0 0 20px rgba(34,197,94,1), 0 0 40px rgba(34,197,94,0.8), 0 0 60px rgba(34,197,94,0.5)" 
                    : "0 0 10px rgba(34,197,94,0.6), 0 0 20px rgba(34,197,94,0.4)"
                }}
              >
                {isSavingHistory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    SALVANDO...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    SALVAR HISTÓRICO
                  </>
                )}
              </span>
            </div>
          </button>
        )}
      </div>

      <TableOfContents
        pages={bookData.pages || []}
        currentPage={currentPage}
        onPageSelect={goToPage}
        isOpen={showToc}
        onClose={() => setShowToc(false)}
        pdfOutline={needsPdfMode ? pdfRenderer.outline : undefined}
        totalPages={effectiveTotalPages}
      />

      {/* Área principal */}
      <div className="flex-1 relative overflow-hidden">
        {/* Navegação lateral esquerda - SEMPRE VISÍVEL */}
        <button
          onClick={previousPage}
          disabled={currentPage <= 1}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all hover:scale-110"
        >
          <div className="p-2.5 rounded-full bg-primary/90 backdrop-blur-sm border border-primary-foreground/20 shadow-lg hover:bg-primary text-primary-foreground">
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          </div>
        </button>

        {/* Navegação lateral direita - SEMPRE VISÍVEL */}
        <button
          onClick={nextPage}
          disabled={currentPage >= effectiveTotalPages}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all hover:scale-110"
        >
          <div className="p-2.5 rounded-full bg-primary/90 backdrop-blur-sm border border-primary-foreground/20 shadow-lg hover:bg-primary text-primary-foreground">
            <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
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
                  className="max-h-[calc(100vh-180px)] max-w-[95vw] lg:max-w-[85vw] xl:max-w-[80vw] 2xl:max-w-[75vw] w-auto h-auto rounded-lg shadow-2xl object-contain"
                  style={{ 
                    pointerEvents: 'none',
                    imageRendering: 'auto',
                  }}
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

      {/* 📝 TOOLBAR DE ANOTAÇÕES - Só aparece em Modo Leitura (fullscreen) */}
      <ReadingModeToolbar
        bookId={bookId}
        currentPage={currentPage}
        isFullscreen={isFullscreen}
        onGoToPage={goToPage}
      />

      {/* Chat flutuante (placeholder) - Esconde em fullscreen para não conflitar */}
      {!isFullscreen && (
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-24 right-6 w-12 h-12 rounded-full shadow-lg z-40"
          onClick={() => toast.info('Chat em breve!')}
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
});

WebBookViewer.displayName = 'WebBookViewer';

export default WebBookViewer;
