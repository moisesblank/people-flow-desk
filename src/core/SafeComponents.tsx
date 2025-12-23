// ============================================
// 🔥🛡️ SAFE COMPONENTS OMEGA — ZERO CLIQUES MORTOS 🛡️🔥
// Componentes que garantem destino válido
// Integração com URL Access Control + Dead Click Reporter
// ============================================

import React, { memo, useCallback, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RouteKey, ROUTES, getRoute, canAccessRoute, getRouteDefinition } from "./routes";
import { ActionKey, ACTIONS, canExecuteAction, requiresConfirmation } from "./actions";
import { validateAccess, AppRole } from "./urlAccessControl";
import { useAuth } from "@/hooks/useAuth";
import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Lock, Clock, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  
  let path = getRoute(routeKey);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
  }
  
  return (
    <Link
      to={path}
      className={cn(disabled && "pointer-events-none opacity-50", className)}
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
    <Button onClick={handleClick} disabled={disabled || !hasAccess} {...props}>
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
  
  if (!ROUTES[routeKey]) {
    console.error(`[SafeNavItem] Rota não existe: ${routeKey}`);
    return null;
  }
  
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
      className={cn("inline-flex items-center gap-1", loading && "opacity-50 cursor-wait", className)}
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
// SAFE ACTION EXECUTOR
// ============================================
interface SafeActionExecutorProps {
  actionKey: ActionKey;
  children: (execute: () => Promise<void>, isLoading: boolean) => React.ReactNode;
  onExecute: () => void | Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  confirmMessage?: string;
}

export const SafeActionExecutor = memo<SafeActionExecutorProps>(({
  actionKey,
  children,
  onExecute,
  onSuccess,
  onError,
  confirmMessage,
}) => {
  const { user, role } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);

  const execute = useCallback(async () => {
    if (!canExecuteAction(actionKey, role)) {
      toast.error("Você não tem permissão para esta ação");
      return;
    }

    if (confirmMessage || requiresConfirmation(actionKey)) {
      const confirmed = window.confirm(confirmMessage || "Tem certeza?");
      if (!confirmed) return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      await onExecute();
      onSuccess?.();
    } catch (error) {
      const err = error as Error;
      toast.error("Erro ao executar ação");
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  }, [actionKey, onExecute, confirmMessage, role, onSuccess, onError]);

  return <>{children(execute, isLoading)}</>;
});

SafeActionExecutor.displayName = "SafeActionExecutor";

// ============================================
// SAFE FORM SUBMIT
// ============================================
interface SafeFormSubmitProps extends Omit<ButtonProps, "type"> {
  actionKey: ActionKey;
  formId?: string;
  children: React.ReactNode;
  isSubmitting?: boolean;
}

export const SafeFormSubmit = memo<SafeFormSubmitProps>(({
  actionKey,
  formId,
  children,
  isSubmitting = false,
  disabled,
  ...props
}) => {
  const { role } = useAuth();
  const hasAccess = canExecuteAction(actionKey, role);

  if (!hasAccess) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="submit" disabled className={props.className}>
            {children}
            <Lock className="ml-1 h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sem permissão</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button type="submit" form={formId} disabled={disabled || isSubmitting} {...props}>
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        children
      )}
    </Button>
  );
});

SafeFormSubmit.displayName = "SafeFormSubmit";

// ============================================
// SAFE CARD
// ============================================
interface SafeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  routeKey: RouteKey;
  params?: Record<string, string>;
  children: React.ReactNode;
  disabled?: boolean;
}

export const SafeCard = memo<SafeCardProps>(({
  routeKey,
  params,
  children,
  disabled = false,
  className,
  ...props
}) => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const definition = getRouteDefinition(routeKey);
  const hasAccess = canAccessRoute(routeKey, role);

  const handleClick = useCallback(() => {
    if (disabled || !hasAccess) return;

    if (definition.status === "coming_soon") {
      toast.info("Esta funcionalidade estará disponível em breve!");
      return;
    }

    let path = getRoute(routeKey);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, value);
      });
    }

    navigate(path);
  }, [routeKey, params, disabled, hasAccess, definition.status, navigate]);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "cursor-pointer transition-all relative",
        disabled && "opacity-50 cursor-not-allowed",
        !hasAccess && "opacity-50 cursor-not-allowed",
        hasAccess && !disabled && "hover:shadow-lg hover:-translate-y-1",
        className
      )}
      data-route={routeKey}
      data-testid={`card-${routeKey.toLowerCase()}`}
      {...props}
    >
      {children}
      {!hasAccess && (
        <div className="absolute top-2 right-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      {definition.status === "coming_soon" && (
        <div className="absolute top-2 right-2">
          <Clock className="h-4 w-4 text-warning" />
        </div>
      )}
    </div>
  );
});

SafeCard.displayName = "SafeCard";

// ============================================
// SAFE MENU ITEM
// ============================================
interface SafeMenuItemProps {
  routeKey?: RouteKey;
  actionKey?: ActionKey;
  onClick?: () => void;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SafeMenuItem = memo<SafeMenuItemProps>(({
  routeKey,
  actionKey,
  onClick,
  label,
  icon,
  danger = false,
  disabled = false,
  className,
}) => {
  const { role } = useAuth();
  const navigate = useNavigate();

  let hasAccess = true;
  let isComingSoon = false;

  if (routeKey) {
    hasAccess = canAccessRoute(routeKey, role);
    const def = getRouteDefinition(routeKey);
    isComingSoon = def.status === "coming_soon";
  }

  if (actionKey) {
    hasAccess = hasAccess && canExecuteAction(actionKey, role);
  }

  const handleClick = useCallback(() => {
    if (disabled || !hasAccess) return;

    if (isComingSoon) {
      toast.info("Em breve!");
      return;
    }

    if (routeKey) {
      navigate(getRoute(routeKey));
    }

    onClick?.();
  }, [routeKey, onClick, disabled, hasAccess, isComingSoon, navigate]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !hasAccess}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors",
        "hover:bg-accent focus:bg-accent outline-none",
        danger && "text-destructive hover:bg-destructive/10",
        (disabled || !hasAccess) && "opacity-50 cursor-not-allowed",
        className
      )}
      data-route={routeKey}
      data-action={actionKey}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {!hasAccess && <Lock className="h-3 w-3 text-muted-foreground" />}
      {isComingSoon && <Clock className="h-3 w-3 text-warning" />}
    </button>
  );
});

SafeMenuItem.displayName = "SafeMenuItem";

// ============================================
// SAFE PROTECTED CONTENT
// ============================================
interface SafeProtectedContentProps {
  roles: AppRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLock?: boolean;
}

export const SafeProtectedContent = memo<SafeProtectedContentProps>(({
  roles,
  children,
  fallback,
  showLock = false,
}) => {
  const { role } = useAuth();
  const hasAccess = role === "owner" || (role && roles.includes(role as AppRole));

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;

    if (showLock) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Lock className="h-4 w-4" />
          <span>Acesso restrito</span>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
});

SafeProtectedContent.displayName = "SafeProtectedContent";

// ============================================
// SAFE ROUTE GUARD
// ============================================
interface SafeRouteGuardProps {
  routeKey: RouteKey;
  children: React.ReactNode;
  redirectTo?: string;
}

export const SafeRouteGuard = memo<SafeRouteGuardProps>(({
  routeKey,
  children,
  redirectTo = "/auth",
}) => {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    const result = validateAccess(role, user?.email || null, location.pathname);

    if (!result.allowed) {
      toast.error(
        result.reason === "NOT_AUTHENTICATED"
          ? "Faça login para continuar"
          : "Você não tem permissão para acessar esta página"
      );

      navigate(result.redirectTo || redirectTo);
    }
  }, [user, role, isLoading, location.pathname, navigate, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
});

SafeRouteGuard.displayName = "SafeRouteGuard";

// ============================================
// SAFE BADGE
// ============================================
interface SafeBadgeProps {
  status: "active" | "disabled" | "coming_soon" | "beta";
  className?: string;
}

export const SafeBadge = memo<SafeBadgeProps>(({ status, className }) => {
  const config = {
    active: { icon: ShieldCheck, text: "Ativo", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    disabled: { icon: Lock, text: "Desativado", color: "bg-muted text-muted-foreground border-border" },
    coming_soon: { icon: Clock, text: "Em breve", color: "bg-warning/20 text-warning border-warning/30" },
    beta: { icon: AlertCircle, text: "Beta", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  };

  const { icon: Icon, text, color } = config[status];

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
      color,
      className
    )}>
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
});

SafeBadge.displayName = "SafeBadge";

// ============================================
// EXPORTS
// ============================================
export default {
  SafeLink,
  SafeButton,
  SafeNavItem,
  SafeDownload,
  SafeExternalLink,
  SafeActionExecutor,
  SafeFormSubmit,
  SafeCard,
  SafeMenuItem,
  SafeProtectedContent,
  SafeRouteGuard,
  SafeBadge,
};
