// ============================================
// MOISÉS MEDEIROS v8.0 - Widget de Ações Rápidas V2
// Atalhos inteligentes com contexto
// ============================================

import { motion } from "framer-motion";
import { 
  Plus, 
  DollarSign, 
  Users, 
  Calendar,
  FileText,
  Settings,
  BarChart3,
  MessageSquare,
  Zap,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  badge?: string;
}

const defaultActions: QuickAction[] = [
  {
    id: "1",
    label: "Nova Receita",
    description: "Registrar entrada",
    icon: DollarSign,
    href: "/entradas",
    color: "stats-green"
  },
  {
    id: "2",
    label: "Nova Despesa",
    description: "Registrar saída",
    icon: DollarSign,
    href: "/pessoal",
    color: "destructive"
  },
  {
    id: "3",
    label: "Nova Tarefa",
    description: "Criar compromisso",
    icon: Calendar,
    href: "/calendario",
    color: "stats-blue"
  },
  {
    id: "4",
    label: "Novo Aluno",
    description: "Cadastrar estudante",
    icon: Users,
    href: "/alunos",
    color: "stats-purple"
  },
  {
    id: "5",
    label: "Ver Relatórios",
    description: "Análises completas",
    icon: BarChart3,
    href: "/relatorios",
    color: "stats-gold"
  },
  {
    id: "6",
    label: "Configurações",
    description: "Ajustar sistema",
    icon: Settings,
    href: "/configuracoes",
    color: "muted-foreground"
  }
];

interface QuickActionsV2Props {
  actions?: QuickAction[];
  showAISuggestion?: boolean;
}

export function QuickActionsV2({ 
  actions = defaultActions,
  showAISuggestion = true 
}: QuickActionsV2Props) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Ações Rápidas</h3>
            <p className="text-xs text-muted-foreground">Atalhos do sistema</p>
          </div>
        </div>
      </div>

      {/* AI Suggestion */}
      {showAISuggestion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-[hsl(var(--stats-purple))]/10 border border-primary/20"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Sugestão Inteligente</p>
              <p className="text-xs text-muted-foreground mt-1">
                Você tem 3 pagamentos vencendo esta semana. Deseja revisar?
              </p>
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 mt-2 text-xs text-primary"
                onClick={() => navigate("/pagamentos")}
              >
                Ver Pagamentos <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const colorVar = action.color === "destructive" 
            ? "destructive" 
            : action.color === "muted-foreground"
              ? "muted-foreground"
              : `stats-${action.color.replace('stats-', '')}`;

          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(action.href)}
              className={`
                relative flex flex-col items-start p-4 rounded-xl text-left transition-all
                bg-secondary/30 hover:bg-secondary/50 border border-border/50
                hover:border-[hsl(var(--${action.color}))]/30
                group
              `}
            >
              <div className={`p-2 rounded-lg bg-[hsl(var(--${action.color}))]/10 mb-3`}>
                <Icon className={`h-4 w-4 text-[hsl(var(--${action.color}))]`} />
              </div>
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              <p className="text-[10px] text-muted-foreground">{action.description}</p>
              
              {action.badge && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-primary-foreground">
                  {action.badge}
                </span>
              )}

              <ArrowRight className="absolute bottom-3 right-3 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-border/50 flex justify-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-muted-foreground"
          onClick={() => navigate("/configuracoes")}
        >
          Personalizar atalhos
        </Button>
      </div>
    </motion.div>
  );
}
