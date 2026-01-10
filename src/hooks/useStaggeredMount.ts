// ============================================
// 🎯 HOOK: useStaggeredMount
// Montagem escalonada de componentes para melhor TTI
// Frame 0: Página | Frame 1: Watermark | Frame 2: Overlays | Frame 3: Listeners
// ============================================

import { useState, useEffect, useRef } from 'react';

export interface StaggeredMountState {
  /** Frame 0: Página principal está pronta */
  pageReady: boolean;
  /** Frame 1: Watermark pode montar */
  watermarkReady: boolean;
  /** Frame 2: Overlays/Anotações podem montar */
  overlaysReady: boolean;
  /** Frame 3: Listeners de proteção podem ativar */
  listenersReady: boolean;
  /** Tudo montado */
  fullyMounted: boolean;
}

const FRAME_DELAY_MS = 16; // ~1 frame a 60fps

/**
 * Hook que escalona a montagem de componentes em frames separados
 * para reduzir o TTI (Time to Interactive) percebido.
 * 
 * @param enabled Se o stagger está habilitado (false = monta tudo imediatamente)
 * @param pageNumber Número da página atual (reset ao mudar de página)
 */
export function useStaggeredMount(
  enabled: boolean = true,
  pageNumber?: number
): StaggeredMountState {
  const [state, setState] = useState<StaggeredMountState>({
    pageReady: !enabled, // Se desabilitado, já começa pronto
    watermarkReady: !enabled,
    overlaysReady: !enabled,
    listenersReady: !enabled,
    fullyMounted: !enabled,
  });
  
  const mountedRef = useRef(false);
  const previousPageRef = useRef(pageNumber);

  useEffect(() => {
    if (!enabled) {
      setState({
        pageReady: true,
        watermarkReady: true,
        overlaysReady: true,
        listenersReady: true,
        fullyMounted: true,
      });
      return;
    }

    // Reset ao mudar de página
    if (previousPageRef.current !== pageNumber && mountedRef.current) {
      setState({
        pageReady: false,
        watermarkReady: false,
        overlaysReady: false,
        listenersReady: false,
        fullyMounted: false,
      });
    }
    previousPageRef.current = pageNumber;
    mountedRef.current = true;

    // Escalonar montagem em frames separados
    let frame1: number | undefined;
    let frame2: number | undefined;
    let frame3: number | undefined;
    let frame4: number | undefined;

    // Frame 0: Página (imediato)
    setState(prev => ({ ...prev, pageReady: true }));

    // Frame 1: Watermark (próximo frame)
    frame1 = requestAnimationFrame(() => {
      setState(prev => ({ ...prev, watermarkReady: true }));

      // Frame 2: Overlays
      frame2 = requestAnimationFrame(() => {
        setState(prev => ({ ...prev, overlaysReady: true }));

        // Frame 3: Listeners
        frame3 = requestAnimationFrame(() => {
          setState(prev => ({ ...prev, listenersReady: true }));

          // Frame 4: Fully mounted (após todos os frames)
          frame4 = requestAnimationFrame(() => {
            setState(prev => ({ ...prev, fullyMounted: true }));
          });
        });
      });
    });

    return () => {
      if (frame1) cancelAnimationFrame(frame1);
      if (frame2) cancelAnimationFrame(frame2);
      if (frame3) cancelAnimationFrame(frame3);
      if (frame4) cancelAnimationFrame(frame4);
    };
  }, [enabled, pageNumber]);

  return state;
}

/**
 * Hook simplificado que usa requestIdleCallback para operações não-críticas
 * com fallback para setTimeout em navegadores que não suportam.
 */
export function useIdleCallback(
  callback: () => void,
  deps: React.DependencyList,
  options?: { timeout?: number }
) {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(callback, options);
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      // Fallback para navegadores que não suportam
      const handle = setTimeout(callback, options?.timeout || 100);
      return () => clearTimeout(handle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
