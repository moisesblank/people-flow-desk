// ============================================
// FUTURISTIC CARD 2090
// Card ultra-moderno com efeitos cyberpunk
// Para uso em toda a plataforma
// ============================================

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FuturisticCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  href?: string;
  accentColor?: "primary" | "green" | "blue" | "purple" | "orange" | "cyan" | "gold";
  variant?: "default" | "glass" | "solid" | "gradient";
  size?: "sm" | "md" | "lg";
  className?: string;
  glowEffect?: boolean;
  animateHover?: boolean;
}

export function FuturisticCard({
  title,
  subtitle,
  icon,
  children,
  onClick,
  href,
  accentColor = "primary",
  variant = "default",
  size = "md",
  className,
  glowEffect = true,
  animateHover = true,
}: FuturisticCardProps) {
  const navigate = useNavigate();

  const colorConfig = {
    primary: {
      border: "border-primary/20 hover:border-primary/50",
      glow: "group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]",
      bg: "from-primary/10 to-primary/5",
      icon: "text-primary bg-primary/20",
      accent: "bg-primary",
    },
    green: {
      border: "border-emerald-500/20 hover:border-emerald-500/50",
      glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]",
      bg: "from-emerald-500/10 to-emerald-500/5",
      icon: "text-emerald-400 bg-emerald-500/20",
      accent: "bg-emerald-500",
    },
    blue: {
      border: "border-blue-500/20 hover:border-blue-500/50",
      glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]",
      bg: "from-blue-500/10 to-blue-500/5",
      icon: "text-blue-400 bg-blue-500/20",
      accent: "bg-blue-500",
    },
    purple: {
      border: "border-purple-500/20 hover:border-purple-500/50",
      glow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]",
      bg: "from-purple-500/10 to-purple-500/5",
      icon: "text-purple-400 bg-purple-500/20",
      accent: "bg-purple-500",
    },
    orange: {
      border: "border-orange-500/20 hover:border-orange-500/50",
      glow: "group-hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]",
      bg: "from-orange-500/10 to-orange-500/5",
      icon: "text-orange-400 bg-orange-500/20",
      accent: "bg-orange-500",
    },
    cyan: {
      border: "border-cyan-500/20 hover:border-cyan-500/50",
      glow: "group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]",
      bg: "from-cyan-500/10 to-cyan-500/5",
      icon: "text-cyan-400 bg-cyan-500/20",
      accent: "bg-cyan-500",
    },
    gold: {
      border: "border-amber-500/20 hover:border-amber-500/50",
      glow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]",
      bg: "from-amber-500/10 to-amber-500/5",
      icon: "text-amber-400 bg-amber-500/20",
      accent: "bg-amber-500",
    },
  };

  const sizeConfig = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const variantConfig = {
    default: "bg-card/50 backdrop-blur-xl",
    glass: "bg-background/30 backdrop-blur-2xl",
    solid: "bg-card",
    gradient: `bg-gradient-to-br ${colorConfig[accentColor].bg}`,
  };

  const config = colorConfig[accentColor];
  const isClickable = onClick || href;

  const handleClick = () => {
    if (href) navigate(href);
    if (onClick) onClick();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={animateHover ? { scale: 1.02, y: -2 } : undefined}
      onClick={isClickable ? handleClick : undefined}
      className={cn(
        "group relative rounded-xl border transition-all duration-300",
        variantConfig[variant],
        config.border,
        glowEffect && config.glow,
        sizeConfig[size],
        isClickable && "cursor-pointer",
        className
      )}
    >
      {/* Corner Accents */}
      <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-current opacity-30 rounded-tl" />
      <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-current opacity-30 rounded-tr" />
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-current opacity-30 rounded-bl" />
      <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-current opacity-30 rounded-br" />

      {/* Header */}
      {(title || icon) && (
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {icon && (
              <motion.div
                className={cn("p-2 rounded-lg", config.icon)}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                {icon}
              </motion.div>
            )}
            <div>
              {title && (
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {isClickable && (
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          )}
        </div>
      )}

      {/* Content */}
      {children}

      {/* Bottom Accent Line */}
      <motion.div
        className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full", config.accent)}
        initial={{ width: "0%" }}
        whileHover={{ width: "80%" }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

// Stat Card Variant
interface FuturisticStatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  accentColor?: "primary" | "green" | "blue" | "purple" | "orange" | "cyan" | "gold";
  onClick?: () => void;
  href?: string;
}

export function FuturisticStatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  accentColor = "primary",
  onClick,
  href,
}: FuturisticStatCardProps) {
  const navigate = useNavigate();
  
  const colorConfig = {
    primary: "text-primary",
    green: "text-emerald-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
    cyan: "text-cyan-400",
    gold: "text-amber-400",
  };

  const handleClick = () => {
    if (href) navigate(href);
    if (onClick) onClick();
  };

  return (
    <FuturisticCard
      accentColor={accentColor}
      onClick={onClick || href ? handleClick : undefined}
      className="min-w-[140px]"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn("p-2 rounded-lg bg-background/50", colorConfig[accentColor])}>
            {icon}
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className={cn("text-xl font-bold font-mono", colorConfig[accentColor])}>{value}</p>
          {trend && trendValue && (
            <p className={cn(
              "text-xs",
              trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-muted-foreground"
            )}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </p>
          )}
        </div>
      </div>
    </FuturisticCard>
  );
}
