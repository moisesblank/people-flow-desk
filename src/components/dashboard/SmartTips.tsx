// ============================================
// SMART TIPS v2.0 - Dicas Inteligentes com IA
// Sugestões contextuais + Análise preditiva
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb, 
  X, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  DollarSign,
  Calendar,
  Brain,
  Sparkles,
  Zap,
  Users,
  GraduationCap,
  Rocket,
  Shield,
  Clock,
  BarChart3,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface Tip {
  id: string;
  icon: React.ElementType;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "tip" | "ai";
  priority: number;
  action?: () => void;
  actionLabel?: string;
}

interface SmartTipsProps {
  income: number;
  expenses: number;
  pendingTasks: number;
  pendingPayments: number;
  students?: number;
  affiliates?: number;
  onNavigate?: (path: string) => void;
}

export function SmartTips({ 
  income, 
  expenses, 
  pendingTasks, 
  pendingPayments,
  students = 0,
  affiliates = 0,
  onNavigate 
}: SmartTipsProps) {
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const { role } = useAuth();
  const isOwner = role === 'owner';

  const profit = income - expenses;
  const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;
  const profitMargin = income > 0 ? (profit / income) * 100 : 0;

  // Análise preditiva simples
  const predictedTrend = useMemo(() => {
    if (profitMargin > 30) return "excellent";
    if (profitMargin > 15) return "good";
    if (profitMargin > 0) return "attention";
    return "critical";
  }, [profitMargin]);

  // Generate contextual tips with AI-like analysis
  const generateTips = (): Tip[] => {
    const tips: Tip[] = [];

    // ===== FINANCIAL TIPS =====
    if (profit > 0 && profitMargin > 30) {
      tips.push({
        id: "high-profit",
        icon: TrendingUp,
        title: "Excelente Performance Financeira!",
        message: `Margem de ${profitMargin.toFixed(1)}%! Considere investir 30% em reserva estratégica e 20% em marketing.`,
        type: "success",
        priority: 1,
        action: () => onNavigate?.("/financas-empresa"),
        actionLabel: "Analisar Finanças"
      });
    } else if (profit > 0 && profitMargin < 15) {
      tips.push({
        id: "low-margin",
        icon: AlertTriangle,
        title: "Margem Apertada",
        message: `Margem de ${profitMargin.toFixed(1)}% está abaixo do ideal (15-20%). Revise custos fixos.`,
        type: "warning",
        priority: 2,
        action: () => onNavigate?.("/financas-empresa"),
        actionLabel: "Revisar Custos"
      });
    }

    if (expenseRatio > 85) {
      tips.push({
        id: "critical-expenses",
        icon: AlertTriangle,
        title: "⚠️ Alerta Crítico de Gastos",
        message: `Gastos em ${expenseRatio.toFixed(0)}% da receita! Risco de prejuízo. Ação imediata necessária.`,
        type: "warning",
        priority: 1,
        action: () => onNavigate?.("/financas-empresa"),
        actionLabel: "Ver Detalhes"
      });
    }

    // ===== PAYMENT TIPS =====
    if (pendingPayments > 5) {
      tips.push({
        id: "many-payments",
        icon: DollarSign,
        title: "Pagamentos Acumulando",
        message: `${pendingPayments} pagamentos pendentes podem gerar juros. Priorize os mais antigos!`,
        type: "warning",
        priority: 2,
        action: () => onNavigate?.("/pagamentos"),
        actionLabel: "Organizar Pagamentos"
      });
    } else if (pendingPayments > 0 && pendingPayments <= 3) {
      tips.push({
        id: "few-payments",
        icon: Clock,
        title: "Pagamentos em Dia",
        message: `Apenas ${pendingPayments} pagamento(s) pendente(s). Você está bem organizado!`,
        type: "info",
        priority: 4,
        action: () => onNavigate?.("/pagamentos"),
        actionLabel: "Ver Pagamentos"
      });
    }

    // ===== TASK TIPS =====
    if (pendingTasks > 15) {
      tips.push({
        id: "overloaded",
        icon: Target,
        title: "Sobrecarga de Tarefas",
        message: `${pendingTasks} tarefas acumuladas! Use a matriz Eisenhower: Urgente+Importante primeiro.`,
        type: "warning",
        priority: 2,
        action: () => onNavigate?.("/tarefas"),
        actionLabel: "Priorizar Tarefas"
      });
    } else if (pendingTasks > 5) {
      tips.push({
        id: "many-tasks",
        icon: Target,
        title: "Foco nas Prioridades",
        message: `${pendingTasks} tarefas aguardando. Que tal usar blocos de tempo focado?`,
        type: "info",
        priority: 3,
        action: () => onNavigate?.("/tarefas"),
        actionLabel: "Ver Tarefas"
      });
    }

    // ===== BUSINESS TIPS (Owner Only) =====
    if (isOwner) {
      if (students > 0 && students < 50) {
        tips.push({
          id: "grow-students",
          icon: GraduationCap,
          title: "Potencial de Crescimento",
          message: `${students} alunos ativos. Campanhas de indicação podem aumentar em 30%!`,
          type: "ai",
          priority: 3,
          action: () => onNavigate?.("/marketing"),
          actionLabel: "Ver Marketing"
        });
      }

      if (affiliates < 5) {
        tips.push({
          id: "grow-affiliates",
          icon: Users,
          title: "Expanda seu Time de Afiliados",
          message: "Programa de afiliados pode multiplicar vendas. Considere recrutar parceiros!",
          type: "ai",
          priority: 4,
          action: () => onNavigate?.("/afiliados"),
          actionLabel: "Gerenciar Afiliados"
        });
      }

      // AI Prediction tip
      tips.push({
        id: "ai-insight",
        icon: Brain,
        title: "Análise Inteligente",
        message: predictedTrend === "excellent" 
          ? "Tendência de crescimento detectada! Mantenha a estratégia atual."
          : predictedTrend === "good"
          ? "Performance estável. Oportunidade para otimizar processos."
          : predictedTrend === "attention"
          ? "Atenção recomendada. Revise suas métricas principais."
          : "Situação requer ação imediata. Acesse o Dashboard Executivo.",
        type: "ai",
        priority: predictedTrend === "critical" ? 1 : 5,
        action: () => onNavigate?.("/dashboard-executivo"),
        actionLabel: "Ver Análise"
      });
    }

    // ===== PRODUCTIVITY TIPS =====
    const productivityTips: Tip[] = [
      {
        id: "pomodoro",
        icon: Zap,
        title: "Técnica Pomodoro",
        message: "25min foco + 5min pausa = máxima produtividade. Repita 4x, depois 15min de descanso.",
        type: "tip",
        priority: 6
      },
      {
        id: "morning-focus",
        icon: Sparkles,
        title: "Horário de Ouro",
        message: "Manhã é o melhor momento para tarefas complexas. Aproveite sua energia máxima!",
        type: "tip",
        priority: 6
      },
      {
        id: "weekly-review",
        icon: Calendar,
        title: "Revisão Semanal",
        message: "15min no domingo planejando a semana aumenta produtividade em 25%!",
        type: "tip",
        priority: 6
      },
      {
        id: "automation",
        icon: Rocket,
        title: "Automatize o Repetitivo",
        message: "Configure automações para tarefas recorrentes e ganhe horas por semana!",
        type: "tip",
        priority: 6,
        action: () => onNavigate?.("/integracoes"),
        actionLabel: "Ver Automações"
      },
      {
        id: "metrics",
        icon: BarChart3,
        title: "Métricas são Poder",
        message: "Quem mede, melhora. Acompanhe seus KPIs diariamente na Central de Métricas.",
        type: "tip",
        priority: 6,
        action: () => onNavigate?.("/central-metricas"),
        actionLabel: "Ver Métricas"
      },
      {
        id: "security",
        icon: Shield,
        title: "Segurança Primeiro",
        message: "Mantenha seus dados protegidos. Use autenticação de dois fatores!",
        type: "tip",
        priority: 6
      }
    ];

    // Add random productivity tip
    tips.push(productivityTips[Math.floor(Math.random() * productivityTips.length)]);

    // Sort by priority (lower = more important)
    return tips.sort((a, b) => a.priority - b.priority);
  };

  const tips = useMemo(() => 
    generateTips().filter(tip => !dismissedTips.includes(tip.id)),
    [income, expenses, pendingTasks, pendingPayments, students, affiliates, dismissedTips, isOwner]
  );

  useEffect(() => {
    if (tips.length > 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex(prev => (prev + 1) % tips.length);
      }, 10000);
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
      case "ai":
        return "bg-[hsl(var(--stats-purple))]/10 border-[hsl(var(--stats-purple))]/30 text-[hsl(var(--stats-purple))]";
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
      {/* Header with AI badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Insights Inteligentes</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs text-primary">
          <Sparkles className="h-3 w-3" />
          <span>{tips.length} dicas</span>
        </div>
      </div>

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
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground">{currentTip?.title}</h4>
              {currentTip?.type === "ai" && (
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-[hsl(var(--stats-purple))]/20 text-[hsl(var(--stats-purple))]">
                  IA
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{currentTip?.message}</p>
            
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
