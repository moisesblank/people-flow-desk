// ============================================
// MARKETING KPIs REALTIME
// Cards de métricas em tempo real
// ============================================

import { motion } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Target,
  Percent,
  Activity,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { useMarketingAutomations, useMarketingKPIs } from '@/hooks/useMarketingAutomations';
import { Button } from '@/components/ui/button';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  color: 'pink' | 'green' | 'blue' | 'purple' | 'amber';
  progress?: number;
}

function KPICard({ title, value, subtitle, icon: Icon, trend, color, progress }: KPICardProps) {
  const colorClasses = {
    pink: 'from-pink-500/10 to-purple-500/10 border-pink-500/20',
    green: 'from-emerald-500/10 to-green-500/10 border-emerald-500/20',
    blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    purple: 'from-purple-500/10 to-violet-500/10 border-purple-500/20',
    amber: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20'
  };

  const iconColors = {
    pink: 'text-pink-500',
    green: 'text-emerald-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    amber: 'text-amber-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`bg-gradient-to-br ${colorClasses[color]} border overflow-hidden`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Icon className={`h-5 w-5 ${iconColors[color]}`} />
            {trend !== undefined && (
              <Badge 
                variant="secondary" 
                className={`text-[10px] ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}
              >
                {trend >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {Math.abs(trend).toFixed(1)}%
              </Badge>
            )}
          </div>
          
          <motion.p 
            className={`text-2xl font-bold ${iconColors[color]}`}
            key={value}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
          >
            {value}
          </motion.p>
          
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            {title}
          </p>
          
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
          
          {progress !== undefined && (
            <Progress value={progress} className="h-1 mt-3" />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function MarketingKPIsRealtime() {
  const { 
    metrics, 
    leads, 
    isLoading, 
    lastUpdate, 
    syncExternalData 
  } = useMarketingAutomations();
  
  const kpis = useMarketingKPIs();

  const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">
            Atualizado {lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={syncExternalData}
          className="text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Sync APIs
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="CAC"
          value={formatCurrency(kpis.cac)}
          subtitle="Custo por Aquisição"
          icon={Wallet}
          color={kpis.cac > 500 ? 'amber' : 'green'}
          trend={kpis.cac > 0 ? -5.2 : 0}
        />
        
        <KPICard
          title="LTV"
          value={formatCurrency(kpis.ltv)}
          subtitle="Lifetime Value"
          icon={DollarSign}
          color="purple"
          trend={8.3}
        />
        
        <KPICard
          title="ROAS"
          value={`${kpis.roas.toFixed(2)}x`}
          subtitle="Retorno sobre Ads"
          icon={TrendingUp}
          color={kpis.roas >= 3 ? 'green' : 'amber'}
        />
        
        <KPICard
          title="ROI"
          value={`${kpis.roi.toFixed(1)}%`}
          subtitle="Retorno Investimento"
          icon={Percent}
          color={kpis.roi >= 100 ? 'green' : 'pink'}
          trend={kpis.roi > 0 ? 12.5 : 0}
        />
        
        <KPICard
          title="Conversão"
          value={`${kpis.taxaConversao.toFixed(1)}%`}
          subtitle={`${metrics?.conversoes || 0} convertidos`}
          icon={Target}
          color="blue"
          progress={kpis.taxaConversao}
        />
        
        <KPICard
          title="LTV/CAC"
          value={`${kpis.ltvCacRatio.toFixed(1)}x`}
          subtitle={kpis.ltvCacRatio >= 3 ? 'Saudável' : 'Melhorar'}
          icon={Activity}
          color={kpis.ltvCacRatio >= 3 ? 'green' : 'amber'}
        />
      </div>

      {/* Leads Summary */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{metrics?.leadsHoje || 0}</p>
              <p className="text-xs text-muted-foreground">Hoje</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics?.leadsSemana || 0}</p>
              <p className="text-xs text-muted-foreground">Esta Semana</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics?.leadsMes || 0}</p>
              <p className="text-xs text-muted-foreground">Este Mês</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-500">{leads.length}</p>
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
