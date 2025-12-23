// ============================================
// MOISES MEDEIROS v5.0 - EMPTY STATES
// Pilar 3: Design Premium com ilustrações contextuais
// 🏛️ LEI I: useQuantumReactivity aplicado
// ============================================

import { motion } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { 
  FileQuestion, 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Bell,
  Search,
  Inbox,
  FolderOpen,
  type LucideIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "compact";
  className?: string;
}

// Preset configurations for common empty states
export const emptyStatePresets = {
  noData: {
    icon: FileQuestion,
    title: "Nenhum dado encontrado",
    description: "Não encontramos informações para exibir aqui."
  },
  noUsers: {
    icon: Users,
    title: "Nenhum usuário",
    description: "Ainda não há usuários cadastrados no sistema."
  },
  noEvents: {
    icon: Calendar,
    title: "Agenda vazia",
    description: "Você não tem eventos agendados para este período."
  },
  noPayments: {
    icon: CreditCard,
    title: "Nenhum pagamento",
    description: "Não há pagamentos registrados para exibir."
  },
  noReports: {
    icon: BarChart3,
    title: "Sem relatórios",
    description: "Os relatórios aparecerão aqui quando houver dados suficientes."
  },
  noNotifications: {
    icon: Bell,
    title: "Tudo em dia!",
    description: "Você não tem notificações pendentes."
  },
  noSearchResults: {
    icon: Search,
    title: "Nenhum resultado",
    description: "Tente ajustar os filtros ou termos de busca."
  },
  emptyInbox: {
    icon: Inbox,
    title: "Caixa vazia",
    description: "Você está em dia com suas mensagens!"
  },
  emptyFolder: {
    icon: FolderOpen,
    title: "Pasta vazia",
    description: "Esta pasta ainda não contém arquivos."
  }
};

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
  className
}: EmptyStateProps) {
  const isCompact = variant === "compact";
  const { shouldAnimate, gpuAnimationProps } = useQuantumReactivity();

  return (
    <motion.div
      {...(shouldAnimate ? gpuAnimationProps.fadeUp : {})}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isCompact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
    >
      {/* Animated Icon Container */}
      <motion.div
        {...(shouldAnimate ? gpuAnimationProps.scaleIn : {})}
        className={cn(
          "relative rounded-full bg-muted/50 flex items-center justify-center mb-6",
          isCompact ? "w-16 h-16" : "w-24 h-24"
        )}
      >
        {/* Glow effect */}
        {shouldAnimate && (
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
        )}
        
        <Icon 
          className={cn(
            "text-muted-foreground relative z-10",
            isCompact ? "h-8 w-8" : "h-12 w-12"
          )} 
        />
      </motion.div>

      {/* Title */}
      <motion.h3
        {...(shouldAnimate ? gpuAnimationProps.fadeIn : {})}
        className={cn(
          "font-semibold text-foreground mb-2",
          isCompact ? "text-lg" : "text-xl"
        )}
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "text-muted-foreground max-w-sm",
          isCompact ? "text-sm" : "text-base"
        )}
      >
        {description}
      </motion.p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Button
            onClick={onAction}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// Convenience component using presets
export function PresetEmptyState({
  preset,
  actionLabel,
  onAction,
  variant,
  className
}: {
  preset: keyof typeof emptyStatePresets;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "compact";
  className?: string;
}) {
  const config = emptyStatePresets[preset];
  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      actionLabel={actionLabel}
      onAction={onAction}
      variant={variant}
      className={className}
    />
  );
}
