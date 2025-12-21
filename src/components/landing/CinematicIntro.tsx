// ============================================
// ABERTURA CINEMATOGRÁFICA MARVEL/DISNEY SUPREME
// Experiência imersiva de alto impacto
// ============================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoMoises from "@/assets/logo-moises-medeiros.png";

interface CinematicIntroProps {
  onComplete: () => void;
}

// Partículas épicas com física realista
const EpicParticles = ({ phase }: { phase: number }) => {
  const particles = Array.from({ length: 150 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 5 + 1,
    delay: Math.random() * 3,
    color: i % 5 === 0 ? '#dc2626' : i % 5 === 1 ? '#1e40af' : i % 5 === 2 ? '#fbbf24' : i % 5 === 3 ? '#7c3aed' : '#10b981'
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: phase >= 1 ? [0, 0.9, 0] : 0,
            scale: phase >= 1 ? [0, 2, 0] : 0,
            y: phase >= 1 ? [0, -300] : 0,
            x: phase >= 1 ? [0, (Math.random() - 0.5) * 100] : 0,
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

// DNA Helix animado (tema química)
const DNAHelix = ({ phase }: { phase: number }) => {
  const segments = 20;
  
  return (
    <motion.div 
      className="absolute left-1/2 -translate-x-1/2 h-full w-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase >= 2 ? 0.3 : 0 }}
      transition={{ duration: 1 }}
    >
      {[...Array(segments)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 w-4 h-4 rounded-full"
          style={{
            top: `${(i / segments) * 100}%`,
            background: i % 2 === 0 ? '#dc2626' : '#1e40af',
            boxShadow: `0 0 20px ${i % 2 === 0 ? '#dc2626' : '#1e40af'}`,
          }}
          animate={{
            x: [
              Math.sin((i / segments) * Math.PI * 2) * 60,
              Math.sin((i / segments) * Math.PI * 2 + Math.PI) * 60,
            ],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
};

// Anéis orbitais estilo Marvel
const OrbitalRings = ({ phase }: { phase: number }) => {
  const rings = [
    { size: 700, duration: 20, color: 'rgba(220, 38, 38, 0.4)', delay: 0 },
    { size: 600, duration: 18, color: 'rgba(30, 64, 175, 0.4)', delay: 0.2 },
    { size: 500, duration: 15, color: 'rgba(251, 191, 36, 0.5)', delay: 0.4 },
    { size: 400, duration: 12, color: 'rgba(124, 58, 237, 0.4)', delay: 0.6 },
  ];

  return (
    <>
      {rings.map((ring, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{
            width: ring.size,
            height: ring.size,
            borderColor: ring.color,
            boxShadow: `0 0 30px ${ring.color}, inset 0 0 30px ${ring.color}`,
          }}
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{
            scale: phase >= 2 ? 1 : 0,
            rotate: phase >= 2 ? (i % 2 === 0 ? 360 : -360) : 0,
            opacity: phase >= 2 ? 0.7 : 0,
          }}
          transition={{
            scale: { duration: 1.5, delay: ring.delay },
            rotate: { duration: ring.duration, repeat: Infinity, ease: "linear" },
            opacity: { duration: 1, delay: ring.delay },
          }}
        />
      ))}
    </>
  );
};

// Raios de luz convergentes
const LightRays = ({ phase }: { phase: number }) => {
  const rays = 12;
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(rays)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 origin-center"
          style={{
            width: '2px',
            height: '800px',
            background: `linear-gradient(to top, transparent, ${i % 2 === 0 ? 'rgba(220, 38, 38, 0.5)' : 'rgba(251, 191, 36, 0.5)'}, transparent)`,
            transform: `rotate(${(i / rays) * 360}deg) translateY(-50%)`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{
            opacity: phase >= 3 ? [0, 0.8, 0] : 0,
            scaleY: phase >= 3 ? [0, 1, 0] : 0,
          }}
          transition={{
            duration: 2,
            delay: i * 0.1,
            repeat: phase >= 3 && phase < 5 ? Infinity : 0,
            repeatDelay: 2,
          }}
        />
      ))}
    </div>
  );
};

export const CinematicIntro = ({ onComplete }: CinematicIntroProps) => {
  const [phase, setPhase] = useState(0);
  const [skipVisible, setSkipVisible] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    const skipTimer = setTimeout(() => setSkipVisible(true), 800);
    
    // Timeline épica da animação
    const timers = [
      setTimeout(() => setPhase(1), 300),     // Partículas surgem
      setTimeout(() => setPhase(2), 1500),    // Anéis orbitais
      setTimeout(() => setPhase(3), 3000),    // Logo surge + raios
      setTimeout(() => setPhase(4), 4500),    // Logo brilha intensamente
      setTimeout(() => setPhase(5), 6000),    // Tagline aparece
      setTimeout(() => setPhase(6), 7500),    // Flash final épico
      setTimeout(() => onComplete(), 8500),   // Fim da intro
    ];

    return () => {
      clearTimeout(skipTimer);
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase >= 6 ? 0 : 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background gradient animado */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(20, 0, 30, 1) 0%, rgba(0, 0, 0, 1) 100%)',
        }}
        animate={{
          background: phase >= 3 
            ? 'radial-gradient(ellipse at center, rgba(50, 0, 30, 1) 0%, rgba(0, 0, 0, 1) 100%)'
            : 'radial-gradient(ellipse at center, rgba(20, 0, 30, 1) 0%, rgba(0, 0, 0, 1) 100%)',
        }}
        transition={{ duration: 2 }}
      />

      {/* Nebulosa de fundo */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(220, 38, 38, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(30, 64, 175, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.2) 0%, transparent 40%)
          `,
        }}
        animate={{
          scale: phase >= 2 ? [1, 1.2, 1] : 1,
          opacity: phase >= 2 ? [0.3, 0.5, 0.3] : 0.3,
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <EpicParticles phase={phase} />
      <DNAHelix phase={phase} />
      <OrbitalRings phase={phase} />
      <LightRays phase={phase} />

      {/* Container central do logo */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.5, opacity: 0, y: 100 }}
        animate={{
          scale: phase >= 3 ? 1 : 0.5,
          opacity: phase >= 3 ? 1 : 0,
          y: phase >= 3 ? 0 : 100,
        }}
        transition={{
          duration: 1.5,
          type: "spring",
          stiffness: 80,
          damping: 15,
        }}
      >
        {/* Glow épico atrás do logo */}
        <motion.div
          className="absolute -inset-32 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.6) 0%, rgba(220, 38, 38, 0.2) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
          animate={{
            scale: phase >= 4 ? [1, 1.5, 1] : 1,
            opacity: phase >= 4 ? [0.6, 1, 0.6] : 0.6,
          }}
          transition={{ duration: 1.5, repeat: phase >= 4 && phase < 6 ? Infinity : 0 }}
        />

        {/* Ring de energia ao redor do logo */}
        <motion.div
          className="absolute -inset-16 rounded-full border-2 border-red-500/50"
          style={{
            boxShadow: '0 0 40px rgba(220, 38, 38, 0.5), inset 0 0 40px rgba(220, 38, 38, 0.3)',
          }}
          animate={{
            rotate: [0, 360],
            scale: phase >= 4 ? [1, 1.1, 1] : 1,
          }}
          transition={{
            rotate: { duration: 10, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity },
          }}
        />

        {/* Logo principal */}
        <motion.img
          src={logoMoises}
          alt="Moisés Medeiros"
          className="w-72 md:w-96 lg:w-[450px] relative z-10"
          animate={{
            filter: phase >= 4 ? [
              'brightness(1) drop-shadow(0 0 30px rgba(220, 38, 38, 0.5))',
              'brightness(1.5) drop-shadow(0 0 80px rgba(220, 38, 38, 1)) drop-shadow(0 0 120px rgba(251, 191, 36, 0.5))',
              'brightness(1) drop-shadow(0 0 30px rgba(220, 38, 38, 0.5))',
            ] : 'brightness(1) drop-shadow(0 0 20px rgba(220, 38, 38, 0.3))',
          }}
          transition={{
            duration: 1.5,
            repeat: phase >= 4 && phase < 6 ? Infinity : 0,
          }}
        />

        {/* Tagline épica */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ 
            opacity: phase >= 5 ? 1 : 0, 
            y: phase >= 5 ? 0 : 30,
          }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="relative inline-block"
            animate={{
              textShadow: phase >= 5 ? [
                '0 0 20px rgba(220, 38, 38, 0.5)',
                '0 0 40px rgba(220, 38, 38, 0.8)',
                '0 0 20px rgba(220, 38, 38, 0.5)',
              ] : 'none',
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <p 
              className="text-3xl md:text-4xl lg:text-5xl font-black tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 30%, #fbbf24 70%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              O FUTURO DA QUÍMICA
            </p>
          </motion.div>
          
          <motion.p
            className="text-lg md:text-xl text-gray-400 mt-4 tracking-[0.3em] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 5 ? 1 : 0 }}
            transition={{ delay: 0.4 }}
          >
            Sua aprovação começa aqui
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Flash final épico */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 6 ? [0, 1, 0] : 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* Linhas de velocidade no flash */}
      {phase >= 6 && (
        <motion.div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent"
              style={{
                width: '100%',
                top: `${(i / 30) * 100}%`,
                transform: `rotate(${Math.random() * 10 - 5}deg)`,
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: [0, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.4, delay: Math.random() * 0.2 }}
            />
          ))}
        </motion.div>
      )}

      {/* Botão pular */}
      <AnimatePresence>
        {skipVisible && phase < 6 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={onComplete}
            className="absolute bottom-8 right-8 px-6 py-3 text-sm text-gray-400 hover:text-white border border-gray-700/50 hover:border-red-500/50 rounded-full transition-all bg-black/50 backdrop-blur-xl hover:bg-black/80 flex items-center gap-2 group"
          >
            <span>Pular Intro</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Indicador de progresso */}
      <motion.div
        className="absolute bottom-8 left-8 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: skipVisible ? 1 : 0 }}
      >
        {[1, 2, 3, 4, 5, 6].map((p) => (
          <motion.div
            key={p}
            className="w-2 h-2 rounded-full"
            style={{
              background: phase >= p ? '#dc2626' : 'rgba(255,255,255,0.2)',
              boxShadow: phase >= p ? '0 0 10px #dc2626' : 'none',
            }}
            animate={{
              scale: phase === p ? [1, 1.3, 1] : 1,
            }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};
