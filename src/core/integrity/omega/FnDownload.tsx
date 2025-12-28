// FnDownload — Download seguro com signed URL
import React, { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, Loader2, Download, FileWarning } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BaseFnProps, useFnValidation, trackFnEvent } from "./shared";

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
