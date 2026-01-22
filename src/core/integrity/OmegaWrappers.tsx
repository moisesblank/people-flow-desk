// ============================================
// 🔥 OMEGA WRAPPERS — ZERO CLIQUES MORTOS
// FnLink, FnButton, FnMenuItem, FnUpload, FnDownload, FnForm
// Todos com: data-fn, data-testid, validação, telemetria
// ============================================

import React, { memo, useCallback, useRef, useState, createContext, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Lock, Clock, Loader2, Upload, Download, FileWarning } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { FunctionId } from "./types";
import { logAuditEvent } from "./TelemetryRegistry";
import { hasCapability, type Capability } from "./SecurityRegistry";
import type { AppRole } from "@/core/urlAccessControl";

// ============================================
// TIPOS COMUNS
// ============================================
interface BaseFnProps {
  fn: FunctionId;
  "data-testid"?: string;
  disabled?: boolean;
  showLockIfNoAccess?: boolean;
}

// ============================================
// OMEGA CONTEXT (Injeção de Dependência)
// Desacopla do useAuth para evitar acoplamento circular
// ============================================
interface OmegaContextType {
  userId?: string;
  userRole: AppRole | null;
  isOwner: boolean;
}

const OmegaContext = createContext<OmegaContextType | null>(null);

/**
 * Provider que injeta user/role nos OmegaWrappers
 * Use no nível do App para evitar acoplamento circular com useAuth
 */
export function OmegaProvider({ 
  children, 
  userId, 
  userRole 
}: { 
  children: React.ReactNode; 
  userId?: string; 
  userRole: AppRole | null;
}) {
  const value: OmegaContextType = {
    userId,
    userRole,
    isOwner: userRole === "owner",
  };
  
  return <OmegaContext.Provider value={value}>{children}</OmegaContext.Provider>;
}

function useOmegaContext() {
  const ctx = useContext(OmegaContext);
  // Fallback seguro se usado fora do provider
  return ctx || { userId: undefined, userRole: null, isOwner: false };
}

// ============================================
// VALIDAÇÃO CENTRAL (usando contexto injetado)
// ============================================
function useFnValidation(fn: FunctionId) {
  const { userId, userRole, isOwner } = useOmegaContext();
  
  // Verificar se função existe (placeholder - expandir com registry real)
  const fnExists = fn && fn.startsWith("F.");
  
  // Verificar permissão básica
  const hasAccess = hasCapability(userRole || "viewer", "view_dashboard" as Capability);
  
  return {
    fnExists,
    hasAccess,
    userId,
    userRole,
    isOwner,
  };
}

// ============================================
// TELEMETRIA WRAPPER
// ============================================
async function trackFnEvent(
  fn: FunctionId,
  action: "click" | "submit" | "upload" | "download",
  success: boolean,
  metadata?: Record<string, unknown>
) {
  try {
    await logAuditEvent({
      functionId: fn,
      action,
      category: action === "upload" ? "upload" : action === "download" ? "download" : "crud",
      success,
      metadata,
      severity: success ? "info" : "error",
    });
  } catch (err) {
    console.warn("[OmegaWrappers] Telemetria falhou:", err);
  }
}

// ============================================
// FnLink — Link seguro com telemetria
// ============================================
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

// ============================================
// FnButton — Botão seguro com telemetria
// ============================================
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
        <TooltipContent>Função não configurada</TooltipContent>
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
            <Lock className="ml-1 h-3 w-3 text-muted-foreground" />
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
        durationMs: Date.now() - startTime 
      });
    } catch (error) {
      console.error(`[FnButton] Erro na ação ${fn}:`, error);
      await trackFnEvent(fn, "click", false, { 
        userId, 
        error: String(error),
        durationMs: Date.now() - startTime 
      });
      toast.error("Erro ao executar ação");
    } finally {
      setIsLoading(false);
    }
  }, [fn, onClick, confirmMessage, userId]);
  
  return (
    <Button 
      onClick={handleClick} 
      disabled={disabled || !hasAccess || isLoading} 
      data-fn={fn}
      data-testid={testId || `fn-button-${fn}`}
      {...props}
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
});

FnButton.displayName = "FnButton";

// ============================================
// FnMenuItem — Item de menu seguro
// ============================================
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

// ============================================
// FnUpload — Upload seguro com validação
// ============================================
interface FnUploadProps extends BaseFnProps {
  bucket: string;
  path: string;
  accept?: string;
  maxSize?: number; // bytes
  onUpload: (url: string, file: File) => void | Promise<void>;
  onError?: (error: Error) => void;
  children: React.ReactNode;
  className?: string;
}

const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.dll', '.scr'];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const FnUpload = memo<FnUploadProps>(({
  fn,
  bucket,
  path,
  accept,
  maxSize = DEFAULT_MAX_SIZE,
  onUpload,
  onError,
  children,
  disabled = false,
  showLockIfNoAccess = true,
  "data-testid": testId,
  className,
}) => {
  const { fnExists, hasAccess, userId } = useFnValidation(fn);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `Arquivo muito grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }
    
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return "Tipo de arquivo não permitido";
    }
    
    return null;
  };
  
  const sanitizeFileName = (name: string): string => {
    return name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 100);
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      onError?.(new Error(validationError));
      return;
    }
    
    setIsUploading(true);
    const startTime = Date.now();
    
    try {
      const safeName = sanitizeFileName(file.name);
      const fullPath = `${path}/${Date.now()}_${safeName}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fullPath, file);
      
      if (error) throw error;
      
      // Para buckets privados (ex: materiais), usar URL assinada
      // Para buckets públicos, usar getPublicUrl
      const PRIVATE_BUCKETS = ['materiais'];
      let finalUrl: string;
      
      if (PRIVATE_BUCKETS.includes(bucket)) {
        const { data: signedData, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(data.path, 3600);
        if (signError || !signedData?.signedUrl) {
          throw new Error('Falha ao gerar URL assinada');
        }
        finalUrl = signedData.signedUrl;
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);
        finalUrl = publicUrl;
      }
      
      await onUpload(finalUrl, file);
      
      await trackFnEvent(fn, "upload", true, {
        userId,
        bucket,
        path: fullPath,
        fileSize: file.size,
        mimeType: file.type,
        durationMs: Date.now() - startTime,
      });
      
      toast.success("Upload concluído!");
    } catch (error) {
      console.error(`[FnUpload] Erro:`, error);
      await trackFnEvent(fn, "upload", false, {
        userId,
        bucket,
        error: String(error),
        durationMs: Date.now() - startTime,
      });
      toast.error("Erro no upload");
      onError?.(error as Error);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  
  const isDisabled = disabled || !fnExists || (!hasAccess && showLockIfNoAccess) || isUploading;
  
  if (!fnExists) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn("cursor-not-allowed opacity-50 inline-flex items-center gap-1", className)}
            data-fn={fn}
            data-testid={testId || `fn-upload-${fn}`}
            data-fn-error="not-found"
          >
            {children}
            <FileWarning className="h-3 w-3 text-destructive" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Upload não configurado</TooltipContent>
      </Tooltip>
    );
  }
  
  if (!hasAccess && showLockIfNoAccess) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn("cursor-not-allowed opacity-50 inline-flex items-center gap-1", className)}
            data-fn={fn}
            data-testid={testId || `fn-upload-${fn}`}
            data-fn-access="denied"
          >
            {children}
            <Lock className="h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Sem permissão</TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 cursor-pointer",
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
      data-fn={fn}
      data-testid={testId || `fn-upload-${fn}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={isDisabled}
        className="hidden"
      />
      {isUploading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Enviando...</span>
        </>
      ) : (
        <>
          <Upload className="h-4 w-4" />
          {children}
        </>
      )}
    </label>
  );
});

FnUpload.displayName = "FnUpload";

// ============================================
// FnDownload — Download seguro com signed URL
// ============================================
interface FnDownloadProps extends BaseFnProps {
  bucket: string;
  path: string;
  fileName?: string;
  expiresIn?: number; // segundos
  children: React.ReactNode;
  className?: string;
}

export const FnDownload = memo<FnDownloadProps>(({
  fn,
  bucket,
  path,
  fileName,
  expiresIn = 300, // 5 minutos
  children,
  disabled = false,
  showLockIfNoAccess = true,
  "data-testid": testId,
  className,
}) => {
  const { fnExists, hasAccess, userId } = useFnValidation(fn);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownload = async () => {
    setIsDownloading(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      
      if (error) throw error;
      
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = fileName || path.split("/").pop() || "download";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      await trackFnEvent(fn, "download", true, {
        userId,
        bucket,
        path,
        durationMs: Date.now() - startTime,
      });
      
      toast.success("Download iniciado!");
    } catch (error) {
      console.error(`[FnDownload] Erro:`, error);
      await trackFnEvent(fn, "download", false, {
        userId,
        bucket,
        path,
        error: String(error),
        durationMs: Date.now() - startTime,
      });
      toast.error("Erro ao baixar arquivo");
    } finally {
      setIsDownloading(false);
    }
  };
  
  const isDisabled = disabled || !fnExists || (!hasAccess && showLockIfNoAccess) || isDownloading;
  
  if (!fnExists) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn("cursor-not-allowed opacity-50 inline-flex items-center gap-1", className)}
            data-fn={fn}
            data-testid={testId || `fn-download-${fn}`}
            data-fn-error="not-found"
          >
            {children}
            <FileWarning className="h-3 w-3 text-destructive" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Download não configurado</TooltipContent>
      </Tooltip>
    );
  }
  
  if (!hasAccess && showLockIfNoAccess) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn("cursor-not-allowed opacity-50 inline-flex items-center gap-1", className)}
            data-fn={fn}
            data-testid={testId || `fn-download-${fn}`}
            data-fn-access="denied"
          >
            {children}
            <Lock className="h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Sem permissão</TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <button
      onClick={handleDownload}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center gap-2",
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
      data-fn={fn}
      data-testid={testId || `fn-download-${fn}`}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {children}
    </button>
  );
});

FnDownload.displayName = "FnDownload";

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
