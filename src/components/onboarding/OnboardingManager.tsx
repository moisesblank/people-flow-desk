// ============================================
// MOISES MEDEIROS v5.0 - ONBOARDING MANAGER
// Pilar 11: Documentação e Onboarding Inteligente
// ============================================

import { useState, useEffect, useCallback } from "react";
import { GuidedTour, TourStep } from "./GuidedTour";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Tour steps para diferentes áreas do sistema
export const systemTourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Sistema! 🚀",
    description: "Este é o seu centro de controle completo. Vamos fazer um tour rápido para você conhecer todas as funcionalidades disponíveis.",
  },
  {
    id: "sidebar",
    title: "Menu de Navegação",
    description: "Use o menu lateral para acessar todas as áreas: finanças, funcionários, alunos, marketing e muito mais. Os módulos estão organizados por categoria.",
    target: "[data-sidebar='menu']",
    position: "right",
  },
  {
    id: "search",
    title: "Busca Rápida",
    description: "Pressione Ctrl+K (ou ⌘+K no Mac) para abrir a busca rápida. Você pode encontrar qualquer página ou funcionalidade instantaneamente.",
    target: "[data-search-button]",
    position: "bottom",
  },
  {
    id: "notifications",
    title: "Central de Notificações 🔔",
    description: "Clique no sino para ver suas notificações em tempo real. Você será alertado sobre vendas, tarefas e eventos importantes.",
    target: "[data-notification-center]",
    position: "bottom",
  },
  {
    id: "dashboard-stats",
    title: "Métricas em Tempo Real",
    description: "Estes cards mostram os principais indicadores do seu negócio. Os valores são atualizados automaticamente.",
    target: ".stat-card",
    position: "bottom",
  },
  {
    id: "charts",
    title: "Gráficos Interativos 📊",
    description: "Os gráficos são interativos! Passe o mouse para ver detalhes e clique para explorar os dados.",
    target: ".recharts-wrapper",
    position: "top",
  },
  {
    id: "ai-tutor",
    title: "Assistente de IA 🤖",
    description: "Clique no botão de IA no canto inferior direito para acessar seu assistente virtual. Ele pode ajudar com dúvidas sobre o sistema.",
    position: "left",
  },
  {
    id: "complete",
    title: "Tudo Pronto! ✨",
    description: "Agora você conhece o básico. Explore as diferentes seções e descubra todo o potencial da plataforma. Dica: você pode reiniciar este tour nas Configurações.",
  },
];

// Tour específico para finanças
export const financeTourSteps: TourStep[] = [
  {
    id: "finance-intro",
    title: "Área Financeira 💰",
    description: "Aqui você controla todas as suas finanças pessoais e empresariais.",
  },
  {
    id: "income",
    title: "Entradas",
    description: "Registre todas as suas fontes de renda: vendas, salários, investimentos, etc.",
  },
  {
    id: "expenses",
    title: "Saídas",
    description: "Controle seus gastos por categoria para ter uma visão clara de onde seu dinheiro está indo.",
  },
  {
    id: "goals",
    title: "Metas Financeiras",
    description: "Defina metas e acompanhe seu progresso em tempo real.",
  },
];

interface OnboardingManagerProps {
  tourId?: string;
  customSteps?: TourStep[];
  children?: React.ReactNode;
}

export function OnboardingManager({ 
  tourId = "system-main", 
  customSteps,
  children 
}: OnboardingManagerProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(true);

  const steps = customSteps || systemTourSteps;
  const storageKey = `tour_${tourId}_completed_${user?.id || 'guest'}`;

  // Check if user has completed the tour
  useEffect(() => {
    if (!user?.id) return;

    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      // Delay to ensure page is loaded
      const timer = setTimeout(() => {
        setHasCompletedTour(false);
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
    setHasCompletedTour(true);
  }, [user?.id, storageKey]);

  const completeTour = useCallback(() => {
    setIsOpen(false);
    setHasCompletedTour(true);
    localStorage.setItem(storageKey, new Date().toISOString());
    toast.success("Tour concluído! Você pode reiniciá-lo nas Configurações.");
  }, [storageKey]);

  const skipTour = useCallback(() => {
    setIsOpen(false);
    setHasCompletedTour(true);
    localStorage.setItem(storageKey, "skipped");
  }, [storageKey]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasCompletedTour(false);
    setIsOpen(true);
    toast.info("Tour reiniciado!");
  }, [storageKey]);

  return (
    <>
      {children}
      <GuidedTour
        steps={steps}
        isOpen={isOpen}
        onComplete={completeTour}
        onSkip={skipTour}
      />
    </>
  );
}

// Hook para controlar o tour programaticamente
export function useOnboarding(tourId: string = "system-main") {
  const { user } = useAuth();
  const storageKey = `tour_${tourId}_completed_${user?.id || 'guest'}`;

  const [hasCompleted, setHasCompleted] = useState(() => {
    return !!localStorage.getItem(storageKey);
  });

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasCompleted(false);
    window.location.reload();
  }, [storageKey]);

  const markAsCompleted = useCallback(() => {
    localStorage.setItem(storageKey, new Date().toISOString());
    setHasCompleted(true);
  }, [storageKey]);

  return {
    hasCompleted,
    resetTour,
    markAsCompleted,
  };
}
