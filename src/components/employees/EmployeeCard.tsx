import { Edit2, Trash2, Mail, Briefcase, Building2, Calendar, MoreVertical, Lock, Paperclip } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "./StatusBadge";
import { AttachmentButton } from "@/components/attachments/AutoAttachmentWrapper";
import type { Employee } from "@/types/employee";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  index?: number;
}

function formatCurrency(cents: number | null): string {
  if (cents === null) return "••••••";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getAvatarGradient(name: string): string {
  const gradients = [
    "from-rose-500 to-pink-600",
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-red-500 to-rose-600",
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
}

export function EmployeeCard({ employee, onEdit, onDelete, index = 0 }: EmployeeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1]
      }}
      layout
      className="employee-card group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <motion.div 
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${getAvatarGradient(employee.nome)} text-white font-bold text-lg shadow-lg`}
          whileHover={{ scale: 1.05, rotate: 3 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {getInitials(employee.nome)}
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {employee.nome}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{employee.funcao}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={employee.status} />
              
              {/* Botão de Anexos */}
              <AttachmentButton
                entityType="employee"
                entityId={employee.id}
                entityLabel={employee.nome}
                variant="ghost"
                size="icon"
              />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-popover border-border">
                  <DropdownMenuItem onClick={() => onEdit(employee)} className="gap-2 cursor-pointer">
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(employee)} 
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              <span className="truncate">{employee.setor}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              <span>{format(new Date(employee.dataAdmissao), "dd MMM yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground col-span-2">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              <span className="truncate">{employee.email}</span>
            </div>
          </div>

          {/* Salary */}
          <div className="pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Salário</span>
            {employee.salario === null ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-lg font-bold tabular-nums text-muted-foreground flex items-center gap-2 cursor-help">
                    <Lock className="h-4 w-4" />
                    {formatCurrency(employee.salario)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Informação restrita. Apenas administradores podem visualizar salários.</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-lg font-bold tabular-nums text-foreground">
                {formatCurrency(employee.salario)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
