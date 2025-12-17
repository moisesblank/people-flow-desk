// ============================================
// CYBER STAT CARD - Cards Futuristas 2050
// Com efeitos de glow, hover e animações
// ============================================

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CyberStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  href?: string;
  color?: "primary" | "green" | "blue" | "gold" | "purple";
  delay?: number;
  subtitle?: string;
}

export function CyberStatCard({
  title,
  value,
  icon: Icon,
  trend,
  href,
  color = "primary",
  delay = 0,
  subtitle,
}: CyberStatCardProps) {
  const navigate = useNavigate();

  const colorConfig = {
    primary: {
      border: "border-primary/30 hover:border-primary/60",
      glow: "rgba(139, 0, 0, 0.4)",
      bg: "from-primary/10 to-primary/5",
      icon: "text-primary bg-primary/20",
      accent: "bg-primary",
    },
    green: {
      border: "border-green-500/30 hover:border-green-500/60",
      glow: "rgba(34, 197, 94, 0.4)",
      bg: "from-green-500/10 to-green-500/5",
      icon: "text-green-500 bg-green-500/20",
      accent: "bg-green-500",
    },
    blue: {
      border: "border-blue-500/30 hover:border-blue-500/60",
      glow: "rgba(59, 130, 246, 0.4)",
      bg: "from-blue-500/10 to-blue-500/5",
      icon: "text-blue-500 bg-blue-500/20",
      accent: "bg-blue-500",
    },
    gold: {
      border: "border-yellow-500/30 hover:border-yellow-500/60",
      glow: "rgba(234, 179, 8, 0.4)",
      bg: "from-yellow-500/10 to-yellow-500/5",
      icon: "text-yellow-500 bg-yellow-500/20",
      accent: "bg-yellow-500",
    },
    purple: {
      border: "border-purple-500/30 hover:border-purple-500/60",
      glow: "rgba(168, 85, 247, 0.4)",
      bg: "from-purple-500/10 to-purple-500/5",
      icon: "text-purple-500 bg-purple-500/20",
      accent: "bg-purple-500",
    },
  };

  const config = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      whileHover={{ 
        scale: 1.03,
        y: -5,
      }}
      onClick={() => href && navigate(href)}
      className={`
        relative group cursor-pointer overflow-hidden
        rounded-2xl border ${config.border}
        bg-gradient-to-br ${config.bg}
        backdrop-blur-xl
        transition-all duration-300
      `}
      style={{
        boxShadow: `0 0 0 0 ${config.glow}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 30px 5px ${config.glow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 0 ${config.glow}`;
      }}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, white 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* Scanning Effect */}
      <motion.div
        className={`absolute inset-0 ${config.accent} opacity-0 group-hover:opacity-10`}
        initial={false}
        animate={{
          background: [
            `linear-gradient(0deg, transparent 0%, ${config.glow} 50%, transparent 100%)`,
          ],
          y: ["-100%", "100%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "loop",
        }}
        style={{
          opacity: 0,
        }}
      />

      {/* Corner Accents */}
      <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 ${config.border.split(' ')[0]} rounded-tl-xl`} />
      <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 ${config.border.split(' ')[0]} rounded-tr-xl`} />
      <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 ${config.border.split(' ')[0]} rounded-bl-xl`} />
      <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 ${config.border.split(' ')[0]} rounded-br-xl`} />

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <motion.div 
            className={`p-3 rounded-xl ${config.icon}`}
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="h-6 w-6" />
          </motion.div>
          
          {trend && (
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${trend.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
            `}>
              <motion.span
                animate={{ y: trend.isPositive ? [0, -2, 0] : [0, 2, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {trend.isPositive ? '↑' : '↓'}
              </motion.span>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        {/* Value */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.1 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-foreground font-mono tracking-tight">
            {value}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
          )}
        </motion.div>

        {/* Bottom Accent Line */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 ${config.accent} rounded-b-2xl`}
          initial={{ width: "0%" }}
          whileHover={{ width: "100%" }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Hover Arrow */}
      {href && (
        <motion.div
          className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity"
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}