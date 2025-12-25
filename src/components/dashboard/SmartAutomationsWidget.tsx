// ============================================
// EMPRESARIAL 2.0 - AUTOMAÇÕES INTELIGENTES v2.0
// Controle de automações - CLICÁVEL
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Play,
  Pause,
  Plus,
  Settings,
  Bell,
  Mail,
  Calendar,
  DollarSign,
  Users,
  MessageSquare,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Workflow,
  Bot,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  isActive: boolean;
  lastRun?: Date;
  runCount: number;
  icon: typeof Zap;
  category: "finance" | "task" | "notification" | "marketing";
}

const categoryConfig = {
  finance: { icon: DollarSign, color: "text-[hsl(var(--stats-green))]", bg: "bg-[hsl(var(--stats-green))]/10" },
  task: { icon: Calendar, color: "text-[hsl(var(--stats-blue))]", bg: "bg-[hsl(var(--stats-blue))]/10" },
  notification: { icon: Bell, color: "text-[hsl(var(--stats-gold))]", bg: "bg-[hsl(var(--stats-gold))]/10" },
  marketing: { icon: Users, color: "text-[hsl(var(--stats-purple))]", bg: "bg-[hsl(var(--stats-purple))]/10" },
};

const defaultAutomations: Automation[] = [
  {
    id: "payment-reminder",
    name: "Lembrete de Pagamento",
    description: "Notifica 3 dias antes do vencimento",
    trigger: "3 dias antes do vencimento",
    actions: ["Criar notificação", "Enviar para WhatsApp"],
    isActive: true,
    runCount: 47,
    icon: DollarSign,
    category: "finance",
  },
  {
    id: "task-overdue",
    name: "Alerta Tarefa Atrasada",
    description: "Alerta quando tarefa passa da data",
    trigger: "Tarefa atrasada",
    actions: ["Criar alerta", "Mudar prioridade"],
    isActive: true,
    runCount: 23,
    icon: Calendar,
    category: "task",
  },
  {
    id: "new-student-welcome",
    name: "Boas-vindas Novo Aluno",
    description: "Envia mensagem de boas-vindas",
    trigger: "Nova matrícula",
    actions: ["Enviar e-mail", "Criar tarefa de acompanhamento"],
    isActive: true,
    runCount: 156,
    icon: Users,
    category: "marketing",
  },
  {
    id: "daily-summary",
    name: "Resumo Diário",
    description: "Envia resumo às 8h",
    trigger: "Todo dia às 8:00",
    actions: ["Gerar relatório", "Enviar notificação"],
    isActive: true,
    runCount: 89,
    icon: Bell,
    category: "notification",
  },
  {
    id: "low-balance-alert",
    name: "Alerta Saldo Baixo",
    description: "Avisa quando saldo < R$ 1.000",
    trigger: "Saldo baixo detectado",
    actions: ["Notificação urgente", "E-mail para assessor"],
    isActive: true,
    runCount: 12,
    icon: DollarSign,
    category: "finance",
  },
  {
    id: "whatsapp-lead",
    name: "Lead WhatsApp",
    description: "Notifica novos leads do WhatsApp",
    trigger: "Novo lead recebido",
    actions: ["Criar lead", "Enviar notificação", "Atribuir responsável"],
    isActive: true,
    runCount: 234,
    icon: MessageSquare,
    category: "marketing",
  },
  {
    id: "invoice-generated",
    name: "Nota Fiscal Gerada",
    description: "Alerta quando NF é emitida",
    trigger: "Nova NF emitida",
    actions: ["Notificar contabilidade", "Arquivar documento"],
    isActive: true,
    runCount: 78,
    icon: DollarSign,
    category: "finance",
  },
  {
    id: "task-completed",
    name: "Tarefa Concluída",
    description: "Celebra conclusão de tarefas",
    trigger: "Tarefa marcada como concluída",
    actions: ["Adicionar XP", "Atualizar streak"],
    isActive: true,
    runCount: 567,
    icon: CheckCircle2,
    category: "task",
  },
  {
    id: "monthly-report",
    name: "Relatório Mensal",
    description: "Gera relatório no dia 1",
    trigger: "Todo dia 1 às 9:00",
    actions: ["Gerar PDF", "Enviar por e-mail", "Arquivar"],
    isActive: true,
    runCount: 24,
    icon: Bell,
    category: "notification",
  },
  {
    id: "class-reminder",
    name: "Lembrete de Aula",
    description: "Notifica alunos antes da aula",
    trigger: "1 hora antes da aula",
    actions: ["Enviar WhatsApp", "Criar notificação"],
    isActive: true,
    runCount: 312,
    icon: Users,
    category: "marketing",
  },
];

export function SmartAutomationsWidget() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [automations, setAutomations] = useState<Automation[]>(defaultAutomations);

  // Fetch rules from database
  const { data: dbRules } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      // ⚡ DOGMA V.5K: Limite para evitar sobrecarga
      const { data, error } = await supabase
        .from("custom_rules")
        .select("*")
        .order("priority", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const toggleAutomation = (id: string) => {
    setAutomations(prev =>
      prev.map(a =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      )
    );
    toast.success("Automação atualizada!");
  };

  const activeCount = automations.filter(a => a.isActive).length;
  const totalRuns = automations.reduce((sum, a) => sum + a.runCount, 0);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/configuracoes")}
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <Bot className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Automações</CardTitle>
              <p className="text-xs text-muted-foreground">
                {activeCount} de {automations.length} ativas
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => navigate("/configuracoes")}>
            <Zap className="h-3 w-3 mr-1 text-amber-500" />
            {totalRuns} execuções
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
          <div className="p-3 space-y-2">
            {automations.map((automation, index) => {
              const config = categoryConfig[automation.category];
              const CategoryIcon = config.icon;

              return (
                <motion.div
                  key={automation.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-xl border transition-all ${
                    automation.isActive
                      ? "bg-card border-primary/20"
                      : "bg-muted/20 border-border/30 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
                      <CategoryIcon className={`h-4 w-4 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate">
                          {automation.name}
                        </span>
                        {automation.isActive && (
                          <div className="h-2 w-2 rounded-full bg-[hsl(var(--stats-green))] animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1">
                        {automation.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-[10px]">
                        <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                          <Clock className="h-2.5 w-2.5 mr-1" />
                          {automation.trigger}
                        </Badge>
                        <span className="text-muted-foreground">
                          {automation.runCount}x executada
                        </span>
                      </div>

                      {/* Actions Preview */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {automation.actions.map((action, i) => (
                          <Badge key={i} variant="secondary" className="text-[8px] h-4 px-1.5">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={automation.isActive}
                        onCheckedChange={() => toggleAutomation(automation.id)}
                        className="scale-75"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Play className="h-4 w-4 mr-2" />
                            Executar Agora
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Quick Add */}
        <div className="p-3 border-t border-border/50">
          <Button variant="outline" className="w-full text-xs" size="sm" onClick={() => navigate("/configuracoes")}>
            <Plus className="h-3 w-3 mr-1" />
            Nova Automação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
