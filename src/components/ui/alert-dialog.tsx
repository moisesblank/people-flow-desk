// ============================================
// ALERT DIALOG - Constitutional Resizable Modal System v2.0
// ALL modals MUST be resizable and maximizable
// ============================================

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Maximize2, Minimize2, GripHorizontal, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

interface AlertDialogContentProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> {
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
const ALERT_MODAL_DEFAULT_SIZE = { width: 98, height: 98 }; // em vw/vh
const ALERT_MODAL_MIN_SIZE = { width: 320, height: 180 }; // em px

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AlertDialogContentProps
>(({ 
  className, 
  children,
  showMaximize = true,
  defaultSize,
  minSize = ALERT_MODAL_MIN_SIZE,
  disableResize = false,
  useOriginalSize = false, // EXCEÇÃO para /auth
  ...props 
}, ref) => {
  // EXCEÇÃO: /auth usa tamanho original (não maximizado)
  // PADRÃO: inicia maximizado (98vw × 98vh)
  const [isMaximized, setIsMaximized] = React.useState(!useOriginalSize);
  const [customSize, setCustomSize] = React.useState({ width: 500, height: 300 });
  const [isDragging, setIsDragging] = React.useState<"right" | "bottom" | "corner" | null>(null);
  const startPos = React.useRef({ x: 0, y: 0 });
  const startSize = React.useRef({ width: 0, height: 0 });

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
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] border bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-xl overflow-hidden flex flex-col",
          isDragging && "select-none",
          // EXCEÇÃO /auth: usa classes CSS originais quando useOriginalSize=true
          useOriginalSize && "w-full max-w-md h-auto max-h-[85vh]",
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

        {/* Window controls */}
        {showMaximize && (
          <div className="absolute right-2 top-2 flex items-center gap-1 z-10">
            <button
              onClick={handleMaximize}
              className="p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={isMaximized ? "Restaurar" : "Maximizar"}
              type="button"
            >
              {isMaximized ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}

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
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
});
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 p-4 pb-2 shrink-0 pr-12", className)} {...props} />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

// Body scrollável para AlertDialog (consistente com Dialog)
const AlertDialogBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "flex-1 min-h-0 p-4",
      "overflow-y-auto overscroll-contain touch-pan-y",
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
AlertDialogBody.displayName = "AlertDialogBody";

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-4 pt-2 shrink-0", className)} {...props} />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description 
    ref={ref} 
    className={cn(
      "text-sm text-muted-foreground",
      // RESPONSIVE SCROLL: garantir scroll em todos os dispositivos
      "flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y",
      className
    )} 
    style={{ WebkitOverflowScrolling: 'touch' }}
    {...props} 
  />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} className={cn(buttonVariants(), className)} {...props} />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
