// ============================================
// ABERTURA CINEMATOGRÁFICA 2500 - ULTRA PREMIUM
// Estilo Marvel/Disney/Avengers Épico Absoluto
// Versão MÁXIMA com efeitos de portal dimensional
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoMoises from "@/assets/logo-moises-medeiros.png";

interface CinematicIntroProps {
  onComplete: () => void;
}

// Portal Dimensional - Efeito de abertura estilo Doctor Strange
const DimensionalPortal = ({ phase }: { phase: number }) => {
  const rings = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      size: 150 + i * 100,
      duration: 15 + i * 2,
      delay: i * 0.1,
      color: i % 4 === 0 ? 'rgba(220, 38, 38, 0.8)' : 
             i % 4 === 1 ? 'rgba(251, 191, 36, 0.7)' : 
             i % 4 === 2 ? 'rgba(30, 64, 175, 0.6)' : 
             'rgba(147, 51, 234, 0.5)',
    })),
  []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase >= 2 ? 1 : 0 }}
      transition={{ duration: 1 }}
    >
      {rings.map((ring, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: ring.size,
            height: ring.size,
            border: `${3 - i * 0.2}px solid ${ring.color}`,
            boxShadow: `
              0 0 30px ${ring.color},
              inset 0 0 30px ${ring.color},
              0 0 60px ${ring.color}
            `,
          }}
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{
            scale: phase >= 2 ? 1 : 0,
            rotate: phase >= 2 ? (i % 2 === 0 ? 360 : -360) : 0,
            opacity: phase >= 2 ? [0.3, 0.8, 0.3] : 0,
          }}
          transition={{
            scale: { duration: 2, delay: ring.delay, type: "spring", stiffness: 50 },
            rotate: { duration: ring.duration, repeat: Infinity, ease: "linear" },
            opacity: { duration: 3, repeat: Infinity, delay: ring.delay },
          }}
        />
      ))}

      {/* Runas mágicas orbitando */}
      {phase >= 2 && [...Array(24)].map((_, i) => (
        <motion.div
          key={`rune-${i}`}
          className="absolute w-6 h-6 rounded-full"
          style={{
            background: `radial-gradient(circle, ${i % 3 === 0 ? '#dc2626' : i % 3 === 1 ? '#fbbf24' : '#1e40af'} 0%, transparent 70%)`,
            boxShadow: `0 0 20px ${i % 3 === 0 ? '#dc2626' : i % 3 === 1 ? '#fbbf24' : '#1e40af'}`,
          }}
          animate={{
            x: Math.cos((i / 24) * Math.PI * 2 + Date.now() * 0.001) * (250 + (i % 3) * 80),
            y: Math.sin((i / 24) * Math.PI * 2 + Date.now() * 0.001) * (250 + (i % 3) * 80),
            scale: [1, 1.5, 1],
          }}
          transition={{
            x: { duration: 8 + i * 0.5, repeat: Infinity, ease: "linear" },
            y: { duration: 8 + i * 0.5, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity },
          }}
        />
      ))}
    </motion.div>
  );
};

// Holographic Grid - Grid holográfico futurista 3D
const HolographicGrid3D = ({ phase }: { phase: number }) => (
  <motion.div
    className="absolute inset-0 overflow-hidden perspective-[2000px]"
    initial={{ opacity: 0 }}
    animate={{ opacity: phase >= 1 ? 0.25 : 0 }}
    transition={{ duration: 2 }}
  >
    {/* Grid no chão */}
    <div 
      className="absolute inset-0 origin-bottom"
      style={{
        backgroundImage: `
          linear-gradient(rgba(220, 38, 38, 0.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30, 64, 175, 0.6) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        transform: 'perspective(800px) rotateX(75deg) translateY(50%)',
        transformOrigin: 'center bottom',
      }}
    />
    
    {/* Grid no teto */}
    <div 
      className="absolute inset-0 origin-top"
      style={{
        backgroundImage: `
          linear-gradient(rgba(251, 191, 36, 0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(147, 51, 234, 0.4) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        transform: 'perspective(800px) rotateX(-75deg) translateY(-50%)',
        transformOrigin: 'center top',
      }}
    />
    
    {/* Linha de energia horizontal */}
    <motion.div
      className="absolute h-1 w-full left-0"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.8), rgba(251, 191, 36, 0.8), transparent)',
        boxShadow: '0 0 40px rgba(220, 38, 38, 0.6)',
      }}
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    />
  </motion.div>
);

// Partículas quânticas - muito mais densas e épicas com trails
const QuantumParticlesWithTrails = ({ phase }: { phase: number }) => {
  const particles = useMemo(() => 
    Array.from({ length: 400 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 2,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 4,
      color: ['#dc2626', '#1e40af', '#fbbf24', '#7c3aed', '#10b981', '#ec4899'][i % 6]
    })),
  []);

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
            boxShadow: `0 0 ${p.size * 8}px ${p.color}, 0 0 ${p.size * 4}px ${p.color}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: phase >= 1 ? [0, 1, 0.5, 0] : 0,
            scale: phase >= 1 ? [0, 3, 1.5, 0] : 0,
            y: phase >= 1 ? [0, -500 - Math.random() * 300] : 0,
            x: phase >= 1 ? [0, (Math.random() - 0.5) * 200] : 0,
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

// Molécula de DNA animada 3D (tema química)
const MolecularHelix3D = ({ phase }: { phase: number }) => {
  const segments = 40;
  
  return (
    <motion.div 
      className="absolute left-1/2 -translate-x-1/2 h-full w-64"
      initial={{ opacity: 0, rotateY: 0 }}
      animate={{ 
        opacity: phase >= 2 ? 0.5 : 0,
        rotateY: phase >= 2 ? 360 : 0,
      }}
      transition={{ 
        opacity: { duration: 1.5 },
        rotateY: { duration: 20, repeat: Infinity, ease: "linear" }
      }}
      style={{ perspective: '1000px' }}
    >
      {[...Array(segments)].map((_, i) => (
        <motion.div key={i} className="absolute left-1/2">
          {/* Átomo principal esquerdo */}
          <motion.div
            className="absolute w-6 h-6 rounded-full"
            style={{
              background: `radial-gradient(circle, ${i % 2 === 0 ? '#dc2626' : '#1e40af'} 0%, transparent 70%)`,
              boxShadow: `0 0 30px ${i % 2 === 0 ? '#dc2626' : '#1e40af'}, 0 0 60px ${i % 2 === 0 ? '#dc2626' : '#1e40af'}`,
              top: `${(i / segments) * 100}%`,
            }}
            animate={{
              x: Math.sin((i / segments) * Math.PI * 6) * 100,
              z: Math.cos((i / segments) * Math.PI * 6) * 50,
              scale: [1, 1.5, 1],
            }}
            transition={{
              x: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              z: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 2, repeat: Infinity, delay: i * 0.03 },
            }}
          />
          
          {/* Átomo principal direito */}
          <motion.div
            className="absolute w-6 h-6 rounded-full"
            style={{
              background: `radial-gradient(circle, ${i % 2 === 1 ? '#dc2626' : '#fbbf24'} 0%, transparent 70%)`,
              boxShadow: `0 0 30px ${i % 2 === 1 ? '#dc2626' : '#fbbf24'}`,
              top: `${(i / segments) * 100}%`,
            }}
            animate={{
              x: -Math.sin((i / segments) * Math.PI * 6) * 100,
              z: -Math.cos((i / segments) * Math.PI * 6) * 50,
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Conexão entre átomos */}
          {i < segments - 1 && i % 3 === 0 && (
            <motion.div
              className="absolute h-0.5 w-24"
              style={{
                background: `linear-gradient(90deg, ${i % 2 === 0 ? '#dc2626' : '#1e40af'}, #fbbf24, ${i % 2 === 1 ? '#dc2626' : '#1e40af'})`,
                top: `${((i + 0.5) / segments) * 100}%`,
                left: '-48px',
                boxShadow: '0 0 15px rgba(251, 191, 36, 0.5)',
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scaleX: [0.8, 1.2, 0.8],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }}
            />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Raios de luz convergentes com pulsos de energia
const EnergyPulseRays = ({ phase }: { phase: number }) => {
  const rays = 32;
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(rays)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 origin-center"
          style={{
            width: '4px',
            height: '1500px',
            background: `linear-gradient(to top, 
              transparent 0%, 
              ${i % 4 === 0 ? 'rgba(220, 38, 38, 0.9)' : 
                i % 4 === 1 ? 'rgba(251, 191, 36, 0.8)' : 
                i % 4 === 2 ? 'rgba(30, 64, 175, 0.7)' : 
                'rgba(147, 51, 234, 0.6)'} 50%, 
              transparent 100%
            )`,
            transform: `rotate(${(i / rays) * 360}deg) translateY(-50%)`,
            boxShadow: `0 0 30px ${i % 4 === 0 ? 'rgba(220, 38, 38, 0.5)' : 
              i % 4 === 1 ? 'rgba(251, 191, 36, 0.4)' : 
              i % 4 === 2 ? 'rgba(30, 64, 175, 0.4)' : 
              'rgba(147, 51, 234, 0.3)'}`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{
            opacity: phase >= 3 ? [0, 1, 0.5, 0] : 0,
            scaleY: phase >= 3 ? [0, 1.3, 0.8, 0] : 0,
          }}
          transition={{
            duration: 2,
            delay: i * 0.06,
            repeat: phase >= 3 && phase < 6 ? Infinity : 0,
            repeatDelay: 1,
          }}
        />
      ))}
    </div>
  );
};

// Nebulosa dinâmica com cores vibrantes
const DynamicNebula = ({ phase }: { phase: number }) => (
  <motion.div className="absolute inset-0">
    {/* Camada 1 - Vermelha */}
    <motion.div
      className="absolute inset-0"
      animate={{
        background: phase >= 1 ? [
          'radial-gradient(ellipse at 20% 30%, rgba(220, 38, 38, 0.5) 0%, transparent 50%)',
          'radial-gradient(ellipse at 40% 60%, rgba(220, 38, 38, 0.4) 0%, transparent 50%)',
          'radial-gradient(ellipse at 20% 30%, rgba(220, 38, 38, 0.5) 0%, transparent 50%)',
        ] : 'none',
      }}
      transition={{ duration: 6, repeat: Infinity }}
    />
    
    {/* Camada 2 - Azul */}
    <motion.div
      className="absolute inset-0"
      animate={{
        background: phase >= 1 ? [
          'radial-gradient(ellipse at 80% 70%, rgba(30, 64, 175, 0.5) 0%, transparent 50%)',
          'radial-gradient(ellipse at 60% 40%, rgba(30, 64, 175, 0.4) 0%, transparent 50%)',
          'radial-gradient(ellipse at 80% 70%, rgba(30, 64, 175, 0.5) 0%, transparent 50%)',
        ] : 'none',
      }}
      transition={{ duration: 8, repeat: Infinity }}
    />
    
    {/* Camada 3 - Dourada central */}
    <motion.div
      className="absolute inset-0"
      animate={{
        background: phase >= 2 ? [
          'radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.4) 0%, transparent 40%)',
          'radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.6) 0%, transparent 50%)',
          'radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.4) 0%, transparent 40%)',
        ] : 'none',
      }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    
    {/* Camada 4 - Roxa */}
    <motion.div
      className="absolute inset-0"
      animate={{
        background: phase >= 2 ? [
          'radial-gradient(ellipse at 30% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 40%)',
          'radial-gradient(ellipse at 70% 20%, rgba(147, 51, 234, 0.4) 0%, transparent 40%)',
          'radial-gradient(ellipse at 30% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 40%)',
        ] : 'none',
      }}
      transition={{ duration: 7, repeat: Infinity }}
    />
  </motion.div>
);

// Texto com efeito glitch cinematográfico
const CinematicGlitchText = ({ text, phase, className }: { text: string; phase: number; className?: string }) => (
  <motion.div className={`relative ${className}`}>
    {/* Camada de sombra glitch vermelha */}
    <motion.span
      className="absolute inset-0 text-red-500"
      animate={phase >= 5 ? {
        x: [-3, 3, -3],
        opacity: [0, 0.8, 0],
      } : {}}
      transition={{ duration: 0.15, repeat: Infinity }}
    >
      {text}
    </motion.span>
    
    {/* Camada de sombra glitch azul */}
    <motion.span
      className="absolute inset-0 text-blue-500"
      animate={phase >= 5 ? {
        x: [3, -3, 3],
        opacity: [0, 0.8, 0],
      } : {}}
      transition={{ duration: 0.15, repeat: Infinity, delay: 0.05 }}
    >
      {text}
    </motion.span>
    
    {/* Texto principal com gradiente */}
    <motion.span 
      className="relative block"
      style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 20%, #fbbf24 40%, #f59e0b 60%, #dc2626 80%, #ef4444 100%)',
        backgroundSize: '300% 300%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{ duration: 4, repeat: Infinity }}
    >
      {text}
    </motion.span>
  </motion.div>
);

// Escudo de energia hexagonal
const EnergyShield = ({ phase }: { phase: number }) => (
  <motion.div
    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: phase >= 4 ? 1 : 0,
      opacity: phase >= 4 ? 1 : 0,
    }}
    transition={{ duration: 1.5, type: "spring" }}
  >
    {/* Hexágono de energia rotativo */}
    <motion.div
      className="absolute -inset-48"
      style={{
        background: 'conic-gradient(from 0deg, rgba(220, 38, 38, 0.6), rgba(251, 191, 36, 0.5), rgba(30, 64, 175, 0.6), rgba(147, 51, 234, 0.5), rgba(220, 38, 38, 0.6))',
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        filter: 'blur(20px)',
      }}
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
    />
    
    {/* Hexágono interno */}
    <motion.div
      className="absolute -inset-32"
      style={{
        background: 'conic-gradient(from 180deg, rgba(220, 38, 38, 0.4), rgba(30, 64, 175, 0.4), rgba(251, 191, 36, 0.4), rgba(220, 38, 38, 0.4))',
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        filter: 'blur(15px)',
      }}
      animate={{ rotate: [360, 0], scale: [1, 1.1, 1] }}
      transition={{ 
        rotate: { duration: 10, repeat: Infinity, ease: "linear" },
        scale: { duration: 3, repeat: Infinity },
      }}
    />
  </motion.div>
);

export const CinematicIntro = ({ onComplete }: CinematicIntroProps) => {
  const [phase, setPhase] = useState(0);
  const [skipVisible, setSkipVisible] = useState(false);

  useEffect(() => {
    const skipTimer = setTimeout(() => setSkipVisible(true), 500);
    
    // Timeline épica da animação - mais rápida e impactante
    const timers = [
      setTimeout(() => setPhase(1), 200),     // Partículas + grid + nebulosa
      setTimeout(() => setPhase(2), 1000),    // Anéis portal + DNA
      setTimeout(() => setPhase(3), 2000),    // Raios de energia
      setTimeout(() => setPhase(4), 3000),    // Logo surge + escudo
      setTimeout(() => setPhase(5), 4000),    // Tagline + glitch
      setTimeout(() => setPhase(6), 5500),    // Flash final
      setTimeout(() => onComplete(), 6300),   // Fim
    ];

    return () => {
      clearTimeout(skipTimer);
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase >= 6 ? 0 : 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background base com gradiente animado cósmico */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse at center, rgba(20, 0, 30, 1) 0%, rgba(5, 0, 10, 1) 50%, rgba(0, 0, 0, 1) 100%)',
            'radial-gradient(ellipse at center, rgba(40, 0, 20, 1) 0%, rgba(10, 0, 20, 1) 50%, rgba(0, 0, 0, 1) 100%)',
            'radial-gradient(ellipse at center, rgba(20, 0, 30, 1) 0%, rgba(5, 0, 10, 1) 50%, rgba(0, 0, 0, 1) 100%)',
          ],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Efeitos de fundo */}
      <HolographicGrid3D phase={phase} />
      <DynamicNebula phase={phase} />
      <QuantumParticlesWithTrails phase={phase} />
      <MolecularHelix3D phase={phase} />
      <DimensionalPortal phase={phase} />
      <EnergyPulseRays phase={phase} />
      <EnergyShield phase={phase} />

      {/* Container central do logo */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.2, opacity: 0, y: 200, rotateX: 60 }}
        animate={{
          scale: phase >= 4 ? 1 : 0.2,
          opacity: phase >= 4 ? 1 : 0,
          y: phase >= 4 ? 0 : 200,
          rotateX: phase >= 4 ? 0 : 60,
        }}
        transition={{
          duration: 1.5,
          type: "spring",
          stiffness: 50,
          damping: 12,
        }}
      >
        {/* Múltiplas camadas de glow atrás do logo */}
        <motion.div
          className="absolute -inset-52 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.8) 0%, rgba(220, 38, 38, 0.3) 30%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={{
            scale: phase >= 4 ? [1, 1.8, 1] : 1,
            opacity: phase >= 4 ? [0.6, 1, 0.6] : 0.6,
          }}
          transition={{ duration: 2, repeat: phase >= 4 && phase < 6 ? Infinity : 0 }}
        />
        
        <motion.div
          className="absolute -inset-40 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, transparent 60%)',
            filter: 'blur(50px)',
          }}
          animate={{
            scale: phase >= 4 ? [1.3, 1, 1.3] : 1.3,
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />

        {/* Logo principal com efeitos extremos */}
        <motion.img
          src={logoMoises}
          alt="Moisés Medeiros"
          className="w-80 md:w-[450px] lg:w-[550px] relative z-10"
          animate={{
            filter: phase >= 4 ? [
              'brightness(1) drop-shadow(0 0 50px rgba(220, 38, 38, 0.7)) drop-shadow(0 0 100px rgba(251, 191, 36, 0.4))',
              'brightness(2) drop-shadow(0 0 120px rgba(220, 38, 38, 1)) drop-shadow(0 0 180px rgba(251, 191, 36, 0.8))',
              'brightness(1) drop-shadow(0 0 50px rgba(220, 38, 38, 0.7)) drop-shadow(0 0 100px rgba(251, 191, 36, 0.4))',
            ] : 'brightness(1) drop-shadow(0 0 40px rgba(220, 38, 38, 0.5))',
          }}
          transition={{
            duration: 1.5,
            repeat: phase >= 4 && phase < 6 ? Infinity : 0,
          }}
        />

        {/* Tagline épica */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ 
            opacity: phase >= 5 ? 1 : 0, 
            y: phase >= 5 ? 0 : 50,
          }}
          transition={{ duration: 1 }}
        >
          <CinematicGlitchText 
            text="O FUTURO DA QUÍMICA"
            phase={phase}
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-wider"
          />
          
          <motion.p
            className="text-xl md:text-2xl text-gray-300 mt-8 tracking-[0.5em] uppercase font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 5 ? 1 : 0 }}
            transition={{ delay: 0.4 }}
          >
            Sua aprovação começa aqui
          </motion.p>
          
          <motion.div
            className="mt-10 flex items-center justify-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 5 ? 1 : 0 }}
            transition={{ delay: 0.7 }}
          >
            <motion.div 
              className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent"
              animate={{ scaleX: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-red-400 text-sm tracking-[0.3em] font-bold">ANO 2500</span>
            <motion.div 
              className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent"
              animate={{ scaleX: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Flash final épico com ondas de energia */}
      <AnimatePresence>
        {phase >= 6 && (
          <>
            {/* Ondas de choque */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`shockwave-${i}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
                style={{
                  borderColor: i % 2 === 0 ? 'rgba(220, 38, 38, 0.8)' : 'rgba(251, 191, 36, 0.6)',
                }}
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ 
                  width: 3000, 
                  height: 3000, 
                  opacity: 0,
                }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
            ))}
            
            {/* Flash branco final */}
            <motion.div
              className="absolute inset-0 bg-white pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.6 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Botão de skip elegante */}
      <AnimatePresence>
        {skipVisible && phase < 6 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            onClick={handleSkip}
            className="absolute bottom-10 right-10 px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white text-sm tracking-widest backdrop-blur-xl transition-all"
          >
            PULAR INTRO
          </motion.button>
        )}
      </AnimatePresence>

      {/* Barra de progresso */}
      <motion.div 
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600"
        initial={{ width: '0%' }}
        animate={{ width: `${(phase / 6) * 100}%` }}
        transition={{ duration: 0.5 }}
        style={{ boxShadow: '0 0 30px rgba(220, 38, 38, 0.8)' }}
      />

      {/* CSS para gradiente animado */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </motion.div>
  );
};
