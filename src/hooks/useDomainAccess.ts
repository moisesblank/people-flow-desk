// ============================================
// 🔐 MOISÉS MEDEIROS v11.0 - DOMAIN ACCESS VALIDATION
// LEI IV - SEPARAÇÃO DE DOMÍNIOS (CONSTITUIÇÃO v9.2b)
// ============================================
// REGRA:
// - gestao.moisesmedeiros.com.br → APENAS funcionários + owner
// - pro.moisesmedeiros.com.br → APENAS alunos beta + owner
// - Owner (moisesblank@gmail.com) → ACESSO SUPREMO EM TODOS
// ============================================

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// CONSTANTES
// ============================================
export const OWNER_EMAIL = "moisesblank@gmail.com";

// Tipos de roles do sistema
export type DomainAppRole = 
  | "owner" 
  | "admin" 
  | "employee" 
  | "coordenacao" 
  | "suporte" 
  | "monitoria" 
  | "afiliado" 
  | "marketing" 
  | "contabilidade"
  | "beta"
  | "aluno_gratuito";

// Labels para os roles
export const DOMAIN_ROLE_LABELS: Record<DomainAppRole, string> = {
  owner: "Proprietário (Master)",
  admin: "Administrador",
  coordenacao: "Coordenação",
  suporte: "Suporte",
  monitoria: "Monitoria",
  afiliado: "Afiliados",
  marketing: "Marketing",
  contabilidade: "Contabilidade",
  employee: "Administrativo",
  beta: "Aluno BETA (Premium)",
  aluno_gratuito: "Usuário Gratuito",
};

// Roles permitidos em cada domínio
export const GESTAO_ALLOWED_ROLES: DomainAppRole[] = [
  "owner", "admin", "coordenacao", "suporte", "monitoria", 
  "afiliado", "marketing", "contabilidade", "employee"
];

export const PRO_ALLOWED_ROLES: DomainAppRole[] = [
  "owner", "beta", "aluno_gratuito"
];

// ============================================
// FUNÇÕES DE DETECÇÃO DE DOMÍNIO
// ============================================
export function isGestaoHost(hostname?: string): boolean {
  const h = (hostname || (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  return h.startsWith("gestao.") || h.includes("gestao.");
}

export function isProHost(hostname?: string): boolean {
  const h = (hostname || (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  return h.startsWith("pro.") || h.includes("pro.");
}

export function isPublicHost(hostname?: string): boolean {
  const h = (hostname || (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  return h.startsWith("www.") || h === "moisesmedeiros.com.br";
}

export function getCurrentDomain(): "gestao" | "pro" | "public" | "localhost" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  const h = window.location.hostname.toLowerCase();
  
  if (h.includes("localhost") || h.includes("127.0.0.1") || h.includes("lovable.app")) {
    return "localhost";
  }
  if (isGestaoHost(h)) return "gestao";
  if (isProHost(h)) return "pro";
  if (isPublicHost(h)) return "public";
  return "unknown";
}

// ============================================
// INTERFACE DE RESULTADO
// ============================================
export interface DomainAccessResult {
  permitido: boolean;
  redirecionarPara?: string;
  motivo?: string;
  dominioAtual: "gestao" | "pro" | "public" | "localhost" | "unknown";
}

// ============================================
// FUNÇÃO PRINCIPAL DE VALIDAÇÃO
// ============================================
/**
 * Valida se o role do usuário pode acessar o domínio atual APÓS LOGIN.
 * Usa-se logo após autenticação para verificar se deve redirecionar.
 * 
 * @param role - Role do usuário logado
 * @param userEmail - Email do usuário (para verificar owner)
 * @returns Objeto com permitido, redirecionarPara e motivo
 */
export function validateDomainAccessForLogin(
  role: DomainAppRole | string | null,
  userEmail: string | null
): DomainAccessResult {
  // SSR safety
  if (typeof window === "undefined") {
    return { permitido: true, dominioAtual: "unknown" };
  }

  const dominioAtual = getCurrentDomain();

  // Owner tem BYPASS SUPREMO em qualquer domínio
  if (userEmail?.toLowerCase() === OWNER_EMAIL) {
    console.log("[DOMAIN-ACCESS] Owner detectado - bypass supremo ativado");
    return { permitido: true, dominioAtual };
  }

  // Sem role = sem acesso
  if (!role) {
    return { 
      permitido: false, 
      redirecionarPara: "/auth",
      motivo: "Usuário sem role definido",
      dominioAtual
    };
  }

  // Localhost/Preview - permitir tudo para desenvolvimento
  if (dominioAtual === "localhost") {
    return { permitido: true, dominioAtual };
  }

  const roleLabel = DOMAIN_ROLE_LABELS[role as DomainAppRole] || role;

  // ============================================
  // VALIDAÇÃO gestao.moisesmedeiros.com.br
  // ============================================
  if (dominioAtual === "gestao") {
    const isAllowed = GESTAO_ALLOWED_ROLES.includes(role as DomainAppRole);
    
    if (!isAllowed) {
      console.log(`[DOMAIN-ACCESS] Role "${role}" BLOQUEADO em gestao.* → Redirecionar para pro.*`);
      return {
        permitido: false,
        redirecionarPara: "https://pro.moisesmedeiros.com.br/alunos",
        motivo: `Seu cargo "${roleLabel}" não tem acesso à área de gestão. Redirecionando para área do aluno.`,
        dominioAtual
      };
    }
    
    return { permitido: true, dominioAtual };
  }

  // ============================================
  // VALIDAÇÃO pro.moisesmedeiros.com.br
  // ============================================
  if (dominioAtual === "pro") {
    const isAllowed = PRO_ALLOWED_ROLES.includes(role as DomainAppRole);
    
    if (!isAllowed) {
      console.log(`[DOMAIN-ACCESS] Role "${role}" BLOQUEADO em pro.* → Redirecionar para gestao.*`);
      return {
        permitido: false,
        redirecionarPara: "https://gestao.moisesmedeiros.com.br/dashboard",
        motivo: `Seu cargo "${roleLabel}" é de funcionário. Redirecionando para área de gestão.`,
        dominioAtual
      };
    }
    
    return { permitido: true, dominioAtual };
  }

  // Domínio público ou unknown - permitir (landing pages etc)
  return { permitido: true, dominioAtual };
}

// ============================================
// HOOK PARA USO EM COMPONENTES
// ============================================
export function useDomainAccessValidation() {
  const { user } = useAuth();
  const [role, setRole] = useState<DomainAppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("[DOMAIN-ACCESS] Erro ao buscar role:", error);
          setRole(null);
        } else {
          setRole(data?.role as DomainAppRole ?? "employee");
        }
      } catch (err) {
        console.error("[DOMAIN-ACCESS] Erro:", err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, [user]);

  const userEmail = user?.email || null;

  const validation = useMemo(() => {
    if (isLoading) return null;
    return validateDomainAccessForLogin(role, userEmail);
  }, [role, userEmail, isLoading]);

  return {
    isLoading,
    role,
    userEmail,
    ...validation
  };
}

