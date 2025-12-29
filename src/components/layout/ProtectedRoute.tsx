import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // 🔒 BLOQUEIO GLOBAL: se 2FA está pendente, ninguém entra em rota protegida
  // (owner bypass não é aplicado aqui pois o owner não entra em 2FA)
  const is2FAPending = typeof window !== "undefined" && sessionStorage.getItem("matriz_2fa_pending") === "1";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || is2FAPending) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
