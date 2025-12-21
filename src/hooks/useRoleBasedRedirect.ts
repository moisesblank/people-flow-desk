// ============================================
// HOOK DE REDIRECIONAMENTO POR ROLE
// Owner/Gestão → /dashboard
// Beta (aluno pago) → /alunos (Central do Aluno)
// ============================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type RedirectRole = "owner" | "admin" | "beta" | "aluno_gratuito" | "gestao" | "other";

const OWNER_EMAIL = "moisesblank@gmail.com";

// Roles que vão para área de gestão
const GESTAO_ROLES = ["owner", "admin", "coordenacao", "suporte", "monitoria", "financeiro", "rh", "marketing", "employee"];

// Roles que vão para área de aluno
const ALUNO_ROLES = ["beta", "aluno_gratuito"];

export function useRoleBasedRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const getRedirectPath = async (): Promise<string> => {
    if (!user) return "/auth";

    // Owner sempre vai para dashboard de gestão
    if (user.email?.toLowerCase() === OWNER_EMAIL) {
      return "/dashboard";
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[REDIRECT] Erro ao buscar role:", error);
        return "/dashboard";
      }

      const role = data?.role || "employee";

      // Se for aluno pago (beta), vai para central do aluno
      if (ALUNO_ROLES.includes(role)) {
        return "/alunos";
      }

      // Gestão e outros vão para dashboard
      return "/dashboard";
    } catch (err) {
      console.error("[REDIRECT] Erro:", err);
      return "/dashboard";
    }
  };

  const redirectAfterLogin = async () => {
    setIsRedirecting(true);
    const path = await getRedirectPath();
    navigate(path, { replace: true });
    setIsRedirecting(false);
  };

  return {
    redirectAfterLogin,
    getRedirectPath,
    isRedirecting,
  };
}

// Hook simples para usar em componentes que precisam saber a home do usuário
export function useUserHomePath() {
  const { user } = useAuth();
  const [homePath, setHomePath] = useState<string>("/dashboard");

  useEffect(() => {
    async function determineHome() {
      if (!user) {
        setHomePath("/auth");
        return;
      }

      if (user.email?.toLowerCase() === OWNER_EMAIL) {
        setHomePath("/dashboard");
        return;
      }

      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        const role = data?.role || "employee";
        setHomePath(ALUNO_ROLES.includes(role) ? "/alunos" : "/dashboard");
      } catch {
        setHomePath("/dashboard");
      }
    }

    determineHome();
  }, [user]);

  return homePath;
}
