// ============================================
// ⚡ MATRIZ DIGITAL - APP CORE v5.2 ⚡
// ULTRA PERFORMANCE 3G - 5000 usuários simultâneos
// 🛡️ Evangelho da Segurança v2.0 Integrado
// 🛡️ DOGMA XI: Controle de Dispositivos
// ⚡ PERFORMANCE PROVIDER INTEGRADO
// 📍 ROTAS MODULARIZADAS (v5.2)
// ============================================

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/styles/performance.css"; // ⚡ ULTRA PERFORMANCE CSS
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GodModeProvider } from "@/contexts/GodModeContext";
import { DuplicationClipboardProvider } from "@/contexts/DuplicationClipboardContext";
import { ReactiveFinanceProvider } from "@/contexts/ReactiveFinanceContext";
import { LiveSheetProvider } from "@/contexts/LiveSheetContext";
import { VisualEditMode } from "@/components/editor/VisualEditMode";
import { SessionTracker } from "@/components/SessionTracker";
import { KeyboardShortcutsOverlay } from "@/components/onboarding/KeyboardShortcutsOverlay";
import { DuplicationClipboardIndicator } from "@/components/admin/DuplicationClipboardIndicator";
import { SessionGuard } from "@/components/security/SessionGuard";
import { DeviceGuard } from "@/components/security/DeviceGuard";
import { LeiVIIEnforcer } from "@/components/security/LeiVIIEnforcer";
import { LegacyRedirectHandler } from "@/components/routing/LegacyRedirectHandler";
import { Suspense, lazy, useState, useEffect, memo, useCallback } from "react";
import { useGlobalDevToolsBlock } from "@/hooks/useGlobalDevToolsBlock";
import { PerformanceProvider, PerformanceStyles } from "@/components/performance/PerformanceProvider";

// ⚡ DOGMA V: QueryClient otimizado com cache sagrado
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

// 🚀 TTI OPTIMIZATION: Lazy load heavy components
const LazyAITramon = lazy(() => import("@/components/ai/AITramonGlobal").then(m => ({ default: m.AITramonGlobal })));
const LazyGodModePanel = lazy(() => import("@/components/editor/GodModePanel").then(m => ({ default: m.GodModePanel })));
const LazyInlineEditor = lazy(() => import("@/components/editor/InlineEditor").then(m => ({ default: m.InlineEditor })));
const LazyMasterQuickAddMenu = lazy(() => import("@/components/admin/MasterQuickAddMenu").then(m => ({ default: m.MasterQuickAddMenu })));
const LazyGlobalDuplication = lazy(() => import("@/components/admin/GlobalDuplicationSystem").then(m => ({ default: m.GlobalDuplicationSystem })));
const LazyMasterUndoIndicator = lazy(() => import("@/components/admin/MasterUndoIndicator").then(m => ({ default: m.MasterUndoIndicator })));
const LazyMasterDeleteOverlay = lazy(() => import("@/components/admin/MasterDeleteOverlay").then(m => ({ default: m.MasterDeleteOverlay })));
const LazyMasterContextMenu = lazy(() => import("@/components/admin/MasterContextMenu").then(m => ({ default: m.MasterContextMenu })));

// ⚡ DOGMA V: QueryClient Sagrado com cache otimizado
const queryClient = createSacredQueryClient();

// Listener global para limpeza de cache
if (typeof window !== 'undefined') {
  window.addEventListener('mm-clear-cache', () => {
    queryClient.clear();
    queryClient.invalidateQueries();
    console.log('[MATRIZ] 🧹 Cache purificado');
  });
  
  // 🚀 PREFETCH: Carregar componentes pesados após TTI
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      // Prefetch componentes de admin após idle
      import("@/components/ai/AITramonGlobal").catch(() => {});
      import("@/components/editor/GodModePanel").catch(() => {});
    }, { timeout: 5000 });
  }
}

// Global keyboard shortcuts hook - optimized
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

// App Content - memoized for performance
const AppContent = memo(() => {
  const { isOpen, setIsOpen } = useGlobalShortcutsOverlay();
  useGlobalDevToolsBlock();

  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <>
      {/* 🛡️ DOGMA I: Guarda de Sessão Única */}
      <SessionGuard>
        {/* 🛡️ DOGMA XI: Guarda de Limite de Dispositivos */}
        <DeviceGuard>
          <SessionTracker />
      
      {/* Heavy components - deferred loading */}
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
      
      {/* AI TRAMON - Lazy loaded */}
      <Suspense fallback={null}>
        <LazyAITramon />
      </Suspense>
      
      {/* Routes with optimized Suspense - MODULARIZADAS */}
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

// ⚡ App Principal - Estrutura de providers otimizada + PERFORMANCE PROVIDER + LEI VII
const App = memo(() => (
  <PerformanceProvider>
    <PerformanceStyles />
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* 🛡️ LEI VII - Proteção de Conteúdo Soberana (GLOBAL) */}
        <LeiVIIEnforcer>
          <LiveSheetProvider>
            <ReactiveFinanceProvider>
              <GodModeProvider>
                <DuplicationClipboardProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <LegacyRedirectHandler />
                      <AppContent />
                      <DuplicationClipboardIndicator />
                    </BrowserRouter>
                  </TooltipProvider>
                </DuplicationClipboardProvider>
              </GodModeProvider>
            </ReactiveFinanceProvider>
          </LiveSheetProvider>
        </LeiVIIEnforcer>
      </AuthProvider>
    </QueryClientProvider>
  </PerformanceProvider>
));
App.displayName = 'App';

export default App;
