import { motion } from "framer-motion";
import { 
  Plus, 
  FileText, 
  Users, 
  Wallet, 
  TrendingUp,
  Settings,
  Download,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { icon: Plus, label: "Nova Entrada", path: "/entradas", color: "text-[hsl(var(--stats-green))]" },
    { icon: Wallet, label: "Novo Gasto", path: "/financas-pessoais", color: "text-[hsl(var(--stats-red))]" },
    { icon: Users, label: "Funcionários", path: "/funcionarios", color: "text-[hsl(var(--stats-blue))]" },
    { icon: FileText, label: "Relatórios", path: "/relatorios", color: "text-[hsl(var(--stats-purple))]" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col gap-2 hover:border-primary/50 transition-all"
              onClick={() => navigate(action.path)}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
