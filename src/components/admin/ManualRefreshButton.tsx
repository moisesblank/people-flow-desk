import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

/**
 * Botão global, sempre visível, para RECOVERY MANUAL.
 * Regra: nunca auto-reload/auto-recovery; somente clique explícito do usuário.
 */
export const ManualRefreshButton = memo(function ManualRefreshButton() {
  const handleRefresh = useCallback(() => {
    // ÚNICO gatilho permitido: ação explícita do usuário
    window.location.reload();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[2147483000]">
      <Button
        type="button"
        onClick={handleRefresh}
        className="gap-2 shadow-lg"
        title="Recarregar a página (ação manual)"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh Page
      </Button>
    </div>
  );
});
