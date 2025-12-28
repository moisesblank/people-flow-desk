// ============================================
// MODAL DE BALANÇO MENSAL DETALHADO
// Exibe todas as informações do mês
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Lock, Unlock, Calendar, 
  Wallet, ArrowUpCircle, ArrowDownCircle, PieChart 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getMonthName } from "@/hooks/useFinancialHistory";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils";

interface MonthlySnapshot {
  id: string;
  ano: number;
  mes: number;
  receitas_total: number;
  despesas_fixas_total: number;
  despesas_extras_total: number;
  despesas_total: number;
  saldo_periodo: number;
  despesas_por_categoria: Record<string, number>;
  is_fechado: boolean;
}

interface MonthlyBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: MonthlySnapshot | null;
  onCloseMonth?: () => void;
}

export function MonthlyBalanceModal({
  isOpen,
  onClose,
  snapshot,
  onCloseMonth,
}: MonthlyBalanceModalProps) {
  if (!snapshot) return null;

  const isPositive = snapshot.saldo_periodo >= 0;
  const percentUsed = snapshot.receitas_total > 0 
    ? Math.min((snapshot.despesas_total / snapshot.receitas_total) * 100, 100) 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            Balanço de {getMonthName(snapshot.mes)} {snapshot.ano}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Status do Mês */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={snapshot.is_fechado ? "secondary" : "outline"} 
              className="text-sm"
            >
              {snapshot.is_fechado ? (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Mês Fechado
                </>
              ) : (
                <>
                  <Unlock className="h-3 w-3 mr-1" />
                  Mês em Aberto
                </>
              )}
            </Badge>

            {/* Indicador de Saldo */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full font-bold",
              isPositive ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
            )}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatCurrency(snapshot.saldo_periodo)}
            </div>
          </div>

          <Separator />

          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Receitas</span>
              </div>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(snapshot.receitas_total)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-xl bg-destructive/10 border border-destructive/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Despesas</span>
              </div>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(snapshot.despesas_total)}
              </p>
            </motion.div>
          </div>

          {/* Detalhamento das Despesas */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Detalhamento das Despesas
            </h4>

            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Gastos Fixos</span>
                  <span className="font-medium text-destructive">
                    {formatCurrency(snapshot.despesas_fixas_total)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Gastos Extras</span>
                  <span className="font-medium text-destructive">
                    {formatCurrency(snapshot.despesas_extras_total)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Despesas</span>
                  <span className="font-bold text-destructive">
                    {formatCurrency(snapshot.despesas_total)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Utilização das Receitas</span>
              <span className="font-medium">{percentUsed.toFixed(1)}%</span>
            </div>
            <Progress value={percentUsed} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {percentUsed <= 80 
                ? "✓ Dentro do limite saudável (≤80%)" 
                : percentUsed <= 100 
                  ? "⚠ Próximo do limite" 
                  : "❌ Acima das receitas"
              }
            </p>
          </div>

          {/* Saldo Final Destacado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "p-5 rounded-xl text-center",
              isPositive ? "bg-green-500/10 border-2 border-green-500/30" : "bg-destructive/10 border-2 border-destructive/30"
            )}
          >
            <p className="text-sm text-muted-foreground mb-1">Saldo do Mês</p>
            <p className={cn(
              "text-3xl font-bold",
              isPositive ? "text-green-500" : "text-destructive"
            )}>
              {formatCurrency(snapshot.saldo_periodo)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {isPositive ? "Você economizou este mês! 🎉" : "Gastos superaram as receitas 😔"}
            </p>
          </motion.div>

          {/* Botão Fechar Mês */}
          {!snapshot.is_fechado && onCloseMonth && (
            <Button onClick={onCloseMonth} className="w-full gap-2">
              <Lock className="h-4 w-4" />
              Fechar Mês
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
