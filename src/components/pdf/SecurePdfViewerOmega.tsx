// ============================================
// 🌌 SECURE PDF VIEWER OMEGA — VIEWER POR IMAGENS
// PDF original NUNCA chega ao client
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import React, { useEffect, useState, useMemo, memo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SanctumProtectedContent } from "@/components/security/SanctumProtectedContent";
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Shield, 
  Lock,
  AlertCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Manifest {
  assetId: string;
  title?: string;
  kind?: string;
  pageCount: number;
  expiresInSec: number;
  pages: Array<{ page: number; url: string; width?: number; height?: number }>;
  watermarkSeed: string;
}

interface SecurePdfViewerOmegaProps {
  assetId: string;
  title?: string;
  className?: string;
  onError?: (error: string) => void;
}

export const SecurePdfViewerOmega = memo(({ 
  assetId, 
  title, 
  className,
  onError 
}: SecurePdfViewerOmegaProps) => {
  const { session } = useAuth();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [imageLoading, setImageLoading] = useState(true);

  // Buscar manifest do backend
  const fetchManifest = useCallback(async () => {
    if (!assetId || !session?.access_token) return;

    try {
      setLoading(true);
      setError(null);

      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(
        `${baseUrl}/functions/v1/sanctum-asset-manifest?assetId=${assetId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.error || `Erro ${res.status}`;
        
        // Mapear erros para mensagens amigáveis
        const errorMessages: Record<string, string> = {
          "UNAUTHORIZED": "Você precisa estar logado para acessar este documento.",
          "FORBIDDEN": "Você não tem permissão para acessar este documento.",
          "USER_LOCKED": "Sua conta está temporariamente bloqueada.",
          "ACCESS_EXPIRED": "Seu acesso expirou. Renove sua assinatura.",
          "ASSET_NOT_FOUND": "Documento não encontrado.",
          "ASSET_NOT_READY": "Documento ainda está sendo processado.",
        };
        
        throw new Error(errorMessages[errorMsg] || errorMsg);
      }

      const manifestData: Manifest = await res.json();
      setManifest(manifestData);
      
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao carregar documento";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [assetId, session?.access_token, onError]);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  // Ordenar páginas
  const pages = useMemo(() => 
    (manifest?.pages ?? []).slice().sort((a, b) => a.page - b.page), 
    [manifest]
  );

  const currentPageData = pages[currentPage];
  const totalPages = pages.length;

  // Navegação
  const goToPrevPage = useCallback(() => {
    setCurrentPage(p => Math.max(0, p - 1));
    setImageLoading(true);
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(p => Math.min(totalPages - 1, p + 1));
    setImageLoading(true);
  }, [totalPages]);

  // Zoom
  const zoomIn = useCallback(() => {
    setZoom(z => Math.min(200, z + 25));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(z => Math.max(50, z - 25));
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-muted-foreground">Carregando documento protegido...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-destructive">
        <AlertCircle className="w-12 h-12" />
        <span className="text-center max-w-md">{error}</span>
        <Button variant="outline" onClick={fetchManifest}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Empty state
  if (!manifest || pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-muted-foreground">
        <FileText className="w-12 h-12" />
        <span>Documento não encontrado ou sem páginas</span>
      </div>
    );
  }

  return (
    <SanctumProtectedContent resourceId={assetId} resourceType="pdf">
      <div className={cn(
        "sanctum-pdf-viewer flex flex-col bg-background rounded-xl border border-border overflow-hidden",
        className
      )}>
        {/* Header com controles */}
        <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium truncate max-w-[200px]">
              {title || manifest.title || "Documento Protegido"}
            </span>
            <Lock className="w-3 h-3 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2">
            {/* Controles de Zoom */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={zoomOut} 
              disabled={zoom <= 50}
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center">
              {zoom}%
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={zoomIn} 
              disabled={zoom >= 200}
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            {/* Controles de Página */}
            <div className="flex items-center gap-1 ml-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={goToPrevPage} 
                disabled={currentPage <= 0}
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                {currentPage + 1} / {totalPages}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={goToNextPage} 
                disabled={currentPage >= totalPages - 1}
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Área de conteúdo */}
        <div className="flex-1 overflow-auto bg-muted/20 min-h-[500px] flex items-start justify-center p-4">
          {currentPageData && (
            <div className="relative">
              {/* Loading da imagem */}
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              
              {/* Imagem da página */}
              <img
                src={currentPageData.url}
                alt={`Página ${currentPage + 1}`}
                loading="lazy"
                decoding="async"
                className="max-w-full h-auto rounded-lg shadow-lg transition-transform duration-200"
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center"
                }}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setError("Erro ao carregar página");
                }}
              />
            </div>
          )}
        </div>

        {/* Footer com informações de segurança */}
        <div className="flex items-center justify-center gap-2 p-2 bg-muted/30 border-t border-border">
          <Shield className="w-3 h-3 text-green-500" />
          <span className="text-[10px] text-muted-foreground">
            Documento protegido • {manifest.watermarkSeed}
          </span>
        </div>
      </div>
    </SanctumProtectedContent>
  );
});

SecurePdfViewerOmega.displayName = "SecurePdfViewerOmega";

export default SecurePdfViewerOmega;
