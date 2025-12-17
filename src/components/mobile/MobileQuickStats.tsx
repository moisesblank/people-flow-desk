// ============================================
// MOISÉS MEDEIROS - Mobile Quick Stats
// Cards compactos para visão rápida no mobile
// ============================================

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  CheckSquare,
  AlertCircle,
} from "lucide-react";

interface MobileQuickStatsProps {
  income: number;
  expenses: number;
  profit: number;
  pendingTasks: number;
  pendingPayments: number;
  students: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

export function MobileQuickStats({
  income,
  expenses,
  profit,
  pendingTasks,
  pendingPayments,
  students,
}: MobileQuickStatsProps) {
  const stats = [
    {
      label: "Receita",
      value: formatCurrency(income),
      icon: TrendingUp,
      color: "text-stats-green",
      bg: "bg-stats-green/10",
    },
    {
      label: "Despesas",
      value: formatCurrency(expenses),
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Lucro",
      value: formatCurrency(profit),
      icon: Wallet,
      color: profit >= 0 ? "text-stats-green" : "text-destructive",
      bg: profit >= 0 ? "bg-stats-green/10" : "bg-destructive/10",
    },
    {
      label: "Alunos",
      value: students.toString(),
      icon: Users,
      color: "text-stats-blue",
      bg: "bg-stats-blue/10",
    },
  ];

  const alerts = [
    {
      label: "Tarefas Pendentes",
      value: pendingTasks,
      icon: CheckSquare,
      show: pendingTasks > 0,
    },
    {
      label: "Pagamentos Pendentes",
      value: pendingPayments,
      icon: AlertCircle,
      show: pendingPayments > 0,
    },
  ].filter((a) => a.show);

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {stat.label}
                </span>
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1 flex items-center gap-4 text-sm">
            {alerts.map((alert) => (
              <span key={alert.label} className="text-amber-700 dark:text-amber-400">
                <strong>{alert.value}</strong> {alert.label.toLowerCase()}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
