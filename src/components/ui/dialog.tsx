// ============================================
// DIALOG - Constitutional Resizable Modal System v2.0
// ALL modals MUST be resizable and maximizable
// ============================================

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Maximize2, Minimize2, GripHorizontal, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showMaximize?: boolean;
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  disableResize?: boolean;
  /** 
   * EXCEÇÃO CONSTITUCIONAL: Quando true, usa dimensões originais (não 98vw × 98vh)
   * Uso exclusivo para área /auth onde modais compactos são necessários
   */
  useOriginalSize?: boolean;
}

// ============================================
// LEI CONSTITUCIONAL DOS MODAIS v3.0
// DIMENSÃO PADRÃO UNIVERSAL: 98vw × 98vh
// EXCEÇÃO: área /auth usa dimensões originais
// ============================================
const MODAL_DEFAULT_SIZE = { width: 98, height: 98 }; // em vw/vh
const MODAL_MIN_SIZE = { width: 320, height: 200 }; // em px

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ 
  className, 
  children, 
  showMaximize = true,
  defaultSize,
  minSize = MODAL_MIN_SIZE,
  disableResize = false,
  useOriginalSize = false, // EXCEÇÃO para /auth
  ...props 
}, ref) => {
  // EXCEÇÃO: /auth usa tamanho original (não maximizado)
  // PADRÃO: inicia maximizado (98vw × 98vh)
  const [isMaximized, setIsMaximized] = React.useState(!useOriginalSize);
  const [customSize, setCustomSize] = React.useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = React.useState<"right" | "bottom" | "corner" | null>(null);
  const startPos = React.useRef({ x: 0, y: 0 });
  const startSize = React.useRef({ width: 0, height: 0 });

  // ✅ P0 FIX (Modo Leitura / Fullscreen): em fullscreen, Portals no <body> podem não ser exibidos.
  // Radix permite definir o container do Portal; aqui redirecionamos para o elemento fullscreen.
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | undefined>(undefined);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    const update = () => {
      const el = document.fullscreenElement;
      setPortalContainer(el instanceof HTMLElement ? el : undefined);
    };

    update();
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  const maxSize = React.useMemo(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth * 0.98 : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight * 0.98 : 800,
  }), []);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, direction: "right" | "bottom" | "corner") => {
    if (disableResize || isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(direction);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...customSize };
  };

  // Handle resize move
  React.useEffect(() => {
    if (!isDragging || disableResize) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;

      if (isDragging === "right" || isDragging === "corner") {
        newWidth = Math.min(maxSize.width, Math.max(minSize.width, startSize.current.width + deltaX));
      }
      if (isDragging === "bottom" || isDragging === "corner") {
        newHeight = Math.min(maxSize.height, Math.max(minSize.height, startSize.current.height + deltaY));
      }

      setCustomSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, maxSize.height, maxSize.width, minSize.height, minSize.width, disableResize]);

  // Toggle maximize - por padrão já está maximizado (98vw × 98vh)
  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <DialogPortal container={portalContainer}>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        onPointerDownOutside={(e) => e.preventDefault()}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] border bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-xl overflow-hidden flex flex-col",
          isDragging && "select-none",
          // EXCEÇÃO /auth: usa classes CSS originais quando useOriginalSize=true
          useOriginalSize && "w-full max-w-lg h-auto max-h-[85vh]",
          className,
        )}
        style={useOriginalSize ? undefined : {
          // LEI CONSTITUCIONAL: 98vw × 98vh como padrão universal (exceto /auth)
          width: isMaximized ? "98vw" : customSize.width,
          height: isMaximized ? "98vh" : customSize.height,
          maxWidth: "98vw",
          maxHeight: "98vh",
        }}
        {...props}
      >
        {children}
        
        {/* Window controls - z-50 para garantir soberania sobre outros elementos */}
        <div className="absolute right-2 top-2 flex items-center gap-1 z-50 pointer-events-auto">
          {showMaximize && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMaximize();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md bg-muted/80 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors border border-border/50 hover:border-primary/30"
              title={isMaximized ? "Restaurar" : "Maximizar"}
              type="button"
              aria-label={isMaximized ? "Restaurar tamanho" : "Maximizar janela"}
            >
              {isMaximized ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          <DialogPrimitive.Close 
            className="p-1.5 rounded-md bg-muted/80 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors border border-border/50 hover:border-destructive/30"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>

        {/* Resize handles - only show if not maximized and resize enabled */}
        {!isMaximized && !disableResize && (
          <>
            {/* Right handle */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-16 cursor-ew-resize group z-20"
              onMouseDown={(e) => handleResizeStart(e, "right")}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-primary/60" />
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary/30 rounded transition-colors" />
            </div>

            {/* Bottom handle */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-2 w-16 cursor-ns-resize group z-20"
              onMouseDown={(e) => handleResizeStart(e, "bottom")}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal className="h-4 w-4 text-primary/60" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-primary/30 rounded transition-colors" />
            </div>

            {/* Corner handle */}
            <div
              className="absolute right-0 bottom-0 w-5 h-5 cursor-nwse-resize group z-20"
              onMouseDown={(e) => handleResizeStart(e, "corner")}
            >
              <div className="absolute inset-0 flex items-end justify-end p-1 opacity-40 group-hover:opacity-100 transition-opacity">
                <svg width="10" height="10" viewBox="0 0 10 10" className="text-primary">
                  <path d="M0 10 L10 0 L10 3 L3 10 Z" fill="currentColor" opacity="0.4" />
                  <path d="M5 10 L10 5 L10 7 L7 10 Z" fill="currentColor" opacity="0.6" />
                  <path d="M8 10 L10 8 L10 10 Z" fill="currentColor" />
                </svg>
              </div>
            </div>
          </>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("flex flex-col space-y-1.5 p-4 pb-2 border-b border-border/50 shrink-0 pr-16", className)} 
    {...props} 
  />
));
DialogHeader.displayName = "DialogHeader";

const DialogBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      // Flex-1 com min-h-0 permite que o body seja o container de scroll
      "flex-1 min-h-0 p-4",
      // RESPONSIVE SCROLL: garantir scroll em todos os dispositivos
      "overflow-y-auto overscroll-contain",
      // Touch scroll suave para mobile/tablet
      "touch-pan-y",
      // Webkit scroll para iOS
      "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full",
      className
    )} 
    style={{ 
      WebkitOverflowScrolling: 'touch',
      scrollbarGutter: 'stable',
    }}
    {...props} 
  />
));
DialogBody.displayName = "DialogBody";

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-4 pt-2 border-t border-border/50 shrink-0", className)} 
    {...props} 
  />
));
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
