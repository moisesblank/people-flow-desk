import { Edit2, Trash2, Mail, Briefcase, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import type { Employee } from "@/types/employee";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function EmployeeCard({ employee, onEdit, onDelete }: EmployeeCardProps) {
  return (
    <div className="employee-card fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-lg">
              {employee.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {employee.nome}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                <span className="truncate">{employee.funcao}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{employee.setor}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{format(new Date(employee.dataAdmissao), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
            <div className="text-foreground font-semibold">
              {formatCurrency(employee.salario)}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <StatusBadge status={employee.status} />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={() => onEdit(employee)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(employee)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
