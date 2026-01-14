// ============================================
// MOISÉS MEDEIROS v11.0 - ADMIN CHECK HOOK
// 🛡️ P0 SECURITY FIX: Owner verificado via ROLE do banco
// REMOVIDO: Email hardcoded do bundle
// ============================================

import { useAuth } from "@/hooks/useAuth";

// P1-2 FIX: Sem 'employee' deprecated
export type AppRole = "owner" | "admin" | "coordenacao" | "suporte" | "monitoria" | "afiliado" | "marketing" | "contabilidade";

interface AdminCheckResult {
  isOwner: boolean;
  isAdmin: boolean;
  isAdminOrOwner: boolean;
  isCoordinator: boolean;
  isEmployee: boolean;
  role: AppRole | null;
  isLoading: boolean;
  canEdit: boolean;
  isGodMode: boolean;
  userEmail: string | null;
  canAccessTramon: boolean;
}

// ============================================
// 🛡️ P0 SECURITY FIX: Owner determinado APENAS por role do banco
// Email removido do bundle para segurança
// ============================================

export function useAdminCheck(): AdminCheckResult {
  const { user, role: authRole, isLoading: authLoading } = useAuth();
  const role = authRole as AppRole | null;

  const userEmail = user?.email || null;
  
  // 🛡️ P0 FIX: Owner verificado APENAS via role do banco
  // Não há mais email hardcoded no frontend
  const isOwner = role === "owner";
  
  const isAdmin = role === "admin";
  const isCoordinator = role === "coordenacao";
  const isAdminOrOwner = isOwner || isAdmin;
  // P1-2: 'employee' deprecated - verificar roles específicas
  const isEmployee = false; // deprecated

  // MODO DEUS: exclusivo do Owner (via role)
  const isGodMode = isOwner;

  // Apenas owner pode editar campos críticos
  const canEdit = isGodMode;
  
  // TRAMON: Owner, Admin ou Coordenação
  const canAccessTramon = isOwner || isAdmin || isCoordinator;

  return {
    isOwner,
    isAdmin,
    isAdminOrOwner,
    isCoordinator,
    isEmployee,
    role,
    isLoading: authLoading,
    canEdit,
    isGodMode,
    userEmail,
    canAccessTramon
  };
}
