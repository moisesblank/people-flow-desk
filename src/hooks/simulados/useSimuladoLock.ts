/**
 * 🎯 SIMULADOS — Hook de Proteção contra Race Conditions
 * Constituição SYNAPSE Ω v10.0
 * 
 * Previne:
 * - Duplo clique em start/finish
 * - Múltiplas chamadas simultâneas
 * - Estados inconsistentes
 */

import { useRef, useCallback, useState } from "react";

interface ActionLock {
  isLocked: boolean;
  lockTime: number | null;
  actionId: string | null;
}

interface UseSimuladoLockReturn {
  // Estado
  isStartLocked: boolean;
  isFinishLocked: boolean;
  isAnyLocked: boolean;
  
  // Ações protegidas
  withStartLock: <T>(action: () => Promise<T>) => Promise<T | null>;
  withFinishLock: <T>(action: () => Promise<T>) => Promise<T | null>;
  
  // Utilitários
  forceUnlockAll: () => void;
}

const LOCK_TIMEOUT_MS = 30000; // 30s timeout máximo

export function useSimuladoLock(): UseSimuladoLockReturn {
  const [startLock, setStartLock] = useState<ActionLock>({
    isLocked: false,
    lockTime: null,
    actionId: null,
  });
  
  const [finishLock, setFinishLock] = useState<ActionLock>({
    isLocked: false,
    lockTime: null,
    actionId: null,
  });

  const startLockRef = useRef(startLock);
  const finishLockRef = useRef(finishLock);

  // Sincronizar refs
  startLockRef.current = startLock;
  finishLockRef.current = finishLock;

  /**
   * Verifica se lock expirou (failsafe)
   */
  const isLockValid = useCallback((lock: ActionLock): boolean => {
    if (!lock.isLocked || !lock.lockTime) return false;
    const elapsed = Date.now() - lock.lockTime;
    return elapsed < LOCK_TIMEOUT_MS;
  }, []);

  /**
   * Executa ação com proteção de lock para START
   */
  const withStartLock = useCallback(async <T>(action: () => Promise<T>): Promise<T | null> => {
    // Verificar se já está bloqueado
    if (isLockValid(startLockRef.current)) {
      console.warn("[useSimuladoLock] START action blocked - already in progress");
      return null;
    }

    // Adquirir lock
    const actionId = `start_${Date.now()}`;
    setStartLock({
      isLocked: true,
      lockTime: Date.now(),
      actionId,
    });

    console.log("[useSimuladoLock] START lock acquired:", actionId);

    try {
      const result = await action();
      return result;
    } catch (error) {
      console.error("[useSimuladoLock] START action failed:", error);
      throw error;
    } finally {
      // Liberar lock
      setStartLock({
        isLocked: false,
        lockTime: null,
        actionId: null,
      });
      console.log("[useSimuladoLock] START lock released:", actionId);
    }
  }, [isLockValid]);

  /**
   * Executa ação com proteção de lock para FINISH
   */
  const withFinishLock = useCallback(async <T>(action: () => Promise<T>): Promise<T | null> => {
    // Verificar se já está bloqueado
    if (isLockValid(finishLockRef.current)) {
      console.warn("[useSimuladoLock] FINISH action blocked - already in progress");
      return null;
    }

    // Adquirir lock
    const actionId = `finish_${Date.now()}`;
    setFinishLock({
      isLocked: true,
      lockTime: Date.now(),
      actionId,
    });

    console.log("[useSimuladoLock] FINISH lock acquired:", actionId);

    try {
      const result = await action();
      return result;
    } catch (error) {
      console.error("[useSimuladoLock] FINISH action failed:", error);
      throw error;
    } finally {
      // Liberar lock
      setFinishLock({
        isLocked: false,
        lockTime: null,
        actionId: null,
      });
      console.log("[useSimuladoLock] FINISH lock released:", actionId);
    }
  }, [isLockValid]);

  /**
   * Força liberação de todos os locks (emergency)
   */
  const forceUnlockAll = useCallback(() => {
    console.warn("[useSimuladoLock] Force unlocking all locks");
    setStartLock({ isLocked: false, lockTime: null, actionId: null });
    setFinishLock({ isLocked: false, lockTime: null, actionId: null });
  }, []);

  return {
    isStartLocked: isLockValid(startLock),
    isFinishLocked: isLockValid(finishLock),
    isAnyLocked: isLockValid(startLock) || isLockValid(finishLock),
    withStartLock,
    withFinishLock,
    forceUnlockAll,
  };
}
