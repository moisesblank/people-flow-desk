import { AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Employee } from "@/types/employee";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  employee,
  onConfirm,
  isLoading,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-md">
        <AlertDialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground leading-relaxed">
            Tem certeza que deseja excluir{" "}
            <strong className="text-foreground font-semibold">{employee?.nome}</strong>?
            <br />
            <span className="text-sm opacity-75">Esta ação não pode ser desfeita.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-3 pt-4">
          <AlertDialogCancel className="rounded-xl border-border hover:bg-secondary px-6">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl px-6 gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
