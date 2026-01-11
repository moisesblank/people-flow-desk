// ============================================
// 🎨 DRAWING CANVAS - Camada de Desenho Interativa
// Permite desenhar, marcar, apagar e ESCREVER sobre o PDF
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

export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  pageNumber: number;
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
  onTextAnnotationsChange?: (annotations: TextAnnotation[]) => void;
  textAnnotations?: TextAnnotation[];
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
  onTextAnnotationsChange,
  textAnnotations: externalTextAnnotations,
  className
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [localStrokes, setLocalStrokes] = useState<DrawingStroke[]>([]);
  
  // Estado para anotações de texto (local quando não há controle externo)
  const [localTextAnnotations, setLocalTextAnnotations] = useState<TextAnnotation[]>([]);
  const [activeTextInput, setActiveTextInput] = useState<{ x: number; y: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

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

  // Usar textos externos se fornecidos
  const textAnnotations = externalTextAnnotations ?? localTextAnnotations;
  const setTextAnnotations = useCallback((newTexts: TextAnnotation[] | ((prev: TextAnnotation[]) => TextAnnotation[])) => {
    if (onTextAnnotationsChange) {
      const result = typeof newTexts === 'function' ? newTexts(textAnnotations) : newTexts;
      onTextAnnotationsChange(result);
    } else {
      setLocalTextAnnotations(newTexts);
    }
  }, [onTextAnnotationsChange, textAnnotations]);

  // Filtrar strokes da página atual
  const pageStrokes = strokes.filter(s => s.pageNumber === pageNumber);
  const pageTextAnnotations = textAnnotations.filter(t => t.pageNumber === pageNumber);

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

  // Redesenhar quando strokes ou textos mudam
  useEffect(() => {
    redrawCanvas();
  }, [pageStrokes, currentStroke, pageTextAnnotations]);

  // Focar no input quando ativo
  useEffect(() => {
    if (activeTextInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeTextInput]);

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

    // Desenhar textos
    pageTextAnnotations.forEach(textAnno => {
      if (textAnno.id !== editingTextId) {
        drawText(ctx, textAnno);
      }
    });
  }, [pageStrokes, currentStroke, pageTextAnnotations, editingTextId]);

  // Desenhar texto no canvas
  const drawText = (ctx: CanvasRenderingContext2D, textAnno: TextAnnotation) => {
    ctx.save();
    ctx.font = `bold ${textAnno.fontSize}px "Inter", "Segoe UI", sans-serif`;
    ctx.fillStyle = textAnno.color;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(textAnno.text, textAnno.x, textAnno.y);
    ctx.restore();
  };

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

  // Salvar texto atual - usando refs para garantir persistência
  const textInputRef = useRef<{ x: number; y: number } | null>(null);
  const textValueRef = useRef('');
  const editingIdRef = useRef<string | null>(null);
  
  // Manter refs sincronizados
  useEffect(() => {
    textInputRef.current = activeTextInput;
    textValueRef.current = textInputValue;
    editingIdRef.current = editingTextId;
  }, [activeTextInput, textInputValue, editingTextId]);

  const saveTextAnnotation = useCallback(() => {
    const inputPos = textInputRef.current || activeTextInput;
    const inputValue = textValueRef.current || textInputValue;
    const editId = editingIdRef.current || editingTextId;
    
    if (!inputPos || !inputValue.trim()) {
      setActiveTextInput(null);
      setTextInputValue('');
      setEditingTextId(null);
      textInputRef.current = null;
      textValueRef.current = '';
      editingIdRef.current = null;
      return;
    }

    if (editId) {
      // Editando texto existente
      setTextAnnotations(prev => prev.map(t => 
        t.id === editId 
          ? { ...t, text: inputValue.trim() }
          : t
      ));
    } else {
      // Novo texto
      const newText: TextAnnotation = {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: inputPos.x,
        y: inputPos.y,
        text: inputValue.trim(),
        color: color,
        fontSize: Math.max(16, size * 5),
        pageNumber
      };
      console.log('[DrawingCanvas] Salvando novo texto:', newText);
      setTextAnnotations(prev => [...prev, newText]);
    }

    setActiveTextInput(null);
    setTextInputValue('');
    setEditingTextId(null);
    textInputRef.current = null;
    textValueRef.current = '';
    editingIdRef.current = null;
  }, [activeTextInput, textInputValue, editingTextId, color, size, pageNumber, setTextAnnotations]);

  // Salvar texto pendente quando o componente for desmontado
  useEffect(() => {
    return () => {
      // Cleanup: salvar texto se houver input ativo ao desmontar
      if (textInputRef.current && textValueRef.current.trim()) {
        const inputPos = textInputRef.current;
        const inputValue = textValueRef.current;
        const editId = editingIdRef.current;
        
        if (editId) {
          onTextAnnotationsChange?.(
            (externalTextAnnotations || []).map(t => 
              t.id === editId ? { ...t, text: inputValue.trim() } : t
            )
          );
        } else {
          const newText: TextAnnotation = {
            id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            x: inputPos.x,
            y: inputPos.y,
            text: inputValue.trim(),
            color: color,
            fontSize: Math.max(16, size * 5),
            pageNumber
          };
          console.log('[DrawingCanvas] Salvando texto no unmount:', newText);
          onTextAnnotationsChange?.([...(externalTextAnnotations || []), newText]);
        }
      }
    };
  }, [color, size, pageNumber, onTextAnnotationsChange, externalTextAnnotations]);

  // Iniciar desenho ou texto
  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isActive) return;

    const pos = getPosition(e);
    if (!pos) return;

    e.preventDefault();
    e.stopPropagation();

    // Se é ferramenta de texto, abrir input
    if (activeTool === 'text') {
      // Verificar se clicou em um texto existente para editar
      const clickedText = pageTextAnnotations.find(t => {
        const canvas = canvasRef.current;
        if (!canvas) return false;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        
        ctx.font = `bold ${t.fontSize}px "Inter", "Segoe UI", sans-serif`;
        const metrics = ctx.measureText(t.text);
        const textWidth = metrics.width;
        const textHeight = t.fontSize;
        
        return pos.x >= t.x && pos.x <= t.x + textWidth &&
               pos.y >= t.y - textHeight && pos.y <= t.y;
      });

      if (clickedText) {
        // Editar texto existente
        setEditingTextId(clickedText.id);
        setActiveTextInput({ x: clickedText.x, y: clickedText.y });
        setTextInputValue(clickedText.text);
      } else {
        // Novo texto
        setActiveTextInput({ x: pos.x, y: pos.y });
        setTextInputValue('');
      }
      return;
    }

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
  }, [isActive, activeTool, color, size, pageNumber, getPosition, pageTextAnnotations]);

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
    setTextAnnotations(prev => prev.filter(t => t.pageNumber !== pageNumber));
  }, [pageNumber, setStrokes]);

  // Desfazer último stroke ou texto
  const undo = useCallback(() => {
    // Primeiro tenta desfazer texto
    const pageTexts = textAnnotations.filter(t => t.pageNumber === pageNumber);
    if (pageTexts.length > 0) {
      const lastText = pageTexts[pageTexts.length - 1];
      setTextAnnotations(prev => prev.filter(t => t.id !== lastText.id));
      return;
    }

    // Depois tenta desfazer stroke
    setStrokes(prev => {
      const pageStrokesOnly = prev.filter(s => s.pageNumber === pageNumber);
      if (pageStrokesOnly.length === 0) return prev;
      
      const lastPageStroke = pageStrokesOnly[pageStrokesOnly.length - 1];
      return prev.filter(s => s.id !== lastPageStroke.id);
    });
  }, [pageNumber, setStrokes, textAnnotations]);

  // Cursor baseado na ferramenta
  const getCursor = () => {
    if (!isActive) return 'default';
    
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
      getStrokes: () => strokes,
      getTextAnnotations: () => textAnnotations
    };
    
    return () => {
      delete (window as any).__drawingCanvas;
    };
  }, [clearPage, undo, strokes, textAnnotations]);

  // Handler para input de texto
  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTextAnnotation();
    } else if (e.key === 'Escape') {
      setActiveTextInput(null);
      setTextInputValue('');
      setEditingTextId(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "absolute inset-0 z-25",
        isActive 
          ? "pointer-events-auto" 
          : "pointer-events-none",
        className
      )}
      style={{ 
        cursor: getCursor(),
        touchAction: isActive ? 'none' : 'auto'
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
      
      {/* Input de texto flutuante */}
      {activeTextInput && activeTool === 'text' && (
        <div
          className="absolute z-50"
          style={{
            left: activeTextInput.x,
            top: activeTextInput.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="flex items-center gap-1 bg-black/90 rounded-lg p-1 border border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.3)]">
            <input
              ref={inputRef}
              type="text"
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onKeyDown={handleTextKeyDown}
              onBlur={saveTextAnnotation}
              placeholder="Digite aqui..."
              className="bg-transparent border-none outline-none text-white px-2 py-1 min-w-[150px] max-w-[300px] text-sm placeholder:text-gray-500"
              style={{ 
                color: color,
                fontSize: Math.max(14, size * 3) + 'px'
              }}
              autoFocus
            />
            <button
              onClick={saveTextAnnotation}
              className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-white text-xs font-medium transition-colors"
            >
              OK
            </button>
          </div>
          <div 
            className="absolute left-2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-cyan-500/50"
          />
        </div>
      )}
      
      {/* Indicador visual de ferramenta ativa */}
      {isActive && (
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 text-white text-xs font-medium flex items-center gap-1.5 pointer-events-none">
          <span 
            className="w-3 h-3 rounded-full"
            style={{ 
              backgroundColor: activeTool === 'eraser' ? '#ef4444' : 
                               activeTool === 'highlight' ? '#eab308' : 
                               activeTool === 'text' ? '#22c55e' :
                               color 
            }}
          />
          {activeTool === 'highlight' && 'Marca-texto'}
          {activeTool === 'pencil' && 'Lápis'}
          {activeTool === 'eraser' && 'Borracha'}
          {activeTool === 'text' && 'Texto - Clique para escrever'}
        </div>
      )}
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
