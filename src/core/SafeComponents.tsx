// ============================================
// 🛡️ SAFE COMPONENTS — COMPONENTES SEGUROS COM RBAC
// ANO 2300 — Validação automática de rotas e permissões
// ============================================

import React, { memo, ReactNode, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Clock, AlertTriangle, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, RouteKey } from "./routes";
import { NAV_ROUTE_MAP, NAV_RBAC, NAV_STATUS, NavItemKey, UserRole } from "./nav/navRouteMap";
import { isOwner, OWNER_EMAIL, canAccessUrl } from "./urlAccessControl";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// ============================================
// TIPOS
// ============================================

interface SafeLinkProps {
  routeKey: RouteKey;
  params?: Record<string, string>;
  children: ReactNode;
  className?: string;
  showLockIcon?: boolean;
}

interface SafeButtonProps {
  actionKey: string;
  onClick: () => void | Promise<void>;
  confirmMessage?: string;
  confirmTitle?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  requiredRole?: UserRole | UserRole[];
}

interface SafeNavItemProps {
  routeKey?: RouteKey;
  navItemKey?: NavItemKey;
  label: string;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
}

// ============================================
// HELPERS
// ============================================

/**
 * Substitui parâmetros na rota
 * Ex: /cursos/:courseId → /cursos/123
 */
function buildPath(routePath: string, params?: Record<string, string>): string {
  if (!params) return routePath;
  
  let path = routePath;
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value);
  });
  return path;
}

/**
 * Verifica se o usuário pode acessar uma rota
 */
function canAccessRoute(routeKey: RouteKey, role: string | null, email: string | null): boolean {
  // Owner = MASTER = PODE TUDO
  if (isOwner(email, role)) return true;
  
  const path = ROUTES[routeKey];
  if (!path) return false;
  
  return canAccessUrl(role, email, path);
}

/**
 * Verifica se o usuário pode executar uma ação
 */
function canExecuteAction(actionKey: string, role: string | null, email: string | null, requiredRole?: UserRole | UserRole[]): boolean {
  // Owner = MASTER = PODE TUDO
  if (isOwner(email, role)) return true;
  
  if (!requiredRole) return true;
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return role ? roles.includes(role as UserRole) : false;
}

// ============================================
// SAFE LINK
// ============================================

/**
 * 🔗 SafeLink — Link com validação de rota e permissão
 * 
 * @example
 * <SafeLink routeKey="CURSOS" params={{ courseId: "123" }}>
 *   Ver Curso
 * </SafeLink>
 * 
 * ✅ Valida rota e permissão automaticamente
 * ❌ Se não tem acesso → mostra 🔒 e tooltip
 */
export const SafeLink = memo(function SafeLink({
  routeKey,
  params,
  children,
  className = "",
  showLockIcon = true,
}: SafeLinkProps) {
  const { user, role } = useAuth();
  const email = user?.email || null;
  
  const routePath = ROUTES[routeKey];
  const hasAccess = canAccessRoute(routeKey, role, email);
  const finalPath = buildPath(routePath, params);
  
  if (!hasAccess) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(
              "inline-flex items-center gap-1 opacity-50 cursor-not-allowed",
              className
            )}>
              {showLockIcon && <Lock className="w-3 h-3" />}
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">🔒 Acesso restrito</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <Link to={finalPath} className={className}>
      {children}
    </Link>
  );
});

SafeLink.displayName = "SafeLink";

// ============================================
// SAFE BUTTON
// ============================================

/**
 * 🔘 SafeButton — Botão com validação de ação e confirmação
 * 
 * @example
 * <SafeButton 
 *   actionKey="CURSO_DELETE" 
 *   onClick={handleDelete}
 *   confirmMessage="Excluir curso?"
 * >
 *   Excluir
 * </SafeButton>
 * 
 * ✅ Valida ação e pede confirmação se necessário
 */
export const SafeButton = memo(function SafeButton({
  actionKey,
  onClick,
  confirmMessage,
  confirmTitle = "Confirmar ação",
  variant = "default",
  size = "default",
  children,
  className = "",
  disabled = false,
  requiredRole,
}: SafeButtonProps) {
  const { user, role } = useAuth();
  const email = user?.email || null;
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const hasAccess = canExecuteAction(actionKey, role, email, requiredRole);
  
  const handleClick = useCallback(async () => {
    if (confirmMessage) {
      setShowConfirm(true);
    } else {
      setIsLoading(true);
      try {
        await onClick();
      } finally {
        setIsLoading(false);
      }
    }
  }, [confirmMessage, onClick]);
  
  const handleConfirm = useCallback(async () => {
    setShowConfirm(false);
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  }, [onClick]);
  
  if (!hasAccess) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={cn("opacity-50 cursor-not-allowed", className)}
              disabled
            >
              <Lock className="w-3 h-3 mr-1" />
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">🔒 Sem permissão</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <span className="animate-spin mr-1">⏳</span>
        ) : null}
        {children}
      </Button>
      
      {confirmMessage && (
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                {confirmTitle}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="flex items-center gap-1">
                <X className="w-4 h-4" />
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm} className="flex items-center gap-1">
                <Check className="w-4 h-4" />
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
});

SafeButton.displayName = "SafeButton";

// ============================================
// SAFE NAV ITEM
// ============================================

/**
 * 📍 SafeNavItem — Item de navegação com RBAC automático
 * 
 * @example
 * <SafeNavItem 
 *   routeKey="DASHBOARD" 
 *   label="Dashboard" 
 *   icon={<Home />} 
 * />
 * 
 * ✅ RBAC automático
 * ⏰ "Em breve" para status coming_soon
 */
export const SafeNavItem = memo(function SafeNavItem({
  routeKey,
  navItemKey,
  label,
  icon,
  className = "",
  onClick,
}: SafeNavItemProps) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const email = user?.email || null;
  
  // Determinar status e acesso
  let status: "active" | "disabled" | "coming_soon" = "active";
  let hasAccess = true;
  let path = "";
  
  if (navItemKey) {
    status = NAV_STATUS[navItemKey] || "active";
    const allowedRoles = NAV_RBAC[navItemKey];
    hasAccess = isOwner(email, role) || (role ? allowedRoles?.includes(role as UserRole) : false);
    const routeKeyFromNav = NAV_ROUTE_MAP[navItemKey];
    path = routeKeyFromNav ? ROUTES[routeKeyFromNav] : "";
  } else if (routeKey) {
    path = ROUTES[routeKey];
    hasAccess = canAccessRoute(routeKey, role, email);
  }
  
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else if (path && hasAccess && status === "active") {
      navigate(path);
    }
  }, [onClick, path, hasAccess, status, navigate]);
  
  // Coming soon
  if (status === "coming_soon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed",
                className
              )}
              disabled
            >
              {icon}
              <span>{label}</span>
              <Clock className="w-3 h-3 ml-auto" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">⏰ Em breve</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Sem acesso
  if (!hasAccess) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed",
                className
              )}
              disabled
            >
              {icon}
              <span>{label}</span>
              <Lock className="w-3 h-3 ml-auto" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">🔒 Acesso restrito</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Desabilitado
  if (status === "disabled") {
    return (
      <button
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed",
          className
        )}
        disabled
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }
  
  // Ativo e com acesso
  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
});

SafeNavItem.displayName = "SafeNavItem";

// ============================================
// EXPORTS
// ============================================

export default {
  SafeLink,
  SafeButton,
  SafeNavItem,
};
