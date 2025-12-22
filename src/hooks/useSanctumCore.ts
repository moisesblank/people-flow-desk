// ============================================
// 🌌 SANCTUM CORE HOOK — SENTINELA DE SEGURANÇA
// Detecta violações e reporta ao backend
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SanctumContext {
  resourceId: string;
  resourceType: "pdf" | "web_text" | "image" | "video";
}

interface Threat {
  type: string;
  severity: number;
  meta?: Record<string, unknown>;
}

const OWNER_EMAIL = "moisesblank@gmail.com";

export function useSanctumCore(ctx: SanctumContext) {
  const { profile, session, signOut } = useAuth();
  const isOwner = profile?.role === "owner" || profile?.email?.toLowerCase() === OWNER_EMAIL;
  const counters = useRef<Record<string, number>>({});
  const lastSend = useRef<number>(0);

  // Incrementar contador de tentativas
  const bump = useCallback((k: string, add = 1) => {
    counters.current[k] = (counters.current[k] ?? 0) + add;
    return counters.current[k];
  }, []);

  // Reportar violação ao backend
  const reportViolation = useCallback(async (t: Threat) => {
    const now = Date.now();
    if (now - lastSend.current < 500) return; // Rate limit
    lastSend.current = now;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sanctum-report-violation`,
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
            metadata: { ...t.meta, resourceType: ctx.resourceType }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Se foi bloqueado, fazer logout
        if (data?.locked) {
          toast.error("Sua conta foi temporariamente bloqueada por atividade suspeita.");
          await signOut();
        }
      }
    } catch (err) {
      console.error("[Sanctum] Erro ao reportar:", err);
    }
  }, [ctx.resourceId, ctx.resourceType, session?.access_token, signOut]);

  // Punir (logout forçado)
  const punish = useCallback(async (severity: number, reason: string) => {
    if (isOwner) return;
    await reportViolation({ type: "sanctum_punish", severity, meta: { reason } });
    toast.error("Atividade suspeita detectada. Você será desconectado.");
    await signOut();
  }, [isOwner, reportViolation, signOut]);

  // Handler de keydown
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (isOwner) return;

    const k = e.key.toLowerCase();
    const isCtrl = e.ctrlKey || e.metaKey;

    // DevTools keys
    const devtools =
      e.key === "F12" ||
      (isCtrl && e.shiftKey && ["i", "j", "c"].includes(k)) ||
      (isCtrl && ["u", "s"].includes(k));

    // Print
    const print = isCtrl && k === "p";

    // Copy
    const copy = isCtrl && ["c", "x", "a"].includes(k);

    if (devtools || print || copy) {
      e.preventDefault();
      e.stopPropagation();

      const type = devtools ? "devtools_key_attempt" : print ? "print_shortcut_attempt" : "copy_shortcut_attempt";
      const sev = devtools ? 35 : print ? 30 : 25;
      const n = bump(type);

      void reportViolation({ type, severity: sev, meta: { count: n, key: k } });

      if (n >= 50) void punish(95, `${type}>=50`);
    }
  }, [isOwner, bump, reportViolation, punish]);

  // Handler de context menu
  const onContextMenu = useCallback((e: Event) => {
    if (isOwner) return;
    e.preventDefault();
    const n = bump("contextmenu_blocked");
    void reportViolation({ type: "contextmenu_blocked", severity: 10, meta: { count: n } });
    if (n >= 50) void punish(90, "contextmenu>=50");
  }, [isOwner, bump, reportViolation, punish]);

  // Handler de copy
  const onCopy = useCallback((e: ClipboardEvent) => {
    if (isOwner) return;
    e.preventDefault();
    e.clipboardData?.setData("text/plain", "");
    const n = bump("copy_event_blocked");
    void reportViolation({ type: "copy_event_blocked", severity: 20, meta: { count: n } });
    if (n >= 50) void punish(92, "copy_event>=50");
  }, [isOwner, bump, reportViolation, punish]);

  // Heurística de DevTools (diferença de tamanho da janela)
  const devtoolsHeuristic = useCallback(() => {
    if (isOwner) return;
    const w = Math.abs(window.outerWidth - window.innerWidth);
    const h = Math.abs(window.outerHeight - window.innerHeight);
    if (w > 160 || h > 160) {
      const n = bump("devtools_probable");
      void reportViolation({ type: "devtools_probable", severity: 55, meta: { count: n, w, h } });
      if (n >= 3) void punish(80, "devtools_probable_repeat");
    }
  }, [isOwner, bump, reportViolation, punish]);

  // Registrar superfície protegida (log de acesso)
  const registerProtectedSurface = useCallback(() => {
    void reportViolation({ 
      type: "protected_surface_opened", 
      severity: 0, 
      meta: { path: window.location.pathname } 
    });
  }, [reportViolation]);

  // Setup de listeners
  useEffect(() => {
    if (!profile || isOwner) return;

    // Detectar automação (Selenium, Puppeteer, etc.)
    if ((navigator as unknown as { webdriver?: boolean }).webdriver) {
      void reportViolation({ type: "automation_webdriver", severity: 95 });
      void punish(95, "navigator.webdriver");
    }

    // Event listeners
    window.addEventListener("keydown", onKeyDown, { capture: true });
    document.addEventListener("contextmenu", onContextMenu, { capture: true });
    document.addEventListener("copy", onCopy, { capture: true });

    // MutationObserver para detectar tampering no DOM
    const observer = new MutationObserver((mutations) => {
      const n = bump("dom_mutation", mutations.length);
      if (n >= 50) {
        void reportViolation({ type: "dom_mutation_detected", severity: 15, meta: { count: n } });
      }
      if (n >= 100) void punish(85, "dom_mutation>=100");
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Intervalo para heurística de devtools
    const interval = setInterval(devtoolsHeuristic, 2000);

    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      document.removeEventListener("contextmenu", onContextMenu, { capture: true });
      document.removeEventListener("copy", onCopy, { capture: true });
      observer.disconnect();
      clearInterval(interval);
    };
  }, [profile, isOwner, onKeyDown, onContextMenu, onCopy, devtoolsHeuristic, reportViolation, punish, bump]);

  return { 
    registerProtectedSurface, 
    isOwner,
    reportViolation 
  };
}

export default useSanctumCore;
