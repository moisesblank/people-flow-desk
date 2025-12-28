// FnUpload — Upload seguro com validação
import React, { memo, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, Loader2, Upload, FileWarning } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BaseFnProps, useFnValidation, trackFnEvent } from "./shared";

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
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      await onUpload(publicUrl, file);
      
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
