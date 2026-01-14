// ============================================
// 🛡️🔥 USE SECURITY — HOOK CENTRAL DE SEGURANÇA 🔥🛡️
// ANO 2300 — SEGURANÇA NÍVEL NASA + BRADESCO
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs (MONO-DOMÍNIO v2.0 - 27/12/2025):
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (role='beta')
//   👔 FUNCIONÁRIO: pro.moisesmedeiros.com.br/gestaofc (role='funcionario')
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  sanctumGuard,
  hasRoleAccess,
  ROLES,
  LOCKDOWN_FLAGS,
  type AppRole,
  type SanctumPrincipal,
} from "@/lib/security";

// ============================================
// TIPOS
// ============================================
export interface SecurityState {
  // Status
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  
  // Principal
  principal: SanctumPrincipal | null;
  
  // Roles
  isOwner: boolean;
  isAdmin: boolean;
  isFuncionario: boolean;
  isBeta: boolean;
  role: AppRole | null;
  
  // Lockdown
  isLockdown: boolean;
  lockdownFlags: typeof LOCKDOWN_FLAGS;
}

export interface UseSecurityOptions {
  // Roles necessárias para acessar
  requiredRoles?: AppRole[];
  
  // Redirecionar se não autorizado
  redirectOnDeny?: string;
  
  // Verificar automaticamente
  autoCheck?: boolean;
}

// ============================================
// HOOK PRINCIPAL
// ============================================
export function useSecurity(options: UseSecurityOptions = {}) {
  const { requiredRoles = [], autoCheck = true } = options;
  
  const { user, session, isLoading: authLoading } = useAuth();
  
  const [state, setState] = useState<SecurityState>({
    isLoading: true,
    isAuthenticated: false,
    isAuthorized: false,
    principal: null,
    isOwner: false,
    isAdmin: false,
    isFuncionario: false,
    isBeta: false,
    role: null,
    isLockdown: LOCKDOWN_FLAGS.disable_all_access,
    lockdownFlags: LOCKDOWN_FLAGS,
  });

  // ============================================
  // VERIFICAR AUTORIZAÇÃO
  // ============================================
  const checkAuthorization = useCallback(async () => {
    if (authLoading) return;
    
    if (!user || !session) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
        isAuthorized: false,
        principal: null,
      }));
      return;
    }

    try {
      const result = await sanctumGuard({
        requiredRoles: requiredRoles.length > 0 ? requiredRoles : undefined,
        action: "page_access",
      });

      setState({
        isLoading: false,
        isAuthenticated: true,
        isAuthorized: result.allowed,
        principal: result.principal,
        isOwner: result.principal?.isOwner ?? false,
        isAdmin: result.principal?.isAdmin ?? false,
        isFuncionario: result.principal?.isFuncionario ?? false,
        isBeta: result.principal?.isBeta ?? false,
        role: result.principal?.role ?? null,
        isLockdown: LOCKDOWN_FLAGS.disable_all_access,
        lockdownFlags: LOCKDOWN_FLAGS,
      });
    } catch (error) {
      console.error("[SECURITY] Check failed:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isAuthenticated: true,
        isAuthorized: false,
      }));
    }
  }, [user, session, authLoading, requiredRoles]);

  // Auto-check
  useEffect(() => {
    if (autoCheck) {
      checkAuthorization();
    }
  }, [autoCheck, checkAuthorization]);

  // ============================================
  // HELPERS
  // ============================================
  
  /**
   * Verifica se o usuário tem uma role específica
   */
  const hasRole = useCallback(
    (role: AppRole): boolean => {
      if (state.isOwner) return true;
      if (!state.role) return false;
      return hasRoleAccess(state.role, role);
    },
    [state.role, state.isOwner]
  );

  /**
   * Verifica se o usuário pode acessar uma área
   */
  const canAccess = useCallback(
    (requiredRolesList: AppRole[]): boolean => {
      if (state.isOwner) return true;
      if (!state.role) return false;
      return requiredRolesList.some((r) => hasRoleAccess(state.role!, r));
    },
    [state.role, state.isOwner]
  );

  /**
   * @deprecated P1-2: Preferir verificação por role (state.isOwner)
   * Esta função existe apenas para compatibilidade - SEMPRE retorna false agora
   */
  const checkIsOwner = useCallback((_email: string): boolean => {
    console.warn('[SECURITY] checkIsOwner(email) é deprecated - usar state.isOwner (role-based)');
    // P1-2: Verificação por email desabilitada
    return false;
  }, []);

  /**
   * Executar ação com verificação de segurança
   */
  const secureAction = useCallback(
    async <T>(
      action: () => Promise<T>,
      requiredRolesList?: AppRole[]
    ): Promise<{ success: boolean; data?: T; error?: string }> => {
      // Owner sempre pode
      if (state.isOwner) {
        try {
          const data = await action();
          return { success: true, data };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      }

      // Verificar roles
      if (requiredRolesList && !canAccess(requiredRolesList)) {
        return { success: false, error: "Acesso não autorizado" };
      }

      // Verificar lockdown
      if (LOCKDOWN_FLAGS.disable_all_access) {
        return { success: false, error: "Sistema em manutenção" };
      }

      try {
        const data = await action();
        return { success: true, data };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
    [state.isOwner, canAccess]
  );

  // ============================================
  // VERIFICAÇÕES DE ÁREA (MAPA DE URLs)
  // ============================================
  
  /**
   * Pode acessar área de alunos (/alunos)
   */
  const canAccessAlunos = useMemo(() => {
    return state.isOwner || state.isBeta || state.isAdmin || state.isFuncionario;
  }, [state.isOwner, state.isBeta, state.isAdmin, state.isFuncionario]);

  /**
   * Pode acessar área de gestão (/gestao)
   */
  const canAccessGestao = useMemo(() => {
    return state.isOwner || state.isAdmin || state.isFuncionario;
  }, [state.isOwner, state.isAdmin, state.isFuncionario]);

  /**
   * Pode acessar área de comunidade (/comunidade)
   */
  const canAccessComunidade = useMemo(() => {
    return true; // Todos podem acessar
  }, []);

  /**
   * Pode acessar área admin
   */
  const canAccessAdmin = useMemo(() => {
    return state.isOwner || state.isAdmin;
  }, [state.isOwner, state.isAdmin]);

  return {
    // Estado
    ...state,
    
    // Ações
    checkAuthorization,
    hasRole,
    canAccess,
    checkIsOwner,
    secureAction,
    
    // Verificações de área
    canAccessAlunos,
    canAccessGestao,
    canAccessComunidade,
    canAccessAdmin,
    
    // Constantes
    ROLES,
    LOCKDOWN_FLAGS,
  };
}

// ============================================
// HOOK SIMPLES PARA VERIFICAR OWNER
// ============================================
/**
 * @deprecated P1-2: Preferir useRole() e verificar role === 'owner'
 * Hook mantido para compatibilidade com código existente
 * SEMPRE retorna false agora - usar role-based
 */
export function useIsOwner(): boolean {
  const { role } = useAuth();
  console.warn('[SECURITY] useIsOwner() é deprecated - usar role === "owner"');
  return useMemo(() => {
    // P1-2: Retorna true apenas se role === 'owner'
    return role === 'owner';
  }, [role]);
}

// ============================================
// HOOK PARA VERIFICAR ROLE
// ============================================
export function useHasRole(requiredRole: AppRole): boolean {
  const { role, isOwner } = useSecurity({ autoCheck: true });
  
  return useMemo(() => {
    if (isOwner) return true;
    if (!role) return false;
    return hasRoleAccess(role, requiredRole);
  }, [role, isOwner, requiredRole]);
}

// ============================================
// HOOK PARA VERIFICAR MÚLTIPLAS ROLES
// ============================================
export function useCanAccess(requiredRoles: AppRole[]): boolean {
  const { canAccess } = useSecurity({ autoCheck: true });
  return canAccess(requiredRoles);
}

export default useSecurity;
