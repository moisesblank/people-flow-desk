// ============================================
// 🛠️ ROUTE HELPERS
// Componentes compartilhados para rotas
// ============================================

import { memo } from "react";
import { RoleProtectedRoute } from "@/components/layout/RoleProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Protected route wrapper - memoized
export const ProtectedPage = memo(({ children }: { children: React.ReactNode }) => (
  <RoleProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </RoleProtectedRoute>
));
ProtectedPage.displayName = 'ProtectedPage';

// Ultra-fast loading - CSS only, minimal DOM
export const PageLoader = memo(() => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));
PageLoader.displayName = 'PageLoader';
