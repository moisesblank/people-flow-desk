// ============================================
// 🛠️ ROUTE HELPERS
// Componentes compartilhados para rotas
// P0 FIX: Removido memo de ProtectedPage para evitar warnings de refs
// ============================================

import { useEffect, useState, memo } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Protected route wrapper
// ✅ RESTAURADO: ProtectedRoute faz redirect para /auth se não autenticado
// 🔧 P0 FIX: SEM memo() para evitar warnings "Function components cannot be given refs"
export function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

// Ultra-fast loading - CSS only, minimal DOM
// P0 anti-tela-preta: se o carregamento travar, mostramos ação de recuperação.
export const PageLoader = memo(function PageLoader() {
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setIsStuck(true), 12_000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center relative z-10">
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
            <p className="text-xs text-muted-foreground">
              Dica: tente atualizar a página do navegador.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
