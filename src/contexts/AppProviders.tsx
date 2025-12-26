// ============================================
// 🎯 APP PROVIDERS - Providers Consolidados
// Centraliza todos os providers do App.tsx
// Melhora manutenção e reduz aninhamento
// ============================================

import { ReactNode } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { GodModeProvider } from "@/contexts/GodModeContext";
import { DuplicationClipboardProvider } from "@/contexts/DuplicationClipboardContext";
import { ReactiveFinanceProvider } from "@/contexts/ReactiveFinanceContext";
import { LiveSheetProvider } from "@/contexts/LiveSheetContext";
import { LeiVIIEnforcer } from "@/components/security/LeiVIIEnforcer";
import { PerformanceProvider, PerformanceStyles } from "@/components/performance/PerformanceProvider";

interface AppProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
}

/**
 * AppProviders - Componente que engloba todos os providers
 * 
 * Ordem dos providers (de fora para dentro):
 * 1. PerformanceProvider - Otimizações globais
 * 2. QueryClientProvider - React Query
 * 3. AuthProvider - Autenticação
 * 4. LeiVIIEnforcer - Proteção de conteúdo
 * 5. LiveSheetProvider - Planilhas em tempo real
 * 6. ReactiveFinanceProvider - Finanças reativas
 * 7. GodModeProvider - Modo admin
 * 8. DuplicationClipboardProvider - Clipboard de duplicação
 * 9. TooltipProvider - Tooltips
 */
export function AppProviders({ children, queryClient }: AppProvidersProps) {
  return (
    <PerformanceProvider>
      <PerformanceStyles />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LeiVIIEnforcer>
            <LiveSheetProvider>
              <ReactiveFinanceProvider>
                <GodModeProvider>
                  <DuplicationClipboardProvider>
                    <TooltipProvider>
                      {children}
                    </TooltipProvider>
                  </DuplicationClipboardProvider>
                </GodModeProvider>
              </ReactiveFinanceProvider>
            </LiveSheetProvider>
          </LeiVIIEnforcer>
        </AuthProvider>
      </QueryClientProvider>
    </PerformanceProvider>
  );
}

export default AppProviders;
