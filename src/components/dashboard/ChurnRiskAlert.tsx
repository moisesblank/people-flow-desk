// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// AXIOMA V - Alerta de Risco de Churn
// Detecta e alerta sobre usuários em risco de abandono
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  Activity,
  X,
  ChevronRight,
  Brain,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ChurnRiskData {
  userId: string;
  email: string;
  nome: string;
  riskScore: number;
  lastActivity: string;
  daysInactive: number;
  riskFactors: string[];
  suggestedActions: string[];
}

interface ChurnRiskAlertProps {
  userRiskScore?: number;
  showAdminView?: boolean;
  className?: string;
}

export function ChurnRiskAlert({ 
  userRiskScore = 0, 
  showAdminView = false,
  className 
}: ChurnRiskAlertProps) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [highRiskUsers, setHighRiskUsers] = useState<ChurnRiskData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar usuários em risco (para admin)
  useEffect(() => {
    if (!showAdminView) return;
    
    const loadHighRiskUsers = async () => {
      setIsLoading(true);
      try {
        // Buscar usuários com alto risco de churn
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, nome, last_activity_at")
          .order("last_activity_at", { ascending: true })
          .limit(10);

        if (profiles) {
          const riskUsers: ChurnRiskData[] = profiles.map(profile => {
            const lastActivity = new Date(profile.last_activity_at || Date.now());
            const daysInactive = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
            
            // Calcular score de risco baseado em inatividade
            let riskScore = Math.min(daysInactive / 30, 1);
            const riskFactors: string[] = [];
            const suggestedActions: string[] = [];

            if (daysInactive > 7) {
              riskFactors.push("Inativo há mais de 7 dias");
              suggestedActions.push("Enviar email de reengajamento");
            }
            if (daysInactive > 14) {
              riskFactors.push("Inativo há mais de 14 dias");
              suggestedActions.push("Notificação push personalizada");
              riskScore = Math.min(riskScore + 0.2, 1);
            }
            if (daysInactive > 30) {
              riskFactors.push("Inativo há mais de 30 dias - CRÍTICO");
              suggestedActions.push("Ligação direta ou desconto especial");
              riskScore = 1;
            }

            return {
              userId: profile.id,
              email: profile.email || "",
              nome: profile.nome || "Usuário",
              riskScore,
              lastActivity: profile.last_activity_at || new Date().toISOString(),
              daysInactive,
              riskFactors,
              suggestedActions,
            };
          }).filter(u => u.riskScore > 0.5);

          setHighRiskUsers(riskUsers);
        }
      } catch (error) {
        console.error("Erro ao carregar usuários em risco:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHighRiskUsers();
  }, [showAdminView]);

  // Se não há risco ou foi dispensado, não mostrar
  if (userRiskScore < 0.7 && !showAdminView) return null;
  if (dismissed && !showAdminView) return null;

  // Determinar nível de risco
  const getRiskLevel = (score: number) => {
    if (score >= 0.9) return { level: "critical", label: "Crítico", color: "destructive" };
    if (score >= 0.7) return { level: "high", label: "Alto", color: "warning" };
    if (score >= 0.5) return { level: "medium", label: "Médio", color: "secondary" };
    return { level: "low", label: "Baixo", color: "default" };
  };

  const riskInfo = getRiskLevel(userRiskScore);

  // View do usuário (alerta pessoal)
  if (!showAdminView) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={cn("relative", className)}
        >
          <Card className="border-destructive/50 bg-gradient-to-r from-destructive/10 via-background to-destructive/5 overflow-hidden">
            {/* Efeito de pulso de alerta */}
            <div className="absolute inset-0 bg-destructive/5 animate-pulse" />
            
            <CardContent className="p-4 relative">
              <button
                onClick={() => setDismissed(true)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-destructive/20 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-destructive/20">
                  <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-destructive">
                      Sentimos sua falta! 🌟
                    </h3>
                    <Badge variant="destructive" className="text-xs">
                      Ação Recomendada
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Notamos que você está há algum tempo sem estudar. 
                    Voltar agora mantém seu progresso ativo e seu conhecimento fresco!
                  </p>

                  <div className="flex items-center gap-4 pt-2">
                    <Button size="sm" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Continuar Estudando
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
                      Lembrar Depois
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // View do Admin (painel de monitoramento)
  return (
    <Card className={cn("border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-red-500/5", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/20">
              <Brain className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-base">Monitor de Churn</CardTitle>
              <p className="text-xs text-muted-foreground">
                AXIOMA V - Predição de Abandono
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-orange-500 border-orange-500/50">
            {highRiskUsers.length} em risco
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Activity className="h-6 w-6 animate-pulse text-muted-foreground" />
          </div>
        ) : highRiskUsers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">Nenhum usuário em risco alto!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {highRiskUsers.map((riskUser, index) => {
              const risk = getRiskLevel(riskUser.riskScore);
              return (
                <motion.div
                  key={riskUser.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-background/50 border border-border/50 hover:border-orange-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        risk.level === "critical" && "bg-red-500 animate-pulse",
                        risk.level === "high" && "bg-orange-500",
                        risk.level === "medium" && "bg-yellow-500"
                      )} />
                      <div>
                        <p className="text-sm font-medium">{riskUser.nome}</p>
                        <p className="text-xs text-muted-foreground">{riskUser.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {riskUser.daysInactive} dias
                        </div>
                        <Progress 
                          value={riskUser.riskScore * 100} 
                          className="h-1 w-16 mt-1"
                        />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {riskUser.riskFactors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {riskUser.riskFactors.slice(0, 2).map((factor, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] py-0">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full gap-2">
          <TrendingDown className="h-4 w-4" />
          Ver Relatório Completo
        </Button>
      </CardContent>
    </Card>
  );
}
