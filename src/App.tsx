// ============================================
// ⚡ MATRIZ DIGITAL - APP CORE v5.3 ⚡
// ULTRA PERFORMANCE 3G - 5000 usuários simultâneos
// 🛡️ Evangelho da Segurança v2.0 Integrado
// 📍 ROTAS MODULARIZADAS + AppProviders
// ============================================

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import "@/styles/performance.css";
import { BrowserRouter, Routes } from "react-router-dom";
import { VisualEditMode } from "@/components/editor/VisualEditMode";
import { SessionTracker } from "@/components/SessionTracker";
import { KeyboardShortcutsOverlay } from "@/components/onboarding/KeyboardShortcutsOverlay";
import { DuplicationClipboardIndicator } from "@/components/admin/DuplicationClipboardIndicator";
import { SessionGuard } from "@/components/security/SessionGuard";
import { DeviceGuard } from "@/components/security/DeviceGuard";
import { GestaoNoIndex } from "@/components/seo/GestaoNoIndex";
import { LegacyRedirectHandler } from "@/components/routing/LegacyRedirectHandler";
// LegacyDomainBlocker REMOVIDO - domínio gestao.* descontinuado
import { Suspense, lazy, useState, useEffect, memo, useCallback } from "react";
import { useGlobalDevToolsBlock } from "@/hooks/useGlobalDevToolsBlock";

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
const LazyAITramon = lazy(() => import("@/components/ai/AITramonGlobal").then(m => ({ default: m.AITramonGlobal })));
const LazyGodModePanel = lazy(() => import("@/components/editor/GodModePanel").then(m => ({ default: m.GodModePanel })));
const LazyInlineEditor = lazy(() => import("@/components/editor/InlineEditor").then(m => ({ default: m.InlineEditor })));
const LazyMasterQuickAddMenu = lazy(() => import("@/components/admin/MasterQuickAddMenu").then(m => ({ default: m.MasterQuickAddMenu })));
const LazyGlobalDuplication = lazy(() => import("@/components/admin/GlobalDuplicationSystem").then(m => ({ default: m.GlobalDuplicationSystem })));
const LazyMasterUndoIndicator = lazy(() => import("@/components/admin/MasterUndoIndicator").then(m => ({ default: m.MasterUndoIndicator })));
const LazyMasterDeleteOverlay = lazy(() => import("@/components/admin/MasterDeleteOverlay").then(m => ({ default: m.MasterDeleteOverlay })));
const LazyMasterContextMenu = lazy(() => import("@/components/admin/MasterContextMenu").then(m => ({ default: m.MasterContextMenu })));

// ⚡ QueryClient Sagrado
const queryClient = createSacredQueryClient();

// Listener global + prefetch
if (typeof window !== 'undefined') {
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

// AppContent memoizado
const AppContent = memo(() => {
  const { isOpen, setIsOpen } = useGlobalShortcutsOverlay();
  useGlobalDevToolsBlock();

  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <>
      <SessionGuard>
        <DeviceGuard>
          <SessionTracker />
          
          <Suspense fallback={null}>
            <LazyGodModePanel />
            <LazyInlineEditor />
            <LazyMasterQuickAddMenu />
            <LazyGlobalDuplication />
            <LazyMasterUndoIndicator />
            <LazyMasterDeleteOverlay />
            <LazyMasterContextMenu />
          </Suspense>
          
          <VisualEditMode />
          <KeyboardShortcutsOverlay isOpen={isOpen} onClose={handleClose} />
          
          <Suspense fallback={null}>
            <LazyAITramon />
          </Suspense>
          
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {publicRoutes}
              {comunidadeRoutes}
              {gestaoRoutes}
              {alunoRoutes}
              {legacyRoutes}
            </Routes>
          </Suspense>
        </DeviceGuard>
      </SessionGuard>
    </>
  );
});
AppContent.displayName = 'AppContent';

// ⚡ App Principal com Providers Consolidados
const App = memo(() => (
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
));
App.displayName = 'App';

export default App;
