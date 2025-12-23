// ============================================
// 🌌🔥 SECURE PDF VIEWER OMEGA — VISUALIZADOR BLINDADO NÍVEL NASA 🔥🌌
// ANO 2300 — RENDERIZAÇÃO DE PDF COMO IMAGENS PROTEGIDAS
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// O PDF ORIGINAL NUNCA CHEGA AO CLIENTE
// Apenas imagens rasterizadas com watermark queimada
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
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

  // Verificar se é owner
  const isOwner = 
    role === "owner" || 
    user?.email?.toLowerCase() === OWNER_EMAIL;

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
        const expiresIn = new Date(data.expiresAt).getTime() - Date.now() - MANIFEST_REFRESH_BUFFER_MS;
        if (expiresIn > 0) {
          refreshTimeoutRef.current = setTimeout(() => {
            fetchManifest();
          }, expiresIn);
        }
      }
    } catch (error) {
      console.error("[SecurePdfViewerOmega] Erro ao buscar manifest:", error);
      setState("error");
      setErrorInfo({ code: "SERVER_ERROR", message: String(error) });
      onError?.("SERVER_ERROR");
    }
  }, [assetId, session?.access_token, onLoadComplete, onError]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (assetId && session?.access_token) {
      fetchManifest();
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [assetId, session?.access_token, fetchManifest]);

  // Notificar mudança de página
  useEffect(() => {
    onPageChange?.(currentPage + 1);
  }, [currentPage, onPageChange]);

  // ============================================
  // HANDLERS
  // ============================================
  const handlePrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
    setImageLoading(true);
  }, []);

  const handleNextPage = useCallback(() => {
    if (!manifest) return;
    setCurrentPage((p) => Math.min(manifest.totalPages - 1, p + 1));
    setImageLoading(true);
  }, [manifest]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(maxZoom, z + zoomStep));
  }, [maxZoom, zoomStep]);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(minZoom, z - zoomStep));
  }, [minZoom, zoomStep]);

  const handleRotate = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const handleRetry = useCallback(() => {
    setErrorInfo(null);
    fetchManifest();
  }, [fetchManifest]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    toast.error("Erro ao carregar página. Tente novamente.");
  }, []);

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state !== "ready") return;

      switch (e.key) {
        case "ArrowLeft":
          handlePrevPage();
          break;
        case "ArrowRight":
          handleNextPage();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "r":
        case "R":
          handleRotate();
          break;
        case "f":
        case "F":
          handleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, handlePrevPage, handleNextPage, handleZoomIn, handleZoomOut, handleRotate, handleFullscreen]);

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (state === "loading") {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg", className)}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando documento seguro...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: ERROR STATES
  // ============================================
  if (state !== "ready") {
    const errorData = ERROR_MESSAGES[errorInfo?.code || "SERVER_ERROR"];
    const IconComponent = errorData?.icon || AlertTriangle;

    return (
      <div className={cn("flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg", className)}>
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">{errorData?.title}</h3>
          <p className="text-muted-foreground">{errorData?.description}</p>
          {state === "error" && (
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: VIEWER
  // ============================================
  const currentPageData = manifest?.pages?.[currentPage];

  return (
    <SanctumProtectedContent
      resourceId={assetId}
      resourceType="pdf"
      config={{
        watermark: !isOwner,
        blockCopy: true,
        blockPrint: true,
        blockContextMenu: true,
        blurOnInactive: !isOwner,
      }}
      className={cn("relative", className)}
    >
      <div
        ref={containerRef}
        className="flex flex-col bg-background rounded-lg overflow-hidden border border-border"
      >
        {/* Header com título */}
        {title && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-medium text-foreground truncate">{title}</h2>
          </div>
        )}

        {/* Área do documento */}
        <div
          className="relative flex-1 overflow-auto bg-muted/20 min-h-[500px]"
          style={{ cursor: "default" }}
        >
          {/* Loading da imagem */}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Imagem da página */}
          {currentPageData?.url && (
            <div
              className="flex items-center justify-center p-4"
              style={{
                minHeight: "100%",
              }}
            >
              <img
                src={currentPageData.url}
                alt={`Página ${currentPage + 1}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
                className="max-w-full shadow-lg select-none pointer-events-none"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                  transition: "transform 0.2s ease-out",
                }}
              />
            </div>
          )}
        </div>

        {/* Controles */}
        {showControls && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/50">
            {/* Navegação de páginas */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                title="Página anterior (←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {showPageIndicator && manifest && (
                <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                  {currentPage + 1} / {manifest.totalPages}
                </span>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={!manifest || currentPage >= manifest.totalPages - 1}
                title="Próxima página (→)"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Controles de zoom e rotação */}
            {showZoomControls && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoom <= minZoom}
                  title="Diminuir zoom (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>

                <span className="text-sm text-muted-foreground min-w-[50px] text-center">
                  {zoom}%
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoom >= maxZoom}
                  title="Aumentar zoom (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-2" />

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRotate}
                  title="Girar 90° (R)"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFullscreen}
                  title="Tela cheia (F)"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </SanctumProtectedContent>
  );
});

SecurePdfViewerOmega.displayName = "SecurePdfViewerOmega";

export default SecurePdfViewerOmega;
