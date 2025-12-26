// ============================================
// MOISÉS MEDEIROS v9.0 - ADMIN CHECK HOOK
// Verificação de Permissões Owner/Admin
// MODO MASTER: Exclusivo para moisesblank@gmail.com
// ============================================

import { useAuth } from "@/hooks/useAuth";

export type AppRole = "owner" | "admin" | "employee" | "coordenacao" | "suporte" | "monitoria" | "afiliado" | "marketing" | "contabilidade";

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
// P0 FIX: Owner determinado APENAS por role (não por email)
// Fonte da verdade: user_roles.role = 'owner'
// ============================================

export function useAdminCheck(): AdminCheckResult {
  // OTIMIZADO: Reutilizar role do useAuth ao invés de query duplicada
  const { user, role: authRole, isLoading: authLoading } = useAuth();
  const role = authRole as AppRole | null;

  const userEmail = user?.email || null;
  
  // ✅ SEGURO: Verificação do OWNER apenas por role (não por email!)
  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const isCoordinator = role === "coordenacao";
  const isAdminOrOwner = isOwner || isAdmin;
  const isEmployee = role === "employee";

  // MODO DEUS: exclusivo do Owner
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
