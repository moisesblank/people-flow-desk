import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";

/**
 * Botão global para RECOVERY MANUAL.
 * Regra: APENAS para OWNER logado. Clique explícito do usuário.
 */
export const ManualRefreshButton = memo(function ManualRefreshButton() {
  const { isOwner, isLoading } = useAdminCheck();
  
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // Só exibe para OWNER logado
  if (isLoading || !isOwner) {
    return null;
  }

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
