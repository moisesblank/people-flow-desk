// ============================================
// SYNAPSE v15.0 - Mobile Quick Stats ULTRA
// Cards compactos ULTRA otimizados para mobile
// ============================================

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { formatCurrencyCompact } from "@/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import { usePerformance } from "@/hooks/usePerformance";
import { cn } from "@/lib/utils";

interface MobileQuickStatsProps {
  income: number;
  expenses: number;
  profit: number;
  pendingTasks: number;
  pendingPayments: number;
  students: number;
}

// Usa formatação compacta centralizada
const formatCurrency = formatCurrencyCompact;

// Static stat card for low-end devices
const StaticStatCard = memo(function StaticStatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-card border border-border contain-layout">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-lg", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      <p className={cn("text-xl font-bold", color)}>{value}</p>
    </div>
  );
});

// Animated stat card for capable devices
const AnimatedStatCard = memo(function AnimatedStatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  index,
  animationDuration,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  index: number;
  animationDuration: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: Math.min(index * 0.05, 0.2),
        duration: animationDuration / 1000
      }}
      className="p-4 rounded-2xl bg-card border border-border gpu-accelerate contain-layout"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-lg", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      <p className={cn("text-xl font-bold", color)}>{value}</p>
    </motion.div>
  );
});

export const MobileQuickStats = memo(function MobileQuickStats({
  income,
  expenses,
  profit,
  pendingTasks,
  pendingPayments,
  students,
}: MobileQuickStatsProps) {
  const { shouldReduceMotion, isLowEndDevice, animationDuration } = usePerformance();
  const skipAnimations = shouldReduceMotion || isLowEndDevice;
  
  // Memoize stats calculation
  const stats = useMemo(() => [
    {
      label: "Receita",
      value: formatCurrency(income),
      icon: TrendingUp,
      color: "text-stats-green",
      bg: "bg-stats-green/10",
    },
    {
      label: "Despesas",
      value: formatCurrency(expenses),
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Lucro",
      value: formatCurrency(profit),
      icon: Wallet,
      color: profit >= 0 ? "text-stats-green" : "text-destructive",
      bg: profit >= 0 ? "bg-stats-green/10" : "bg-destructive/10",
    },
    {
      label: "Alunos",
      value: students.toString(),
      icon: Users,
      color: "text-stats-blue",
      bg: "bg-stats-blue/10",
    },
  ], [income, expenses, profit, students]);

  // Memoize alerts
  const alerts = useMemo(() => {
    const items = [];
    if (pendingTasks > 0) {
      items.push({
        label: "Tarefas Pendentes",
        value: pendingTasks,
        icon: CheckSquare,
      });
    }
    if (pendingPayments > 0) {
      items.push({
        label: "Pagamentos Pendentes",
        value: pendingPayments,
        icon: AlertCircle,
      });
    }
    return items;
  }, [pendingTasks, pendingPayments]);

  const CardComponent = skipAnimations ? StaticStatCard : AnimatedStatCard;

  return (
    <div className="space-y-4">
      {/* Main Stats Grid - CSS Grid for better mobile performance */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          skipAnimations ? (
            <StaticStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              bg={stat.bg}
            />
          ) : (
            <AnimatedStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              bg={stat.bg}
              index={index}
              animationDuration={animationDuration}
            />
          )
        ))}
      </div>

      {/* Alerts Banner - Static for performance */}
      {alerts.length > 0 && (
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl",
            "bg-amber-500/10 border border-amber-500/30",
            !skipAnimations && "mobile-fade-in"
          )}
        >
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1 flex items-center gap-4 text-sm">
            {alerts.map((alert) => (
              <span key={alert.label} className="text-amber-700 dark:text-amber-400">
                <strong>{alert.value}</strong> {alert.label.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
