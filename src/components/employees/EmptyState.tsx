import { Users } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 glass-card rounded-xl">
      <div className="rounded-full bg-secondary/50 p-6 mb-6">
        <Users className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Nenhum funcionário cadastrado
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        Comece adicionando seu primeiro funcionário clicando no botão "Novo Funcionário" acima.
      </p>
    </div>
  );
}
