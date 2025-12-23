// ============================================
// TUTORIA IA - Mode Selector Cards 2300
// Performance-first: GPU-only animations
// ============================================

import { memo } from "react";
import { motion } from "framer-motion";
import { Brain, FileText, BookOpen, Calendar, LucideIcon } from "lucide-react";
import { useFuturisticUI } from "@/hooks/useFuturisticUI";
import { cn } from "@/lib/utils";

type AIMode = "tutor" | "redacao" | "flashcards" | "cronograma";

interface ModeConfig {
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
  gradient: string;
}

const MODES: Record<AIMode, ModeConfig> = {
  tutor: {
    icon: Brain,
    label: "Tutor",
    description: "Tire dúvidas de Química",
    color: "holo-cyan",
    gradient: "from-holo-cyan/20 to-holo-blue/20",
  },
  redacao: {
    icon: FileText,
    label: "Redação",
    description: "Correção e feedback",
    color: "holo-purple",
    gradient: "from-holo-purple/20 to-holo-pink/20",
  },
  flashcards: {
    icon: BookOpen,
    label: "Flashcards",
    description: "Gerar cards de estudo",
    color: "holo-green",
    gradient: "from-holo-green/20 to-holo-cyan/20",
  },
  cronograma: {
    icon: Calendar,
    label: "Cronograma",
    description: "Plano de estudos",
    color: "holo-pink",
    gradient: "from-holo-pink/20 to-holo-purple/20",
  },
};

interface TutoriaModeSelectorProps {
  selectedMode: AIMode;
  onModeChange: (mode: AIMode) => void;
}

export const TutoriaModeSelector = memo(function TutoriaModeSelector({
  selectedMode,
  onModeChange,
}: TutoriaModeSelectorProps) {
  const ui = useFuturisticUI();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {(Object.entries(MODES) as [AIMode, ModeConfig][]).map(([key, config], index) => {
        const Icon = config.icon;
        const isSelected = selectedMode === key;
        
        return (
          <motion.button
            key={key}
            onClick={() => onModeChange(key)}
            className={cn(
              "relative p-4 rounded-xl text-left transition-colors",
              "border border-ai-border/50",
              isSelected 
                ? `bg-gradient-to-br ${config.gradient} border-${config.color}/50` 
                : "bg-ai-surface/50 hover:bg-ai-surface-hover",
            )}
            initial={ui.shouldAnimate ? { opacity: 0, y: 10 } : undefined}
            animate={ui.shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: index * 0.05 }}
            whileHover={ui.shouldAnimate ? { scale: 1.02 } : undefined}
            whileTap={ui.shouldAnimate ? { scale: 0.98 } : undefined}
          >
            {/* Selection indicator */}
            {isSelected && ui.enableAmbient && (
              <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-50" 
                  style={{ color: `hsl(var(--${config.color}))` }}
                />
              </div>
            )}
            
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
              isSelected 
                ? `bg-${config.color}/20` 
                : "bg-muted/50"
            )}>
              <Icon className={cn(
                "w-5 h-5",
                isSelected ? `text-${config.color}` : "text-muted-foreground"
              )} 
              style={isSelected ? { color: `hsl(var(--${config.color}))` } : undefined}
              />
            </div>
            
            <h3 className={cn(
              "font-semibold mb-1",
              isSelected ? "text-foreground" : "text-muted-foreground"
            )}>
              {config.label}
            </h3>
            
            <p className="text-xs text-muted-foreground line-clamp-1">
              {config.description}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
});

TutoriaModeSelector.displayName = "TutoriaModeSelector";
