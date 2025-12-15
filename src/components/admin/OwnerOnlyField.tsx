// ============================================
// MOISÉS MEDEIROS v5.0 - OWNER ONLY FIELD
// Campo editável apenas por Owner (Admin Master)
// Segurança: Verificação via hook useAdminCheck
// ============================================

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Lock, Shield } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface OwnerOnlyFieldProps {
  children: ReactNode;
  fallback?: ReactNode;
  showLockIcon?: boolean;
  className?: string;
}

export function OwnerOnlyField({ 
  children, 
  fallback, 
  showLockIcon = true,
  className = "" 
}: OwnerOnlyFieldProps) {
  const { canEdit, isLoading, isOwner } = useAdminCheck();

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-muted/50 rounded-lg h-10 ${className}`} />
    );
  }

  // Owner tem acesso total
  if (canEdit) {
    return (
      <div className={`relative ${className}`}>
        {isOwner && showLockIcon && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className="absolute -top-2 -right-2 z-10 p-1 rounded-full bg-primary/20 border border-primary/30"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
              >
                <Shield className="h-3 w-3 text-primary" />
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Campo editável (Admin Master)</p>
            </TooltipContent>
          </Tooltip>
        )}
        {children}
      </div>
    );
  }

  // Usuário sem permissão
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`relative opacity-60 cursor-not-allowed ${className}`}>
          <div className="pointer-events-none">
            {children}
          </div>
          {showLockIcon && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Lock className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Apenas o administrador pode editar</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Componente wrapper para seções inteiras
interface OwnerOnlySectionProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function OwnerOnlySection({ children, title, className = "" }: OwnerOnlySectionProps) {
  const { canEdit, isLoading, isOwner } = useAdminCheck();

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-muted/30 rounded-2xl p-6 ${className}`}>
        <div className="h-6 w-32 bg-muted/50 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted/50 rounded" />
          <div className="h-4 w-3/4 bg-muted/50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isOwner && (
        <motion.div
          className="absolute -top-3 left-4 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Shield className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium text-primary">Admin Master</span>
        </motion.div>
      )}
      {!canEdit && (
        <motion.div
          className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Lock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Somente leitura</span>
        </motion.div>
      )}
      <div className={!canEdit ? "pointer-events-none opacity-80" : ""}>
        {children}
      </div>
    </div>
  );
}
