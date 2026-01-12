// ============================================
// 🌌🔥 SECURE PDF VIEWER OMEGA — VISUALIZADOR BLINDADO NÍVEL NASA 🔥🌌
// ANO 2300 — RENDERIZAÇÃO DE PDF COMO IMAGENS PROTEGIDAS
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// O PDF ORIGINAL NUNCA CHEGA AO CLIENTE
// Apenas imagens rasterizadas com watermark queimada
//
// 📍 MAPA DE URLs DEFINITIVO (MONO-DOMÍNIO v2.0 - 27/12/2025):
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: pro.moisesmedeiros.com.br/gestaofc (STAFF)
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// ============================================

import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Maximize2,
  Loader2,
  AlertTriangle,
  Lock,
  FileWarning,
  RefreshCw,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SanctumProtectedContent } from "@/components/security/SanctumProtectedContent";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useContentSecurityGuard } from "@/hooks/useContentSecurityGuard";

// ============================================
// TIPOS E INTERFACES
// ============================================
interface PageData {
  page: number;
  url: string;
  width?: number;
  height?: number;
}

interface AssetManifest {
  success: boolean;
  assetId: string;
  title: string;
  totalPages: number;
  pages: PageData[];
  watermarkSeed: string;
  expiresAt: string;
  error?: string;
  errorCode?: string;
}

interface SecurePdfViewerOmegaProps {
  assetId: string;
  title?: string;
  className?: string;
  onLoadComplete?: (totalPages: number) => void;
  onError?: (error: string) => void;
  onPageChange?: (page: number) => void;
  showControls?: boolean;
  showPageIndicator?: boolean;
  showZoomControls?: boolean;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

type ViewerState = "loading" | "ready" | "error" | "locked" | "expired" | "not_found";

// ============================================
// CONSTANTES
// ============================================
const OWNER_EMAIL = "moisesblank@gmail.com";
const MANIFEST_REFRESH_BUFFER_MS = 30000;
const DEFAULT_ZOOM = 100;
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;

// ============================================
// MAPEAMENTO DE ERROS
// ============================================
const ERROR_MESSAGES: Record<string, { title: string; description: string; icon: React.ElementType }> = {
  LOCKED: {
    title: "Conta Temporariamente Bloqueada",
    description: "Sua conta foi bloqueada por atividade suspeita. Tente novamente mais tarde.",
    icon: Lock,
  },
  EXPIRED: {
    title: "Acesso Expirado",
    description: "Seu acesso a este conteúdo expirou. Renove sua assinatura para continuar.",
    icon: FileWarning,
  },
  NOT_FOUND: {
    title: "Conteúdo Não Encontrado",
    description: "Este documento não foi encontrado ou foi removido.",
    icon: AlertTriangle,
  },
  UNAUTHORIZED: {
    title: "Acesso Não Autorizado",
    description: "Você não tem permissão para visualizar este conteúdo.",
    icon: Lock,
  },
  SERVER_ERROR: {
    title: "Erro do Servidor",
    description: "Ocorreu um erro ao carregar o documento. Tente novamente.",
    icon: AlertTriangle,
  },
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SecurePdfViewerOmega = memo(({
  assetId,
  title,
  className,
  onLoadComplete,
  onError,
  onPageChange,
  showControls = true,
  showPageIndicator = true,
  showZoomControls = true,
  initialZoom = DEFAULT_ZOOM,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM,
  zoomStep = ZOOM_STEP,
}: SecurePdfViewerOmegaProps) => {
  // ============================================
  // ESTADOS
  // ============================================
  const [state, setState] = useState<ViewerState>("loading");
  const [manifest, setManifest] = useState<AssetManifest | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(initialZoom);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { session, user, role } = useAuth();

  // P1-2 FIX: Role-first, email como fallback UX
  const isOwner = role === "owner";

  // ═══════════════════════════════════════════════════════════
  // 🛡️ UNIVERSAL CONTENT SECURITY GUARD - PROTEÇÃO TOTAL
  // ═══════════════════════════════════════════════════════════
  const { SevereOverlay } = useContentSecurityGuard({
    contentId: assetId,
    contentType: 'pdf',
    contentTitle: title,
    isOwner,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.user_metadata?.name,
    enabled: true,
  });

  // ============================================
  // BUSCAR MANIFEST
  // ============================================
  const fetchManifest = useCallback(async () => {
    try {
      setState("loading");
      setImageLoading(true);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("VITE_SUPABASE_URL não configurado");
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/sanctum-asset-manifest?assetId=${encodeURIComponent(assetId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
        }
      );

      if (!response.ok) {
        const errorCode = response.status === 401 ? "UNAUTHORIZED" :
                         response.status === 402 ? "EXPIRED" :
                         response.status === 403 ? "UNAUTHORIZED" :
                         response.status === 404 ? "NOT_FOUND" :
                         response.status === 423 ? "LOCKED" : "SERVER_ERROR";

        setState(errorCode === "LOCKED" ? "locked" : 
                errorCode === "EXPIRED" ? "expired" :
                errorCode === "NOT_FOUND" ? "not_found" : "error");
        
        setErrorInfo({ code: errorCode, message: ERROR_MESSAGES[errorCode]?.description || "Erro desconhecido" });
        onError?.(errorCode);
        return;
      }

      const data: AssetManifest = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Erro ao carregar manifest");
      }

      setManifest(data);
      setState("ready");
      onLoadComplete?.(data.totalPages);

      // Agendar renovação do manifest antes de expirar
      if (data.expiresAt) {
        const expiresAt = new Date(data.expiresAt).getTime();
        const now = Date.now();
        const refreshIn = Math.max(0, expiresAt - now - MANIFEST_REFRESH_BUFFER_MS);

        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }

        refreshTimeoutRef.current = setTimeout(() => {
          fetchManifest();
        }, refreshIn);
      }
    } catch (err) {
      console.error("[SecurePdfViewer] Erro:", err);
      setState("error");
      setErrorInfo({ code: "SERVER_ERROR", message: err instanceof Error ? err.message : "Erro desconhecido" });
      onError?.("SERVER_ERROR");
    }
  }, [assetId, session?.access_token, onLoadComplete, onError]);

  // Carregar manifest ao montar
  useEffect(() => {
    fetchManifest();
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [fetchManifest]);

  // ============================================
  // NAVEGAÇÃO
  // ============================================
  const goToPage = useCallback((page: number) => {
    if (!manifest) return;
    const newPage = Math.max(0, Math.min(page, manifest.totalPages - 1));
    setCurrentPage(newPage);
    setImageLoading(true);
    onPageChange?.(newPage + 1);
  }, [manifest, onPageChange]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // ============================================
  // ZOOM
  // ============================================
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + zoomStep, maxZoom));
  }, [zoomStep, maxZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - zoomStep, minZoom));
  }, [zoomStep, minZoom]);

  const handleZoomReset = useCallback(() => {
    setZoom(initialZoom);
  }, [initialZoom]);

  // ============================================
  // ROTAÇÃO
  // ============================================
  const handleRotate = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  // ============================================
  // FULLSCREEN
  // ============================================
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Erro ao alternar fullscreen:", err);
    }
  }, []);

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state !== "ready") return;

      switch (e.key) {
        case "ArrowLeft":
          prevPage();
          break;
        case "ArrowRight":
          nextPage();
          break;
        case "+":
        case "=":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case "-":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
        case "0":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomReset();
          }
          break;
        case "f":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, prevPage, nextPage, handleZoomIn, handleZoomOut, handleZoomReset, toggleFullscreen]);

  // ============================================
  // RENDER DE ERRO
  // ============================================
  if (state === "error" || state === "locked" || state === "expired" || state === "not_found") {
    const errorData = errorInfo?.code ? ERROR_MESSAGES[errorInfo.code] : ERROR_MESSAGES.SERVER_ERROR;
    const ErrorIcon = errorData.icon;

    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[400px] p-8",
        "bg-muted/30 rounded-lg border border-border",
        className
      )}>
        <ErrorIcon className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{errorData.title}</h3>
        <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
          {errorData.description}
        </p>
        <Button variant="outline" onClick={fetchManifest}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // ============================================
  // RENDER DE LOADING
  // ============================================
  if (state === "loading" || !manifest) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[400px] p-8",
        "bg-muted/30 rounded-lg border border-border",
        className
      )}>
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Carregando documento protegido...</p>
      </div>
    );
  }

  // ============================================
  // DADOS DA PÁGINA ATUAL
  // ============================================
  const currentPageData = manifest.pages[currentPage];
  const hasNextPage = currentPage < manifest.totalPages - 1;
  const hasPrevPage = currentPage > 0;

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <>
      <SevereOverlay />
      <SanctumProtectedContent
        resourceId={assetId}
        resourceType="pdf"
        className={cn("secure-pdf-viewer", className)}
        config={{
          watermark: !isOwner,
          blockCopy: true,
          blockPrint: true,
          blockDrag: true,
          blockSelection: true,
          blurOnInactive: true,
        }}
      >
      <div
        ref={containerRef}
        className={cn(
          "flex flex-col bg-muted/20 rounded-lg border border-border overflow-hidden",
          isFullscreen && "fixed inset-0 z-50 rounded-none"
        )}
      >
        {/* Header com título e controles */}
        {showControls && (
          <div className="flex items-center justify-between p-3 bg-background border-b border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm truncate max-w-[200px]">
                {title || manifest.title || "Documento"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Controles de zoom */}
              {showZoomControls && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleZoomOut}
                    disabled={zoom <= minZoom}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleZoomIn}
                    disabled={zoom >= maxZoom}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </>
              )}

              {/* Rotação */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRotate}
              >
                <RotateCw className="w-4 h-4" />
              </Button>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleFullscreen}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Área de visualização */}
        <div 
          className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/10"
          style={{ minHeight: "500px" }}
        >
          <div
            className="relative transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
          >
            {/* Loading da imagem */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Imagem da página */}
            {currentPageData && (
              <img
                src={currentPageData.url}
                alt={`Página ${currentPage + 1} de ${manifest.totalPages}`}
                className="max-w-full h-auto rounded-lg shadow-lg"
                loading="lazy"
                decoding="async"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  toast.error("Erro ao carregar página. Tente recarregar.");
                }}
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            )}
          </div>
        </div>

        {/* Footer com navegação */}
        {showPageIndicator && manifest.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 p-3 bg-background border-t border-border">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={prevPage}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              Página {currentPage + 1} de {manifest.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={nextPage}
              disabled={!hasNextPage}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Watermark seed (invisível, para auditoria) */}
        <div
          className="sr-only"
          aria-hidden="true"
          data-watermark-seed={manifest.watermarkSeed}
        />
      </div>
    </SanctumProtectedContent>
    </>
  );
});

SecurePdfViewerOmega.displayName = "SecurePdfViewerOmega";

export default SecurePdfViewerOmega;
