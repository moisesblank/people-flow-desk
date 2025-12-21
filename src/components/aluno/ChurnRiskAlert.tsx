// ============================================
// CHURN RISK ALERT - SANTUÁRIO BETA v9.0
// Alerta Preditivo de IA para Risco de Evasão
// Sistema de Reengajamento Automático
// ============================================

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, Heart, Sparkles, X, 
  Calendar, Brain, Target, Flame, MessageCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChurnRiskAlertProps {
  riskScore: number;
  userName?: string;
}

export function ChurnRiskAlert({ riskScore, userName = "estudante" }: ChurnRiskAlertProps) {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Só mostra se o risco for significativo
  if (riskScore < 0.5 || isDismissed) return null;

  const isHighRisk = riskScore > 0.7;
  const isMediumRisk = riskScore > 0.5 && riskScore <= 0.7;

  const getAlertConfig = () => {
    if (isHighRisk) {
      return {
        bgColor: 'from-red-500/10 to-orange-500/5',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-500',
        title: 'Percebemos que você está afastado(a) 💔',
        message: 'Faz alguns dias que não te vemos por aqui. Cada dia conta na sua jornada para a aprovação. Que tal retomar agora?',
        badge: 'Atenção',
        badgeVariant: 'destructive' as const
      };
    }
    return {
      bgColor: 'from-amber-500/10 to-yellow-500/5',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-500',
      title: 'Sentimos sua falta! 🌟',
      message: 'Sua constância está diminuindo. Lembre-se: pequenos passos diários levam a grandes conquistas!',
      badge: 'Lembrete',
      badgeVariant: 'outline' as const
    };
  };

  const config = getAlertConfig();

  const quickActions = [
    {
      label: 'Aula Rápida',
      icon: Brain,
      description: '15 min',
      action: () => navigate('/alunos/videoaulas')
    },
    {
      label: 'Treino Flash',
      icon: Target,
      description: '5 questões',
      action: () => navigate('/alunos/questoes')
    },
    {
      label: 'Revisar Erros',
      icon: Flame,
      description: '10 min',
      action: () => navigate('/alunos/caderno-erros')
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <Card className={`bg-gradient-to-r ${config.bgColor} border ${config.borderColor} overflow-hidden`}>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-4">
              {/* Ícone animado */}
              <motion.div 
                className={`p-3 rounded-2xl bg-background/50 ${config.iconColor}`}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Heart className="w-6 h-6" />
              </motion.div>

              <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{config.title}</h3>
                      <Badge variant={config.badgeVariant} className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {config.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xl">
                      {config.message}
                    </p>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsDismissed(true)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={action.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2 bg-background/50 hover:bg-background"
                        onClick={action.action}
                      >
                        <action.icon className="w-4 h-4" />
                        <span>{action.label}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {action.description}
                        </Badge>
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {/* Mensagem de suporte */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <MessageCircle className="w-3 h-3" />
                  <span>
                    Precisa de ajuda? Estamos aqui para você. 
                    <button className="text-primary hover:underline ml-1">
                      Falar com suporte
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
