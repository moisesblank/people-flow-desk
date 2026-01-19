// ============================================
// 🔥 PROTECTED PDF VIEWER - DOGMA III
// Visualizador de PDF blindado contra cópia
// ============================================

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Loader2,
  Shield,
  Lock,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useContentSecurityGuard } from "@/hooks/useContentSecurityGuard";
import { useAuth } from "@/hooks/useAuth";
import { formatError } from "@/lib/utils/formatError";

interface UserWatermarkData {
  nome?: string;
  cpf?: string;
  email?: string;
}

interface ProtectedPDFViewerProps {
  /** URL do PDF (será processado pelo backend) */
  pdfUrl: string;
  /** Título do documento */
  title?: string;
  /** Dados do usuário para marca d'água */
  userData?: UserWatermarkData;
  /** Classes CSS extras */
  className?: string;
  /** Callback ao tentar download */
  onDownloadAttempt?: () => void;
}

// ============================================
// MARCA D'ÁGUA DINÂMICA PARA PDF
// ============================================
const PDFWatermark = memo(({ userData }: { userData: UserWatermarkData }) => {
  // CPF COMPLETO - Sem máscara (cada usuário vê apenas o seu próprio)
  const formatCPF = (cpf: string) => {
    if (!cpf) return "";
    const clean = cpf.replace(/\D/g, "");
    if (clean.length !== 11) return cpf;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  const watermarkText = [
    userData.nome || "",
    userData.cpf ? formatCPF(userData.cpf) : "",
    userData.email || "",
  ].filter(Boolean).join(" • ");

  if (!watermarkText) return null;

  // Grid de marcas d'água para cobrir toda a página
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Padrão de marcas d'água em grid */}
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex flex-wrap justify-around w-full">
          {Array.from({ length: 3 }).map((_, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className="text-black/5 dark:text-white/5 font-mono text-xs whitespace-nowrap transform rotate-[-30deg] m-8"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.03, 0.08, 0.03],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                delay: (rowIndex + colIndex) * 0.5,
              }}
            >
              {watermarkText}
            </motion.div>
          ))}
        </div>
      ))}

      {/* Marca d'água central proeminente */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-black/8 dark:text-white/8 font-bold text-lg tracking-widest whitespace-nowrap rotate-[-25deg]"
        animate={{ 
          scale: [1, 1.02, 1],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
      >
        {userData.nome?.toUpperCase()}
      </motion.div>
    </div>
  );
});

PDFWatermark.displayName = 'PDFWatermark';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ProtectedPDFViewer = memo(({
  pdfUrl,
  title = "Documento Protegido",
  userData,
  className,
  onDownloadAttempt,
}: ProtectedPDFViewerProps) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════
  // 🛡️ UNIVERSAL CONTENT SECURITY GUARD - PROTEÇÃO TOTAL
  // ═══════════════════════════════════════════════════════════
  const { SevereOverlay } = useContentSecurityGuard({
    contentId: pdfUrl || 'unknown-pdf',
    contentType: 'pdf',
    contentTitle: title,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.user_metadata?.name || userData?.nome,
    enabled: true,
    onViolation: () => onDownloadAttempt?.(),
  });

  // ============================================
  // BLOQUEIO DE INTERAÇÕES - TODOS OS DISPOSITIVOS
  // Desktop + Mobile (iOS/Android/Tablet)
  // ============================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Bloquear menu de contexto (Desktop + Mobile long-press)
    const blockContextMenu = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDownloadAttempt?.();
      return false;
    };

    // Bloquear seleção
    const blockSelect = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Bloquear cópia
    const blockCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      onDownloadAttempt?.();
      return false;
    };

    // Bloquear impressão e atalhos perigosos
    const blockShortcuts = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl+P (Print), Ctrl+S (Save), Ctrl+C (Copy), Ctrl+Shift+S (Save As)
      if (isCtrl && (key === 'p' || key === 's' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        onDownloadAttempt?.();
        return false;
      }

      // Print Screen
      if (key === 'printscreen' || e.key === 'PrintScreen') {
        e.preventDefault();
        onDownloadAttempt?.();
        return false;
      }
    };

    // Bloquear arrastar
    const blockDrag = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // ============================================
    // 📱 BLOQUEIOS ESPECÍFICOS PARA MOBILE/TOUCH
    // ============================================
    
    // Long-press blocking para mobile
    let longPressTimer: NodeJS.Timeout | null = null;
    const handleTouchStart = (e: TouchEvent) => {
      // Multi-touch = possível screenshot gesture
      if (e.touches.length >= 3) {
        e.preventDefault();
        onDownloadAttempt?.();
      }
      
      longPressTimer = setTimeout(() => {
        onDownloadAttempt?.();
      }, 400);
    };
    
    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };
    
    const handleTouchMove = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };
    
    // iOS Gesture blocking
    const handleGesture = (e: Event) => {
      e.preventDefault();
      onDownloadAttempt?.();
    };

    // Desktop events
    container.addEventListener('contextmenu', blockContextMenu);
    container.addEventListener('selectstart', blockSelect);
    container.addEventListener('copy', blockCopy);
    container.addEventListener('dragstart', blockDrag);
    window.addEventListener('keydown', blockShortcuts);
    
    // Touch/Mobile events
    container.addEventListener('touchstart', handleTouchStart, { capture: true, passive: false });
    container.addEventListener('touchend', handleTouchEnd, { capture: true });
    container.addEventListener('touchmove', handleTouchMove, { capture: true });
    
    // iOS gestures
    container.addEventListener('gesturestart', handleGesture, { capture: true });
    container.addEventListener('gesturechange', handleGesture, { capture: true });

    // Desabilitar impressão via CSS
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        .protected-pdf-viewer * {
          display: none !important;
        }
        body::after {
          content: "⚠️ IMPRESSÃO BLOQUEADA ⚠️ - Documento protegido por Prof. Moisés Medeiros";
          display: block;
          font-size: 24px;
          text-align: center;
          padding: 50px;
          color: #dc2626;
          font-weight: bold;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Desktop cleanup
      container.removeEventListener('contextmenu', blockContextMenu);
      container.removeEventListener('selectstart', blockSelect);
      container.removeEventListener('copy', blockCopy);
      container.removeEventListener('dragstart', blockDrag);
      window.removeEventListener('keydown', blockShortcuts);
      
      // Touch/Mobile cleanup
      container.removeEventListener('touchstart', handleTouchStart, { capture: true });
      container.removeEventListener('touchend', handleTouchEnd, { capture: true });
      container.removeEventListener('touchmove', handleTouchMove, { capture: true });
      container.removeEventListener('gesturestart', handleGesture, { capture: true });
      container.removeEventListener('gesturechange', handleGesture, { capture: true });
      
      if (longPressTimer) clearTimeout(longPressTimer);
      document.head.removeChild(style);
    };
  }, [onDownloadAttempt]);

  // ============================================
  // CONTROLES
  // ============================================
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(200, prev + 25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(50, prev - 25));
  }, []);

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <SevereOverlay />
      <div
        ref={containerRef}
        className={cn(
          "protected-pdf-viewer relative flex flex-col bg-background rounded-xl overflow-hidden border border-border",
          className
        )}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        } as React.CSSProperties}
      >
      {/* Header com controles */}
      <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
            {title}
          </span>
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          {/* Page Controls */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[60px] text-center">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="relative flex-1 overflow-auto bg-muted/20 min-h-[500px]">
        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-background/80 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Carregando documento...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-destructive">
              <FileText className="w-12 h-12" />
              <span className="text-sm">{formatError(error)}</span>
            </div>
          </div>
        )}

        {/* PDF Embed (usando object para maior controle) */}
        <div 
          className="relative w-full h-full flex items-center justify-center p-4"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top' }}
        >
          <object
            data={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            type="application/pdf"
            className="w-full h-full min-h-[600px] bg-white rounded-lg shadow-lg"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Erro ao carregar documento');
            }}
          >
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Seu navegador não suporta visualização de PDF.
              </p>
            </div>
          </object>
        </div>

        {/* Marca d'água do usuário */}
        {userData && <PDFWatermark userData={userData} />}

        {/* Overlay anti-screenshot */}
        <div 
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: 'linear-gradient(45deg, transparent 49%, rgba(0,0,0,0.01) 50%, transparent 51%)',
            backgroundSize: '3px 3px'
          }}
        />
      </div>

      {/* Footer com aviso de segurança */}
      <div className="flex items-center justify-center gap-2 p-2 bg-muted/30 border-t border-border">
        <Shield className="w-3 h-3 text-green-500" />
        <span className="text-[10px] text-muted-foreground">
          Documento protegido • Download e impressão desabilitados
        </span>
      </div>
    </div>
    </>
  );
});

ProtectedPDFViewer.displayName = 'ProtectedPDFViewer';

export default ProtectedPDFViewer;
