// ============================================
// COMPONENTE: AuthVisuals
// Extraído de Auth.tsx (1223 linhas)
// Elementos visuais do Auth (CyberGrid, Orbs, etc)
// ============================================

import { ReactNode } from "react";

// Performance Optimized Cyber Grid - CSS Only
export function CyberGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Static Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 0, 0, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 0, 0, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* CSS-only animated line */}
      <div 
        className="absolute h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-pulse"
        style={{ top: '50%', animationDuration: '4s' }}
      />
    </div>
  );
}

// Spider Web Pattern
export function SpiderWebPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.02]" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <pattern id="web" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path 
            d="M10 0 L10 20 M0 10 L20 10 M0 0 L20 20 M20 0 L0 20" 
            stroke="currentColor" 
            strokeWidth="0.3" 
            fill="none" 
            className="text-primary"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#web)" />
    </svg>
  );
}

// Simplified Glowing Orbs - Single orb only
export function GlowingOrbs() {
  return (
    <div
      className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30"
      style={{
        background: 'radial-gradient(circle, rgba(139, 0, 0, 0.15) 0%, transparent 70%)',
      }}
    />
  );
}

// Removed CircuitLines - too heavy for performance
export function CircuitLines() {
  return null;
}

// Stats Display - CSS animations only
interface Stat {
  value: string;
  label: string;
}

export function StatsDisplay({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-8 w-full">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="text-center px-6 py-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm min-w-[120px] hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 animate-fade-in"
          style={{ animationDelay: `${0.3 + i * 0.1}s`, animationFillMode: 'backwards' }}
        >
          <div className="text-2xl xl:text-3xl font-bold text-primary">
            {stat.value}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// Auth Background - Combina todos os efeitos visuais
export function AuthBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-background/95 overflow-hidden">
      <CyberGrid />
      <SpiderWebPattern />
      <GlowingOrbs />
      <CircuitLines />
      {children}
    </div>
  );
}
