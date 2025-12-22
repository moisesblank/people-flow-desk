// ============================================
// 🔥🔥🔥 ULTRA FORTRESS PLAYER v4.0 - SANCTUM EDITION 🔥🔥🔥
// O PLAYER DEFINITIVO COM PROTEÇÃO INTELIGENTE
// ⚠️ REGRA DE OURO: DETECÇÃO ≠ PUNIÇÃO
// ⚠️ Bypass para: owner, funcionario, staging, agentes IA
// Autor: MESTRE (Claude Opus 4.5 PHD)
// ============================================

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Settings, 
  Loader2,
  Volume2,
  VolumeX,
  Maximize,
  Shield,
  Lock,
  AlertTriangle,
  RefreshCw,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// 🛡️ SANCTUM 2.0 - CONFIGURAÇÃO DE BYPASS
// Roles e ambientes que são IMUNES à proteção
// ============================================
const BYPASS_CONFIG = {
  // Roles que são imunes (não sofrem bloqueios)
  immuneRoles: ['owner', 'admin', 'funcionario', 'suporte', 'coordenacao'] as const,
  
  // Ambientes onde proteção é relaxada
  devEnvironments: ['localhost', '127.0.0.1', 'staging', 'dev', 'preview'],
  
  // Feature flag - se false, proteção é apenas logging
  securityHardeningEnabled: true,
  
  // Emails/IDs de agentes internos (testers, bots, automações)
  allowlistEmails: [
    'moisesblank@gmail.com', // Owner
    'suporte@moisesmedeiros.com.br',
    'bot@moisesmedeiros.com.br',
    'automacao@moisesmedeiros.com.br',
  ],
  
  // User agents de automações internas
  allowlistUserAgents: [
    'MoisesBot',
    'TramonAgent',
    'SNAWorker',
    'Playwright',
    'Cypress',
  ],
};

// Verifica se o usuário/ambiente deve ter bypass
function shouldBypass(user: any, userRole?: string): boolean {
  // 1. Ambiente de desenvolvimento = bypass
  const hostname = window.location.hostname;
  if (BYPASS_CONFIG.devEnvironments.some(env => hostname.includes(env))) {
    return true;
  }
  
  // 2. Role imune = bypass
  if (userRole && BYPASS_CONFIG.immuneRoles.includes(userRole as any)) {
    return true;
  }
  
  // 3. Email na allowlist = bypass
  if (user?.email && BYPASS_CONFIG.allowlistEmails.includes(user.email)) {
    return true;
  }
  
  // 4. User agent de automação = bypass
  const ua = navigator.userAgent;
  if (BYPASS_CONFIG.allowlistUserAgents.some(bot => ua.includes(bot))) {
    return true;
  }
  
  // 5. Feature flag desabilitada = bypass (apenas logging)
  if (!BYPASS_CONFIG.securityHardeningEnabled) {
    return true;
  }
  
  return false;
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ============================================
// TIPOS E INTERFACES
// ============================================
interface VideoSession {
  sessionId: string;
  sessionCode: string;
  sessionToken: string;
  embedUrl: string;
  expiresAt: string;
  watermark: {
    text: string;
    hash: string;
    mode: "moving" | "static";
  };
  provider: "panda" | "youtube";
  drmEnabled: boolean;
}

export interface UltraFortressPlayerProps {
  /** ID do vídeo (Panda ou YouTube) */
  videoId: string;
  /** Tipo de provider */
  provider?: "panda" | "youtube";
  /** ID da aula (para logs e tracking) */
  lessonId?: string;
  /** ID do curso */
  courseId?: string;
  /** Título do vídeo */
  title?: string;
  /** Thumbnail */
  thumbnail?: string;
  /** Classes CSS */
  className?: string;
  /** Autoplay */
  autoplay?: boolean;
  /** Callback ao completar */
  onComplete?: () => void;
  /** Callback de progresso */
  onProgress?: (progress: number) => void;
  /** Callback de erro */
  onError?: (error: string) => void;
}

// Velocidades disponíveis
const PLAYBACK_SPEEDS = [
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "Normal", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2 },
];

// Qualidades
const VIDEO_QUALITIES = [
  { label: "Auto", value: "auto" },
  { label: "1080p HD", value: "hd1080" },
  { label: "720p", value: "hd720" },
  { label: "480p", value: "large" },
  { label: "360p", value: "medium" },
];

// Tipos de violação
type ViolationType = 
  | "devtools_open"
  | "screenshot_attempt"
  | "keyboard_shortcut"
  | "context_menu"
  | "drag_attempt"
  | "copy_attempt"
  | "visibility_abuse"
  | "iframe_manipulation"
  | "unknown";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const UltraFortressPlayer = memo(({
  videoId,
  provider = "panda",
  lessonId,
  courseId,
  title = "Vídeo Protegido",
  thumbnail,
  className = "",
  autoplay = false,
  onComplete,
  onProgress,
  onError,
}: UltraFortressPlayerProps) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityCountRef = useRef(0);
  const devToolsWarningShownRef = useRef(false);

  // Estados principais
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [session, setSession] = useState<VideoSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados do player
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showThumbnail, setShowThumbnail] = useState(!autoplay);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [currentQuality, setCurrentQuality] = useState("hd1080");
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Estados de segurança
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");
  const [sessionRevoked, setSessionRevoked] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
  
  // 🛡️ SANCTUM: Estado de bypass (imunidade)
  const [isImmune, setIsImmune] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Posição da watermark
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 10, y: 10 });
  
  // 🛡️ SANCTUM: Verificar bypass na montagem
  useEffect(() => {
    const checkImmunity = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        const role = profile?.role || 'viewer';
        setUserRole(role);
        
        const immune = shouldBypass(user, role);
        setIsImmune(immune);
        
        if (immune) {
          console.log('🛡️ SANCTUM: Usuário com bypass ativado', { role, email: user.email });
        }
      } catch (error) {
        // Em caso de erro, assume não-imune por segurança
        setIsImmune(false);
      }
    };
    
    checkImmunity();
  }, [user]);

  // URL do thumbnail
  const thumbnailUrl = thumbnail || 
    (provider === "youtube" 
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : null);

  // ============================================
  // AUTORIZAÇÃO (BACKEND)
  // ============================================
  const authorize = useCallback(async () => {
    if (!user) {
      setError("Você precisa estar logado para assistir");
      onError?.("NOT_AUTHENTICATED");
      return;
    }

    setIsAuthorizing(true);
    setError(null);

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession?.access_token) {
        throw new Error("Sessão inválida");
      }

      // Gerar device fingerprint
      const fingerprint = await generateFingerprint();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-authorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authSession.access_token}`,
            "x-device-fingerprint": fingerprint,
            "x-request-origin": window.location.origin,
          },
          body: JSON.stringify({
            lesson_id: lessonId,
            course_id: courseId,
            provider_video_id: videoId,
            provider,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Falha na autorização");
      }

      const videoSession: VideoSession = {
        sessionId: data.sessionId,
        sessionCode: data.sessionCode,
        sessionToken: data.sessionToken,
        embedUrl: data.embedUrl,
        expiresAt: data.expiresAt,
        watermark: data.watermark,
        provider: data.provider,
        drmEnabled: data.drmEnabled,
      };

      setSession(videoSession);
      setIsAuthorized(true);
      setShowThumbnail(false);
      startHeartbeat(videoSession.sessionToken);

      toast.success("🔐 Vídeo autorizado", {
        description: `Sessão: ${videoSession.sessionCode}`,
        duration: 3000,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      onError?.(message);
      toast.error("Falha na autorização", { description: message });
    } finally {
      setIsAuthorizing(false);
    }
  }, [user, videoId, provider, lessonId, courseId, onError]);

  // ============================================
  // HEARTBEAT
  // ============================================
  const startHeartbeat = useCallback((sessionToken: string) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    const sendHeartbeat = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-heartbeat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-session-token": sessionToken,
            },
            body: JSON.stringify({
              session_token: sessionToken,
              position_seconds: getCurrentPosition(),
            }),
          }
        );

        const data = await response.json();

        if (!data.success) {
          handleSessionInvalid(data.error);
        }
      } catch (error) {
        console.warn("Heartbeat failed:", error);
      }
    };

    // Primeiro heartbeat imediato, depois a cada 30s
    sendHeartbeat();
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const handleSessionInvalid = useCallback((reason: string) => {
    stopHeartbeat();
    setSessionRevoked(true);
    setIsAuthorized(false);
    setSecurityMessage("Sua sessão foi encerrada. Recarregue a página para continuar.");
    setShowSecurityAlert(true);
  }, [stopHeartbeat]);

  // ============================================
  // 🛡️ SANCTUM: REPORTAR VIOLAÇÃO (BACKEND DECIDE AÇÃO)
  // REGRA: Frontend envia evento, Backend calcula score e retorna ação
  // Frontend NUNCA toma ação drástica sozinho
  // ============================================
  const reportViolation = useCallback(async (
    type: ViolationType,
    details?: Record<string, unknown>
  ) => {
    // 🛡️ SANCTUM: Usuários imunes não reportam violações
    if (isImmune) {
      console.log('🛡️ SANCTUM: Violação ignorada (usuário imune)', { type, details });
      return;
    }
    
    if (!session?.sessionToken) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-violation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": session.sessionToken,
          },
          body: JSON.stringify({
            session_token: session.sessionToken,
            violation_type: type,
            details: {
              ...details,
              user_role: userRole, // Enviar role para backend validar
              is_immune: isImmune,
            },
            timestamp: new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setRiskScore(data.riskScore || 0);

        // 🛡️ SANCTUM: SOMENTE o backend decide a ação
        // Frontend executa o que o backend manda
        const action = data.instructions?.action || data.action_taken;
        
        switch (action) {
          case 'warn':
            // Apenas log, sem interferir
            console.log('🛡️ SANCTUM: Warning registrado', { type, riskScore: data.riskScore });
            break;
            
          case 'degrade':
            // Degradação leve (blur no overlay, não no vídeo)
            toast.info("Qualidade pode ser afetada", { duration: 3000 });
            break;
            
          case 'pause':
            // Pausar vídeo (ação moderada)
            pauseVideo();
            setSecurityMessage("Atividade incomum detectada. Clique para continuar.");
            setShowSecurityAlert(true);
            break;
            
          case 'reauth':
            // Pedir re-autenticação (sem logout)
            setSecurityMessage("Por favor, confirme sua identidade para continuar.");
            setShowSecurityAlert(true);
            break;
            
          case 'revoke':
            // Apenas em casos extremos e confirmados pelo backend
            if (data.sessionRevoked === true) {
              handleSessionInvalid("SECURITY_VIOLATION");
            }
            break;
            
          default:
            // Nenhuma ação = apenas log
            break;
        }
      }
    } catch (error) {
      // 🛡️ SANCTUM: Falha no report não deve afetar o usuário
      console.warn("🛡️ SANCTUM: Falha ao reportar (ignorado)", error);
    }
  }, [session?.sessionToken, isImmune, userRole, handleSessionInvalid, pauseVideo]);

  // ============================================
  // 🛡️ SANCTUM 2.0 - DETECTORES INTELIGENTES
  // REGRA DE OURO: DETECÇÃO ≠ PUNIÇÃO
  // - Imunes: apenas log, sem ação
  // - Não-imunes: log + score + degradação gradual
  // ============================================
  
  // DevTools detector (SANCTUM Edition)
  useEffect(() => {
    if (!isAuthorized) return;
    
    // 🛡️ SANCTUM: Se imune, não ativar detector
    if (isImmune) {
      console.log('🛡️ SANCTUM: DevTools detector desativado (usuário imune)');
      return;
    }

    const checkDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;

      if (widthDiff || heightDiff) {
        setDevToolsOpen(true);
        
        // 🛡️ SANCTUM: DETECÇÃO ≠ PUNIÇÃO
        // Apenas: log + score + degradação (blur)
        // NÃO: logout, revogação automática
        
        if (!devToolsWarningShownRef.current) {
          devToolsWarningShownRef.current = true;
          
          // Enviar para backend calcular score (não tomar ação drástica)
          reportViolation("devtools_open", { 
            widthDiff: window.outerWidth - window.innerWidth,
            severity: 'MEDIUM', // Backend decide a ação
            action_requested: 'score_only' // Não deslogar
          });
          
          // Degradação: apenas blur leve + aviso (não pausar)
          toast.warning("⚠️ Ferramentas detectadas", {
            description: "O conteúdo pode ficar com qualidade reduzida.",
            duration: 5000,
          });
          
          // Log para console (sem clear, não atrapalha debug legítimo)
          console.warn('🛡️ SANCTUM: DevTools detectado - evento registrado');
        }
      } else {
        setDevToolsOpen(false);
        devToolsWarningShownRef.current = false;
      }
    };

    const interval = setInterval(checkDevTools, 2000); // Menos frequente
    window.addEventListener("resize", checkDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkDevTools);
    };
  }, [isAuthorized, isImmune, reportViolation]);

  // 🛡️ SANCTUM: Keyboard shortcuts (apenas para não-imunes)
  useEffect(() => {
    if (!isAuthorized) return;
    
    // 🛡️ SANCTUM: Se imune, não bloquear atalhos
    if (isImmune) {
      console.log('🛡️ SANCTUM: Bloqueio de atalhos desativado (usuário imune)');
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      // Lista reduzida: apenas atalhos realmente perigosos
      // NÃO bloquear: Ctrl+C (cópia normal), F12 (pode ser legítimo)
      const blocked = (
        (isCtrl && ["s", "p", "u"].includes(key)) || // Salvar, Print, View Source
        (isCtrl && isShift && ["i", "j"].includes(key)) // Inspect, Console
      );

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        
        // 🛡️ SANCTUM: Log + score, sem toast irritante
        reportViolation("keyboard_shortcut", { 
          key: e.key,
          severity: 'LOW',
          action_requested: 'log_only'
        });
        
        return false;
      }
    };

    // Listener apenas no container do player, não global
    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown, true);
    }
    
    return () => {
      if (container) {
        container.removeEventListener("keydown", handleKeyDown, true);
      }
    };
  }, [isAuthorized, isImmune, reportViolation]);

  // 🛡️ SANCTUM: Visibility change (apenas para não-imunes, tolerante)
  useEffect(() => {
    if (!isAuthorized || isImmune) return;

    const handleVisibility = () => {
      if (document.hidden) {
        visibilityCountRef.current++;
        
        // 🛡️ SANCTUM: Threshold alto (30+) para evitar falso positivo
        // Usuário pode trocar de aba normalmente
        if (visibilityCountRef.current >= 30) {
          reportViolation("visibility_abuse", { 
            count: visibilityCountRef.current,
            severity: 'LOW',
            action_requested: 'log_only'
          });
          visibilityCountRef.current = 0; // Reset após log
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isAuthorized, isImmune, reportViolation]);

  // ============================================
  // WATERMARK DINÂMICA (ANO 2300)
  // ============================================
  useEffect(() => {
    if (!session?.watermark) return;

    const moveWatermark = () => {
      const maxX = 70;
      const maxY = 80;
      setWatermarkPosition({
        x: Math.random() * maxX + 5,
        y: Math.random() * maxY + 5,
      });
    };

    // Mover a cada 15-45 segundos (aleatório)
    const randomInterval = () => Math.random() * 30000 + 15000;
    
    let timeout: NodeJS.Timeout;
    const scheduleMove = () => {
      timeout = setTimeout(() => {
        moveWatermark();
        scheduleMove();
      }, randomInterval());
    };

    moveWatermark();
    scheduleMove();

    return () => clearTimeout(timeout);
  }, [session?.watermark]);

  // ============================================
  // CONTROLES DO PLAYER
  // ============================================
  const handlePlay = useCallback(() => {
    if (showThumbnail && !isAuthorized) {
      authorize();
      return;
    }

    if (devToolsOpen) {
      toast.error("Feche o DevTools primeiro");
      return;
    }

    setIsPlaying(true);
  }, [showThumbnail, isAuthorized, devToolsOpen, authorize]);

  const pauseVideo = useCallback(() => {
    setIsPlaying(false);
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
          "*"
        );
      } catch (e) {}
    }
  }, []);

  const handleSpeedChange = (speed: number) => {
    setCurrentSpeed(speed);
    toast.success(`Velocidade: ${speed}x`);
  };

  const handleQualityChange = (quality: string) => {
    setCurrentQuality(quality);
    toast.success(`Qualidade: ${quality}`);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  // Auto-hide controls
  useEffect(() => {
    if (!isAuthorized) return;

    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("touchstart", handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("touchstart", handleMouseMove);
      }
      clearTimeout(timeout);
    };
  }, [isAuthorized]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div 
      ref={containerRef}
      className={cn(
        "ultra-fortress-player relative rounded-xl overflow-hidden bg-black group",
        className
      )}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onContextMenu={(e) => {
        // 🛡️ SANCTUM: Imunes podem usar menu de contexto
        if (isImmune) return;
        e.preventDefault();
        reportViolation("context_menu", { severity: 'LOW', action_requested: 'log_only' });
      }}
      onDragStart={(e) => {
        if (isImmune) return;
        e.preventDefault();
        reportViolation("drag_attempt", { severity: 'LOW', action_requested: 'log_only' });
      }}
      onCopy={(e) => {
        // 🛡️ SANCTUM: Cópia é permitida (pode ser legítima)
        // Apenas log, sem bloquear
        if (!isImmune) {
          reportViolation("copy_attempt", { severity: 'LOW', action_requested: 'log_only' });
        }
      }}
    >
      {/* Aspect Ratio Container */}
      <div className="aspect-video relative">
        
        {/* ════════════════════════════════════════════
            ESTADO: THUMBNAIL (antes de autorizar)
            ════════════════════════════════════════════ */}
        {showThumbnail && (
          <div className="absolute inset-0 cursor-pointer z-10" onClick={handlePlay}>
            {thumbnailUrl && (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black animate-pulse" />
                )}
                <img
                  src={thumbnailUrl}
                  alt={title}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-500",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                />
              </>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
            
            {/* Play Button Futurista */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center shadow-2xl",
                  "bg-gradient-to-br from-red-600 via-red-500 to-orange-500",
                  "hover:from-red-500 hover:via-red-400 hover:to-orange-400",
                  "ring-4 ring-white/20 ring-offset-4 ring-offset-black/50"
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                disabled={isAuthorizing}
              >
                {isAuthorizing ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : (
                  <Play className="w-10 h-10 text-white ml-1" fill="white" />
                )}
              </motion.button>
            </div>

            {/* Badge de Proteção */}
            <motion.div
              className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-green-500/30"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-400 font-bold tracking-wide">
                FORTALEZA ULTRA
              </span>
              <Lock className="w-3 h-3 text-green-500 animate-pulse" />
            </motion.div>

            {/* Título */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
              <h3 className="text-white font-bold text-lg md:text-xl">{title}</h3>
              <p className="text-white/60 text-sm mt-1">Clique para assistir com segurança</p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            ESTADO: ERRO
            ════════════════════════════════════════════ */}
        {error && !isAuthorized && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="text-center p-8">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-white text-xl font-bold mb-2">Acesso Negado</h3>
              <p className="text-white/60 mb-6">{error}</p>
              <Button 
                onClick={authorize} 
                className="bg-red-600 hover:bg-red-700"
                disabled={isAuthorizing}
              >
                {isAuthorizing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            ESTADO: PLAYER ATIVO
            ════════════════════════════════════════════ */}
        {isAuthorized && session && !showThumbnail && (
          <>
            {/* Iframe do Player */}
            <iframe
              ref={iframeRef}
              src={session.embedUrl}
              className="absolute inset-0 w-full h-full z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
              onLoad={() => setIsLoading(false)}
            />

            {/* Loading Overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black/80 z-30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
                    <p className="text-white/60 text-sm">Carregando vídeo protegido...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ════════════════════════════════════════════
                WATERMARK DINÂMICA ULTRA (ANO 2300)
                ════════════════════════════════════════════ */}
            {session.watermark && (
              <>
                {/* Watermark Principal - Move */}
                <motion.div
                  className="absolute z-50 pointer-events-none select-none"
                  animate={{
                    left: `${watermarkPosition.x}%`,
                    top: `${watermarkPosition.y}%`,
                  }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                >
                  <div className="flex flex-col items-start gap-0.5 transform -rotate-3">
                    <span 
                      className="font-mono tracking-[0.15em] text-[11px] sm:text-sm whitespace-nowrap"
                      style={{
                        color: "rgba(255, 255, 255, 0.12)",
                        textShadow: "0 0 3px rgba(0,0,0,0.5)",
                      }}
                    >
                      {session.watermark.text}
                    </span>
                  </div>
                </motion.div>

                {/* Watermark Secundária - Centro */}
                <motion.div
                  className="absolute z-50 pointer-events-none select-none"
                  style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
                  animate={{
                    opacity: [0.05, 0.1, 0.05],
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ duration: 20, repeat: Infinity }}
                >
                  <span 
                    className="font-mono tracking-[0.4em] text-base sm:text-lg whitespace-nowrap"
                    style={{ color: "rgba(255, 255, 255, 0.06)" }}
                  >
                    {session.sessionCode}
                  </span>
                </motion.div>

                {/* Watermark Terciária - Timestamp */}
                <motion.div
                  className="absolute bottom-20 right-4 z-50 pointer-events-none select-none"
                  animate={{
                    x: [-10, 10, -10],
                    opacity: [0.08, 0.12, 0.08],
                  }}
                  transition={{ duration: 30, repeat: Infinity }}
                >
                  <span 
                    className="font-mono text-[9px] whitespace-nowrap"
                    style={{ color: "rgba(255, 255, 255, 0.1)" }}
                  >
                    {session.watermark.text} • {new Date().toLocaleTimeString('pt-BR')}
                  </span>
                </motion.div>
              </>
            )}

            {/* ════════════════════════════════════════════
                ESCUDOS DE PROTEÇÃO (CSS SHIELDS)
                ════════════════════════════════════════════ */}
            
            {/* Escudo Superior */}
            <div
              className="absolute top-0 left-0 right-0 h-16 z-40 cursor-default"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Escudo Inferior */}
            <div
              className="absolute bottom-0 left-0 right-0 h-20 z-40 cursor-default"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Escudos Laterais */}
            <div className="absolute top-0 bottom-0 left-0 w-20 z-40 cursor-default" />
            <div className="absolute top-0 bottom-0 right-0 w-20 z-40 cursor-default" />

            {/* ════════════════════════════════════════════
                CONTROLES CUSTOMIZADOS
                ════════════════════════════════════════════ */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  className="absolute inset-0 z-50 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Gradient overlays */}
                  <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

                  {/* Top Bar */}
                  <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-green-500/30">
                        <Zap className="w-3 h-3 text-green-500" />
                        <span className="text-[10px] text-green-400 font-bold">
                          {session.sessionCode}
                        </span>
                      </div>
                      {session.drmEnabled && (
                        <div className="px-2 py-1 rounded bg-blue-500/20 border border-blue-500/30">
                          <span className="text-[10px] text-blue-400 font-bold">DRM</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-white/60 truncate max-w-[200px]">{title}</span>
                  </div>

                  {/* Bottom Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto">
                    {/* Left */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </button>

                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                            <Settings className="w-5 h-5 text-white" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-48 bg-black/95 backdrop-blur-md border-white/10"
                        >
                          <DropdownMenuLabel className="text-white/60 text-xs">
                            Velocidade
                          </DropdownMenuLabel>
                          {PLAYBACK_SPEEDS.map((speed) => (
                            <DropdownMenuItem
                              key={speed.value}
                              onClick={() => handleSpeedChange(speed.value)}
                              className={cn(
                                "text-white/80 hover:text-white cursor-pointer",
                                currentSpeed === speed.value && "bg-white/10"
                              )}
                            >
                              {speed.label}
                              {currentSpeed === speed.value && " ✓"}
                            </DropdownMenuItem>
                          ))}

                          <DropdownMenuSeparator className="bg-white/10" />

                          <DropdownMenuLabel className="text-white/60 text-xs">
                            Qualidade
                          </DropdownMenuLabel>
                          {VIDEO_QUALITIES.map((q) => (
                            <DropdownMenuItem
                              key={q.value}
                              onClick={() => handleQualityChange(q.value)}
                              className={cn(
                                "text-white/80 hover:text-white cursor-pointer",
                                currentQuality === q.value && "bg-white/10"
                              )}
                            >
                              {q.label}
                              {currentQuality === q.value && " ✓"}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <button
                        onClick={handleFullscreen}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <Maximize className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ════════════════════════════════════════════
            🛡️ SANCTUM: OVERLAY DE DEVTOOLS (DEGRADAÇÃO LEVE)
            - Imunes: sem overlay
            - Não-imunes: apenas blur leve, NÃO bloqueia
            ════════════════════════════════════════════ */}
        <AnimatePresence>
          {devToolsOpen && isAuthorized && !isImmune && (
            <motion.div
              className="absolute inset-0 z-[100] pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* 🛡️ SANCTUM: Apenas blur leve + badge, vídeo continua */}
              <div className="absolute inset-0 backdrop-blur-[2px]" />
              
              {/* Badge de aviso no topo */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-yellow-500/90 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-black" />
                  <span className="text-black text-sm font-medium">
                    Qualidade reduzida - feche DevTools
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════════
          ALERT DIALOG DE SEGURANÇA
          ════════════════════════════════════════════ */}
      <AlertDialog open={showSecurityAlert} onOpenChange={setShowSecurityAlert}>
        <AlertDialogContent className="bg-black/95 border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Alerta de Segurança
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {securityMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {sessionRevoked ? (
              <AlertDialogAction
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar Página
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={() => setShowSecurityAlert(false)}
                className="bg-primary hover:bg-primary/90"
              >
                Entendido
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ════════════════════════════════════════════
          ESTILOS CSS DE PROTEÇÃO
          ════════════════════════════════════════════ */}
      <style>{`
        .ultra-fortress-player {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        .ultra-fortress-player * {
          -webkit-user-drag: none;
          user-drag: none;
        }
        .ultra-fortress-player iframe {
          pointer-events: auto;
        }
        /* Bloquear PiP */
        .ultra-fortress-player video::-webkit-media-controls-picture-in-picture-button {
          display: none !important;
        }
      `}</style>
    </div>
  );
});

UltraFortressPlayer.displayName = "UltraFortressPlayer";

// ============================================
// UTILITÁRIOS
// ============================================
async function generateFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.maxTouchPoints || 0,
  ];

  const text = components.join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function getCurrentPosition(): number {
  const video = document.querySelector("video");
  return video ? Math.floor(video.currentTime) : 0;
}

export default UltraFortressPlayer;
