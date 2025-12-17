// ============================================
// MOISÉS MEDEIROS v10.0 - AI INSIGHTS PANEL
// Painel de insights inteligentes com TRAMON IA
// Alertas em tempo real e recomendações
// ============================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  DollarSign,
  Users,
  Clock,
  Zap,
  MessageSquare,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Bell,
  Eye,
  BarChart3,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Insight {
  id: string;
  type: "success" | "warning" | "info" | "tip";
  title: string;
  description: string;
  metric?: string;
  change?: number;
  action?: string;
  icon: typeof Brain;
  priority: number;
  timestamp: Date;
}

interface Alert {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  message: string;
  icon: typeof AlertTriangle;
  timestamp: Date;
  read: boolean;
}

interface AIInsightsPanelProps {
  financialData?: {
    receita: number;
    despesa: number;
    saldo: number;
  };
  socialData?: {
    totalFollowers: number;
    totalEngagement: number;
  };
  taskData?: {
    pending: number;
    overdue: number;
  };
}

export function AIInsightsPanel({ financialData, socialData, taskData }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Generate insights based on data
  const generateInsights = useCallback(() => {
    const newInsights: Insight[] = [];
    
    // Financial insights
    if (financialData) {
      const { receita, despesa, saldo } = financialData;
      const lucratividade = receita > 0 ? ((receita - despesa) / receita * 100) : 0;
      
      if (saldo > 10000) {
        newInsights.push({
          id: "saldo_positivo",
          type: "success",
          title: "Saldo Saudável",
          description: `Seu saldo de R$ ${saldo.toLocaleString('pt-BR')} está ótimo! Continue assim.`,
          metric: `R$ ${saldo.toLocaleString('pt-BR')}`,
          change: 12.5,
          icon: DollarSign,
          priority: 1,
          timestamp: new Date()
        });
      } else if (saldo < 0) {
        newInsights.push({
          id: "saldo_negativo",
          type: "warning",
          title: "Atenção: Saldo Negativo",
          description: "Seu saldo está negativo. Considere revisar despesas.",
          metric: `R$ ${saldo.toLocaleString('pt-BR')}`,
          action: "Revisar despesas",
          icon: AlertTriangle,
          priority: 10,
          timestamp: new Date()
        });
      }
      
      if (lucratividade > 30) {
        newInsights.push({
          id: "alta_lucratividade",
          type: "success",
          title: "Alta Lucratividade",
          description: `Margem de lucro de ${lucratividade.toFixed(1)}% - excelente performance!`,
          change: lucratividade,
          icon: TrendingUp,
          priority: 2,
          timestamp: new Date()
        });
      }
      
      if (despesa > receita * 0.8) {
        newInsights.push({
          id: "despesas_altas",
          type: "warning",
          title: "Despesas Elevadas",
          description: "Despesas representam mais de 80% da receita. Considere otimizar custos.",
          action: "Analisar gastos",
          icon: TrendingDown,
          priority: 8,
          timestamp: new Date()
        });
      }
    }
    
    // Social media insights
    if (socialData) {
      const { totalFollowers, totalEngagement } = socialData;
      
      if (totalEngagement > 5) {
        newInsights.push({
          id: "alto_engajamento",
          type: "success",
          title: "Engajamento Excepcional",
          description: `Taxa de engajamento de ${totalEngagement.toFixed(1)}% está acima da média do mercado!`,
          metric: `${totalEngagement.toFixed(1)}%`,
          icon: Activity,
          priority: 3,
          timestamp: new Date()
        });
      }
      
      if (totalFollowers > 100000) {
        newInsights.push({
          id: "milestone_seguidores",
          type: "info",
          title: "Marco de Seguidores",
          description: `Você ultrapassou ${(totalFollowers / 1000).toFixed(0)}K seguidores! Parabéns!`,
          metric: `${(totalFollowers / 1000).toFixed(0)}K`,
          icon: Users,
          priority: 4,
          timestamp: new Date()
        });
      }
    }
    
    // Task insights
    if (taskData) {
      const { pending, overdue } = taskData;
      
      if (overdue > 0) {
        newInsights.push({
          id: "tarefas_atrasadas",
          type: "warning",
          title: "Tarefas Atrasadas",
          description: `Você tem ${overdue} tarefa(s) atrasada(s). Priorize para evitar acúmulo.`,
          metric: `${overdue} atrasadas`,
          action: "Ver tarefas",
          icon: Clock,
          priority: 9,
          timestamp: new Date()
        });
      }
      
      if (pending > 10) {
        newInsights.push({
          id: "muitas_tarefas",
          type: "tip",
          title: "Muitas Tarefas Pendentes",
          description: "Considere delegar ou reagendar algumas tarefas para melhor produtividade.",
          metric: `${pending} pendentes`,
          icon: Lightbulb,
          priority: 5,
          timestamp: new Date()
        });
      }
    }
    
    // AI Tips
    newInsights.push({
      id: "dica_ia",
      type: "tip",
      title: "Dica do TRAMON",
      description: "Use comandos como 'Gastei 100 de gasolina' ou 'Métricas do YouTube' para gerenciar tudo por voz.",
      icon: Brain,
      priority: 100,
      timestamp: new Date()
    });
    
    // Sort by priority
    newInsights.sort((a, b) => a.priority - b.priority);
    setInsights(newInsights.slice(0, 5));
    setLastUpdate(new Date());
  }, [financialData, socialData, taskData]);

  // Fetch alerts from database
  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: notifications, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (!error && notifications) {
        setAlerts(notifications.map((n: any) => ({
          id: n.id,
          level: n.type === "error" ? "critical" : n.type === "warning" ? "warning" : "info",
          title: n.title,
          message: n.message,
          icon: n.type === "error" ? AlertTriangle : n.type === "warning" ? Bell : CheckCircle,
          timestamp: new Date(n.created_at),
          read: n.is_read
        })));
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    generateInsights();
    fetchAlerts();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      generateInsights();
      fetchAlerts();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [generateInsights, fetchAlerts]);

  const typeStyles = {
    success: {
      bg: "from-emerald-500/20 to-emerald-500/5",
      border: "border-emerald-500/30",
      text: "text-emerald-500",
      badge: "bg-emerald-500/20 text-emerald-500"
    },
    warning: {
      bg: "from-amber-500/20 to-amber-500/5",
      border: "border-amber-500/30",
      text: "text-amber-500",
      badge: "bg-amber-500/20 text-amber-500"
    },
    info: {
      bg: "from-blue-500/20 to-blue-500/5",
      border: "border-blue-500/30",
      text: "text-blue-500",
      badge: "bg-blue-500/20 text-blue-500"
    },
    tip: {
      bg: "from-violet-500/20 to-violet-500/5",
      border: "border-violet-500/30",
      text: "text-violet-500",
      badge: "bg-violet-500/20 text-violet-500"
    }
  };

  const alertStyles = {
    critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500" },
    warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500" },
    info: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500" }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* AI Insights Card */}
      <Card className="border-border/20 bg-gradient-to-br from-card via-card/95 to-violet-500/5 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <motion.div
                className="p-2 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30"
                animate={{ 
                  boxShadow: [
                    "0 0 10px rgba(139, 92, 246, 0.3)",
                    "0 0 20px rgba(139, 92, 246, 0.5)",
                    "0 0 10px rgba(139, 92, 246, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Brain className="h-5 w-5 text-violet-400" />
              </motion.div>
              <span>TRAMON Insights</span>
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">
                <Sparkles className="h-3 w-3 mr-1" />
                IA
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { generateInsights(); fetchAlerts(); }}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {insights.map((insight, i) => {
              const style = typeStyles[insight.type];
              const Icon = insight.icon;
              
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl bg-gradient-to-r ${style.bg} border ${style.border} hover:scale-[1.01] transition-all cursor-pointer`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${style.badge}`}>
                      <Icon className={`h-4 w-4 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground text-sm">{insight.title}</h4>
                        {insight.change !== undefined && (
                          <Badge variant="outline" className={`text-[10px] ${insight.change >= 0 ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'}`}>
                            {insight.change >= 0 ? '+' : ''}{insight.change.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                      {insight.action && (
                        <Button variant="link" className={`h-auto p-0 mt-2 text-xs ${style.text}`}>
                          {insight.action}
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                    {insight.metric && (
                      <div className="text-right">
                        <span className={`text-lg font-bold ${style.text}`}>{insight.metric}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {insights.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Carregando insights...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts Card */}
      <Card className="border-border/20 bg-gradient-to-br from-card via-card/95 to-amber-500/5 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <motion.div
                className="p-2 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 relative"
                animate={{ scale: alerts.filter(a => !a.read).length > 0 ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Bell className="h-5 w-5 text-amber-400" />
                {alerts.filter(a => !a.read).length > 0 && (
                  <motion.span 
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    {alerts.filter(a => !a.read).length}
                  </motion.span>
                )}
              </motion.div>
              <span>Alertas em Tempo Real</span>
            </CardTitle>
            <Badge variant="outline" className="text-muted-foreground">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {alerts.map((alert, i) => {
              const style = alertStyles[alert.level];
              const Icon = alert.icon;
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl ${style.bg} border ${style.border} ${!alert.read ? 'ring-2 ring-offset-2 ring-offset-background' : ''} transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${style.bg}`}>
                      <Icon className={`h-4 w-4 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold text-sm ${!alert.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {alert.title}
                        </h4>
                        {!alert.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2">
                        {alert.timestamp.toLocaleString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {alerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500/30" />
              <p className="text-sm">Nenhum alerta no momento</p>
              <p className="text-xs text-muted-foreground/60">Tudo funcionando perfeitamente!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AIInsightsPanel;
