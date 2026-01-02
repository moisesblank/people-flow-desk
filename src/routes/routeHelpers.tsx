// ============================================
// 🛠️ ROUTE HELPERS
// Componentes compartilhados para rotas
// ============================================

import { memo, useEffect, useState } from "react";
import { RoleProtectedRoute } from "@/components/layout/RoleProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

// Protected route wrapper - memoized
export const ProtectedPage = memo(({ children }: { children: React.ReactNode }) => (
  <RoleProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </RoleProtectedRoute>
));
ProtectedPage.displayName = 'ProtectedPage';

// Ultra-fast loading - CSS only, minimal DOM
// P0 anti-tela-preta: se o carregamento travar, mostramos ação de recuperação.
export const PageLoader = memo(() => {
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setIsStuck(true), 12_000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <div className="h-7 w-7 border-2 border-foreground/60 border-t-transparent rounded-full animate-spin" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Carregando…</p>
          <p className="text-xs text-muted-foreground">
            Preparando a página e validando permissões.
          </p>
        </div>

        {isStuck && (
          <div className="pt-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Isso está demorando mais que o normal.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button size="sm" onClick={() => window.location.reload()}>
                Recarregar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.dispatchEvent(new Event('mm-clear-cache'))}
              >
                Limpar cache
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
PageLoader.displayName = 'PageLoader';
