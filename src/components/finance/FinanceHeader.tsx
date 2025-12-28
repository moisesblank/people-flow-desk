// ============================================
// FINANCE HEADER - Componente extraído de FinancasEmpresa
// Cabeçalho futurista com filtros e ações
// ============================================

import { motion } from "framer-motion";
import { 
  Sparkles, Bot, AlertTriangle, RefreshCw, Plus,
  Building2, Receipt, CreditCard, Command, Cpu,
  Clock, Calendar, CalendarDays, CalendarRange, History, Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import type { CompanyPeriodFilter } from "@/hooks/useCompanyFinanceHistory";

const PERIOD_OPTIONS = [
  { value: "hoje", label: "Hoje", icon: Clock },
  { value: "semana", label: "Semana", icon: CalendarDays },
  { value: "mes", label: "Mês", icon: Calendar },
  { value: "ano", label: "Ano", icon: CalendarRange },
  { value: "10anos", label: "10 Anos", icon: History },
  { value: "50anos", label: "50 Anos", icon: Archive },
] as const;

export type ItemType = "gasto_fixo" | "gasto_extra" | "pagamento";

interface FinanceHeaderProps {
  period: CompanyPeriodFilter;
  onPeriodChange: (period: CompanyPeriodFilter) => void;
  countAtrasado: number;
  onRefresh: () => void;
  onOpenModal: (type: ItemType) => void;
}

export function FinanceHeader({
  period,
  onPeriodChange,
  countAtrasado,
  onRefresh,
  onOpenModal,
}: FinanceHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 relative"
    >
      {/* Efeito de partículas de fundo */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-0 right-1/4 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="flex items-center gap-2 text-primary mb-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>
        <span className="text-sm font-medium uppercase tracking-wider">Central Financeira Inteligente</span>
        <Badge variant="outline" className="ml-2 text-[10px] bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse">
          <Bot className="h-3 w-3 mr-1" /> IA Ativa
        </Badge>
        {countAtrasado > 0 && (
          <Badge className="ml-2 text-[10px] bg-red-500/20 text-red-400 border-red-500/30 animate-bounce">
            <AlertTriangle className="h-3 w-3 mr-1" /> {countAtrasado} Atrasado(s)!
          </Badge>
        )}
      </div>
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-pink-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
            <Command className="h-8 w-8 text-primary" />
            Central Financeira 2300
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-500" />
            Sistema unificado com IA • Gastos • Pagamentos • Gráficos • Relatórios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filter */}
          <div className="flex items-center gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={period === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => onPeriodChange(opt.value as CompanyPeriodFilter)}
                className="gap-1"
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </Button>
            ))}
          </div>

          <Button onClick={onRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                Novo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpenModal("gasto_fixo")}>
                <Building2 className="h-4 w-4 mr-2 text-red-500" /> Gasto Fixo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenModal("gasto_extra")}>
                <Receipt className="h-4 w-4 mr-2 text-blue-500" /> Gasto Extra
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOpenModal("pagamento")}>
                <CreditCard className="h-4 w-4 mr-2 text-purple-500" /> Pagamento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}
