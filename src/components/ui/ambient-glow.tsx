// ============================================
// AMBIENT GLOW 2300 - Premium Effect
// Pure CSS, GPU-accelerated, flag-controlled
// Pauses when offscreen via CSS contain
// ============================================

import { memo } from "react";
import { cn } from "@/lib/utils";
import { useFuturisticUI } from "@/hooks/useFuturisticUI";

interface AmbientGlowProps {
  className?: string;
  variant?: "top" | "center" | "bottom" | "full";
  intensity?: "subtle" | "medium" | "strong";
  color?: "holo" | "cyan" | "purple" | "primary";
}

export const AmbientGlow = memo(function AmbientGlow({
  className,
  variant = "top",
  intensity = "subtle",
  color = "holo",
}: AmbientGlowProps) {
  const { enableAmbient, shouldUseBlur } = useFuturisticUI();
  
  // Don't render if ambient is disabled
  if (!enableAmbient) return null;
  
  // Position variants
  const positions = {
    top: "top-0 left-0 right-0 h-60",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px]",
    bottom: "bottom-0 left-0 right-0 h-40",
    full: "inset-0",
  };
  
  // Intensity (opacity levels)
  const intensities = {
    subtle: "opacity-30",
    medium: "opacity-50",
    strong: "opacity-70",
  };
  
  // Color gradients (pure CSS, no animation = cheap)
  const colors = {
    holo: "bg-gradient-to-b from-holo-cyan/10 via-holo-purple/5 to-transparent",
    cyan: "bg-gradient-to-b from-holo-cyan/15 via-holo-cyan/5 to-transparent",
    purple: "bg-gradient-to-b from-holo-purple/15 via-holo-purple/5 to-transparent",
    primary: "bg-gradient-to-b from-primary/10 via-primary/5 to-transparent",
  };
  
  // Optional blur for depth (disabled on lite mode)
  const blurClass = shouldUseBlur ? "backdrop-blur-[1px]" : "";
  
  return (
    <div
      className={cn(
        "pointer-events-none fixed z-0",
        "contain-strict", // CSS containment for performance
        positions[variant],
        intensities[intensity],
        colors[color],
        blurClass,
        className
      )}
      aria-hidden="true"
    />
  );
});

AmbientGlow.displayName = "AmbientGlow";

// ============================================
// HERO GLOW - Specific for hero sections
// Animated gradient mesh (CSS only)
// ============================================

interface HeroGlowProps {
  className?: string;
  animate?: boolean;
}

export const HeroGlow = memo(function HeroGlow({
  className,
  animate = true,
}: HeroGlowProps) {
  const { enableAmbient, shouldAnimate, shouldUseBlur } = useFuturisticUI();
  
  if (!enableAmbient) return null;
  
  const shouldAnimateGlow = animate && shouldAnimate;
  
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden z-0",
        "contain-strict",
        className
      )}
      aria-hidden="true"
    >
      {/* Primary glow orb */}
      <div
        className={cn(
          "absolute -top-20 -right-20 w-80 h-80 rounded-full",
          "bg-holo-cyan/10",
          shouldUseBlur && "blur-3xl",
          shouldAnimateGlow && "animate-holo-pulse"
        )}
      />
      
      {/* Secondary glow orb */}
      <div
        className={cn(
          "absolute -top-10 -left-10 w-60 h-60 rounded-full",
          "bg-holo-purple/8",
          shouldUseBlur && "blur-3xl",
          shouldAnimateGlow && "animate-holo-pulse",
          shouldAnimateGlow && "[animation-delay:1.5s]"
        )}
      />
      
      {/* Gradient overlay */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-br from-transparent via-transparent to-holo-cyan/5"
        )}
      />
    </div>
  );
});

HeroGlow.displayName = "HeroGlow";

// ============================================
// CARD GLOW - Subtle border glow for cards
// ============================================

interface CardGlowProps {
  className?: string;
  active?: boolean;
}

export const CardGlow = memo(function CardGlow({
  className,
  active = false,
}: CardGlowProps) {
  const { enableAmbient } = useFuturisticUI();
  
  if (!enableAmbient || !active) return null;
  
  return (
    <div
      className={cn(
        "pointer-events-none absolute -inset-px rounded-xl z-0",
        "bg-gradient-to-r from-holo-cyan/20 via-holo-purple/20 to-holo-cyan/20",
        "animate-border-glow opacity-50",
        className
      )}
      aria-hidden="true"
    />
  );
});

CardGlow.displayName = "CardGlow";
