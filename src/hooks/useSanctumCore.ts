// ============================================
// 🌌🔥 SANCTUM CORE OMEGA — SENTINELA DE SEGURANÇA NÍVEL NASA 🔥🌌
// ANO 2300 — DETECÇÃO E RESPOSTA ULTRASSÔNICA
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs (MONO-DOMÍNIO v2.0 - 27/12/2025):
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: pro.moisesmedeiros.com.br/gestaofc (STAFF)
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// IMPORTANTE: Detecção ≠ Punição imediata
// Usamos escalonamento de risco baseado em padrões
//
// ============================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ============================================
// TIPOS E INTERFACES
// ============================================
export interface SanctumContext {
  resourceId: string;
  resourceType: "pdf" | "web_text" | "image" | "video" | "ebook" | "worksheet";
}

export interface Threat {
  type: ThreatType;
  severity: number;
  meta?: Record<string, unknown>;
}

export type ThreatType =
  | "devtools_key_attempt"
  | "devtools_probable"
  | "devtools_debugger_detected"
  | "print_shortcut_attempt"
  | "copy_shortcut_attempt"
  | "contextmenu_blocked"
  | "copy_event_blocked"
  | "drag_attempt_blocked"
  | "selection_attempt_blocked"
  | "printscreen_attempt"
  | "automation_webdriver"
  | "automation_phantom"
  | "automation_nightwatch"
  | "dom_mutation_detected"
  | "dom_tampering_detected"
  | "visibility_change_suspicious"
  | "focus_blur_suspicious"
  | "iframe_injection_detected"
  | "script_injection_detected"
  | "console_access_detected"
  | "protected_surface_opened"
  | "sanctum_punish"
  | "screenshot_extension_detected"
  | "screen_capture_detected"
  | "video_download_attempt"
  | "network_inspection_detected"
  | "source_view_attempt";

// ============================================
// CONSTANTES DE CONFIGURAÇÃO
// ============================================
const OWNER_EMAIL = "moisesblank@gmail.com";
const RATE_LIMIT_MS = 300;
const DEVTOOLS_CHECK_INTERVAL_MS = 1500;
const VISIBILITY_THRESHOLD = 10;
const DOM_MUTATION_THRESHOLD = 100;
const CONSOLE_CHECK_INTERVAL_MS = 3000;

// Mapeamento de severidade por tipo de ameaça
const THREAT_SEVERITY_MAP: Record<ThreatType, number> = {
  devtools_key_attempt: 35,
  devtools_probable: 55,
  devtools_debugger_detected: 70,
  print_shortcut_attempt: 30,
  copy_shortcut_attempt: 25,
  contextmenu_blocked: 10,
  copy_event_blocked: 20,
  drag_attempt_blocked: 15,
  selection_attempt_blocked: 10,
  printscreen_attempt: 40,
  // ⚠️ DESATIVADO 2026-01-22: Causava falsos positivos no 2FA
  automation_webdriver: 0,  // Era 95
  automation_phantom: 0,    // Era 95
  automation_nightwatch: 0, // Era 95
  dom_mutation_detected: 15,
  dom_tampering_detected: 50,
  visibility_change_suspicious: 20,
  focus_blur_suspicious: 15,
  iframe_injection_detected: 80,
  script_injection_detected: 90,
  console_access_detected: 45,
  protected_surface_opened: 0,
  sanctum_punish: 100,
  screenshot_extension_detected: 60,
  screen_capture_detected: 65,
  video_download_attempt: 75,
  network_inspection_detected: 55,
  source_view_attempt: 40,
};

// Limite de tentativas antes de punição por tipo
const PUNISHMENT_THRESHOLDS: Partial<Record<ThreatType, number>> = {
  devtools_key_attempt: 30,
  devtools_probable: 3,
  print_shortcut_attempt: 20,
  copy_shortcut_attempt: 25,
  contextmenu_blocked: 40,
  copy_event_blocked: 30,
  drag_attempt_blocked: 30,
  selection_attempt_blocked: 50,
  dom_mutation_detected: 150,
  visibility_change_suspicious: 15,
  focus_blur_suspicious: 20,
  console_access_detected: 5,
};

// ============================================
// HOOK PRINCIPAL
// ============================================
export function useSanctumCore(ctx: SanctumContext) {
  const { user, session, signOut } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
  
  // Verificar se é owner (MASTER)
  const isOwner = 
    user?.email?.toLowerCase() === OWNER_EMAIL;
  
  // Contadores de violações
  const counters = useRef<Record<string, number>>({});
  const lastSend = useRef<number>(0);
  const sessionId = useRef<string>(crypto.randomUUID());
  const startTime = useRef<number>(Date.now());

  // ============================================
  // FUNÇÕES UTILITÁRIAS
  // ============================================
  
  // Incrementar contador
  const bump = useCallback((key: string, add = 1): number => {
    counters.current[key] = (counters.current[key] ?? 0) + add;
    return counters.current[key];
  }, []);

  // Obter contagem atual
  const getCount = useCallback((key: string): number => {
    return counters.current[key] ?? 0;
  }, []);

  // Reset contador
  const resetCounter = useCallback((key: string) => {
    counters.current[key] = 0;
  }, []);

  // ============================================
  // REPORTAR VIOLAÇÃO AO BACKEND
  // ============================================
  const reportViolation = useCallback(async (t: Threat) => {
    const now = Date.now();
    
    // Rate limiting
    if (now - lastSend.current < RATE_LIMIT_MS && t.severity < 50) {
      return;
    }
    lastSend.current = now;

    // Atualizar risk score local
    setRiskScore(prev => Math.min(prev + t.severity, 500));

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        console.warn("[Sanctum] VITE_SUPABASE_URL não configurado");
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/sanctum-report-violation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({
            violationType: t.type,
            severity: t.severity,
            assetId: ctx.resourceId,
            metadata: {
              ...t.meta,
              resourceType: ctx.resourceType,
              sessionId: sessionId.current,
              elapsedMs: Date.now() - startTime.current,
              path: window.location.pathname,
              host: window.location.host,
              userAgent: navigator.userAgent,
              screenRes: `${screen.width}x${screen.height}`,
              windowRes: `${window.innerWidth}x${window.innerHeight}`,
              counters: { ...counters.current },
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Se backend indicou bloqueio
        if (data?.locked) {
          setIsLocked(true);
          toast.error("Sua conta foi temporariamente bloqueada por atividade suspeita.", {
            duration: 10000,
          });
          await signOut();
        }
      }
    } catch (err) {
      console.error("[Sanctum] Erro ao reportar violação:", err);
    }
  }, [ctx.resourceId, ctx.resourceType, session?.access_token, signOut]);

  // ============================================
  // PUNIÇÃO (LOGOUT FORÇADO)
  // ============================================
  const punish = useCallback(async (severity: number, reason: string) => {
    if (isOwner) return;

    console.warn(`[Sanctum] PUNIÇÃO: ${reason} (severity: ${severity})`);
    
    await reportViolation({
      type: "sanctum_punish",
      severity,
      meta: { reason, finalCounters: { ...counters.current } },
    });

    toast.error("Atividade suspeita detectada. Você será desconectado.", {
      duration: 8000,
    });

    setIsLocked(true);
    await signOut();
  }, [isOwner, reportViolation, signOut]);

  // ============================================
  // HANDLERS DE EVENTOS
  // ============================================

  // Handler de teclas
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (isOwner) return;

    const key = e.key.toLowerCase();
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    // === DEVTOOLS === 🚨 LIBERADO POR ORDEM DO OWNER (2026-01-06)
    const devtoolsKeys = false; // F12 e DevTools agora permitidos

    // === PRINT ===
    const printKeys = isCtrl && key === "p";

    // === COPY/CUT/SELECT ALL ===
    const copyKeys = isCtrl && ["c", "x", "a"].includes(key);

    // === SAVE ===
    const saveKeys = isCtrl && key === "s";

    // === PRINTSCREEN ===
    const printScreen = key === "printscreen" || e.key === "PrintScreen";

    if (devtoolsKeys || printKeys || copyKeys || saveKeys || printScreen) {
      e.preventDefault();
      e.stopPropagation();

      let type: ThreatType;
      if (devtoolsKeys) type = "devtools_key_attempt";
      else if (printKeys) type = "print_shortcut_attempt";
      else if (copyKeys) type = "copy_shortcut_attempt";
      else if (saveKeys) type = "source_view_attempt";
      else type = "printscreen_attempt";

      const count = bump(type);
      const severity = THREAT_SEVERITY_MAP[type];
      const threshold = PUNISHMENT_THRESHOLDS[type];

      void reportViolation({
        type,
        severity,
        meta: { count, key, ctrl: isCtrl, shift: isShift },
      });

      if (threshold && count >= threshold) {
        void punish(severity + 10, `${type}>=${threshold}`);
      }
    }
  }, [isOwner, bump, reportViolation, punish]);

  // Handler de menu de contexto
  const onContextMenu = useCallback((e: Event) => {
    if (isOwner) return;
    e.preventDefault();
    e.stopPropagation();

    const count = bump("contextmenu_blocked");
    void reportViolation({
      type: "contextmenu_blocked",
      severity: THREAT_SEVERITY_MAP.contextmenu_blocked,
      meta: { count },
    });

    const threshold = PUNISHMENT_THRESHOLDS.contextmenu_blocked!;
    if (count >= threshold) {
      void punish(85, `contextmenu>=${threshold}`);
    }
  }, [isOwner, bump, reportViolation, punish]);

  // Handler de cópia
  const onCopy = useCallback((e: ClipboardEvent) => {
    if (isOwner) return;
    e.preventDefault();
    e.stopPropagation();

    // Limpar clipboard
    if (e.clipboardData) {
      e.clipboardData.setData("text/plain", "© Prof. Moisés Medeiros - Conteúdo Protegido");
    }

    const count = bump("copy_event_blocked");
    void reportViolation({
      type: "copy_event_blocked",
      severity: THREAT_SEVERITY_MAP.copy_event_blocked,
      meta: { count },
    });

    const threshold = PUNISHMENT_THRESHOLDS.copy_event_blocked!;
    if (count >= threshold) {
      void punish(88, `copy>=${threshold}`);
    }
  }, [isOwner, bump, reportViolation, punish]);

  // Handler de drag
  const onDragStart = useCallback((e: DragEvent) => {
    if (isOwner) return;
    e.preventDefault();
    e.stopPropagation();

    const count = bump("drag_attempt_blocked");
    void reportViolation({
      type: "drag_attempt_blocked",
      severity: THREAT_SEVERITY_MAP.drag_attempt_blocked,
      meta: { count },
    });
  }, [isOwner, bump, reportViolation]);

  // Handler de seleção
  const onSelectStart = useCallback((e: Event) => {
    if (isOwner) return;
    e.preventDefault();

    const count = bump("selection_attempt_blocked");
    if (count % 10 === 0) {
      void reportViolation({
        type: "selection_attempt_blocked",
        severity: THREAT_SEVERITY_MAP.selection_attempt_blocked,
        meta: { count },
      });
    }
  }, [isOwner, bump, reportViolation]);

  // Handler de mudança de visibilidade
  const onVisibilityChange = useCallback(() => {
    if (isOwner) return;
    if (document.hidden) {
      const count = bump("visibility_change_suspicious");
      if (count > 5 && count % 5 === 0) {
        void reportViolation({
          type: "visibility_change_suspicious",
          severity: THREAT_SEVERITY_MAP.visibility_change_suspicious,
          meta: { count },
        });
      }
      const threshold = PUNISHMENT_THRESHOLDS.visibility_change_suspicious!;
      if (count >= threshold) {
        void punish(75, `visibility>=${threshold}`);
      }
    }
  }, [isOwner, bump, reportViolation, punish]);

  // ============================================
  // 📱 HANDLERS ULTRA ESPECÍFICOS PARA TOUCH/MOBILE/TABLET
  // COMPATÍVEL: iOS Safari, Android Chrome, Samsung Browser, Firefox Mobile
  // ============================================

  // Long-press detection (iOS/Android context menu via touch)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchCount = useRef<number>(0);
  const multiTouchStart = useRef<number>(0);

  // Detectar tipo de dispositivo
  const isTouchDevice = useCallback(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  const isMobileDevice = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const isIOSDevice = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  const isAndroidDevice = useCallback(() => {
    return /Android/i.test(navigator.userAgent);
  }, []);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (isOwner) return;

    // Contar toques simultâneos
    touchCount.current = e.touches.length;
    
    // Detectar multi-touch (possível screenshot gesture)
    if (e.touches.length >= 3) {
      multiTouchStart.current = Date.now();
      e.preventDefault();
      const count = bump("printscreen_attempt");
      void reportViolation({
        type: "printscreen_attempt",
        severity: THREAT_SEVERITY_MAP.printscreen_attempt + 10,
        meta: { count, device: "touch", gesture: "multi_touch_3fingers", touchCount: e.touches.length },
      });
    }

    // Guardar posição inicial
    if (e.touches.length === 1) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      // Timer para detectar long-press (400ms para iOS, 500ms para Android)
      const delay = isIOSDevice() ? 400 : 500;
      longPressTimer.current = setTimeout(() => {
        const count = bump("contextmenu_blocked");
        void reportViolation({
          type: "contextmenu_blocked",
          severity: THREAT_SEVERITY_MAP.contextmenu_blocked,
          meta: { count, device: "touch", action: "long_press", os: isIOSDevice() ? 'iOS' : 'Android' },
        });
      }, delay);
    }
  }, [isOwner, bump, reportViolation, isIOSDevice]);

  const onTouchEnd = useCallback(() => {
    // Cancelar timer de long-press
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
    touchCount.current = 0;
    
    // Verificar se multi-touch foi muito rápido (possível screenshot)
    if (multiTouchStart.current > 0) {
      const duration = Date.now() - multiTouchStart.current;
      if (duration < 300) {
        bump("printscreen_attempt");
      }
      multiTouchStart.current = 0;
    }
  }, [bump]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    // Cancelar long-press se mover muito
    if (longPressTimer.current && touchStartPos.current) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
    
    // Detectar swipe rápido com 3+ dedos (screenshot gesture iOS)
    if (e.touches.length >= 3 && touchCount.current >= 3) {
      e.preventDefault();
    }
  }, []);

  // Bloquear gestos de screenshot em iOS (3 dedos swipe, pinch-zoom agressivo)
  const onGestureStart = useCallback((e: Event) => {
    if (isOwner) return;
    e.preventDefault();
    e.stopPropagation();
    const count = bump("printscreen_attempt");
    void reportViolation({
      type: "printscreen_attempt",
      severity: THREAT_SEVERITY_MAP.printscreen_attempt,
      meta: { count, device: "touch", gesture: "ios_gesture_start" },
    });
  }, [isOwner, bump, reportViolation]);

  const onGestureEnd = useCallback((e: Event) => {
    if (isOwner) return;
    e.preventDefault();
  }, [isOwner]);

  // Bloquear zoom agressivo (possível tentativa de ver detalhes para captura)
  const onTouchZoom = useCallback((e: TouchEvent) => {
    if (isOwner) return;
    if (e.touches.length >= 2) {
      // Detectar pinch-to-zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      
      // Se distância muito grande, pode ser tentativa de zoom extremo
      if (distance > 400) {
        bump("selection_attempt_blocked");
      }
    }
  }, [isOwner, bump]);

  // Bloquear iOS Screenshot Shortcut (volume + power button - detectável via blur)
  const onIOSScreenshotDetect = useCallback(() => {
    if (isOwner) return;
    // iOS dispara blur rapidamente quando screenshot é tirado
    const blurTimeout = setTimeout(() => {
      if (document.hidden || !document.hasFocus()) {
        const count = bump("printscreen_attempt");
        void reportViolation({
          type: "printscreen_attempt",
          severity: THREAT_SEVERITY_MAP.printscreen_attempt + 5,
          meta: { count, device: "iOS", method: "button_combo_suspected" },
        });
      }
    }, 100);
    
    return () => clearTimeout(blurTimeout);
  }, [isOwner, bump, reportViolation]);

  // Handler para beforeprint em mobile (alguns browsers suportam)
  const onBeforePrint = useCallback(() => {
    if (isOwner) return;
    void reportViolation({
      type: "print_shortcut_attempt",
      severity: THREAT_SEVERITY_MAP.print_shortcut_attempt + 20,
      meta: { device: isMobileDevice() ? "mobile" : "desktop", method: "beforeprint_event" },
    });
  }, [isOwner, reportViolation, isMobileDevice]);

  // ============================================
  // HEURÍSTICAS DE DETECÇÃO
  // ============================================

  // Detector de DevTools (heurística de tamanho)
  const checkDevTools = useCallback(() => {
    if (isOwner) return;

    const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
    const heightDiff = Math.abs(window.outerHeight - window.innerHeight);

    // DevTools provavelmente aberto
    if (widthDiff > 160 || heightDiff > 160) {
      const count = bump("devtools_probable");
      void reportViolation({
        type: "devtools_probable",
        severity: THREAT_SEVERITY_MAP.devtools_probable,
        meta: { count, widthDiff, heightDiff },
      });

      const threshold = PUNISHMENT_THRESHOLDS.devtools_probable!;
      if (count >= threshold) {
        void punish(85, `devtools_probable>=${threshold}`);
      }
    }
  }, [isOwner, bump, reportViolation, punish]);

  // Detector de console access
  const checkConsoleAccess = useCallback(() => {
    if (isOwner) return;

    let consoleDetected = false;

    try {
      const element = new Image();
      Object.defineProperty(element, "id", {
        get: function () {
          consoleDetected = true;
          return "sanctum-trap";
        },
      });
      console.debug(element);
      console.clear();
    } catch {
      // Ignorar erros
    }

    if (consoleDetected) {
      const count = bump("console_access_detected");
      void reportViolation({
        type: "console_access_detected",
        severity: THREAT_SEVERITY_MAP.console_access_detected,
        meta: { count },
      });

      const threshold = PUNISHMENT_THRESHOLDS.console_access_detected!;
      if (count >= threshold) {
        void punish(80, `console>=${threshold}`);
      }
    }
  }, [isOwner, bump, reportViolation, punish]);

  // Detector de automação
  // ⚠️ DESATIVADO 2026-01-22: Causava falsos positivos no fluxo de 2FA
  // Outras camadas (RLS, watermark, DevTools detection) permanecem ativas
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkAutomation = useCallback(() => {
    // 🛡️ DESATIVADO - Não faz nada para evitar falsos positivos
    return;
  }, []);

  // ============================================
  // REGISTRAR SUPERFÍCIE PROTEGIDA
  // ============================================
  const registerProtectedSurface = useCallback(() => {
    void reportViolation({
      type: "protected_surface_opened",
      severity: 0,
      meta: {
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
      },
    });
  }, [reportViolation]);

  // ============================================
  // SETUP DE LISTENERS
  // ============================================
  useEffect(() => {
    // Owner é imune
    if (!user || isOwner) return;

    // Verificar automação imediatamente
    checkAutomation();

    // Event listeners - Desktop
    window.addEventListener("keydown", onKeyDown, { capture: true, passive: false });
    document.addEventListener("contextmenu", onContextMenu, { capture: true });
    document.addEventListener("copy", onCopy, { capture: true });
    document.addEventListener("cut", onCopy, { capture: true });
    document.addEventListener("dragstart", onDragStart, { capture: true });
    document.addEventListener("selectstart", onSelectStart, { capture: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    
    // Print events (desktop + alguns mobile)
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onBeforePrint);

    // 📱 Event listeners - TOUCH/MOBILE (iOS, Android, Tablets)
    document.addEventListener("touchstart", onTouchStart, { capture: true, passive: false });
    document.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { capture: true, passive: true });
    document.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });
    
    // iOS gesture events (Safari + WebKit)
    document.addEventListener("gesturestart", onGestureStart, { capture: true, passive: false });
    document.addEventListener("gesturechange", onGestureStart, { capture: true, passive: false });
    document.addEventListener("gestureend", onGestureEnd, { capture: true, passive: false });
    
    // Blur detection para iOS screenshot (volume + power)
    window.addEventListener("blur", onIOSScreenshotDetect);
    
    // Zoom detection
    document.addEventListener("touchmove", onTouchZoom, { capture: true, passive: true });

    // MutationObserver para tampering
    const mutationObserver = new MutationObserver((mutations) => {
      const count = bump("dom_mutation", mutations.length);

      // Verificar injeção de scripts
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            if (el.tagName === "SCRIPT" && !el.getAttribute("data-sanctum-allowed")) {
              void reportViolation({
                type: "script_injection_detected",
                severity: THREAT_SEVERITY_MAP.script_injection_detected,
                meta: { src: (el as HTMLScriptElement).src },
              });
            }
            if (el.tagName === "IFRAME" && !el.getAttribute("data-sanctum-allowed")) {
              void reportViolation({
                type: "iframe_injection_detected",
                severity: THREAT_SEVERITY_MAP.iframe_injection_detected,
                meta: { src: (el as HTMLIFrameElement).src },
              });
            }
          }
        });
      });

      // Log se muitas mutações
      if (count >= DOM_MUTATION_THRESHOLD && count % 50 === 0) {
        void reportViolation({
          type: "dom_mutation_detected",
          severity: THREAT_SEVERITY_MAP.dom_mutation_detected,
          meta: { count },
        });
      }

      if (count >= 200) {
        void punish(80, "dom_mutation>=200");
      }
    });

    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    // Intervalos de verificação
    const devtoolsInterval = setInterval(checkDevTools, DEVTOOLS_CHECK_INTERVAL_MS);
    const consoleInterval = setInterval(checkConsoleAccess, CONSOLE_CHECK_INTERVAL_MS);

    // Cleanup
    return () => {
      // Desktop
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      document.removeEventListener("contextmenu", onContextMenu, { capture: true });
      document.removeEventListener("copy", onCopy, { capture: true });
      document.removeEventListener("cut", onCopy, { capture: true });
      document.removeEventListener("dragstart", onDragStart, { capture: true });
      document.removeEventListener("selectstart", onSelectStart, { capture: true });
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onBeforePrint);
      
      // Touch/Mobile (iOS, Android, Tablets)
      document.removeEventListener("touchstart", onTouchStart, { capture: true });
      document.removeEventListener("touchend", onTouchEnd, { capture: true });
      document.removeEventListener("touchcancel", onTouchEnd, { capture: true });
      document.removeEventListener("touchmove", onTouchMove, { capture: true });
      document.removeEventListener("touchmove", onTouchZoom, { capture: true });
      
      // iOS gestures
      document.removeEventListener("gesturestart", onGestureStart, { capture: true });
      document.removeEventListener("gesturechange", onGestureStart, { capture: true });
      document.removeEventListener("gestureend", onGestureEnd, { capture: true });
      
      // iOS screenshot detection
      window.removeEventListener("blur", onIOSScreenshotDetect);
      
      // Timers
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      
      mutationObserver.disconnect();
      clearInterval(devtoolsInterval);
      clearInterval(consoleInterval);
    };
  }, [
    user,
    isOwner,
    onKeyDown,
    onContextMenu,
    onCopy,
    onDragStart,
    onSelectStart,
    onVisibilityChange,
    onBeforePrint,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onTouchZoom,
    onGestureStart,
    onGestureEnd,
    onIOSScreenshotDetect,
    checkAutomation,
    checkDevTools,
    checkConsoleAccess,
    reportViolation,
    punish,
    bump,
  ]);

  // ============================================
  // RETORNO DO HOOK
  // ============================================
  return {
    registerProtectedSurface,
    isOwner,
    isLocked,
    riskScore,
    reportViolation,
    getCount,
    resetCounter,
    sessionId: sessionId.current,
  };
}

export default useSanctumCore;
