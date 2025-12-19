// ============================================
// PLANILHA VIVA v2.0 - KPIs REATIVOS
// KPIs com valores calculados em tempo real
// ============================================

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Percent,
  Users,
  ShoppingCart,
  Heart,
  RefreshCw,
  DollarSign,
  UserMinus,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLiveKPIs, useLiveCounters, useLiveSheet } from "@/contexts/LiveSheetContext";
import { LiveValue, LiveStatus } from "./LiveValue";
import { cn } from "@/lib/utils";

interface LiveKPICardProps {
  className?: string;
  compact?: boolean;
}

export const LiveKPICard = memo(function LiveKPICard({ className, compact = false }: LiveKPICardProps) {
  const kpis = useLiveKPIs();
  const counters = useLiveCounters();
  const { isReactive, latency } = useLiveSheet();

  const kpiItems = [
    {
      id: 'nps_calculado',
      label: 'NPS Score',
      icon: Heart,
      value: kpis.nps,
      color: kpis.nps > 50 ? 'green' : kpis.nps > 0 ? 'gold' : 'red',
      suffix: '',
      max: 100,
    },
    {
      id: 'taxa_retencao',
      label: 'Retenção',
      icon: Users,
      value: kpis.taxaRetencao,
      color: kpis.taxaRetencao > 80 ? 'green' : kpis.taxaRetencao > 50 ? 'gold' : 'red',
      suffix: '%',
      max: 100,
    },
    {
      id: 'taxa_churn',
      label: 'Churn',
      icon: UserMinus,
      value: kpis.taxaChurn,
      color: kpis.taxaChurn < 5 ? 'green' : kpis.taxaChurn < 15 ? 'gold' : 'red',
      suffix: '%',
      max: 30,
      invertColor: true,
    },
    {
      id: 'roi_marketing',
      label: 'ROI Marketing',
      icon: TrendingUp,
      value: kpis.roiMarketing,
      color: kpis.roiMarketing > 200 ? 'green' : kpis.roiMarketing > 100 ? 'gold' : 'red',
      suffix: '%',
      max: 500,
    },
  ];

  const colorClasses: Record<string, { text: string; bg: string; border: string }> = {
    green: {
      text: "text-[hsl(var(--stats-green))]",
      bg: "bg-[hsl(var(--stats-green))]/10",
      border: "border-[hsl(var(--stats-green))]/20",
    },
    gold: {
      text: "text-[hsl(var(--stats-gold))]",
      bg: "bg-[hsl(var(--stats-gold))]/10",
      border: "border-[hsl(var(--stats-gold))]/20",
    },
    red: {
      text: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    },
    blue: {
      text: "text-[hsl(var(--stats-blue))]",
      bg: "bg-[hsl(var(--stats-blue))]/10",
      border: "border-[hsl(var(--stats-blue))]/20",
    },
  };

  if (compact) {
    return (
      <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3", className)}>
        {kpiItems.map((kpi) => {
          const colors = colorClasses[kpi.color];
          const Icon = kpi.icon;
          
          return (
            <motion.div
              key={kpi.id}
              className={cn("p-3 rounded-lg border", colors.bg, colors.border)}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn("h-4 w-4", colors.text)} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <LiveValue 
                dataKey={kpi.id} 
                format="number" 
                size="lg" 
                color={kpi.color as any}
                suffix={kpi.suffix}
              />
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            KPIs em Tempo Real
          </CardTitle>
          <LiveStatus />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          {kpiItems.map((kpi, index) => {
            const colors = colorClasses[kpi.color];
            const Icon = kpi.icon;
            const progress = Math.min((kpi.value / kpi.max) * 100, 100);

            return (
              <motion.div
                key={kpi.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn("p-3 rounded-lg border", colors.bg, colors.border)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", colors.text)} />
                    <span className="text-xs font-medium">{kpi.label}</span>
                  </div>
                  <LiveValue 
                    dataKey={kpi.id} 
                    format="number" 
                    size="sm" 
                    color={kpi.color as any}
                    suffix={kpi.suffix}
                    showTooltip
                  />
                </div>
                <Progress value={progress} className="h-1.5" />
              </motion.div>
            );
          })}
        </div>

        {/* LTV e CAC */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="p-3 rounded-lg bg-[hsl(var(--stats-purple))]/10 border border-[hsl(var(--stats-purple))]/20">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-[hsl(var(--stats-purple))]" />
              <span className="text-xs text-muted-foreground">LTV</span>
            </div>
            <LiveValue dataKey="ltv" format="currency" size="lg" color="purple" />
          </div>
          
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">CAC</span>
            </div>
            <LiveValue dataKey="cac" format="currency" size="lg" color="default" />
          </div>
        </div>

        {/* Performance */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span>Tempo de computação: {latency.toFixed(2)}ms</span>
          <span>Última atualização: {kpis.lastUpdate.toLocaleTimeString('pt-BR')}</span>
        </div>
      </CardContent>
    </Card>
  );
});

// ===== GAUGES REATIVOS =====
interface LiveGaugeProps {
  dataKey: string;
  max?: number;
  label: string;
  className?: string;
}

export const LiveGauge = memo(function LiveGauge({ 
  dataKey, 
  max = 100, 
  label,
  className 
}: LiveGaugeProps) {
  const { getValue, getFormatted } = useLiveSheet();
  const value = getValue(dataKey);
  const formatted = getFormatted(dataKey);
  
  const percent = Math.min((value / max) * 100, 100);
  const color = percent > 70 ? 'green' : percent > 40 ? 'gold' : 'red';
  
  const colorClasses: Record<string, string> = {
    green: "stroke-[hsl(var(--stats-green))]",
    gold: "stroke-[hsl(var(--stats-gold))]",
    red: "stroke-destructive",
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="8"
            className="stroke-muted"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={colorClasses[color]}
            initial={{ strokeDasharray: "0 251.2" }}
            animate={{ strokeDasharray: `${percent * 2.512} 251.2` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <LiveValue 
            dataKey={dataKey} 
            format="number" 
            size="lg" 
            color={color as any}
            showTooltip={false}
          />
        </div>
      </div>
      <span className="text-sm text-muted-foreground mt-2">{label}</span>
    </div>
  );
});
