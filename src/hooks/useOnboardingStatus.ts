// ============================================
// HOOK: VERIFICAÇÃO DE ONBOARDING
// Verifica se usuário completou primeiro acesso
// ============================================

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const OWNER_EMAIL = "moisesblank@gmail.com";

interface OnboardingStatus {
  isLoading: boolean;
  isComplete: boolean;
  needsOnboarding: boolean;
  // Etapas individuais
  platformStepsCompleted: boolean;
  uiThemeSelected: boolean;
  passwordDefined: boolean;
  trustedDeviceRegistered: boolean;
}

export function useOnboardingStatus(): OnboardingStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<Omit<OnboardingStatus, 'needsOnboarding'>>({
    isLoading: true,
    isComplete: true, // Default true para não bloquear durante loading
    platformStepsCompleted: true,
    uiThemeSelected: true,
    passwordDefined: true,
    trustedDeviceRegistered: true,
  });

  // Owner bypass - NUNCA bloqueia owner no onboarding
  const isOwner = useMemo(() => {
    return user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  }, [user?.email]);

  useEffect(() => {
    if (!user?.id) {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Owner bypass
    if (isOwner) {
      setStatus({
        isLoading: false,
        isComplete: true,
        platformStepsCompleted: true,
        uiThemeSelected: true,
        passwordDefined: true,
        trustedDeviceRegistered: true,
      });
      return;
    }

    const checkOnboarding = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            onboarding_completed,
            platform_steps_completed,
            ui_theme_selected,
            password_change_required,
            trusted_device_registered
          `)
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[useOnboardingStatus] Erro:', error);
          // Em caso de erro, não bloquear
          setStatus(prev => ({ ...prev, isLoading: false, isComplete: true }));
          return;
        }

        if (!data) {
          // Perfil não existe - precisa onboarding
          setStatus({
            isLoading: false,
            isComplete: false,
            platformStepsCompleted: false,
            uiThemeSelected: false,
            passwordDefined: false,
            trustedDeviceRegistered: false,
          });
          return;
        }

        setStatus({
          isLoading: false,
          isComplete: data.onboarding_completed ?? false,
          platformStepsCompleted: data.platform_steps_completed ?? false,
          uiThemeSelected: data.ui_theme_selected ?? false,
          passwordDefined: !(data.password_change_required ?? true),
          trustedDeviceRegistered: data.trusted_device_registered ?? false,
        });

      } catch (err) {
        console.error('[useOnboardingStatus] Erro inesperado:', err);
        setStatus(prev => ({ ...prev, isLoading: false, isComplete: true }));
      }
    };

    checkOnboarding();
  }, [user?.id, isOwner]);

  return {
    ...status,
    needsOnboarding: !status.isLoading && !status.isComplete,
  };
}
