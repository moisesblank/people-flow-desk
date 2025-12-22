// ============================================================
// 🧠 SNA CONTROL CENTER OMEGA v5.0 — Central de IAs FUTURISTA 2300
// Dashboard administrativo enterprise para Sistema Nervoso Autônomo
// Autor: MESTRE PHD | Capacidade: 5.000+ usuários simultâneos
// ============================================================

import React, { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Activity,
  Zap,
  Shield,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Settings,
  Play,
  Pause,
  BarChart3,
  Cpu,
  Gauge,
  TrendingUp,
  Layers,
  Terminal,
  Loader2,
  Sparkles,
  Database,
  Network,
  Bot,
  MessageSquare,
  Workflow,
  CircuitBoard,
  Eye,
  RotateCcw,
  Trash2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { 
  useAIMetrics, 
  useAIAutomation, 
  useAIJobs, 
  useFeatureFlags,
  type SNAJob,
  type FeatureFlag,
  type HealthCheckResult
} from '@/hooks/useAIAutomation';

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

// Componente de métrica com animação
const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  isLoading = false,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  isLoading?: boolean;
}) {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 border-primary/30 text-primary',
    success: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-500',
    warning: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-500',
    danger: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-500',
    info: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-500',
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-4 rounded-xl bg-gradient-to-br border overflow-hidden group",
        colorClasses[color]
      )}
    >
      {/* Efeito de brilho */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-2 rounded-lg bg-background/50", colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {trend && (
        <div className={cn(
          "flex items-center gap-1 mt-2 text-xs font-medium",
          trend.positive ? "text-emerald-500" : "text-red-500"
        )}>
          <TrendingUp className={cn("h-3 w-3", !trend.positive && "rotate-180")} />
          {trend.positive ? '+' : ''}{trend.value}%
        </div>
      )}
    </motion.div>
  );
});

// Componente de status de saúde
const HealthStatus = memo(function HealthStatus({
  service,
  ok,
  latency,
}: {
  service: string;
  ok: boolean;
  latency: number;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full animate-pulse",
          ok ? "bg-emerald-500" : "bg-red-500"
        )} />
        <span className="text-sm font-medium">{service}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xs",
          latency < 100 ? "text-emerald-500" : 
          latency < 500 ? "text-amber-500" : "text-red-500"
        )}>
          {latency}ms
        </span>
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  );
});

// Componente de job
const JobItem = memo(function JobItem({
  job,
  onCancel,
  onRetry,
}: {
  job: SNAJob;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    scheduled: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    running: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
    completed: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
    failed: 'bg-red-500/20 text-red-500 border-red-500/30',
    cancelled: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-3 w-3" />,
    scheduled: <Clock className="h-3 w-3" />,
    running: <Loader2 className="h-3 w-3 animate-spin" />,
    completed: <CheckCircle2 className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
    cancelled: <XCircle className="h-3 w-3" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium truncate">{job.job_type}</span>
          <Badge 
            variant="outline" 
            className={cn("text-[10px] gap-1", statusColors[job.status])}
          >
            {statusIcons[job.status]}
            {job.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>P{job.priority}</span>
          {job.processing_time_ms && <span>{job.processing_time_ms}ms</span>}
          {job.actual_cost_usd && <span>${job.actual_cost_usd.toFixed(4)}</span>}
          <span>{new Date(job.created_at).toLocaleTimeString()}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {job.status === 'failed' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRetry(job.id)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
        {['pending', 'scheduled'].includes(job.status) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-600"
            onClick={() => onCancel(job.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
});

// Componente de feature flag
const FlagItem = memo(function FlagItem({
  flag,
  onToggle,
}: {
  flag: FeatureFlag;
  onToggle: (key: string, enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">{flag.flag_key}</span>
          <Badge variant="outline" className="text-[10px]">
            {flag.category}
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px]",
              flag.rollout_percentage === 100 
                ? "text-emerald-500 border-emerald-500/30" 
                : "text-amber-500 border-amber-500/30"
            )}
          >
            {flag.rollout_percentage}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {flag.description}
        </p>
      </div>
      
      <Switch
        checked={flag.is_enabled}
        onCheckedChange={(checked) => onToggle(flag.flag_key, checked)}
      />
    </div>
  );
});

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export const AIControlCenter = memo(function AIControlCenter() {
  const { metrics, isLoading: metricsLoading, refresh: refreshMetrics } = useAIMetrics();
  const { runHealthcheck, cancelJob, retryJob, isLoading: automationLoading } = useAIAutomation();
  const { jobs, isLoading: jobsLoading, refresh: refreshJobs } = useAIJobs(30);
  const { flags, isLoading: flagsLoading, toggleFlag } = useFeatureFlags();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [healthResults, setHealthResults] = useState<Record<string, HealthCheckResult> | null>(null);
  const [isRunningHealthcheck, setIsRunningHealthcheck] = useState(false);

  // Executar healthcheck
  const handleHealthcheck = useCallback(async () => {
    setIsRunningHealthcheck(true);
    try {
      const results = await runHealthcheck();
      setHealthResults(results);
      toast.success('🏥 Healthcheck concluído');
    } finally {
      setIsRunningHealthcheck(false);
    }
  }, [runHealthcheck]);

  // Refresh geral
  const handleRefreshAll = useCallback(() => {
    refreshMetrics();
    refreshJobs();
    toast.success('🔄 Dados atualizados');
  }, [refreshMetrics, refreshJobs]);

  // Métricas calculadas
  const computedMetrics = useMemo(() => {
    if (!metrics) return null;
    
    const healthServices = Object.values(metrics.health.services || {});
    const healthyCount = healthServices.filter(s => s.ok).length;
    const totalServices = healthServices.length || 1;
    
    return {
      healthPercent: Math.round((healthyCount / totalServices) * 100),
      queueDepth: Object.values(metrics.queue.pending_by_priority || {}).reduce((a, b) => a + b, 0),
      isHealthy: metrics.health.overall === 'healthy',
    };
  }, [metrics]);

  const isLoading = metricsLoading || jobsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30">
              <Brain className="h-7 w-7 text-primary" />
            </div>
            <motion.div 
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
              SNA Control Center
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistema Nervoso Autônomo Omega v5.0
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1.5",
              computedMetrics?.isHealthy 
                ? "text-emerald-500 border-emerald-500/30" 
                : "text-amber-500 border-amber-500/30"
            )}
          >
            <Activity className="h-3 w-3" />
            {computedMetrics?.isHealthy ? 'Operacional' : 'Degradado'}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleHealthcheck}
            disabled={isRunningHealthcheck}
            className="gap-2"
          >
            {isRunningHealthcheck ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            Healthcheck
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Jobs Totais (24h)"
          value={metrics?.jobs.total || 0}
          icon={Workflow}
          color="primary"
          isLoading={metricsLoading}
        />
        <MetricCard
          title="Sucesso"
          value={`${metrics?.performance.success_rate.toFixed(1) || 0}%`}
          icon={CheckCircle2}
          color={metrics?.performance.success_rate >= 95 ? 'success' : 'warning'}
          isLoading={metricsLoading}
        />
        <MetricCard
          title="Latência Média"
          value={`${metrics?.performance.avg_latency_ms || 0}ms`}
          icon={Gauge}
          color={metrics?.performance.avg_latency_ms < 500 ? 'success' : 'warning'}
          isLoading={metricsLoading}
        />
        <MetricCard
          title="Custo Hoje"
          value={`$${metrics?.costs.today_usd.toFixed(4) || '0.00'}`}
          icon={DollarSign}
          color="info"
          isLoading={metricsLoading}
        />
        <MetricCard
          title="Cache Hit"
          value={`${metrics?.performance.cache_hit_rate || 0}%`}
          icon={Database}
          color="primary"
          isLoading={metricsLoading}
        />
        <MetricCard
          title="Na Fila"
          value={metrics?.jobs.pending || 0}
          icon={Layers}
          color={metrics?.jobs.pending > 10 ? 'warning' : 'success'}
          isLoading={metricsLoading}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <Workflow className="h-4 w-4" />
            Jobs
            {jobs.filter(j => j.status === 'running').length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {jobs.filter(j => j.status === 'running').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <Activity className="h-4 w-4" />
            Saúde
          </TabsTrigger>
          <TabsTrigger value="flags" className="gap-2">
            <Settings className="h-4 w-4" />
            Feature Flags
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Orçamento */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Orçamento IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Usado: ${metrics?.costs.total_usd.toFixed(4) || '0.00'}</span>
                  <span>Limite: ${metrics?.costs.budget_usd.toFixed(2) || '100.00'}</span>
                </div>
                <Progress 
                  value={metrics?.costs.budget_percentage || 0} 
                  className="h-2"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{metrics?.costs.budget_percentage.toFixed(1) || 0}% utilizado</span>
                  <span>Restante: ${metrics?.costs.budget_remaining.toFixed(2) || '100.00'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="h-4 w-4 text-primary" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Latência P95</span>
                  <Badge variant="outline">{metrics?.performance.p95_latency_ms || 0}ms</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tokens In</span>
                  <Badge variant="outline">{metrics?.performance.tokens_in.toLocaleString() || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tokens Out</span>
                  <Badge variant="outline">{metrics?.performance.tokens_out.toLocaleString() || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Jobs por Status */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Workflow className="h-4 w-4 text-primary" />
                Jobs por Status (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'Pendentes', value: metrics?.jobs.pending || 0, color: 'text-amber-500' },
                  { label: 'Executando', value: metrics?.jobs.running || 0, color: 'text-cyan-500' },
                  { label: 'Concluídos', value: metrics?.jobs.completed || 0, color: 'text-emerald-500' },
                  { label: 'Falhos', value: metrics?.jobs.failed || 0, color: 'text-red-500' },
                  { label: 'Total', value: metrics?.jobs.total || 0, color: 'text-primary' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 rounded-lg bg-muted/30">
                    <p className={cn("text-2xl font-bold", item.color)}>{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Jobs */}
        <TabsContent value="jobs">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Workflow className="h-4 w-4 text-primary" />
                  Jobs Recentes
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={refreshJobs}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {jobsLoading ? (
                      [...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                      ))
                    ) : jobs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Workflow className="h-12 w-12 opacity-20 mb-3" />
                        <p className="text-sm">Nenhum job encontrado</p>
                      </div>
                    ) : (
                      jobs.map(job => (
                        <JobItem 
                          key={job.id} 
                          job={job} 
                          onCancel={cancelJob}
                          onRetry={retryJob}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Saúde */}
        <TabsContent value="health">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-primary" />
                  Status dos Serviços
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleHealthcheck}
                  disabled={isRunningHealthcheck}
                >
                  {isRunningHealthcheck ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {healthResults ? (
                  Object.entries(healthResults).map(([service, result]) => (
                    <HealthStatus 
                      key={service}
                      service={service}
                      ok={result.ok}
                      latency={result.latency_ms}
                    />
                  ))
                ) : metrics?.health.services ? (
                  Object.entries(metrics.health.services).map(([service, data]) => (
                    <HealthStatus 
                      key={service}
                      service={service}
                      ok={data.ok}
                      latency={data.latency_ms}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 opacity-20 mb-3" />
                    <p className="text-sm">Execute um healthcheck para ver os status</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Feature Flags */}
        <TabsContent value="flags">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4 text-primary" />
                Feature Flags
              </CardTitle>
              <CardDescription>
                Controle de funcionalidades e rollout progressivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {flagsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))
                  ) : flags.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Settings className="h-12 w-12 opacity-20 mb-3" />
                      <p className="text-sm">Nenhuma feature flag configurada</p>
                    </div>
                  ) : (
                    flags.map(flag => (
                      <FlagItem 
                        key={flag.flag_key} 
                        flag={flag} 
                        onToggle={toggleFlag}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

AIControlCenter.displayName = 'AIControlCenter';

export default AIControlCenter;
