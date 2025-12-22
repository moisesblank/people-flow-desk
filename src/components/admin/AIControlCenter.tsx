// ============================================================
// 🧠 AI CONTROL CENTER — Central de IAs v3.0
// Dashboard administrativo para monitoramento e controle do SNA
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
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
import { toast } from 'sonner';

import { useAIMetrics, useAIAutomation } from '@/hooks/useAIAutomation';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ============================================================
// TIPOS
// ============================================================

interface FeatureFlag {
  flag_key: string;
  description: string;
  is_enabled: boolean;
  rollout_percentage: number;
}

interface RecentJob {
  id: string;
  job_type: string;
  status: string;
  created_at: string;
  processing_time_ms: number | null;
  actual_cost_usd: number | null;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function AIControlCenter() {
  const { metrics, isLoading: metricsLoading, refresh: refreshMetrics } = useAIMetrics();
  const { runHealthcheck, checkFeatureFlag } = useAIAutomation();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [isRunningHealthcheck, setIsRunningHealthcheck] = useState(false);
  const [healthResults, setHealthResults] = useState<Record<string, { ok: boolean; latency_ms: number }> | null>(null);

  // Carregar feature flags
  const loadFeatureFlags = useCallback(async () => {
    const { data } = await supabase
      .from('ai_feature_flags')
      .select('flag_key, description, is_enabled, rollout_percentage')
      .order('flag_key');
    
    if (data) setFeatureFlags(data);
  }, []);

  // Carregar jobs recentes
  const loadRecentJobs = useCallback(async () => {
    const { data } = await supabase
      .from('ai_jobs')
      .select('id, job_type, status, created_at, processing_time_ms, actual_cost_usd')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setRecentJobs(data);
  }, []);

  // Toggle feature flag
  const toggleFeatureFlag = useCallback(async (flagKey: string, enabled: boolean) => {
    const { error } = await supabase
      .from('ai_feature_flags')
      .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('flag_key', flagKey);
    
    if (error) {
      toast.error('Erro ao atualizar flag');
    } else {
      toast.success(`${flagKey} ${enabled ? 'ativado' : 'desativado'}`);
      loadFeatureFlags();
    }
  }, [loadFeatureFlags]);

  // Executar healthcheck
  const handleHealthcheck = useCallback(async () => {
    setIsRunningHealthcheck(true);
    setHealthResults(null);
    
    try {
      const results = await runHealthcheck(['gemini_flash', 'gemini_pro', 'gpt5_mini', 'gpt5_nano']);
      setHealthResults(results);
      
      if (results) {
        const allOk = Object.values(results).every(r => r.ok);
        if (allOk) {
          toast.success('Todos os serviços estão funcionando!');
        } else {
          toast.warning('Alguns serviços apresentam problemas');
        }
      }
    } catch (err) {
      toast.error('Erro ao executar healthcheck');
    } finally {
      setIsRunningHealthcheck(false);
    }
  }, [runHealthcheck]);

  // Carregar dados iniciais
  useEffect(() => {
    loadFeatureFlags();
    loadRecentJobs();
    
    // Refresh a cada 30s
    const interval = setInterval(() => {
      loadRecentJobs();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadFeatureFlags, loadRecentJobs]);

  // Calcular métricas resumidas
  const totalCost = metrics?.budgets?.reduce((sum, b) => sum + (b.spent_usd || 0), 0) || 0;
  const budgetLimit = metrics?.budgets?.find(b => b.scope === 'global')?.limit_usd || 100;
  const budgetUsage = (totalCost / budgetLimit) * 100;
  
  const pendingJobs = Object.values(metrics?.queue_depth || {}).reduce((sum, n) => sum + n, 0);
  
  const toolsHealthy = metrics?.health 
    ? Object.values(metrics.health).filter(h => h.ok).length 
    : 0;
  const toolsTotal = metrics?.health 
    ? Object.keys(metrics.health).length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Brain className="h-8 w-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Central de IAs</h1>
            <p className="text-muted-foreground">Sistema Nervoso Autônomo v3.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refreshMetrics();
              loadRecentJobs();
            }}
            disabled={metricsLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", metricsLoading && "animate-spin")} />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleHealthcheck}
            disabled={isRunningHealthcheck}
          >
            {isRunningHealthcheck ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Healthcheck
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Custo */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custo Hoje</p>
                <p className="text-2xl font-bold text-green-400">
                  ${totalCost.toFixed(4)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400/50" />
            </div>
            <Progress value={budgetUsage} className="mt-3 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">
              {budgetUsage.toFixed(1)}% do limite mensal
            </p>
          </CardContent>
        </Card>

        {/* Fila */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fila</p>
                <p className="text-2xl font-bold text-blue-400">{pendingJobs}</p>
              </div>
              <Layers className="h-8 w-8 text-blue-400/50" />
            </div>
            <div className="flex gap-2 mt-3">
              {Object.entries(metrics?.queue_depth || {}).map(([priority, count]) => (
                <Badge key={priority} variant="outline" className="text-xs">
                  {priority}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Saúde */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Serviços</p>
                <p className="text-2xl font-bold text-purple-400">
                  {toolsHealthy}/{toolsTotal}
                </p>
              </div>
              {toolsHealthy === toolsTotal ? (
                <CheckCircle2 className="h-8 w-8 text-green-400/50" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-yellow-400/50" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {toolsHealthy === toolsTotal ? 'Todos operacionais' : 'Alguns com problemas'}
            </p>
          </CardContent>
        </Card>

        {/* Latência */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latência Média</p>
                <p className="text-2xl font-bold text-orange-400">
                  {metrics?.tools
                    ? Math.round(
                        Object.values(metrics.tools).reduce((sum, t) => sum + (t.avg_latency_ms || 0), 0) /
                        Object.keys(metrics.tools).length
                      )
                    : 0}
                  <span className="text-sm font-normal">ms</span>
                </p>
              </div>
              <Gauge className="h-8 w-8 text-orange-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Terminal className="h-4 w-4 mr-2" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 mr-2" />
            Saúde
          </TabsTrigger>
          <TabsTrigger value="flags">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Uso por ferramenta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Uso por Ferramenta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics?.tools || {}).map(([tool, stats]) => (
                    <div key={tool} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{tool}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {stats.calls} chamadas
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className={cn(
                          stats.success_rate >= 99 ? 'text-green-400' :
                          stats.success_rate >= 95 ? 'text-yellow-400' : 'text-red-400'
                        )}>
                          {stats.success_rate.toFixed(1)}% sucesso
                        </span>
                        <span>{stats.avg_latency_ms?.toFixed(0)}ms latência</span>
                        <span>${stats.cost_usd?.toFixed(4)}</span>
                      </div>
                      <Progress 
                        value={stats.success_rate} 
                        className="h-1"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Budgets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Orçamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(metrics?.budgets || []).map((budget, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">
                          {budget.scope}: {budget.scope_id}
                        </span>
                        <span className={cn(
                          budget.percentage < 80 ? 'text-green-400' :
                          budget.percentage < 95 ? 'text-yellow-400' : 'text-red-400'
                        )}>
                          ${budget.spent_usd.toFixed(2)} / ${budget.limit_usd.toFixed(2)}
                        </span>
                      </div>
                      <Progress 
                        value={budget.percentage} 
                        className={cn(
                          "h-2",
                          budget.percentage > 95 && "bg-red-500/20"
                        )}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Jobs */}
        <TabsContent value="jobs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jobs Recentes</CardTitle>
              <CardDescription>Últimos 20 jobs processados</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {recentJobs.map((job) => (
                    <div 
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {job.status === 'succeeded' && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                        {job.status === 'failed' && <XCircle className="h-4 w-4 text-red-400" />}
                        {job.status === 'running' && <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />}
                        {job.status === 'pending' && <Clock className="h-4 w-4 text-yellow-400" />}
                        {job.status === 'dead' && <XCircle className="h-4 w-4 text-gray-400" />}
                        
                        <div>
                          <p className="font-mono text-sm">{job.job_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        {job.processing_time_ms && (
                          <span className="text-muted-foreground">
                            {job.processing_time_ms}ms
                          </span>
                        )}
                        {job.actual_cost_usd && (
                          <span className="text-green-400">
                            ${job.actual_cost_usd.toFixed(6)}
                          </span>
                        )}
                        <Badge variant={
                          job.status === 'succeeded' ? 'default' :
                          job.status === 'failed' ? 'destructive' :
                          job.status === 'running' ? 'secondary' : 'outline'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health */}
        <TabsContent value="health" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Saúde dos Serviços</CardTitle>
                <CardDescription>Status em tempo real das integrações</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleHealthcheck}
                disabled={isRunningHealthcheck}
              >
                {isRunningHealthcheck ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Testar Todos
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(healthResults || metrics?.health || {}).map(([service, status]) => (
                  <motion.div
                    key={service}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-lg border",
                      status.ok 
                        ? "bg-green-500/5 border-green-500/20" 
                        : "bg-red-500/5 border-red-500/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {status.ok ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                        <div>
                          <p className="font-medium">{service}</p>
                          <p className="text-xs text-muted-foreground">
                            {status.latency_ms}ms latência
                          </p>
                        </div>
                      </div>
                      <Badge variant={status.ok ? 'default' : 'destructive'}>
                        {status.ok ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Flags */}
        <TabsContent value="flags" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feature Flags</CardTitle>
              <CardDescription>Controle granular de funcionalidades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureFlags.map((flag) => (
                  <div 
                    key={flag.flag_key}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={flag.flag_key} className="font-medium">
                          {flag.flag_key}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {flag.rollout_percentage}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {flag.description}
                      </p>
                    </div>
                    <Switch
                      id={flag.flag_key}
                      checked={flag.is_enabled}
                      onCheckedChange={(checked) => toggleFeatureFlag(flag.flag_key, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIControlCenter;
