// ============================================
// ABERTURA CINEMATOGRÁFICA 2500 - ULTRA PREMIUM
// Estilo Marvel/Disney Épico Absoluto
// ============================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoMoises from "@/assets/logo-moises-medeiros.png";

interface CinematicIntroProps {
  onComplete: () => void;
}

// Holographic Grid - Grid holográfico futurista
const HolographicGrid = ({ phase }: { phase: number }) => (
  <motion.div
    className="absolute inset-0 overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: phase >= 1 ? 0.15 : 0 }}
    transition={{ duration: 2 }}
  >
    <div 
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(220, 38, 38, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30, 64, 175, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px',
        transform: 'perspective(500px) rotateX(60deg)',
        transformOrigin: 'center top',
      }}
    />
    <motion.div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(to top, transparent, rgba(220, 38, 38, 0.1))',
      }}
      animate={{ y: ['-100%', '100%'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    />
  </motion.div>
);

// Partículas quânticas - muito mais densas e épicas
const QuantumParticles = ({ phase }: { phase: number }) => {
  const particles = Array.from({ length: 300 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 1,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 4,
    color: i % 6 === 0 ? '#dc2626' : 
           i % 6 === 1 ? '#1e40af' : 
           i % 6 === 2 ? '#fbbf24' : 
           i % 6 === 3 ? '#7c3aed' : 
           i % 6 === 4 ? '#10b981' :
           '#ec4899'
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
            background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
            boxShadow: `0 0 ${p.size * 6}px ${p.color}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: phase >= 1 ? [0, 1, 0] : 0,
            scale: phase >= 1 ? [0, 2.5, 0] : 0,
            y: phase >= 1 ? [0, -400 - Math.random() * 200] : 0,
            x: phase >= 1 ? [0, (Math.random() - 0.5) * 150] : 0,
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

// Molécula de DNA animada (tema química) - mais complexa
const MolecularHelix = ({ phase }: { phase: number }) => {
  const segments = 30;
  
  return (
    <motion.div 
      className="absolute left-1/2 -translate-x-1/2 h-full w-48"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase >= 2 ? 0.4 : 0 }}
      transition={{ duration: 1.5 }}
    >
      {[...Array(segments)].map((_, i) => (
        <motion.div key={i} className="absolute left-1/2">
          {/* Átomo principal */}
          <motion.div
            className="absolute w-5 h-5 rounded-full"
            style={{
              background: i % 2 === 0 ? 'radial-gradient(circle, #dc2626 0%, transparent 70%)' : 'radial-gradient(circle, #1e40af 0%, transparent 70%)',
              boxShadow: `0 0 25px ${i % 2 === 0 ? '#dc2626' : '#1e40af'}`,
              top: `${(i / segments) * 100}%`,
            }}
            animate={{
              x: [
                Math.sin((i / segments) * Math.PI * 4) * 80,
                Math.sin((i / segments) * Math.PI * 4 + Math.PI) * 80,
              ],
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.05,
            }}
          />
          {/* Conexão entre átomos */}
          {i < segments - 1 && (
            <motion.div
              className="absolute h-px w-16"
              style={{
                background: `linear-gradient(90deg, ${i % 2 === 0 ? '#dc2626' : '#1e40af'}, ${i % 2 === 1 ? '#dc2626' : '#1e40af'})`,
                top: `${((i + 0.5) / segments) * 100}%`,
              }}
              animate={{
                x: [0, Math.sin((i / segments) * Math.PI * 4) * 40],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Anéis orbitais estilo Marvel com trilhas de luz
const EpicOrbitalRings = ({ phase }: { phase: number }) => {
  const rings = [
    { size: 900, duration: 25, color: 'rgba(220, 38, 38, 0.6)', delay: 0, thickness: 3 },
    { size: 750, duration: 20, color: 'rgba(30, 64, 175, 0.5)', delay: 0.15, thickness: 2 },
    { size: 600, duration: 18, color: 'rgba(251, 191, 36, 0.6)', delay: 0.3, thickness: 3 },
    { size: 450, duration: 14, color: 'rgba(124, 58, 237, 0.5)', delay: 0.45, thickness: 2 },
    { size: 300, duration: 10, color: 'rgba(236, 72, 153, 0.5)', delay: 0.6, thickness: 2 },
  ];

  return (
    <>
      {rings.map((ring, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: ring.size,
            height: ring.size,
            border: `${ring.thickness}px solid ${ring.color}`,
            boxShadow: `
              0 0 40px ${ring.color}, 
              inset 0 0 40px ${ring.color},
              0 0 80px ${ring.color}
            `,
          }}
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{
            scale: phase >= 2 ? 1 : 0,
            rotate: phase >= 2 ? (i % 2 === 0 ? 360 : -360) : 0,
            opacity: phase >= 2 ? 0.8 : 0,
          }}
          transition={{
            scale: { duration: 2, delay: ring.delay, type: "spring", stiffness: 50 },
            rotate: { duration: ring.duration, repeat: Infinity, ease: "linear" },
            opacity: { duration: 1.5, delay: ring.delay },
          }}
        />
      ))}
      
      {/* Partículas orbitando */}
      {phase >= 2 && rings.map((ring, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full"
          style={{
            background: ring.color.replace('0.5', '1').replace('0.6', '1'),
            boxShadow: `0 0 30px ${ring.color}, 0 0 60px ${ring.color}`,
          }}
          animate={{
            x: [
              Math.cos(0) * (ring.size / 2),
              Math.cos(Math.PI) * (ring.size / 2),
              Math.cos(Math.PI * 2) * (ring.size / 2),
            ],
            y: [
              Math.sin(0) * (ring.size / 2),
              Math.sin(Math.PI) * (ring.size / 2),
              Math.sin(Math.PI * 2) * (ring.size / 2),
            ],
          }}
          transition={{
            duration: ring.duration / 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </>
  );
};

// Raios de luz convergentes épicos
const ConvergingLightRays = ({ phase }: { phase: number }) => {
  const rays = 24;
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(rays)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 origin-center"
          style={{
            width: '3px',
            height: '1200px',
            background: `linear-gradient(to top, 
              transparent, 
              ${i % 3 === 0 ? 'rgba(220, 38, 38, 0.7)' : i % 3 === 1 ? 'rgba(251, 191, 36, 0.6)' : 'rgba(30, 64, 175, 0.5)'}, 
              transparent
            )`,
            transform: `rotate(${(i / rays) * 360}deg) translateY(-50%)`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{
            opacity: phase >= 3 ? [0, 0.9, 0] : 0,
            scaleY: phase >= 3 ? [0, 1.2, 0] : 0,
          }}
          transition={{
            duration: 2.5,
            delay: i * 0.08,
            repeat: phase >= 3 && phase < 6 ? Infinity : 0,
            repeatDelay: 1.5,
          }}
        />
      ))}
    </div>
  );
};

// Nebulosa dinâmica
const DynamicNebula = ({ phase }: { phase: number }) => (
  <motion.div
    className="absolute inset-0"
    animate={{
      background: phase >= 2 ? [
        `radial-gradient(ellipse at 20% 30%, rgba(220, 38, 38, 0.4) 0%, transparent 50%),
         radial-gradient(ellipse at 80% 70%, rgba(30, 64, 175, 0.4) 0%, transparent 50%),
         radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.3) 0%, transparent 40%)`,
        `radial-gradient(ellipse at 30% 40%, rgba(30, 64, 175, 0.4) 0%, transparent 50%),
         radial-gradient(ellipse at 70% 60%, rgba(220, 38, 38, 0.4) 0%, transparent 50%),
         radial-gradient(ellipse at 50% 50%, rgba(124, 58, 237, 0.3) 0%, transparent 40%)`,
        `radial-gradient(ellipse at 20% 30%, rgba(220, 38, 38, 0.4) 0%, transparent 50%),
         radial-gradient(ellipse at 80% 70%, rgba(30, 64, 175, 0.4) 0%, transparent 50%),
         radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.3) 0%, transparent 40%)`,
      ] : 'none',
    }}
    transition={{ duration: 8, repeat: Infinity }}
  />
);

// Texto glitch futurista
const GlitchText = ({ text, phase, className }: { text: string; phase: number; className?: string }) => (
  <motion.div
    className={`relative ${className}`}
    animate={{
      textShadow: phase >= 5 ? [
        '0 0 20px rgba(220, 38, 38, 0.5), 2px 2px 0 #1e40af, -2px -2px 0 #dc2626',
        '0 0 40px rgba(220, 38, 38, 0.8), -2px -2px 0 #1e40af, 2px 2px 0 #dc2626',
        '0 0 20px rgba(220, 38, 38, 0.5), 2px 2px 0 #1e40af, -2px -2px 0 #dc2626',
      ] : 'none',
    }}
    transition={{ duration: 0.1, repeat: Infinity, repeatType: 'mirror' }}
  >
    <span 
      className="block"
      style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 25%, #fbbf24 50%, #f59e0b 75%, #dc2626 100%)',
        backgroundSize: '200% 200%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'gradient 3s ease infinite',
      }}
    >
      {text}
    </span>
  </motion.div>
);

export const CinematicIntro = ({ onComplete }: CinematicIntroProps) => {
  const [phase, setPhase] = useState(0);
  const [skipVisible, setSkipVisible] = useState(false);

  useEffect(() => {
    const skipTimer = setTimeout(() => setSkipVisible(true), 500);
    
    // Timeline épica da animação - mais rápida e impactante
    const timers = [
      setTimeout(() => setPhase(1), 200),     // Partículas + grid
      setTimeout(() => setPhase(2), 1200),    // Anéis + DNA
      setTimeout(() => setPhase(3), 2400),    // Logo surge + raios
      setTimeout(() => setPhase(4), 3600),    // Logo brilha intensamente
      setTimeout(() => setPhase(5), 4800),    // Tagline aparece
      setTimeout(() => setPhase(6), 6000),    // Flash final épico
      setTimeout(() => onComplete(), 6800),   // Fim da intro
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
      transition={{ duration: 0.6 }}
    >
      {/* Background base com gradiente animado */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse at center, rgba(15, 0, 25, 1) 0%, rgba(0, 0, 0, 1) 100%)',
            'radial-gradient(ellipse at center, rgba(30, 0, 20, 1) 0%, rgba(0, 0, 0, 1) 100%)',
            'radial-gradient(ellipse at center, rgba(15, 0, 25, 1) 0%, rgba(0, 0, 0, 1) 100%)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <HolographicGrid phase={phase} />
      <DynamicNebula phase={phase} />
      <QuantumParticles phase={phase} />
      <MolecularHelix phase={phase} />
      <EpicOrbitalRings phase={phase} />
      <ConvergingLightRays phase={phase} />

      {/* Container central do logo */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.3, opacity: 0, y: 150, rotateX: 45 }}
        animate={{
          scale: phase >= 3 ? 1 : 0.3,
          opacity: phase >= 3 ? 1 : 0,
          y: phase >= 3 ? 0 : 150,
          rotateX: phase >= 3 ? 0 : 45,
        }}
        transition={{
          duration: 1.8,
          type: "spring",
          stiffness: 60,
          damping: 12,
        }}
      >
        {/* Múltiplas camadas de glow atrás do logo */}
        <motion.div
          className="absolute -inset-40 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.7) 0%, rgba(220, 38, 38, 0.3) 30%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            scale: phase >= 4 ? [1, 1.6, 1] : 1,
            opacity: phase >= 4 ? [0.7, 1, 0.7] : 0.7,
          }}
          transition={{ duration: 1.8, repeat: phase >= 4 && phase < 6 ? Infinity : 0 }}
        />
        
        <motion.div
          className="absolute -inset-32 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.5) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
          animate={{
            scale: phase >= 4 ? [1.2, 1, 1.2] : 1.2,
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Hexágono de energia */}
        <motion.div
          className="absolute -inset-24"
          style={{
            background: 'conic-gradient(from 0deg, rgba(220, 38, 38, 0.5), rgba(30, 64, 175, 0.5), rgba(251, 191, 36, 0.5), rgba(124, 58, 237, 0.5), rgba(220, 38, 38, 0.5))',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            filter: 'blur(20px)',
          }}
          animate={{
            rotate: [0, 360],
            scale: phase >= 4 ? [1, 1.2, 1] : 1,
          }}
          transition={{
            rotate: { duration: 15, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity },
          }}
        />

        {/* Logo principal com efeitos extremos */}
        <motion.img
          src={logoMoises}
          alt="Moisés Medeiros"
          className="w-80 md:w-[420px] lg:w-[500px] relative z-10"
          animate={{
            filter: phase >= 4 ? [
              'brightness(1) drop-shadow(0 0 40px rgba(220, 38, 38, 0.6)) drop-shadow(0 0 80px rgba(251, 191, 36, 0.3))',
              'brightness(1.8) drop-shadow(0 0 100px rgba(220, 38, 38, 1)) drop-shadow(0 0 150px rgba(251, 191, 36, 0.7))',
              'brightness(1) drop-shadow(0 0 40px rgba(220, 38, 38, 0.6)) drop-shadow(0 0 80px rgba(251, 191, 36, 0.3))',
            ] : 'brightness(1) drop-shadow(0 0 30px rgba(220, 38, 38, 0.4))',
          }}
          transition={{
            duration: 1.2,
            repeat: phase >= 4 && phase < 6 ? Infinity : 0,
          }}
        />

        {/* Tagline épica */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ 
            opacity: phase >= 5 ? 1 : 0, 
            y: phase >= 5 ? 0 : 40,
          }}
          transition={{ duration: 1 }}
        >
          <GlitchText 
            text="O FUTURO DA QUÍMICA"
            phase={phase}
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-wider"
          />
          
          <motion.p
            className="text-xl md:text-2xl text-gray-300 mt-6 tracking-[0.4em] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 5 ? 1 : 0 }}
            transition={{ delay: 0.5 }}
          >
            Sua aprovação começa aqui
          </motion.p>
          
          <motion.div
            className="mt-8 flex items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 5 ? 1 : 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-red-500" />
            <span className="text-red-400 text-sm tracking-widest">ANO 2500</span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-red-500" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Flash final épico com ondas */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: phase >= 6 ? [0, 1, 0] : 0,
          background: phase >= 6 ? [
            'radial-gradient(circle at center, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%)',
            'radial-gradient(circle at center, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)',
            'radial-gradient(circle at center, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%)',
          ] : 'none',
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Linhas de velocidade no flash */}
      {phase >= 6 && (
        <motion.div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 rounded-full"
              style={{
                width: '120%',
                left: '-10%',
                top: `${(i / 50) * 100}%`,
                background: `linear-gradient(90deg, transparent, ${i % 3 === 0 ? '#dc2626' : i % 3 === 1 ? '#fbbf24' : '#1e40af'}, transparent)`,
                transform: `rotate(${Math.random() * 8 - 4}deg)`,
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: [0, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.3, delay: Math.random() * 0.15 }}
            />
          ))}
        </motion.div>
      )}

      {/* Botão pular - mais estilizado */}
      <AnimatePresence>
        {skipVisible && phase < 6 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={onComplete}
            className="absolute bottom-8 right-8 px-8 py-4 text-sm text-gray-300 hover:text-white border border-gray-700/50 hover:border-red-500/70 rounded-full transition-all bg-black/60 backdrop-blur-2xl hover:bg-red-950/30 flex items-center gap-3 group"
          >
            <span className="tracking-wider">Pular Intro</span>
            <motion.span
              animate={{ x: [0, 8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-red-400"
            >
              →
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Indicador de progresso - mais visual */}
      <motion.div
        className="absolute bottom-8 left-8 flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: skipVisible ? 1 : 0 }}
      >
        {[1, 2, 3, 4, 5, 6].map((p) => (
          <motion.div
            key={p}
            className="relative"
          >
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{
                background: phase >= p 
                  ? `linear-gradient(135deg, #dc2626, #fbbf24)` 
                  : 'rgba(255,255,255,0.15)',
                boxShadow: phase >= p ? '0 0 15px #dc2626, 0 0 30px #dc2626' : 'none',
              }}
              animate={{
                scale: phase === p ? [1, 1.5, 1] : 1,
              }}
              transition={{ duration: 0.6, repeat: phase === p ? Infinity : 0 }}
            />
            {phase === p && (
              <motion.div
                className="absolute inset-0 rounded-full bg-red-500"
                animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* CSS para animação de gradiente */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </motion.div>
  );
};
