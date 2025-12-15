// ============================================
// MOISES MEDEIROS v5.0 - KPI CARD
// Pilar 4: Dashboard BI + Pilar 12: Analytics
// ============================================

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  variant?: "red" | "green" | "blue" | "purple" | "gold";
  loading?: boolean;
  onClick?: () => void;
}

const variantStyles = {
  red: {
    bg: "stat-red",
    iconBg: "bg-stats-red/10",
    iconColor: "text-stats-red",
    trendPositive: "text-stats-green",
    trendNegative: "text-stats-red",
  },
  green: {
    bg: "stat-green",
    iconBg: "bg-stats-green/10",
    iconColor: "text-stats-green",
    trendPositive: "text-stats-green",
    trendNegative: "text-stats-red",
  },
  blue: {
    bg: "stat-blue",
    iconBg: "bg-stats-blue/10",
    iconColor: "text-stats-blue",
    trendPositive: "text-stats-green",
    trendNegative: "text-stats-red",
  },
  purple: {
    bg: "stat-purple",
    iconBg: "bg-stats-purple/10",
    iconColor: "text-stats-purple",
    trendPositive: "text-stats-green",
    trendNegative: "text-stats-red",
  },
  gold: {
    bg: "stat-gold",
    iconBg: "bg-stats-gold/10",
    iconColor: "text-stats-gold",
    trendPositive: "text-stats-green",
    trendNegative: "text-stats-red",
  },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "blue",
  loading = false,
  onClick,
}: KPICardProps) {
  const styles = variantStyles[variant];

  const TrendIcon = trend 
    ? trend.value > 0 
      ? TrendingUp 
      : trend.value < 0 
        ? TrendingDown 
        : Minus
    : null;

  const trendColor = trend
    ? trend.isPositive !== undefined
      ? trend.isPositive 
        ? styles.trendPositive 
        : styles.trendNegative
      : trend.value >= 0 
        ? styles.trendPositive 
        : styles.trendNegative
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      className={cn(
        "stat-card glass-card p-6",
        styles.bg,
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-xl", styles.iconBg)}>
          <Icon className={cn("h-6 w-6", styles.iconColor)} />
        </div>
        
        {trend && TrendIcon && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
            trendColor,
            trend.value >= 0 ? "bg-stats-green/10" : "bg-stats-red/10"
          )}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-3/4 bg-muted/50 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-muted/30 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <h3 className="text-3xl font-bold text-foreground tabular-nums">
            {value}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {title}
          </p>
          
          {/* Subtitle/Trend Label */}
          {(subtitle || trend?.label) && (
            <p className="text-xs text-muted-foreground mt-2">
              {subtitle || trend?.label}
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}

// Componente para grid de KPIs
interface KPIGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function KPIGrid({ children, columns = 4 }: KPIGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {children}
    </div>
  );
}
