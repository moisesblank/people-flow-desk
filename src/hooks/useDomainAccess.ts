// ============================================
// 🔐 MOISÉS MEDEIROS v12.0 - DOMAIN ACCESS VALIDATION
// ARQUITETURA MONO-DOMÍNIO (pro.moisesmedeiros.com.br)
// /gestaofc = área interna restrita para funcionários
// ============================================

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// CONSTANTES
// ============================================
/**
 * @deprecated P1-2: OWNER_EMAIL exportado apenas para compatibilidade.
 * Usar role === 'owner' no banco de dados (user_roles).
 */
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

// Roles permitidos na área de gestão (/gestaofc)
export const GESTAO_ALLOWED_ROLES: DomainAppRole[] = [
  "owner", "admin", "coordenacao", "suporte", "monitoria", 
  "afiliado", "marketing", "contabilidade", "employee"
];

// Roles permitidos na área de alunos (/alunos)
export const PRO_ALLOWED_ROLES: DomainAppRole[] = [
  "owner", "beta", "aluno_gratuito"
];

// ============================================
// FUNÇÕES DE DETECÇÃO DE ÁREA (NÃO DOMÍNIO)
// ARQUITETURA MONO-DOMÍNIO: tudo em pro.moisesmedeiros.com.br
// ============================================

/**
 * @deprecated Domínio gestao.* não existe mais. Use isGestaoPath()
 */
export function isGestaoHost(_hostname?: string): boolean {
  // SEMPRE RETORNA FALSE - domínio gestao.* foi descontinuado
  return false;
}

export function isProHost(hostname?: string): boolean {
  const h = (hostname || (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  // Em produção, sempre retorna true pois só existe pro.*
  return h.startsWith("pro.") || h.includes("pro.") || h.includes("localhost") || h.includes("lovable");
}

export function isPublicHost(hostname?: string): boolean {
  const h = (hostname || (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  return h.startsWith("www.") || h === "moisesmedeiros.com.br";
}

/**
 * Verifica se o usuário está na área de gestão (/gestaofc)
 */
export function isGestaoPath(pathname?: string): boolean {
  const p = (pathname || (typeof window !== "undefined" ? window.location.pathname : "")).toLowerCase();
  return p.startsWith("/gestaofc");
}

/**
 * Verifica se o usuário está na área de alunos (/alunos)
 */
export function isAlunosPath(pathname?: string): boolean {
  const p = (pathname || (typeof window !== "undefined" ? window.location.pathname : "")).toLowerCase();
  return p.startsWith("/alunos");
}

export function getCurrentDomain(): "pro" | "public" | "localhost" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  const h = window.location.hostname.toLowerCase();
  
  // Localhost + Lovable preview = bypass total
  if (h.includes("localhost") || h.includes("127.0.0.1") || h.includes("lovable.app") || h.includes("lovableproject.com")) {
    return "localhost";
  }
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
  dominioAtual: "pro" | "public" | "localhost" | "unknown";
  areaAtual: "gestaofc" | "alunos" | "publica" | "unknown";
}

// ============================================
// FUNÇÃO PRINCIPAL DE VALIDAÇÃO
// ============================================
/**
 * Valida se o role do usuário pode acessar a ÁREA atual (não domínio).
 * ARQUITETURA: 1 domínio (pro.*) + múltiplas áreas internas
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
    return { permitido: true, dominioAtual: "unknown", areaAtual: "unknown" };
  }

  const dominioAtual = getCurrentDomain();
  const pathname = window.location.pathname.toLowerCase();
  
  // Determinar área atual baseado no path
  let areaAtual: "gestaofc" | "alunos" | "publica" | "unknown" = "publica";
  if (isGestaoPath(pathname)) {
    areaAtual = "gestaofc";
  } else if (isAlunosPath(pathname)) {
    areaAtual = "alunos";
  }

  // P1-2: Owner bypass agora é via role === 'owner', não por email
  // Mantendo compatibilidade: email OU role podem indicar owner
  if (role === "owner" || userEmail?.toLowerCase() === OWNER_EMAIL) {
    console.log("[AREA-ACCESS] Owner detectado (role ou email) - bypass supremo ativado");
    return { permitido: true, dominioAtual, areaAtual };
  }

  // Sem role = usuário não logado ainda
  if (!role) {
    // Se está em /gestaofc, precisa fazer login
    if (areaAtual === "gestaofc") {
      return { 
        permitido: false, 
        dominioAtual, 
        areaAtual,
        redirecionarPara: "/auth",
        motivo: "Faça login para acessar esta área"
      };
    }
    // Se está em /alunos, precisa fazer login
    if (areaAtual === "alunos") {
      return { 
        permitido: false, 
        dominioAtual, 
        areaAtual,
        redirecionarPara: "/auth",
        motivo: "Faça login para acessar esta área"
      };
    }
    // Área pública - permitir
    return { permitido: true, dominioAtual, areaAtual };
  }

  // Localhost/Preview - permitir tudo para desenvolvimento
  if (dominioAtual === "localhost") {
    return { permitido: true, dominioAtual, areaAtual };
  }

  // ============================================
  // VALIDAÇÃO /gestaofc (área de funcionários)
  // Só acessível quando digitado MANUALMENTE
  // ============================================
  if (areaAtual === "gestaofc") {
    const isAllowed = GESTAO_ALLOWED_ROLES.includes(role as DomainAppRole);
    
    if (!isAllowed) {
      console.log(`[AREA-ACCESS] Role "${role}" sem acesso a /gestaofc - redirecionando para /alunos/dashboard`);
      return { 
        permitido: false, 
        dominioAtual, 
        areaAtual,
        redirecionarPara: "/alunos/dashboard",
        motivo: "Área restrita"
      };
    }
    
    return { permitido: true, dominioAtual, areaAtual };
  }

  // ============================================
  // VALIDAÇÃO /alunos (área de alunos beta)
  // ============================================
  if (areaAtual === "alunos") {
    const isAllowed = PRO_ALLOWED_ROLES.includes(role as DomainAppRole);
    
    // Funcionários podem visualizar /alunos para testes
    if (GESTAO_ALLOWED_ROLES.includes(role as DomainAppRole)) {
      return { permitido: true, dominioAtual, areaAtual };
    }
    
    if (!isAllowed) {
      console.log(`[AREA-ACCESS] Role "${role}" sem acesso a /alunos - redirecionando para /`);
      return { 
        permitido: false, 
        dominioAtual, 
        areaAtual,
        redirecionarPara: "/",
        motivo: "Área exclusiva para alunos"
      };
    }
    
    return { permitido: true, dominioAtual, areaAtual };
  }

  // Área pública - permitir tudo
  return { permitido: true, dominioAtual, areaAtual };
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
      if (!user?.id) {
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
          console.error("[AREA-ACCESS] Erro ao buscar role:", error);
          setRole(null);
        } else {
          setRole(data?.role as DomainAppRole ?? "employee");
        }
      } catch (err) {
        console.error("[AREA-ACCESS] Erro:", err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, [user?.id]);

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
