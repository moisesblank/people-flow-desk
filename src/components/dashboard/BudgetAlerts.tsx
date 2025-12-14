import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Bell, TrendingDown } from "lucide-react";

interface Alert {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  timestamp: Date;
}

interface BudgetAlertsProps {
  alerts: Alert[];
}

export function BudgetAlerts({ alerts }: BudgetAlertsProps) {
  const getAlertStyles = (type: Alert["type"]) => {
    switch (type) {
      case "danger":
        return {
          bg: "bg-destructive/10",
          border: "border-destructive/30",
          icon: AlertCircle,
          iconColor: "text-destructive",
        };
      case "warning":
        return {
          bg: "bg-[hsl(var(--stats-gold))]/10",
          border: "border-[hsl(var(--stats-gold))]/30",
          icon: AlertTriangle,
          iconColor: "text-[hsl(var(--stats-gold))]",
        };
      default:
        return {
          bg: "bg-[hsl(var(--stats-blue))]/10",
          border: "border-[hsl(var(--stats-blue))]/30",
          icon: Bell,
          iconColor: "text-[hsl(var(--stats-blue))]",
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Alertas de Orçamento</h3>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <TrendingDown className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum alerta no momento</p>
            <p className="text-muted-foreground/70 text-xs mt-1">Seus gastos estão sob controle!</p>
          </div>
        ) : (
          alerts.map((alert, index) => {
            const styles = getAlertStyles(alert.type);
            const Icon = styles.icon;
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`p-4 rounded-xl border ${styles.bg} ${styles.border}`}
              >
                <div className="flex gap-3">
                  <Icon className={`h-5 w-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
