// ============================================
// 🔥 DASHBOARD DE MONITORAMENTO - MATRIZ 2300
// Visualização em tempo real para 5K simultâneos
// ============================================

import React, { memo } from 'react';
import { 
  Activity, 
  Users, 
  MessageCircle, 
  Wifi, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiveMetrics, LiveAlert } from '@/lib/observability/liveMonitor';
import { RunbookItem } from '@/lib/observability/liveMonitor';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ============================================
// COMPONENTE MÉTRICA
// ============================================

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  status?: 'ok' | 'warning' | 'critical';
  subtitle?: string;
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  icon,
  trend,
  status = 'ok',
  subtitle,
}: MetricCardProps) {
  const statusColors = {
    ok: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    critical: 'border-red-500/30 bg-red-500/5',
  };

  const statusTextColors = {
    ok: 'text-green-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400',
  };

  return (
    <Card className={cn("border-2", statusColors[status])}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className={cn("p-2 rounded-lg bg-card", statusTextColors[status])}>
            {icon}
          </div>
          {trend && (
            <TrendingUp className={cn(
              "w-4 h-4",
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400 rotate-180' : 'text-muted-foreground'
            )} />
          )}
        </div>
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn("text-2xl font-bold", statusTextColors[status])}>{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

// ============================================
// DASHBOARD PRINCIPAL
// ============================================

interface LiveDashboardProps {
  metrics: LiveMetrics;
  alerts: LiveAlert[];
  onAcknowledgeAlert?: (alertId: string) => void;
}

export const LiveDashboard = memo(function LiveDashboard({
  metrics,
  alerts,
  onAcknowledgeAlert,
}: LiveDashboardProps) {
  const getViewerStatus = () => {
    if (metrics.viewers > 4000) return 'critical';
    if (metrics.viewers > 3000) return 'warning';
    return 'ok';
  };

  const getLatencyStatus = () => {
    if (metrics.averageLatency > 500) return 'critical';
    if (metrics.averageLatency > 300) return 'warning';
    return 'ok';
  };

  const activeAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Monitor</h2>
          <p className="text-muted-foreground">Monitoramento em tempo real</p>
        </div>
        <Badge variant={activeAlerts.length > 0 ? 'destructive' : 'secondary'}>
          {activeAlerts.length} alertas ativos
        </Badge>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Viewers"
          value={metrics.viewers.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          status={getViewerStatus()}
          subtitle={`Pico: ${metrics.peakViewers}`}
        />
        <MetricCard
          title="Latência"
          value={`${metrics.averageLatency}ms`}
          icon={<Gauge className="w-5 h-5" />}
          status={getLatencyStatus()}
        />
        <MetricCard
          title="Chat/min"
          value={metrics.chatMessagesPerMinute}
          icon={<MessageCircle className="w-5 h-5" />}
          status={metrics.chatMessagesPerMinute > 100 ? 'warning' : 'ok'}
        />
        <MetricCard
          title="Erros"
          value={metrics.connectionErrors}
          icon={<AlertTriangle className="w-5 h-5" />}
          status={metrics.connectionErrors > 10 ? 'critical' : metrics.connectionErrors > 0 ? 'warning' : 'ok'}
        />
      </div>

      {/* Alertas */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeAlerts.map(alert => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  alert.type === 'critical' ? 'bg-red-500/10' :
                  alert.type === 'high' ? 'bg-orange-500/10' :
                  alert.type === 'medium' ? 'bg-yellow-500/10' :
                  'bg-blue-500/10'
                )}
              >
                <div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">
                    Valor: {alert.value} | Limite: {alert.threshold}
                  </p>
                </div>
                {onAcknowledgeAlert && (
                  <button
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Capacidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Capacidade do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Conexões Realtime</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.viewers} / 5.000
                </span>
              </div>
              <Progress value={(metrics.viewers / 5000) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Taxa de Erros</span>
                <span className="text-sm text-muted-foreground">
                  {Math.min(metrics.connectionErrors, 100)}%
                </span>
              </div>
              <Progress 
                value={Math.min(metrics.connectionErrors, 100)} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// ============================================
// RUNBOOK VISUAL
// ============================================

interface RunbookChecklistProps {
  items: RunbookItem[];
  onToggle: (id: string) => void;
  getProgress: (phase: RunbookItem['phase']) => number;
}

export const RunbookChecklist = memo(function RunbookChecklist({
  items,
  onToggle,
  getProgress,
}: RunbookChecklistProps) {
  const phases = [
    { key: 'pre' as const, label: 'Pré-Live', icon: <Clock className="w-4 h-4" /> },
    { key: 'during' as const, label: 'Durante', icon: <Activity className="w-4 h-4" /> },
    { key: 'post' as const, label: 'Pós-Live', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const priorityColors = {
    critical: 'text-red-400 bg-red-500/10',
    high: 'text-orange-400 bg-orange-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    low: 'text-green-400 bg-green-500/10',
  };

  return (
    <div className="space-y-6">
      {phases.map(phase => (
        <Card key={phase.key}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {phase.icon}
                {phase.label}
              </div>
              <Badge variant="outline">
                {Math.round(getProgress(phase.key))}%
              </Badge>
            </CardTitle>
            <Progress value={getProgress(phase.key)} className="h-1" />
          </CardHeader>
          <CardContent className="space-y-2">
            {items
              .filter(item => item.phase === phase.key)
              .map(item => (
                <button
                  key={item.id}
                  onClick={() => onToggle(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                    "hover:bg-muted/50",
                    item.checked && "opacity-60"
                  )}
                >
                  {item.checked ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={cn(
                    "text-left flex-1",
                    item.checked && "line-through"
                  )}>
                    {typeof item.text === 'string' ? item.text : (item.text as any)?.text ?? String(item.text ?? '')}
                  </span>
                  <Badge className={cn("text-xs", priorityColors[item.priority])}>
                    {item.priority}
                  </Badge>
                </button>
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

console.log('[DASHBOARD MONITOR] ⚡ Dashboard de monitoramento carregado');
