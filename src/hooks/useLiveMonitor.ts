// ============================================
// 🔥 HOOK LIVE MONITOR - MATRIZ 2300
// React hook para monitoramento em tempo real
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  liveMonitor, 
  LiveMetrics, 
  LiveAlert,
  RUNBOOK_CHECKLIST,
  RunbookItem 
} from '@/lib/observability/liveMonitor';

interface UseLiveMonitorReturn {
  metrics: LiveMetrics;
  alerts: LiveAlert[];
  history: LiveMetrics[];
  isMonitoring: boolean;
  startMonitoring: (liveId: string) => void;
  stopMonitoring: () => void;
  acknowledgeAlert: (alertId: string) => void;
  updateViewers: (count: number) => void;
  updateChatRate: (rate: number) => void;
}

export function useLiveMonitor(): UseLiveMonitorReturn {
  const [metrics, setMetrics] = useState<LiveMetrics>(liveMonitor.getMetrics());
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [history, setHistory] = useState<LiveMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  useEffect(() => {
    const unsubscribe = liveMonitor.subscribe((newMetrics, newAlerts) => {
      setMetrics(newMetrics);
      setAlerts(newAlerts);
      setHistory(liveMonitor.getHistory());
    });
    
    return () => { unsubscribe(); };
  }, []);
  
  const startMonitoring = useCallback((liveId: string) => {
    liveMonitor.startMonitoring(liveId);
    setIsMonitoring(true);
  }, []);
  
  const stopMonitoring = useCallback(() => {
    liveMonitor.stopMonitoring();
    setIsMonitoring(false);
  }, []);
  
  const acknowledgeAlert = useCallback((alertId: string) => {
    liveMonitor.acknowledgeAlert(alertId);
    setAlerts(liveMonitor.getActiveAlerts());
  }, []);
  
  const updateViewers = useCallback((count: number) => {
    liveMonitor.updateViewers(count);
  }, []);
  
  const updateChatRate = useCallback((rate: number) => {
    liveMonitor.updateChatRate(rate);
  }, []);
  
  return {
    metrics,
    alerts,
    history,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    acknowledgeAlert,
    updateViewers,
    updateChatRate,
  };
}

// ============================================
// HOOK RUNBOOK
// ============================================

interface UseRunbookReturn {
  items: RunbookItem[];
  toggleItem: (id: string) => void;
  getProgress: (phase: RunbookItem['phase']) => number;
  resetChecklist: () => void;
}

const STORAGE_KEY = 'live_runbook_state';

export function useRunbook(): UseRunbookReturn {
  const [items, setItems] = useState<RunbookItem[]>(() => {
    // Carregar estado do localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignorar erro de parse
    }
    
    // Estado inicial
    return RUNBOOK_CHECKLIST.map(item => ({ ...item, checked: false }));
  });
  
  // Salvar no localStorage quando mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignorar erro de storage
    }
  }, [items]);
  
  const toggleItem = useCallback((id: string) => {
    setItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);
  
  const getProgress = useCallback((phase: RunbookItem['phase']) => {
    const phaseItems = items.filter(item => item.phase === phase);
    const checkedItems = phaseItems.filter(item => item.checked);
    return phaseItems.length > 0 ? (checkedItems.length / phaseItems.length) * 100 : 0;
  }, [items]);
  
  const resetChecklist = useCallback(() => {
    setItems(RUNBOOK_CHECKLIST.map(item => ({ ...item, checked: false })));
  }, []);
  
  return {
    items,
    toggleItem,
    getProgress,
    resetChecklist,
  };
}

// ============================================
// HOOK HEALTH CHECK RÁPIDO
// ============================================

interface HealthStatus {
  database: 'ok' | 'slow' | 'error';
  realtime: 'ok' | 'disconnected' | 'error';
  latency: number;
  lastCheck: number;
}

export function useHealthCheck(intervalMs = 30000): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>({
    database: 'ok',
    realtime: 'ok',
    latency: 0,
    lastCheck: Date.now(),
  });
  
  const checkHealth = useCallback(async () => {
    const start = performance.now();
    let dbStatus: HealthStatus['database'] = 'ok';
    let rtStatus: HealthStatus['realtime'] = 'ok';
    
    try {
      const { error } = await (await import('@/integrations/supabase/client')).supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      
      const latency = Math.round(performance.now() - start);
      
      if (error) {
        dbStatus = 'error';
      } else if (latency > 500) {
        dbStatus = 'slow';
      }
      
      setStatus({
        database: dbStatus,
        realtime: rtStatus,
        latency,
        lastCheck: Date.now(),
      });
    } catch {
      setStatus(prev => ({
        ...prev,
        database: 'error',
        lastCheck: Date.now(),
      }));
    }
  }, []);
  
  // PATCH-032: jitter anti-herd (0-5s)
  useEffect(() => {
    checkHealth();
    const jitter = Math.floor(Math.random() * 5000);
    const interval = setInterval(checkHealth, intervalMs + jitter);
    return () => clearInterval(interval);
  }, [checkHealth, intervalMs]);
  
  return status;
}

console.log('[HOOKS MONITOR] ⚡ Hooks de monitoramento carregados');
