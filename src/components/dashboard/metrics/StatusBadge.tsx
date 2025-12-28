// StatusBadge - Componente extraído de IntegratedMetricsDashboard
import { CheckCircle2, AlertCircle, XCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Status = "active" | "pending" | "error" | "syncing";

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const configs = {
    active: { color: "emerald", icon: CheckCircle2, label: "Ativo" },
    pending: { color: "yellow", icon: AlertCircle, label: "Pendente" },
    error: { color: "red", icon: XCircle, label: "Erro" },
    syncing: { color: "blue", icon: RefreshCw, label: "Sincronizando" }
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`border-${config.color}-500/50 text-${config.color}-500 bg-${config.color}-500/10`}
    >
      <Icon className={`h-3 w-3 mr-1 ${status === "syncing" ? "animate-spin" : ""}`} />
      {config.label}
    </Badge>
  );
}
