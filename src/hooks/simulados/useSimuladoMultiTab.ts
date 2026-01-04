/**
 * 🎯 SIMULADOS — Hook de Detecção Multi-Tab
 * Constituição SYNAPSE Ω v10.0
 * 
 * Detecta e bloqueia quando múltiplas abas tentam
 * acessar a mesma tentativa de simulado.
 * 
 * Usa BroadcastChannel para comunicação entre abas.
 */

import { useEffect, useCallback, useRef, useState } from "react";

interface TabInstance {
  tabId: string;
  attemptId: string;
  timestamp: number;
  isActive: boolean;
}

interface UseSimuladoMultiTabOptions {
  attemptId: string | null;
  enabled?: boolean;
  onSecondaryTabDetected?: () => void;
}

interface UseSimuladoMultiTabReturn {
  isPrimaryTab: boolean;
  isSecondaryTab: boolean;
  otherTabsCount: number;
  forceBecomePrimary: () => void;
}

const CHANNEL_NAME = "simulado_multi_tab_guard";
const HEARTBEAT_INTERVAL_MS = 2000;
const TAB_TIMEOUT_MS = 5000;

export function useSimuladoMultiTab(options: UseSimuladoMultiTabOptions): UseSimuladoMultiTabReturn {
  const { attemptId, enabled = true, onSecondaryTabDetected } = options;

  const [isPrimaryTab, setIsPrimaryTab] = useState(true);
  const [otherTabs, setOtherTabs] = useState<Map<string, TabInstance>>(new Map());
  
  const tabIdRef = useRef<string>(`tab_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Envia heartbeat para outras abas
   */
  const sendHeartbeat = useCallback(() => {
    if (!channelRef.current || !attemptId) return;

    const message: TabInstance = {
      tabId: tabIdRef.current,
      attemptId,
      timestamp: Date.now(),
      isActive: true,
    };

    channelRef.current.postMessage({
      type: "HEARTBEAT",
      data: message,
    });
  }, [attemptId]);

  /**
   * Anuncia que esta aba está assumindo controle
   */
  const announceAsPrimary = useCallback(() => {
    if (!channelRef.current || !attemptId) return;

    channelRef.current.postMessage({
      type: "CLAIM_PRIMARY",
      data: {
        tabId: tabIdRef.current,
        attemptId,
        timestamp: Date.now(),
      },
    });

    setIsPrimaryTab(true);
  }, [attemptId]);

  /**
   * Força esta aba a ser a primária
   */
  const forceBecomePrimary = useCallback(() => {
    announceAsPrimary();
    console.log("[useSimuladoMultiTab] Force claimed primary status");
  }, [announceAsPrimary]);

  /**
   * Inicializa BroadcastChannel
   */
  useEffect(() => {
    if (!enabled || !attemptId) return;

    // Criar canal
    try {
      channelRef.current = new BroadcastChannel(`${CHANNEL_NAME}_${attemptId}`);
    } catch (e) {
      console.warn("[useSimuladoMultiTab] BroadcastChannel not supported:", e);
      return;
    }

    const channel = channelRef.current;

    // Handler de mensagens
    channel.onmessage = (event) => {
      const { type, data } = event.data;
      const otherTabId = data?.tabId;

      if (!otherTabId || otherTabId === tabIdRef.current) return;

      switch (type) {
        case "HEARTBEAT":
          // Outra aba está ativa
          setOtherTabs((prev) => {
            const next = new Map(prev);
            next.set(otherTabId, data);
            return next;
          });

          // Se esta aba foi aberta depois, ela é secundária
          if (data.timestamp < Date.now() - 1000 && isPrimaryTab) {
            // A outra aba estava aqui primeiro
            setIsPrimaryTab(false);
            onSecondaryTabDetected?.();
            console.log("[useSimuladoMultiTab] Detected as secondary tab");
          }
          break;

        case "CLAIM_PRIMARY":
          // Outra aba reivindicou controle
          setIsPrimaryTab(false);
          console.log("[useSimuladoMultiTab] Another tab claimed primary");
          break;

        case "TAB_CLOSING":
          // Outra aba está fechando
          setOtherTabs((prev) => {
            const next = new Map(prev);
            next.delete(otherTabId);
            return next;
          });
          
          // Se éramos secundários e a primária fechou, assumir
          if (!isPrimaryTab) {
            setIsPrimaryTab(true);
            console.log("[useSimuladoMultiTab] Primary tab closed, becoming primary");
          }
          break;
      }
    };

    // Enviar heartbeat inicial e anunciar presença
    sendHeartbeat();

    // Iniciar heartbeat periódico
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();

      // Limpar tabs inativos
      setOtherTabs((prev) => {
        const now = Date.now();
        const next = new Map(prev);
        for (const [tabId, instance] of next) {
          if (now - instance.timestamp > TAB_TIMEOUT_MS) {
            next.delete(tabId);
          }
        }
        return next;
      });
    }, HEARTBEAT_INTERVAL_MS);

    // Cleanup ao desmontar/fechar
    const handleUnload = () => {
      channel.postMessage({
        type: "TAB_CLOSING",
        data: { tabId: tabIdRef.current },
      });
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      handleUnload();
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      channel.close();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [enabled, attemptId, isPrimaryTab, sendHeartbeat, onSecondaryTabDetected]);

  return {
    isPrimaryTab,
    isSecondaryTab: !isPrimaryTab && otherTabs.size > 0,
    otherTabsCount: otherTabs.size,
    forceBecomePrimary,
  };
}
