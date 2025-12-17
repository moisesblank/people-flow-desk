// ============================================
// EMPRESARIAL 2.0 - COMANDOS WHATSAPP
// Central de comandos via WhatsApp
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
  category: "finance" | "task" | "report" | "ai";
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
  // RELATÓRIOS
  {
    command: "/resumo",
    description: "Relatório diário completo",
    example: "/resumo",
    category: "report",
    icon: BarChart3,
  },
  {
    command: "/semana",
    description: "Relatório semanal",
    example: "/semana",
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
    icon: BarChart3,
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
];

const categoryColors = {
  finance: "bg-[hsl(var(--stats-green))]/10 text-[hsl(var(--stats-green))] border-[hsl(var(--stats-green))]/30",
  task: "bg-[hsl(var(--stats-blue))]/10 text-[hsl(var(--stats-blue))] border-[hsl(var(--stats-blue))]/30",
  report: "bg-[hsl(var(--stats-gold))]/10 text-[hsl(var(--stats-gold))] border-[hsl(var(--stats-gold))]/30",
  ai: "bg-[hsl(var(--stats-purple))]/10 text-[hsl(var(--stats-purple))] border-[hsl(var(--stats-purple))]/30",
};

const categoryLabels = {
  finance: "Finanças",
  task: "Tarefas",
  report: "Relatórios",
  ai: "IA",
};

// WhatsApp numbers for assessors
const ASSESSORS = {
  moises: { name: "Moisés", phone: "558398920105" },
  bruna: { name: "Bruna", phone: "558396354090" },
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
              <CardTitle className="text-lg">Comandos WhatsApp</CardTitle>
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
        <div className="px-3 pb-2">
          <p className="text-[10px] text-muted-foreground mb-2 uppercase font-medium">
            Falar com Assessor
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8 bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
              onClick={() => openWhatsApp(ASSESSORS.moises.phone, "Olá Moisés!")}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {ASSESSORS.moises.name}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8 bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
              onClick={() => openWhatsApp(ASSESSORS.bruna.phone, "Olá Bruna!")}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {ASSESSORS.bruna.name}
            </Button>
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
                  transition={{ delay: index * 0.03 }}
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
              <span>Dica: Use /ai para perguntas complexas</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
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
