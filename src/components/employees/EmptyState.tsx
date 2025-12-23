// 🏛️ LEI I: useQuantumReactivity aplicado
import { Users, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";

interface EmptyStateProps {
  onAddEmployee?: () => void;
}

export function EmptyState({ onAddEmployee }: EmptyStateProps) {
  const { shouldAnimate, gpuAnimationProps } = useQuantumReactivity();
  
  return (
    <motion.div
      {...(shouldAnimate ? gpuAnimationProps.fadeUp : {})}
      className="flex flex-col items-center justify-center py-20 px-4 glass-card rounded-3xl"
    >
      <motion.div 
        className="relative mb-8"
        animate={shouldAnimate ? { y: [0, -8, 0] } : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Decorative rings */}
        {shouldAnimate && (
          <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" style={{ animationDuration: '2s' }} />
        )}
        <div className="absolute inset-2 rounded-full bg-primary/10" />
        
        <div className="relative rounded-full bg-gradient-to-br from-secondary to-secondary/50 p-8">
          <Users className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.h3 
        {...(shouldAnimate ? gpuAnimationProps.fadeIn : {})}
        className="text-2xl font-bold text-foreground mb-3"
      >
        Nenhum funcionário cadastrado
      </motion.h3>
      
      <motion.p 
        {...(shouldAnimate ? gpuAnimationProps.fadeIn : {})}
        className="text-muted-foreground text-center max-w-md mb-8 leading-relaxed"
      >
        Comece adicionando seu primeiro funcionário para gerenciar sua equipe de forma simples e eficiente.
      </motion.p>

      {onAddEmployee && (
        <motion.div
          {...(shouldAnimate ? gpuAnimationProps.fadeUp : {})}
        >
          <Button
            onClick={onAddEmployee}
            size="lg"
            className="bg-primary hover:bg-primary/90 gap-2 px-6 shadow-lg shadow-primary/20"
          >
            <Plus className="h-5 w-5" />
            Adicionar Funcionário
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
