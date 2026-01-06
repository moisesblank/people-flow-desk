// ============================================
// QUICK ACTIONS GRID v2.0 - GPU-ONLY animations
// ============================================

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Plus,
  DollarSign,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Wallet,
  Target,
  GraduationCap,
  Bot,
  BarChart3,
  Zap,
  MessageCircle,
  Settings,
  Globe,
  Mail,
  Phone,
  Brain,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  bgColor: string;
  roles?: string[];
}

const quickActions: QuickAction[] = [
  {
    id: "nova-tarefa",
    label: "Nova Tarefa",
    description: "Criar tarefa rápida",
    icon: Plus,
    path: "/tarefas",
    color: "text-[hsl(var(--stats-blue))]",
    bgColor: "bg-[hsl(var(--stats-blue))]/10 hover:bg-[hsl(var(--stats-blue))]/20",
  },
  {
    id: "add-gasto",
    label: "Novo Gasto",
    description: "Registrar despesa",
    icon: DollarSign,
    path: "/financas-pessoais",
    color: "text-[hsl(var(--stats-purple))]",
    bgColor: "bg-[hsl(var(--stats-purple))]/10 hover:bg-[hsl(var(--stats-purple))]/20",
  },
  {
    id: "add-receita",
    label: "Nova Receita",
    description: "Adicionar entrada",
    icon: TrendingUp,
    path: "/entradas",
    color: "text-[hsl(var(--stats-green))]",
    bgColor: "bg-[hsl(var(--stats-green))]/10 hover:bg-[hsl(var(--stats-green))]/20",
  },
  {
    id: "funcionarios",
    label: "Funcionários",
    description: "Gerir equipe",
    icon: Users,
    path: "/funcionarios",
    color: "text-[hsl(var(--stats-gold))]",
    bgColor: "bg-[hsl(var(--stats-gold))]/10 hover:bg-[hsl(var(--stats-gold))]/20",
    roles: ["owner", "admin"],
  },
  {
    id: "agenda",
    label: "Agenda",
    description: "Ver calendário",
    icon: Calendar,
    path: "/calendario",
    color: "text-primary",
    bgColor: "bg-primary/10 hover:bg-primary/20",
  },
  {
    id: "financas-empresa",
    label: "Finanças Empresa",
    description: "Central financeira",
    icon: Wallet,
    path: "/financas-empresa",
    color: "text-[hsl(var(--stats-wine))]",
    bgColor: "bg-[hsl(var(--stats-wine))]/10 hover:bg-[hsl(var(--stats-wine))]/20",
    roles: ["owner", "admin", "contabilidade"],
  },
  {
    id: "alunos",
    label: "Alunos",
    description: "Gestão de alunos",
    icon: GraduationCap,
    path: "/gestaofc/alunos",
    color: "text-[hsl(var(--stats-cyan))]",
    bgColor: "bg-[hsl(var(--stats-cyan))]/10 hover:bg-[hsl(var(--stats-cyan))]/20",
    roles: ["owner", "admin", "coordenacao"],
  },
  {
    id: "metricas",
    label: "Métricas",
    description: "Central analítica",
    icon: BarChart3,
    path: "/central-metricas",
    color: "text-[hsl(var(--stats-purple))]",
    bgColor: "bg-[hsl(var(--stats-purple))]/10 hover:bg-[hsl(var(--stats-purple))]/20",
    roles: ["owner", "admin", "marketing"],
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Central de comandos",
    icon: MessageCircle,
    path: "/central-whatsapp",
    color: "text-green-500",
    bgColor: "bg-green-500/10 hover:bg-green-500/20",
    roles: ["owner", "admin"],
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Campanhas e leads",
    icon: Globe,
    path: "/marketing",
    color: "text-[hsl(var(--stats-blue))]",
    bgColor: "bg-[hsl(var(--stats-blue))]/10 hover:bg-[hsl(var(--stats-blue))]/20",
    roles: ["owner", "admin", "marketing"],
  },
  {
    id: "integracoes",
    label: "Integrações",
    description: "Apps conectados",
    icon: Zap,
    path: "/integracoes",
    color: "text-[hsl(var(--stats-gold))]",
    bgColor: "bg-[hsl(var(--stats-gold))]/10 hover:bg-[hsl(var(--stats-gold))]/20",
    roles: ["owner", "admin"],
  },
  {
    id: "documentos",
    label: "Documentos",
    description: "Arquivos e docs",
    icon: FileText,
    path: "/documentos",
    color: "text-[hsl(var(--stats-blue))]",
    bgColor: "bg-[hsl(var(--stats-blue))]/10 hover:bg-[hsl(var(--stats-blue))]/20",
  },
];

// AI Quick Commands
const aiCommands = [
  { id: "ai-resumo", label: "Resumo do Dia", prompt: "Faça um resumo das minhas tarefas e finanças de hoje" },
  { id: "ai-sugestoes", label: "Sugestões de Economia", prompt: "Analise meus gastos e sugira formas de economizar" },
  { id: "ai-priorizar", label: "Priorizar Tarefas", prompt: "Me ajude a priorizar minhas tarefas pendentes" },
  { id: "ai-meta", label: "Definir Meta", prompt: "Me ajude a criar uma meta financeira" },
];

export function QuickActionsGrid() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [showAIModal, setShowAIModal] = useState(false);
  const { gpuAnimationProps } = useQuantumReactivity();

  // Filter actions based on user role
  const filteredActions = quickActions.filter(action => {
    if (!action.roles) return true;
    return action.roles.includes(role || 'employee');
  });

  const handleAICommand = (prompt: string) => {
    setShowAIModal(false);
    // Navigate to AI assistant or trigger AI modal
    navigate("/tarefas", { state: { aiPrompt: prompt } });
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Ações Rápidas
        </h3>
        
        {/* AI Quick Actions Button */}
        <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-gradient-to-r from-primary/10 to-[hsl(var(--stats-purple))]/10 border-primary/30 hover:border-primary"
            >
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Assistente IA</span>
              <Sparkles className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Comandos Rápidos com IA
              </DialogTitle>
              <DialogDescription>
                Selecione uma ação ou digite seu próprio comando
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              {aiCommands.map((cmd) => (
                <Button
                  key={cmd.id}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => handleAICommand(cmd.prompt)}
                >
                  <Sparkles className="h-4 w-4 mr-3 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{cmd.label}</p>
                    <p className="text-xs text-muted-foreground">{cmd.prompt}</p>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              {...gpuAnimationProps.fadeUp}
              transition={{ ...(gpuAnimationProps.fadeUp.transition ?? {}), delay: index * 0.03 }}
              onClick={() => navigate(action.path)}
              className={`group p-4 rounded-xl border border-border/50 ${action.bgColor} transition-all duration-300 hover:border-border hover:shadow-lg hover:scale-105 text-left will-change-transform transform-gpu`}
            >
              <div className={`${action.color} mb-2`}>
                <Icon className="h-6 w-6" />
              </div>
              <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                {action.label}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {action.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-[hsl(var(--stats-gold))]" />
            <span>Atalho: Ctrl+K para busca rápida</span>
          </div>
          <div className="flex items-center gap-1">
            <Bot className="h-3 w-3 text-primary" />
            <span>IA disponível para ajudar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
