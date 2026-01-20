// ============================================
// MOISÉS MEDEIROS v12.0 - HOOK DE REDIRECIONAMENTO POR ROLE
// ÁREA /gestaofc INVISÍVEL - não redireciona automaticamente
// ============================================

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
// @deprecated P1-2: OWNER_EMAIL removido - usar role === 'owner'
import { validateDomainAccessForLogin, type DomainAppRole, GESTAO_ALLOWED_ROLES, PRO_ALLOWED_ROLES } from "@/hooks/useDomainAccess";

// P1-2 FIX: Roles que podem acessar gestão (sem 'employee' deprecated)
const GESTAO_ROLES = [
  "owner", "admin", "coordenacao", "suporte", "monitoria", 
  "marketing", "contabilidade", "afiliado"
];

// Roles que vão para área de aluno (/alunos) - CONSTITUIÇÃO v10.x
const ALUNO_ROLES = ["beta", "aluno_gratuito", "aluno_presencial", "beta_expira"];

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

    // P1-2: Verificar owner pelo role, não por email
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    
    const userRole = roleData?.role;

    // Owner: se está em /gestaofc, fica. Se não está, vai para /alunos ou home
    if (userRole === "owner") {
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

      // ✅ P0 FIX: Funcionário SEMPRE vai para /gestaofc (não para /)
      // Se o usuário é funcionário, destino é /gestaofc
      if (GESTAO_ROLES.includes(role)) {
        return "/gestaofc";
      }

      // Se for aluno pago (beta), vai para central do aluno
      if (ALUNO_ROLES.includes(role)) {
        return "/alunos/dashboard";
      }

      // Fallback para comunidade (não /)
      return "/comunidade";
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

      // P1-2: Buscar role para verificar owner (não por email)
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const role = data?.role;

      // Owner: se está em gestaofc, home é gestaofc. Se não, home é /
      if (role === "owner") {
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
        
        // Alunos vão para /alunos/dashboard (CONSTITUIÇÃO v10.4.1)
        if (ALUNO_ROLES.includes(role)) {
          setHomePath("/alunos/dashboard");
          return;
        }

        // ✅ P0 FIX: Funcionários sempre têm home /gestaofc (não /)
        if (GESTAO_ROLES.includes(role)) {
          setHomePath("/gestaofc");
          return;
        }

        // Fallback para comunidade (não /)
        setHomePath("/comunidade");
      } catch {
        setHomePath("/comunidade");
      }
    }

    determineHome();
  }, [user, location.pathname]);

  return homePath;
}
