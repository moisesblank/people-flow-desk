// ============================================
// PLANILHA VIVA - STAT CARD REATIVO
// GPU-ONLY animations via useQuantumReactivity
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/employees/AnimatedCounter";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";

interface ReactiveStatCardProps {
  title: string;
  value: number;
  formatFn?: (value: number) => string;
  icon: LucideIcon;
  variant?: "red" | "green" | "blue" | "purple" | "gold";
  delay?: number;
  href?: string;
  onClick?: () => void;
  isLive?: boolean;
  change?: number;
}

const variantStyles = {
  red: {
    card: "from-destructive/10 to-transparent border-destructive/20",
    icon: "bg-destructive/20 text-destructive",
    indicator: "bg-destructive"
  },
  green: {
    card: "from-[hsl(var(--stats-green))]/10 to-transparent border-[hsl(var(--stats-green))]/20",
    icon: "bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))]",
    indicator: "bg-[hsl(var(--stats-green))]"
  },
  blue: {
    card: "from-[hsl(var(--stats-blue))]/10 to-transparent border-[hsl(var(--stats-blue))]/20",
    icon: "bg-[hsl(var(--stats-blue))]/20 text-[hsl(var(--stats-blue))]",
    indicator: "bg-[hsl(var(--stats-blue))]"
  },
  purple: {
    card: "from-[hsl(var(--stats-purple))]/10 to-transparent border-[hsl(var(--stats-purple))]/20",
    icon: "bg-[hsl(var(--stats-purple))]/20 text-[hsl(var(--stats-purple))]",
    indicator: "bg-[hsl(var(--stats-purple))]"
  },
  gold: {
    card: "from-[hsl(var(--stats-gold))]/10 to-transparent border-[hsl(var(--stats-gold))]/20",
    icon: "bg-[hsl(var(--stats-gold))]/20 text-[hsl(var(--stats-gold))]",
    indicator: "bg-[hsl(var(--stats-gold))]"
  }
};

export function ReactiveStatCard({
  title,
  value,
  formatFn,
  icon: Icon,
  variant = "blue",
  delay = 0,
  href,
  onClick,
  isLive = true,
  change
}: ReactiveStatCardProps) {
  const navigate = useNavigate();
  const styles = variantStyles[variant];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  const { gpuAnimationProps, shouldAnimate } = useQuantumReactivity();

  return (
    <motion.div
      {...gpuAnimationProps.fadeUp}
      transition={{ ...(gpuAnimationProps.fadeUp.transition ?? {}), delay: delay * 0.1 }}
      className={cn(
        "relative p-4 rounded-xl bg-gradient-to-br border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg will-change-transform transform-gpu",
        styles.card
      )}
      onClick={handleClick}
      whileHover={shouldAnimate ? { y: -2 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
    >
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-2 right-2">
          <span className="relative flex h-2 w-2">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", styles.indicator)}></span>
            <span className={cn("relative inline-flex rounded-full h-2 w-2", styles.indicator)}></span>
          </span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={value}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-2xl font-bold"
            >
              {formatFn ? (
                formatFn(value)
              ) : (
                <AnimatedCounter value={value} />
              )}
            </motion.div>
          </AnimatePresence>
          
          {change !== undefined && change !== 0 && (
            <p className={cn(
              "text-xs font-medium mt-1",
              change > 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"
            )}>
              {change > 0 ? "+" : ""}{change}% vs mês anterior
            </p>
          )}
        </div>

        <div className={cn("p-2 rounded-lg", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 rounded-xl bg-foreground/5 opacity-0 hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}
