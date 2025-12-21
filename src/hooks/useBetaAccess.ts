// ============================================
// DOGMA XII: HOOK DE ACESSO BETA
// Verifica expiração e status do aluno pagante
// ============================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BetaAccessResult {
  hasAccess: boolean;
  isStaff: boolean;
  role: string | null;
  daysRemaining: number | null;
  expiresAt: string | null;
  accessStart: string | null;
  reason: string | null;
  allowedArea: string | null;
  isLoading: boolean;
  isExpired: boolean;
  isFreeUser: boolean;
  refresh: () => Promise<void>;
}

export function useBetaAccess(): BetaAccessResult {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [accessData, setAccessData] = useState<{
    hasAccess: boolean;
    isStaff: boolean;
    role: string | null;
    daysRemaining: number | null;
    expiresAt: string | null;
    accessStart: string | null;
    reason: string | null;
    allowedArea: string | null;
  }>({
    hasAccess: false,
    isStaff: false,
    role: null,
    daysRemaining: null,
    expiresAt: null,
    accessStart: null,
    reason: null,
    allowedArea: null,
  });

  const checkAccess = useCallback(async () => {
    if (!user) {
      setAccessData({
        hasAccess: false,
        isStaff: false,
        role: null,
        daysRemaining: null,
        expiresAt: null,
        accessStart: null,
        reason: "NOT_AUTHENTICATED",
        allowedArea: null,
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("check_beta_access", {
        _user_id: user.id,
      });

      if (error) {
        console.error("Erro ao verificar acesso BETA:", error);
        setAccessData({
          hasAccess: false,
          isStaff: false,
          role: null,
          daysRemaining: null,
          expiresAt: null,
          accessStart: null,
          reason: "ERROR",
          allowedArea: null,
        });
      } else if (data) {
        const result = data as Record<string, unknown>;
        setAccessData({
          hasAccess: (result.has_access as boolean) ?? false,
          isStaff: (result.is_staff as boolean) ?? false,
          role: (result.role as string) ?? null,
          daysRemaining: (result.days_remaining as number) ?? null,
          expiresAt: (result.expires_at as string) ?? null,
          accessStart: (result.access_start as string) ?? null,
          reason: (result.reason as string) ?? null,
          allowedArea: (result.allowed_area as string) ?? null,
        });
      }
    } catch (err) {
      console.error("Erro ao verificar acesso BETA:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const isExpired = accessData.reason === "EXPIRED";
  const isFreeUser = accessData.role === "aluno_gratuito";

  return {
    ...accessData,
    isLoading,
    isExpired,
    isFreeUser,
    refresh: checkAccess,
  };
}

// Hook auxiliar para gestão de BETA pelo owner
export function useBetaManagement() {
  const { user } = useAuth();

  const grantAccess = async (userId: string, days: number = 365) => {
    const { data, error } = await supabase.rpc("grant_beta_access", {
      _user_id: userId,
      _days: days,
    });
    return { data, error };
  };

  const extendAccess = async (userId: string, additionalDays: number) => {
    const { data, error } = await supabase.rpc("extend_beta_access", {
      _user_id: userId,
      _additional_days: additionalDays,
    });
    return { data, error };
  };

  const revokeAccess = async (userId: string) => {
    const { data, error } = await supabase.rpc("revoke_beta_access", {
      _user_id: userId,
    });
    return { data, error };
  };

  const listBetaUsers = async () => {
    const { data, error } = await supabase.rpc("admin_list_beta_users");
    return { data, error };
  };

  return {
    grantAccess,
    extendAccess,
    revokeAccess,
    listBetaUsers,
  };
}
