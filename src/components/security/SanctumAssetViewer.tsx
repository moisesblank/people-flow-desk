// ============================================
// 🌌🔥 SANCTUM ASSET VIEWER ULTRA v3.0 🔥🌌
// Visualizador de Conteúdo Protegido Nível NASA
// Otimizado para 3G + 5000 usuários simultâneos
// ============================================

import React, { memo, useEffect, useCallback, useMemo, useState } from "react";
import { useSanctumOmega } from "@/hooks/useSanctumOmega";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Lock, 
  AlertTriangle,
  Shield,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { SacredImage } from "@/components/performance/SacredImage";

// ============================================
// WATERMARK OVERLAY (CSS Grid dinâmico)
// ============================================
const WatermarkOverlay = memo(({ text, isOwner }: { text: string; isOwner: boolean }) => {
  if (isOwner || !text) return null;
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden"
      style={{ 
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <div className="absolute inset-0 grid grid-cols-3 gap-8 p-4 opacity-[0.08]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i}
            className="text-foreground font-mono text-xs whitespace-nowrap transform rotate-[-30deg]"
            style={{ fontSize: "10px" }}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
});

WatermarkOverlay.displayName = "WatermarkOverlay";

// ============================================
// LOADING STATE
// ============================================
const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
    <p className="text-muted-foreground text-sm">Carregando conteúdo protegido...</p>
  </div>
));

LoadingState.displayName = "LoadingState";

// ============================================
// ERROR STATE
// ============================================
const ErrorState = memo(({ 
  error, 
  errorCode, 
  isLocked,
  onRetry 
}: { 
  error: string; 
  errorCode?: string | null;
  isLocked: boolean;
  onRetry?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
    {isLocked ? (
      <Lock className="w-12 h-12 text-destructive" />
    ) : (
      <AlertTriangle className="w-12 h-12 text-yellow-500" />
    )}
    <h3 className="text-lg font-semibold">
      {isLocked ? "Acesso Bloqueado" : "Erro ao Carregar"}
    </h3>
    <p className="text-muted-foreground text-sm text-center max-w-md">
      {error}
    </p>
    {errorCode && (
      <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
        Código: {errorCode}
      </code>
    )}
    {onRetry && !isLocked && (
      <Button variant="outline" onClick={onRetry} className="mt-4">
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar Novamente
      </Button>
    )}
  </div>
));

ErrorState.displayName = "ErrorState";

// ============================================
// PROTECTION BADGE
// ============================================
const ProtectionBadge = memo(({ level }: { level: "none" | "relaxed" | "full" }) => {
  const config = {
    none: { icon: ShieldCheck, color: "text-green-500", label: "Modo Admin" },
    relaxed: { icon: Shield, color: "text-blue-500", label: "Proteção Relaxada" },
    full: { icon: Shield, color: "text-primary", label: "Proteção Total" },
  };
  
  const { icon: Icon, color, label } = config[level];
  
  return (
    <div className={cn("flex items-center gap-1 text-xs", color)}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
});

ProtectionBadge.displayName = "ProtectionBadge";

// ============================================
// NAVIGATION CONTROLS
// ============================================
const NavigationControls = memo(({ 
  currentPage, 
  totalPages, 
  onPrev, 
  onNext,
  onGoTo,
  disabled 
}: {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (page: number) => void;
  disabled: boolean;
}) => (
  <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
    <Button
      variant="ghost"
      size="sm"
      onClick={onPrev}
      disabled={disabled || currentPage <= 1}
      aria-label="Página anterior"
    >
      <ChevronLeft className="w-4 h-4" />
    </Button>
    
    <div className="flex items-center gap-2 min-w-[120px] justify-center">
      <span className="text-sm font-medium">
        Página {currentPage} de {totalPages}
      </span>
    </div>
    
    <Button
      variant="ghost"
      size="sm"
      onClick={onNext}
      disabled={disabled || currentPage >= totalPages}
      aria-label="Próxima página"
    >
      <ChevronRight className="w-4 h-4" />
    </Button>
  </div>
));

NavigationControls.displayName = "NavigationControls";

// ============================================
// MAIN COMPONENT
// ============================================
interface SanctumAssetViewerProps {
  assetId: string;
  className?: string;
  showNavigation?: boolean;
  showProtectionBadge?: boolean;
  onLoadComplete?: (manifest: any) => void;
  onError?: (error: string) => void;
}

export const SanctumAssetViewer = memo(function SanctumAssetViewer({
  assetId,
  className,
  showNavigation = true,
  showProtectionBadge = true,
  onLoadComplete,
  onError,
}: SanctumAssetViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const {
    isLoading,
    isAuthorized,
    isImmune,
    isLocked,
    manifest,
    error,
    errorCode,
    currentPage,
    loadAsset,
    nextPage,
    prevPage,
    goToPage,
    getCurrentPageUrl,
    getWatermarkText,
    getProtectionLevel,
  } = useSanctumOmega();
  
  // Load asset on mount
  useEffect(() => {
    if (assetId) {
      loadAsset(assetId).then(success => {
        if (success && manifest) {
          onLoadComplete?.(manifest);
        }
      });
    }
  }, [assetId, loadAsset]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);
  
  // Reset image loaded state on page change
  useEffect(() => {
    setImageLoaded(false);
  }, [currentPage]);
  
  const currentPageUrl = getCurrentPageUrl();
  const watermarkText = getWatermarkText();
  const protectionLevel = getProtectionLevel();
  
  // Handle image load
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);
  
  // Retry handler
  const handleRetry = useCallback(() => {
    loadAsset(assetId);
  }, [assetId, loadAsset]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("relative", className)}>
        <LoadingState />
      </div>
    );
  }
  
  // Error state
  if (error || isLocked) {
    return (
      <div className={cn("relative", className)}>
        <ErrorState 
          error={error || "Acesso bloqueado"} 
          errorCode={errorCode}
          isLocked={isLocked}
          onRetry={handleRetry}
        />
      </div>
    );
  }
  
  // Not authorized yet
  if (!isAuthorized || !manifest) {
    return (
      <div className={cn("relative", className)}>
        <LoadingState />
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "relative flex flex-col bg-background rounded-lg border overflow-hidden",
        "select-none",
        className
      )}
      style={{ 
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex flex-col">
          <h3 className="font-medium text-sm truncate max-w-[200px]">
            {manifest.title}
          </h3>
          {manifest.description && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {manifest.description}
            </p>
          )}
        </div>
        
        {showProtectionBadge && (
          <ProtectionBadge level={protectionLevel} />
        )}
      </div>
      
      {/* Content Area */}
      <div className="relative flex-1 min-h-[400px] flex items-center justify-center bg-muted/20 overflow-hidden">
        {/* Watermark Overlay */}
        <WatermarkOverlay text={watermarkText} isOwner={isImmune} />
        
        {/* Page Image */}
        {currentPageUrl && (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <div 
              className={cn(
                "max-w-full max-h-[600px] transition-opacity duration-300 pointer-events-none select-none",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              draggable={false}
            >
              <SacredImage
                src={currentPageUrl}
                alt={`Página ${currentPage} de ${manifest.totalPages}`}
                className="max-w-full max-h-[600px]"
                objectFit="contain"
                onLoad={handleImageLoad}
                onError={() => setImageLoaded(true)}
              />
            </div>
          </div>
        )}
        
        {/* Anti-screenshot overlay (subtle) */}
        {!isImmune && (
          <div 
            className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-[0.01]"
            style={{ 
              background: "repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)" 
            }}
          />
        )}
      </div>
      
      {/* Navigation */}
      {showNavigation && manifest.totalPages > 1 && (
        <div className="border-t p-2">
          <NavigationControls
            currentPage={currentPage}
            totalPages={manifest.totalPages}
            onPrev={prevPage}
            onNext={nextPage}
            onGoTo={goToPage}
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  );
});

export default SanctumAssetViewer;
