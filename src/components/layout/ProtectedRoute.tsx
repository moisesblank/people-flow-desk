// ============================================
// PROTECTED ROUTE - Com verificação de Onboarding
// Bloqueia acesso se onboarding não completo
// ============================================

import { ReactNode, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

const OWNER_EMAIL = "moisesblank@gmail.com";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: onboardingLoading, needsOnboarding } = useOnboardingStatus();
  const location = useLocation();

  // Owner bypass de friccão
  const isOwner = useMemo(() => {
    return user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  }, [user?.email]);

  // 🧪 PLANO B (UX) - BYPASS DE TESTE BETA: não travar rotas por flag 2FA
  // (não altera segurança server-side; só impede loop de redirect no client)
  const isBetaTestBypass = useMemo(() => {
    return (user?.email || "").toLowerCase() === "moisescursoquimica@gmail.com";
  }, [user?.email]);

  // 🔒 BLOQUEIO GLOBAL: se 2FA está pendente, ninguém entra em rota protegida
  // EXCETO: OWNER e usuário de teste (bypass UX)
  const is2FAPendingRaw = typeof window !== "undefined" && sessionStorage.getItem("matriz_2fa_pending") === "1";
  const is2FAPending = is2FAPendingRaw && !isOwner && !isBetaTestBypass;

  // Não redirecionar se já estamos na página de primeiro acesso
  const isOnPrimeiroAcesso = location.pathname === "/primeiro-acesso";

  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não autenticado ou 2FA pendente
  if (!user || is2FAPending) {
    return <Navigate to="/auth" replace />;
  }

  // 🔐 ONBOARDING OBRIGATÓRIO: Redirecionar para primeiro acesso
  // Exceto se já estamos na página ou é owner
  // P0 FIX: Agora o default isComplete=false garante redirecionamento seguro
  if (needsOnboarding && !isOnPrimeiroAcesso && !isOwner) {
    console.log("[ProtectedRoute] Onboarding incompleto, redirecionando para /primeiro-acesso");
    return <Navigate to="/primeiro-acesso" replace />;
  }

  return <>{children}</>;
}
