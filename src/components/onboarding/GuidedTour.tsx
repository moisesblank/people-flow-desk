// ============================================
// MOISES MEDEIROS v5.0 - GUIDED TOUR
// Pilar 11: Documentação e Onboarding Inteligente
// ============================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles, Check, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector para o elemento alvo
  position?: "top" | "bottom" | "left" | "right";
  action?: () => void;
  tip?: string; // Dica adicional
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

export function GuidedTour({ steps, isOpen, onComplete, onSkip }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  // Encontra e destaca o elemento alvo
  useEffect(() => {
    if (!isOpen || !step?.target) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isOpen, step]);

  const handleNext = useCallback(() => {
    step?.action?.();
    
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [step, isLastStep, onComplete]);

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip?.();
    onComplete();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998]"
        style={{
          background: "rgba(0, 0, 0, 0.75)",
        }}
      >
        {/* Highlight do elemento alvo */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bg-transparent rounded-lg"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 30px rgba(var(--primary), 0.5)",
              border: "2px solid hsl(var(--primary))",
            }}
          />
        )}
      </motion.div>

      {/* Tour Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed z-[9999] bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress Bar */}
          <div className="p-4 pb-0">
            <Progress value={progress} className="h-1" />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="p-2 rounded-xl bg-primary/10"
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                </motion.div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Passo {currentStep + 1} de {steps.length}
                  </p>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleSkip}
                aria-label="Pular tour"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {step.description}
            </p>

            {/* Tip section */}
            {step.tip && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4"
              >
                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary/80">{step.tip}</p>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              <div className="flex gap-1">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentStep
                        ? "bg-primary"
                        : idx < currentStep
                        ? "bg-primary/50"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <Button
                size="sm"
                onClick={handleNext}
                className="gap-1"
              >
                {isLastStep ? (
                  <>
                    Concluir
                    <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook para gerenciar o tour
// 🏛️ CONSTITUIÇÃO v10.4: Gestão staff bypass + autoOpen=false por default
export function useTour(tourId: string, options?: { autoOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const autoOpen = options?.autoOpen ?? false; // DEFAULT: NÃO abre automaticamente

  useEffect(() => {
    // 🛡️ BYPASS: Qualquer usuário em /gestaofc é staff de gestão
    // Staff de gestão não deve ver tours automáticos (já conhecem o sistema)
    const isGestaoStaff = window.location.pathname.startsWith('/gestaofc');
    
    // 🛡️ v2: Owner bypass via role (não email no localStorage)
    // Não podemos verificar role no localStorage - marcar como completed para staff
    if (isGestaoStaff) {
      // Marca como completo para staff nunca mais ver
      localStorage.setItem(`tour_${tourId}_completed`, "true");
      return;
    }

    // Só abre automaticamente se autoOpen=true E não completou antes
    if (!autoOpen) return;

    const hasSeenTour = localStorage.getItem(`tour_${tourId}_completed`);
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [tourId, autoOpen]);

  const completeTour = () => {
    setIsOpen(false);
    localStorage.setItem(`tour_${tourId}_completed`, "true");
  };

  const resetTour = () => {
    localStorage.removeItem(`tour_${tourId}_completed`);
    setIsOpen(true);
  };

  return { isOpen, completeTour, resetTour, setIsOpen };
}

// Steps padrão para o dashboard
export const dashboardTourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Ecossistema! 🎉",
    description: "Este é o seu centro de comando. Aqui você terá uma visão geral de todas as suas métricas e atividades.",
  },
  {
    id: "sidebar",
    title: "Menu de Navegação",
    description: "Use o menu lateral para acessar todas as áreas do sistema: finanças, funcionários, alunos, e muito mais.",
    target: "[data-sidebar='menu']",
  },
  {
    id: "stats",
    title: "Visão Geral",
    description: "Estes cards mostram os principais indicadores em tempo real. Clique em qualquer um para ver mais detalhes.",
    target: ".stat-card",
  },
  {
    id: "charts",
    title: "Gráficos e Análises",
    description: "Visualize tendências e compare períodos para tomar decisões mais informadas.",
    target: ".recharts-wrapper",
  },
  {
    id: "ai-tutor",
    title: "Tutor de IA",
    description: "Clique no ícone de IA no canto inferior direito para acessar seu assistente virtual.",
  },
  {
    id: "complete",
    title: "Pronto para começar!",
    description: "Agora você conhece o básico. Explore as diferentes seções e descubra todo o potencial da plataforma. Bons estudos!",
  },
];
