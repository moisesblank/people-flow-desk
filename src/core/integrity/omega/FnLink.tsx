// FnLink — Link seguro com telemetria
import React, { memo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Lock, Clock } from "lucide-react";
import { BaseFnProps, useFnValidation, trackFnEvent } from "./shared";

interface FnLinkProps extends BaseFnProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: React.ReactNode;
  className?: string;
  status?: "active" | "disabled" | "coming_soon";
}

export const FnLink = memo<FnLinkProps>(({
  fn,
  to,
  children,
  className,
  disabled = false,
  showLockIfNoAccess = true,
  status = "active",
  "data-testid": testId,
  ...props
}) => {
  const { fnExists, hasAccess, userId } = useFnValidation(fn);
  
  // Função não registrada
  if (!fnExists) {
    console.error(`[FnLink] Função não existe: ${fn}`);
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn("cursor-not-allowed opacity-50", className)}
            data-fn={fn}
            data-testid={testId || `fn-link-${fn}`}
            data-fn-error="not-found"
          >
            {children}
            <AlertCircle className="inline-block ml-1 h-3 w-3 text-destructive" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Função não configurada</TooltipContent>
      </Tooltip>
    );
  }
  
  // Coming soon
  if (status === "coming_soon") {
    const handleComingSoonClick = () => {
      trackFnEvent(fn, "click", true, { status: "coming_soon" });
      toast.info("Esta funcionalidade estará disponível em breve!");
    };
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn("cursor-pointer opacity-70", className)}
            onClick={handleComingSoonClick}
            data-fn={fn}
            data-testid={testId || `fn-link-${fn}`}
            data-fn-status="coming_soon"
          >
            {children}
            <Clock className="inline-block ml-1 h-3 w-3 text-warning" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Em breve</TooltipContent>
      </Tooltip>
    );
  }
  
  // Disabled
  if (status === "disabled") {
    return (
      <span 
        className={cn("cursor-not-allowed opacity-50", className)}
        data-fn={fn}
        data-testid={testId || `fn-link-${fn}`}
        data-fn-status="disabled"
      >
        {children}
      </span>
    );
  }
  
  // Sem acesso
  if (!hasAccess && showLockIfNoAccess) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn("cursor-not-allowed opacity-50", className)}
            data-fn={fn}
            data-testid={testId || `fn-link-${fn}`}
            data-fn-access="denied"
          >
            {children}
            <Lock className="inline-block ml-1 h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Sem permissão</TooltipContent>
      </Tooltip>
    );
  }
  
  const handleClick = () => {
    trackFnEvent(fn, "click", true, { to, userId });
  };
  
  return (
    <Link
      to={to}
      className={cn(disabled && "pointer-events-none opacity-50", className)}
      onClick={handleClick}
      data-fn={fn}
      data-testid={testId || `fn-link-${fn}`}
      {...props}
    >
      {children}
    </Link>
  );
});

FnLink.displayName = "FnLink";
