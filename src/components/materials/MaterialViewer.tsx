// ============================================
// 📄 MATERIAL VIEWER - Visualizador de PDF
// Tecnologia de Ponta: PDF.js + Fabric.js + Watermarks
// COM MODO LEITURA (Anotações Temporárias)
// ============================================

import { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Shield,
  Maximize2,
  Minimize2,
  Pencil,
  Eraser,
  RotateCcw,
  Eye,
  Highlighter,
  Type
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMaterialPdfRenderer } from '@/hooks/useMaterialPdfRenderer';
import { cn } from '@/lib/utils';
import { FabricDrawingCanvas, type FabricDrawingCanvasHandle } from '@/components/books/FabricDrawingCanvas';
import type { ToolMode } from '@/components/books/ReadingModeToolbar';

// ============================================
// TIPOS
// ============================================

interface Material {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  watermark_enabled: boolean;
  total_pages?: number;
}

interface MaterialViewerProps {
  material: Material;
  onClose: () => void;
  isAdmin?: boolean;
}

// ============================================
// WATERMARK OVERLAY
// ============================================

const WatermarkOverlay = memo(function WatermarkOverlay({ text }: { text: string }) {
  if (!text) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 100px,
            rgba(128, 128, 128, 0.03) 100px,
            rgba(128, 128, 128, 0.03) 200px
          )`,
        }}
      />
      {/* Grid de watermarks */}
      <div className="grid grid-cols-3 grid-rows-4 gap-8 h-full w-full p-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i}
            className="flex items-center justify-center"
            style={{ transform: 'rotate(-30deg)' }}
          >
            <span className="text-xs text-muted-foreground/20 font-mono whitespace-nowrap select-none">
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const MaterialViewer = memo(function MaterialViewer({ 
  material, 
  onClose,
  isAdmin = false 
}: MaterialViewerProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<FabricDrawingCanvasHandle>(null);
  
  // Estados
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolMode>('pencil');
  const [drawingColor, setDrawingColor] = useState('#ef4444');
  const [drawingSize, setDrawingSize] = useState(3);

  // PDF Renderer - usa hook específico para materiais (bucket público)
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
  } = useMaterialPdfRenderer(material.file_path);

  // Watermark text
  const watermarkText = useMemo(() => {
    if (!material.watermark_enabled || isAdmin) return '';
    if (!user) return '';
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';
    const timestamp = new Date().toLocaleDateString('pt-BR');
    return `${name} • ${user.email} • ${timestamp}`;
  }, [material.watermark_enabled, isAdmin, user]);

  // Carregar PDF ao montar
  useEffect(() => {
    loadPdf();
    return () => cleanup();
  }, [loadPdf, cleanup]);

  // Renderizar página quando mudar
  useEffect(() => {
    if (pdfLoaded) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfLoaded, renderPage]);

  // Prefetch ao mudar de página
  useEffect(() => {
    if (pdfLoaded) {
      prefetchPages(currentPage);
    }
  }, [currentPage, pdfLoaded, prefetchPages]);

  // Navegação
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
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPreviousPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.1, 3));
      if (e.key === '-') setZoom(z => Math.max(z - 0.1, 0.5));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToPreviousPage, goToNextPage]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Bloquear context menu e seleção
  useEffect(() => {
    const preventActions = (e: Event) => {
      if (!isAdmin) e.preventDefault();
    };
    
    document.addEventListener('contextmenu', preventActions);
    document.addEventListener('selectstart', preventActions);
    
    return () => {
      document.removeEventListener('contextmenu', preventActions);
      document.removeEventListener('selectstart', preventActions);
    };
  }, [isAdmin]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-semibold text-white line-clamp-1">{material.title}</h2>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>Página {currentPage} de {totalPages || '?'}</span>
              {material.watermark_enabled && (
                <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/50 gap-1">
                  <Shield className="w-3 h-3" />
                  Protegido
                </Badge>
              )}
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
          <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
            {/* Toggle Drawing */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-white hover:bg-white/20",
                    drawingMode && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setDrawingMode(!drawingMode)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{drawingMode ? 'Desativar Desenho' : 'Modo Desenho'}</TooltipContent>
            </Tooltip>

            {drawingMode && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8 text-white hover:bg-white/20", activeTool === 'pencil' && "bg-white/20")}
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
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8 text-white hover:bg-white/20", activeTool === 'highlight' && "bg-white/20")}
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
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8 text-white hover:bg-white/20", activeTool === 'text' && "bg-white/20")}
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
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8 text-white hover:bg-white/20", activeTool === 'eraser' && "bg-white/20")}
                      onClick={() => setActiveTool('eraser')}
                    >
                      <Eraser className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Borracha</TooltipContent>
                </Tooltip>
                
                {/* Colors */}
                <div className="flex items-center gap-1 ml-2">
                  {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000'].map((c) => (
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

                {/* Undo */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20 ml-2"
                      onClick={() => fabricCanvasRef.current?.undo()}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Desfazer</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

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
            <p className="text-white/60">Carregando PDF...</p>
          </div>
        ) : pdfError ? (
          <div className="text-center space-y-4">
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
            {/* PDF Page */}
            {currentPageData?.dataUrl && (
              <img
                src={currentPageData.dataUrl}
                alt={`Página ${currentPage}`}
                className="max-w-full h-auto select-none"
                draggable={false}
                style={{ userSelect: 'none', pointerEvents: drawingMode ? 'none' : 'auto' }}
              />
            )}

            {/* Fabric.js Drawing Canvas - Anotações Temporárias */}
            {currentPageData && (
              <FabricDrawingCanvas
                ref={fabricCanvasRef}
                isActive={drawingMode}
                activeTool={activeTool}
                color={drawingColor}
                size={drawingSize}
                pageNumber={currentPage}
                initialData={null}
                onCanvasChange={() => {/* Temporário - não persiste */}}
              />
            )}

            {/* Watermark Overlay */}
            {material.watermark_enabled && !isAdmin && (
              <WatermarkOverlay text={watermarkText} />
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
              onValueChange={([value]) => {
                setCurrentPage(value);
              }}
              className="flex-1"
            />
            <span className="text-white/60 text-sm w-8 text-right">{totalPages}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
});

export default MaterialViewer;
