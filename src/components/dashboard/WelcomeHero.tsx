// ============================================
// WELCOME HERO - Boas-vindas Personalizadas v3.0
// Com imagem de fundo, animações avançadas
// Todos os elementos clicáveis e interativos
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
  Brain,
  ChevronRight,
  Calendar,
  Clock,
  Zap
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import dashboardHeroImage from "@/assets/dashboard-chemistry-hero.jpg";

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
    if (hour < 6) return { text: "Boa madrugada", icon: Moon, emoji: "🌙", period: "madrugada" };
    if (hour < 12) return { text: "Bom dia", icon: Sun, emoji: "☀️", period: "manhã" };
    if (hour < 18) return { text: "Boa tarde", icon: Sunset, emoji: "🌤️", period: "tarde" };
    return { text: "Boa noite", icon: Moon, emoji: "🌙", period: "noite" };
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
        color: "text-[hsl(var(--stats-gold))]",
        bgColor: "bg-[hsl(var(--stats-gold))]/10"
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
        color: "text-[hsl(var(--stats-blue))]",
        bgColor: "bg-[hsl(var(--stats-blue))]/10"
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
        color: "text-[hsl(var(--stats-green))]",
        bgColor: "bg-[hsl(var(--stats-green))]/10"
      };
    }
    return {
      type: "neutral",
      title: "Pronto para Começar?",
      message: "Seu dia está organizado. Que tal revisar suas metas?",
      action: () => navigate("/calendario"),
      actionLabel: "Ver Agenda",
      icon: Coffee,
      color: "text-primary",
      bgColor: "bg-primary/10"
    };
  };

  const focus = getDailyFocus();
  const FocusIcon = focus.icon;
  const GreetingIcon = greeting.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl h-64 md:h-72"
    >
      {/* Background Image */}
      <img 
        src={dashboardHeroImage} 
        alt="Dashboard Hero" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 right-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 right-1/4 w-24 h-24 rounded-full bg-secondary/10 blur-2xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-center p-6 md:p-8">
        {/* Greeting */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-4">
            {/* Time & Greeting */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/20 backdrop-blur-sm">
                  <GreetingIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("pt-BR", { 
                      weekday: "long", 
                      day: "numeric", 
                      month: "long" 
                    })}
                  </span>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {greeting.text}, <span className="text-primary">{userName}</span>!
              </h1>
            </motion.div>

            {/* Daily Focus Card - CLICÁVEL */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-background/60 backdrop-blur-sm border border-border/50 cursor-pointer hover:bg-background/80 hover:border-primary/30 transition-all group max-w-xl"
              onClick={focus.action}
            >
              <div className={`p-3 rounded-xl ${focus.bgColor} ${focus.color} group-hover:scale-105 transition-transform`}>
                <FocusIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{focus.title}</h3>
                <p className="text-sm text-muted-foreground">{focus.message}</p>
              </div>
              <Button 
                onClick={(e) => { e.stopPropagation(); focus.action(); }} 
                variant="outline" 
                size="sm"
                className="gap-1 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              >
                <Rocket className="h-4 w-4" />
                {focus.actionLabel}
              </Button>
            </motion.div>
          </div>

          {/* Quick Stats Pills - TODOS CLICÁVEIS */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2 lg:flex-col lg:items-end"
          >
            {/* Concluídas hoje - clicável */}
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--stats-green))]/10 border border-[hsl(var(--stats-green))]/20 cursor-pointer hover:bg-[hsl(var(--stats-green))]/20 hover:border-[hsl(var(--stats-green))]/40 transition-all group backdrop-blur-sm"
              onClick={() => navigate("/tarefas")}
            >
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--stats-green))]" />
              <span className="text-sm font-medium text-[hsl(var(--stats-green))]">
                {completedToday} concluídas
              </span>
              <ChevronRight className="h-3 w-3 text-[hsl(var(--stats-green))] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            {/* Pendentes - clicável */}
            {pendingTasks > 0 && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--stats-blue))]/10 border border-[hsl(var(--stats-blue))]/20 cursor-pointer hover:bg-[hsl(var(--stats-blue))]/20 hover:border-[hsl(var(--stats-blue))]/40 transition-all group backdrop-blur-sm"
                onClick={() => navigate("/tarefas")}
              >
                <Target className="h-4 w-4 text-[hsl(var(--stats-blue))]" />
                <span className="text-sm font-medium text-[hsl(var(--stats-blue))]">
                  {pendingTasks} pendentes
                </span>
                <ChevronRight className="h-3 w-3 text-[hsl(var(--stats-blue))] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}

            {/* Pagamentos pendentes - clicável */}
            {pendingPayments > 0 && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--stats-gold))]/10 border border-[hsl(var(--stats-gold))]/20 cursor-pointer hover:bg-[hsl(var(--stats-gold))]/20 hover:border-[hsl(var(--stats-gold))]/40 transition-all group backdrop-blur-sm"
                onClick={() => navigate("/financas-empresa")}
              >
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
                <span className="text-sm font-medium text-[hsl(var(--stats-gold))]">
                  {pendingPayments} pagamentos
                </span>
                <ChevronRight className="h-3 w-3 text-[hsl(var(--stats-gold))] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}

            {/* Calendário - sempre visível */}
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 hover:border-primary/40 transition-all group backdrop-blur-sm"
              onClick={() => navigate("/calendario")}
            >
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Agenda</span>
              <ChevronRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
