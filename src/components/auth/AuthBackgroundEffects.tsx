// ============================================
// AUTH BACKGROUND EFFECTS - Componentes visuais extraídos
// Cyber Grid, Spider Web, Glowing Orbs
// ============================================

import { memo } from "react";

// Performance Optimized Cyber Grid - CSS Only
export const CyberGrid = memo(function CyberGrid() {
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
});

// Spider Web Pattern
export const SpiderWebPattern = memo(function SpiderWebPattern() {
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
});

// Simplified Glowing Orbs - Single orb only
export const GlowingOrbs = memo(function GlowingOrbs() {
  return (
    <div
      className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30"
      style={{
        background: 'radial-gradient(circle, rgba(139, 0, 0, 0.3) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'pulse 8s ease-in-out infinite'
      }}
    />
  );
});

// Combined Auth Background
export const AuthBackground = memo(function AuthBackground() {
  return (
    <>
      <CyberGrid />
      <SpiderWebPattern />
      <GlowingOrbs />
    </>
  );
});
