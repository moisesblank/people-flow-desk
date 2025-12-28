// FnMenuItem — Item de menu seguro
import React, { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AlertCircle, Lock, Clock } from "lucide-react";
import { BaseFnProps, useFnValidation, trackFnEvent } from "./shared";

interface FnMenuItemProps extends BaseFnProps {
  label: string;
  icon?: React.ReactNode;
  to?: string;
  onClick?: () => void;
  status?: "active" | "disabled" | "coming_soon";
  danger?: boolean;
  className?: string;
}

export const FnMenuItem = memo<FnMenuItemProps>(({
  fn,
  label,
  icon,
  to,
  onClick,
  status = "active",
  danger = false,
  disabled = false,
  showLockIfNoAccess = true,
  "data-testid": testId,
  className,
}) => {
  const { fnExists, hasAccess, userId } = useFnValidation(fn);
  const navigate = useNavigate();
  
  const isDisabled = disabled || !fnExists || (!hasAccess && showLockIfNoAccess) || status === "disabled";
  const isComingSoon = status === "coming_soon";
  
  const handleClick = useCallback(async () => {
    if (isDisabled) return;
    
    if (isComingSoon) {
      await trackFnEvent(fn, "click", true, { status: "coming_soon" });
      toast.info("Em breve!");
      return;
    }
    
    await trackFnEvent(fn, "click", true, { userId, to });
    
    if (to) {
      navigate(to);
    }
    
    onClick?.();
  }, [fn, to, onClick, isDisabled, isComingSoon, userId, navigate]);
  
  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors",
        "hover:bg-accent focus:bg-accent outline-none",
        danger && "text-destructive hover:bg-destructive/10",
        isDisabled && "opacity-50 cursor-not-allowed",
        isComingSoon && "opacity-70",
        className
      )}
      data-fn={fn}
      data-testid={testId || `fn-menu-${fn}`}
      data-fn-status={status}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {!fnExists && <AlertCircle className="h-3 w-3 text-destructive" />}
      {!hasAccess && fnExists && <Lock className="h-3 w-3 text-muted-foreground" />}
      {isComingSoon && <Clock className="h-3 w-3 text-warning" />}
    </button>
  );
});

FnMenuItem.displayName = "FnMenuItem";
