// ============================================
// MOISÉS MEDEIROS v10.0 - ADMIN CHECK HOOK
// Verificação de Permissões Owner/Admin
// 🎯 UNIFICADO: Owner por EMAIL (igual godModeStore)
// MODO MASTER: Exclusivo para moisesblank@gmail.com
// ============================================

import { useAuth } from "@/hooks/useAuth";

// 🎯 CONSTANTE ÚNICA - Igual ao godModeStore
const OWNER_EMAIL = 'moisesblank@gmail.com';

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
// 🎯 UNIFICADO: Owner determinado por EMAIL (igual godModeStore)
// Isso garante que godModeStore e useAdminCheck usem a MESMA lógica
// ============================================

export function useAdminCheck(): AdminCheckResult {
  const { user, role: authRole, isLoading: authLoading } = useAuth();
  const role = authRole as AppRole | null;

  const userEmail = user?.email || null;
  
  // 🎯 CRÍTICO: Owner verificado por EMAIL (igual godModeStore)
  // Isso unifica a lógica com o store Zustand
  const isOwnerByEmail = (userEmail || '').toLowerCase() === OWNER_EMAIL.toLowerCase();
  const isOwnerByRole = role === "owner";
  
  // Owner = email OU role (email tem prioridade imediata)
  const isOwner = isOwnerByEmail || isOwnerByRole;
  
  const isAdmin = role === "admin";
  const isCoordinator = role === "coordenacao";
  const isAdminOrOwner = isOwner || isAdmin;
  // P1-2: 'employee' deprecated - verificar roles específicas
  const isEmployee = false; // deprecated

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
