// ============================================
// WELCOME HERO - Boas-vindas Personalizadas
// Orientação clara para o usuário
// ============================================

import { motion } from "framer-motion";
import { 
  Sun, 
  Moon, 
  Sunset, 
  Coffee, 
  Rocket, 
  Target, 
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Brain
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface WelcomeHeroProps {
  pendingTasks: number;
  completedToday: number;
  pendingPayments: number;
  profit: number;
}

export function WelcomeHero({ pendingTasks, completedToday, pendingPayments, profit }: WelcomeHeroProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { text: "Boa madrugada", icon: Moon, emoji: "🌙" };
    if (hour < 12) return { text: "Bom dia", icon: Sun, emoji: "☀️" };
    if (hour < 18) return { text: "Boa tarde", icon: Sunset, emoji: "🌤️" };
    return { text: "Boa noite", icon: Moon, emoji: "🌙" };
  };

  const greeting = getGreeting();
  const userName = user?.user_metadata?.nome || user?.email?.split("@")[0] || "Mestre";
  
  // Determinar o foco do dia baseado na situação
  const getDailyFocus = () => {
    if (pendingPayments > 3) {
      return {
        type: "alert",
        title: "Atenção nas Finanças",
        message: `Você tem ${pendingPayments} pagamentos pendentes. Organize suas contas hoje!`,
        action: () => navigate("/pagamentos"),
        actionLabel: "Ver Pagamentos",
        icon: AlertTriangle,
        color: "text-[hsl(var(--stats-gold))]"
      };
    }
    if (pendingTasks > 5) {
      return {
        type: "tasks",
        title: "Foco nas Tarefas",
        message: `${pendingTasks} tarefas aguardando você. Comece pelas mais urgentes!`,
        action: () => navigate("/tarefas"),
        actionLabel: "Ver Tarefas",
        icon: Target,
        color: "text-[hsl(var(--stats-blue))]"
      };
    }
    if (profit > 0) {
      return {
        type: "success",
        title: "Excelente Performance!",
        message: `Lucro positivo este mês. Continue assim!`,
        action: () => navigate("/dashboard-executivo"),
        actionLabel: "Ver Detalhes",
        icon: TrendingUp,
        color: "text-[hsl(var(--stats-green))]"
      };
    }
    return {
      type: "neutral",
      title: "Pronto para Começar?",
      message: "Seu dia está organizado. Que tal revisar suas metas?",
      action: () => navigate("/calendario"),
      actionLabel: "Ver Agenda",
      icon: Coffee,
      color: "text-primary"
    };
  };

  const focus = getDailyFocus();
  const FocusIcon = focus.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 p-6 md:p-8"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mb-2"
            >
              <span className="text-2xl">{greeting.emoji}</span>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {greeting.text}, <span className="text-primary">{userName}</span>
              </h1>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground"
            >
              {new Date().toLocaleDateString("pt-BR", { 
                weekday: "long", 
                day: "numeric", 
                month: "long" 
              })}
            </motion.p>
          </div>

          {/* Quick Stats Pills */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--stats-green))]/10 border border-[hsl(var(--stats-green))]/20">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--stats-green))]" />
              <span className="text-sm font-medium text-[hsl(var(--stats-green))]">
                {completedToday} concluídas hoje
              </span>
            </div>
            {pendingTasks > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--stats-blue))]/10 border border-[hsl(var(--stats-blue))]/20">
                <Target className="h-4 w-4 text-[hsl(var(--stats-blue))]" />
                <span className="text-sm font-medium text-[hsl(var(--stats-blue))]">
                  {pendingTasks} pendentes
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Daily Focus Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-background/50 border border-border/50"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-background ${focus.color}`}>
              <FocusIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{focus.title}</h3>
              <p className="text-sm text-muted-foreground">{focus.message}</p>
            </div>
          </div>
          <Button onClick={focus.action} variant="outline" className="gap-2 shrink-0">
            <Rocket className="h-4 w-4" />
            {focus.actionLabel}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
