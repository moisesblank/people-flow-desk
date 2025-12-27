// ============================================
// MOISÉS MEDEIROS v12.0 - HOOK DE REDIRECIONAMENTO POR ROLE
// ÁREA /gestaofc INVISÍVEL - não redireciona automaticamente
// ============================================

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OWNER_EMAIL } from "@/hooks/useRolePermissions";
import { validateDomainAccessForLogin, type DomainAppRole, GESTAO_ALLOWED_ROLES, PRO_ALLOWED_ROLES } from "@/hooks/useDomainAccess";

// Roles que podem acessar gestão (quando digitam manualmente /gestaofc)
const GESTAO_ROLES = [
  "owner", "admin", "coordenacao", "suporte", "monitoria", 
  "financeiro", "rh", "marketing", "contabilidade", "afiliado", "employee"
];

// Roles que vão para área de aluno (/alunos)
const ALUNO_ROLES = ["beta", "aluno_gratuito"];

export function useRoleBasedRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  /**
   * REGRA ABSOLUTA:
   * - Se o usuário ESTÁ em /gestaofc (digitou manualmente), PERMANECE lá
   * - Se o usuário NÃO está em /gestaofc, NUNCA vai para /gestaofc automaticamente
   * - /gestaofc SÓ EXISTE quando digitada manualmente na URL
   */
  const getRedirectPath = async (): Promise<string> => {
    if (!user) return "/auth";

    // Verificar se está DENTRO de /gestaofc (digitou manualmente)
    const isInGestaofc = location.pathname.startsWith("/gestaofc");

    // Owner: se está em /gestaofc, fica. Se não está, vai para /alunos ou home
    if (user.email?.toLowerCase() === OWNER_EMAIL) {
      if (isInGestaofc) {
        return "/gestaofc/dashboard";
      }
      // Owner fora de /gestaofc vai para área pública ou alunos
      return "/";
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[REDIRECT] Erro ao buscar role:", error);
        return "/";
      }

      const role = data?.role || "employee";

      // ============================================
      // REGRA: NUNCA redirecionar automaticamente para /gestaofc
      // Funcionários só vão para /gestaofc se DIGITARAM a URL
      // ============================================

      // Se o usuário está DENTRO de /gestaofc E é funcionário, fica lá
      if (isInGestaofc && GESTAO_ROLES.includes(role)) {
        return "/gestaofc/dashboard";
      }

      // Se for aluno pago (beta), vai para central do aluno
      if (ALUNO_ROLES.includes(role)) {
        return "/alunos";
      }

      // Funcionários FORA de /gestaofc vão para home (invisível)
      // ELES PRECISAM DIGITAR /gestaofc MANUALMENTE
      if (GESTAO_ROLES.includes(role)) {
        return "/";
      }

      // Fallback para home pública
      return "/";
    } catch (err) {
      console.error("[REDIRECT] Erro:", err);
      return "/";
    }
  };

  /**
   * Redireciona após login
   * REGRA: NUNCA revela /gestaofc automaticamente
   */
  const redirectAfterLogin = async () => {
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    setIsRedirecting(true);

    try {
      const path = await getRedirectPath();
      console.log(`[REDIRECT] Navegando para ${path}`);
      navigate(path, { replace: true });

    } catch (err) {
      console.error("[REDIRECT] Erro geral:", err);
      navigate("/", { replace: true });
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
  const location = useLocation();
  const [homePath, setHomePath] = useState<string>("/");

  useEffect(() => {
    async function determineHome() {
      if (!user) {
        setHomePath("/auth");
        return;
      }

      // Verificar se está em /gestaofc
      const isInGestaofc = location.pathname.startsWith("/gestaofc");

      // Owner: se está em gestaofc, home é gestaofc. Se não, home é /
      if (user.email?.toLowerCase() === OWNER_EMAIL) {
        setHomePath(isInGestaofc ? "/gestaofc/dashboard" : "/");
        return;
      }

      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        const role = data?.role || "employee";
        
        // Alunos vão para /alunos
        if (ALUNO_ROLES.includes(role)) {
          setHomePath("/alunos");
          return;
        }

        // Funcionários: se estão em /gestaofc, home é /gestaofc. Se não, home é /
        if (isInGestaofc) {
          setHomePath("/gestaofc/dashboard");
        } else {
          setHomePath("/");
        }
      } catch {
        setHomePath("/");
      }
    }

    determineHome();
  }, [user, location.pathname]);

  return homePath;
}
