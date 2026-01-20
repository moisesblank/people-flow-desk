// ============================================
// 🧹 CACHE CLEAR WIDGET - Limpeza Global de Cache
// Botão exclusivo para OWNER limpar cache de todos os usuários
// Incrementa cache_epoch → Frontend limpa localStorage automaticamente
// ============================================

import { useState } from "react";
import { Eraser, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CacheClearWidgetProps {
  collapsed?: boolean;
}

export function CacheClearWidget({ collapsed }: CacheClearWidgetProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<string | null>(null);

  const handleClearAllCache = async () => {
    if (isClearing) return;

    setIsClearing(true);

    try {
      // Chamar Edge Function que incrementa o cache_epoch
      const { data, error } = await supabase.functions.invoke("daily-cache-clear", {
        body: { source: "manual", triggered_at: new Date().toISOString() },
      });

      if (error) {
        console.error("[CacheClearWidget] Erro:", error);
        toast.error("Erro ao limpar cache global", {
          description: error.message || "Tente novamente",
          icon: <AlertCircle className="h-4 w-4" />,
        });
        return;
      }

      const epochAfter = data?.epoch_after || "?";
      setLastCleared(new Date().toLocaleTimeString("pt-BR"));

      toast.success("Cache global limpo!", {
        description: `Epoch: ${epochAfter}. Todos os usuários receberão dados frescos.`,
        icon: <CheckCircle2 className="h-4 w-4" />,
        duration: 5000,
      });

      console.log("[CacheClearWidget] ✅ Cache limpo:", data);
    } catch (err) {
      console.error("[CacheClearWidget] Erro inesperado:", err);
      toast.error("Erro inesperado ao limpar cache");
    } finally {
      setIsClearing(false);
    }
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearAllCache}
            disabled={isClearing}
            className="w-full h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            {isClearing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eraser className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Limpar Cache Global</p>
          {lastCleared && (
            <p className="text-xs text-muted-foreground">Último: {lastCleared}</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="border border-border/50 rounded-lg p-3 bg-card/50 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Eraser className="h-4 w-4 text-destructive" />
        <span>Cache Global</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Força todos os usuários a buscarem dados frescos do servidor.
      </p>

      <Button
        variant="outline"
        size="sm"
        onClick={handleClearAllCache}
        disabled={isClearing}
        className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
      >
        {isClearing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Limpando...
          </>
        ) : (
          <>
            <Eraser className="h-3.5 w-3.5" />
            Limpar Cache de Todos
          </>
        )}
      </Button>

      {lastCleared && (
        <p className="text-xs text-muted-foreground text-center">
          ✓ Último: {lastCleared}
        </p>
      )}
    </div>
  );
}
