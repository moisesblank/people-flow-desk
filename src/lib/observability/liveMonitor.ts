// ============================================
// 🔥 OBSERVABILIDADE LIVE - MATRIZ 2300
// Monitoramento em tempo real para 5K simultâneos
// ============================================

import { supabase } from "@/integrations/supabase/client";

// ============================================
// TIPOS
// ============================================

export interface LiveMetrics {
  viewers: number;
  chatMessagesPerMinute: number;
  connectionErrors: number;
  averageLatency: number;
  peakViewers: number;
  timestamp: number;
}

export interface AlertConfig {
  type: 'critical' | 'high' | 'medium' | 'info';
  threshold: number;
  metric: keyof LiveMetrics;
  message: string;
}

export interface LiveAlert {
  id: string;
  type: AlertConfig['type'];
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
  metric: keyof LiveMetrics;
}

// ============================================
// CONFIGURAÇÃO DE ALERTAS
// ============================================

export const ALERT_CONFIG: AlertConfig[] = [
  {
    type: 'critical',
    threshold: 4000,
    metric: 'viewers',
    message: '🚨 CRÍTICO: Conexões próximas do limite (>4000)'
  },
  {
    type: 'high',
    threshold: 50,
    metric: 'connectionErrors',
    message: '🟠 ALTO: Muitos erros de conexão'
  },
  {
    type: 'medium',
    threshold: 300,
    metric: 'averageLatency',
    message: '🟡 MÉDIO: Latência elevada (>300ms)'
  },
  {
    type: 'info',
    threshold: 100,
    metric: 'chatMessagesPerMinute',
    message: '📊 INFO: Chat muito ativo (>100 msg/min)'
  },
];

// ============================================
// CLASSE DE MONITORAMENTO
// ============================================

class LiveMonitor {
  private metrics: LiveMetrics = {
    viewers: 0,
    chatMessagesPerMinute: 0,
    connectionErrors: 0,
    averageLatency: 0,
    peakViewers: 0,
    timestamp: Date.now(),
  };
  
  private alerts: LiveAlert[] = [];
  private listeners: Set<(metrics: LiveMetrics, alerts: LiveAlert[]) => void> = new Set();
  private metricsHistory: LiveMetrics[] = [];
  private maxHistorySize = 60; // 1 hora de dados (1 por minuto)
  private isMonitoring = false;
  private intervalId: NodeJS.Timeout | null = null;
  
  // Iniciar monitoramento
  startMonitoring(liveId: string) {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    
    console.log('[LIVE MONITOR] 🔥 Iniciando monitoramento:', liveId);
    
    // Coletar métricas a cada 10 segundos
    this.intervalId = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
      this.notifyListeners();
    }, 10000);
    
    // Primeira coleta imediata
    this.collectMetrics();
  }
  
  // Parar monitoramento
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
    this.saveMetricsSnapshot();
    console.log('[LIVE MONITOR] ⏹️ Monitoramento encerrado');
  }
  
  // Coletar métricas
  private async collectMetrics() {
    const now = Date.now();
    
    // Medir latência (ping simples)
    const startPing = performance.now();
    try {
      await supabase.from('profiles').select('id', { count: 'exact', head: true });
      const latency = Math.round(performance.now() - startPing);
      this.metrics.averageLatency = latency;
    } catch {
      this.metrics.connectionErrors++;
    }
    
    // Atualizar timestamp
    this.metrics.timestamp = now;
    
    // Atualizar peak
    if (this.metrics.viewers > this.metrics.peakViewers) {
      this.metrics.peakViewers = this.metrics.viewers;
    }
    
    // Salvar no histórico
    this.metricsHistory.push({ ...this.metrics });
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }
  
  // Verificar alertas
  private checkAlerts() {
    for (const config of ALERT_CONFIG) {
      const value = this.metrics[config.metric];
      
      if (value >= config.threshold) {
        // Verificar se já existe alerta ativo para esta métrica
        const existingAlert = this.alerts.find(
          a => a.metric === config.metric && !a.acknowledged && Date.now() - a.timestamp < 60000
        );
        
        if (!existingAlert) {
          const alert: LiveAlert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: config.type,
            message: config.message,
            value,
            threshold: config.threshold,
            timestamp: Date.now(),
            acknowledged: false,
            metric: config.metric,
          };
          
          this.alerts.push(alert);
          this.triggerAlertNotification(alert);
        }
      }
    }
    
    // Limpar alertas antigos (>5 min)
    this.alerts = this.alerts.filter(
      a => a.acknowledged || Date.now() - a.timestamp < 300000
    );
  }
  
  // Notificar sobre alerta
  private async triggerAlertNotification(alert: LiveAlert) {
    console.warn('[LIVE ALERT]', alert.type.toUpperCase(), alert.message, `Valor: ${alert.value}`);
    
    // Salvar alerta no banco
    try {
      await supabase.from('alertas_sistema').insert({
        tipo: 'live_monitor',
        titulo: alert.message,
        mensagem: `${alert.message} - Valor atual: ${alert.value}, Limite: ${alert.threshold}`,
        origem: 'live_monitor',
        destinatarios: ['owner', 'admin'],
        dados: {
          alert_type: alert.type,
          metric: alert.value,
          threshold: alert.threshold,
        },
      });
    } catch (error) {
      console.error('[LIVE MONITOR] Erro ao salvar alerta:', error);
    }
  }
  
  // Notificar listeners
  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.metrics, this.alerts);
    }
  }
  
  // Atualizar viewers (chamado externamente)
  updateViewers(count: number) {
    this.metrics.viewers = count;
  }
  
  // Atualizar mensagens/minuto (chamado externamente)
  updateChatRate(rate: number) {
    this.metrics.chatMessagesPerMinute = rate;
  }
  
  // Registrar erro de conexão
  registerError() {
    this.metrics.connectionErrors++;
  }
  
  // Acknowledge alerta
  acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }
  
  // Subscribe para atualizações
  subscribe(callback: (metrics: LiveMetrics, alerts: LiveAlert[]) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  // Obter métricas atuais
  getMetrics(): LiveMetrics {
    return { ...this.metrics };
  }
  
  // Obter histórico
  getHistory(): LiveMetrics[] {
    return [...this.metricsHistory];
  }
  
  // Obter alertas ativos
  getActiveAlerts(): LiveAlert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }
  
  // Salvar snapshot final
  private async saveMetricsSnapshot() {
    try {
      await supabase.from('analytics_metrics').insert({
        metric_type: 'live_session',
        metadata: {
          peak_viewers: this.metrics.peakViewers,
          total_errors: this.metrics.connectionErrors,
          avg_latency: this.metrics.averageLatency,
          history_points: this.metricsHistory.length,
        },
      });
    } catch (error) {
      console.error('[LIVE MONITOR] Erro ao salvar snapshot:', error);
    }
  }
}

// Singleton
export const liveMonitor = new LiveMonitor();

// ============================================
// RUNBOOK CHECKLIST
// ============================================

export interface RunbookItem {
  id: string;
  phase: 'pre' | 'during' | 'post';
  text: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  checked: boolean;
}

export const RUNBOOK_CHECKLIST: Omit<RunbookItem, 'checked'>[] = [
  // Pré-Live (T-24h até T-1h)
  { id: 'pre_1', phase: 'pre', text: 'Congelar deploys (release freeze)', priority: 'critical' },
  { id: 'pre_2', phase: 'pre', text: 'Verificar secrets rotacionados', priority: 'high' },
  { id: 'pre_3', phase: 'pre', text: 'Confirmar backup/PITR ativo', priority: 'critical' },
  { id: 'pre_4', phase: 'pre', text: 'Warmup de cache (páginas críticas)', priority: 'medium' },
  { id: 'pre_5', phase: 'pre', text: 'Verificar métricas baseline', priority: 'high' },
  { id: 'pre_6', phase: 'pre', text: 'Ensaio com 100-300 usuários', priority: 'medium' },
  { id: 'pre_7', phase: 'pre', text: 'Testar slow mode do chat', priority: 'high' },
  { id: 'pre_8', phase: 'pre', text: 'Verificar player backup (YouTube)', priority: 'high' },
  
  // Durante a Live
  { id: 'during_1', phase: 'during', text: 'Monitorar dashboards em tempo real', priority: 'critical' },
  { id: 'during_2', phase: 'during', text: 'Slow mode do chat pronto', priority: 'high' },
  { id: 'during_3', phase: 'during', text: 'Player backup disponível', priority: 'high' },
  { id: 'during_4', phase: 'during', text: 'Banner de instabilidade preparado', priority: 'medium' },
  { id: 'during_5', phase: 'during', text: 'Equipe de suporte posicionada', priority: 'high' },
  
  // Pós-Live
  { id: 'post_1', phase: 'post', text: 'Relatório de incidentes', priority: 'high' },
  { id: 'post_2', phase: 'post', text: 'Lições aprendidas documentadas', priority: 'medium' },
  { id: 'post_3', phase: 'post', text: 'Revisão de custos', priority: 'medium' },
  { id: 'post_4', phase: 'post', text: 'Backup da gravação', priority: 'high' },
  { id: 'post_5', phase: 'post', text: 'Métricas finais exportadas', priority: 'low' },
];

console.log('[OBSERVABILIDADE] ⚡ Sistema de monitoramento carregado - Matriz 2300');
