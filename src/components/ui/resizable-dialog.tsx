// ============================================
// RESIZABLE DIALOG - Enterprise Modal System
// Modais redimensionáveis com drag handles
// ============================================

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Minus, Maximize2, GripHorizontal, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ResizableDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showMinimize?: boolean;
  showMaximize?: boolean;
  onMinimize?: () => void;
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
}

const ResizableDialog = DialogPrimitive.Root;
const ResizableDialogTrigger = DialogPrimitive.Trigger;
const ResizableDialogPortal = DialogPrimitive.Portal;
const ResizableDialogClose = DialogPrimitive.Close;

const ResizableDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
ResizableDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ResizableDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ResizableDialogContentProps
>(({ 
  className, 
  children, 
  showMinimize = false,
  showMaximize = false,
  onMinimize,
  defaultSize = { width: 600, height: 500 },
  minSize = { width: 320, height: 200 },
  maxSize = { width: window.innerWidth * 0.95, height: window.innerHeight * 0.95 },
  ...props 
}, ref) => {
  const [size, setSize] = React.useState(defaultSize);
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState<"right" | "bottom" | "corner" | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const startPos = React.useRef({ x: 0, y: 0 });
  const startSize = React.useRef({ width: 0, height: 0 });

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, direction: "right" | "bottom" | "corner") => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(direction);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };
  };

  // Handle resize move
  React.useEffect(() => {
    if (!isDragging) return;

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

      setSize({ width: newWidth, height: newHeight });
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
  }, [isDragging, maxSize.height, maxSize.width, minSize.height, minSize.width]);

  // Toggle maximize
  const handleMaximize = () => {
    if (isMaximized) {
      setSize(defaultSize);
    } else {
      setSize({ 
        width: window.innerWidth * 0.95, 
        height: window.innerHeight * 0.9 
      });
    }
    setIsMaximized(!isMaximized);
  };

  return (
    <ResizableDialogPortal>
      <ResizableDialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] border bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-xl overflow-hidden",
          isDragging && "select-none",
          className
        )}
        style={{
          width: isMaximized ? "95vw" : size.width,
          height: isMaximized ? "90vh" : size.height,
          maxWidth: "95vw",
          maxHeight: "95vh",
        }}
        {...props}
      >
        <div ref={contentRef} className="flex flex-col h-full overflow-hidden">
          {children}
        </div>

        {/* Window controls */}
        <div className="absolute right-2 top-2 flex items-center gap-1 z-10">
          {showMinimize && onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Minimizar"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
          )}
          {showMaximize && (
            <button
              onClick={handleMaximize}
              className="p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={isMaximized ? "Restaurar" : "Maximizar"}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
          <DialogPrimitive.Close className="p-1.5 rounded-md bg-muted/50 hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors">
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        </div>

        {/* Resize handles - only show if not maximized */}
        {!isMaximized && (
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
    </ResizableDialogPortal>
  );
});
ResizableDialogContent.displayName = "ResizableDialogContent";

const ResizableDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 p-4 pb-2 border-b border-border/50 shrink-0",
      className
    )}
    {...props}
  />
);
ResizableDialogHeader.displayName = "ResizableDialogHeader";

const ResizableDialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex-1 overflow-y-auto p-4", className)}
    {...props}
  />
);
ResizableDialogBody.displayName = "ResizableDialogBody";

const ResizableDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-4 pt-2 border-t border-border/50 shrink-0",
      className
    )}
    {...props}
  />
);
ResizableDialogFooter.displayName = "ResizableDialogFooter";

const ResizableDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight pr-20",
      className
    )}
    {...props}
  />
));
ResizableDialogTitle.displayName = DialogPrimitive.Title.displayName;

const ResizableDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ResizableDialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  ResizableDialog,
  ResizableDialogPortal,
  ResizableDialogOverlay,
  ResizableDialogClose,
  ResizableDialogTrigger,
  ResizableDialogContent,
  ResizableDialogHeader,
  ResizableDialogBody,
  ResizableDialogFooter,
  ResizableDialogTitle,
  ResizableDialogDescription,
};
