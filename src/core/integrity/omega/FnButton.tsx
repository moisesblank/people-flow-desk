// FnButton — Botão seguro com telemetria
import React, { memo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Lock, Loader2 } from "lucide-react";
import { BaseFnProps, useFnValidation, trackFnEvent } from "./shared";

interface FnButtonProps extends BaseFnProps, Omit<ButtonProps, "onClick"> {
  onClick: () => void | Promise<void>;
  confirmMessage?: string;
  children: React.ReactNode;
}

export const FnButton = memo<FnButtonProps>(({
  fn,
  onClick,
  confirmMessage,
  children,
  disabled = false,
  showLockIfNoAccess = true,
  "data-testid": testId,
  ...props
}) => {
  const { fnExists, hasAccess, userId } = useFnValidation(fn);
  const [isLoading, setIsLoading] = useState(false);
  
  // Função não registrada
  if (!fnExists) {
    console.error(`[FnButton] Função não existe: ${fn}`);
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            disabled 
            className={props.className}
            data-fn={fn}
            data-testid={testId || `fn-button-${fn}`}
            data-fn-error="not-found"
          >
            {children}
            <AlertCircle className="ml-1 h-3 w-3 text-destructive" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ação não configurada</TooltipContent>
      </Tooltip>
    );
  }
  
  // Sem acesso
  if (!hasAccess && showLockIfNoAccess) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            disabled 
            className={props.className}
            data-fn={fn}
            data-testid={testId || `fn-button-${fn}`}
            data-fn-access="denied"
          >
            {children}
            <Lock className="ml-1 h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sem permissão</TooltipContent>
      </Tooltip>
    );
  }
  
  const handleClick = useCallback(async () => {
    if (confirmMessage) {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
    }
    
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      await onClick();
      await trackFnEvent(fn, "click", true, {
        userId,
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      console.error(`[FnButton] Erro:`, error);
      await trackFnEvent(fn, "click", false, {
        userId,
        error: String(error),
        durationMs: Date.now() - startTime,
      });
      toast.error("Erro ao executar ação");
    } finally {
      setIsLoading(false);
    }
  }, [fn, onClick, confirmMessage, userId]);
  
  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      data-fn={fn}
      data-testid={testId || `fn-button-${fn}`}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
});

FnButton.displayName = "FnButton";
