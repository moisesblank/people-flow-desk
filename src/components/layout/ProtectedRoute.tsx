// ============================================
// PROTECTED ROUTE - Com verificação de Onboarding
// Bloqueia acesso se onboarding não completo
// ============================================

import { ReactNode, useEffect, useMemo, useState } from "react";
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

  // P0 anti-tela-preta: se auth/onboarding travarem por rede/RLS, não congelar UI.
  // Mantém segurança server-side: só destrava a UX e redireciona para fluxos seguros.
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLoadingTimeout(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

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

  // Loading: com fail-safe por timeout
  if (authLoading || onboardingLoading) {
    if (loadingTimeout) {
      // Se já sabemos o user (auth parcial), manda para um caminho seguro.
      if (user) {
        // Owner não pode ficar preso em loader por falha de leitura de onboarding.
        if (isOwner) return <>{children}</>;
        // Para alunos/roles comuns, onboarding é obrigatório: seguir para /primeiro-acesso.
        if (!isOnPrimeiroAcesso) return <Navigate to="/primeiro-acesso" replace />;
        // Se já está no onboarding, renderiza (evita loop).
        return <>{children}</>;
      }

      // Sem user após timeout: volta para /auth (estado seguro)
      return <Navigate to="/auth" replace />;
    }

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

