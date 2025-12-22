// ============================================
// 🛡️ FORTALEZA SUPREME v3.0 - DASHBOARD
// Dashboard de Segurança em Tempo Real
// ============================================

import { memo } from 'react';
import { Shield, AlertTriangle, Users, Activity, Lock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSecurityDashboard } from '@/hooks/useFortalezaSupreme';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

const MetricCard = memo(function MetricCard({ 
  title, 
  value, 
  icon, 
  variant = 'default' 
}: MetricCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
    danger: 'bg-red-500/10 border-red-500/30',
    success: 'bg-green-500/10 border-green-500/30',
  };

  const valueStyles = {
    default: 'text-foreground',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
    success: 'text-green-500',
  };

  return (
    <Card className={`${variantStyles[variant]} transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${valueStyles[variant]}`}>
              {value.toLocaleString()}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-background/50">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
MetricCard.displayName = 'MetricCard';

interface SecurityDashboardProps {
  refreshInterval?: number;
  compact?: boolean;
}

export const SecurityDashboard = memo(function SecurityDashboard({ 
  refreshInterval = 30000,
  compact = false 
}: SecurityDashboardProps) {
  const { dashboard, isLoading, error, refresh } = useSecurityDashboard(refreshInterval);

  if (isLoading && !dashboard) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500">{error}</p>
          <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!dashboard) return null;

  const threatVariant = dashboard.active_threats > 0 
    ? dashboard.active_threats > 5 ? 'danger' : 'warning' 
    : 'success';

  const criticalVariant = dashboard.critical_24h > 0 ? 'danger' : 'success';

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-3 bg-card rounded-lg border border-border">
        <Shield className="h-5 w-5 text-primary" />
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {dashboard.users_online} online
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className={`h-4 w-4 ${dashboard.active_threats > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
            {dashboard.active_threats} ameaças
          </span>
          <span className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            {dashboard.events_1h} eventos/h
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh} className="ml-auto">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Fortaleza Supreme v3.0</h3>
          <Badge variant="outline" className="text-xs">
            {new Date(dashboard.timestamp).toLocaleTimeString()}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Usuários Online"
          value={dashboard.users_online}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          variant="default"
        />
        <MetricCard
          title="Ameaças Ativas"
          value={dashboard.active_threats}
          icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
          variant={threatVariant}
        />
        <MetricCard
          title="Bloqueados"
          value={dashboard.blocked_users}
          icon={<Lock className="h-5 w-5 text-red-500" />}
          variant={dashboard.blocked_users > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Rate Limited"
          value={dashboard.rate_limited}
          icon={<Activity className="h-5 w-5 text-orange-500" />}
          variant={dashboard.rate_limited > 10 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Eventos 1h"
          value={dashboard.events_1h}
          icon={<Activity className="h-5 w-5 text-primary" />}
          variant="default"
        />
        <MetricCard
          title="Críticos 24h"
          value={dashboard.critical_24h}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          variant={criticalVariant}
        />
      </div>
    </div>
  );
});

SecurityDashboard.displayName = 'SecurityDashboard';

export default SecurityDashboard;
