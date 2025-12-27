// ============================================
// MOISÉS MEDEIROS v12.0 - HOOK DE REDIRECIONAMENTO POR ROLE
// ARQUITETURA MONO-DOMÍNIO (pro.moisesmedeiros.com.br):
// - /gestaofc/* → Funcionários → /gestaofc/dashboard
// - /alunos/* → Alunos Beta → /alunos
// - Owner (moisesblank@gmail.com) → Acesso total (todas as áreas)
// ============================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OWNER_EMAIL, ROLE_LABELS } from "@/hooks/useRolePermissions";
import { validateDomainAccessForLogin, type DomainAppRole, GESTAO_ALLOWED_ROLES, PRO_ALLOWED_ROLES } from "@/hooks/useDomainAccess";

type RedirectRole = "owner" | "admin" | "beta" | "aluno_gratuito" | "gestao" | "other";

// Roles que vão para área de gestão (/gestaofc)
const GESTAO_ROLES = [
  "owner", "admin", "coordenacao", "suporte", "monitoria", 
  "financeiro", "rh", "marketing", "contabilidade", "afiliado", "employee"
];

// Roles que vão para área de aluno (/alunos)
const ALUNO_ROLES = ["beta", "aluno_gratuito"];

export function useRoleBasedRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const getRedirectPath = async (): Promise<string> => {
    if (!user) return "/auth";

    // Owner sempre vai para dashboard de gestão (ACESSO SUPREMO)
    if (user.email?.toLowerCase() === OWNER_EMAIL) {
      return "/gestaofc/dashboard";
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[REDIRECT] Erro ao buscar role:", error);
        return "/gestaofc/dashboard";
      }

      const role = data?.role || "employee";

      // Se for aluno pago (beta), vai para central do aluno
      if (ALUNO_ROLES.includes(role)) {
        return "/alunos";
      }

      // Funcionários (gestão) vão para dashboard de gestão
      if (GESTAO_ROLES.includes(role)) {
        return "/gestaofc/dashboard";
      }

      // Fallback para gestão
      return "/gestaofc/dashboard";
    } catch (err) {
      console.error("[REDIRECT] Erro:", err);
      return "/gestaofc/dashboard";
    }
  };

  /**
   * Redireciona após login
   * ARQUITETURA MONO-DOMÍNIO: todos os redirects são RELATIVOS
   */
  const redirectAfterLogin = async () => {
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    setIsRedirecting(true);

    try {
      // Buscar role do usuário
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[REDIRECT] Erro ao buscar role:", error);
      }

      const role = (data?.role || "employee") as DomainAppRole;
      const userEmail = user.email || null;

      // Validação de área (não domínio)
      const areaValidation = validateDomainAccessForLogin(role, userEmail);
      
      if (!areaValidation.permitido && areaValidation.redirecionarPara) {
        console.log(`[REDIRECT] Role "${role}" - redirecionando para ${areaValidation.redirecionarPara}`);
        navigate(areaValidation.redirecionarPara, { replace: true });
        return;
      }

      // Redirecionamento normal baseado no role
      const path = await getRedirectPath();
      console.log(`[REDIRECT] Navegando para ${path} (role: ${role})`);
      navigate(path, { replace: true });

    } catch (err) {
      console.error("[REDIRECT] Erro geral:", err);
      navigate("/gestaofc/dashboard", { replace: true });
    } finally {
      setIsRedirecting(false);
    }
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
  const [homePath, setHomePath] = useState<string>("/gestaofc/dashboard");

  useEffect(() => {
    async function determineHome() {
      if (!user) {
        setHomePath("/auth");
        return;
      }

      // Owner sempre vai para dashboard de gestão
      if (user.email?.toLowerCase() === OWNER_EMAIL) {
        setHomePath("/gestaofc/dashboard");
        return;
      }

      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        const role = data?.role || "employee";
        
        // Alunos vão para /alunos, funcionários para /gestaofc/dashboard
        setHomePath(ALUNO_ROLES.includes(role) ? "/alunos" : "/gestaofc/dashboard");
      } catch {
        setHomePath("/gestaofc/dashboard");
      }
    }

    determineHome();
  }, [user]);

  return homePath;
}
