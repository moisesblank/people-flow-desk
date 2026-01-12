// ============================================
// 🔥 PROTECTED PDF VIEWER V2 - DOGMA III EVOLVED
// PDF.js + Fabric.js + Full Security + Universal Anti-Debugger
// Todas proteções V1 + Modo Leitura (Anotações Temporárias)
// v2.1: Integração com useContentSecurityGuard
// ============================================

import { useState, useEffect, useRef, useCallback, memo, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Loader2,
  Shield,
  Lock,
  FileText,
  X,
  Maximize2,
  Minimize2,
  Pencil,
  Highlighter,
  Type,
  Eraser,
  RotateCcw,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useMaterialPdfRenderer } from "@/hooks/useMaterialPdfRenderer";
import { FabricDrawingCanvas, type FabricDrawingCanvasHandle, type FabricCanvasData } from "@/components/books/FabricDrawingCanvas";
import type { ToolMode } from "@/components/books/ReadingModeToolbar";
import { useContentSecurityGuard } from "@/hooks/useContentSecurityGuard";
import { useAuth } from "@/hooks/useAuth";

// ============================================
// TIPOS
// ============================================

interface UserWatermarkData {
  nome?: string;
  cpf?: string;
  email?: string;
}

interface ProtectedPDFViewerV2Props {
  /** URL ou Path do PDF (bucket ou URL completa) */
  pdfUrl?: string;
  /** Path do arquivo no bucket 'materiais' */
  filePath?: string;
  /** Título do documento */
  title?: string;
  /** Dados do usuário para marca d'água */
  userData?: UserWatermarkData;
  /** Classes CSS extras */
  className?: string;
  /** Callback ao tentar download */
  onDownloadAttempt?: () => void;
  /** Callback ao fechar */
  onClose?: () => void;
  /** Modo fullscreen (modal) */
  isModal?: boolean;
  /** Desabilitar watermarks (admin) */
  disableWatermark?: boolean;
}

// ============================================
// MARCA D'ÁGUA DINÂMICA PARA PDF
// ============================================
const PDFWatermark = memo(({ userData }: { userData: UserWatermarkData }) => {
  const formatCPF = (cpf: string) => {
    if (!cpf) return "";
    const clean = cpf.replace(/\D/g, "");
    if (clean.length !== 11) return cpf;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  const watermarkText = [
    userData.nome || "",
    userData.cpf ? formatCPF(userData.cpf) : "",
    userData.email || "",
  ].filter(Boolean).join(" • ");

  if (!watermarkText) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {/* Grid de marcas d'água */}
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex flex-wrap justify-around w-full">
          {Array.from({ length: 3 }).map((_, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className="text-black/5 dark:text-white/5 font-mono text-xs whitespace-nowrap transform rotate-[-30deg] m-8"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.03, 0.08, 0.03],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                delay: (rowIndex + colIndex) * 0.5,
              }}
            >
              {watermarkText}
            </motion.div>
          ))}
        </div>
      ))}

      {/* Marca d'água central proeminente */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-black/8 dark:text-white/8 font-bold text-lg tracking-widest whitespace-nowrap rotate-[-25deg]"
        animate={{ 
          scale: [1, 1.02, 1],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
      >
        {userData.nome?.toUpperCase()}
      </motion.div>
    </div>
  );
});

PDFWatermark.displayName = 'PDFWatermark';

// ============================================
// TOOLBAR DE DESENHO
// ============================================
interface DrawingToolbarProps {
  activeTool: ToolMode;
  setActiveTool: (tool: ToolMode) => void;
  drawingColor: string;
  setDrawingColor: (color: string) => void;
  drawingSize: number;
  setDrawingSize: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
  drawingMode: boolean;
  setDrawingMode: (v: boolean) => void;
}

const DrawingToolbar = memo(function DrawingToolbar({
  activeTool,
  setActiveTool,
  drawingColor,
  setDrawingColor,
  drawingSize,
  setDrawingSize,
  onUndo,
  onClear,
  drawingMode,
  setDrawingMode,
}: DrawingToolbarProps) {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000'];
  
  return (
    <div className="flex items-center gap-2 bg-muted/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50">
      {/* Toggle Modo Desenho */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant={drawingMode ? "default" : "ghost"}
            className={cn(
              "h-8 w-8 p-0",
              drawingMode && "bg-primary text-primary-foreground"
            )}
            onClick={() => setDrawingMode(!drawingMode)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {drawingMode ? "Desativar Desenho" : "Ativar Modo Desenho"}
        </TooltipContent>
      </Tooltip>

      {drawingMode && (
        <>
          <div className="w-px h-6 bg-border" />

          {/* Ferramentas */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={activeTool === 'pencil' ? "secondary" : "ghost"}
                className="h-8 w-8 p-0"
                onClick={() => setActiveTool('pencil')}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Lápis</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={activeTool === 'highlight' ? "secondary" : "ghost"}
                className="h-8 w-8 p-0"
                onClick={() => setActiveTool('highlight')}
              >
                <Highlighter className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Marca-texto</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={activeTool === 'text' ? "secondary" : "ghost"}
                className="h-8 w-8 p-0"
                onClick={() => setActiveTool('text')}
              >
                <Type className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Texto</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={activeTool === 'eraser' ? "secondary" : "ghost"}
                className="h-8 w-8 p-0"
                onClick={() => setActiveTool('eraser')}
              >
                <Eraser className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Borracha</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border" />

          {/* Cores */}
          <div className="flex items-center gap-1">
            {colors.map((c) => (
              <button
                key={c}
                className={cn(
                  "w-5 h-5 rounded-full border-2 transition-transform",
                  drawingColor === c ? "border-white scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
                onClick={() => setDrawingColor(c)}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Undo / Clear */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={onUndo}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Desfazer</TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ProtectedPDFViewerV2 = memo(({
  pdfUrl,
  filePath,
  title = "Documento Protegido",
  userData,
  className,
  onDownloadAttempt,
  onClose,
  isModal = true,
  disableWatermark = false,
}: ProtectedPDFViewerV2Props) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<FabricDrawingCanvasHandle>(null);
  
  // Estados de navegação
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Estados de desenho
  const [drawingMode, setDrawingMode] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolMode>('pencil');
  const [drawingColor, setDrawingColor] = useState('#ef4444');
  const [drawingSize, setDrawingSize] = useState(3);
  const [imageHeight, setImageHeight] = useState<number>(0); // P0 FIX: altura real da imagem

  // 🛡️ UNIVERSAL SECURITY GUARD - Anti-Debugger + Escalation
  const { showSevereOverlay, SevereOverlay } = useContentSecurityGuard({
    contentId: filePath || pdfUrl || 'unknown-pdf',
    contentType: 'pdf',
    contentTitle: title,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.user_metadata?.name,
    enabled: true,
    onViolation: onDownloadAttempt,
  });

  // PDF Renderer (PDF.js)
  const {
    isLoading: pdfLoading,
    pdfLoaded,
    totalPages,
    error: pdfError,
    currentPageData,
    loadPdf,
    renderPage,
    prefetchPages,
    cleanup
  } = useMaterialPdfRenderer(filePath);

  // ============================================
  // BLOQUEIO DE INTERAÇÕES - DOGMA III SECURITY
  // ============================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Bloquear menu de contexto
    const blockContextMenu = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDownloadAttempt?.();
      return false;
    };

    // Bloquear seleção
    const blockSelect = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Bloquear cópia
    const blockCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      onDownloadAttempt?.();
      return false;
    };

    // Bloquear atalhos perigosos
    const blockShortcuts = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl+P (Print), Ctrl+S (Save), Ctrl+C (Copy)
      if (isCtrl && (key === 'p' || key === 's' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        onDownloadAttempt?.();
        return false;
      }

      // Print Screen
      if (key === 'printscreen' || e.key === 'PrintScreen') {
        e.preventDefault();
        onDownloadAttempt?.();
        return false;
      }
      
      // Escape para fechar
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    // Bloquear arrastar
    const blockDrag = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Mobile long-press blocking
    let longPressTimer: NodeJS.Timeout | null = null;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 3) {
        e.preventDefault();
        onDownloadAttempt?.();
      }
      longPressTimer = setTimeout(() => {
        onDownloadAttempt?.();
      }, 400);
    };
    
    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };
    
    const handleTouchMove = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    // iOS Gesture blocking
    const handleGesture = (e: Event) => {
      e.preventDefault();
      onDownloadAttempt?.();
    };

    // Desktop events
    container.addEventListener('contextmenu', blockContextMenu);
    container.addEventListener('selectstart', blockSelect);
    container.addEventListener('copy', blockCopy);
    container.addEventListener('dragstart', blockDrag);
    window.addEventListener('keydown', blockShortcuts);
    
    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { capture: true, passive: false });
    container.addEventListener('touchend', handleTouchEnd, { capture: true });
    container.addEventListener('touchmove', handleTouchMove, { capture: true });
    container.addEventListener('gesturestart', handleGesture, { capture: true });
    container.addEventListener('gesturechange', handleGesture, { capture: true });

    // CSS anti-print
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        .protected-pdf-v2 * {
          display: none !important;
        }
        body::after {
          content: "⚠️ IMPRESSÃO BLOQUEADA ⚠️ - Documento protegido por Prof. Moisés Medeiros";
          display: block;
          font-size: 24px;
          text-align: center;
          padding: 50px;
          color: #dc2626;
          font-weight: bold;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      container.removeEventListener('contextmenu', blockContextMenu);
      container.removeEventListener('selectstart', blockSelect);
      container.removeEventListener('copy', blockCopy);
      container.removeEventListener('dragstart', blockDrag);
      window.removeEventListener('keydown', blockShortcuts);
      container.removeEventListener('touchstart', handleTouchStart, { capture: true });
      container.removeEventListener('touchend', handleTouchEnd, { capture: true });
      container.removeEventListener('touchmove', handleTouchMove, { capture: true });
      container.removeEventListener('gesturestart', handleGesture, { capture: true });
      container.removeEventListener('gesturechange', handleGesture, { capture: true });
      if (longPressTimer) clearTimeout(longPressTimer);
      document.head.removeChild(style);
    };
  }, [onDownloadAttempt, onClose]);

  // ============================================
  // CARREGAR PDF
  // ============================================
  useEffect(() => {
    if (filePath) {
      loadPdf();
    }
    return () => cleanup();
  }, [filePath, loadPdf, cleanup]);

  // Renderizar página
  useEffect(() => {
    if (pdfLoaded) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfLoaded, renderPage]);

  // Prefetch adjacentes
  useEffect(() => {
    if (pdfLoaded) {
      prefetchPages(currentPage);
    }
  }, [currentPage, pdfLoaded, prefetchPages]);

  // ============================================
  // NAVEGAÇÃO
  // ============================================
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPreviousPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.1, 3));
      if (e.key === '-') setZoom(z => Math.max(z - 0.1, 0.5));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousPage, goToNextPage]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Undo
  const handleUndo = useCallback(() => {
    fabricCanvasRef.current?.undo();
  }, []);

  // Clear page
  const handleClear = useCallback(() => {
    fabricCanvasRef.current?.clearPage();
  }, []);

  // ============================================
  // RENDER
  // ============================================
  
  const content = (
    <div
      ref={containerRef}
      className={cn(
        "protected-pdf-v2 relative flex flex-col bg-black/95",
        isModal ? "fixed inset-0 z-50" : "w-full h-full",
        className
      )}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <h2 className="font-semibold text-white line-clamp-1">{title}</h2>
              <Lock className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>Página {currentPage} de {totalPages || '?'}</span>
              <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/50 gap-1 text-[10px]">
                <Shield className="w-3 h-3" />
                Protegido
              </Badge>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white hover:bg-white/10"
              onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white hover:bg-white/10"
              onClick={() => setZoom(z => Math.min(z + 0.1, 3))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Drawing Toolbar */}
          <DrawingToolbar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            drawingColor={drawingColor}
            setDrawingColor={setDrawingColor}
            drawingSize={drawingSize}
            setDrawingSize={setDrawingSize}
            onUndo={handleUndo}
            onClear={handleClear}
            drawingMode={drawingMode}
            setDrawingMode={setDrawingMode}
          />

          {/* Fullscreen */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tela Cheia</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {pdfLoading && !currentPageData ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-white/60">Carregando documento...</p>
          </div>
        ) : pdfError ? (
          <div className="text-center space-y-4">
            <FileText className="w-12 h-12 text-red-400 mx-auto" />
            <p className="text-red-400">{pdfError}</p>
            <Button onClick={loadPdf} variant="outline">
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div 
            className="relative overflow-auto max-h-full max-w-full"
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease'
            }}
          >
            {/* Wrapper Unificado - Imagem + Canvas no mesmo container relative */}
            {currentPageData?.dataUrl && (
              <div className="relative">
                {/* PDF Page Image */}
                <img
                  src={currentPageData.dataUrl}
                  alt={`Página ${currentPage}`}
                  className="max-w-full h-auto select-none"
                  draggable={false}
                  style={{ userSelect: 'none', pointerEvents: drawingMode ? 'none' : 'auto' }}
                  onLoad={(e) => {
                    // P0 FIX: Capturar altura real da imagem para o canvas
                    const img = e.currentTarget;
                    setImageHeight(img.offsetHeight);
                  }}
                />

                {/* Fabric.js Drawing Canvas - Agora FILHO do mesmo container */}
                <FabricDrawingCanvas
                  ref={fabricCanvasRef}
                  isActive={drawingMode}
                  activeTool={activeTool}
                  color={drawingColor}
                  size={drawingSize}
                  pageNumber={currentPage}
                  initialData={null}
                  onCanvasChange={() => {
                    // Temporário - não persiste
                  }}
                  imageHeight={imageHeight}
                />

                {/* Watermark Overlay */}
                {userData && !disableWatermark && (
                  <PDFWatermark userData={userData} />
                )}

                {/* Anti-screenshot pattern */}
                <div 
                  className="absolute inset-0 pointer-events-none z-40"
                  style={{
                    background: 'linear-gradient(45deg, transparent 49%, rgba(0,0,0,0.01) 50%, transparent 51%)',
                    backgroundSize: '3px 3px'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Navigation Arrows */}
        {totalPages > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20",
                currentPage === 1 && "opacity-30 pointer-events-none"
              )}
              onClick={goToPreviousPage}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20",
                currentPage === totalPages && "opacity-30 pointer-events-none"
              )}
              onClick={goToNextPage}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>

      {/* Footer - Page Slider */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-white/10">
          <div className="max-w-md mx-auto flex items-center gap-4">
            <span className="text-white/60 text-sm w-8">{currentPage}</span>
            <Slider
              value={[currentPage]}
              min={1}
              max={totalPages}
              step={1}
              onValueChange={([value]) => setCurrentPage(value)}
              className="flex-1"
            />
            <span className="text-white/60 text-sm w-8 text-right">{totalPages}</span>
          </div>
        </div>
      )}

      {/* Security Footer */}
      <div className="flex items-center justify-center gap-2 p-2 bg-muted/30 border-t border-white/10">
        <Shield className="w-3 h-3 text-green-500" />
        <span className="text-[10px] text-white/60">
          Documento protegido • Anotações temporárias • Download bloqueado
        </span>
      </div>
    </div>
  );

  return isModal ? (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  ) : content;
});

ProtectedPDFViewerV2.displayName = 'ProtectedPDFViewerV2';

export default ProtectedPDFViewerV2;
