import { motion } from "framer-motion";
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils";

interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
  type: "save" | "limit";
}

interface FinancialGoalsProps {
  goals: Goal[];
}

export function FinancialGoals({ goals }: FinancialGoalsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Metas Financeiras</h3>
      </div>
      
      <div className="space-y-6">
        {goals.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhuma meta definida ainda.
          </p>
        ) : (
          goals.map((goal, index) => {
            const percentage = Math.min((goal.current / goal.target) * 100, 100);
            const isOverBudget = goal.type === "limit" && goal.current > goal.target;
            const isCompleted = goal.type === "save" && goal.current >= goal.target;
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isOverBudget ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">{goal.name}</span>
                  </div>
                  <span className={`text-xs font-medium ${
                    isOverBudget ? "text-destructive" : 
                    isCompleted ? "text-[hsl(var(--stats-green))]" : 
                    "text-muted-foreground"
                  }`}>
                    {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className={`h-2 ${isOverBudget ? "[&>div]:bg-destructive" : isCompleted ? "[&>div]:bg-[hsl(var(--stats-green))]" : ""}`}
                />
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
