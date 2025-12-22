// ============================================
// 🛡️ SECURITY DASHBOARD v1.0
// Dashboard de segurança para administradores
// Implementa: M6 - Verificações, M7 - Observabilidade
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  ShieldX,
  Lock,
  Key,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Database,
  Globe,
  Webhook,
  FileWarning,
  TrendingUp,
  Clock,
  Terminal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================
// TIPOS
// ============================================
interface SecurityEvent {
  id: string;
  created_at: string;
  event_type: string;
  user_id: string | null;
  ip_address: string | null;
  risk_score: number;
  details: Record<string, unknown> | null;
  resolved: boolean;
}

interface RLSStatus {
  table_name: string;
  rls_enabled: boolean;
  policy_count: number;
  risk_level: string;
}

interface WebhookEvent {
  id: string;
  provider: string;
  event_id: string;
  event_type: string | null;
  received_at: string;
  status: string;
  signature_valid: boolean | null;
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================
const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  color = 'primary' 
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  color?: 'primary' | 'green' | 'yellow' | 'red';
}) => {
  const colorClasses = {
    primary: 'bg-primary/20 text-primary',
    green: 'bg-green-500/20 text-green-500',
    yellow: 'bg-yellow-500/20 text-yellow-500',
    red: 'bg-red-500/20 text-red-500',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground truncate">{label}</p>
          </div>
          {trend && (
            <TrendingUp className={cn(
              'h-4 w-4',
              trend === 'up' && 'text-red-500',
              trend === 'down' && 'text-green-500',
              trend === 'stable' && 'text-muted-foreground'
            )} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const RiskBadge = ({ level }: { level: string }) => {
  const config = {
    CRITICAL: { class: 'bg-red-500/20 text-red-500 border-red-500/30', icon: ShieldX },
    HIGH: { class: 'bg-orange-500/20 text-orange-500 border-orange-500/30', icon: ShieldAlert },
    MEDIUM: { class: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30', icon: AlertTriangle },
    LOW: { class: 'bg-green-500/20 text-green-500 border-green-500/30', icon: ShieldCheck },
  };

  const cfg = config[level as keyof typeof config] || config.LOW;
  const Icon = cfg.icon;

  return (
    <Badge className={cfg.class}>
      <Icon className="h-3 w-3 mr-1" />
      {level}
    </Badge>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function SecurityDashboard() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Query: Eventos de segurança recentes
  const { data: securityEvents, refetch: refetchEvents } = useQuery({
    queryKey: ['security-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.warn('Security events query error:', error);
        return [];
      }
      return data as SecurityEvent[];
    },
    refetchInterval: 30000, // 30s
  });

  // Query: Status RLS
  const { data: rlsStatus, refetch: refetchRLS } = useQuery({
    queryKey: ['rls-status'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('audit_rls_coverage');
      if (error) {
        console.warn('RLS audit error:', error);
        return [];
      }
      return data as RLSStatus[];
    },
  });

  // Query: Webhooks recentes
  const { data: webhookEvents, refetch: refetchWebhooks } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.warn('Webhook events query error:', error);
        return [];
      }
      return data as WebhookEvent[];
    },
    refetchInterval: 60000,
  });

  // Estatísticas
  const stats = {
    unresolvedEvents: securityEvents?.filter(e => !e.resolved).length || 0,
    highRiskEvents: securityEvents?.filter(e => e.risk_score >= 70).length || 0,
    rlsEnabled: rlsStatus?.filter(r => r.rls_enabled).length || 0,
    rlsTotal: rlsStatus?.length || 0,
    rlsCritical: rlsStatus?.filter(r => r.risk_level === 'CRITICAL').length || 0,
    webhooksProcessed: webhookEvents?.filter(w => w.status === 'processed').length || 0,
    webhooksFailed: webhookEvents?.filter(w => w.status === 'failed').length || 0,
    webhooksTotal: webhookEvents?.length || 0,
  };

  const rlsCoverage = stats.rlsTotal > 0 
    ? Math.round((stats.rlsEnabled / stats.rlsTotal) * 100) 
    : 0;

  // Refresh all
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchEvents(), refetchRLS(), refetchWebhooks()]);
    setIsRefreshing(false);
  };

  // Calcular score geral de segurança
  const calculateSecurityScore = (): number => {
    let score = 100;
    
    // Penalidades
    score -= stats.rlsCritical * 20; // -20 por tabela sem RLS
    score -= stats.unresolvedEvents * 2; // -2 por evento não resolvido
    score -= stats.highRiskEvents * 5; // -5 por evento high risk
    score -= stats.webhooksFailed * 3; // -3 por webhook failed
    
    // Bônus
    if (rlsCoverage === 100) score += 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const securityScore = calculateSecurityScore();

  const getScoreConfig = () => {
    if (securityScore >= 90) return { color: 'green', label: 'Excelente', icon: ShieldCheck };
    if (securityScore >= 70) return { color: 'yellow', label: 'Bom', icon: Shield };
    if (securityScore >= 50) return { color: 'orange', label: 'Atenção', icon: ShieldAlert };
    return { color: 'red', label: 'Crítico', icon: ShieldX };
  };

  const scoreConfig = getScoreConfig();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Dashboard de Segurança
          </h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real da segurança da plataforma
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
          Atualizar
        </Button>
      </div>

      {/* Score Principal */}
      <Card className={cn(
        'border-2',
        scoreConfig.color === 'green' && 'border-green-500/30',
        scoreConfig.color === 'yellow' && 'border-yellow-500/30',
        scoreConfig.color === 'orange' && 'border-orange-500/30',
        scoreConfig.color === 'red' && 'border-red-500/30'
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'p-4 rounded-xl',
                scoreConfig.color === 'green' && 'bg-green-500/20',
                scoreConfig.color === 'yellow' && 'bg-yellow-500/20',
                scoreConfig.color === 'orange' && 'bg-orange-500/20',
                scoreConfig.color === 'red' && 'bg-red-500/20'
              )}>
                <scoreConfig.icon className={cn(
                  'h-8 w-8',
                  scoreConfig.color === 'green' && 'text-green-500',
                  scoreConfig.color === 'yellow' && 'text-yellow-500',
                  scoreConfig.color === 'orange' && 'text-orange-500',
                  scoreConfig.color === 'red' && 'text-red-500'
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score de Segurança</p>
                <p className="text-4xl font-bold">{securityScore}%</p>
                <Badge className={cn(
                  scoreConfig.color === 'green' && 'bg-green-500/20 text-green-500',
                  scoreConfig.color === 'yellow' && 'bg-yellow-500/20 text-yellow-500',
                  scoreConfig.color === 'orange' && 'bg-orange-500/20 text-orange-500',
                  scoreConfig.color === 'red' && 'bg-red-500/20 text-red-500'
                )}>
                  {scoreConfig.label}
                </Badge>
              </div>
            </div>
            <div className="flex-1 max-w-md mx-8">
              <Progress 
                value={securityScore} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Crítico</span>
                <span>Excelente</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="Eventos Não Resolvidos"
          value={stats.unresolvedEvents}
          color={stats.unresolvedEvents > 5 ? 'red' : stats.unresolvedEvents > 0 ? 'yellow' : 'green'}
        />
        <StatCard
          icon={Database}
          label="Cobertura RLS"
          value={`${rlsCoverage}%`}
          color={rlsCoverage === 100 ? 'green' : rlsCoverage >= 80 ? 'yellow' : 'red'}
        />
        <StatCard
          icon={Webhook}
          label="Webhooks OK"
          value={`${stats.webhooksProcessed}/${stats.webhooksTotal}`}
          color={stats.webhooksFailed === 0 ? 'green' : 'yellow'}
        />
        <StatCard
          icon={ShieldAlert}
          label="Alto Risco"
          value={stats.highRiskEvents}
          color={stats.highRiskEvents > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events" className="gap-2">
            <Activity className="h-4 w-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="rls" className="gap-2">
            <Lock className="h-4 w-4" />
            RLS Status
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Tab: Eventos de Segurança */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Eventos de Segurança Recentes
              </CardTitle>
              <CardDescription>
                Últimos 50 eventos detectados pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {securityEvents?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>Nenhum evento de segurança registrado</p>
                    </div>
                  ) : (
                    securityEvents?.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'p-3 rounded-lg border flex items-center justify-between',
                          event.risk_score >= 70 && 'bg-red-500/10 border-red-500/30',
                          event.risk_score >= 40 && event.risk_score < 70 && 'bg-yellow-500/10 border-yellow-500/30',
                          event.risk_score < 40 && 'bg-muted/50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'p-2 rounded-lg',
                            event.risk_score >= 70 && 'bg-red-500/20',
                            event.risk_score >= 40 && event.risk_score < 70 && 'bg-yellow-500/20',
                            event.risk_score < 40 && 'bg-muted'
                          )}>
                            <AlertTriangle className={cn(
                              'h-4 w-4',
                              event.risk_score >= 70 && 'text-red-500',
                              event.risk_score >= 40 && event.risk_score < 70 && 'text-yellow-500',
                              event.risk_score < 40 && 'text-muted-foreground'
                            )} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{event.event_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {event.ip_address || 'IP desconhecido'} • {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Risk: {event.risk_score}</Badge>
                          {event.resolved ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: RLS Status */}
        <TabsContent value="rls">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Status de Row Level Security
              </CardTitle>
              <CardDescription>
                Auditoria de políticas RLS por tabela
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {rlsStatus?.map((table) => (
                    <motion.div
                      key={table.table_name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'p-3 rounded-lg border flex items-center justify-between',
                        table.risk_level === 'CRITICAL' && 'bg-red-500/10 border-red-500/30',
                        table.risk_level === 'HIGH' && 'bg-orange-500/10 border-orange-500/30',
                        table.risk_level === 'MEDIUM' && 'bg-yellow-500/10 border-yellow-500/30',
                        table.risk_level === 'LOW' && 'bg-green-500/10 border-green-500/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-mono text-sm">{table.table_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {table.policy_count} {table.policy_count === 1 ? 'política' : 'políticas'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {table.rls_enabled ? (
                          <Badge className="bg-green-500/20 text-green-500">RLS ON</Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-500">RLS OFF</Badge>
                        )}
                        <RiskBadge level={table.risk_level} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Webhooks */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks Recentes
              </CardTitle>
              <CardDescription>
                Histórico de webhooks processados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {webhookEvents?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Webhook className="h-12 w-12 mx-auto mb-2" />
                      <p>Nenhum webhook registrado</p>
                    </div>
                  ) : (
                    webhookEvents?.map((webhook) => (
                      <motion.div
                        key={webhook.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{webhook.provider}</p>
                            <p className="text-xs text-muted-foreground">
                              {webhook.event_type || webhook.event_id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(webhook.received_at), { addSuffix: true, locale: ptBR })}
                          </span>
                          <Badge className={cn(
                            webhook.status === 'processed' && 'bg-green-500/20 text-green-500',
                            webhook.status === 'failed' && 'bg-red-500/20 text-red-500',
                            webhook.status === 'received' && 'bg-yellow-500/20 text-yellow-500',
                            webhook.status === 'processing' && 'bg-blue-500/20 text-blue-500'
                          )}>
                            {webhook.status}
                          </Badge>
                          {webhook.signature_valid === true && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {webhook.signature_valid === false && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </motion.div>
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
}

export default SecurityDashboard;
