// ============================================
// 🔥 OMEGA FORTRESS PLAYER v3.0 - ULTRA SECURED
// Sistema de Proteção de Vídeos MÁXIMO
// 7 CAMADAS DE PROTEÇÃO + SANCTUM 2.0
// Design 2300 - Futurista
// ============================================

import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Settings, Loader2, Volume2, VolumeX, 
  Maximize, Shield, Lock, AlertTriangle, Eye, Zap,
  ChevronRight, ShieldCheck
} from "lucide-react";

// 🆕 DISCLAIMER: Imagem de fallback local (usada se não tiver overlay configurado)
import disclaimerImageFallback from "@/assets/disclaimer_nobotao.png";
import { cn } from "@/lib/utils";
import { getPandaEmbedUrl } from "@/lib/video/panda";
import { useVideoFortress, VideoViolationType, ViolationAction } from "@/hooks/useVideoFortress";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useDeviceConstitution } from "@/hooks/useDeviceConstitution";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useVideoOverlay } from "@/components/gestao/videoaulas/VideoOverlayConfigDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Importar componentes de capítulos
import { ChapterMarkers } from './ChapterMarkers';
import { ChapterSidebar } from './ChapterSidebar';
import { useVideoChapters } from '@/hooks/useVideoChapters';

// ============================================
// TIPOS
// ============================================
export interface OmegaFortressPlayerProps {
  videoId: string;
  type?: "youtube" | "panda" | "vimeo";
  title?: string;
  thumbnail?: string;
  className?: string;
  autoplay?: boolean;
  lessonId?: string;
  courseId?: string;
  showSecurityBadge?: boolean;
  showWatermark?: boolean;
  showRiskIndicator?: boolean;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}

// Velocidades e qualidades (v7.0 - PLAYER-CONTROLS)
// 🎯 Velocidades: 0.25x até 2x conforme especificado
const PLAYBACK_SPEEDS = [
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "Normal", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "1.75x", value: 1.75 },
  { label: "2x", value: 2 },
];

// 🎯 Qualidades: Mínimo 720p (480p removido para proteção de conteúdo)
const VIDEO_QUALITIES = [
  { label: "Auto (1080p)", value: "auto" },
  { label: "4K", value: "hd2160" },
  { label: "1080p HD", value: "hd1080" },
  { label: "720p", value: "hd720" },
  // 480p removido conforme especificação - qualidade mínima é 720p
];

// Parâmetros FORTRESS para YouTube
const FORTRESS_YT_PARAMS = {
  rel: "0",
  modestbranding: "1",
  showinfo: "0",
  iv_load_policy: "3",
  disablekb: "1",
  fs: "1",
  playsinline: "1",
  vq: "hd1080",
  enablejsapi: "1",
  origin: typeof window !== 'undefined' ? window.location.origin : '',
  cc_load_policy: "0",
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const OmegaFortressPlayer = memo(({
  videoId,
  type = "youtube",
  title = "Aula Protegida",
  thumbnail,
  className = "",
  autoplay = false,
  lessonId,
  courseId,
  showSecurityBadge = true,
  showWatermark = true,
  showRiskIndicator = false,
  onComplete,
  onProgress,
  onError,
}: OmegaFortressPlayerProps) => {
  // ============================================
  // 🛡️ VALIDAÇÃO P0: videoId OBRIGATÓRIO
  // Se videoId for vazio/undefined/null, exibir fallback
  // Evita erros "embed/undefined" no Panda/YouTube
  // ============================================
  const isValidVideoId = Boolean(videoId && videoId.trim() !== '' && videoId !== 'undefined' && videoId !== 'null');
  
  const { user } = useAuth();
  const { isOwner, isAdmin, isBeta, roleLabel, isFuncionarioOrAbove } = useRolePermissions();
  const { isMobile, isTouch } = useDeviceConstitution();
  
  // 🆕 OVERLAY: Busca URL da imagem configurada pelo admin
  const { data: overlayImageUrl } = useVideoOverlay();
  // Imagem final: usa do banco se existir, senão fallback local
  const disclaimerImage = overlayImageUrl || disclaimerImageFallback;
  
  // Verificar imunidade
  const isImmuneUser = isOwner || isAdmin || isFuncionarioOrAbove;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const pandaIframeRef = useRef<HTMLIFrameElement>(null); // 🎯 Ref para iframe Panda (postMessage)
  
  // 🛡️ YOUTUBE HOTFIX v10.0 - Single-Call Guard para evitar chamadas múltiplas
  const sessionStartedRef = useRef(false);
  
  // 🚀 PATCH 5K: Ref para timeout de violação (cleanup no unmount)
  const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Estados
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showThumbnail, setShowThumbnail] = useState(!autoplay);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [currentQuality, setCurrentQuality] = useState("hd1080");
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // 🎯 PART 2: Estados para barra de progresso
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // 🆕 DISCLAIMER OVERLAY - Exibe aviso legal por 3 segundos antes do vídeo
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerCompleted, setDisclaimerCompleted] = useState(false);
  const [violationWarning, setViolationWarning] = useState<string | null>(null);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  
  // 🎯 QUALITY ENFORCEMENT: Estado para erro de qualidade mínima (720p)
  const [qualityError, setQualityError] = useState<string | null>(null);
  
  // Estado para sidebar de capítulos
  const [chapterSidebarOpen, setChapterSidebarOpen] = useState(false);
  
  // 🔥 PART 3: SEGURANÇA MÁXIMA - Overlay de violação com tela preta
  const [securityViolation, setSecurityViolation] = useState<{
    active: boolean;
    message: string;
  }>({ active: false, message: '' });

  // Panda DRM: src assinada (token + expires). Sem isso, o player do Panda falha quando DRM via API está ativo.
  const [pandaSignedSrc, setPandaSignedSrc] = useState<string | null>(null);

  // Hook para buscar capítulos (Panda Video e YouTube)
  const { 
    chapters, 
    hasChapters, 
    is2025Course 
  } = useVideoChapters(
    videoId,
    title,
    type === 'youtube' ? 'youtube' : 'panda'
  );

  // 🔥 P0 FIX: Calcular duration estimada a partir dos capítulos
  // Panda Video NÃO envia duration no evento panda_timeupdate, apenas currentTime
  // Solução: usar o timestamp do último capítulo + margem de 30 minutos
  const estimatedDurationFromChapters = useMemo(() => {
    if (!chapters || chapters.length === 0) return 0;
    const lastChapterTime = Math.max(...chapters.map(c => c.seconds));
    // Adicionar 30 minutos (1800 segundos) como margem após o último capítulo
    return lastChapterTime + 1800;
  }, [chapters]);

  const extractPandaVideoId = useCallback((raw: string): string => {
    // Aceita UUID puro
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) return raw;

    // Aceita URL de embed do Panda (ou qualquer URL com query v=)
    try {
      const u = new URL(raw);
      const v = u.searchParams.get('v');
      if (v) return v;
    } catch {
      // ignore
    }

    // Fallback: regex simples
    const m = raw.match(/[?&]v=([a-zA-Z0-9-]+)/);
    return m?.[1] || raw;
  }, []);

  // Hook de proteção FORTRESS
  const {
    session,
    isLoading: sessionLoading,
    error: sessionError,
    isActive,
    startSession,
    endSession,
    reportViolation,
    sendHeartbeat,
    watermarkData,
    riskScore,
    riskLevel,
    isImmune,
    protectionStats,
  } = useVideoFortress({
    videoId,
    lessonId,
    courseId,
    provider: type,
    enableHeartbeat: true,
    // ⚠️ OWNER PARTICIPARÁ DE TODAS AS REGRAS - Sem bypass para proteções
    enableViolationDetection: true,
    enableAntiDevTools: true,
    enableAntiScreenshot: true,
    onSessionRevoked: () => {
      setIsPlaying(false);
      setViolationWarning('Sessão encerrada em outro dispositivo');
    },
    onSessionExpired: () => {
      setIsPlaying(false);
      toast.info('Sessão expirada. Recarregue para continuar.');
    },
    onViolation: handleViolation,
    onRiskLevelChange: (level) => {
      if (level === 'critical') {
        toast.error('🚨 Risco crítico detectado!');
      }
    },
  });

  // Patch: se a sessão falhar, nunca deixar o player preso em "Iniciando sessão segura..."
  useEffect(() => {
    if (sessionError) {
      setIsLoading(false);
    }
  }, [sessionError]);

  // 🚀 PATCH 5K: Cleanup do timeout de violação no unmount
  useEffect(() => {
    return () => {
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
        violationTimeoutRef.current = null;
      }
    };
  }, []);
  // 🔥 PART 3: SEGURANÇA MÁXIMA - Detecção de violações e overlay de tela preta
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Função para mostrar overlay de violação (pausa vídeo + tela preta)
  const showSecurityViolationOverlay = useCallback((message: string) => {
    // Owner bypass para não travar testes
    if (isImmuneUser) {
      console.log('[OmegaFortress] 🛡️ Owner/Admin bypass - violação detectada mas não bloqueada:', message);
      return;
    }
    
    // Pausar o vídeo
    pauseVideo();
    setIsPlaying(false);
    
    // Mostrar overlay de violação
    setSecurityViolation({ active: true, message });
    
    // Reportar violação para o backend (usando tipo válido)
    reportViolation('keyboard_shortcut', 10);
    
    // 🚀 PATCH 5K: Limpar timeout anterior antes de criar novo
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current);
    }
    
    // Auto-hide após 5 segundos - armazenar em ref para cleanup
    violationTimeoutRef.current = setTimeout(() => {
      setSecurityViolation({ active: false, message: '' });
      violationTimeoutRef.current = null;
    }, 5000);
  }, [isImmuneUser, reportViolation]);
  
  // Detecção de teclas de segurança (F12, PrintScreen, Ctrl+Shift+I, etc.)
  useEffect(() => {
    if (!session || showThumbnail) return; // Só ativa quando vídeo está tocando
    
    const handleSecurityKeydown = (e: KeyboardEvent) => {
      // Owner bypass
      if (isImmuneUser) return;
      
      const key = e.key?.toUpperCase() || '';
      
      // F12 (DevTools)
      if (key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityViolationOverlay('Ferramentas de desenvolvedor detectadas');
        return;
      }
      
      // PrintScreen (todas as variações)
      if (['PRINTSCREEN', 'PRTSC', 'PRTSCN', 'PRINT', 'SNAPSHOT'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityViolationOverlay('Captura de tela detectada');
        return;
      }
      
      // Ctrl+Shift+I/J/C (DevTools)
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityViolationOverlay('Ferramentas de desenvolvedor detectadas');
        return;
      }
      
      // Ctrl+P (Print)
      if (e.ctrlKey && key === 'P') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityViolationOverlay('Impressão bloqueada');
        return;
      }
      
      // Ctrl+S (Save)
      if (e.ctrlKey && key === 'S') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityViolationOverlay('Download bloqueado');
        return;
      }
      
      // Windows+Shift+S (Snipping Tool)
      if (e.shiftKey && (e.metaKey || e.getModifierState?.('Meta')) && key === 'S') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityViolationOverlay('Ferramenta de captura detectada');
        return;
      }
      
      // Mac: Cmd+Shift+3/4/5 (Screenshots)
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityViolationOverlay('Captura de tela detectada');
        return;
      }
    };
    
    // Detecção de clique direito
    const handleContextMenu = (e: MouseEvent) => {
      if (isImmuneUser) return;
      e.preventDefault();
      showSecurityViolationOverlay('Menu de contexto bloqueado');
    };
    
    // ═══════════════════════════════════════════════════════════════════
    // 🛡️ DETECÇÃO DE BLUR ANTI-FALSO-POSITIVO v2.0
    // ═══════════════════════════════════════════════════════════════════
    // PROBLEMA: Quando o iframe do vídeo carrega, ele rouba o foco da
    // janela principal, disparando 'blur' ANTES do usuário interagir.
    // SOLUÇÃO: Grace period + debounce + detecção de iframe focus
    // ═══════════════════════════════════════════════════════════════════
    
    let blurDebounceTimer: NodeJS.Timeout | null = null;
    let videoStartGracePeriod = true; // Grace period inicial de 3s
    
    // Desativar grace period após 3 segundos do mount
    const graceTimeout = setTimeout(() => {
      videoStartGracePeriod = false;
      console.log('[OMEGA] ✅ Grace period de blur expirado - monitoramento ativo');
    }, 3000);
    
    const handleWindowBlur = () => {
      if (isImmuneUser) return;
      if (!isPlaying) return; // Só monitora se estiver tocando
      if (videoStartGracePeriod) {
        console.log('[OMEGA] ⏳ Blur ignorado - dentro do grace period inicial');
        return;
      }
      
      // Verificar se o foco foi para o iframe do vídeo (não é violação)
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'IFRAME') {
        console.log('[OMEGA] 🎬 Blur ignorado - foco transferido para iframe do vídeo');
        return;
      }
      
      // Debounce de 800ms - se o foco retornar rapidamente, cancela
      if (blurDebounceTimer) {
        clearTimeout(blurDebounceTimer);
      }
      
      blurDebounceTimer = setTimeout(() => {
        // Verificar novamente após debounce
        if (document.hasFocus()) {
          console.log('[OMEGA] ✅ Blur cancelado - foco retornou');
          return;
        }
        
        // Verificar se iframe ainda está focado
        const currentActive = document.activeElement;
        if (currentActive?.tagName === 'IFRAME') {
          console.log('[OMEGA] 🎬 Blur pós-debounce ignorado - iframe focado');
          return;
        }
        
        // Violação real detectada
        console.warn('[OMEGA] 🚨 Violação de blur confirmada após debounce');
        pauseVideo();
        setIsPlaying(false);
        showSecurityViolationOverlay('Janela perdeu foco - possível tentativa de captura');
      }, 800);
    };
    
    // Cancelar debounce quando foco retorna
    const handleWindowFocus = () => {
      if (blurDebounceTimer) {
        clearTimeout(blurDebounceTimer);
        blurDebounceTimer = null;
        console.log('[OMEGA] ✅ Focus retornou - debounce cancelado');
      }
    };
    
    // Adicionar listeners
    document.addEventListener('keydown', handleSecurityKeydown, { capture: true });
    containerRef.current?.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('keydown', handleSecurityKeydown, { capture: true });
      containerRef.current?.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      clearTimeout(graceTimeout);
      if (blurDebounceTimer) clearTimeout(blurDebounceTimer);
    };
  }, [session, showThumbnail, isImmuneUser, isPlaying, showSecurityViolationOverlay]);

  // Handler de violações
  function handleViolation(violationType: VideoViolationType, action: ViolationAction) {
    if (action === 'pause' || action === 'revoke') {
      setIsPlaying(false);
      pauseVideo();
    }
    if (action === 'warn') {
      setViolationWarning('Atividade suspeita detectada');
      setTimeout(() => setViolationWarning(null), 5000);
    }
  }

  // 🎯 Função para pular para capítulo - suporta YouTube API e Panda postMessage
  const seekToChapter = useCallback((seconds: number) => {
    console.log('[OMEGA] 🎯 Seek solicitado para:', seconds, 'segundos | Provider:', type);
    
    if (type === 'panda' && pandaIframeRef.current?.contentWindow) {
      // 🐼 PANDA VIDEO: usar postMessage API
      // Observação: há variações na API; enviamos ambos eventos (seek + currentTime) por compatibilidade.
      const pandaWindow = pandaIframeRef.current.contentWindow;

      // 1) Evento canônico (compatibilidade com players atuais)
      pandaWindow.postMessage({ type: 'seek', parameter: seconds }, '*');
      // 2) Fallback legado (alguns embeds aceitam currentTime)
      pandaWindow.postMessage({ type: 'currentTime', parameter: seconds }, '*');

      console.log('[OMEGA] ✅ postMessage seek/currentTime enviado para Panda:', seconds);

      // Garantir que o vídeo continue reproduzindo após o seek
      setTimeout(() => {
        pandaWindow.postMessage({ type: 'play' }, '*');
        console.log('[OMEGA] ✅ Comando play enviado após seek');
      }, 100);

    } else if (type === 'youtube' && playerRef.current?.seekTo) {
      // ▶️ YOUTUBE: usar seekTo da API
      playerRef.current.seekTo(seconds, true);
      console.log('[OMEGA] ✅ seekTo executado no YouTube:', seconds);
      
    } else if (playerRef.current) {
      // 🔄 FALLBACK: tentar currentTime diretamente
      playerRef.current.currentTime = seconds;
      if (playerRef.current.paused) {
        playerRef.current.play();
      }
      console.log('[OMEGA] ⚠️ Fallback currentTime usado:', seconds);
      
    } else {
      console.warn('[OMEGA] ❌ Nenhum player disponível para seek');
    }
  }, [type]);

  // URLs
  const thumbnailUrl = useMemo(() => {
    if (thumbnail) return thumbnail;
    if (type === "youtube") return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    return null;
  }, [thumbnail, type, videoId]);

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({
      ...FORTRESS_YT_PARAMS,
      autoplay: autoplay ? "1" : "0",
    }).toString();

    switch (type) {
      case "youtube":
        return `https://www.youtube.com/embed/${videoId}?${params}`;
      case "panda": {
        // PATCH P0: se vier embed completo (Excel/legado), usar direto.
        // Se vier UUID, gerar embed canônico.
        if (/^https?:\/\//i.test(videoId)) return videoId;
        return getPandaEmbedUrl(videoId);
      }
      case "vimeo":
        return `https://player.vimeo.com/video/${videoId}?dnt=1&title=0&byline=0&portrait=0`;
      default:
        return "";
    }
  }, [type, videoId, autoplay]);

  // Panda DRM: sempre buscar URL assinada quando for Panda e o player estiver ativo.
  // Sem essa etapa, o embed sem token resulta em "This video encountered an error".
  useEffect(() => {
    if (type !== 'panda') {
      setPandaSignedSrc(null);
      return;
    }

    if (showThumbnail) return; // só quando o usuário iniciou o player

    let cancelled = false;
    const run = async () => {
      try {
        setIsLoading(true);
        setPandaSignedSrc(null);

        // Preferir lessonId (faz check de acesso + logs + watermark no backend)
        if (lessonId) {
          const { data, error } = await supabase.functions.invoke('get-panda-signed-url', {
            body: { lessonId },
          });
          if (error) throw error;
          if (!data?.signedUrl) throw new Error('signedUrl ausente');
          if (!cancelled) setPandaSignedSrc(String(data.signedUrl));
          return;
        }

        // Fallback: assinar por videoId
        const vId = extractPandaVideoId(videoId);
        const { data, error } = await supabase.functions.invoke('secure-video-url', {
          body: { action: 'get_panda_url', videoId: vId },
        });
        if (error) throw error;
        if (!data?.videoUrl) throw new Error('videoUrl ausente');
        if (!cancelled) setPandaSignedSrc(String(data.videoUrl));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao obter URL DRM do Panda';
        console.error('[OmegaFortressPlayer] Panda DRM URL error:', e);
        toast.error('Erro ao carregar vídeo', { description: msg });
        onError?.(msg);
        if (!cancelled) setPandaSignedSrc(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [type, showThumbnail, lessonId, videoId, extractPandaVideoId, onError]);

  // ============================================
  // INICIALIZAÇÃO - 🛡️ YOUTUBE HOTFIX v10.1 FINAL
  // CORREÇÃO DEFINITIVA: Usar ref estável para startSession
  // O problema era: startSession nas dependências + reset do guard
  // ============================================
  
  // Ref estável para startSession (não causa re-render)
  const startSessionRef = useRef(startSession);
  startSessionRef.current = startSession;
  
  // Ref para o videoId anterior (detectar mudança real)
  const prevVideoIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Detectar se é um NOVO vídeo (reset legítimo do guard)
    const isNewVideo = prevVideoIdRef.current !== null && prevVideoIdRef.current !== videoId;
    
    if (isNewVideo) {
      console.log('[OmegaFortress] 🔄 Novo vídeo detectado, resetando guard');
      sessionStartedRef.current = false;
    }
    
    prevVideoIdRef.current = videoId;
    
    // 🔒 Guard: só executa UMA VEZ por vídeo
    if (sessionStartedRef.current) {
      console.log('[OmegaFortress] ⏸️ startSession já foi chamado para este vídeo, ignorando...');
      return;
    }
    
    if (user && !session && !sessionLoading) {
      // 🔐 Trava IMEDIATAMENTE - antes de qualquer await
      sessionStartedRef.current = true;
      console.log('[OmegaFortress] 🚀 Iniciando sessão (chamada única garantida)...');
      
      // Usar ref estável para evitar dependência de startSession
      startSessionRef.current().then((ok) => {
        if (!ok) {
          setIsLoading(false);
          console.log('[OmegaFortress] ❌ Sessão falhou, retry manual disponível');
        } else {
          console.log('[OmegaFortress] ✅ Sessão criada com sucesso!');
        }
      }).catch((err) => {
        console.error('[OmegaFortress] ❌ Erro ao criar sessão:', err);
        setIsLoading(false);
      });
    }
    // ⚠️ CRÍTICO: NÃO incluir startSession nas dependências!
    // Usamos startSessionRef para ter versão estável
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session, sessionLoading, videoId]);

  // YouTube IFrame API
  useEffect(() => {
    if (type !== "youtube" || showThumbnail || !session) return;

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return;
      }

      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }

      window.onYouTubeIframeAPIReady = initPlayer;
    };

    const initPlayer = () => {
      if (playerRef.current || !containerRef.current) return;

      const playerId = `omega-player-${videoId}-${Date.now()}`;
      const container = containerRef.current.querySelector('.player-container');
      if (!container) return;

      const playerDiv = document.createElement("div");
      playerDiv.id = playerId;
      playerDiv.className = "w-full h-full";
      container.innerHTML = '';
      container.appendChild(playerDiv);

      playerRef.current = new window.YT.Player(playerId, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { ...FORTRESS_YT_PARAMS, controls: 0, autoplay: autoplay ? 1 : 0 },
        events: {
          onReady: (e: any) => {
            // 🔥 FIX v15.0: Salvar a referência REAL do player (e.target) para que
            // setPlaybackRate funcione corretamente nos controles customizados
            const player = e.target;
            playerRef.current = player; // CRÍTICO: sobrescrever com player funcional
            console.log('[OmegaFortress] 🎬 Player YouTube pronto, ref atualizada');
            
            setIsLoading(false);
            
            // 🎯 QUALITY ENFORCEMENT v14.0: Forçar 1080p com fallback para 720p
            const availableQualities = player.getAvailableQualityLevels?.() || [];
            console.log('[OmegaFortress] Qualidades disponíveis:', availableQualities);
            
            // Verificar se tem pelo menos 720p disponível
            const has1080p = availableQualities.includes('hd1080');
            const has720p = availableQualities.includes('hd720');
            const hasMinimumQuality = has1080p || has720p;
            
            if (!hasMinimumQuality && availableQualities.length > 0) {
              // Qualidade mínima não disponível - bloquear reprodução
              console.warn('[OmegaFortress] ⚠️ Qualidade mínima (720p) não disponível!');
              player.pauseVideo?.();
              setQualityError('Este vídeo não está disponível na qualidade mínima exigida (720p). Por favor, tente novamente mais tarde ou entre em contato com o suporte.');
              return;
            }
            
            // Forçar melhor qualidade disponível (1080p > 720p)
            if (has1080p) {
              player.setPlaybackQuality('hd1080');
              setCurrentQuality('hd1080');
              console.log('[OmegaFortress] ✅ Qualidade forçada: 1080p');
            } else if (has720p) {
              player.setPlaybackQuality('hd720');
              setCurrentQuality('hd720');
              console.log('[OmegaFortress] ✅ Qualidade forçada: 720p (fallback)');
            }
            
            // 🎬 AUTOPLAY AUTOMÁTICO após disclaimer/load
            // Sempre iniciar vídeo automaticamente quando o player estiver pronto
            // (o disclaimer de 3s já foi mostrado antes de chegar aqui)
            console.log('[OmegaFortress] 🎬 Iniciando vídeo automaticamente após disclaimer');
            player.playVideo();
            setIsPlaying(true);
          },
          onStateChange: (e: any) => {
            switch (e.data) {
              case 1: setIsPlaying(true); setIsLoading(false); break;
              case 2: setIsPlaying(false); break;
              case 0: 
                setIsPlaying(false); 
                onComplete?.(); 
                endSession(); 
                break;
              case 3: setIsLoading(true); break;
            }
          },
          onError: (e: any) => {
            onError?.(`YouTube Error: ${e.data}`);
          },
        },
      });
    };

    loadYouTubeAPI();

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, type, showThumbnail, autoplay, session, onComplete, endSession, currentQuality, onError]);

  // 🎯 PART 2: Progress tracking aprimorado com atualização em tempo real
  // YouTube: via API polling (getCurrentTime/getDuration)
  // FIX: não depender de playerRef no array de deps (ref não dispara re-render).
  // Mantém um intervalo que “espera” o player ficar pronto e então atualiza currentTime/duration.
  useEffect(() => {
    if (type !== 'youtube') return;
    if (showThumbnail) return;
    if (!session) return;

    const progressInterval = window.setInterval(() => {
      const p = playerRef.current;
      if (p?.getCurrentTime && p?.getDuration) {
        const current = Number(p.getCurrentTime?.() ?? 0) || 0;
        const dur = Number(p.getDuration?.() ?? 0) || 0;
        setCurrentTime(current);
        if (dur > 0) setDuration(dur);
      }
    }, 250); // 4x por segundo para barra suave

    return () => window.clearInterval(progressInterval);
  }, [type, showThumbnail, session]);

  // 🔥 P0 FIX: Definir duration estimada quando capítulos carregarem (Panda não envia duration!)
  useEffect(() => {
    if (type !== 'panda') return;
    if (estimatedDurationFromChapters > 0 && duration === 0) {
      console.log('[OMEGA][PANDA] ⏱️ Usando duration estimada dos capítulos:', estimatedDurationFromChapters);
      setDuration(estimatedDurationFromChapters);
    }
  }, [type, estimatedDurationFromChapters, duration]);

  // Panda: via postMessage events (panda_timeupdate / panda_info)
  useEffect(() => {
    if (type !== 'panda') return;
    if (showThumbnail) return;

    const handlePandaMessage = (event: MessageEvent) => {
      // Aceitar apenas mensagens do Panda
      const origin = String(event.origin || '');
      if (!origin.includes('pandavideo')) return;

      let data: any = event.data;
      try {
        // Alguns ambientes enviam JSON stringificado
        if (typeof data === 'string') data = JSON.parse(data);
      } catch {
        // ignore parse errors
      }

      const msg = data?.message;
      if (typeof msg !== 'string' || !msg.startsWith('panda_')) return;

      // 🎯 Atualizar currentTime sempre
      const maybeCurrent = Number(data?.currentTime);
      if (Number.isFinite(maybeCurrent) && maybeCurrent >= 0) {
        setCurrentTime(maybeCurrent);
        
        // 🔥 P0 FIX: Se currentTime ultrapassa duration, ajustar dinamicamente
        // Isso garante que a barra nunca ultrapasse 100%
        setDuration(prev => {
          if (maybeCurrent > prev - 60) {
            // Se estiver a menos de 1 minuto do "fim estimado", expandir
            const newDuration = maybeCurrent + 600; // +10 min de margem
            console.log('[OMEGA][PANDA] 📏 Ajustando duration:', prev, '→', newDuration);
            return newDuration;
          }
          return prev;
        });
      }

      // Se Panda enviar duration real (alguns eventos podem ter), usar
      const maybeDuration = Number(data?.duration);
      if (Number.isFinite(maybeDuration) && maybeDuration > 0) {
        setDuration(maybeDuration);
        console.log('[OMEGA][PANDA] ✅ Duration real recebida:', maybeDuration);
      }

      // Debug
      if (msg === 'panda_timeupdate') {
        console.debug('[OMEGA][PANDA] timeupdate', { currentTime: maybeCurrent, duration: maybeDuration || 'N/A' });
      }
      if (msg === 'panda_error') {
        console.warn('[OMEGA][PANDA] erro do player', data);
      }
    };

    window.addEventListener('message', handlePandaMessage);
    return () => window.removeEventListener('message', handlePandaMessage);
  }, [type, showThumbnail]);

  // Heartbeat e callback de progresso (menos frequente)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      // YouTube usa API; Panda usa state (alimentado por postMessage)
      const current = type === 'youtube'
        ? (Number(playerRef.current?.getCurrentTime?.() ?? 0) || 0)
        : currentTime;
      const dur = type === 'youtube'
        ? (Number(playerRef.current?.getDuration?.() ?? 0) || 0)
        : duration;

      const safeDur = dur > 0 ? dur : 1;
      const progress = (current / safeDur) * 100;
      onProgress?.(progress);
      sendHeartbeat(Math.floor(current));
    }, 10000);

    return () => clearInterval(interval);
  }, [type, isPlaying, currentTime, duration, onProgress, sendHeartbeat]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("touchstart", handleMouseMove, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("touchstart", handleMouseMove);
      }
      clearTimeout(timeout);
    };
  }, []);

  // ============================================
  // CONTROLES
  // ============================================
  const handlePlayPause = useCallback(() => {
    if (showThumbnail) {
      // 🆕 DISCLAIMER: Exibir aviso legal por 3 segundos antes de iniciar
      // ⚠️ OWNER PARTICIPARÁ DE TODAS AS REGRAS - Sem bypass para disclaimer
      if (!disclaimerCompleted) {
        setShowDisclaimer(true);
        setTimeout(() => {
          setShowDisclaimer(false);
          setDisclaimerCompleted(true);
          setShowThumbnail(false);
          setIsLoading(true);
          
          // 🎬 AUTOPLAY após disclaimer: Aguardar player carregar e iniciar automaticamente
          // O autoplay acontece no onReady do YouTube ou após Panda DRM ser resolvido
          console.log('[OmegaFortress] ✅ Disclaimer concluído - autoplay será ativado');
        }, 3000); // 3 segundos de disclaimer
        return;
      }
      
      setShowThumbnail(false);
      setIsLoading(true);
      return;
    }

    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo?.();
      } else {
        playerRef.current.playVideo?.();
      }
      setIsPlaying(!isPlaying);
    }
  }, [showThumbnail, isPlaying, disclaimerCompleted]);

  const pauseVideo = useCallback(() => {
    if (playerRef.current?.pauseVideo) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    console.log('[OmegaFortress] 🎚️ Alterando velocidade para:', speed);
    console.log('[OmegaFortress] playerRef.current:', playerRef.current);
    console.log('[OmegaFortress] setPlaybackRate disponível?', typeof playerRef.current?.setPlaybackRate);
    
    setCurrentSpeed(speed);
    
    // YouTube IFrame API - setPlaybackRate
    if (playerRef.current) {
      try {
        // Método 1: API direta do YouTube Player (e.target do onReady)
        if (typeof playerRef.current.setPlaybackRate === 'function') {
          playerRef.current.setPlaybackRate(speed);
          console.log('[OmegaFortress] ✅ Velocidade YouTube alterada:', speed);
        } 
        // Método 2: Fallback - tentar via getIframe() + postMessage
        else if (typeof playerRef.current.getIframe === 'function') {
          const iframe = playerRef.current.getIframe();
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({
              event: 'command',
              func: 'setPlaybackRate',
              args: [speed]
            }), '*');
            console.log('[OmegaFortress] ✅ Velocidade aplicada via postMessage:', speed);
          }
        }
        // Método 3: playbackRate nativo (para Panda/video element)
        else if (typeof playerRef.current.playbackRate === 'number') {
          playerRef.current.playbackRate = speed;
          console.log('[OmegaFortress] ✅ Velocidade Panda alterada:', speed);
        }
      } catch (err) {
        console.error('[OmegaFortress] ❌ Erro ao mudar velocidade:', err);
      }
    } else {
      console.warn('[OmegaFortress] ⚠️ Player não inicializado, velocidade salva no estado');
    }
  }, []);

  const handleQualityChange = useCallback((quality: string) => {
    setCurrentQuality(quality);
    playerRef.current?.setPlaybackQuality?.(quality);
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (playerRef.current) {
      if (isMuted) playerRef.current.unMute?.();
      else playerRef.current.mute?.();
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) document.exitFullscreen();
      else containerRef.current.requestFullscreen();
    }
  }, []);

  // 🎯 PART 2: Seek - permite clicar na barra de progresso
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !playerRef.current?.seekTo || duration <= 0) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = percentage * duration;
    
    playerRef.current.seekTo(seekTime, true);
    setCurrentTime(seekTime);
  }, [duration]);

  // 🎯 PART 2: Formatar tempo (mm:ss ou hh:mm:ss)
  const formatTime = useCallback((seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  // ============================================
  // ESTILOS DE PROTEÇÃO
  // ============================================
  const protectionStyles: React.CSSProperties = {
    userSelect: "none",
    WebkitUserSelect: "none",
    pointerEvents: "auto",
    WebkitTouchCallout: "none",
  };

  // Risk level colors
  const riskColors = useMemo(() => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  }, [riskLevel]);

  // ============================================
  // 🛡️ P0 FALLBACK: VideoId inválido - NÃO renderizar player
  // Evita erros "embed/undefined" no Panda/YouTube
  // ============================================
  if (!isValidVideoId) {
    return (
      <div
        className={cn(
          "relative bg-black rounded-xl overflow-hidden",
          "ring-1 ring-white/10 flex items-center justify-center",
          className
        )}
      >
        <div className="aspect-video w-full flex flex-col items-center justify-center gap-4 text-center p-8">
          <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-yellow-500/80" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white/90">Vídeo não disponível</h3>
            <p className="text-sm text-white/60 max-w-md">
              Esta aula ainda não possui um vídeo vinculado ou o identificador do vídeo é inválido.
            </p>
          </div>
          {lessonId && (
            <p className="text-xs text-white/40 font-mono">
              Lesson ID: {lessonId}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative group bg-black rounded-xl overflow-hidden",
        "ring-1 ring-white/10",
        className
      )}
      style={protectionStyles}
      onContextMenu={(e) => { e.preventDefault(); reportViolation('context_menu', 1); }}
      onDragStart={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {/* Aspect Ratio Container */}
      <div className="aspect-video relative">
        
        {/* 🆕 THUMBNAIL STATE - AGORA FUNCIONA MESMO SEM THUMBNAIL (PANDA) */}
        {/* O disclaimer deve aparecer SEMPRE, independente de ter thumbnail */}
        {showThumbnail && (
          <div className="absolute inset-0 cursor-pointer z-10" onClick={handlePlayPause}>
            {/* Background: Thumbnail se existir, senão gradiente */}
            {thumbnailUrl ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black animate-pulse" />
                )}
                <img
                  src={thumbnailUrl}
                  alt={title}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImageLoaded(true)}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-500",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                />
              </>
            ) : (
              /* Fallback para Panda/Vimeo sem thumbnail */
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-primary/10 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
            
            {/* Play Button - Design 2300 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button
                className={cn(
                  "w-20 h-20 md:w-24 md:h-24 rounded-full",
                  "bg-gradient-to-br from-primary via-primary/90 to-primary/70",
                  "hover:from-primary/90 hover:to-primary",
                  "flex items-center justify-center",
                  "shadow-[0_0_60px_rgba(var(--primary-rgb),0.4)]",
                  "ring-4 ring-white/20"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
              </motion.button>
            </div>

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-semibold text-sm md:text-base truncate drop-shadow-lg">
                {title}
              </h3>
            </div>
          </div>
        )}

        {/* 🆕 DISCLAIMER OVERLAY - Aviso Legal 3 segundos */}
        <AnimatePresence>
          {showDisclaimer && (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative w-full h-full flex items-center justify-center p-4">
                {/* Imagem do Disclaimer - Asset local */}
                <img
                  src={disclaimerImage}
                  alt="Aviso Legal - Uso Restrito e Rastreável"
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Contador visual */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, ease: "linear" }}
                    />
                  </div>
                  <span className="text-white/60 text-xs">Iniciando...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Player */}
        {!showThumbnail && (
          <>
            {/* YouTube: JS API inicializa no container */}
            {type === "youtube" && <div className="player-container absolute inset-0" />}
            
            {/* PANDA: DRM via API exige URL assinada (token + expires) */}
            {type === "panda" && pandaSignedSrc && (
              <iframe
                ref={pandaIframeRef}
                key={pandaSignedSrc}
                src={pandaSignedSrc}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                frameBorder="0"
                onLoad={() => {
                  setIsLoading(false);
                  // 🎬 AUTOPLAY PANDA: Enviar comando play após iframe carregar
                  // Aguarda 500ms para o player interno inicializar completamente
                  setTimeout(() => {
                    if (pandaIframeRef.current?.contentWindow) {
                      console.log('[OmegaFortress] 🐼 Enviando comando play para Panda após load');
                      pandaIframeRef.current.contentWindow.postMessage({ type: 'play' }, '*');
                      setIsPlaying(true);
                    }
                  }, 500);
                }}
                title={title}
              />
            )}
            
            {/* Vimeo: iframe básico */}
            {type === "vimeo" && session && (
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                frameBorder="0"
                onLoad={() => setIsLoading(false)}
                title={title}
              />
            )}
          </>
        )}

        {/* Loading / Error gate */}
        {/* PATCH: Para Panda, não bloquear por sessionLoading pois o iframe tem sua própria proteção */}
        <AnimatePresence>
          {(isLoading || (type !== "panda" && sessionLoading)) && !showThumbnail && !sessionError && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <span className="text-white/70 text-sm">Iniciando sessão segura...</span>
            </motion.div>
          )}

          {sessionError && !showThumbnail && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 gap-3 p-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2 text-white">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="font-semibold">Não foi possível iniciar a sessão segura</span>
              </div>
              <p className="text-sm text-white/70 max-w-md break-words">
                {sessionError}
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
                  onClick={() => {
                    setIsLoading(true);
                    startSession().then((ok) => {
                      if (!ok) setIsLoading(false);
                    });
                  }}
                >
                  Tentar novamente
                </button>
                <button
                  className="px-3 py-2 rounded-md bg-white/10 text-white text-sm"
                  onClick={() => {
                    onError?.(sessionError);
                  }}
                >
                  Detalhes
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Violation Warning */}
        <AnimatePresence>
          {violationWarning && (
            <motion.div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
            >
              <div className="bg-red-600/95 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg backdrop-blur-sm">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">{violationWarning}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔥 PART 3: SECURITY VIOLATION OVERLAY - Tela preta com aviso de violação */}
        <AnimatePresence>
          {securityViolation.active && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[100] gap-6 p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Ícone de alerta grande e vermelho */}
              <motion.div
                className="w-24 h-24 rounded-full bg-red-600/20 flex items-center justify-center ring-4 ring-red-500/30"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
              </motion.div>
              
              {/* Título */}
              <motion.h2
                className="text-3xl font-bold text-red-500 tracking-wider"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                ATENÇÃO
              </motion.h2>
              
              {/* Mensagem de violação */}
              <motion.div
                className="text-center max-w-md"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xl text-white font-semibold mb-2">
                  VIOLAÇÃO DE DIREITO AUTORAL
                </p>
                <p className="text-white/80">
                  É proibido o que você está fazendo.
                </p>
                <p className="text-sm text-white/50 mt-4">
                  {securityViolation.message}
                </p>
              </motion.div>
              
              {/* Contador de fechamento */}
              <motion.div
                className="flex flex-col items-center gap-2 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-red-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                  />
                </div>
                <span className="text-white/40 text-xs">Esta mensagem fechará automaticamente</span>
              </motion.div>
              
              {/* Badge de segurança */}
              <motion.div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-900/50 px-4 py-2 rounded-full"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Shield className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-300 font-medium">Esta atividade foi registrada</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🎯 QUALITY ERROR OVERLAY v14.0: Erro quando qualidade mínima (720p) não está disponível */}
        <AnimatePresence>
          {qualityError && !showThumbnail && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-50 gap-4 p-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-white font-semibold text-lg">Qualidade Insuficiente</h3>
                <p className="text-sm text-white/70 max-w-md">
                  {qualityError}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  onClick={() => {
                    setQualityError(null);
                    setShowThumbnail(true);
                    setIsLoading(false);
                  }}
                >
                  Voltar
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
                  onClick={() => {
                    setQualityError(null);
                    setIsLoading(true);
                    // Recarregar o player
                    if (playerRef.current?.destroy) {
                      playerRef.current.destroy();
                      playerRef.current = null;
                    }
                    setShowThumbnail(false);
                  }}
                >
                  Tentar Novamente
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SEMPRE exibir watermark quando sessão existir, mesmo durante loading do player */}
        {showWatermark && session?.watermark?.text && !showThumbnail && (
          <WatermarkOverlay 
            text={session.watermark.text} 
            mode={(session.watermark.mode || 'moving') as 'moving' | 'static' | 'diagonal'} 
            isImmune={isImmune}
          />
        )}

        {/* 🔥 PART 3: ANTI-RECORDING OVERLAY - Camada anti-gravação (imperceptível para humanos, visível para gravadores) */}
        {!showThumbnail && !isImmuneUser && (
          <div className="anti-recording-overlay" aria-hidden="true" />
        )}

        {/* 🛡️ Escudos de Proteção - Invisíveis (z-20 para ficar ABAIXO dos controles z-30) */}
        {/* PATCH: Escudos protegem bordas mas LIBERAM timeline central para cliques */}
        {type !== "panda" && !showControls && (
          <>
            {/* Escudo superior */}
            <div className="absolute top-0 left-0 right-0 h-[60px] z-20 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
            {/* Escudo inferior ESQUERDO - bloqueia logo YouTube */}
            <div className="absolute bottom-0 left-0 h-[50px] w-[120px] z-20 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
            {/* Escudo inferior DIREITO - bloqueia config/fullscreen */}
            <div className="absolute bottom-0 right-0 h-[50px] w-[200px] z-20 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
            {/* Escudos laterais */}
            <div className="absolute top-0 bottom-0 left-0 w-[80px] z-20 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
            <div className="absolute top-0 bottom-0 right-0 w-[80px] z-20 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
          </>
        )}

        {/* Custom Controls */}
        {/* PATCH: não renderizar overlays de controle por cima do Panda */}
        {type !== "panda" && !showThumbnail && (
          <AnimatePresence>
            {showControls && (
              <motion.div
                className="absolute inset-0 z-30 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Top gradient */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />
                
                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2">
                    {showSecurityBadge && (
                      <motion.div 
                        className="flex items-center gap-1.5 bg-green-600/90 px-2 py-1 rounded-full cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                      >
                        <ShieldCheck className="w-3 h-3 text-white" />
                        <span className="text-[10px] text-white font-medium">PROTEGIDO</span>
                      </motion.div>
                    )}
                    {session && (
                      <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Lock className="w-3 h-3 text-white/70" />
                        <span className="text-[10px] text-white/70 font-mono">{session.sessionCode}</span>
                      </div>
                    )}
                    {/* ⚠️ OWNER PARTICIPARÁ DE TODAS AS REGRAS - Indicador de risco para todos */}
                    {showRiskIndicator && (
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", riskColors)} />
                    )}
                  </div>
                  <span className="text-xs text-white/60 truncate max-w-[200px]">{title}</span>
                </div>

                {/* Security Info Panel */}
                <AnimatePresence>
                  {showSecurityInfo && (
                    <motion.div
                      className="absolute top-14 left-3 bg-black/90 backdrop-blur-md rounded-lg p-3 pointer-events-auto z-50"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h4 className="text-white font-semibold text-xs mb-2 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-green-500" />
                        Status de Segurança
                      </h4>
                      <div className="space-y-1 text-[10px] text-white/70">
                        <div className="flex justify-between gap-4">
                          <span>Nível de Risco:</span>
                          <span
                            className={cn("font-medium", {
                              'text-green-400': riskLevel === 'low',
                              'text-yellow-400': riskLevel === 'medium',
                              'text-orange-400': riskLevel === 'high',
                              'text-red-400': riskLevel === 'critical',
                            })}
                          >
                            {riskLevel.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Heartbeats:</span>
                          <span className="text-white">{protectionStats.heartbeatsSent}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Violações Bloqueadas:</span>
                          <span className="text-white">{protectionStats.violationsBlocked}</span>
                        </div>
                        {/* ⚠️ OWNER PARTICIPARÁ DE TODAS AS REGRAS - Indicador de imunidade removido */}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Center play/pause */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                  <motion.button
                    className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center ring-1 ring-white/20"
                    onClick={handlePlayPause}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7 text-white" fill="white" />
                    ) : (
                      <Play className="w-7 h-7 text-white ml-1" fill="white" />
                    )}
                  </motion.button>
                </div>

                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 to-transparent" />

                {/* 🎯 PART 2: Progress Bar - Barra de progresso clicável */}
                <div className="absolute bottom-14 left-0 right-0 px-3 pointer-events-auto">
                  <div 
                    ref={progressBarRef}
                    className="relative h-1 bg-white/20 rounded-full cursor-pointer group/progress"
                    onClick={handleSeek}
                  >
                    {/* Buffer (opcional, visual apenas) */}
                    <div 
                      className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
                      style={{ width: `${duration > 0 ? Math.min((currentTime / duration) * 100 + 10, 100) : 0}%` }}
                    />
                    {/* Progress atual */}
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-100"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                    {/* Handle (bolinha) */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
                      style={{ left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 6px)` }}
                    />
                  </div>
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlayPause}
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <button
                      onClick={handleMuteToggle}
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                    {/* 🎯 PART 2: Tempo atual / Duração */}
                    <span className="text-white/80 text-xs font-mono ml-1">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                          <Settings className="w-5 h-5 text-white" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-[100000] bg-black/95 border-white/10 backdrop-blur-md">
                        <DropdownMenuLabel className="text-white/70 text-xs">
                          <Zap className="w-3 h-3 inline mr-1" />
                          Velocidade
                        </DropdownMenuLabel>
                        {PLAYBACK_SPEEDS.map((speed) => (
                          <DropdownMenuItem
                            key={speed.value}
                            onSelect={(e) => {
                              e.preventDefault();
                              handleSpeedChange(speed.value);
                            }}
                            className={cn(
                              "text-white hover:bg-white/10 cursor-pointer",
                              currentSpeed === speed.value && "bg-primary/20 text-primary"
                            )}
                          >
                            <ChevronRight
                              className={cn(
                                "w-3 h-3 mr-2 opacity-0",
                                currentSpeed === speed.value && "opacity-100"
                              )}
                            />
                            {speed.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuLabel className="text-white/70 text-xs">
                          <Eye className="w-3 h-3 inline mr-1" />
                          Qualidade
                        </DropdownMenuLabel>
                        {VIDEO_QUALITIES.map((quality) => (
                          <DropdownMenuItem
                            key={quality.value}
                            onSelect={(e) => {
                              e.preventDefault();
                              handleQualityChange(quality.value);
                            }}
                            className={cn(
                              "text-white hover:bg-white/10 cursor-pointer",
                              currentQuality === quality.value && "bg-primary/20 text-primary"
                            )}
                          >
                            <ChevronRight
                              className={cn(
                                "w-3 h-3 mr-2 opacity-0",
                                currentQuality === quality.value && "opacity-100"
                              )}
                            />
                            {quality.label}
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
        )}

        {/* Panda Video: Progress bar com marcadores de capítulos - ACIMA da barra nativa */}
        {type === 'panda' && hasChapters && !showThumbnail && (
          <div className="absolute bottom-14 left-4 right-4 z-40 pointer-events-auto">
            {/* Label indicativo */}
            <div className="text-xs text-white/70 mb-1 font-medium flex items-center gap-2">
              <span className="w-3 h-0.5 bg-purple-400 rounded-full" />
              Capítulos da Aula
              <span className="text-white/50">• Clique para navegar</span>
            </div>
            <div 
              className="relative h-2.5 bg-white/20 rounded-full cursor-pointer group/progress hover:h-3 transition-all backdrop-blur-sm border border-white/10"
              onClick={(e) => {
                // Calcular posição do clique na barra e converter para segundos
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                const targetSeconds = Math.floor(percentage * duration);
                
                console.log('[OMEGA] 🎯 Clique na barra de progresso:', {
                  percentage: `${(percentage * 100).toFixed(1)}%`,
                  targetSeconds,
                  duration
                });
                
                seekToChapter(targetSeconds);
              }}
            >
              {/* Progress atual */}
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-100 pointer-events-none"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              {/* Marcadores de capítulos */}
              <ChapterMarkers
                chapters={chapters}
                duration={duration}
                currentTime={currentTime}
                onChapterClick={seekToChapter}
              />
            </div>
          </div>
        )}

        {/* Sidebar de capítulos - DENTRO do container para funcionar em fullscreen */}
        {type === 'panda' && hasChapters && (
          <ChapterSidebar
            chapters={chapters}
            currentTime={currentTime}
            onChapterClick={seekToChapter}
            isOpen={chapterSidebarOpen}
            onToggle={() => setChapterSidebarOpen(!chapterSidebarOpen)}
          />
        )}

      </div>

      {/* CSS de proteção */}
      <style>{`
        .player-container iframe {
          pointer-events: auto !important;
        }
        .player-container iframe::-webkit-media-controls-download-button,
        .player-container iframe::-webkit-media-controls-watch-youtube-button {
          display: none !important;
        }
        @media print {
          .player-container { display: none !important; }
        }
      `}</style>
    </div>
  );
});

OmegaFortressPlayer.displayName = "OmegaFortressPlayer";

// ============================================
// WATERMARK COMPONENT - ULTRA COM INTERMITÊNCIA
// ============================================
interface WatermarkProps {
  text: string;
  mode: 'moving' | 'static' | 'diagonal';
  isImmune?: boolean;
}

// 🎲 Gera tempo aleatório dentro de um range
function randomTime(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const WatermarkOverlay = memo(({ text, mode, isImmune }: WatermarkProps) => {
  const [position, setPosition] = useState({ x: 10, y: 15 });
  
  // 🔄 Estado de visibilidade intermitente
  const [isVisible, setIsVisible] = useState(true);

  // 🎭 Ciclo de aparição/desaparição em tempos variáveis
  // Visível: 5-30 segundos | Invisível: 2-5 segundos
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const scheduleNext = () => {
      if (isVisible) {
        // Visível por 5-30 segundos
        const visibleTime = randomTime(5, 30) * 1000;
        timeoutId = setTimeout(() => {
          setIsVisible(false);
        }, visibleTime);
      } else {
        // Invisível por 2-5 segundos
        const hiddenTime = randomTime(2, 5) * 1000;
        timeoutId = setTimeout(() => {
          setIsVisible(true);
        }, hiddenTime);
      }
    };
    
    scheduleNext();
    
    return () => clearTimeout(timeoutId);
  }, [isVisible]);

  // 🔒 WATERMARK PERMANENTE: Movimento ALEATÓRIO com intervalos VARIÁVEIS
  // Intervalos: 3s → 4s → 5s → 3s... (ciclo aleatório)
  // Posições: Completamente aleatórias dentro da área segura do vídeo
  useEffect(() => {
    if (mode === 'static') return;

    // Função para gerar posição aleatória (evita bordas extremas)
    const getRandomPosition = () => ({
      x: Math.floor(Math.random() * 70) + 10, // 10% a 80% da largura
      y: Math.floor(Math.random() * 70) + 10, // 10% a 80% da altura
    });

    // Array de intervalos em segundos (3, 4, 5) - cicla aleatoriamente
    const intervals = [3000, 4000, 5000];
    let timeoutId: NodeJS.Timeout;

    const moveWatermark = () => {
      // Posição aleatória
      setPosition(getRandomPosition());
      
      // Próximo intervalo aleatório (3, 4 ou 5 segundos)
      const nextInterval = intervals[Math.floor(Math.random() * intervals.length)];
      timeoutId = setTimeout(moveWatermark, nextInterval);
    };

    // Inicia o ciclo com intervalo aleatório
    const initialInterval = intervals[Math.floor(Math.random() * intervals.length)];
    timeoutId = setTimeout(moveWatermark, initialInterval);

    return () => clearTimeout(timeoutId);
  }, [mode]);

  // 🚫 Se invisível, não renderiza
  if (!isVisible) {
    return null;
  }

  // 🎨 MODO STATIC: +20% nitidez, opacidade reduzida 35% (0.30 → 0.195 ≈ 0.06 equivalente)
  if (mode === 'static') {
    return (
      <div 
        className="absolute inset-0 z-50 pointer-events-none select-none overflow-hidden"
        style={{ transition: 'opacity 0.5s ease-in-out' }}
      >
        <div className="absolute bottom-4 right-4">
          <span 
            className="font-mono tracking-wider text-sm sm:text-base whitespace-nowrap"
            style={{ 
              color: 'rgba(255, 255, 255, 0.20)', // Reduzido 35% (era 0.30)
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            {text}
          </span>
        </div>
      </div>
    );
  }

  // 🎨 MODO DIAGONAL: +20% nitidez, opacidade reduzida 35% (0.22 → 0.14)
  if (mode === 'diagonal') {
    return (
      <div 
        className="absolute inset-0 z-50 pointer-events-none select-none overflow-hidden"
        style={{ transition: 'opacity 0.5s ease-in-out' }}
      >
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: 'rotate(-30deg)' }}
        >
          <span 
            className="font-mono tracking-[0.3em] text-base sm:text-lg whitespace-nowrap"
            style={{ 
              color: 'rgba(255, 255, 255, 0.14)', // Reduzido 35% (era 0.22)
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            {text}
          </span>
        </div>
      </div>
    );
  }

  // 🎨 MODO MOVING (PADRÃO): opacidade reduzida 35% (0.35 → 0.23)
  // Aparece/desaparece em tempos variáveis + movimento dinâmico
  return (
    <motion.div
      className="absolute z-50 pointer-events-none select-none"
      animate={{ left: `${position.x}%`, top: `${position.y}%` }}
      transition={{ duration: 5, ease: "easeInOut" }} // Transição suave de 5s
      style={{ transition: 'opacity 0.5s ease-in-out' }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span 
          className="font-mono tracking-[0.15em] text-sm sm:text-base whitespace-nowrap"
          style={{ 
            color: 'rgba(255, 255, 255, 0.23)', // Reduzido 35% (era 0.35)
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.6), 0 0 10px rgba(0, 0, 0, 0.4)'
          }}
        >
          {text}
        </span>
      </div>
    </motion.div>
  );
});

WatermarkOverlay.displayName = "WatermarkOverlay";

export default OmegaFortressPlayer;

// ============================================
// DECLARAÇÃO GLOBAL
// ============================================
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
