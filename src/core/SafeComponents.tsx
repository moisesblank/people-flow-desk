// ============================================
// 🔥🛡️ SAFE COMPONENTS OMEGA — ZERO CLIQUES MORTOS 🛡️🔥
// Componentes que garantem destino válido
// Integração com URL Access Control + Dead Click Reporter
// ============================================

import React, { memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RouteKey, ROUTES, getRoute, canAccessRoute, getRouteDefinition } from "./routes";
import { ActionKey, ACTIONS, canExecuteAction, requiresConfirmation } from "./actions";
import { useAuth } from "@/hooks/useAuth";
import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Lock, Clock, ExternalLink } from "lucide-react";

// ============================================
// TIPOS
// ============================================
interface SafeLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  routeKey: RouteKey;
  params?: Record<string, string>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  showLockIfNoAccess?: boolean;
}

interface SafeButtonProps extends Omit<ButtonProps, "onClick"> {
  actionKey: ActionKey;
  onClick: () => void | Promise<void>;
  confirmMessage?: string;
  children: React.ReactNode;
  disabled?: boolean;
  showLockIfNoAccess?: boolean;
}

interface SafeNavItemProps {
  routeKey: RouteKey;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  className?: string;
}

interface SafeDownloadProps {
  fileId: string;
  fileName?: string;
  children: React.ReactNode;
  className?: string;
  onDownload?: (fileId: string) => Promise<string>;
}

interface SafeExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  trackClick?: boolean;
}

// ============================================
// SAFE LINK
// ============================================
export const SafeLink = memo<SafeLinkProps>(({
  routeKey,
  params,
  children,
  className,
  disabled = false,
  showLockIfNoAccess = true,
  ...props
}) => {
  const { role } = useAuth();
  const definition = getRouteDefinition(routeKey);
  
  // Verificar se rota existe
  if (!ROUTES[routeKey]) {
    console.error(`[SafeLink] Rota não existe: ${routeKey}`);
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("cursor-not-allowed opacity-50", className)}>
            {children}
            <AlertCircle className="inline-block ml-1 h-3 w-3 text-destructive" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Rota não configurada</TooltipContent>
      </Tooltip>
    );
  }
  
  // Verificar status
  if (definition.status === "coming_soon") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("cursor-not-allowed opacity-70", className)}>
            {children}
            <Clock className="inline-block ml-1 h-3 w-3 text-warning" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Em breve</TooltipContent>
      </Tooltip>
    );
  }
  
  if (definition.status === "disabled") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("cursor-not-allowed opacity-50", className)}>
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent>Indisponível</TooltipContent>
      </Tooltip>
    );
  }
  
  // Verificar acesso
  const hasAccess = canAccessRoute(routeKey, role);
  
  if (!hasAccess && showLockIfNoAccess) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("cursor-not-allowed opacity-50", className)}>
            {children}
            <Lock className="inline-block ml-1 h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Sem permissão</TooltipContent>
      </Tooltip>
    );
  }
  
  // Montar path com params
  let path = getRoute(routeKey);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
  }
  
  // Render normal
  return (
    <Link
      to={path}
      className={cn(
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
});

SafeLink.displayName = "SafeLink";

// ============================================
// SAFE BUTTON
// ============================================
export const SafeButton = memo<SafeButtonProps>(({
  actionKey,
  onClick,
  confirmMessage,
  children,
  disabled = false,
  showLockIfNoAccess = true,
  ...props
}) => {
  const { role } = useAuth();
  
  // Verificar se ação existe
  if (!ACTIONS[actionKey]) {
    console.error(`[SafeButton] Ação não existe: ${actionKey}`);
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button disabled className={props.className}>
            {children}
            <AlertCircle className="ml-1 h-3 w-3 text-destructive" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ação não configurada</TooltipContent>
      </Tooltip>
    );
  }
  
  // Verificar acesso
  const hasAccess = canExecuteAction(actionKey, role);
  
  if (!hasAccess && showLockIfNoAccess) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button disabled className={props.className}>
            {children}
            <Lock className="ml-1 h-3 w-3 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sem permissão</TooltipContent>
      </Tooltip>
    );
  }
  
  // Handler com confirmação opcional
  const handleClick = useCallback(async () => {
    const needsConfirm = confirmMessage || requiresConfirmation(actionKey);
    
    if (needsConfirm) {
      const confirmed = window.confirm(confirmMessage || "Tem certeza que deseja continuar?");
      if (!confirmed) return;
    }
    
    try {
      await onClick();
    } catch (error) {
      console.error(`[SafeButton] Erro na ação ${actionKey}:`, error);
      toast.error("Erro ao executar ação");
    }
  }, [actionKey, onClick, confirmMessage]);
  
  return (
    <Button
      onClick={handleClick}
      disabled={disabled || !hasAccess}
      {...props}
    >
      {children}
    </Button>
  );
});

SafeButton.displayName = "SafeButton";

// ============================================
// SAFE NAV ITEM
// ============================================
export const SafeNavItem = memo<SafeNavItemProps>(({
  routeKey,
  label,
  icon,
  badge,
  className,
}) => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const definition = getRouteDefinition(routeKey);
  
  // Verificar se rota existe
  if (!ROUTES[routeKey]) {
    console.error(`[SafeNavItem] Rota não existe: ${routeKey}`);
    return null;
  }
  
  // Verificar acesso
  const hasAccess = canAccessRoute(routeKey, role);
  const isComingSoon = definition.status === "coming_soon";
  const isDisabled = definition.status === "disabled" || !hasAccess;
  
  const handleClick = useCallback(() => {
    if (isDisabled) {
      if (!hasAccess) {
        toast.error("Você não tem permissão para acessar esta área");
      }
      return;
    }
    
    if (isComingSoon) {
      toast.info("Esta funcionalidade estará disponível em breve!");
      return;
    }
    
    navigate(getRoute(routeKey));
  }, [routeKey, isDisabled, isComingSoon, hasAccess, navigate]);
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 w-full p-2 rounded-md transition-colors",
        isDisabled && "opacity-50 cursor-not-allowed",
        isComingSoon && "opacity-70",
        !isDisabled && !isComingSoon && "hover:bg-accent",
        className
      )}
      disabled={isDisabled}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {isComingSoon && <Clock className="h-3 w-3 text-warning" />}
      {!hasAccess && <Lock className="h-3 w-3 text-muted-foreground" />}
      {badge && (
        <span className="text-xs bg-primary/20 text-primary px-1.5 rounded">
          {badge}
        </span>
      )}
    </button>
  );
});

SafeNavItem.displayName = "SafeNavItem";

// ============================================
// SAFE DOWNLOAD
// ============================================
export const SafeDownload = memo<SafeDownloadProps>(({
  fileId,
  fileName,
  children,
  className,
  onDownload,
}) => {
  const [loading, setLoading] = React.useState(false);
  
  const handleDownload = useCallback(async () => {
    if (!onDownload) {
      console.error("[SafeDownload] onDownload não fornecido");
      toast.error("Download não configurado");
      return;
    }
    
    setLoading(true);
    
    try {
      const signedUrl = await onDownload(fileId);
      
      if (!signedUrl) {
        toast.error("Erro ao obter URL do arquivo");
        return;
      }
      
      // Criar link temporário e clicar
      const link = document.createElement("a");
      link.href = signedUrl;
      link.download = fileName || "download";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download iniciado");
    } catch (error) {
      console.error("[SafeDownload] Erro:", error);
      toast.error("Erro ao baixar arquivo");
    } finally {
      setLoading(false);
    }
  }, [fileId, fileName, onDownload]);
  
  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1",
        loading && "opacity-50 cursor-wait",
        className
      )}
    >
      {children}
      {loading && <span className="animate-spin">⏳</span>}
    </button>
  );
});

SafeDownload.displayName = "SafeDownload";

// ============================================
// SAFE EXTERNAL LINK
// ============================================
export const SafeExternalLink = memo<SafeExternalLinkProps>(({
  href,
  children,
  trackClick = true,
  className,
  ...props
}) => {
  const handleClick = useCallback(() => {
    if (trackClick) {
      console.log(`[Analytics] External link clicked: ${href}`);
    }
  }, [href, trackClick]);
  
  // Validar URL
  let isValidUrl = true;
  try {
    new URL(href);
  } catch {
    isValidUrl = href.startsWith("mailto:") || href.startsWith("tel:");
  }
  
  if (!isValidUrl) {
    console.error(`[SafeExternalLink] URL inválida: ${href}`);
    return (
      <span className={cn("cursor-not-allowed opacity-50", className)}>
        {children}
      </span>
    );
  }
  
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
});

SafeExternalLink.displayName = "SafeExternalLink";

// ============================================
// EXPORTS
// ============================================
export default {
  SafeLink,
  SafeButton,
  SafeNavItem,
  SafeDownload,
  SafeExternalLink,
};
