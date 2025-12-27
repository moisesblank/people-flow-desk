// ============================================
// HOOK: Sidebar Width com Persistência
// Persiste largura da sidebar no localStorage
// MIN: 56px | DEFAULT: 240px | MAX: 360px
// ============================================

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "ui.sidebar.width";
const MIN_WIDTH = 56;
const DEFAULT_WIDTH = 240;
const MAX_WIDTH = 360;

export interface SidebarWidthConfig {
  width: number;
  setWidth: (width: number) => void;
  resetWidth: () => void;
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
  isMinimized: boolean;
}

export function useSidebarWidth(): SidebarWidthConfig {
  const [width, setWidthState] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          return parsed;
        }
      }
    } catch {
      // localStorage não disponível
    }
    return DEFAULT_WIDTH;
  });

  // Persistir no localStorage quando mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(width));
    } catch {
      // Ignorar erros de localStorage
    }
  }, [width]);

  const setWidth = useCallback((newWidth: number) => {
    const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
    setWidthState(clampedWidth);
  }, []);

  const resetWidth = useCallback(() => {
    setWidthState(DEFAULT_WIDTH);
  }, []);

  const isMinimized = width <= MIN_WIDTH + 10; // Considera minimizado se próximo do mínimo

  return {
    width,
    setWidth,
    resetWidth,
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,
    defaultWidth: DEFAULT_WIDTH,
    isMinimized,
  };
}

// Exportar constantes para uso externo
export { MIN_WIDTH as SIDEBAR_MIN_WIDTH, DEFAULT_WIDTH as SIDEBAR_DEFAULT_WIDTH, MAX_WIDTH as SIDEBAR_MAX_WIDTH };
