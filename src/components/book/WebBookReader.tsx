// ============================================
// 🌌🔥 WEB BOOK READER — LEITOR DE LIVRO WEB NÍVEL NASA 🔥🌌
// ANO 2300 — VISUALIZADOR INTERATIVO COM PROTEÇÃO SANCTUM
// ============================================

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  memo,
  useMemo,
} from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Maximize2,
  Minimize2,
  Loader2,
  AlertTriangle,
  BookOpen,
  MessageCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { SanctumProtectedContent } from "@/components/security/SanctumProtectedContent";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// TIPOS
// ============================================
interface BookData {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  totalPages: number;
  coverUrl?: string;
  allowAnnotations: boolean;
  allowChat: boolean;
}

interface PageData {
  pageNumber: number;
  url: string;
  width?: number;
  height?: number;
  chapterTitle?: string;
  sectionTitle?: string;
}

interface WatermarkData {
  enabled: boolean;
  seed: string;
  userEmail?: string;
  userCpf?: string;
  userName?: string;
}

interface ProgressData {
  currentPage: number;
  progressPercent: number;
  totalReadingTime: number;
  isCompleted: boolean;
  zoomLevel: number;
  displayMode: string;
}

interface SessionData {
  id: string;
  watermarkSeed: string;
}

interface Annotation {
  id: string;
  pageNumber: number;
  type: string;
  content?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  color: string;
}

interface RpcBookResponse {
  success: boolean;
  error?: string;
  book?: BookData;
  pages?: PageData[];
  watermark?: WatermarkData;
  progress?: ProgressData;
  session?: SessionData;
}

interface RpcAnnotationsResponse {
  success: boolean;
  annotations?: Annotation[];
}

interface WebBookReaderProps {
  bookId: string;
  className?: string;
  onClose?: () => void;
}

// ============================================
// CONSTANTES
// ============================================
const OWNER_EMAIL = "moisesblank@gmail.com";
const PAGE_REFRESH_INTERVAL_MS = 45000;
const AUTO_SAVE_INTERVAL_MS = 30000;

const COLORS = [
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const WebBookReader = memo(({
  bookId,
  className,
  onClose,
}: WebBookReaderProps) => {
  // ============================================
  // ESTADOS
  // ============================================
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [book, setBook] = useState<BookData | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [watermark, setWatermark] = useState<WatermarkData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageUrl, setCurrentPageUrl] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [showChat, setShowChat] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const readingStartRef = useRef<number>(Date.now());
  const pageRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { session: authSession } = useAuth();
  
  const isOwner = useMemo(() => {
    return authSession?.user?.email?.toLowerCase() === OWNER_EMAIL;
  }, [authSession]);

  // ============================================
  // BUSCAR DADOS DO LIVRO
  // ============================================
  const fetchBookData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        "fn_get_book_for_reader",
        { p_book_id: bookId }
      );

      if (rpcError) throw rpcError;

      const response = data as unknown as RpcBookResponse;

      if (!response?.success) {
        throw new Error(response?.error || "Erro ao carregar livro");
      }

      setBook(response.book || null);
      setPages(response.pages || []);
      setWatermark(response.watermark || null);
      setProgress(response.progress || null);
      setSession(response.session || null);
      setCurrentPage(response.progress?.currentPage || 1);
      setZoom(response.progress?.zoomLevel || 100);

    } catch (err) {
      console.error("[WebBookReader] Erro ao carregar:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  // ============================================
  // BUSCAR URL DA PÁGINA ATUAL
  // ============================================
  const fetchPageUrl = useCallback(async (pageNum: number) => {
    try {
      setIsPageLoading(true);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/book-page-manifest?bookId=${bookId}&pages=${pageNum},${pageNum + 1}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession?.access_token ?? ""}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar página");
      }

      const data = await response.json();
      
      if (data.success && data.pages?.length > 0) {
        const currentPageData = data.pages.find((p: PageData) => p.pageNumber === pageNum);
        if (currentPageData) {
          setCurrentPageUrl(currentPageData.url);
        }
      }

      if (pageRefreshTimeoutRef.current) {
        clearTimeout(pageRefreshTimeoutRef.current);
      }
      pageRefreshTimeoutRef.current = setTimeout(() => {
        fetchPageUrl(pageNum);
      }, PAGE_REFRESH_INTERVAL_MS);

    } catch (err) {
      console.error("[WebBookReader] Erro ao buscar página:", err);
      toast.error("Erro ao carregar página");
    } finally {
      setIsPageLoading(false);
    }
  }, [bookId, authSession?.access_token]);

  // ============================================
  // SALVAR PROGRESSO
  // ============================================
  const saveProgress = useCallback(async () => {
    if (!book) return;

    const readingTime = Math.floor((Date.now() - readingStartRef.current) / 1000);

    try {
      await supabase.rpc("fn_update_reading_progress", {
        p_book_id: bookId,
        p_current_page: currentPage,
        p_reading_time_seconds: readingTime,
        p_session_id: session?.id,
      });

      readingStartRef.current = Date.now();
      setHasUnsavedChanges(false);

    } catch (err) {
      console.error("[WebBookReader] Erro ao salvar progresso:", err);
    }
  }, [bookId, currentPage, session?.id, book]);

  // ============================================
  // BUSCAR ANOTAÇÕES
  // ============================================
  const fetchAnnotations = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("fn_get_book_annotations", {
        p_book_id: bookId,
        p_page_number: currentPage,
      });

      if (error) throw error;

      const response = data as unknown as RpcAnnotationsResponse;

      if (response?.success) {
        setAnnotations(response.annotations || []);
      }
    } catch (err) {
      console.error("[WebBookReader] Erro ao buscar anotações:", err);
    }
  }, [bookId, currentPage]);

  // ============================================
  // NAVEGAÇÃO
  // ============================================
  const goToPage = useCallback((page: number) => {
    if (!book) return;
    
    const newPage = Math.max(1, Math.min(page, book.totalPages));
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      setHasUnsavedChanges(true);
    }
  }, [book, currentPage]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // ============================================
  // CLICK NAS BORDAS
  // ============================================
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const EDGE_CLICK_WIDTH = 80;

    if (x < EDGE_CLICK_WIDTH) {
      prevPage();
    } else if (x > rect.width - EDGE_CLICK_WIDTH) {
      nextPage();
    }
  }, [prevPage, nextPage]);

  // ============================================
  // ZOOM E ROTAÇÃO
  // ============================================
  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z - 25, 50));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(r => (r + 90) % 360);
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
      if (!book) return;

      switch (e.key) {
        case "ArrowLeft":
          prevPage();
          break;
        case "ArrowRight":
          nextPage();
          break;
        case "Home":
          goToPage(1);
          break;
        case "End":
          goToPage(book.totalPages);
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
        case "f":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case "Escape":
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose?.();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [book, prevPage, nextPage, goToPage, handleZoomIn, handleZoomOut, toggleFullscreen, isFullscreen, onClose]);

  // ============================================
  // EFEITOS
  // ============================================
  useEffect(() => {
    fetchBookData();
    return () => {
      if (pageRefreshTimeoutRef.current) {
        clearTimeout(pageRefreshTimeoutRef.current);
      }
    };
  }, [fetchBookData]);

  useEffect(() => {
    if (book && currentPage > 0) {
      fetchPageUrl(currentPage);
      fetchAnnotations();
    }
  }, [book, currentPage, fetchPageUrl, fetchAnnotations]);

  useEffect(() => {
    if (book) {
      const interval = setInterval(saveProgress, AUTO_SAVE_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [book, saveProgress]);

  // ============================================
  // RENDER - LOADING
  // ============================================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando livro...</p>
      </div>
    );
  }

  // ============================================
  // RENDER - ERROR
  // ============================================
  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar livro</h2>
        <p className="text-muted-foreground text-center mb-4">{error || "Livro não encontrado"}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
          <Button onClick={fetchBookData}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = book ? Math.round((currentPage / book.totalPages) * 100) : 0;

  return (
    <TooltipProvider>
      <SanctumProtectedContent>
        <div 
          ref={containerRef}
          className={cn(
            "relative w-full h-screen bg-background overflow-hidden flex flex-col",
            isFullscreen && "fixed inset-0 z-50",
            className
          )}
        >
          {/* HEADER */}
          <header className="flex items-center justify-between px-4 py-2 bg-card border-b shrink-0">
            <div className="flex items-center gap-3">
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              )}
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <h1 className="text-sm font-semibold line-clamp-1">{book?.title}</h1>
                <p className="text-xs text-muted-foreground">{book?.author}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Diminuir zoom</TooltipContent>
              </Tooltip>

              <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                {zoom}%
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Aumentar zoom</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleRotate}>
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rotacionar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? "Sair da tela cheia" : "Tela cheia"}</TooltipContent>
              </Tooltip>

              {book?.allowChat && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={showChat ? "secondary" : "ghost"} 
                      size="icon" 
                      onClick={() => setShowChat(!showChat)}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chat com IA</TooltipContent>
                </Tooltip>
              )}
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="flex-1 relative overflow-hidden">
            {/* Navigation Edges */}
            <button
              onClick={prevPage}
              disabled={currentPage <= 1}
              className="absolute left-0 top-0 h-full w-20 z-10 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity disabled:opacity-0"
            >
              <ChevronLeft className="w-8 h-8 text-foreground/50" />
            </button>

            <button
              onClick={nextPage}
              disabled={currentPage >= (book?.totalPages || 1)}
              className="absolute right-0 top-0 h-full w-20 z-10 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity disabled:opacity-0"
            >
              <ChevronRight className="w-8 h-8 text-foreground/50" />
            </button>

            {/* Page Display */}
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
              {isPageLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              ) : currentPageUrl ? (
                <div
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: "transform 0.2s ease",
                  }}
                >
                  <img
                    src={currentPageUrl}
                    alt={`Página ${currentPage}`}
                    className="max-w-full max-h-full object-contain shadow-lg"
                    draggable={false}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">Página não disponível</p>
              )}

              {/* Watermark Overlay */}
              {watermark?.enabled && !isOwner && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                  <div className="absolute inset-0 flex flex-wrap gap-32 rotate-[-30deg] scale-150">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <span key={i} className="text-foreground text-sm whitespace-nowrap">
                        {watermark.userName || watermark.userEmail} • {watermark.userCpf}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* FOOTER */}
          <footer className="flex items-center justify-between px-4 py-2 bg-card border-t shrink-0">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {book?.totalPages || 0}
            </span>

            <div className="flex-1 mx-4">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <span className="text-sm text-muted-foreground">
              {progressPercent}%
            </span>
          </footer>
        </div>
      </SanctumProtectedContent>
    </TooltipProvider>
  );
});

WebBookReader.displayName = "WebBookReader";
