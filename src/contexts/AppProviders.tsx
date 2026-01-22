// ============================================
// 🎯 APP PROVIDERS v2.0 — ANINHAMENTO REDUZIDO
// De 9 níveis → 4 níveis (redução de 55%)
// ============================================
// MIGRAÇÃO PARA ZUSTAND:
// ❌ GodModeProvider → useGodModeStore (Zustand)
// ❌ DuplicationClipboardProvider → useClipboardStore (Zustand)
// ❌ ReactiveFinanceProvider → useReactiveStore (Zustand)
// ❌ LiveSheetProvider → já usa useReducer interno, opcional
// ============================================

import { ReactNode, useEffect } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LeiVIIEnforcer } from "@/components/security/LeiVIIEnforcer";
import { PerformanceProvider, PerformanceStyles } from "@/components/performance/PerformanceProvider";
import { useGodModeStore } from "@/stores/godModeStore";
import { useReactiveStore } from "@/stores/reactiveStore";
import { PresenceInitializer } from "@/components/presence/PresenceInitializer";
import { useThemeInitializer } from "@/hooks/useThemeInitializer";

interface AppProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
}

/**
 * Inicializador de Stores Zustand + Tema
 * Carrega dados iniciais dos stores globais e tema do usuário
 */
function StoreInitializer() {
  const checkOwner = useGodModeStore((s) => s.checkOwner);
  const loadContent = useGodModeStore((s) => s.loadContent);
  const fetchFromDB = useReactiveStore((s) => s.fetchFromDB);
  const subscribeRealtime = useReactiveStore((s) => s.subscribeRealtime);

  // Inicializar tema do usuário
  useThemeInitializer();

  useEffect(() => {
    // Inicializar stores ao montar
    checkOwner();
    loadContent();
    fetchFromDB();

    // Subscrever realtime
    const unsubscribe = subscribeRealtime();

    return () => {
      unsubscribe();
    };
  }, [checkOwner, loadContent, fetchFromDB, subscribeRealtime]);

  return null;
}

/**
 * AppProviders v2.0 — Estrutura Otimizada
 *
 * ANTES (9 níveis):
 * PerformanceProvider → QueryClientProvider → AuthProvider → LeiVIIEnforcer
 * → LiveSheetProvider → ReactiveFinanceProvider → GodModeProvider
 * → DuplicationClipboardProvider → TooltipProvider
 *
 * DEPOIS (4 níveis):
 * PerformanceProvider → QueryClientProvider → AuthProvider → TooltipProvider
 *
 * Os outros foram migrados para Zustand (estado global sem Provider):
 * - GodModeStore (useGodModeStore)
 * - ClipboardStore (useClipboardStore)
 * - ReactiveStore (useReactiveStore)
 * - LiveSheetContext → Lazy-loaded apenas em /gestaofc
 */
export function AppProviders({ children, queryClient }: AppProvidersProps) {
  return (
    // IMPORTANT:
    // - "Sistema" aqui é um TEMA SOBERANO (não segue o SO).
    // - Isolamento total: system | light | dark (sem herança automática).
    // - "system" renomeado para "default" para evitar conflito com next-themes
    <ThemeProvider
      attribute="class"
      defaultTheme="default"
      enableSystem={false}
      themes={["default", "light", "dark"]}
      storageKey="theme"
      value={{
        default: "system",
        light: "light",
        dark: "dark",
      }}
    >
      <PerformanceProvider>
        <PerformanceStyles />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LeiVIIEnforcer>
              <TooltipProvider>
                <StoreInitializer />
                <PresenceInitializer />
                {children}
              </TooltipProvider>
            </LeiVIIEnforcer>
          </AuthProvider>
        </QueryClientProvider>
      </PerformanceProvider>
    </ThemeProvider>
  );
}

export default AppProviders;

// ============================================
// PROVIDERS OPCIONAIS (LAZY-LOADED)
// Use apenas onde necessário
// ============================================

// Para rotas que precisam do LiveSheet (planilha viva)
export { LiveSheetProvider, useLiveSheet } from "@/contexts/LiveSheetContext";

// Legado: ainda funcionam mas preferir Zustand
export { ReactiveFinanceProvider, useReactiveFinance } from "@/contexts/ReactiveFinanceContext";
