// ============================================
// 🛡️ Ω3: HOOK SANCTUM THREAT SCORE
// INTEGRAÇÃO REACT COM RESPOSTA GRADUAL
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  ThreatState,
  ThreatLevel,
  ThreatResponse,
  createInitialThreatState,
  recordThreatEvent,
  calculateThreatLevel,
  getThreatResponse,
  checkAccessStatus,
  applyPenalty,
  logThreatEvent,
  logPenalty,
  THREAT_THRESHOLDS,
  EVENT_SEVERITIES,
} from '@/lib/security/sanctumThreatScore';
import { isOwner } from '@/core/urlAccessControl';

// ============================================
// TIPOS
// ============================================

export interface UseSanctumThreatReturn {
  /** Score atual de ameaça (0-100) */
  threatScore: number;
  /** Nível de ameaça atual */
  threatLevel: ThreatLevel;
  /** Se o conteúdo deve ser borrado */
  shouldBlur: boolean;
  /** Se pode acessar o conteúdo */
  canAccess: boolean;
  /** Tempo restante de penalidade (minutos) */
  remainingPenalty?: number;
  /** Registrar evento de ameaça */
  recordEvent: (eventType: string, metadata?: Record<string, unknown>) => void;
  /** Resetar estado (apenas para testes/owner) */
  resetState: () => void;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useSanctumThreat(): UseSanctumThreatReturn {
  const { user, signOut } = useAuth();
  const [state, setState] = useState<ThreatState>(createInitialThreatState);
  const [shouldBlur, setShouldBlur] = useState(false);
  const [canAccess, setCanAccess] = useState(true);
  const [remainingPenalty, setRemainingPenalty] = useState<number | undefined>();
  
  const isUserOwner = isOwner(user?.email, null);
  const lastLevelRef = useRef<ThreatLevel>('none');
  const logoutTriggeredRef = useRef(false);

  // Verificar status de acesso periodicamente
  useEffect(() => {
    const checkStatus = () => {
      const status = checkAccessStatus(state);
      setCanAccess(status.canAccess);
      setRemainingPenalty(status.remainingTime);
      
      if (!status.canAccess && !logoutTriggeredRef.current) {
        setShouldBlur(true);
      }
    };

    checkStatus();
    // PATCH-023: jitter anti-herd (0-3s)
    const jitter = Math.floor(Math.random() * 3000);
    const interval = setInterval(checkStatus, 10000 + jitter);
    
    return () => clearInterval(interval);
  }, [state]);

  // Responder a mudanças de nível
  useEffect(() => {
    const currentLevel = state.level;
    
    // Só processar se o nível mudou
    if (currentLevel === lastLevelRef.current) return;
    lastLevelRef.current = currentLevel;
    
    // Owner é imune
    if (isUserOwner) return;

    const response = getThreatResponse(currentLevel);
    
    // Aplicar blur
    setShouldBlur(response.shouldBlur);
    
    // Mostrar mensagem
    if (response.message && currentLevel !== 'none') {
      if (currentLevel === 'L1_warning') {
        toast.warning(response.message);
      } else {
        toast.error(response.message);
      }
    }
    
    // Aplicar logout se necessário
    if (response.shouldLogout && !logoutTriggeredRef.current) {
      logoutTriggeredRef.current = true;
      
      // Logar penalidade
      logPenalty(user?.id, user?.email, currentLevel, state.score);
      
      // Aplicar penalidade e fazer logout
      setState(prev => applyPenalty(prev, currentLevel));
      
      setTimeout(async () => {
        await signOut();
      }, 2000);
    }
  }, [state.level, state.score, isUserOwner, user, signOut]);

  // Registrar evento de ameaça
  const recordEvent = useCallback((
    eventType: string, 
    metadata?: Record<string, unknown>
  ) => {
    // Owner é imune
    if (isUserOwner) return;
    
    setState(prev => {
      const newState = recordThreatEvent(prev, eventType, metadata);
      
      // Logar no banco
      const severity = EVENT_SEVERITIES[eventType] || 5;
      logThreatEvent(
        user?.id,
        user?.email,
        eventType,
        severity,
        newState.score,
        metadata
      );
      
      return newState;
    });
  }, [isUserOwner, user]);

  // Reset (apenas para owner/testes)
  const resetState = useCallback(() => {
    if (!isUserOwner) return;
    
    setState(createInitialThreatState());
    setShouldBlur(false);
    setCanAccess(true);
    logoutTriggeredRef.current = false;
    
    toast.success('Estado de ameaça resetado');
  }, [isUserOwner]);

  return {
    threatScore: state.score,
    threatLevel: state.level,
    shouldBlur,
    canAccess,
    remainingPenalty,
    recordEvent,
    resetState,
  };
}

// ============================================
// HOOK DE DETECÇÃO DE EVENTOS
// ============================================

export function useThreatEventDetector(recordEvent: (type: string, meta?: Record<string, unknown>) => void) {
  const lastEventRef = useRef<Map<string, number>>(new Map());
  const DEBOUNCE_MS = 1000; // Debounce de 1 segundo por tipo

  useEffect(() => {
    // Debounce helper
    const shouldTrigger = (eventType: string): boolean => {
      const now = Date.now();
      const lastTime = lastEventRef.current.get(eventType) || 0;
      if (now - lastTime < DEBOUNCE_MS) return false;
      lastEventRef.current.set(eventType, now);
      return true;
    };

    // Detectar DevTools
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if ((widthThreshold || heightThreshold) && shouldTrigger('devtools_open')) {
        recordEvent('devtools_open', { width: widthThreshold, height: heightThreshold });
      }
    };

    // Handler para atalhos perigosos
    const handleKeydown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // DevTools shortcuts
      if (e.key === 'F12' || (isCtrl && e.shiftKey && (key === 'i' || key === 'j' || key === 'c'))) {
        e.preventDefault();
        if (shouldTrigger('devtools_shortcut')) {
          recordEvent('devtools_shortcut', { key: e.key });
        }
      }

      // Print
      if (isCtrl && key === 'p') {
        e.preventDefault();
        if (shouldTrigger('print_attempt')) {
          recordEvent('print_attempt');
        }
      }

      // Copy/Cut
      if (isCtrl && (key === 'c' || key === 'x')) {
        if (shouldTrigger(key === 'c' ? 'copy_attempt' : 'cut_attempt')) {
          recordEvent(key === 'c' ? 'copy_attempt' : 'cut_attempt');
        }
      }

      // PrintScreen
      if (e.key === 'PrintScreen') {
        if (shouldTrigger('print_screen')) {
          recordEvent('print_screen');
        }
      }
    };

    // Context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (shouldTrigger('context_menu')) {
        recordEvent('context_menu');
      }
    };

    // Copy event
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (shouldTrigger('copy_attempt')) {
        recordEvent('copy_attempt');
      }
    };

    // Selection
    const handleSelect = (e: Event) => {
      e.preventDefault();
      if (shouldTrigger('selection_attempt')) {
        recordEvent('selection_attempt');
      }
    };

    // Drag
    const handleDrag = (e: DragEvent) => {
      e.preventDefault();
      if (shouldTrigger('drag_attempt')) {
        recordEvent('drag_attempt');
      }
    };

    // Adicionar listeners
    window.addEventListener('keydown', handleKeydown, true);
    window.addEventListener('resize', detectDevTools);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('selectstart', handleSelect, true);
    document.addEventListener('dragstart', handleDrag, true);

    // Checar DevTools periodicamente
    const devToolsInterval = setInterval(detectDevTools, 2000);

    return () => {
      window.removeEventListener('keydown', handleKeydown, true);
      window.removeEventListener('resize', detectDevTools);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('selectstart', handleSelect, true);
      document.removeEventListener('dragstart', handleDrag, true);
      clearInterval(devToolsInterval);
    };
  }, [recordEvent]);
}

export default useSanctumThreat;
