// ============================================
// HOOK: VERIFICAÇÃO DE ONBOARDING
// Verifica se usuário completou primeiro acesso
// v10.4.2: Agora retorna redirectPath separado para funcionários
// ============================================

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isGestaoRole } from "@/core/urlAccessControl";

/**
 * @deprecated P1-2 FIX: Usar role='owner' para verificações.
 */
// const OWNER_EMAIL = "moisesblank@gmail.com"; // REMOVIDO - Usar role='owner'

interface OnboardingStatus {
  isLoading: boolean;
  isComplete: boolean;
  needsOnboarding: boolean;
  // Etapas individuais
  platformStepsCompleted: boolean;
  uiThemeSelected: boolean;
  passwordDefined: boolean;
  trustedDeviceRegistered: boolean;
  // v10.4.2: Path correto para onboarding baseado no role
  onboardingRedirectPath: string;
}

export function useOnboardingStatus(): OnboardingStatus {
  const { user, role } = useAuth();
  const [status, setStatus] = useState<Omit<OnboardingStatus, 'needsOnboarding' | 'onboardingRedirectPath'>>({
    isLoading: true,
    isComplete: false, // 🔒 P0 FIX: Default FALSE para garantir redirecionamento seguro
    platformStepsCompleted: false,
    uiThemeSelected: false,
    passwordDefined: false,
    trustedDeviceRegistered: false,
  });

  // Owner bypass - NUNCA bloqueia owner no onboarding
  // P1-2 FIX: Role como fonte da verdade
  const isOwner = useMemo(() => {
    return role === 'owner';
  }, [role]);

  // 🛡️ v10.4.2: Determinar path de onboarding baseado no role
  const onboardingRedirectPath = useMemo(() => {
    // Funcionários (gestão roles) → onboarding separado
    if (role && isGestaoRole(role)) {
      return "/primeiro-acesso-funcionario";
    }
    // Alunos e demais → onboarding normal
    return "/primeiro-acesso";
  }, [role]);

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
    onboardingRedirectPath,
  };
}
