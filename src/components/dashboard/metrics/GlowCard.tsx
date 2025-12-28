// GlowCard - Componente extraído de IntegratedMetricsDashboard
import { motion } from "framer-motion";
import React from "react";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: "low" | "medium" | "high";
}

export function GlowCard({ 
  children, 
  className = "", 
  glowColor = "primary", 
  intensity = "medium" 
}: GlowCardProps) {
  const intensityMap = {
    low: "shadow-lg",
    medium: "shadow-xl",
    high: "shadow-2xl"
  };

  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500`} />
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}
