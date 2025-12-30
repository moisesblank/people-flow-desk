// ============================================
// 🎨 DRAWING CANVAS - Camada de Desenho Interativa
// Permite desenhar, marcar, apagar sobre o PDF
// Integrado com ReadingModeToolbar
// ============================================

import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { ToolMode } from './ReadingModeToolbar';

// ============================================
// TIPOS
// ============================================

// Re-exportar para compatibilidade
export type DrawingTool = ToolMode;

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  tool: DrawingTool;
  points: DrawingPoint[];
  color: string;
  size: number;
  opacity: number;
  pageNumber: number;
}

export interface DrawingCanvasProps {
  isActive: boolean;
  activeTool: DrawingTool;
  color: string;
  size: number;
  pageNumber: number;
  onStrokesChange?: (strokes: DrawingStroke[]) => void;
  strokes?: DrawingStroke[];
  className?: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const DrawingCanvas = memo(function DrawingCanvas({
  isActive,
  activeTool,
  color,
  size,
  pageNumber,
  onStrokesChange,
  strokes: externalStrokes,
  className
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [localStrokes, setLocalStrokes] = useState<DrawingStroke[]>([]);

  // Usar strokes externos se fornecidos
  const strokes = externalStrokes ?? localStrokes;
  const setStrokes = useCallback((newStrokes: DrawingStroke[] | ((prev: DrawingStroke[]) => DrawingStroke[])) => {
    if (onStrokesChange) {
      const result = typeof newStrokes === 'function' ? newStrokes(strokes) : newStrokes;
      onStrokesChange(result);
    } else {
      setLocalStrokes(newStrokes);
    }
  }, [onStrokesChange, strokes]);

  // Filtrar strokes da página atual
  const pageStrokes = strokes.filter(s => s.pageNumber === pageNumber);

  // Redimensionar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawCanvas();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [pageNumber]);

  // Redesenhar quando strokes mudam
  useEffect(() => {
    redrawCanvas();
  }, [pageStrokes, currentStroke]);

  // Função para redesenhar todo o canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar todos os strokes salvos
    pageStrokes.forEach(stroke => {
      drawStroke(ctx, stroke);
    });

    // Desenhar stroke atual
    if (currentStroke) {
      drawStroke(ctx, currentStroke);
    }
  }, [pageStrokes, currentStroke]);

  // Desenhar um stroke individual
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (stroke.tool) {
      case 'highlight':
        // Marca-texto com transparência
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 8;
        break;
      
      case 'pencil':
        // Lápis normal
        ctx.globalAlpha = 1;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        break;
      
      case 'eraser':
        // Borracha (desenha branco semi-transparente)
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,1)';
        ctx.lineWidth = stroke.size * 3;
        break;
      
      default:
        ctx.globalAlpha = 1;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    // Desenhar linha suave usando curvas
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
    }

    // Último ponto
    if (stroke.points.length > 1) {
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x, last.y);
    }

    ctx.stroke();
    ctx.restore();
  };

  // Obter posição do mouse/touch relativa ao canvas
  const getPosition = useCallback((e: React.MouseEvent | React.TouchEvent): DrawingPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }, []);

  // Iniciar desenho
  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isActive || activeTool === 'select' || activeTool === 'text' || activeTool === 'ruler') return;

    const pos = getPosition(e);
    if (!pos) return;

    e.preventDefault();
    e.stopPropagation();

    setIsDrawing(true);
    setCurrentStroke({
      id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tool: activeTool,
      points: [pos],
      color: activeTool === 'eraser' ? '#ffffff' : color,
      size: size,
      opacity: activeTool === 'highlight' ? 0.35 : 1,
      pageNumber
    });
  }, [isActive, activeTool, color, size, pageNumber, getPosition]);

  // Continuar desenho
  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return;

    const pos = getPosition(e);
    if (!pos) return;

    e.preventDefault();
    e.stopPropagation();

    setCurrentStroke(prev => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, pos]
      };
    });
  }, [isDrawing, currentStroke, getPosition]);

  // Finalizar desenho
  const handleEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return;

    e.preventDefault();

    // Salvar stroke se tiver pontos suficientes
    if (currentStroke.points.length >= 2) {
      setStrokes(prev => [...prev, currentStroke]);
    }

    setIsDrawing(false);
    setCurrentStroke(null);
  }, [isDrawing, currentStroke, setStrokes]);

  // Limpar todos os desenhos da página
  const clearPage = useCallback(() => {
    setStrokes(prev => prev.filter(s => s.pageNumber !== pageNumber));
  }, [pageNumber, setStrokes]);

  // Desfazer último stroke
  const undo = useCallback(() => {
    setStrokes(prev => {
      const pageStrokesOnly = prev.filter(s => s.pageNumber === pageNumber);
      if (pageStrokesOnly.length === 0) return prev;
      
      const lastPageStroke = pageStrokesOnly[pageStrokesOnly.length - 1];
      return prev.filter(s => s.id !== lastPageStroke.id);
    });
  }, [pageNumber, setStrokes]);

  // Cursor baseado na ferramenta
  const getCursor = () => {
    if (!isActive || activeTool === 'select') return 'default';
    
    switch (activeTool) {
      case 'highlight':
        return 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="8" y="4" width="8" height="16" rx="2" fill="%23fef08a" stroke="%23eab308" stroke-width="2"/></svg>\') 12 20, crosshair';
      case 'pencil':
        return 'crosshair';
      case 'eraser':
        return 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="%23ffffff" stroke="%23999999" stroke-width="2"/></svg>\') 10 10, crosshair';
      case 'text':
        return 'text';
      default:
        return 'crosshair';
    }
  };

  // Expor métodos via ref imperativo (opcional)
  useEffect(() => {
    // Adicionar métodos globais para controle externo
    (window as any).__drawingCanvas = {
      clearPage,
      undo,
      getStrokes: () => strokes
    };
    
    return () => {
      delete (window as any).__drawingCanvas;
    };
  }, [clearPage, undo, strokes]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "absolute inset-0 z-25",
        isActive && activeTool !== 'select' && activeTool !== 'ruler' 
          ? "pointer-events-auto" 
          : "pointer-events-none",
        className
      )}
      style={{ 
        cursor: getCursor(),
        touchAction: isActive && activeTool !== 'select' ? 'none' : 'auto'
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
      />
      
      {/* Indicador visual de ferramenta ativa */}
      {isActive && activeTool !== 'select' && (
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 text-white text-xs font-medium flex items-center gap-1.5 pointer-events-none">
          <span 
            className="w-3 h-3 rounded-full"
            style={{ 
              backgroundColor: activeTool === 'eraser' ? '#ef4444' : 
                               activeTool === 'highlight' ? '#eab308' : 
                               color 
            }}
          />
          {activeTool === 'highlight' && 'Marca-texto'}
          {activeTool === 'pencil' && 'Lápis'}
          {activeTool === 'eraser' && 'Borracha'}
          {activeTool === 'text' && 'Texto'}
        </div>
      )}
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
