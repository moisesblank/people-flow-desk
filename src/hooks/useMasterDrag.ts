// ============================================
// MOISÉS MEDEIROS v17.0 - MASTER DRAG HOOK
// Sistema de arrastar QUALQUER elemento na página
// Funciona SOMENTE no modo MASTER (Owner)
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGodMode } from '@/stores/godModeStore';
import { toast } from 'sonner';

interface DragPosition {
  id: string;
  x: number;
  y: number;
  originalParent?: string;
}

interface DragState {
  isDragging: boolean;
  dragTarget: HTMLElement | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

const DRAG_POSITIONS_KEY = 'master_drag_positions_v2';

export function useMasterDrag() {
  const { isOwner, isActive } = useGodMode();
  const [isDragModeActive, setIsDragModeActive] = useState(false);
  const [dragPositions, setDragPositions] = useState<Record<string, DragPosition>>({});
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    dragTarget: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const ghostRef = useRef<HTMLElement | null>(null);

  // Carregar posições salvas
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAG_POSITIONS_KEY);
      if (saved) {
        setDragPositions(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar posições de drag:', error);
    }
  }, []);

  // Salvar posições
  const savePositions = useCallback((positions: Record<string, DragPosition>) => {
    setDragPositions(positions);
    localStorage.setItem(DRAG_POSITIONS_KEY, JSON.stringify(positions));
  }, []);

  // Gerar ID único para elemento
  const generateElementId = useCallback((element: HTMLElement): string => {
    const path: string[] = [];
    let current: HTMLElement | null = element;
    let depth = 0;
    
    while (current && depth < 8) {
      const tag = current.tagName.toLowerCase();
      const id = current.id ? `#${current.id}` : '';
      const className = current.className && typeof current.className === 'string' 
        ? `.${current.className.split(' ').slice(0, 2).join('.')}` 
        : '';
      const index = Array.from(current.parentElement?.children || []).indexOf(current);
      
      path.unshift(`${tag}${id}${className}[${index}]`);
      current = current.parentElement;
      depth++;
    }
    
    return path.join('>');
  }, []);

  // Aplicar posições salvas aos elementos
  const applyPositions = useCallback(() => {
    Object.entries(dragPositions).forEach(([id, pos]) => {
      // Tentar encontrar elemento pelo ID gerado
      const elements = document.querySelectorAll('[data-master-drag-id]');
      elements.forEach((el) => {
        if (el.getAttribute('data-master-drag-id') === id) {
          (el as HTMLElement).style.transform = `translate(${pos.x}px, ${pos.y}px)`;
        }
      });
    });
  }, [dragPositions]);

  // Resetar todas as posições
  const resetAllPositions = useCallback(() => {
    setDragPositions({});
    localStorage.removeItem(DRAG_POSITIONS_KEY);
    
    // Remover transforms de todos os elementos
    document.querySelectorAll('[data-master-drag-id]').forEach((el) => {
      (el as HTMLElement).style.transform = '';
      (el as HTMLElement).removeAttribute('data-master-drag-id');
    });
    
    toast.success('Todas as posições foram resetadas!');
  }, []);

  // Handlers de drag
  useEffect(() => {
    if (!isOwner || !isActive || !isDragModeActive) return;

    let isDragging = false;
    let dragTarget: HTMLElement | null = null;
    let startX = 0;
    let startY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let ghost: HTMLElement | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      // Apenas botão esquerdo + Alt ou botão do meio
      if (!((e.button === 0 && e.altKey) || e.button === 1)) return;
      
      const target = e.target as HTMLElement;
      if (!target || target === document.body || target === document.documentElement) return;
      
      // Não arrastar elementos do sistema
      if (target.closest('[data-master-panel]') || target.closest('[data-radix-collection-item]')) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      dragTarget = target;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = target.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      // Criar ghost visual
      ghost = target.cloneNode(true) as HTMLElement;
      ghost.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
        opacity: 0.8;
        z-index: 99999;
        transform: scale(1.02);
        box-shadow: 0 20px 60px rgba(168, 85, 247, 0.4);
        border: 2px dashed #a855f7;
        border-radius: 8px;
      `;
      document.body.appendChild(ghost);
      
      // Visual no elemento original
      target.style.opacity = '0.4';
      
      document.body.style.cursor = 'grabbing';
      document.body.classList.add('master-dragging');
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragTarget || !ghost) return;
      
      e.preventDefault();
      
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      
      ghost.style.left = `${x}px`;
      ghost.style.top = `${y}px`;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging || !dragTarget) return;
      
      isDragging = false;
      document.body.style.cursor = '';
      document.body.classList.remove('master-dragging');
      
      // Restaurar elemento original
      dragTarget.style.opacity = '';
      
      if (ghost) {
        // Calcular nova posição relativa
        const ghostRect = ghost.getBoundingClientRect();
        const originalRect = dragTarget.getBoundingClientRect();
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // Aplicar transform
        const currentTransform = dragTarget.style.transform || '';
        const existingMatch = currentTransform.match(/translate\((-?\d+(?:\.\d+)?)[px,\s]+(-?\d+(?:\.\d+)?)px\)/);
        
        let newX = deltaX;
        let newY = deltaY;
        
        if (existingMatch) {
          newX += parseFloat(existingMatch[1]);
          newY += parseFloat(existingMatch[2]);
        }
        
        dragTarget.style.transform = `translate(${newX}px, ${newY}px)`;
        
        // Gerar ID e salvar
        const elementId = generateElementId(dragTarget);
        dragTarget.setAttribute('data-master-drag-id', elementId);
        
        const newPositions = {
          ...dragPositions,
          [elementId]: { id: elementId, x: newX, y: newY }
        };
        savePositions(newPositions);
        
        // Remover ghost
        ghost.remove();
        ghost = null;
        
        toast.success('Elemento reposicionado!', {
          description: 'Alt+Click para mover novamente',
          duration: 2000
        });
      }
      
      dragTarget = null;
    };

    // Adicionar listeners
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);

    // Adicionar estilos globais
    const styleId = 'master-drag-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      body.master-dragging * {
        cursor: grabbing !important;
        user-select: none !important;
      }
      
      body.master-drag-mode *:hover {
        outline: 2px dashed rgba(168, 85, 247, 0.5) !important;
        outline-offset: 2px;
      }
      
      [data-master-drag-id] {
        position: relative;
      }
    `;

    document.body.classList.add('master-drag-mode');

    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.body.classList.remove('master-drag-mode');
      document.body.classList.remove('master-dragging');
      styleEl?.remove();
    };
  }, [isOwner, isActive, isDragModeActive, dragPositions, generateElementId, savePositions]);

  // Atalho de teclado
  useEffect(() => {
    if (!isOwner) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D = Toggle Drag Mode
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsDragModeActive(prev => {
          const newState = !prev;
          toast(newState ? 'Modo Drag ATIVADO' : 'Modo Drag DESATIVADO', {
            description: newState ? 'Alt+Click para arrastar elementos' : '',
            duration: 2000
          });
          return newState;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwner]);

  return {
    isDragModeActive,
    setIsDragModeActive,
    dragPositions,
    resetAllPositions,
    applyPositions,
  };
}
