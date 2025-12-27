// ============================================
// MOISÉS MEDEIROS v11.0 - HOOK DE REDIRECIONAMENTO POR ROLE
// ARQUITETURA DE DOMÍNIOS (LEI IV - SOBERANIA DO ARQUITETO):
// - gestao.moisesmedeiros.com.br → Funcionários → /dashboard
// - pro.moisesmedeiros.com.br → Alunos Beta → /alunos
// - Owner (moisesblank@gmail.com) → Acesso total (ambos domínios)
// 
// 🔐 ATUALIZAÇÃO v11.0:
// - Integração com validateDomainAccessForLogin
// - Redirecionamento cross-domain para roles incorretos
// ============================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  OWNER_EMAIL, 
  isGestaoHost, 
  isProHost,
  ROLE_LABELS
} from "@/hooks/useRolePermissions";
import { validateDomainAccessForLogin, type DomainAppRole, DOMAIN_ROLE_LABELS } from "@/hooks/useDomainAccess";
// toast removido - não há mais redirect cross-domain

type RedirectRole = "owner" | "admin" | "beta" | "aluno_gratuito" | "gestao" | "other";

// Roles que vão para área de gestão (funcionários)
const GESTAO_ROLES = [
  "owner", "admin", "coordenacao", "suporte", "monitoria", 
  "financeiro", "rh", "marketing", "contabilidade", "afiliado", "employee"
];

// Roles que vão para área de aluno
const ALUNO_ROLES = ["beta", "aluno_gratuito"];

export function useRoleBasedRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const getRedirectPath = async (): Promise<string> => {
    if (!user) return "/auth";

    // Owner sempre vai para dashboard de gestão (ACESSO SUPREMO)
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
      // Independente do domínio - aluno beta SEMPRE vai para /alunos
      if (ALUNO_ROLES.includes(role)) {
        return "/alunos";
      }

      // Funcionários (gestão) vão para dashboard
      // Owner e Admin também vão para dashboard
      if (GESTAO_ROLES.includes(role)) {
        return "/dashboard";
      }

      // Fallback para dashboard
      return "/dashboard";
    } catch (err) {
      console.error("[REDIRECT] Erro:", err);
      return "/dashboard";
    }
  };

  /**
   * Redireciona após login COM VALIDAÇÃO DE DOMÍNIO
   * Se o role não pode acessar o domínio atual, redireciona cross-domain
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

      // ============================================
      // 🛡️ VALIDAÇÃO DE DOMÍNIO DESATIVADA (LEI SUPREMA)
      // NÃO redirecionar entre domínios - cada domínio é independente
      // O redirect agora é apenas RELATIVO ao hostname atual
      // ============================================
      const domainValidation = validateDomainAccessForLogin(role, userEmail);
      
      // Apenas log, sem redirect cross-domain
      if (!domainValidation.permitido) {
        console.log(`[REDIRECT] Role "${role}" no domínio ${domainValidation.dominioAtual} - sem redirect cross-domain`);
      }

      // ============================================
      // REDIRECIONAMENTO NORMAL (domínio correto)
      // ============================================
      const path = await getRedirectPath();
      console.log(`[REDIRECT] Navegando para ${path} (role: ${role}, domínio: ${domainValidation.dominioAtual})`);
      navigate(path, { replace: true });

    } catch (err) {
      console.error("[REDIRECT] Erro geral:", err);
      navigate("/dashboard", { replace: true });
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
  const [homePath, setHomePath] = useState<string>("/dashboard");

  useEffect(() => {
    async function determineHome() {
      if (!user) {
        setHomePath("/auth");
        return;
      }

      // Owner sempre vai para dashboard
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
        
        // Alunos vão para /alunos, funcionários para /dashboard
        setHomePath(ALUNO_ROLES.includes(role) ? "/alunos" : "/dashboard");
      } catch {
        setHomePath("/dashboard");
      }
    }

    determineHome();
  }, [user]);

  return homePath;
}
