import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { EmployeeStatus } from "@/types/employee";

interface StatusBadgeProps {
  status: EmployeeStatus;
}

const statusConfig: Record<EmployeeStatus, { 
  label: string; 
  className: string;
  dotClass: string;
}> = {
  ativo: {
    label: "Ativo",
    className: "bg-status-active/10 text-status-active border-status-active/20",
    dotClass: "bg-status-active",
  },
  ferias: {
    label: "Férias",
    className: "bg-status-vacation/10 text-status-vacation border-status-vacation/20",
    dotClass: "bg-status-vacation",
  },
  afastado: {
    label: "Afastado",
    className: "bg-status-away/10 text-status-away border-status-away/20",
    dotClass: "bg-status-away",
  },
  inativo: {
    label: "Inativo",
    className: "bg-status-inactive/10 text-status-inactive border-status-inactive/20",
    dotClass: "bg-status-inactive",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm",
        config.className
      )}
    >
      <span className="relative flex h-2 w-2">
        {status === "ativo" && (
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.dotClass)} />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", config.dotClass)} />
      </span>
      {config.label}
    </motion.div>
  );
}
