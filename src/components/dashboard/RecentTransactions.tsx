import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  date: Date;
  category?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value / 100);
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Transações Recentes</h3>
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhuma transação recente.
          </p>
        ) : (
          transactions.slice(0, 5).map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className={`p-2 rounded-lg ${
                transaction.type === "income" 
                  ? "bg-[hsl(var(--stats-green))]/20" 
                  : "bg-[hsl(var(--stats-red))]/20"
              }`}>
                {transaction.type === "income" ? (
                  <ArrowUpRight className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-[hsl(var(--stats-red))]" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {transaction.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(transaction.date, "dd MMM, HH:mm", { locale: ptBR })}
                </p>
              </div>
              
              <span className={`text-sm font-semibold ${
                transaction.type === "income" 
                  ? "text-[hsl(var(--stats-green))]" 
                  : "text-[hsl(var(--stats-red))]"
              }`}>
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(Math.abs(transaction.amount))}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
