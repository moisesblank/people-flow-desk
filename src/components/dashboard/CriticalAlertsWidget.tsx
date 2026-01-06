// ============================================
// EMPRESARIAL 2.0 - ALERTAS CRÍTICOS INTELIGENTES
// Monitoramento proativo com IA preditiva
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  DollarSign,
  Calendar,
  Users,
  TrendingDown,
  Clock,
  CheckCircle2,
  X,
  ChevronRight,
  Zap,
  ShieldAlert,
  Target,
  AlertOctagon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CriticalAlert {
  id: string;
  type: "urgent" | "warning" | "info" | "success";
  category: "financial" | "task" | "student" | "payment" | "system" | "goal";
  title: string;
  description: string;
  impact: string;
  actionLabel: string;
  actionPath: string;
  priority: number;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export function CriticalAlertsWidget() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    generateSmartAlerts();
  }, [user?.id]);

  const generateSmartAlerts = async () => {
    setIsLoading(true);
    const generatedAlerts: CriticalAlert[] = [];

    try {
      // 1. Check overdue payments
      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("status", "pendente")
        .lt("data_vencimento", new Date().toISOString().split("T")[0]);

      if (payments && payments.length > 0) {
        const totalOverdue = payments.reduce((sum, p) => sum + (p.valor || 0), 0);
        generatedAlerts.push({
          id: "overdue-payments",
          type: "urgent",
          category: "payment",
          title: `${payments.length} pagamento(s) vencido(s)`,
          description: `Total em atraso: R$ ${(totalOverdue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          impact: "Risco de juros e multas. Regularize imediatamente.",
          actionLabel: "Ver pagamentos",
          actionPath: "/pagamentos",
          priority: 1,
          timestamp: new Date(),
          resolved: false,
        });
      }

      // 2. Check upcoming payments (next 7 days)
      const nextWeek = addDays(new Date(), 7).toISOString().split("T")[0];
      const { data: upcomingPayments } = await supabase
        .from("payments")
        .select("*")
        .eq("status", "pendente")
        .gte("data_vencimento", new Date().toISOString().split("T")[0])
        .lte("data_vencimento", nextWeek);

      if (upcomingPayments && upcomingPayments.length > 0) {
        generatedAlerts.push({
          id: "upcoming-payments",
          type: "warning",
          category: "payment",
          title: `${upcomingPayments.length} pagamento(s) esta semana`,
          description: "Pagamentos vencem nos próximos 7 dias",
          impact: "Planeje seu fluxo de caixa para evitar atrasos.",
          actionLabel: "Planejar",
          actionPath: "/pagamentos",
          priority: 3,
          timestamp: new Date(),
          resolved: false,
        });
      }

      // 3. Check overdue tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .neq("status", "done")
        .lt("due_date", new Date().toISOString().split("T")[0]);

      if (tasks && tasks.length > 0) {
        const urgentTasks = tasks.filter((t) => t.priority === "urgent" || t.priority === "high");
        generatedAlerts.push({
          id: "overdue-tasks",
          type: urgentTasks.length > 0 ? "urgent" : "warning",
          category: "task",
          title: `${tasks.length} tarefa(s) atrasada(s)`,
          description: urgentTasks.length > 0 
            ? `${urgentTasks.length} são de alta prioridade!` 
            : "Reorganize suas prioridades",
          impact: "Tarefas atrasadas afetam produtividade e entregas.",
          actionLabel: "Ver tarefas",
          actionPath: "/tarefas",
          priority: 2,
          timestamp: new Date(),
          resolved: false,
        });
      }

      // 4. Check financial health (expenses > 80% income)
      const { data: incomeData } = await supabase.from("income").select("valor");
      const { data: personalExpenses } = await supabase.from("personal_extra_expenses").select("valor");
      const { data: companyExpenses } = await supabase.from("company_extra_expenses").select("valor");

      const totalIncome = incomeData?.reduce((sum, i) => sum + (i.valor || 0), 0) || 0;
      const totalExpenses = 
        (personalExpenses?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0) +
        (companyExpenses?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0);

      if (totalIncome > 0) {
        const expenseRatio = (totalExpenses / totalIncome) * 100;
        
        if (expenseRatio > 100) {
          generatedAlerts.push({
            id: "budget-exceeded",
            type: "urgent",
            category: "financial",
            title: "Orçamento estourado!",
            description: `Gastos ${expenseRatio.toFixed(0)}% da receita`,
            impact: "Você está gastando mais do que recebe. Ação imediata necessária!",
            actionLabel: "Analisar finanças",
            actionPath: "/financas-empresa",
            priority: 1,
            timestamp: new Date(),
            resolved: false,
            metadata: { expenseRatio },
          });
        } else if (expenseRatio > 80) {
          generatedAlerts.push({
            id: "budget-warning",
            type: "warning",
            category: "financial",
            title: "Gastos elevados",
            description: `Gastos em ${expenseRatio.toFixed(0)}% da receita`,
            impact: "Considere reduzir despesas não essenciais.",
            actionLabel: "Ver despesas",
            actionPath: "/financas-empresa",
            priority: 4,
            timestamp: new Date(),
            resolved: false,
            metadata: { expenseRatio },
          });
        }
      }

      // 5. Check calendar tasks for today
      const today = new Date().toISOString().split("T")[0];
      const { data: todayTasks } = await supabase
        .from("calendar_tasks")
        .select("*")
        .eq("task_date", today)
        .eq("is_completed", false);

      if (todayTasks && todayTasks.length > 0) {
        generatedAlerts.push({
          id: "today-agenda",
          type: "info",
          category: "task",
          title: `${todayTasks.length} compromisso(s) hoje`,
          description: "Não esqueça da sua agenda de hoje",
          impact: "Mantenha-se organizado e pontual.",
          actionLabel: "Ver agenda",
          actionPath: "/calendario",
          priority: 5,
          timestamp: new Date(),
          resolved: false,
        });
      }

      // 6. Check low student engagement (if applicable)
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("progress_percentage")
        .lt("progress_percentage", 30);

      if (enrollments && enrollments.length > 5) {
        generatedAlerts.push({
          id: "low-engagement",
          type: "warning",
          category: "student",
          title: `${enrollments.length} alunos com baixo engajamento`,
          description: "Alunos com menos de 30% de progresso",
          impact: "Risco de evasão. Considere ações de reengajamento.",
          actionLabel: "Ver alunos",
          actionPath: "/gestaofc/alunos",
          priority: 4,
          timestamp: new Date(),
          resolved: false,
        });
      }

      // Sort by priority
      generatedAlerts.sort((a, b) => a.priority - b.priority);
      setAlerts(generatedAlerts);

    } catch (error) {
      console.error("Error generating alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissAlert = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const getAlertIcon = (type: CriticalAlert["type"], category: CriticalAlert["category"]) => {
    if (category === "financial") return DollarSign;
    if (category === "payment") return DollarSign;
    if (category === "task") return Calendar;
    if (category === "student") return Users;
    if (category === "goal") return Target;
    
    switch (type) {
      case "urgent": return AlertOctagon;
      case "warning": return AlertTriangle;
      case "success": return CheckCircle2;
      default: return Bell;
    }
  };

  const getAlertStyles = (type: CriticalAlert["type"]) => {
    switch (type) {
      case "urgent":
        return {
          bg: "bg-destructive/10",
          border: "border-destructive/50",
          icon: "text-destructive",
          badge: "bg-destructive text-destructive-foreground",
        };
      case "warning":
        return {
          bg: "bg-[hsl(var(--stats-gold))]/10",
          border: "border-[hsl(var(--stats-gold))]/50",
          icon: "text-[hsl(var(--stats-gold))]",
          badge: "bg-[hsl(var(--stats-gold))] text-white",
        };
      case "success":
        return {
          bg: "bg-[hsl(var(--stats-green))]/10",
          border: "border-[hsl(var(--stats-green))]/50",
          icon: "text-[hsl(var(--stats-green))]",
          badge: "bg-[hsl(var(--stats-green))] text-white",
        };
      default:
        return {
          bg: "bg-[hsl(var(--stats-blue))]/10",
          border: "border-[hsl(var(--stats-blue))]/50",
          icon: "text-[hsl(var(--stats-blue))]",
          badge: "bg-[hsl(var(--stats-blue))] text-white",
        };
    }
  };

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id));
  const urgentCount = visibleAlerts.filter(a => a.type === "urgent").length;

  if (isLoading) {
    return (
      <Card className="glass-card animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/50 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${urgentCount > 0 ? "bg-destructive/20" : "bg-primary/20"}`}>
              <ShieldAlert className={`h-5 w-5 ${urgentCount > 0 ? "text-destructive" : "text-primary"}`} />
            </div>
            <div>
              <CardTitle className="text-lg">Alertas Inteligentes</CardTitle>
              <p className="text-xs text-muted-foreground">
                {visibleAlerts.length} alerta(s) ativo(s)
              </p>
            </div>
          </div>
          {urgentCount > 0 && (
            <Badge className="bg-destructive animate-pulse">
              {urgentCount} urgente(s)
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {visibleAlerts.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-[hsl(var(--stats-green))]" />
            <p className="text-sm font-medium text-foreground">Tudo em ordem!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nenhum alerta crítico no momento
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <div className="p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {visibleAlerts.map((alert, index) => {
                  const Icon = getAlertIcon(alert.type, alert.category);
                  const styles = getAlertStyles(alert.type);

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative p-3 rounded-xl border ${styles.bg} ${styles.border} transition-all hover:shadow-md`}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg ${styles.bg} shrink-0`}>
                          <Icon className={`h-4 w-4 ${styles.icon}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold">{alert.title}</p>
                                <Badge className={`text-[10px] px-1.5 py-0 h-4 ${styles.badge}`}>
                                  {alert.type === "urgent" ? "URGENTE" : alert.type.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{alert.description}</p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1 italic">
                                💡 {alert.impact}
                              </p>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100"
                              onClick={() => dismissAlert(alert.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs text-primary"
                              onClick={() => navigate(alert.actionPath)}
                            >
                              {alert.actionLabel}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
