// ============================================
// ⚡ MATRIZ DIGITAL - APP CORE v5.3 ⚡
// ULTRA PERFORMANCE 3G - 5000 usuários simultâneos
// 🛡️ Evangelho da Segurança v2.0 Integrado
// 📍 ROTAS MODULARIZADAS + AppProviders
// ============================================

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import "@/styles/performance.css";
import { QueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes } from "react-router-dom";
import { VisualEditMode } from "@/components/editor/VisualEditMode";
// SessionTracker REMOVIDO - heartbeat já existe em useAuth (DOGMA I)
import { KeyboardShortcutsOverlay } from "@/components/onboarding/KeyboardShortcutsOverlay";
import { DuplicationClipboardIndicator } from "@/components/admin/DuplicationClipboardIndicator";
import { SessionGuard } from "@/components/security/SessionGuard";
import { DeviceGuard } from "@/components/security/DeviceGuard";
import { DeviceMFAGuard } from "@/components/security/DeviceMFAGuard";
import { GestaoNoIndex } from "@/components/seo/GestaoNoIndex";
import { LegacyRedirectHandler } from "@/components/routing/LegacyRedirectHandler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ManualRefreshButton } from "@/components/admin/ManualRefreshButton";
import { P0AliveBeacon } from "@/components/debug/P0AliveBeacon";
// LegacyDomainBlocker REMOVIDO - domínio gestao.* descontinuado
import { Suspense, lazy, useState, useEffect, memo, useCallback } from "react";
import { useGlobalDevToolsBlock } from "@/hooks/useGlobalDevToolsBlock";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// ⚡ PROVIDERS CONSOLIDADOS
import { AppProviders } from "@/contexts/AppProviders";
import { createSacredQueryClient } from "@/lib/performance/cacheConfig";

// 📍 ROTAS MODULARIZADAS
import { 
  publicRoutes, 
  comunidadeRoutes, 
  gestaoRoutes, 
  alunoRoutes, 
  legacyRoutes,
  PageLoader 
} from "@/routes";

// 🚀 LAZY LOAD: Componentes pesados
// P0: Evitar "Component is not a function" por mismatch entre export default vs named export.
// Regra: tenta named export primeiro, depois cai para default.
const LazyAITramon = lazy(() => import("@/components/ai/AITramonGlobal").then((m: any) => ({ default: m.AITramonGlobal ?? m.default })));
const LazyGlobalLogsButton = lazy(() => import("@/components/admin/GlobalLogsButton").then((m: any) => ({ default: m.GlobalLogsButton ?? m.default })));
const LazyGodModePanel = lazy(() => import("@/components/editor/GodModePanel").then((m: any) => ({ default: m.GodModePanel ?? m.default })));
const LazyInlineEditor = lazy(() => import("@/components/editor/InlineEditor").then((m: any) => ({ default: m.InlineEditor ?? m.default })));
const LazyMasterQuickAddMenu = lazy(() => import("@/components/admin/MasterQuickAddMenu").then((m: any) => ({ default: m.MasterQuickAddMenu ?? m.default })));
const LazyGlobalDuplication = lazy(() => import("@/components/admin/GlobalDuplicationSystem").then((m: any) => ({ default: m.GlobalDuplicationSystem ?? m.default })));
const LazyMasterUndoIndicator = lazy(() => import("@/components/admin/MasterUndoIndicator").then((m: any) => ({ default: m.MasterUndoIndicator ?? m.default })));
const LazyMasterDeleteOverlay = lazy(() => import("@/components/admin/MasterDeleteOverlay").then((m: any) => ({ default: m.MasterDeleteOverlay ?? m.default })));
const LazyMasterContextMenu = lazy(() => import("@/components/admin/MasterContextMenu").then((m: any) => ({ default: m.MasterContextMenu ?? m.default })));
// 🆕 TRANSACTIONAL SAVE SYSTEM
const LazyGlobalSaveBar = lazy(() => import("@/components/admin/GlobalSaveBar").then((m: any) => ({ default: m.GlobalSaveBar ?? m.default })));
const LazyNavigationGuard = lazy(() => import("@/components/admin/MasterModeNavigationGuard").then((m: any) => ({ default: m.MasterModeNavigationGuard ?? m.default })));
const LazyRealtimeEditOverlay = lazy(() => import("@/components/admin/RealtimeEditOverlay").then((m: any) => ({ default: m.RealtimeEditOverlay ?? m.default })));

// ⚡ QueryClient Sagrado
// P0: nunca pode quebrar o bootstrap. Se falhar, usa client básico.
const queryClient = (() => {
  try {
    return createSacredQueryClient();
  } catch (err) {
    console.warn('[P0] createSacredQueryClient falhou — usando QueryClient padrão:', (err as Error)?.message || String(err));
    return new QueryClient();
  }
})();


// Listener global + prefetch
if (typeof window !== 'undefined') {
  // ============================================
  // 🧾 FORENSIC FATAL LOGGER (P0)
  // Captura erros fatais (production) para diagnóstico de "tela preta"
  // Sem secrets no client: usa invoke() com token do usuário quando existir
  // ============================================
  if (!(window as any).__fatalLoggerInstalled) {
    (window as any).__fatalLoggerInstalled = true;

    let lastSentAt = 0;
    const shouldSend = () => {
      const now = Date.now();
      if (now - lastSentAt < 1500) return false;
      lastSentAt = now;
      return true;
    };

    const safeString = (v: unknown) => {
      try {
        if (v instanceof Error) return `${v.name}: ${v.message}\n${v.stack || ''}`.trim();
        if (typeof v === 'string') return v;
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    };

    const send = (payload: Record<string, unknown>) => {
      if (!shouldSend()) return;
      supabase.functions
        .invoke('log-writer', {
          body: {
            timestamp: new Date().toISOString(),
            severity: 'error',
            triggered_action: 'fatal_runtime_error',
            affected_url_or_area: typeof window !== 'undefined' ? window.location.href : 'unknown',
            error_message: safeString(payload),
          },
        })
        .catch(() => {
          // no-op: nunca bloquear render
        });
    };

    window.addEventListener('error', (event) => {
      send({
        type: 'window.error',
        message: event.message,
        filename: (event as any).filename,
        lineno: (event as any).lineno,
        colno: (event as any).colno,
        error: safeString((event as any).error),
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      send({
        type: 'window.unhandledrejection',
        reason: safeString((event as any).reason),
      });
    });
  }

  window.addEventListener('mm-clear-cache', () => {
    queryClient.clear();
    queryClient.invalidateQueries();
  });
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      import("@/components/ai/AITramonGlobal").catch(() => {});
      import("@/components/editor/GodModePanel").catch(() => {});
    }, { timeout: 5000 });
  }
}

// Hook para overlay de atalhos
function useGlobalShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}

// AppContent - UMA ÚNICA instância de Routes
// 🛡️ P0: Sem memo() para evitar erros de forwardRef com Radix UI
function AppContent() {
  const { isOpen, setIsOpen } = useGlobalShortcutsOverlay();
  useGlobalDevToolsBlock();

  // 🛡️ P0 anti-tela-preta: overlays globais só podem existir para o OWNER.
  // Isso garante que um crash em ferramentas internas NÃO derrube /alunos (nem login) para alunos.
  const { user, role } = useAuth();
  const isOwner = (role === 'owner') || ((user?.email || '').toLowerCase() === 'moisesblank@gmail.com');

  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <>
      <P0AliveBeacon />
      <SessionGuard>
        <DeviceGuard>
          <DeviceMFAGuard>
            {/* SessionTracker REMOVIDO - useAuth já gerencia heartbeat (DOGMA I) */}

            {/* 🔥 P0: Overlays do OWNER dentro de ErrorBoundary dedicado */}
            {isOwner && (
              <ErrorBoundary>
                <Suspense fallback={null}>
                  <LazyGodModePanel />
                  <LazyInlineEditor />
                  <LazyMasterQuickAddMenu />
                  <LazyGlobalDuplication />
                  <LazyMasterUndoIndicator />
                  <LazyMasterDeleteOverlay />
                  <LazyMasterContextMenu />
                  {/* 🆕 BARRA DE SALVAMENTO GLOBAL + GUARD DE NAVEGAÇÃO */}
                  <LazyGlobalSaveBar />
                  <LazyNavigationGuard />
                  <LazyRealtimeEditOverlay />
                </Suspense>
              </ErrorBoundary>
            )}

            <VisualEditMode />
            <KeyboardShortcutsOverlay isOpen={isOpen} onClose={handleClose} />

            {/* 🔴 BOTÕES FLUTUANTES GLOBAIS (OWNER ONLY) */}
            {isOwner && (
              <ErrorBoundary>
                <Suspense fallback={null}>
                  <LazyGlobalLogsButton />
                  <LazyAITramon />
                </Suspense>
              </ErrorBoundary>
            )}

            {/* ✅ RECOVERY MANUAL: botão sempre visível (NUNCA auto-reload) */}
            <ManualRefreshButton />

            {/* 🛡️ P0: Nunca mais tela preta - ErrorBoundary global envolvendo as rotas */}
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {publicRoutes}
                  {comunidadeRoutes}
                  {gestaoRoutes}
                  {alunoRoutes}
                  {legacyRoutes}
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </DeviceMFAGuard>
        </DeviceGuard>
      </SessionGuard>
    </>
  );
}

// ⚡ App Principal com Providers Consolidados
// 🛡️ P0: Sem memo() para evitar erros de forwardRef
function App() {
  return (
    <AppProviders queryClient={queryClient}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GestaoNoIndex />
        <LegacyRedirectHandler />
        <AppContent />
        <DuplicationClipboardIndicator />
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
