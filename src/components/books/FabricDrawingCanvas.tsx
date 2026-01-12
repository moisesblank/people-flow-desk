// ============================================
// 🎨 FABRIC.JS DRAWING CANVAS - Enterprise Grade
// Substitui o canvas nativo por Fabric.js v6
// Serialização JSON confiável para persistência
// ============================================

import React, { memo, useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Canvas as FabricCanvas, PencilBrush, IText, FabricObject } from 'fabric';
import { cn } from '@/lib/utils';
import type { ToolMode } from './ReadingModeToolbar';

// ============================================
// TIPOS
// ============================================

export type DrawingTool = ToolMode;

export interface FabricCanvasData {
  version: string;
  objects: any[];
  pageNumber: number;
}

export interface FabricDrawingCanvasProps {
  isActive: boolean;
  activeTool: DrawingTool;
  color: string;
  size: number;
  pageNumber: number;
  onCanvasChange?: (data: FabricCanvasData) => void;
  initialData?: FabricCanvasData | null;
  className?: string;
  /** P0 FIX: Altura real da imagem para garantir que o canvas cubra toda a área */
  imageHeight?: number;
}

export interface FabricDrawingCanvasHandle {
  undo: () => void;
  clearPage: () => void;
  getCanvasData: () => FabricCanvasData;
  loadCanvasData: (data: FabricCanvasData) => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const FabricDrawingCanvas = memo(forwardRef<FabricDrawingCanvasHandle, FabricDrawingCanvasProps>(
  function FabricDrawingCanvas({
    isActive,
    activeTool,
    color,
    size,
    pageNumber,
    onCanvasChange,
    initialData,
    className,
    imageHeight
  }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<FabricCanvas | null>(null);
    const [isReady, setIsReady] = useState(false);
    const historyRef = useRef<string[]>([]);
    const isLoadingRef = useRef(false);
    const lastSavedJsonRef = useRef<string>('');

    // ============================================
    // INICIALIZAÇÃO DO FABRIC.JS
    // ============================================
    useEffect(() => {
      if (!canvasRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // P0 FIX: Usar imageHeight se disponível, senão usar altura do container
      const canvasHeight = imageHeight && imageHeight > rect.height ? imageHeight : rect.height;

      console.log('[FabricCanvas] Inicializando canvas', { 
        width: rect.width, 
        height: canvasHeight,
        imageHeight,
        containerHeight: rect.height,
        pageNumber 
      });

      const canvas = new FabricCanvas(canvasRef.current, {
        width: rect.width || 800,
        height: canvasHeight || 600,
        backgroundColor: 'transparent',
        isDrawingMode: false,
        selection: false,
      });

      // Configurar brush padrão
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = size;
      }

      fabricRef.current = canvas;
      setIsReady(true);

      // Handler para mudanças
      const handleModified = () => {
        if (isLoadingRef.current) return;
        saveToHistory();
        notifyChange();
      };

      canvas.on('object:added', handleModified);
      canvas.on('object:modified', handleModified);
      canvas.on('object:removed', handleModified);
      canvas.on('path:created', handleModified);

      // Resize handler - P0 FIX: considerar imageHeight
      const handleResize = () => {
        const newRect = container.getBoundingClientRect();
        const newHeight = imageHeight && imageHeight > newRect.height ? imageHeight : newRect.height;
        if (newRect.width > 0 && newHeight > 0) {
          canvas.setDimensions({ width: newRect.width, height: newHeight });
          canvas.renderAll();
        }
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
        canvas.dispose();
        fabricRef.current = null;
      };
    }, [pageNumber, imageHeight]);

    // ============================================
    // CARREGAR DADOS INICIAIS
    // ============================================
    useEffect(() => {
      if (!isReady || !fabricRef.current) return;
      
      if (initialData && initialData.objects && initialData.objects.length > 0) {
        loadCanvasData(initialData);
      }
    }, [isReady, initialData?.pageNumber]);

    // ============================================
    // ATUALIZAR MODO DE DESENHO
    // ============================================
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas || !isReady) return;

      // Borracha NÃO é modo de desenho - é modo de clique para deletar objetos
      const isDrawingTool = activeTool === 'pencil' || activeTool === 'highlight';
      const isEraserMode = activeTool === 'eraser';
      
      canvas.isDrawingMode = isActive && isDrawingTool;
      canvas.selection = false; // Sem modo seleção - todas as ferramentas são de desenho/edição

      if (canvas.isDrawingMode) {
        // Configurar brush baseado na ferramenta
        const brush = new PencilBrush(canvas);
        
        switch (activeTool) {
          case 'highlight':
            brush.color = color + '59'; // ~35% opacity via hex alpha
            brush.width = size * 8;
            break;
          case 'pencil':
          default:
            brush.color = color;
            brush.width = size;
            break;
        }

        canvas.freeDrawingBrush = brush;
      }

      canvas.renderAll();
    }, [isActive, activeTool, color, size, isReady]);

    // ============================================
    // BORRACHA: DELETAR OBJETOS AO CLICAR/ARRASTAR
    // ============================================
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas || !isReady) return;

      const isEraserActive = isActive && activeTool === 'eraser';
      
      if (!isEraserActive) return;

      console.log('[FabricCanvas] Eraser mode ACTIVATED');

      // Handler para deletar objeto ao clicar
      const handleMouseDown = (opt: any) => {
        if (!isActive || activeTool !== 'eraser') return;
        
        const target = opt.target;
        if (target && target !== canvas.backgroundImage) {
          console.log('[FabricCanvas] Eraser: removing object', target.type);
          canvas.remove(target);
          canvas.renderAll();
        }
      };

      // Handler para deletar objetos ao arrastar (brush de borracha)
      const handleMouseMove = (opt: any) => {
        if (!isActive || activeTool !== 'eraser') return;
        if (!opt.e.buttons) return; // Só se estiver pressionando

        const pointer = canvas.getPointer(opt.e);
        const objects = canvas.getObjects();
        
        // Verificar cada objeto se o pointer está dentro
        for (const obj of objects) {
          if (obj === canvas.backgroundImage) continue;
          
          const objBounds = obj.getBoundingRect();
          const eraserRadius = size * 3;
          
          // Check if pointer is near the object
          if (
            pointer.x >= objBounds.left - eraserRadius &&
            pointer.x <= objBounds.left + objBounds.width + eraserRadius &&
            pointer.y >= objBounds.top - eraserRadius &&
            pointer.y <= objBounds.top + objBounds.height + eraserRadius
          ) {
            console.log('[FabricCanvas] Eraser drag: removing object', obj.type);
            canvas.remove(obj);
          }
        }
        
        canvas.renderAll();
      };

      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);

      return () => {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
      };
    }, [isActive, activeTool, size, isReady]);

    // ============================================
    // HANDLERS DE TEXTO
    // ============================================
    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
      const canvas = fabricRef.current;
      if (!canvas || !isActive || activeTool !== 'text') return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Verificar se clicou em um objeto existente
      const target = canvas.findTarget(e.nativeEvent as any);
      if (target instanceof IText) {
        // Editar texto existente
        target.enterEditing();
        target.selectAll();
        canvas.setActiveObject(target);
        canvas.renderAll();
        return;
      }

      // Criar novo texto
      const text = new IText('', {
        left: x,
        top: y,
        fontFamily: 'Inter, Segoe UI, sans-serif',
        fontSize: Math.max(16, size * 5),
        fill: color,
        fontWeight: 'bold',
        editable: true,
      });

      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      canvas.renderAll();
    }, [isActive, activeTool, color, size]);

    // ============================================
    // HISTÓRICO (UNDO)
    // ============================================
    const saveToHistory = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const json = JSON.stringify(canvas.toJSON());
      historyRef.current.push(json);
      
      // Limitar histórico a 50 estados
      if (historyRef.current.length > 50) {
        historyRef.current.shift();
      }
    }, []);

    const undo = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || historyRef.current.length < 2) return;

      historyRef.current.pop(); // Remove estado atual
      const previousState = historyRef.current[historyRef.current.length - 1];
      
      if (previousState) {
        isLoadingRef.current = true;
        canvas.loadFromJSON(JSON.parse(previousState)).then(() => {
          canvas.renderAll();
          isLoadingRef.current = false;
          notifyChange();
        });
      }
    }, []);

    // ============================================
    // LIMPAR PÁGINA
    // ============================================
    const clearPage = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      canvas.clear();
      canvas.backgroundColor = 'transparent';
      canvas.renderAll();
      historyRef.current = [];
      notifyChange();
    }, []);

    // ============================================
    // SERIALIZAÇÃO
    // ============================================
    const getCanvasData = useCallback((): FabricCanvasData => {
      const canvas = fabricRef.current;
      if (!canvas) {
        return { version: '6.0.0', objects: [], pageNumber };
      }

      const json = canvas.toJSON();
      return {
        version: json.version || '6.0.0',
        objects: json.objects || [],
        pageNumber
      };
    }, [pageNumber]);

    const loadCanvasData = useCallback((data: FabricCanvasData) => {
      const canvas = fabricRef.current;
      if (!canvas || !data) return;

      isLoadingRef.current = true;
      
      const fabricJson = {
        version: data.version,
        objects: data.objects || [],
        background: 'transparent'
      };

      console.log('[FabricCanvas] Carregando dados:', {
        pageNumber: data.pageNumber,
        objectCount: data.objects?.length || 0
      });

      canvas.loadFromJSON(fabricJson).then(() => {
        canvas.renderAll();
        isLoadingRef.current = false;
        saveToHistory();
      }).catch((err) => {
        console.error('[FabricCanvas] Erro ao carregar JSON:', err);
        isLoadingRef.current = false;
      });
    }, [saveToHistory]);

    // ============================================
    // NOTIFICAR MUDANÇAS
    // ============================================
    const notifyChange = useCallback(() => {
      if (!onCanvasChange || isLoadingRef.current) return;
      
      const data = getCanvasData();
      const json = JSON.stringify(data);
      
      // Evitar notificações duplicadas
      if (json === lastSavedJsonRef.current) return;
      lastSavedJsonRef.current = json;
      
      console.log('[FabricCanvas] Notificando mudança:', {
        pageNumber,
        objectCount: data.objects.length
      });
      
      onCanvasChange(data);
    }, [onCanvasChange, getCanvasData, pageNumber]);

    // ============================================
    // EXPOR MÉTODOS VIA REF
    // ============================================
    useImperativeHandle(ref, () => ({
      undo,
      clearPage,
      getCanvasData,
      loadCanvasData
    }), [undo, clearPage, getCanvasData, loadCanvasData]);

    // Expor globalmente para toolbar
    useEffect(() => {
      (window as any).__fabricCanvas = {
        undo,
        clearPage,
        getCanvasData,
        loadCanvasData
      };
      
      return () => {
        delete (window as any).__fabricCanvas;
      };
    }, [undo, clearPage, getCanvasData, loadCanvasData]);

    // ============================================
    // CURSOR
    // ============================================
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
        onClick={activeTool === 'text' ? handleCanvasClick : undefined}
      >
        <canvas ref={canvasRef} />
        
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

        {/* Loading indicator */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }
));

FabricDrawingCanvas.displayName = 'FabricDrawingCanvas';

export default FabricDrawingCanvas;
