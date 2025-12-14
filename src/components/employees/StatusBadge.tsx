import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmployeeStatus } from "@/types/employee";

interface StatusBadgeProps {
  status: EmployeeStatus;
}

const statusConfig: Record<EmployeeStatus, { label: string; className: string }> = {
  ativo: {
    label: "Ativo",
    className: "bg-status-active/20 text-status-active border-status-active/30",
  },
  ferias: {
    label: "Férias",
    className: "bg-status-vacation/20 text-status-vacation border-status-vacation/30",
  },
  afastado: {
    label: "Afastado",
    className: "bg-status-away/20 text-status-away border-status-away/30",
  },
  inativo: {
    label: "Inativo",
    className: "bg-status-inactive/20 text-status-inactive border-status-inactive/30",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}
