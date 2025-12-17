// ============================================
// HOLOGRAPHIC DATA CARD v1.0 - YEAR 2090
// Card de dados com efeito holográfico 3D
// Visual ultra-futurístico com animações
// ============================================

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HolographicDataCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: "primary" | "green" | "blue" | "purple" | "gold" | "cyan";
  href?: string;
  onClick?: () => void;
  className?: string;
  glowIntensity?: "low" | "medium" | "high";
  showHologram?: boolean;
}

// 3D Tilt Effect Hook
function use3DTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(x, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);
    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { ref, rotateX, rotateY, handleMouseMove, handleMouseLeave };
}

// Holographic Grid Pattern
function HolographicGrid({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-30">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${color} 1px, transparent 1px),
            linear-gradient(90deg, ${color} 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, transparent 0%, ${color} 100%)` }}
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </div>
  );
}

// Scanning Line Effect
function ScanEffect() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      animate={{ top: ["-5%", "105%"] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      style={{ filter: "blur(1px)" }}
    />
  );
}

// Data Particles
function DataParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/60"
          style={{
            left: `${10 + (i * 12)}%`,
            bottom: "10%",
          }}
          animate={{
            y: [0, -80, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export function HolographicDataCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "primary",
  href,
  onClick,
  className,
  glowIntensity = "medium",
  showHologram = true,
}: HolographicDataCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const { ref, rotateX, rotateY, handleMouseMove, handleMouseLeave } = use3DTilt();

  const colorConfig = {
    primary: {
      gradient: "from-primary/30 via-primary/10 to-transparent",
      border: "border-primary/30 hover:border-primary/60",
      glow: "group-hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)]",
      text: "text-primary",
      bg: "bg-primary/20",
      gridColor: "hsl(var(--primary) / 0.1)",
    },
    green: {
      gradient: "from-emerald-500/30 via-emerald-500/10 to-transparent",
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      glow: "group-hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]",
      text: "text-emerald-400",
      bg: "bg-emerald-500/20",
      gridColor: "rgba(16,185,129,0.1)",
    },
    blue: {
      gradient: "from-blue-500/30 via-blue-500/10 to-transparent",
      border: "border-blue-500/30 hover:border-blue-500/60",
      glow: "group-hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]",
      text: "text-blue-400",
      bg: "bg-blue-500/20",
      gridColor: "rgba(59,130,246,0.1)",
    },
    purple: {
      gradient: "from-purple-500/30 via-purple-500/10 to-transparent",
      border: "border-purple-500/30 hover:border-purple-500/60",
      glow: "group-hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]",
      text: "text-purple-400",
      bg: "bg-purple-500/20",
      gridColor: "rgba(168,85,247,0.1)",
    },
    gold: {
      gradient: "from-amber-500/30 via-amber-500/10 to-transparent",
      border: "border-amber-500/30 hover:border-amber-500/60",
      glow: "group-hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]",
      text: "text-amber-400",
      bg: "bg-amber-500/20",
      gridColor: "rgba(245,158,11,0.1)",
    },
    cyan: {
      gradient: "from-cyan-500/30 via-cyan-500/10 to-transparent",
      border: "border-cyan-500/30 hover:border-cyan-500/60",
      glow: "group-hover:shadow-[0_0_40px_rgba(6,182,212,0.4)]",
      text: "text-cyan-400",
      bg: "bg-cyan-500/20",
      gridColor: "rgba(6,182,212,0.1)",
    },
  };

  const config = colorConfig[color];
  const isClickable = href || onClick;

  const handleClick = () => {
    if (href) navigate(href);
    if (onClick) onClick();
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        handleMouseLeave();
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onClick={isClickable ? handleClick : undefined}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border backdrop-blur-xl bg-card/60 p-6 transition-all duration-500",
        config.border,
        config.glow,
        isClickable && "cursor-pointer",
        className
      )}
    >
      {/* Holographic Background */}
      {showHologram && <HolographicGrid color={config.gridColor} />}
      
      {/* Gradient Overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", config.gradient)} />
      
      {/* Scan Effect */}
      {isHovered && <ScanEffect />}
      
      {/* Data Particles */}
      {isHovered && <DataParticles />}

      {/* Corner Accents */}
      <div className={cn("absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg", config.text, "opacity-40")} />
      <div className={cn("absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg", config.text, "opacity-40")} />
      <div className={cn("absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg", config.text, "opacity-40")} />
      <div className={cn("absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 rounded-br-lg", config.text, "opacity-40")} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <motion.div
            className={cn("p-3 rounded-xl", config.bg)}
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
          
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1"
            >
              <Sparkles className={cn("h-4 w-4", config.text)} />
              <ChevronRight className={cn("h-4 w-4", config.text)} />
            </motion.div>
          )}
        </div>

        {/* Value */}
        <motion.div
          className="mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.span
            className={cn("text-3xl font-bold font-mono", config.text)}
            style={{ textShadow: isHovered ? `0 0 20px ${config.gridColor}` : "none" }}
          >
            {value}
          </motion.span>
        </motion.div>

        {/* Title & Subtitle */}
        <h4 className="font-medium text-foreground group-hover:text-white transition-colors">{title}</h4>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}

        {/* Trend */}
        {trend && (
          <motion.div
            className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trend.value >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            )}>
              {trend.value >= 0 ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </motion.div>
        )}
      </div>

      {/* Bottom Glow Line */}
      <motion.div
        className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full", config.bg)}
        initial={{ width: "0%" }}
        animate={{ width: isHovered ? "80%" : "30%" }}
        transition={{ duration: 0.3 }}
        style={{ filter: `blur(1px)` }}
      />
    </motion.div>
  );
}
