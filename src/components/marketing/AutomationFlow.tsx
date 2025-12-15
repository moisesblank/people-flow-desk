// ============================================
// FLUXO DE AUTOMAÇÕES
// Visualização das automações de marketing
// ============================================

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Mail, 
  MessageSquare, 
  UserPlus, 
  Clock, 
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Settings,
  ArrowRight
} from "lucide-react";
import { useState } from "react";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  isActive: boolean;
  stats: {
    triggered: number;
    completed: number;
    rate: number;
  };
}

const automations: Automation[] = [
  {
    id: "1",
    name: "Boas-vindas Novo Lead",
    description: "Sequência de e-mails para novos leads",
    trigger: "Novo cadastro",
    actions: ["Email de boas-vindas", "WhatsApp após 2h", "Email com conteúdo gratuito D+1"],
    isActive: true,
    stats: { triggered: 1250, completed: 1180, rate: 94.4 }
  },
  {
    id: "2", 
    name: "Carrinho Abandonado",
    description: "Recuperação de vendas perdidas",
    trigger: "Abandono de carrinho",
    actions: ["Email imediato", "WhatsApp após 30min", "SMS após 2h"],
    isActive: true,
    stats: { triggered: 456, completed: 89, rate: 19.5 }
  },
  {
    id: "3",
    name: "Pós-compra",
    description: "Onboarding de novos alunos",
    trigger: "Compra confirmada",
    actions: ["Email de acesso", "WhatsApp com orientações", "Email D+3 pedindo feedback"],
    isActive: true,
    stats: { triggered: 356, completed: 342, rate: 96.1 }
  },
  {
    id: "4",
    name: "Reengajamento",
    description: "Alunos inativos há 7+ dias",
    trigger: "Inatividade detectada",
    actions: ["Email motivacional", "WhatsApp personalizado", "Oferta especial"],
    isActive: false,
    stats: { triggered: 128, completed: 45, rate: 35.2 }
  },
];

export function AutomationFlow() {
  const [activeAutomations, setActiveAutomations] = useState<Record<string, boolean>>(
    automations.reduce((acc, a) => ({ ...acc, [a.id]: a.isActive }), {})
  );

  const toggleAutomation = (id: string) => {
    setActiveAutomations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Automações Ativas
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {Object.values(activeAutomations).filter(Boolean).length} ativas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {automations.map((automation, index) => (
          <motion.div
            key={automation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border transition-all ${
              activeAutomations[automation.id] 
                ? 'border-primary/30 bg-primary/5' 
                : 'border-border/50 bg-secondary/20 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  activeAutomations[automation.id] ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  {activeAutomations[automation.id] ? (
                    <Play className="h-4 w-4 text-primary" />
                  ) : (
                    <Pause className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{automation.name}</h4>
                  <p className="text-xs text-muted-foreground">{automation.description}</p>
                </div>
              </div>
              <Switch 
                checked={activeAutomations[automation.id]} 
                onCheckedChange={() => toggleAutomation(automation.id)}
              />
            </div>

            {/* Trigger e Actions */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                {automation.trigger}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              {automation.actions.slice(0, 2).map((action, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {action}
                </Badge>
              ))}
              {automation.actions.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{automation.actions.length - 2}
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border/30">
              <div>
                <p className="text-lg font-bold text-foreground">{automation.stats.triggered}</p>
                <p className="text-[10px] text-muted-foreground">Disparados</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600">{automation.stats.completed}</p>
                <p className="text-[10px] text-muted-foreground">Completados</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">{automation.stats.rate}%</p>
                <p className="text-[10px] text-muted-foreground">Taxa</p>
              </div>
            </div>
          </motion.div>
        ))}

        <Button variant="outline" className="w-full mt-4 gap-2">
          <Settings className="h-4 w-4" />
          Gerenciar Automações
        </Button>
      </CardContent>
    </Card>
  );
}
