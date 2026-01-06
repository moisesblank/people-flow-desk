// ============================================
// AI INSIGHTS WIDGET v1.0
// Widget com insights inteligentes da IA
// Análise preditiva e recomendações
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Target,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InsightData {
  income: number;
  expenses: number;
  pendingTasks: number;
  pendingPayments: number;
  students: number;
  employees: number;
}

interface Insight {
  id: string;
  type: "success" | "warning" | "info" | "action";
  icon: typeof Brain;
  title: string;
  message: string;
  action?: {
    label: string;
    path: string;
  };
  priority: number;
}

interface AIInsightsWidgetProps {
  data: InsightData;
  onNavigate?: (path: string) => void;
  className?: string;
}

export function AIInsightsWidget({ data, onNavigate, className }: AIInsightsWidgetProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Gera insights baseados nos dados
  const generateInsights = (): Insight[] => {
    const generatedInsights: Insight[] = [];
    const { income, expenses, pendingTasks, pendingPayments, students, employees } = data;
    
    const profit = income - expenses;
    const profitMargin = income > 0 ? (profit / income) * 100 : 0;

    // Insight de lucro
    if (profit > 0 && profitMargin > 20) {
      generatedInsights.push({
        id: "high-profit",
        type: "success",
        icon: TrendingUp,
        title: "Excelente Performance!",
        message: `Margem de lucro de ${profitMargin.toFixed(1)}% este mês. Continue assim!`,
        action: { label: "Ver Relatório", path: "/relatorios" },
        priority: 1,
      });
    } else if (profit < 0) {
      generatedInsights.push({
        id: "negative-profit",
        type: "warning",
        icon: AlertTriangle,
        title: "Atenção: Balanço Negativo",
        message: `Despesas superaram receitas. Revise os gastos para equilibrar.`,
        action: { label: "Analisar Gastos", path: "/financas-empresa" },
        priority: 10,
      });
    }

    // Insight de tarefas
    if (pendingTasks > 5) {
      generatedInsights.push({
        id: "many-tasks",
        type: "action",
        icon: Target,
        title: "Foco nas Prioridades",
        message: `${pendingTasks} tarefas pendentes. Comece pelas mais urgentes.`,
        action: { label: "Ver Tarefas", path: "/tarefas" },
        priority: 5,
      });
    } else if (pendingTasks === 0) {
      generatedInsights.push({
        id: "no-tasks",
        type: "success",
        icon: CheckCircle2,
        title: "Tudo em Dia!",
        message: "Nenhuma tarefa pendente. Que tal planejar a próxima semana?",
        action: { label: "Planejar", path: "/calendario" },
        priority: 3,
      });
    }

    // Insight de pagamentos
    if (pendingPayments > 0) {
      generatedInsights.push({
        id: "pending-payments",
        type: pendingPayments > 3 ? "warning" : "info",
        icon: AlertTriangle,
        title: `${pendingPayments} Pagamento${pendingPayments > 1 ? "s" : ""} Pendente${pendingPayments > 1 ? "s" : ""}`,
        message: "Organize suas contas para evitar atrasos e multas.",
        action: { label: "Ver Pagamentos", path: "/pagamentos" },
        priority: pendingPayments > 3 ? 8 : 4,
      });
    }

    // Insight de alunos
    if (students > 0) {
      generatedInsights.push({
        id: "student-growth",
        type: "info",
        icon: Sparkles,
        title: "Base de Alunos Ativa",
        message: `${students} alunos cadastrados. Que tal enviar uma comunicação?`,
        action: { label: "Ver Alunos", path: "/gestaofc/alunos" },
        priority: 6,
      });
    }

    // Insight de automação
    generatedInsights.push({
      id: "automation-tip",
      type: "info",
      icon: Zap,
      title: "Dica de Automação",
      message: "Use o WhatsApp para automatizar lembretes de pagamentos.",
      action: { label: "Central WhatsApp", path: "/central-whatsapp" },
      priority: 7,
    });

    return generatedInsights.sort((a, b) => a.priority - b.priority);
  };

  useEffect(() => {
    setIsLoading(true);
    // Simula processamento da IA
    const timer = setTimeout(() => {
      setInsights(generateInsights());
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [data]);

  // Rotação automática dos insights
  useEffect(() => {
    if (insights.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [insights.length]);

  const currentInsight = insights[currentIndex];
  
  const typeStyles = {
    success: "border-[hsl(var(--stats-green))]/30 bg-[hsl(var(--stats-green))]/5",
    warning: "border-[hsl(var(--stats-gold))]/30 bg-[hsl(var(--stats-gold))]/5",
    info: "border-primary/30 bg-primary/5",
    action: "border-[hsl(var(--stats-blue))]/30 bg-[hsl(var(--stats-blue))]/5",
  };

  const iconStyles = {
    success: "text-[hsl(var(--stats-green))] bg-[hsl(var(--stats-green))]/10",
    warning: "text-[hsl(var(--stats-gold))] bg-[hsl(var(--stats-gold))]/10",
    info: "text-primary bg-primary/10",
    action: "text-[hsl(var(--stats-blue))] bg-[hsl(var(--stats-blue))]/10",
  };

  if (isLoading) {
    return (
      <div className={cn("glass-card rounded-2xl p-6", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/20">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <span className="font-semibold text-foreground">Analisando dados...</span>
        </div>
        <div className="h-24 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentInsight) return null;

  const InsightIcon = currentInsight.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-card rounded-2xl p-6", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/20">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Insights Inteligentes</h3>
            <p className="text-xs text-muted-foreground">Powered by AI</p>
          </div>
        </div>
        
        {insights.length > 1 && (
          <div className="flex items-center gap-1.5">
            {insights.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex ? "bg-primary w-4" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Current Insight */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentInsight.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "p-4 rounded-xl border transition-all cursor-pointer group",
            typeStyles[currentInsight.type]
          )}
          onClick={() => currentInsight.action && onNavigate?.(currentInsight.action.path)}
        >
          <div className="flex items-start gap-4">
            <div className={cn("p-2.5 rounded-xl", iconStyles[currentInsight.type])}>
              <InsightIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {currentInsight.title}
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  {currentInsight.type === "success" && "Positivo"}
                  {currentInsight.type === "warning" && "Alerta"}
                  {currentInsight.type === "info" && "Info"}
                  {currentInsight.type === "action" && "Ação"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{currentInsight.message}</p>
              
              {currentInsight.action && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 -ml-2 text-primary hover:bg-primary/10 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.(currentInsight.action!.path);
                  }}
                >
                  {currentInsight.action.label}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <div className="text-lg font-bold text-foreground">{insights.length}</div>
          <div className="text-[10px] text-muted-foreground">Insights</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <div className="text-lg font-bold text-[hsl(var(--stats-green))]">
            {insights.filter(i => i.type === "success").length}
          </div>
          <div className="text-[10px] text-muted-foreground">Positivos</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <div className="text-lg font-bold text-[hsl(var(--stats-gold))]">
            {insights.filter(i => i.type === "warning" || i.type === "action").length}
          </div>
          <div className="text-[10px] text-muted-foreground">Atenção</div>
        </div>
      </div>
    </motion.div>
  );
}
