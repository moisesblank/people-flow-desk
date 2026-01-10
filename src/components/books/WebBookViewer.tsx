// ============================================
// 📖 LIVROS DO MOISA - Visualizador v3.0
// Leitor interativo com SANCTUM Integration
// Suporta PDF direto + Signed URLs + Prefetch
// ============================================

import React, { memo, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useWebBook } from '@/hooks/useWebBook';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import { useBookSecurityGuard } from '@/hooks/useBookSecurityGuard';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { useStaggeredMount } from '@/hooks/useStaggeredMount';
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
import { SacredImage } from '@/components/performance/SacredImage';
import { PdfPageViewer } from './PdfPageViewer';
import { ReadingModeToolbar, ToolMode } from './ReadingModeToolbar';
import { useBookAnnotations } from '@/hooks/useBookAnnotations';
import { useBookPageOverlays } from '@/hooks/useBookPageOverlays';
import { CalculatorButton } from '@/components/Calculator';
import { PeriodicTableButton } from '@/components/PeriodicTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DrawingCanvas, DrawingStroke, TextAnnotation } from './DrawingCanvas';

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
// Com padrão de marca d'água FORENSE - CPF + EMAIL
// TRANSLÚCIDO MAS VISÍVEL - Proteção de conteúdo
// ============================================

const SanctumWatermark = memo(function SanctumWatermark({
  text
}: {
  text: string;
}) {
  if (!text) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden"
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
      }}
    >
      {/* Padrão de marcas d'água diagonal AUMENTADO */}
      <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 gap-8 p-4 opacity-[0.12]">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="text-gray-600 dark:text-gray-400 font-mono text-xs whitespace-nowrap transform rotate-[-25deg] select-none"
            style={{ 
              fontSize: '10px',
              letterSpacing: '0.03em',
              textShadow: '0 0 2px rgba(0,0,0,0.3)'
            }}
          >
            {text}
          </div>
        ))}
      </div>
      
      {/* MARCA CENTRAL GRANDE E VISÍVEL - CPF + EMAIL */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.15]">
        <div 
          className="text-gray-700 dark:text-gray-300 font-mono font-bold whitespace-nowrap transform rotate-[-20deg] select-none text-center"
          style={{ 
            fontSize: 'clamp(16px, 3vw, 28px)',
            letterSpacing: '0.08em',
            textShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 8px rgba(0,0,0,0.2)'
          }}
        >
          {text}
        </div>
      </div>
      
      {/* Marca adicional nos cantos para redundância */}
      <div className="absolute top-4 left-4 opacity-[0.18]">
        <div 
          className="text-gray-600 dark:text-gray-400 font-mono text-[9px] whitespace-nowrap select-none"
          style={{ textShadow: '0 0 2px rgba(0,0,0,0.3)' }}
        >
          {text}
        </div>
      </div>
      <div className="absolute bottom-4 right-4 opacity-[0.18]">
        <div 
          className="text-gray-600 dark:text-gray-400 font-mono text-[9px] whitespace-nowrap select-none"
          style={{ textShadow: '0 0 2px rgba(0,0,0,0.3)' }}
        >
          {text}
        </div>
      </div>
      <div className="absolute top-4 right-4 opacity-[0.18]">
        <div 
          className="text-gray-600 dark:text-gray-400 font-mono text-[9px] whitespace-nowrap select-none"
          style={{ textShadow: '0 0 2px rgba(0,0,0,0.3)' }}
        >
          {text}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 opacity-[0.18]">
        <div 
          className="text-gray-600 dark:text-gray-400 font-mono text-[9px] whitespace-nowrap select-none"
          style={{ textShadow: '0 0 2px rgba(0,0,0,0.3)' }}
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

  // Hook de anotações para salvar histórico (anotações/bmarks)
  const { refetch: refetchAnnotations } = useBookAnnotations(bookId);

  // Hook de overlays (desenhos + texto do canvas) — persistência por aluno
  const { getOverlayForPage, saveOverlays, refetchOverlays } = useBookPageOverlays(bookId);

  // ✅ STAGGER: Montagem escalonada para melhor TTI
  const stagger = useStaggeredMount(true, currentPage);

  // 🛡️ BOOK SECURITY GUARD — Anti-PrintScreen/DevTools (Owner bypass)
  // ✅ M4: Sistema de escalonamento de resposta
  // ✅ STAGGER: Só ativa listeners quando listenersReady = true
  const { user } = useAuth();
  const { showSevereOverlay } = useBookSecurityGuard({
    bookId,
    bookTitle: bookData?.book?.title,
    isOwner: isOwner || false,
    userId: user?.id,
    userEmail: user?.email || undefined,
    userName: user?.user_metadata?.name,
    enabled: stagger.listenersReady, // ✅ STAGGER: Só ativa após Frame 3
    onViolation: (type) => {
      // Reportar violação ao sistema Sanctum também
      reportViolation(type, { source: 'book_security_guard' });
    },
    onSessionEnd: () => {
      // M4: Encerrar sessão e redirecionar ao atingir limite
      toast.error('Você foi desconectado por violações repetidas.');
      onClose?.();
    },
  });

  // Estado local
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  
  
  // Estado de ferramentas de desenho
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [drawingColor, setDrawingColor] = useState('#fef08a'); // Amarelo padrão para marca-texto
  const [drawingSize, setDrawingSize] = useState(3);
  const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([]);
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);

  // ✅ Dirty pages: evita sobrescrever edições locais quando o cache de overlays refetchar
  const [dirtyOverlayPages, setDirtyOverlayPages] = useState<Set<number>>(() => new Set());
  const markDirtyPage = useCallback((page: number) => {
    setDirtyOverlayPages((prev) => {
      const next = new Set(prev);
      next.add(page);
      return next;
    });
  }, []);
  const clearDirtyPages = useCallback((pages: number[] | Set<number>) => {
    const list = Array.isArray(pages) ? pages : Array.from(pages);
    setDirtyOverlayPages((prev) => {
      const next = new Set(prev);
      list.forEach((p) => next.delete(p));
      return next;
    });
  }, []);

  const handleStrokesChange = useCallback(
    (next: DrawingStroke[]) => {
      setDrawingStrokes(next);
      markDirtyPage(currentPage);
    },
    [currentPage, markDirtyPage]
  );

  const handleTextAnnotationsChange = useCallback(
    (next: TextAnnotation[]) => {
      setTextAnnotations(next);
      markDirtyPage(currentPage);
    },
    [currentPage, markDirtyPage]
  );
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

  // Sincronizar estado com mudanças de fullscreen (ESC, clique fora, etc)
  // ✅ Ao sair do modo leitura: desativar ferramentas; e limpar overlays locais SOMENTE se não estiver salvando
  useEffect(() => {
    const handleFullscreenChange = () => {
      const nowFullscreen = !!document.fullscreenElement;

      // Se SAIU do fullscreen (estava true, agora false)
      if (isFullscreen && !nowFullscreen) {
        console.log('[WebBookViewer] Saindo do Modo Leitura - desativando ferramentas');
        setActiveTool('select');

        // Evitar “limpar enquanto salva” (poderia zerar o payload)
        if (!isSavingHistory) {
          // Limpar estados locais (ao voltar, recarrega do banco)
          setDrawingStrokes([]);
          setTextAnnotations([]);
          clearDirtyPages(dirtyOverlayPages);
        }
      }

      setIsFullscreen(nowFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen, isSavingHistory, clearDirtyPages, dirtyOverlayPages]);

  // Função para salvar histórico de anotações + overlays (desenhos/texto)
  const handleSaveHistory = useCallback(async () => {
    setIsSavingHistory(true);
    try {
      // 1) Salvar overlays do canvas por página (por aluno)
      const pagesWithData = new Set<number>();
      drawingStrokes.forEach((s) => pagesWithData.add(s.pageNumber));
      textAnnotations.forEach((t) => pagesWithData.add(t.pageNumber));

      const overlayPayload = Array.from(pagesWithData).map((page) => ({
        book_id: bookId,
        page_number: page,
        strokes: (drawingStrokes.filter((s) => s.pageNumber === page) as unknown) as any,
        texts: (textAnnotations.filter((t) => t.pageNumber === page) as unknown) as any,
      }));

      if (overlayPayload.length) {
        await saveOverlays(overlayPayload as any);
        // ✅ Garantir que os overlays em cache reflitam o que acabou de salvar
        await refetchOverlays();
        // ✅ Após salvar, liberar as páginas para serem sobrescritas pelo cache (agora é “fonte da verdade”)
        clearDirtyPages(pagesWithData);
      }

      // 2) Refetch das anotações tradicionais (notes/bookmarks)
      await refetchAnnotations();

      toast.success('Histórico salvo com sucesso!', {
        description: 'Anotações, marcações e desenhos foram persistidos.',
        icon: <Save className="w-4 h-4 text-green-500" />,
      });
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
      toast.error('Erro ao salvar histórico');
    } finally {
      setIsSavingHistory(false);
    }
  }, [bookId, drawingStrokes, textAnnotations, saveOverlays, refetchOverlays, refetchAnnotations, clearDirtyPages]);

  useEffect(() => {
    if (isOwner) return; // Owner não tem bloqueios

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation('context_menu');
      toast.warning('Ação bloqueada pelo SANCTUM');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 🚨 PROTEÇÃO DEVTOOLS DESATIVADA POR ORDEM DO OWNER (2026-01-06)
      // F12 e PrintScreen agora permitidos
      const blocked = [
        e.ctrlKey && e.key === 's',
        e.ctrlKey && e.key === 'p',
        e.ctrlKey && e.key === 'c',
        e.ctrlKey && e.key === 'u',
        // e.key === 'F12', // DESATIVADO
        // e.key === 'PrintScreen', // DESATIVADO
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

  // ✅ P0-FIX: Carregar TODOS os overlays do banco ao ENTRAR no modo leitura
  const [overlaysInitialized, setOverlaysInitialized] = useState(false);
  
  useEffect(() => {
    // Quando ENTRAR no fullscreen, carregar TODOS os overlays de uma vez
    if (isFullscreen && !overlaysInitialized) {
      const allOverlays = Array.from({ length: effectiveTotalPages }, (_, i) => i + 1)
        .map((page) => getOverlayForPage(page))
        .filter(Boolean);
      
      const allStrokes: DrawingStroke[] = [];
      const allTexts: TextAnnotation[] = [];
      
      allOverlays.forEach((overlay) => {
        if (overlay) {
          const strokes = (overlay.strokes as any[]) || [];
          const texts = (overlay.texts as any[]) || [];
          allStrokes.push(...strokes);
          allTexts.push(...texts);
        }
      });
      
      if (allStrokes.length > 0 || allTexts.length > 0) {
        console.log('[WebBookViewer] ✅ Carregando overlays do banco:', { 
          strokes: allStrokes.length, 
          texts: allTexts.length 
        });
        setDrawingStrokes(allStrokes);
        setTextAnnotations(allTexts);
      }
      setOverlaysInitialized(true);
    }
    
    // Resetar flag ao sair do fullscreen
    if (!isFullscreen && overlaysInitialized) {
      setOverlaysInitialized(false);
    }
  }, [isFullscreen, overlaysInitialized, effectiveTotalPages, getOverlayForPage]);

  // Carregar overlays da página atual quando navegar (para páginas não carregadas ainda)
  useEffect(() => {
    if (!isFullscreen || !overlaysInitialized) return;

    // ✅ Se o usuário já mexeu nesta página e ainda não salvou, não sobrescrever pelo cache
    if (dirtyOverlayPages.has(currentPage)) return;

    // Verificar se já temos strokes desta página
    const existingStrokes = drawingStrokes.filter((s) => s.pageNumber === currentPage);
    const existingTexts = textAnnotations.filter((t) => t.pageNumber === currentPage);
    
    // Se já tem dados locais para esta página, não sobrescrever
    if (existingStrokes.length > 0 || existingTexts.length > 0) return;

    const overlay = getOverlayForPage(currentPage);
    if (!overlay) return;

    const strokes = (overlay.strokes as any[]) || [];
    const texts = (overlay.texts as any[]) || [];

    if (strokes.length > 0 || texts.length > 0) {
      console.log('[WebBookViewer] Carregando overlay da página', currentPage);
      setDrawingStrokes((prev) => [
        ...prev.filter((s) => s.pageNumber !== currentPage),
        ...strokes,
      ]);

      setTextAnnotations((prev) => [
        ...prev.filter((t) => t.pageNumber !== currentPage),
        ...texts,
      ]);
    }
  }, [isFullscreen, overlaysInitialized, currentPage, getOverlayForPage, dirtyOverlayPages, drawingStrokes, textAnnotations]);

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
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* M4: OVERLAY SEVERO DE VIOLAÇÃO                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSevereOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center p-8 max-w-lg"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ 
                  duration: 0.5, 
                  repeat: Infinity,
                  repeatDelay: 1 
                }}
              >
                <Shield className="w-24 h-24 text-red-500 mx-auto mb-6" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-red-500 mb-4 tracking-wider">
                ⚠️ VIOLAÇÃO DETECTADA
              </h2>
              
              <p className="text-white/80 text-lg mb-2">
                Tentativas de captura de tela são <strong className="text-red-400">proibidas</strong>.
              </p>
              
              <p className="text-red-400/80 text-sm mb-6">
                Esta ação foi registrada. Tentativas adicionais resultarão no encerramento da sua sessão.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-white/50 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                Aguarde 5 segundos...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          
          
          {/* Controles de Zoom - APENAS NO MODO LEITURA (fullscreen) */}
          {isFullscreen && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 border border-red-500/30">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-red-500/20"
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs w-14 text-center text-white font-medium">{Math.round(zoom * 100)}%</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-red-500/20"
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          )}

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
                  MODO LEITURA ATIVADO
                </>
              ) : (
                <>Clique aqui para ativar o modo leitura</>
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
                    Clique para salvar e sair do modo leitura.
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

        {/* 🔶 FERRAMENTAS RÁPIDAS - Calculadora e Tabela Periódica (APENAS EM MODO LEITURA) */}
        {isFullscreen && (
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="fixed right-3 top-[calc(50%+80px)] z-[70] pointer-events-auto"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onClickCapture={(e) => e.stopPropagation()}
          >
            {/* Container principal com glow */}
            <div className="relative">
              {/* Glow externo */}
              <div className="absolute -inset-2 rounded-2xl opacity-40 blur-lg bg-gradient-to-b from-blue-600 via-teal-500 to-emerald-600 animate-pulse pointer-events-none" />
              
              {/* Painel de ferramentas */}
              <div className="relative flex flex-col gap-2 p-3 rounded-xl bg-gradient-to-br from-black via-gray-900 to-black border-2 border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.4),inset_0_0_15px_rgba(6,182,212,0.1)]">
                {/* Efeito scanline */}
                <div 
                  className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none opacity-20"
                  style={{
                    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)"
                  }}
                />
                
                {/* Brilho superior */}
                <div className="absolute top-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
                
                {/* Label */}
                <span 
                  className="text-[9px] font-bold tracking-widest uppercase text-cyan-400 text-center"
                  style={{ textShadow: "0 0 8px rgba(6,182,212,0.6)" }}
                >
                  QUÍMICA
                </span>
                
                {/* Calculadora - Usando diretamente o componente */}
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-lg opacity-0 hover:opacity-60 blur-sm bg-blue-500 transition-all duration-300 pointer-events-none" />
                  <div className="relative rounded-lg bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/40 hover:border-blue-400 transition-all">
                    <CalculatorButton />
                  </div>
                </div>
                
                {/* Separador */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                
                {/* Tabela Periódica - Usando diretamente o componente */}
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-lg opacity-0 hover:opacity-60 blur-sm bg-teal-500 transition-all duration-300 pointer-events-none" />
                  <div className="relative rounded-lg bg-teal-600/20 border border-teal-500/40 hover:bg-teal-600/40 hover:border-teal-400 transition-all">
                    <PeriodicTableButton />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Página */}
        <div 
          className="h-full flex items-center justify-center p-4 overflow-auto"
          onDragStart={(e) => e.preventDefault()}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0, scale: zoom }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2, scale: { duration: 0.15 } }}
              className="relative"
              style={{ transformOrigin: 'center' }}
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
                <>
                  <div 
                    className="max-h-[calc(100vh-180px)] max-w-[95vw] lg:max-w-[85vw] xl:max-w-[80vw] 2xl:max-w-[75vw] w-auto h-auto rounded-lg shadow-2xl pointer-events-none select-none"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <SacredImage
                      src={currentPageUrl}
                      alt={`Página ${currentPage}`}
                      className="w-full h-full rounded-lg"
                      objectFit="contain"
                      onLoad={() => setImageLoading(false)}
                      onError={() => setImageLoading(false)}
                    />
                  </div>
                  
                  {/* 🎨 CANVAS DE DESENHO - Só ativo em Modo Leitura */}
                  {/* ✅ STAGGER: Overlays só montam após Frame 2 */}
                  {stagger.overlaysReady && isFullscreen && (
                    <DrawingCanvas
                      isActive={isFullscreen && activeTool !== 'select'}
                      activeTool={activeTool}
                      color={drawingColor}
                      size={drawingSize}
                      pageNumber={currentPage}
                      strokes={drawingStrokes}
                      onStrokesChange={handleStrokesChange}
                      textAnnotations={textAnnotations}
                      onTextAnnotationsChange={handleTextAnnotationsChange}
                    />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center bg-muted rounded-lg min-w-[300px] min-h-[400px] gap-3">
                  <BookOpen className="w-12 h-12 text-muted-foreground" />
                  {needsPdfMode && !pdfRenderer.pdfLoaded && (
                    <p className="text-sm text-muted-foreground">Aguardando PDF...</p>
                  )}
                </div>
              )}

              {/* SANCTUM Watermark overlay - SEMPRE VISÍVEL PARA TODOS (incluindo OWNER) */}
              {/* ✅ STAGGER: Watermark só monta após Frame 1 */}
              {stagger.watermarkReady && (
                <SanctumWatermark 
                  text={watermarkText || `CPF: 09290783491 | moisesblank@gmail.com`} 
                />
              )}
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
        activeTool={activeTool}
        onToolChange={setActiveTool}
        drawingColor={drawingColor}
        onColorChange={setDrawingColor}
        drawingSize={drawingSize}
        onSizeChange={setDrawingSize}
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
