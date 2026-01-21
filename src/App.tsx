// ============================================
// ⚡ MATRIZ DIGITAL - APP CORE v5.3 ⚡
// ULTRA PERFORMANCE 3G - 5000 usuários simultâneos
// 🛡️ Evangelho da Segurança v2.0 Integrado
// 📍 ROTAS MODULARIZADAS + AppProviders
// ============================================

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import "@/styles/performance.css";
import "@/styles/optimized-animations.css";
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
import { P0AliveBeacon } from "@/components/debug/P0AliveBeacon";
// LegacyDomainBlocker REMOVIDO - domínio gestao.* descontinuado
import { Suspense, lazy, useState, useEffect, memo, useCallback } from "react";
import { useGlobalDevToolsBlock } from "@/hooks/useGlobalDevToolsBlock";
// 🔄 FORCE REFRESH AUTOMÁTICO - Quando admin publica, alunos recebem refresh
import { useAppVersionCheck } from "@/hooks/useAppVersionCheck";
// 🚨 BLACKOUT ANTI-PIRATARIA v1.1 - PROTEÇÃO GLOBAL
import { SecurityBlackoutOverlay } from "@/components/security/SecurityBlackoutOverlay";

// ⚡ PROVIDERS CONSOLIDADOS
import { AppProviders } from "@/contexts/AppProviders";
import { createSacredQueryClient } from "@/lib/performance/cacheConfig";

// 🔒 OWNER GUARD — execução global dentro do Router
import { OwnerGuardBootstrap } from "@/owner-guard";

// 📍 ROTAS MODULARIZADAS
import { publicRoutes, comunidadeRoutes, gestaoRoutes, alunoRoutes, legacyRoutes, PageLoader } from "@/routes";

// 🚀 LAZY LOAD: Componentes pesados
const LazyAITramon = lazy(() => import("@/components/ai/AITramonGlobal").then((m) => ({ default: m.AITramonGlobal })));
const LazyGlobalLogsButton = lazy(() =>
  import("@/components/admin/GlobalLogsButton").then((m) => ({ default: m.GlobalLogsButton })),
);
const LazyGodModePanel = lazy(() =>
  import("@/components/editor/GodModePanel").then((m) => ({ default: m.GodModePanel })),
);
const LazyInlineEditor = lazy(() =>
  import("@/components/editor/InlineEditor").then((m) => ({ default: m.InlineEditor })),
);
const LazyMasterQuickAddMenu = lazy(() =>
  import("@/components/admin/MasterQuickAddMenu").then((m) => ({ default: m.MasterQuickAddMenu })),
);
const LazyGlobalDuplication = lazy(() =>
  import("@/components/admin/GlobalDuplicationSystem").then((m) => ({ default: m.GlobalDuplicationSystem })),
);
const LazyMasterUndoIndicator = lazy(() =>
  import("@/components/admin/MasterUndoIndicator").then((m) => ({ default: m.MasterUndoIndicator })),
);
const LazyMasterDeleteOverlay = lazy(() =>
  import("@/components/admin/MasterDeleteOverlay").then((m) => ({ default: m.MasterDeleteOverlay })),
);
const LazyMasterContextMenu = lazy(() =>
  import("@/components/admin/MasterContextMenu").then((m) => ({ default: m.MasterContextMenu })),
);
// 🆕 TRANSACTIONAL SAVE SYSTEM
const LazyGlobalSaveBar = lazy(() =>
  import("@/components/admin/GlobalSaveBar").then((m) => ({ default: m.GlobalSaveBar })),
);
const LazyNavigationGuard = lazy(() =>
  import("@/components/admin/MasterModeNavigationGuard").then((m) => ({ default: m.MasterModeNavigationGuard })),
);
const LazyRealtimeEditOverlay = lazy(() =>
  import("@/components/admin/RealtimeEditOverlay").then((m) => ({ default: m.RealtimeEditOverlay })),
);

// ⚡ QueryClient Sagrado
const queryClient = createSacredQueryClient();

// Listener global + prefetch
if (typeof window !== "undefined") {
  window.addEventListener("mm-clear-cache", () => {
    queryClient.clear();
    queryClient.invalidateQueries();
  });

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(
      () => {
        import("@/components/ai/AITramonGlobal").catch(() => {});
        import("@/components/editor/GodModePanel").catch(() => {});
      },
      { timeout: 5000 },
    );
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
          setIsOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}

// AppContent memoizado
const AppContent = memo(() => {
  const { isOpen, setIsOpen } = useGlobalShortcutsOverlay();
  useGlobalDevToolsBlock();
  
  // 🔄 FORCE REFRESH: Escuta mudanças de versão e faz refresh automático para alunos
  useAppVersionCheck();

  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <>
      {/* 🚨 BLACKOUT ANTI-PIRATARIA v1.1 - GLOBAL */}
      <SecurityBlackoutOverlay />
      
      <SessionGuard>
        <DeviceGuard>
          <DeviceMFAGuard>
            {/* SessionTracker REMOVIDO - useAuth já gerencia heartbeat (DOGMA I) */}

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

            <VisualEditMode />
            <KeyboardShortcutsOverlay isOpen={isOpen} onClose={handleClose} />

            {/* 🔴 BOTÕES FLUTUANTES GLOBAIS: LOGS + TRAMON */}
            <ErrorBoundary>
              <Suspense fallback={null}>
                <LazyGlobalLogsButton />
                <LazyAITramon />
              </Suspense>
            </ErrorBoundary>

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
});
AppContent.displayName = "AppContent";

// ⚡ App Principal com Providers Consolidados
const App = memo(() => (
  <AppProviders queryClient={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <OwnerGuardBootstrap />
      <GestaoNoIndex />
      <LegacyRedirectHandler />
      <P0AliveBeacon />
      <AppContent />
      <DuplicationClipboardIndicator />
    </BrowserRouter>
  </AppProviders>
));
App.displayName = "App";

export default App;
