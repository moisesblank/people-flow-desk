// ============================================
// SMART TIPS - Dicas Inteligentes Contextuais
// Sugestões baseadas no estado atual
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb, 
  X, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Target,
  DollarSign,
  Calendar,
  Brain,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tip {
  id: string;
  icon: React.ElementType;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "tip";
  action?: () => void;
  actionLabel?: string;
}

interface SmartTipsProps {
  income: number;
  expenses: number;
  pendingTasks: number;
  pendingPayments: number;
  onNavigate?: (path: string) => void;
}

export function SmartTips({ 
  income, 
  expenses, 
  pendingTasks, 
  pendingPayments,
  onNavigate 
}: SmartTipsProps) {
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const profit = income - expenses;
  const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;

  // Generate contextual tips
  const generateTips = (): Tip[] => {
    const tips: Tip[] = [];

    // Financial tips
    if (profit > 0 && profit > income * 0.3) {
      tips.push({
        id: "high-profit",
        icon: TrendingUp,
        title: "Excelente margem!",
        message: "Sua margem de lucro está acima de 30%. Considere investir parte em reserva de emergência.",
        type: "success",
        action: () => onNavigate?.("/financas-pessoais"),
        actionLabel: "Ver finanças"
      });
    }

    if (expenseRatio > 80) {
      tips.push({
        id: "high-expenses",
        icon: AlertTriangle,
        title: "Atenção com gastos",
        message: `Você está usando ${expenseRatio.toFixed(0)}% da receita. Revise despesas não essenciais.`,
        type: "warning",
        action: () => onNavigate?.("/financas-pessoais"),
        actionLabel: "Revisar gastos"
      });
    }

    if (pendingPayments > 3) {
      tips.push({
        id: "pending-payments",
        icon: DollarSign,
        title: "Pagamentos pendentes",
        message: `Você tem ${pendingPayments} pagamentos aguardando. Organize antes do vencimento!`,
        type: "warning",
        action: () => onNavigate?.("/pagamentos"),
        actionLabel: "Ver pagamentos"
      });
    }

    if (pendingTasks > 10) {
      tips.push({
        id: "many-tasks",
        icon: Target,
        title: "Muitas tarefas acumuladas",
        message: "Priorize as tarefas urgentes e delegue o que for possível.",
        type: "info",
        action: () => onNavigate?.("/tarefas"),
        actionLabel: "Organizar tarefas"
      });
    }

    // Always add a motivational tip
    const motivationalTips = [
      {
        id: "focus-1",
        icon: Brain,
        title: "Dica de produtividade",
        message: "Técnica Pomodoro: 25min de foco + 5min de pausa. Repita 4x, depois descanse 15min.",
        type: "tip" as const
      },
      {
        id: "focus-2",
        icon: Sparkles,
        title: "Organize seu dia",
        message: "Faça as tarefas mais difíceis pela manhã, quando sua energia está no máximo.",
        type: "tip" as const
      },
      {
        id: "focus-3",
        icon: Calendar,
        title: "Planejamento semanal",
        message: "Reserve 15 minutos no domingo para planejar a semana. Aumenta produtividade em 25%!",
        type: "tip" as const
      }
    ];

    tips.push(motivationalTips[Math.floor(Math.random() * motivationalTips.length)]);

    return tips;
  };

  const tips = generateTips().filter(tip => !dismissedTips.includes(tip.id));

  useEffect(() => {
    if (tips.length > 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex(prev => (prev + 1) % tips.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [tips.length]);

  const dismissTip = (tipId: string) => {
    setDismissedTips(prev => [...prev, tipId]);
    if (currentTipIndex >= tips.length - 1) {
      setCurrentTipIndex(0);
    }
  };

  if (tips.length === 0) return null;

  const currentTip = tips[currentTipIndex];
  const TipIcon = currentTip?.icon || Lightbulb;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-[hsl(var(--stats-green))]/10 border-[hsl(var(--stats-green))]/30 text-[hsl(var(--stats-green))]";
      case "warning":
        return "bg-[hsl(var(--stats-gold))]/10 border-[hsl(var(--stats-gold))]/30 text-[hsl(var(--stats-gold))]";
      case "tip":
        return "bg-primary/10 border-primary/30 text-primary";
      default:
        return "bg-[hsl(var(--stats-blue))]/10 border-[hsl(var(--stats-blue))]/30 text-[hsl(var(--stats-blue))]";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTip?.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={`relative flex items-start gap-4 p-4 rounded-xl border ${getTypeStyles(currentTip?.type || "info")}`}
        >
          <div className="p-2 rounded-lg bg-background/50">
            <TipIcon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground mb-1">{currentTip?.title}</h4>
            <p className="text-sm text-muted-foreground">{currentTip?.message}</p>
            
            {currentTip?.action && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={currentTip.action}
                className="mt-2 h-auto p-0 gap-1"
              >
                {currentTip.actionLabel}
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-50 hover:opacity-100"
            onClick={() => currentTip && dismissTip(currentTip.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      </AnimatePresence>

      {/* Dots indicator */}
      {tips.length > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {tips.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTipIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentTipIndex 
                  ? "w-4 bg-primary" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
