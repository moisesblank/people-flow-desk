// ============================================
// MINIMIZABLE SECTION - Enterprise UI Component
// Seções minimizáveis com transições suaves
// ============================================

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Minus, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface MinimizableSectionProps {
  title?: string;
  icon?: React.ReactNode;
  defaultMinimized?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
  showControls?: boolean;
  variant?: "card" | "simple" | "glass";
  collapsible?: boolean;
  storageKey?: string; // Para persistir estado
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function MinimizableSection({
  title,
  icon,
  defaultMinimized = false,
  className,
  headerClassName,
  contentClassName,
  children,
  showControls = true,
  variant = "card",
  collapsible = true,
  storageKey,
  badge,
  actions,
}: MinimizableSectionProps) {
  const [isMinimized, setIsMinimized] = React.useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`minimized-${storageKey}`);
      return stored ? JSON.parse(stored) : defaultMinimized;
    }
    return defaultMinimized;
  });

  React.useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`minimized-${storageKey}`, JSON.stringify(isMinimized));
    }
  }, [isMinimized, storageKey]);

  const toggle = () => {
    if (collapsible) {
      setIsMinimized(!isMinimized);
    }
  };

  const variantStyles = {
    card: "bg-card border border-border rounded-xl shadow-sm",
    simple: "bg-transparent",
    glass: "bg-background/50 backdrop-blur-xl border border-white/10 rounded-xl",
  };

  return (
    <div className={cn(variantStyles[variant], className)}>
      {/* Header */}
      {(title || showControls) && (
        <div
          className={cn(
            "flex items-center justify-between gap-2 p-3",
            collapsible && "cursor-pointer select-none hover:bg-muted/30 transition-colors",
            variant === "card" && "border-b border-border/50",
            isMinimized && variant === "card" && "border-b-0",
            headerClassName
          )}
          onClick={toggle}
        >
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <span className="text-primary shrink-0">{icon}</span>
            )}
            {title && (
              <span className="font-medium text-sm truncate">{title}</span>
            )}
            {badge}
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions}
            {showControls && collapsible && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
              >
                {isMinimized ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content with animation */}
      <AnimatePresence initial={false}>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={cn("p-3 pt-0", contentClassName)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook para usar estado minimizável em qualquer componente
export function useMinimizable(key: string, defaultValue = false) {
  const [isMinimized, setIsMinimized] = React.useState(() => {
    const stored = localStorage.getItem(`minimized-${key}`);
    return stored ? JSON.parse(stored) : defaultValue;
  });

  React.useEffect(() => {
    localStorage.setItem(`minimized-${key}`, JSON.stringify(isMinimized));
  }, [isMinimized, key]);

  const toggle = React.useCallback(() => {
    setIsMinimized((prev: boolean) => !prev);
  }, []);

  const minimize = React.useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximize = React.useCallback(() => {
    setIsMinimized(false);
  }, []);

  return {
    isMinimized,
    toggle,
    minimize,
    maximize,
    setIsMinimized,
  };
}

// Componente de botão minimizar reutilizável
interface MinimizeButtonProps {
  isMinimized: boolean;
  onClick: () => void;
  className?: string;
  variant?: "icon" | "text";
}

export function MinimizeButton({
  isMinimized,
  onClick,
  className,
  variant = "icon",
}: MinimizeButtonProps) {
  if (variant === "text") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={cn("gap-1", className)}
      >
        {isMinimized ? (
          <>
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="text-xs">Expandir</span>
          </>
        ) : (
          <>
            <Minus className="h-3.5 w-3.5" />
            <span className="text-xs">Minimizar</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("h-7 w-7 p-0", className)}
      title={isMinimized ? "Expandir" : "Minimizar"}
    >
      {isMinimized ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <Minus className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

export default MinimizableSection;
