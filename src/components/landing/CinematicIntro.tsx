// ============================================
// ABERTURA CINEMATOGRÁFICA 2500 - ULTRA LITE
// Performance extrema para mobile/3G
// ============================================

import { useState, useEffect, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { usePerformance } from "@/hooks/usePerformance";
import logoMoises from "@/assets/logo-moises-medeiros.png";

interface CinematicIntroProps {
  onComplete: () => void;
}

// Background estático - SEM ANIMAÇÃO
const StaticBackground = memo(() => (
  <div className="absolute inset-0">
    <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
    <div
      className="absolute inset-0 opacity-20"
      style={{
        background: "radial-gradient(ellipse at 50% 50%, rgba(220, 38, 38, 0.4) 0%, transparent 60%)",
      }}
    />
  </div>
));

StaticBackground.displayName = "StaticBackground";

// Anéis simples - apenas 3, sem animação pesada
const SimpleRings = memo(({ show }: { show: boolean }) => {
  if (!show) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[120, 180, 240].map((size, i) => (
        <div
          key={size}
          className="absolute rounded-full animate-pulse"
          style={{
            width: size,
            height: size,
            border: `2px solid ${["rgba(220,38,38,0.5)", "rgba(251,191,36,0.4)", "rgba(30,64,175,0.3)"][i]}`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
});

SimpleRings.displayName = "SimpleRings";

export const CinematicIntro = memo(({ onComplete }: CinematicIntroProps) => {
  // 🏛️ PREMIUM GARANTIDO: Apenas reduced motion do SO é respeitado
  const { disableAnimations } = usePerformance();
  const [phase, setPhase] = useState(0);

  // 🏛️ PREMIUM GARANTIDO + SAFETY TIMEOUT
  useEffect(() => {
    // 🛡️ SAFETY: Garante que a intro SEMPRE complete em no máximo 5s
    const safetyTimer = setTimeout(() => {
      console.log('[INTRO] Safety timeout - forcing complete');
      onComplete();
    }, 5000);

    // 🏛️ PREMIUM GARANTIDO: Só respeita prefers-reduced-motion do sistema operacional
    if (disableAnimations) {
      const timer = setTimeout(onComplete, 500);
      return () => {
        clearTimeout(timer);
        clearTimeout(safetyTimer);
      };
    }

    // Timeline premium - experiência completa para todos
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2800),
      setTimeout(onComplete, 3500),
    ];

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(safetyTimer);
    };
  }, [onComplete, disableAnimations]);

  // 🏛️ PREMIUM GARANTIDO: Experiência premium para TODOS (incluindo mobile)
  // Apenas reduced motion do SO pula a animação
  if (disableAnimations) {
    return (
      <motion.div
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase >= 3 ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <StaticBackground />
        
        {/* Logo simples */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 text-center"
        >
          <img
            src={logoMoises}
            alt="Prof. Moisés Medeiros"
            width={128}
            height={128}
            className="w-32 h-32 mx-auto object-contain"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500"
          >
            MOISÉS MEDEIROS
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase >= 4 ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <StaticBackground />
      <SimpleRings show={phase >= 1} />
      
      {/* Conteúdo central */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: phase >= 2 ? 1 : 0, 
            scale: phase >= 2 ? 1 : 0.5 
          }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          <div className="relative inline-block">
            <motion.div
              className="absolute -inset-4 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(220,38,38,0.4) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
              animate={phase >= 2 ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* 🚀 OTIMIZAÇÃO: Dimensões explícitas para evitar CLS */}
            {/* Imagem original 1920x800, mas exibida em 192x192 - usar srcset seria ideal */}
            <img
              src={logoMoises}
              alt="Prof. Moisés Medeiros"
              width={192}
              height={192}
              className="relative w-40 h-40 md:w-48 md:h-48 object-contain"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
        </motion.div>
        
        {/* Texto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: phase >= 3 ? 1 : 0, 
            y: phase >= 3 ? 0 : 20 
          }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <h1 
            className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 to-red-500"
            style={{ textShadow: "0 0 40px rgba(220,38,38,0.5)" }}
          >
            MOISÉS MEDEIROS
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mt-2 font-medium">
            O Professor que Mais Aprova em Medicina
          </p>
        </motion.div>
      </div>
      
      {/* Skip button */}
      <motion.button
        onClick={onComplete}
        className="absolute bottom-8 right-8 px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        whileHover={{ opacity: 1 }}
      >
        Pular →
      </motion.button>
    </motion.div>
  );
});

CinematicIntro.displayName = "CinematicIntro";
