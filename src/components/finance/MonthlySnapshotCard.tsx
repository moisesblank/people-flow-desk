// ============================================
// CARD DE SNAPSHOT MENSAL
// Mini balanço visual no canto superior
// ============================================

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Lock, Unlock, CheckCircle2, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getMonthName } from "@/hooks/useFinancialHistory";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils";

interface MonthlySnapshotCardProps {
  ano: number;
  mes: number;
  receitas: number;
  despesas: number;
  saldo: number;
  isFechado: boolean;
  onClose?: () => void;
  onClick?: () => void;
  compact?: boolean;
}

export function MonthlySnapshotCard({
  ano,
  mes,
  receitas,
  despesas,
  saldo,
  isFechado,
  onClose,
  onClick,
  compact = false,
}: MonthlySnapshotCardProps) {
  const isPositive = saldo >= 0;
  const percentUsed = receitas > 0 ? Math.min((despesas / receitas) * 100, 100) : 0;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          "relative p-3 rounded-xl border cursor-pointer transition-all hover:shadow-lg",
          isFechado ? "bg-muted/50 border-border" : "bg-card border-border/50",
          isPositive ? "ring-1 ring-green-500/20 hover:ring-green-500/40" : "ring-1 ring-destructive/20 hover:ring-destructive/40"
        )}
      >
        {/* Mini indicador de saldo no canto */}
        <div className={cn(
          "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold",
          isPositive ? "bg-green-500" : "bg-destructive"
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{getMonthName(mes).slice(0, 3)}/{ano}</span>
          {isFechado && <Lock className="h-3 w-3 text-muted-foreground" />}
        </div>

        <div className={cn(
          "text-lg font-bold",
          isPositive ? "text-green-500" : "text-destructive"
        )}>
          {formatCurrency(saldo)}
        </div>

        <Progress 
          value={percentUsed} 
          className="h-1 mt-2"
        />
        
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Clique para detalhes
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={cn(
        "relative overflow-hidden transition-all",
        isFechado ? "bg-muted/30" : "bg-card",
        isPositive ? "border-green-500/30" : "border-destructive/30"
      )}>
        {/* Indicador visual de saldo */}
        <div className={cn(
          "absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 rounded-full opacity-20",
          isPositive ? "bg-green-500" : "bg-destructive"
        )} />

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">{getMonthName(mes)} {ano}</h3>
              </div>
              <Badge 
                variant={isFechado ? "secondary" : "outline"} 
                className="mt-1 text-xs"
              >
                {isFechado ? (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Fechado
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3 mr-1" />
                    Aberto
                  </>
                )}
              </Badge>
            </div>

            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold",
              isPositive ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
            )}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatCurrency(saldo)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Receitas</span>
              <span className="text-green-500 font-medium">{formatCurrency(receitas)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Despesas</span>
              <span className="text-destructive font-medium">{formatCurrency(despesas)}</span>
            </div>
            
            <Progress 
              value={percentUsed} 
              className="h-2 mt-3"
            />
            <p className="text-xs text-muted-foreground text-center">
              {percentUsed.toFixed(0)}% das receitas gastas
            </p>
          </div>

          {!isFechado && onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="w-full mt-3 gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Fechar Mês
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
