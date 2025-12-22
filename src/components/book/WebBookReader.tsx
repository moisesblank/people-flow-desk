// ============================================
// 🌌🔥 WEB BOOK READER — LEITOR DE LIVRO WEB NÍVEL NASA 🔥🌌
// ANO 2300 — VISUALIZADOR INTERATIVO COM PROTEÇÃO SANCTUM
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos/livro-web
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// FUNCIONALIDADES:
// - Navegação por bordas (esquerda/direita)
// - Zoom e rotação
// - Anotações (desenho, destaque, notas)
// - Chat integrado com IA
// - Watermark dinâmica
// - Proteção SANCTUM completa
//
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
  Lock,
  BookOpen,
  MessageCircle,
  PenTool,
  Highlighter,
  Eraser,
  Bookmark,
  List,
  X,
  Check,
  Save,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
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

interface WebBookReaderProps {
  bookId: string;
  className?: string;
  onClose?: () => void;
}

// ============================================
// CONSTANTES
// ============================================
const OWNER_EMAIL = "moisesblank@gmail.com";
const PAGE_REFRESH_INTERVAL_MS = 45000; // 45 segundos
const AUTO_SAVE_INTERVAL_MS = 30000; // 30 segundos
const EDGE_CLICK_WIDTH = 80; // px

const TOOLS = {
  NONE: "none",
  PEN: "pen",
  HIGHLIGHTER: "highlighter",
  ERASER: "eraser",
} as const;

const COLORS = [
  "#FFD700", // Amarelo
  "#FF6B6B", // Vermelho
  "#4ECDC4", // Verde água
  "#45B7D1", // Azul
  "#96CEB4", // Verde
  "#FFEAA7", // Amarelo claro
  "#DDA0DD", // Rosa
  "#98D8C8", // Menta
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
  
  // Dados do livro
  const [book, setBook] = useState<BookData | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [watermark, setWatermark] = useState<WatermarkData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  
  // Navegação
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageUrl, setCurrentPageUrl] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  
  // Visualização
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Anotações
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>(TOOLS.NONE);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // UI
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readingStartRef = useRef<number>(Date.now());
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pageRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { session: authSession, profile } = useAuth();
  
  // ============================================
  // VERIFICAR OWNER
  // ============================================
  const isOwner = useMemo(() => {
    return profile?.role === "owner" || profile?.email?.toLowerCase() === OWNER_EMAIL;
  }, [profile]);

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

      if (!data?.success) {
        throw new Error(data?.error || "Erro ao carregar livro");
      }

      setBook(data.book);
      setPages(data.pages || []);
      setWatermark(data.watermark);
      setProgress(data.progress);
      setSession(data.session);
      setCurrentPage(data.progress?.currentPage || 1);
      setZoom(data.progress?.zoomLevel || 100);

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

      // Agendar refresh antes de expirar
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

      if (data?.success) {
        setAnnotations(data.annotations || []);
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
    
    // Click na borda esquerda
    if (x < EDGE_CLICK_WIDTH) {
      prevPage();
    }
    // Click na borda direita
    else if (x > rect.width - EDGE_CLICK_WIDTH) {
      nextPage();
    }
  }, [prevPage, nextPage]);

  // ============================================
  // ZOOM
  // ============================================
  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z - 25, 50));
  }, []);

  // ============================================
  // ROTAÇÃO
  // ============================================
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
  
  // Carregar dados iniciais
  useEffect(() => {
    fetchBookData();
    
    return () => {
      if (pageRefreshTimeoutRef.current) {
        clearTimeout(pageRefreshTimeoutRef.current);
      }
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [fetchBookData]);

  // Buscar página quando mudar
  useEffect(() => {
    if (book && currentPage > 0) {
      fetchPageUrl(currentPage);
      fetchAnnotations();
    }
  }, [book, currentPage, fetchPageUrl, fetchAnnotations]);

  // Auto-save
  useEffect(() => {
    if (book) {
      autoSaveIntervalRef.current = setInterval(saveProgress, AUTO_SAVE_INTERVAL_MS);
      
      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
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

  // ============================================
  // RENDER - PRINCIPAL
  // ============================================
  return (
    <SanctumProtectedContent
      resourceId={bookId}
      resourceType="ebook"
      className={cn("web-book-reader", className)}
      config={{
        watermark: !isOwner && watermark?.enabled,
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
          "flex flex-col h-screen bg-background",
          isFullscreen && "fixed inset-0 z-50"
        )}
      >
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}
        <header className="flex items-center justify-between px-4 py-2 bg-card border-b shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <div className="hidden sm:block">
                <h1 className="font-semibold text-sm truncate max-w-[200px] lg:max-w-[400px]">
                  {book.title}
                </h1>
                <p className="text-xs text-muted-foreground">{book.author}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Sumário */}
            <Sheet open={showTOC} onOpenChange={setShowTOC}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <List className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Sumário</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  {pages.filter(p => p.chapterTitle).map((page) => (
                    <button
                      key={page.pageNumber}
                      className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg transition-colors"
                      onClick={() => {
                        goToPage(page.pageNumber);
                        setShowTOC(false);
                      }}
                    >
                      <span className="font-medium">{page.chapterTitle}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        p. {page.pageNumber}
                      </span>
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            {/* Zoom */}
            <div className="hidden md:flex items-center gap-1 px-2 border-l border-r">
              <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium w-10 text-center">{zoom}%</span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Rotação */}
            <Button variant="ghost" size="icon" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </Button>

            {/* Fullscreen */}
            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {/* Indicador de salvamento */}
            {hasUnsavedChanges ? (
              <span className="text-xs text-muted-foreground">Salvando...</span>
            ) : (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Salvo
              </span>
            )}
          </div>
        </header>

        {/* ============================================ */}
        {/* ÁREA DE VISUALIZAÇÃO */}
        {/* ============================================ */}
        <main 
          className="flex-1 relative overflow-hidden bg-muted/30"
          onClick={handleContainerClick}
        >
          {/* Área de click - Anterior */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-20 z-10 cursor-pointer hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); prevPage(); }}
          >
            <ChevronLeft className="w-8 h-8 text-foreground/50" />
          </div>

          {/* Área de click - Próximo */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-20 z-10 cursor-pointer hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); nextPage(); }}
          >
            <ChevronRight className="w-8 h-8 text-foreground/50" />
          </div>

          {/* Conteúdo da página */}
          <div className="absolute inset-20 flex items-center justify-center">
            <div
              className="relative transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            >
              {isPageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              {currentPageUrl && (
                <img
                  src={currentPageUrl}
                  alt={`Página ${currentPage} de ${book.totalPages}`}
                  className="max-w-full max-h-[calc(100vh-200px)] rounded-lg shadow-xl"
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                />
              )}
            </div>
          </div>
        </main>

        {/* ============================================ */}
        {/* FOOTER - NAVEGAÇÃO */}
        {/* ============================================ */}
        <footer className="flex items-center justify-between px-4 py-2 bg-card border-t shrink-0">
          <div className="flex items-center gap-2">
            {/* Ferramentas de anotação */}
            {book.allowAnnotations && (
              <div className="flex items-center gap-1 border-r pr-2 mr-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedTool === TOOLS.PEN ? "default" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedTool(selectedTool === TOOLS.PEN ? TOOLS.NONE : TOOLS.PEN)}
                    >
                      <PenTool className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Caneta</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedTool === TOOLS.HIGHLIGHTER ? "default" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedTool(selectedTool === TOOLS.HIGHLIGHTER ? TOOLS.NONE : TOOLS.HIGHLIGHTER)}
                    >
                      <Highlighter className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Marcador</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedTool === TOOLS.ERASER ? "default" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedTool(selectedTool === TOOLS.ERASER ? TOOLS.NONE : TOOLS.ERASER)}
                    >
                      <Eraser className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Borracha</TooltipContent>
                </Tooltip>

                {/* Cores */}
                <div className="flex items-center gap-0.5 ml-1">
                  {COLORS.slice(0, 4).map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-transform",
                        selectedColor === color ? "border-foreground scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navegação central */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={prevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 px-3">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-12 h-8 text-center text-sm border rounded bg-background"
                min={1}
                max={book.totalPages}
              />
              <span className="text-sm text-muted-foreground">
                de {book.totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={nextPage}
              disabled={currentPage >= book.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Ações direita */}
          <div className="flex items-center gap-2">
            {/* Bookmark */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bookmark className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Marcar página</TooltipContent>
            </Tooltip>

            {/* Chat */}
            {book.allowChat && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={showChat ? "default" : "ghost"} 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setShowChat(!showChat)}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Perguntar ao TRAMON</TooltipContent>
              </Tooltip>
            )}

            {/* Barra de progresso */}
            <div className="hidden sm:flex items-center gap-2 ml-2 border-l pl-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentPage / book.totalPages) * 100).toFixed(0)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {((currentPage / book.totalPages) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </footer>
      </div>
    </SanctumProtectedContent>
  );
});

WebBookReader.displayName = "WebBookReader";

export default WebBookReader;
