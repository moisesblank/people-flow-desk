import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./AnimatedCounter";

interface StatCardProps {
  title: string;
  value: number | null;
  formatFn?: (value: number) => string;
  icon: LucideIcon;
  variant: "red" | "green" | "blue" | "purple";
  delay?: number;
  hiddenText?: string; // Texto a mostrar quando value é null
}

const variantStyles = {
  red: {
    card: "stat-red border-stats-red/20 hover:border-stats-red/40 glow-red",
    icon: "text-stats-red bg-stats-red/10",
    indicator: "bg-stats-red",
  },
  green: {
    card: "stat-green border-stats-green/20 hover:border-stats-green/40 glow-green",
    icon: "text-stats-green bg-stats-green/10",
    indicator: "bg-stats-green",
  },
  blue: {
    card: "stat-blue border-stats-blue/20 hover:border-stats-blue/40 glow-blue",
    icon: "text-stats-blue bg-stats-blue/10",
    indicator: "bg-stats-blue",
  },
  purple: {
    card: "stat-purple border-stats-purple/20 hover:border-stats-purple/40 glow-purple",
    icon: "text-stats-purple bg-stats-purple/10",
    indicator: "bg-stats-purple",
  },
};

export function StatCard({ 
  title, 
  value, 
  formatFn = (v) => v.toString(),
  icon: Icon, 
  variant,
  delay = 0,
  hiddenText = "••••••"
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        "stat-card glass-card border cursor-default group",
        styles.card
      )}
    >
      {/* Subtle indicator line */}
      <div className={cn("absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-60", styles.indicator)} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </p>
          <p className={cn(
            "text-4xl font-bold tracking-tight",
            value === null ? "text-muted-foreground" : "text-foreground"
          )}>
            {value === null ? hiddenText : <AnimatedCounter value={value} formatFn={formatFn} />}
          </p>
        </div>
        <motion.div 
          className={cn("rounded-2xl p-4 transition-all duration-300", styles.icon)}
          whileHover={{ rotate: 5, scale: 1.1 }}
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </motion.div>
      </div>

      {/* Decorative gradient orb */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-5 blur-2xl transition-opacity duration-500 group-hover:opacity-10"
        style={{
          background: `radial-gradient(circle, hsl(var(--stats-${variant})) 0%, transparent 70%)`
        }}
      />
    </motion.div>
  );
}
