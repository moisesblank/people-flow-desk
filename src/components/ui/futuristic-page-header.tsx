// ============================================
// FUTURISTIC PAGE HEADER 2090
// Header ultra-moderno para todas as páginas
// Visual cyberpunk com hologramas e neon
// ============================================

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StatItem {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FuturisticPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  stats?: StatItem[];
  action?: ReactNode;
  children?: ReactNode;
  accentColor?: "primary" | "green" | "blue" | "purple" | "orange" | "cyan" | "gold";
  showBackButton?: boolean;
  backPath?: string;
  className?: string;
}

// Cyber Particles
function CyberParticles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// Grid Effect
function HoloGrid({ color }: { color: string }) {
  return (
    <div 
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: `
          linear-gradient(${color} 1px, transparent 1px),
          linear-gradient(90deg, ${color} 1px, transparent 1px)
        `,
        backgroundSize: '30px 30px',
      }}
    />
  );
}

// Scan Line
function ScanLine({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px"
      style={{
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        boxShadow: `0 0 10px ${color}`,
      }}
      animate={{ top: ["-5%", "105%"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function FuturisticPageHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  stats,
  action,
  children,
  accentColor = "primary",
  showBackButton = false,
  backPath,
  className,
}: FuturisticPageHeaderProps) {
  const navigate = useNavigate();

  const colorConfig = {
    primary: {
      gradient: "from-primary/30 via-primary/10 to-transparent",
      border: "border-primary/30",
      glow: "hsl(var(--primary))",
      text: "text-primary",
      particle: "hsl(var(--primary))",
    },
    green: {
      gradient: "from-emerald-500/30 via-emerald-500/10 to-transparent",
      border: "border-emerald-500/30",
      glow: "rgb(16, 185, 129)",
      text: "text-emerald-400",
      particle: "rgb(16, 185, 129)",
    },
    blue: {
      gradient: "from-blue-500/30 via-blue-500/10 to-transparent",
      border: "border-blue-500/30",
      glow: "rgb(59, 130, 246)",
      text: "text-blue-400",
      particle: "rgb(59, 130, 246)",
    },
    purple: {
      gradient: "from-purple-500/30 via-purple-500/10 to-transparent",
      border: "border-purple-500/30",
      glow: "rgb(168, 85, 247)",
      text: "text-purple-400",
      particle: "rgb(168, 85, 247)",
    },
    orange: {
      gradient: "from-orange-500/30 via-orange-500/10 to-transparent",
      border: "border-orange-500/30",
      glow: "rgb(249, 115, 22)",
      text: "text-orange-400",
      particle: "rgb(249, 115, 22)",
    },
    cyan: {
      gradient: "from-cyan-500/30 via-cyan-500/10 to-transparent",
      border: "border-cyan-500/30",
      glow: "rgb(6, 182, 212)",
      text: "text-cyan-400",
      particle: "rgb(6, 182, 212)",
    },
    gold: {
      gradient: "from-amber-500/30 via-amber-500/10 to-transparent",
      border: "border-amber-500/30",
      glow: "rgb(245, 158, 11)",
      text: "text-amber-400",
      particle: "rgb(245, 158, 11)",
    },
  };

  const config = colorConfig[accentColor];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-xl mb-6",
        `bg-gradient-to-r ${config.gradient}`,
        config.border,
        className
      )}
    >
      {/* Background Effects */}
      <CyberParticles color={config.particle} />
      <HoloGrid color={config.particle} />
      <ScanLine color={config.particle} />

      {/* Glowing Orb */}
      <motion.div
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${config.glow}40 0%, transparent 70%)` }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="relative z-10 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            {showBackButton && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => backPath ? navigate(backPath) : navigate(-1)}
                className={cn(
                  "p-2 rounded-xl border backdrop-blur-xl transition-colors",
                  config.border,
                  "hover:bg-background/50"
                )}
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </motion.button>
            )}

            {/* Icon */}
            {Icon && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className={cn(
                  "p-3 rounded-xl border backdrop-blur-xl",
                  config.border,
                  "bg-background/30"
                )}
                style={{ boxShadow: `0 0 20px ${config.glow}30` }}
              >
                <Icon className={cn("h-6 w-6", config.text)} />
              </motion.div>
            )}

            {/* Title & Subtitle */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2"
              >
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {title}
                </h1>
                {badge && (
                  <span className={cn(
                    "px-2 py-0.5 text-xs font-bold rounded-md border",
                    config.border,
                    config.text,
                    "bg-background/30 backdrop-blur-xl"
                  )}>
                    {badge}
                  </span>
                )}
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className={cn("h-5 w-5", config.text)} />
                </motion.span>
              </motion.div>
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-muted-foreground mt-1"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          </div>

          {/* Stats */}
          {stats && stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 flex-wrap"
            >
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-2">
                  {stat.icon && <stat.icon className={cn("h-4 w-4", config.text)} />}
                  <div className="text-center">
                    <div className={cn("text-lg font-bold font-mono", config.text)}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Actions */}
          {(action || children) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 flex-wrap"
            >
              {action}
              {children}
            </motion.div>
          )}
        </div>

        {/* Decorative Lines */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${config.glow}, transparent)`,
          }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* Corner Accents */}
      <div className={cn("absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg", config.border)} />
      <div className={cn("absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg", config.border)} />
      <div className={cn("absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg", config.border)} />
      <div className={cn("absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 rounded-br-lg", config.border)} />
    </motion.header>
  );
}
