// ============================================
// MOISÉS MEDEIROS v8.0 - QUICK STATS WIDGET
// Widget de Estatísticas Rápidas
// ============================================

import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickStat {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ElementType;
  color?: "green" | "red" | "blue" | "purple" | "gold";
}

interface QuickStatsWidgetProps {
  stats: QuickStat[];
  columns?: 2 | 3 | 4;
}

export function QuickStatsWidget({ stats, columns = 4 }: QuickStatsWidgetProps) {
  const getColorClasses = (color?: string) => {
    switch (color) {
      case "green": return {
        bg: "bg-[hsl(var(--stats-green))]/10",
        text: "text-[hsl(var(--stats-green))]",
        border: "border-[hsl(var(--stats-green))]/20"
      };
      case "red": return {
        bg: "bg-primary/10",
        text: "text-primary",
        border: "border-primary/20"
      };
      case "blue": return {
        bg: "bg-[hsl(var(--stats-blue))]/10",
        text: "text-[hsl(var(--stats-blue))]",
        border: "border-[hsl(var(--stats-blue))]/20"
      };
      case "purple": return {
        bg: "bg-[hsl(var(--stats-purple))]/10",
        text: "text-[hsl(var(--stats-purple))]",
        border: "border-[hsl(var(--stats-purple))]/20"
      };
      case "gold": return {
        bg: "bg-[hsl(var(--stats-gold))]/10",
        text: "text-[hsl(var(--stats-gold))]",
        border: "border-[hsl(var(--stats-gold))]/20"
      };
      default: return {
        bg: "bg-muted",
        text: "text-foreground",
        border: "border-border"
      };
    }
  };

  const gridClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4"
  };

  return (
    <div className={cn("grid gap-4", gridClass[columns])}>
      {stats.map((stat, index) => {
        const colors = getColorClasses(stat.color);
        const Icon = stat.icon;
        
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cn("border", colors.border, "hover:shadow-lg transition-all")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  {Icon && (
                    <div className={cn("p-1.5 rounded-lg", colors.bg)}>
                      <Icon className={cn("h-3.5 w-3.5", colors.text)} />
                    </div>
                  )}
                </div>
                <p className={cn("text-2xl font-bold", colors.text)}>{stat.value}</p>
                {stat.change !== undefined && (
                  <div className={cn(
                    "flex items-center gap-1 mt-1 text-xs",
                    stat.change > 0 ? "text-[hsl(var(--stats-green))]" : 
                    stat.change < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {stat.change > 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : stat.change < 0 ? (
                      <ArrowDownRight className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    <span>{Math.abs(stat.change).toFixed(1)}%</span>
                    {stat.changeLabel && (
                      <span className="text-muted-foreground">{stat.changeLabel}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
