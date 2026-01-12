// ============================================
// CYBER BACKGROUND 2090
// Fundos animados futurísticos
// Para uso em toda a plataforma
// 🏛️ CONSTITUIÇÃO: Performance otimizada para 3G
// ============================================

import { motion } from "framer-motion";
import { useMemo, memo } from "react";
import { cn } from "@/lib/utils";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";

// Full Page Cyber Background
export const CyberBackground = memo(function CyberBackground({ 
  variant = "default",
  intensity = "medium",
  className 
}: { 
  variant?: "default" | "matrix" | "grid" | "particles" | "waves";
  intensity?: "low" | "medium" | "high";
  className?: string;
}) {
  const { shouldShowParticles, isLowEnd, shouldAnimate } = useConstitutionPerformance();
  
  const intensityConfig = {
    low: 0.3,
    medium: 0.5,
    high: 0.8,
  };

  const opacity = intensityConfig[intensity];
  
  // 🏛️ LEI I: Não renderiza backgrounds pesados em conexões lentas
  if (isLowEnd) {
    return (
      <div 
        className={cn("fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-background to-background/80", className)} 
        style={{ opacity: opacity * 0.5 }}
      />
    );
  }

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-0 perf-ambient-only", className)} style={{ opacity }}>
      {variant === "default" && <DefaultBackground shouldAnimate={shouldAnimate} />}
      {variant === "matrix" && shouldShowParticles && <MatrixBackground />}
      {variant === "grid" && <GridBackground shouldAnimate={shouldAnimate} />}
      {variant === "particles" && shouldShowParticles && <ParticlesBackground />}
      {variant === "waves" && shouldAnimate && <WavesBackground />}
    </div>
  );
});

// Default Cyber Background - otimizado
const DefaultBackground = memo(function DefaultBackground({ shouldAnimate }: { shouldAnimate: boolean }) {
  return (
    <>
      {/* Grid - sempre renderiza (leve) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Glowing Orbs - apenas se animações habilitadas */}
      {shouldAnimate ? (
        <>
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl perf-ambient-only"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl perf-ambient-only"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)' }}
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </>
      ) : (
        // Versão estática para modo economia
        <>
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)' }}
          />
        </>
      )}
    </>
  );
});

// Matrix Rain Background - otimizado
const MatrixBackground = memo(function MatrixBackground() {
  const { getParticleCount, shouldAnimate } = useConstitutionPerformance();
  
  // 🏛️ LEI I: Reduz colunas baseado no tier
  const columnCount = getParticleCount(20);
  
  const columns = useMemo(() => 
    [...Array(columnCount)].map((_, i) => ({
      id: i,
      x: i * (100 / columnCount),
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
    })), [columnCount]
  );

  if (!shouldAnimate || columnCount === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden perf-ambient-only">
      {columns.map((col) => (
        <motion.div
          key={col.id}
          className="absolute top-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent"
          style={{ left: `${col.x}%`, height: '30%' }}
          animate={{ y: ["-30%", "130%"] }}
          transition={{
            duration: col.duration,
            repeat: Infinity,
            ease: "linear",
            delay: col.delay,
          }}
        />
      ))}
    </div>
  );
});

// Animated Grid Background - otimizado
const GridBackground = memo(function GridBackground({ shouldAnimate }: { shouldAnimate: boolean }) {
  return (
    <div className="absolute inset-0">
      {/* Perspective Grid - sempre (leve) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'center 200%',
        }}
      />
      
      {/* Horizontal Scan Line - apenas se animações */}
      {shouldAnimate && (
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent perf-ambient-only"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
});

// Floating Particles Background - otimizado
const ParticlesBackground = memo(function ParticlesBackground() {
  const { getParticleCount, shouldAnimate } = useConstitutionPerformance();
  
  // 🏛️ LEI I: Reduz partículas baseado no tier
  const particleCount = getParticleCount(50);
  
  const particles = useMemo(() => 
    [...Array(particleCount)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 3,
    })), [particleCount]
  );

  if (!shouldAnimate || particleCount === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden perf-ambient-only">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            boxShadow: `0 0 ${p.size * 2}px hsl(var(--primary) / 0.5)`,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
});

// Wave Animation Background - otimizado
const WavesBackground = memo(function WavesBackground() {
  const { shouldAnimate } = useConstitutionPerformance();
  
  if (!shouldAnimate) return null;
  
  return (
    <div className="absolute inset-0 overflow-hidden perf-ambient-only">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[200%] h-[200%] rounded-[40%]"
          style={{
            left: '-50%',
            top: '-50%',
            border: `1px solid hsl(var(--primary) / ${0.1 - i * 0.02})`,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
});

// Section Divider with Cyber Effect - otimizado
export const CyberDivider = memo(function CyberDivider({ className }: { className?: string }) {
  const { shouldAnimate } = useConstitutionPerformance();
  
  return (
    <div className={cn("relative h-px my-6", className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent" />
      {shouldAnimate ? (
        <>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </>
      ) : (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary opacity-50" />
      )}
    </div>
  );
});

// Glowing Border Effect - otimizado
export const GlowingBorder = memo(function GlowingBorder({ 
  children, 
  color = "primary",
  className 
}: { 
  children: React.ReactNode;
  color?: "primary" | "green" | "blue" | "purple";
  className?: string;
}) {
  const { shouldAnimate, shouldShowShadows } = useConstitutionPerformance();
  
  const colorConfig = {
    primary: "hsl(var(--primary))",
    green: "rgb(16, 185, 129)",
    blue: "rgb(59, 130, 246)",
    purple: "rgb(168, 85, 247)",
  };

  if (!shouldAnimate || !shouldShowShadows) {
    return (
      <div className={cn("relative rounded-xl border border-border/50", className)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn("relative rounded-xl", className)}
      animate={{
        boxShadow: [
          `0 0 5px ${colorConfig[color]}40`,
          `0 0 20px ${colorConfig[color]}60`,
          `0 0 5px ${colorConfig[color]}40`,
        ],
      }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      {children}
    </motion.div>
  );
});
