// ============================================
// EMPRESARIAL 2.0 - COMANDOS WHATSAPP COMPLETO
// Central de comandos via WhatsApp
// Assessores: Moisés (558398920105) e Bruna (558396354090)
// Conforme documento AJUDA5
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Zap,
  DollarSign,
  Calendar,
  BarChart3,
  Bot,
  Sparkles,
  Phone,
  Users,
  TrendingUp,
  FileText,
  Crown,
  Bell,
  Settings,
  Rocket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface WhatsAppCommand {
  command: string;
  description: string;
  example: string;
  category: "finance" | "task" | "report" | "ai" | "system";
  icon: typeof MessageSquare;
}

const commands: WhatsAppCommand[] = [
  // FINANÇAS
  {
    command: "/saldo",
    description: "Consulta saldo atual de todas as contas",
    example: "/saldo",
    category: "finance",
    icon: DollarSign,
  },
  {
    command: "/despesa",
    description: "Registra uma nova despesa",
    example: "/despesa 150 mercado",
    category: "finance",
    icon: DollarSign,
  },
  {
    command: "/entrada",
    description: "Registra uma nova receita",
    example: "/entrada 5000 consultoria",
    category: "finance",
    icon: DollarSign,
  },
  {
    command: "/lucro",
    description: "Mostra lucro do período atual",
    example: "/lucro",
    category: "finance",
    icon: DollarSign,
  },
  {
    command: "/fluxo",
    description: "Previsão de fluxo de caixa",
    example: "/fluxo 30dias",
    category: "finance",
    icon: DollarSign,
  },
  {
    command: "/multicnpj",
    description: "Status de todos os CNPJs",
    example: "/multicnpj",
    category: "finance",
    icon: DollarSign,
  },
  {
    command: "/pagar",
    description: "Lista contas a pagar",
    example: "/pagar",
    category: "finance",
    icon: DollarSign,
  },
  {
    command: "/receber",
    description: "Lista contas a receber",
    example: "/receber",
    category: "finance",
    icon: DollarSign,
  },
  // TAREFAS
  {
    command: "/tarefa",
    description: "Cria uma nova tarefa",
    example: "/tarefa Revisar relatório até sexta",
    category: "task",
    icon: Calendar,
  },
  {
    command: "/pendentes",
    description: "Lista tarefas pendentes",
    example: "/pendentes",
    category: "task",
    icon: Calendar,
  },
  {
    command: "/concluir",
    description: "Marca tarefa como concluída",
    example: "/concluir 1",
    category: "task",
    icon: CheckCircle2,
  },
  {
    command: "/urgentes",
    description: "Lista tarefas urgentes",
    example: "/urgentes",
    category: "task",
    icon: Clock,
  },
  {
    command: "/hoje",
    description: "Agenda de hoje",
    example: "/hoje",
    category: "task",
    icon: Calendar,
  },
  {
    command: "/semana",
    description: "Agenda da semana",
    example: "/semana",
    category: "task",
    icon: Calendar,
  },
  {
    command: "/atribuir",
    description: "Atribui tarefa a alguém",
    example: "/atribuir 1 @bruna",
    category: "task",
    icon: Users,
  },
  // RELATÓRIOS
  {
    command: "/resumo",
    description: "Relatório diário completo",
    example: "/resumo",
    category: "report",
    icon: BarChart3,
  },
  {
    command: "/relatorio",
    description: "Relatório semanal executivo",
    example: "/relatorio semana",
    category: "report",
    icon: BarChart3,
  },
  {
    command: "/mes",
    description: "Relatório mensal executivo",
    example: "/mes",
    category: "report",
    icon: BarChart3,
  },
  {
    command: "/kpis",
    description: "KPIs principais do negócio",
    example: "/kpis",
    category: "report",
    icon: TrendingUp,
  },
  {
    command: "/alunos",
    description: "Relatório de alunos",
    example: "/alunos",
    category: "report",
    icon: Users,
  },
  {
    command: "/marketing",
    description: "Métricas de marketing",
    example: "/marketing",
    category: "report",
    icon: Rocket,
  },
  // IA
  {
    command: "/ai",
    description: "Pergunta para o assistente IA",
    example: "/ai Como posso reduzir custos?",
    category: "ai",
    icon: Bot,
  },
  {
    command: "/tramon",
    description: "Consulta TRAMON - IA Empresarial",
    example: "/tramon análise financeira",
    category: "ai",
    icon: Bot,
  },
  {
    command: "/previsao",
    description: "Previsões com IA preditiva",
    example: "/previsao vendas",
    category: "ai",
    icon: Bot,
  },
  {
    command: "/analise",
    description: "Análise 360° do negócio",
    example: "/analise",
    category: "ai",
    icon: Sparkles,
  },
  {
    command: "/sugerir",
    description: "Sugestões de automação",
    example: "/sugerir",
    category: "ai",
    icon: Zap,
  },
  // SISTEMA
  {
    command: "/ajuda",
    description: "Lista todos os comandos",
    example: "/ajuda",
    category: "system",
    icon: FileText,
  },
  {
    command: "/status",
    description: "Status do sistema",
    example: "/status",
    category: "system",
    icon: Settings,
  },
  {
    command: "/alertas",
    description: "Configura alertas",
    example: "/alertas on",
    category: "system",
    icon: Bell,
  },
];

const categoryColors = {
  finance: "bg-[hsl(var(--stats-green))]/10 text-[hsl(var(--stats-green))] border-[hsl(var(--stats-green))]/30",
  task: "bg-[hsl(var(--stats-blue))]/10 text-[hsl(var(--stats-blue))] border-[hsl(var(--stats-blue))]/30",
  report: "bg-[hsl(var(--stats-gold))]/10 text-[hsl(var(--stats-gold))] border-[hsl(var(--stats-gold))]/30",
  ai: "bg-[hsl(var(--stats-purple))]/10 text-[hsl(var(--stats-purple))] border-[hsl(var(--stats-purple))]/30",
  system: "bg-muted/50 text-muted-foreground border-border",
};

const categoryLabels = {
  finance: "Finanças",
  task: "Tarefas",
  report: "Relatórios",
  ai: "IA",
  system: "Sistema",
};

// WhatsApp numbers for assessors - AJUDA5
const ASSESSORS = {
  moises: { 
    name: "Moisés", 
    role: "Owner/CEO", 
    phone: "558398920105",
    alternatePhone: "5583998920105",
    avatar: "👨‍💼"
  },
  bruna: { 
    name: "Bruna", 
    role: "Administradora", 
    phone: "558396354090",
    alternatePhone: "5583996354090",
    avatar: "👩‍💼"
  },
};

export function WhatsAppCommandWidget() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    toast.success("Comando copiado!");
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const openWhatsApp = (phone: string, message?: string) => {
    const url = message
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${phone}`;
    window.open(url, "_blank");
  };

  const filteredCommands = filter === "all"
    ? commands
    : commands.filter(c => c.category === filter);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/20">
              <MessageSquare className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Comandos WhatsApp
                <Badge className="bg-gradient-to-r from-primary to-primary/60 text-primary-foreground text-[10px]">
                  EMPRESARIAL 2.0
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Controle tudo pelo WhatsApp
              </p>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-500">
            <Zap className="h-3 w-3 mr-1" />
            {commands.length} comandos
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Quick Contact - Assessors */}
        <div className="px-3 pb-3">
          <p className="text-[10px] text-muted-foreground mb-2 uppercase font-medium flex items-center gap-1">
            <Crown className="h-3 w-3 text-[hsl(var(--stats-gold))]" />
            Contato Direto - Assessores
          </p>
          <div className="grid grid-cols-2 gap-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-2 rounded-xl border border-green-500/30 bg-green-500/5 cursor-pointer hover:bg-green-500/10 transition-all"
              onClick={() => openWhatsApp(ASSESSORS.moises.phone, "Olá Moisés, preciso de ajuda!")}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{ASSESSORS.moises.avatar}</span>
                <div>
                  <p className="text-sm font-medium">{ASSESSORS.moises.name}</p>
                  <p className="text-[10px] text-muted-foreground">{ASSESSORS.moises.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-green-500">
                <Phone className="h-3 w-3" />
                <span>{ASSESSORS.moises.phone}</span>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-2 rounded-xl border border-green-500/30 bg-green-500/5 cursor-pointer hover:bg-green-500/10 transition-all"
              onClick={() => openWhatsApp(ASSESSORS.bruna.phone, "Olá Bruna, preciso de ajuda!")}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{ASSESSORS.bruna.avatar}</span>
                <div>
                  <p className="text-sm font-medium">{ASSESSORS.bruna.name}</p>
                  <p className="text-[10px] text-muted-foreground">{ASSESSORS.bruna.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-green-500">
                <Phone className="h-3 w-3" />
                <span>{ASSESSORS.bruna.phone}</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-3 pb-2 flex gap-1 overflow-x-auto">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => setFilter("all")}
          >
            Todos
          </Button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "ghost"}
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Commands List */}
        <ScrollArea className="h-[280px]">
          <div className="px-3 pb-3 space-y-2">
            {filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isCopied = copiedCommand === cmd.command;

              return (
                <motion.div
                  key={cmd.command}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className={`p-1.5 rounded-lg border ${categoryColors[cmd.category]}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-semibold text-primary">
                            {cmd.command}
                          </code>
                          <Badge variant="outline" className="text-[8px] h-4 px-1">
                            {categoryLabels[cmd.category]}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {cmd.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
                          Ex: <span className="text-foreground/70">{cmd.example}</span>
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyCommand(cmd.command)}
                    >
                      {isCopied ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Quick Action Footer */}
        <div className="p-3 border-t border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Diga "meu assessor" para contato rápido</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
              onClick={() => openWhatsApp(ASSESSORS.moises.phone)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Abrir WhatsApp
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
