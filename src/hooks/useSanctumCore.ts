// ============================================
// 🌌🔥 SANCTUM CORE OMEGA — SENTINELA DE SEGURANÇA NÍVEL NASA 🔥🌌
// ANO 2300 — DETECÇÃO E RESPOSTA ULTRASSÔNICA
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
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
  automation_webdriver: 95,
  automation_phantom: 95,
  automation_nightwatch: 95,
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

    // === DEVTOOLS ===
    const devtoolsKeys =
      e.key === "F12" ||
      (isCtrl && isShift && ["i", "j", "c", "k"].includes(key)) ||
      (isCtrl && ["u"].includes(key));

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

  // Handler de visibilidade
  const onVisibilityChange = useCallback(() => {
    if (isOwner) return;
    if (document.hidden) {
      const count = bump("visibility_change_suspicious");
      if (count >= VISIBILITY_THRESHOLD) {
        void reportViolation({
          type: "visibility_change_suspicious",
          severity: THREAT_SEVERITY_MAP.visibility_change_suspicious,
          meta: { count, hidden: true },
        });
      }
    }
  }, [isOwner, bump, reportViolation]);

  // ============================================
  // DETECÇÃO DE DEVTOOLS
  // ============================================
  const checkDevTools = useCallback(() => {
    if (isOwner) return;

    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;

    if (widthThreshold || heightThreshold) {
      const count = bump("devtools_probable");
      void reportViolation({
        type: "devtools_probable",
        severity: THREAT_SEVERITY_MAP.devtools_probable,
        meta: { count, widthDiff: window.outerWidth - window.innerWidth, heightDiff: window.outerHeight - window.innerHeight },
      });

      const threshold = PUNISHMENT_THRESHOLDS.devtools_probable!;
      if (count >= threshold) {
        void punish(90, `devtools_open>=${threshold}`);
      }
    }
  }, [isOwner, bump, reportViolation, punish]);

  // ============================================
  // DETECÇÃO DE AUTOMAÇÃO
  // ============================================
  const checkAutomation = useCallback(() => {
    if (isOwner) return;

    const nav = navigator as Navigator & {
      webdriver?: boolean;
      __selenium_unwrapped?: unknown;
      __webdriver_evaluate?: unknown;
      __driver_evaluate?: unknown;
    };

    const win = window as Window & {
      callPhantom?: unknown;
      _phantom?: unknown;
      phantom?: unknown;
      __nightmare?: unknown;
      domAutomation?: unknown;
      domAutomationController?: unknown;
    };

    // WebDriver
    if (nav.webdriver) {
      void reportViolation({
        type: "automation_webdriver",
        severity: THREAT_SEVERITY_MAP.automation_webdriver,
        meta: { detected: "webdriver" },
      });
      void punish(100, "automation_webdriver");
      return;
    }

    // PhantomJS
    if (win.callPhantom || win._phantom || win.phantom) {
      void reportViolation({
        type: "automation_phantom",
        severity: THREAT_SEVERITY_MAP.automation_phantom,
        meta: { detected: "phantom" },
      });
      void punish(100, "automation_phantom");
      return;
    }

    // Nightmare
    if (win.__nightmare) {
      void reportViolation({
        type: "automation_nightwatch",
        severity: THREAT_SEVERITY_MAP.automation_nightwatch,
        meta: { detected: "nightmare" },
      });
      void punish(100, "automation_nightmare");
    }
  }, [isOwner, reportViolation, punish]);

  // ============================================
  // SETUP DE EVENTOS E INTERVALOS
  // ============================================
  useEffect(() => {
    if (isOwner) return;

    // Adicionar listeners
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("copy", onCopy, true);
    document.addEventListener("cut", onCopy, true);
    document.addEventListener("dragstart", onDragStart, true);
    document.addEventListener("selectstart", onSelectStart, true);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Intervalos de verificação
    const devToolsInterval = setInterval(checkDevTools, DEVTOOLS_CHECK_INTERVAL_MS);
    
    // Verificação inicial de automação
    checkAutomation();

    // CSS de proteção
    const style = document.createElement("style");
    style.id = "sanctum-protection-css";
    style.textContent = `
      .sanctum-protected {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-user-drag: none !important;
      }
      .sanctum-protected img {
        pointer-events: none !important;
        -webkit-user-drag: none !important;
      }
      @media print {
        .sanctum-protected {
          display: none !important;
          visibility: hidden !important;
        }
        body::before {
          content: "Impressão não autorizada - Prof. Moisés Medeiros";
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 2rem;
          color: red;
          z-index: 999999;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("copy", onCopy, true);
      document.removeEventListener("cut", onCopy, true);
      document.removeEventListener("dragstart", onDragStart, true);
      document.removeEventListener("selectstart", onSelectStart, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(devToolsInterval);
      
      const existingStyle = document.getElementById("sanctum-protection-css");
      if (existingStyle) existingStyle.remove();
    };
  }, [
    isOwner,
    onKeyDown,
    onContextMenu,
    onCopy,
    onDragStart,
    onSelectStart,
    onVisibilityChange,
    checkDevTools,
    checkAutomation,
  ]);

  // ============================================
  // RETORNO DO HOOK
  // ============================================
  return {
    isLocked,
    riskScore,
    isOwner,
    sessionId: sessionId.current,
    bump,
    getCount,
    resetCounter,
    reportViolation,
    punish,
  };
}

// ============================================
// EXPORTS
// ============================================
export default useSanctumCore;
