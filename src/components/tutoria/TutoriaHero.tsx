// ============================================
// TUTORIA IA - Hero Section 2300
// Performance-first: GPU-only animations
// ============================================

import { memo } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import { useFuturisticUI } from "@/hooks/useFuturisticUI";

interface TutoriaHeroProps {
  userName?: string;
}

export const TutoriaHero = memo(function TutoriaHero({ userName }: TutoriaHeroProps) {
  const ui = useFuturisticUI();
  
  // Base animation (GPU-only: transform, opacity)
  const containerAnim = ui.shouldAnimate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: ui.animationDuration(0.4) },
  } : {};
  
  return (
    <motion.div 
      className={`relative rounded-2xl overflow-hidden ${ui.glassClass} ${ui.glowClass}`}
      {...containerAnim}
    >
      {/* Holographic Ambient FX - only if enabled */}
      {ui.enableAmbient && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Gradient orbs - GPU animated */}
          <div 
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-holo-cyan/10 blur-3xl"
            style={{ 
              animation: ui.shouldAnimate ? "pulse-slow 6s ease-in-out infinite" : "none" 
            }}
          />
          <div 
            className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-holo-purple/10 blur-3xl"
            style={{ 
              animation: ui.shouldAnimate ? "pulse-slow 8s ease-in-out infinite" : "none",
              animationDelay: "2s"
            }}
          />
          
          {/* Holographic line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-holo-cyan/50 to-transparent" />
        </div>
      )}
      
      <div className="relative p-6 md:p-8">
        <div className="flex items-center gap-4 mb-4">
          {/* AI Avatar */}
          <motion.div 
            className="relative"
            whileHover={ui.shouldAnimate ? { scale: 1.05 } : undefined}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-holo-cyan to-holo-purple flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            
            {/* Pulse ring - only if animated */}
            {ui.shouldAnimate && (
              <div className="absolute inset-0 rounded-2xl border-2 border-holo-cyan/50 animate-ping-slow" />
            )}
          </motion.div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Tutor IA
              </h1>
              <Sparkles className="w-5 h-5 text-holo-cyan" />
            </div>
            <p className="text-muted-foreground">
              {userName ? `Olá, ${userName}! ` : ""}
              Seu assistente de Química 24/7
            </p>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-holo-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-holo-green" />
          </span>
          <span className="text-sm text-holo-green">Online e pronto para ajudar</span>
        </div>
      </div>
    </motion.div>
  );
});

TutoriaHero.displayName = "TutoriaHero";
