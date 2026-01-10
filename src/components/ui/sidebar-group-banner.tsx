// ============================================
// SIDEBAR GROUP BANNER 2090
// Banner futurístico para grupos do sidebar
// Com animações e efeitos cyberpunk
// ============================================

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SacredImage } from "@/components/performance/SacredImage";

interface SidebarGroupBannerProps {
  title: string;
  image: string;
  icon?: ReactNode;
  accentColor?: "primary" | "green" | "blue" | "purple" | "orange" | "cyan" | "gold" | "pink";
  className?: string;
}

export function SidebarGroupBanner({
  title,
  image,
  icon,
  accentColor = "primary",
  className,
}: SidebarGroupBannerProps) {
  const colorConfig = {
    primary: "from-primary/90 via-primary/60 to-transparent",
    green: "from-emerald-600/90 via-emerald-600/60 to-transparent",
    blue: "from-blue-600/90 via-blue-600/60 to-transparent",
    purple: "from-purple-600/90 via-purple-600/60 to-transparent",
    orange: "from-orange-600/90 via-orange-600/60 to-transparent",
    cyan: "from-cyan-600/90 via-cyan-600/60 to-transparent",
    gold: "from-amber-600/90 via-amber-600/60 to-transparent",
    pink: "from-pink-600/90 via-pink-600/60 to-transparent",
  };

  const glowConfig = {
    primary: "shadow-primary/30",
    green: "shadow-emerald-500/30",
    blue: "shadow-blue-500/30",
    purple: "shadow-purple-500/30",
    orange: "shadow-orange-500/30",
    cyan: "shadow-cyan-500/30",
    gold: "shadow-amber-500/30",
    pink: "shadow-pink-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative mb-2 rounded-lg overflow-hidden h-14 group cursor-pointer",
        `shadow-lg ${glowConfig[accentColor]} hover:shadow-xl transition-shadow`,
        className
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <SacredImage 
          src={image} 
          alt={title}
          className="w-full h-full"
          objectFit="cover"
        />
      </div>
      
      {/* Gradient Overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r",
        colorConfig[accentColor]
      )} />

      {/* Scan Line Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent"
        animate={{ y: ["-100%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{ height: "50%" }}
      />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '10px 10px'
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex items-center px-3 gap-2">
        {/* Icon with Glow */}
        {icon && (
          <motion.div
            className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm"
            animate={{ 
              boxShadow: [
                "0 0 5px rgba(255,255,255,0.3)",
                "0 0 15px rgba(255,255,255,0.5)",
                "0 0 5px rgba(255,255,255,0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {icon}
          </motion.div>
        )}
        
        {/* Title */}
        <motion.span 
          className="text-sm font-bold text-white drop-shadow-lg tracking-wide"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {title}
        </motion.span>

        {/* Decorative Elements */}
        <div className="flex-1" />
        <motion.div
          className="flex gap-0.5"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-1 bg-white/60 rounded-full"
              animate={{ height: [4, 10, 4] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </motion.div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-white/40 rounded-tl" />
      <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-white/40 rounded-tr" />
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-white/40 rounded-bl" />
      <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-white/40 rounded-br" />

      {/* Bottom Glow Line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/50"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}
