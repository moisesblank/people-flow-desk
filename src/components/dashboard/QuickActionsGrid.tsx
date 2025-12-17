// ============================================
// QUICK ACTIONS GRID - Ações Rápidas Visual
// Acesso rápido às funcionalidades principais
// ============================================

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  DollarSign,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Wallet,
  Target,
  Bell,
  Settings,
  GraduationCap,
  BarChart3,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  bgColor: string;
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
    id: "pagamentos",
    label: "Pagamentos",
    description: "Contas a pagar",
    icon: Wallet,
    path: "/pagamentos",
    color: "text-[hsl(var(--stats-wine))]",
    bgColor: "bg-[hsl(var(--stats-wine))]/10 hover:bg-[hsl(var(--stats-wine))]/20",
  },
  {
    id: "alunos",
    label: "Alunos",
    description: "Gestão de alunos",
    icon: GraduationCap,
    path: "/alunos",
    color: "text-[hsl(var(--stats-cyan))]",
    bgColor: "bg-[hsl(var(--stats-cyan))]/10 hover:bg-[hsl(var(--stats-cyan))]/20",
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

export function QuickActionsGrid() {
  const navigate = useNavigate();

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        Ações Rápidas
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(action.path)}
              className={`group p-4 rounded-xl border border-border/50 ${action.bgColor} transition-all duration-300 hover:border-border hover:shadow-lg text-left`}
            >
              <div className={`${action.color} mb-2`}>
                <Icon className="h-6 w-6" />
              </div>
              <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                {action.label}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {action.description}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
