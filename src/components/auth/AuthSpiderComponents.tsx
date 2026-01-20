// ============================================
// SPIDER-MAN CINEMATIC 2300 - VISUAL COMPONENTS
// Extraído de Auth.tsx para otimização de build
// ============================================

import { forwardRef, ReactNode } from "react";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";

// Spider-Man Deep Space Background (STATIC - no animations per user request)
export const SpiderBackground = forwardRef<HTMLDivElement>((_, ref) => (
  <div
    ref={ref}
    className="absolute inset-0 pointer-events-none"
    style={{
      background: "linear-gradient(135deg, hsl(230 40% 6%) 0%, hsl(230 40% 3%) 100%)",
    }}
  />
));
SpiderBackground.displayName = "SpiderBackground";

// Spider Eyes - DISABLED per user request (no animated glows)
export const SpiderEyes = forwardRef<HTMLDivElement>((_, ref) => <span ref={ref} />);
SpiderEyes.displayName = "SpiderEyes";

// Energy Veins - DISABLED per user request (no animated lines)
export const SpiderVeins = forwardRef<HTMLDivElement>((_, ref) => <span ref={ref} />);
SpiderVeins.displayName = "SpiderVeins";

// Spider Card Frame - Tech Interface
export function SpiderCardFrame() {
  return (
    <>
      {/* Animated corner brackets - Red/Blue */}
      <div className="absolute -top-1 -left-1 w-8 h-8 border-l-2 border-t-2 spider-corner spider-corner-red" />
      <div
        className="absolute -top-1 -right-1 w-8 h-8 border-r-2 border-t-2 spider-corner spider-corner-blue"
        style={{ animationDelay: "0.6s" }}
      />
      <div
        className="absolute -bottom-1 -left-1 w-8 h-8 border-l-2 border-b-2 spider-corner spider-corner-blue"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        className="absolute -bottom-1 -right-1 w-8 h-8 border-r-2 border-b-2 spider-corner spider-corner-red"
        style={{ animationDelay: "1.8s" }}
      />

      {/* Scanning beam effect - Red/Blue gradient */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="spider-card-scan absolute inset-x-0 h-[2px]" />
      </div>
    </>
  );
}

// Holographic Grid 2300
export function HolographicGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary hex grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" preserveAspectRatio="none">
        <defs>
          <pattern id="hexGrid2300" x="0" y="0" width="50" height="43.4" patternUnits="userSpaceOnUse">
            <path
              d="M25,0 L50,14.4 L50,28.9 L25,43.4 L0,28.9 L0,14.4 Z"
              fill="none"
              stroke="url(#holoGradient)"
              strokeWidth="0.5"
            />
          </pattern>
          <linearGradient id="holoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(185 100% 50%)" />
            <stop offset="50%" stopColor="hsl(280 100% 60%)" />
            <stop offset="100%" stopColor="hsl(320 100% 60%)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexGrid2300)" />
      </svg>

      {/* Energy flow lines */}
      <div className="absolute inset-0">
        <div
          className="absolute h-px w-full auth-energy-flow"
          style={{
            top: "25%",
            background: "linear-gradient(90deg, transparent, hsl(var(--holo-cyan) / 0.4), transparent)",
          }}
        />
        <div
          className="absolute h-px w-full auth-energy-flow-reverse"
          style={{
            top: "75%",
            background: "linear-gradient(90deg, transparent, hsl(var(--holo-purple) / 0.4), transparent)",
          }}
        />
      </div>
    </div>
  );
}

// Orbital Ring System
export function OrbitalRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Ring 1 - Outer */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full border border-holo-cyan/20 auth-orbital-ring"
        style={{
          boxShadow: "inset 0 0 60px hsl(var(--holo-cyan) / 0.1), 0 0 60px hsl(var(--holo-cyan) / 0.05)",
        }}
      />
      {/* Ring 2 - Middle */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full border border-holo-purple/20 auth-orbital-ring-reverse"
        style={{
          boxShadow: "inset 0 0 40px hsl(var(--holo-purple) / 0.1), 0 0 40px hsl(var(--holo-purple) / 0.05)",
        }}
      />
      {/* Ring 3 - Inner */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full border border-primary/30 auth-orbital-ring"
        style={{
          animationDuration: "15s",
          boxShadow: "inset 0 0 30px hsl(var(--primary) / 0.15), 0 0 30px hsl(var(--primary) / 0.1)",
        }}
      />

      {/* Orbital nodes */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full auth-orbital-node"
          style={{
            background: i % 2 === 0 ? "hsl(var(--holo-cyan))" : "hsl(var(--holo-purple))",
            boxShadow:
              i % 2 === 0
                ? "0 0 15px hsl(var(--holo-cyan)), 0 0 30px hsl(var(--holo-cyan) / 0.5)"
                : "0 0 15px hsl(var(--holo-purple)), 0 0 30px hsl(var(--holo-purple) / 0.5)",
            transform: `rotate(${angle}deg) translateX(300px)`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

// DNA Helix Animation
export function DNAHelix() {
  return (
    <div className="absolute left-8 top-0 bottom-0 w-16 overflow-hidden pointer-events-none opacity-40">
      <div className="auth-dna-helix h-full">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute w-full flex justify-between items-center" style={{ top: `${i * 8.33}%` }}>
            <div
              className="w-3 h-3 rounded-full auth-dna-node-left"
              style={{
                background: "hsl(var(--holo-cyan))",
                boxShadow: "0 0 10px hsl(var(--holo-cyan))",
                animationDelay: `${i * 0.2}s`,
              }}
            />
            <div
              className="flex-1 h-px mx-1"
              style={{
                background: "linear-gradient(90deg, hsl(var(--holo-cyan) / 0.5), hsl(var(--holo-purple) / 0.5))",
              }}
            />
            <div
              className="w-3 h-3 rounded-full auth-dna-node-right"
              style={{
                background: "hsl(var(--holo-purple))",
                boxShadow: "0 0 10px hsl(var(--holo-purple))",
                animationDelay: `${i * 0.2 + 0.5}s`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Cosmic Background with Stars
export function CosmicBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep space gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, hsl(280 40% 8% / 0.8) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsl(185 40% 5% / 0.6) 0%, transparent 50%)",
        }}
      />

      {/* Twinkling stars */}
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full auth-star"
          style={{
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: "#fff",
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}

      {/* Nebula glow spots */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(var(--holo-purple) / 0.1) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(var(--holo-cyan) / 0.08) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// Holographic Card Frame
export function HoloCardFrame() {
  return (
    <>
      {/* Animated corner brackets */}
      <div className="absolute -top-1 -left-1 w-8 h-8 border-l-2 border-t-2 border-holo-cyan/60 auth-corner-pulse" />
      <div
        className="absolute -top-1 -right-1 w-8 h-8 border-r-2 border-t-2 border-holo-purple/60 auth-corner-pulse"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute -bottom-1 -left-1 w-8 h-8 border-l-2 border-b-2 border-holo-purple/60 auth-corner-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute -bottom-1 -right-1 w-8 h-8 border-r-2 border-b-2 border-holo-cyan/60 auth-corner-pulse"
        style={{ animationDelay: "1.5s" }}
      />

      {/* Scanning beam effect */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div
          className="auth-card-scan absolute inset-x-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--holo-cyan) / 0.8), transparent)",
            boxShadow: "0 0 20px hsl(var(--holo-cyan) / 0.5)",
          }}
        />
      </div>
    </>
  );
}

// Stats Display - Futuristic 2300 version
export function ApprovalHeroText() {
  // 🏛️ LEI I - Performance Tiering (5000+ usuários)
  const { shouldAnimate, shouldBlur, isLowEnd } = useConstitutionPerformance();
  
  return (
    <div className="relative text-center mt-6 w-full overflow-visible">
      {/* 🔥 GLOW BACKGROUND - Apenas em high-end */}
      {!isLowEnd && (
        <div 
          className="absolute inset-0 -z-10 opacity-60 auth-hero-glow-bg"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 50%, hsl(320 90% 50% / 0.15), transparent 70%)",
            filter: shouldBlur ? "blur(40px)" : "blur(20px)",
          }}
        />
      )}
      
      {/* ⚡ MAIN TITLE - CSS-only animations for stability */}
      <div className={shouldAnimate ? "auth-hero-title-animated" : ""}>
        <h2 
          className="text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight"
          style={{ textShadow: !isLowEnd ? "0 0 60px hsl(0 0% 100% / 0.1)" : undefined }}
        >
          O Professor que
        </h2>
        
        {/* 🌟 HIGHLIGHT - "Mais Aprova" com GLOW otimizado */}
        <div className={`relative inline-block py-2 ${shouldAnimate ? "auth-hero-highlight-animated" : ""}`}>
          {/* Glow Layer - só em high-end */}
          {!isLowEnd && (
            <div 
              className="absolute inset-0 -z-10 rounded-lg auth-glow-layer"
              style={{
                background: "linear-gradient(90deg, hsl(280 90% 60% / 0.4), hsl(320 95% 55% / 0.5), hsl(0 90% 55% / 0.4))",
                filter: shouldBlur ? "blur(25px)" : "blur(15px)",
              }}
            />
          )}
          
          <span 
            className="relative text-4xl sm:text-5xl xl:text-6xl font-black"
            style={{
              background: "linear-gradient(90deg, hsl(280 90% 65%), hsl(320 95% 60%), hsl(350 90% 58%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: !isLowEnd 
                ? "drop-shadow(0 0 30px hsl(320 90% 55% / 0.6)) drop-shadow(0 0 60px hsl(320 90% 55% / 0.3))"
                : "drop-shadow(0 0 15px hsl(320 90% 55% / 0.4))",
              letterSpacing: "-0.02em",
            }}
          >
            Mais Aprova
          </span>
        </div>
        
        <h2 
          className={`text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight ${shouldAnimate ? "auth-hero-subtitle-animated" : ""}`}
          style={{ textShadow: !isLowEnd ? "0 0 60px hsl(0 0% 100% / 0.1)" : undefined }}
        >
          em <span style={{ color: "hsl(210 100% 70%)" }}>Medicina</span> no Brasil
        </h2>
      </div>
      
      {/* 📝 DESCRIPTION */}
      <p 
        className={`mt-6 text-sm sm:text-base text-gray-300 max-w-sm mx-auto leading-relaxed ${shouldAnimate ? "auth-hero-desc-animated" : ""}`}
      >
        Química de alto nível com metodologia exclusiva.<br />
        <span className="text-gray-400">Milhares de alunos aprovados nas melhores faculdades do país.</span>
      </p>
      
      {/* ✨ DECORATIVE LINE */}
      <div className={`flex items-center justify-center gap-4 mt-6 ${shouldAnimate ? "auth-hero-line-animated" : ""}`}>
        <div 
          className="h-px w-16 sm:w-24"
          style={{ background: "linear-gradient(90deg, transparent, hsl(320 90% 55% / 0.6), hsl(320 90% 55%))" }}
        />
        <div className="relative">
          <div 
            className={`w-3 h-3 rounded-full ${shouldAnimate ? "auth-orb-animated" : ""}`}
            style={{ 
              background: "linear-gradient(135deg, hsl(320 90% 60%), hsl(280 90% 55%))",
              boxShadow: !isLowEnd 
                ? "0 0 15px hsl(320 90% 55% / 0.8), 0 0 30px hsl(320 90% 55% / 0.4)"
                : "0 0 10px hsl(320 90% 55% / 0.6)",
            }}
          />
          {/* Orbiting Ring - só em high-end com animações */}
          {!isLowEnd && shouldAnimate && (
            <div 
              className="absolute inset-0 rounded-full border border-primary/30 auth-ring-animated"
              style={{ transform: "scale(2.5)" }}
            />
          )}
        </div>
        <div 
          className="h-px w-16 sm:w-24"
          style={{ background: "linear-gradient(90deg, hsl(320 90% 55%), hsl(320 90% 55% / 0.6), transparent)" }}
        />
      </div>
    </div>
  );
}
