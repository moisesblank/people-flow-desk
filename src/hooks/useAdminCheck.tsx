// ============================================
// MOISÉS MEDEIROS v9.0 - ADMIN CHECK HOOK
// Verificação de Permissões Owner/Admin
// MODO DEUS: Exclusivo para moisesblank@gmail.com
// ============================================

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "owner" | "admin" | "employee";

interface AdminCheckResult {
  isOwner: boolean;
  isAdmin: boolean;
  isAdminOrOwner: boolean;
  isEmployee: boolean;
  role: AppRole | null;
  isLoading: boolean;
  canEdit: boolean;
  isGodMode: boolean;
  userEmail: string | null;
}

const OWNER_EMAIL = "moisesblank@gmail.com";

export function useAdminCheck(): AdminCheckResult {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
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
          console.error("Erro ao buscar role:", error);
          setRole(null);
        } else {
          setRole(data?.role as AppRole);
        }
      } catch (err) {
        console.error("Erro ao verificar permissões:", err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, [user]);

  const userEmail = user?.email || null;
  
  // Verificação dupla de owner (role + email exato)
  const isOwner = role === "owner" && userEmail === OWNER_EMAIL;
  const isAdmin = role === "admin";
  const isAdminOrOwner = isOwner || isAdmin;
  const isEmployee = role === "employee";
  
  // MODO DEUS: Verificação tripla (role + email + hardcoded)
  const isGodMode = isOwner && userEmail === OWNER_EMAIL;
  
  // Apenas owner pode editar campos críticos
  const canEdit = isGodMode;

  return {
    isOwner,
    isAdmin,
    isAdminOrOwner,
    isEmployee,
    role,
    isLoading,
    canEdit,
    isGodMode,
    userEmail
  };
}
