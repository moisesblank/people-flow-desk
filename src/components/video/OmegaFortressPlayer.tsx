// ============================================
// 🔥🛡️ OMEGA FORTRESS PLAYER v5.0 🛡️🔥
// O PLAYER DEFINITIVO — SANCTUM 2.0 + DESIGN 2300
// ============================================
// ✅ Integração total com useVideoFortressOmega
// ✅ Bypass inteligente para agentes
// ✅ Detecção não-intrusiva
// ✅ UI futurista com glassmorphism
// ✅ Watermark dinâmica avançada
// ✅ Controles mínimos (play/pause/settings)
// ✅ Mobile-first + PWA ready
// ============================================

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback,
  useMemo,
  memo,
} from "react";
import { useVideoFortressOmega, SANCTUM_CONFIG, ViolationType } from "@/hooks/useVideoFortressOmega";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Settings,
  Maximize,
  Minimize,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================
// TIPOS
// ============================================
interface OmegaFortressPlayerProps {
  // Identificação
  lessonId?: string;
  courseId?: string;
  providerVideoId: string;
  provider?: "panda" | "youtube";
  
  // Alternativas
  fallbackUrl?: string;
  thumbnailUrl?: string;
  
  // Callbacks
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onViolation?: (type: ViolationType, action: string) => void;
  
  // Config
  autoPlay?: boolean;
  showWatermark?: boolean;
  className?: string;
}

// ============================================
// WATERMARK DINÂMICA
// ============================================
const DynamicWatermark = memo(({ 
  text, 
  hash, 
  mode = "moving" 
}: { 
  text: string; 
  hash?: string; 
  mode?: "moving" | "static";
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (mode !== "moving") return;

    const interval = setInterval(() => {
      setPosition({
        x: 10 + Math.random() * 70,
        y: 10 + Math.random() * 70,
      });
      
      // Piscar para dificultar remoção estática
      setVisible(false);
      setTimeout(() => setVisible(true), 50);
    }, 25000 + Math.random() * 15000);

    return () => clearInterval(interval);
  }, [mode]);

  const timestamp = useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit", 
      second: "2-digit" 
    });
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Watermark principal (centro-variável) */}
      <div
        className="absolute pointer-events-none select-none z-[9999] transition-all duration-1000"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: "translate(-50%, -50%)",
          opacity: 0.12,
          fontSize: "clamp(10px, 1.5vw, 14px)",
          fontWeight: 600,
          color: "white",
          textShadow: "0 0 4px rgba(0,0,0,0.5)",
          fontFamily: "monospace",
          letterSpacing: "0.05em",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>

      {/* Watermark de canto (sempre visível) */}
      <div
        className="absolute bottom-4 right-4 pointer-events-none select-none z-[9999]"
        style={{
          opacity: 0.08,
          fontSize: "clamp(8px, 1vw, 10px)",
          fontWeight: 500,
          color: "white",
          textShadow: "0 0 2px rgba(0,0,0,0.5)",
          fontFamily: "monospace",
        }}
      >
        {hash} • {timestamp}
      </div>

      {/* Pattern de fundo (anti-crop) */}
      <div
        className="absolute inset-0 pointer-events-none select-none z-[9998]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 100px,
            rgba(255,255,255,0.003) 100px,
            rgba(255,255,255,0.003) 200px
          )`,
        }}
      />
    </>
  );
});

DynamicWatermark.displayName = "DynamicWatermark";

// ============================================
// INDICADOR DE SEGURANÇA
// ============================================
const SecurityIndicator = memo(({ 
  isImmune, 
  isRelaxed, 
  riskLevel, 
  devToolsOpen,
}: { 
  isImmune: boolean;
  isRelaxed: boolean;
  riskLevel: string;
  devToolsOpen: boolean;
}) => {
  if (isImmune) {
    return (
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 z-[9000]">
        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[10px] font-medium text-purple-300">OMEGA</span>
      </div>
    );
  }

  if (devToolsOpen) {
    return (
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 z-[9000] animate-pulse">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[10px] font-medium text-amber-300">DETECTADO</span>
      </div>
    );
  }

  const colors = {
    low: { bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-300", icon: "text-emerald-400" },
    medium: { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-300", icon: "text-amber-400" },
    high: { bg: "bg-orange-500/20", border: "border-orange-500/30", text: "text-orange-300", icon: "text-orange-400" },
    critical: { bg: "bg-red-500/20", border: "border-red-500/30", text: "text-red-300", icon: "text-red-400" },
  };

  const c = colors[riskLevel as keyof typeof colors] || colors.low;

  return (
    <div className={cn(
      "absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm border z-[9000]",
      c.bg,
      c.border,
    )}>
      <Shield className={cn("w-3.5 h-3.5", c.icon)} />
      <span className={cn("text-[10px] font-medium", c.text)}>PROTEGIDO</span>
    </div>
  );
});

SecurityIndicator.displayName = "SecurityIndicator";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const OmegaFortressPlayer: React.FC<OmegaFortressPlayerProps> = ({
  lessonId,
  courseId,
  providerVideoId,
  provider = "panda",
  fallbackUrl,
  thumbnailUrl,
  onReady,
  onPlay,
  onPause,
  onEnded,
  onError,
  onViolation,
  autoPlay = false,
  showWatermark = true,
  className,
}) => {
  // Estado do hook
  const {
    isAuthorizing,
    isAuthorized,
    session,
    error,
    isSessionValid,
    isImmune,
    isRelaxed,
    devToolsOpen,
    riskLevel,
    violationCount,
    lastAction,
    authorize,
    reportViolation,
    endSession,
    config,
  } = useVideoFortressOmega();

  // Estado local
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  const handleInitialize = useCallback(async () => {
    if (isInitializing || isAuthorized) return;
    
    setIsInitializing(true);
    setHasStarted(true);

    try {
      const result = await authorize({
        lessonId,
        courseId,
        providerVideoId,
        provider,
      });

      if (result) {
        onReady?.();
        if (autoPlay) {
          setIsPlaying(true);
          onPlay?.();
        }
      } else {
        onError?.(error || "Falha ao inicializar");
      }
    } finally {
      setIsInitializing(false);
    }
  }, [authorize, lessonId, courseId, providerVideoId, provider, isInitializing, isAuthorized, autoPlay, error, onReady, onPlay, onError]);

  // ============================================
  // CONTROLES
  // ============================================
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => {
      const newState = !prev;
      newState ? onPlay?.() : onPause?.();
      return newState;
    });
  }, [onPlay, onPause]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // Auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // ============================================
  // PROTEÇÕES (SÓ PARA NÃO-IMUNES)
  // ============================================
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (isImmune || isRelaxed) return;
    
    e.preventDefault();
    reportViolation("context_menu", { x: e.clientX, y: e.clientY });
  }, [isImmune, isRelaxed, reportViolation]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (isImmune || isRelaxed) return;
    
    e.preventDefault();
    reportViolation("drag_attempt");
  }, [isImmune, isRelaxed, reportViolation]);

  const handleCopy = useCallback((e: React.ClipboardEvent) => {
    if (isImmune || isRelaxed) return;
    
    // NÃO bloqueia, apenas loga
    reportViolation("copy_attempt");
  }, [isImmune, isRelaxed, reportViolation]);

  // Keyboard handler (escopo do container)
  useEffect(() => {
    if (!containerRef.current || isImmune) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Apenas teclas realmente perigosas
      const dangerousCombos = [
        { ctrl: true, key: 's' },  // Salvar
        { ctrl: true, key: 'p' },  // Imprimir
        { ctrl: true, key: 'u' },  // View source
        { ctrl: true, shift: true, key: 'i' }, // DevTools
        { ctrl: true, shift: true, key: 'j' }, // Console
      ];

      const isBlocked = dangerousCombos.some(combo => {
        const ctrlMatch = combo.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = combo.shift ? e.shiftKey : true;
        const keyMatch = e.key.toLowerCase() === combo.key;
        return ctrlMatch && shiftMatch && keyMatch;
      });

      if (isBlocked) {
        e.preventDefault();
        reportViolation("keyboard_shortcut", { 
          key: e.key, 
          ctrl: e.ctrlKey, 
          shift: e.shiftKey 
        });
        
        if (!isRelaxed) {
          toast.info("Atalho bloqueado", { duration: 1500 });
        }
      }
    };

    const container = containerRef.current;
    container.addEventListener("keydown", handleKeyDown);
    
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImmune, isRelaxed, reportViolation]);

  // Visibility change (só para não-imunes)
  useEffect(() => {
    if (isImmune) return;

    let count = 0;
    let lastHidden = 0;

    const handleVisibility = () => {
      if (document.hidden) {
        count++;
        lastHidden = Date.now();
      } else {
        // Se voltou muito rápido (< 500ms) repetidamente, pode ser screenshot
        if (Date.now() - lastHidden < 500 && count >= 10) {
          reportViolation("visibility_abuse", { count, interval: Date.now() - lastHidden });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isImmune, reportViolation]);

  // ============================================
  // EFEITO DE DEVTOOLS (blur leve, não bloqueia)
  // ============================================
  const devToolsBlurStyle = devToolsOpen && !isImmune 
    ? "backdrop-blur-[3px] transition-all duration-500" 
    : "";

  // ============================================
  // CLEANUP
  // ============================================
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      endSession();
    };
  }, [endSession]);

  // ============================================
  // RENDER: LOADING/ERROR STATES
  // ============================================
  if (!hasStarted) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "relative w-full aspect-video bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 rounded-xl overflow-hidden cursor-pointer group",
          className,
        )}
        onClick={handleInitialize}
      >
        {/* Thumbnail */}
        {thumbnailUrl && (
          <img 
            src={thumbnailUrl} 
            alt="Video thumbnail"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}

        {/* Overlay com botão play */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-xl animate-pulse" />
            
            <Button
              size="lg"
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-2xl shadow-cyan-500/30 border border-white/10"
            >
              <Play className="w-8 h-8 ml-1" fill="currentColor" />
            </Button>
          </div>
        </div>

        {/* Security badge */}
        <SecurityIndicator 
          isImmune={isImmune}
          isRelaxed={isRelaxed}
          riskLevel={riskLevel}
          devToolsOpen={devToolsOpen}
        />
      </div>
    );
  }

  if (isInitializing || isAuthorizing) {
    return (
      <div className={cn(
        "relative w-full aspect-video bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 rounded-xl overflow-hidden flex items-center justify-center",
        className,
      )}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          </div>
          <p className="text-sm text-gray-400 font-medium">Autorizando...</p>
        </div>
      </div>
    );
  }

  if (error && !isAuthorized) {
    return (
      <div className={cn(
        "relative w-full aspect-video bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 rounded-xl overflow-hidden flex items-center justify-center",
        className,
      )}>
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <AlertTriangle className="w-12 h-12 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-white">{error}</p>
            <p className="text-xs text-gray-400 mt-1">Tente novamente ou entre em contato</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setHasStarted(false);
              setIsInitializing(false);
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!isSessionValid) {
    return (
      <div className={cn(
        "relative w-full aspect-video bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 rounded-xl overflow-hidden flex items-center justify-center",
        className,
      )}>
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <ShieldAlert className="w-12 h-12 text-red-400" />
          <div>
            <p className="text-sm font-medium text-white">Sessão expirada</p>
            <p className="text-xs text-gray-400 mt-1">Sua sessão de vídeo expirou ou foi revogada</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setHasStarted(false);
              setIsInitializing(false);
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: PLAYER ATIVO
  // ============================================
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full aspect-video bg-black rounded-xl overflow-hidden group",
        devToolsBlurStyle,
        className,
      )}
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onCopy={handleCopy}
      tabIndex={0}
    >
      {/* Player iframe */}
      {session?.embedUrl && (
        <iframe
          ref={iframeRef}
          src={session.embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope"
          allowFullScreen={false}
          frameBorder="0"
          style={{
            pointerEvents: showControls ? "none" : "auto",
          }}
        />
      )}

      {/* Click shield (intercepta cliques quando controles visíveis) */}
      {showControls && (
        <div 
          className="absolute inset-0 z-[100]"
          onClick={togglePlay}
        />
      )}

      {/* Watermark */}
      {showWatermark && session?.watermark && (
        <DynamicWatermark
          text={session.watermark.text}
          hash={session.watermark.hash}
          mode={session.watermark.mode}
        />
      )}

      {/* Security indicator */}
      <SecurityIndicator 
        isImmune={isImmune}
        isRelaxed={isRelaxed}
        riskLevel={riskLevel}
        devToolsOpen={devToolsOpen}
      />

      {/* DevTools warning (sutil) */}
      {devToolsOpen && !isImmune && (
        <div className="absolute top-12 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 z-[9000]">
          <EyeOff className="w-3 h-3 text-amber-400" />
          <span className="text-[9px] text-amber-400/80">Modo limitado ativo</span>
        </div>
      )}

      {/* Controls overlay */}
      <div 
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 z-[200] transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        {/* Bottom controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Left controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white"
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                <DropdownMenuItem className="text-gray-300 hover:text-white">
                  Qualidade: Auto
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:text-white">
                  Velocidade: 1x
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white"
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EXPORTS
// ============================================
export default memo(OmegaFortressPlayer);
export { OmegaFortressPlayer };
