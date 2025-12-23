// ============================================
// HERO AMBIENT 2300 - SVG/CSS Premium Effect
// Desligável em Lite mode (LEI I Art.19-21)
// GPU-only: transform, opacity, filter
// ============================================

import { memo } from "react";
import { cn } from "@/lib/utils";
import { useFuturisticUI } from "@/hooks/useFuturisticUI";

interface HeroAmbient2300Props {
  className?: string;
  intensity?: "subtle" | "medium" | "strong";
  variant?: "default" | "cyan" | "primary";
}

export const HeroAmbient2300 = memo(function HeroAmbient2300({
  className,
  intensity = "subtle",
  variant = "default",
}: HeroAmbient2300Props) {
  const { enableAmbient, shouldUseBlur } = useFuturisticUI();
  
  // Desliga em Lite mode (LEI I)
  if (!enableAmbient) return null;
  
  const intensityMap = {
    subtle: "opacity-20",
    medium: "opacity-30",
    strong: "opacity-40",
  };

  const variantColors = {
    default: {
      primary: "hsl(var(--primary) / 0.4)",
      secondary: "hsl(var(--holo-cyan) / 0.3)",
    },
    cyan: {
      primary: "hsl(var(--holo-cyan) / 0.4)",
      secondary: "hsl(var(--holo-purple) / 0.3)",
    },
    primary: {
      primary: "hsl(var(--primary) / 0.5)",
      secondary: "hsl(var(--primary-glow) / 0.3)",
    },
  };

  const colors = variantColors[variant];

  return (
    <div
      className={cn(
        "hero-ambient-2300",
        intensityMap[intensity],
        className
      )}
      aria-hidden="true"
    >
      {/* Primary orb - top right */}
      <div
        className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)`,
          filter: shouldUseBlur ? "blur(80px)" : "blur(40px)",
          animation: "ambient-float 8s ease-in-out infinite",
        }}
      />
      
      {/* Secondary orb - bottom left */}
      <div
        className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)`,
          filter: shouldUseBlur ? "blur(80px)" : "blur(40px)",
          animation: "ambient-float 10s ease-in-out infinite reverse",
        }}
      />
      
      {/* Center subtle gradient */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 rounded-full opacity-10"
        style={{
          background: `radial-gradient(ellipse, ${colors.primary} 0%, transparent 60%)`,
          filter: shouldUseBlur ? "blur(100px)" : "blur(50px)",
        }}
      />
    </div>
  );
});

HeroAmbient2300.displayName = "HeroAmbient2300";
