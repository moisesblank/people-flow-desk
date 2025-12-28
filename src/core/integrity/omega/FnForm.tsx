// FnForm — Formulário seguro com validação
import React, { memo, useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { BaseFnProps, useFnValidation, trackFnEvent } from "./shared";

// ============================================
// FnForm Context
// ============================================
interface FnFormContextValue {
  isSubmitting: boolean;
  hasAccess: boolean;
  fnExists: boolean;
}

const FnFormContext = createContext<FnFormContextValue>({
  isSubmitting: false,
  hasAccess: true,
  fnExists: true,
});

export const useFnForm = () => useContext(FnFormContext);

// ============================================
// FnForm — Formulário seguro com validação
// ============================================
interface FnFormProps extends BaseFnProps, Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  onSubmit: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  confirmMessage?: string;
}

export const FnForm = memo<FnFormProps>(({
  fn,
  onSubmit,
  children,
  confirmMessage,
  disabled = false,
  showLockIfNoAccess = true,
  "data-testid": testId,
  className,
  ...props
}) => {
  const { fnExists, hasAccess, userId } = useFnValidation(fn);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!fnExists || (!hasAccess && showLockIfNoAccess) || disabled) {
      return;
    }
    
    if (confirmMessage) {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
    }
    
    setIsSubmitting(true);
    const startTime = Date.now();
    const formData = new FormData(e.currentTarget);
    
    try {
      await onSubmit(formData);
      await trackFnEvent(fn, "submit", true, {
        userId,
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      console.error(`[FnForm] Erro:`, error);
      await trackFnEvent(fn, "submit", false, {
        userId,
        error: String(error),
        durationMs: Date.now() - startTime,
      });
      toast.error("Erro ao enviar formulário");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!fnExists) {
    return (
      <div 
        className={cn("opacity-50", className)}
        data-fn={fn}
        data-testid={testId || `fn-form-${fn}`}
        data-fn-error="not-found"
      >
        <div className="flex items-center gap-2 text-destructive text-sm mb-2">
          <AlertCircle className="h-4 w-4" />
          <span>Formulário não configurado</span>
        </div>
        {children}
      </div>
    );
  }
  
  return (
    <form
      onSubmit={handleSubmit}
      className={className}
      data-fn={fn}
      data-testid={testId || `fn-form-${fn}`}
      data-fn-submitting={isSubmitting}
      {...props}
    >
      <FnFormContext.Provider value={{ isSubmitting, hasAccess, fnExists }}>
        {children}
      </FnFormContext.Provider>
    </form>
  );
});

FnForm.displayName = "FnForm";
