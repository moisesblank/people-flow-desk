// ============================================
// PRIMEIRO ACESSO - ONBOARDING OBRIGATÓRIO
// 5 Etapas bloqueantes antes de usar a plataforma
// ============================================

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "next-themes";

// Etapas do onboarding
import { PlatformStepsStage } from "@/components/primeiro-acesso/PlatformStepsStage";
import { ThemeSelectionStage } from "@/components/primeiro-acesso/ThemeSelectionStage";
import { PasswordDefinitionStage } from "@/components/primeiro-acesso/PasswordDefinitionStage";
import { TrustDeviceStage } from "@/components/primeiro-acesso/TrustDeviceStage";
import { OnboardingComplete } from "@/components/primeiro-acesso/OnboardingComplete";

// Tipos
type OnboardingStage = 'platform_steps' | 'theme' | 'password' | 'trust_device' | 'complete';

interface OnboardingState {
  platform_steps_completed: boolean;
  ui_theme_selected: boolean;
  password_change_required: boolean;
  trusted_device_registered: boolean;
  onboarding_completed: boolean;
}

export default function PrimeiroAcesso() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState<OnboardingStage>('platform_steps');
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);

  // Carregar estado do onboarding e aplicar tema salvo
  useEffect(() => {
    if (!user?.id) return;

    const loadOnboardingState = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            platform_steps_completed,
            ui_theme_selected,
            password_change_required,
            trusted_device_registered,
            onboarding_completed,
            preferences
          `)
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[PrimeiroAcesso] Erro ao carregar estado:', error);
          toast.error('Erro ao carregar configuração');
          return;
        }

        if (!data) {
          // Perfil não existe, criar
          console.log('[PrimeiroAcesso] Criando perfil para novo usuário');
          return;
        }

        // Aplicar tema salvo se existir
        if (data.preferences && typeof data.preferences === 'object') {
          const prefs = data.preferences as { theme?: string };
          if (prefs.theme && ['light', 'dark', 'system', 'default'].includes(prefs.theme)) {
            // Mapear "system" legado para "default"
            const mappedTheme = prefs.theme === 'system' ? 'default' : prefs.theme;
            console.log('[PrimeiroAcesso] Aplicando tema salvo:', mappedTheme);
            setTheme(mappedTheme);
          }
        }

        const state: OnboardingState = {
          platform_steps_completed: data.platform_steps_completed ?? false,
          ui_theme_selected: data.ui_theme_selected ?? false,
          password_change_required: data.password_change_required ?? true,
          trusted_device_registered: data.trusted_device_registered ?? false,
          onboarding_completed: data.onboarding_completed ?? false,
        };

        setOnboardingState(state);

        // Se já completou, redirecionar para /alunos/dashboard
        if (state.onboarding_completed) {
          console.log('[PrimeiroAcesso] Onboarding já completo, redirecionando para /alunos/dashboard...');
          navigate('/alunos/dashboard', { replace: true });
          return;
        }

        // Determinar etapa atual baseada no estado
        if (!state.platform_steps_completed) {
          setCurrentStage('platform_steps');
        } else if (!state.ui_theme_selected) {
          setCurrentStage('theme');
        } else if (state.password_change_required) {
          setCurrentStage('password');
        } else if (!state.trusted_device_registered) {
          setCurrentStage('trust_device');
        } else {
          // Todas etapas completas, finalizar
          setCurrentStage('complete');
        }

        // Marcar início do onboarding se não marcado
        await supabase
          .from('profiles')
          .update({ onboarding_started_at: new Date().toISOString() })
          .eq('id', user.id)
          .is('onboarding_started_at', null);

      } catch (err) {
        console.error('[PrimeiroAcesso] Erro inesperado:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOnboardingState();
  }, [user?.id, navigate, setTheme]);

  // Completar etapa e avançar
  const completeStage = useCallback(async (stage: OnboardingStage, updateData: Partial<OnboardingState>) => {
    if (!user?.id) return;

    try {
      // Atualizar no banco
      const dbUpdate: Record<string, unknown> = {};
      
      if (stage === 'platform_steps') {
        dbUpdate.platform_steps_completed = true;
      } else if (stage === 'theme') {
        dbUpdate.ui_theme_selected = true;
      } else if (stage === 'password') {
        dbUpdate.password_change_required = false;
      } else if (stage === 'trust_device') {
        dbUpdate.trusted_device_registered = true;
      }

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdate)
        .eq('id', user.id);

      if (error) {
        console.error('[PrimeiroAcesso] Erro ao atualizar etapa:', error);
        toast.error('Erro ao salvar progresso');
        return;
      }

      // Atualizar estado local
      setOnboardingState(prev => prev ? { ...prev, ...updateData } : null);

      // Log de auditoria
      await supabase.from('audit_logs').insert({
        action: `onboarding_stage_completed_${stage}`,
        user_id: user.id,
        metadata: { stage, completed_at: new Date().toISOString() },
      });

      // Avançar para próxima etapa
      const stageOrder: OnboardingStage[] = ['platform_steps', 'theme', 'password', 'trust_device', 'complete'];
      const currentIndex = stageOrder.indexOf(stage);
      const nextStage = stageOrder[currentIndex + 1];
      
      if (nextStage) {
        setCurrentStage(nextStage);
      }

    } catch (err) {
      console.error('[PrimeiroAcesso] Erro ao completar etapa:', err);
    }
  }, [user?.id]);

  // Finalizar onboarding e redirecionar para /alunos
  const finalizeOnboarding = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('[PrimeiroAcesso] Erro ao finalizar:', error);
        toast.error('Erro ao finalizar configuração');
        return;
      }

      // Log de auditoria
      await supabase.from('audit_logs').insert({
        action: 'onboarding_completed',
        user_id: user.id,
        metadata: { completed_at: new Date().toISOString() },
      });

      toast.success('Configuração concluída! Bem-vindo à plataforma.');
      
      // Redirecionar para portal do aluno
      setTimeout(() => {
        navigate('/alunos/dashboard', { replace: true });
      }, 1500);

    } catch (err) {
      console.error('[PrimeiroAcesso] Erro inesperado:', err);
    }
  }, [user?.id, navigate]);

  // Loading
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Preparando seu primeiro acesso...</p>
        </div>
      </div>
    );
  }

  // Progresso - agora são 5 etapas
  const stageIndex = ['platform_steps', 'theme', 'password', 'trust_device', 'complete'].indexOf(currentStage);
  const totalStages = 5;
  const progress = ((stageIndex) / (totalStages - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header com progresso */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Configuração Inicial
              </h1>
              <p className="text-sm text-muted-foreground">
                Etapa {stageIndex + 1} de {totalStages}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentStage === 'platform_steps' && (
            <motion.div
              key="platform_steps"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PlatformStepsStage
                onComplete={() => completeStage('platform_steps', { platform_steps_completed: true })}
              />
            </motion.div>
          )}

          {currentStage === 'theme' && (
            <motion.div
              key="theme"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ThemeSelectionStage
                onComplete={() => completeStage('theme', { ui_theme_selected: true })}
              />
            </motion.div>
          )}

          {currentStage === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PasswordDefinitionStage
                userEmail={user.email || ''}
                userId={user.id}
                onComplete={() => completeStage('password', { password_change_required: false })}
              />
            </motion.div>
          )}

          {currentStage === 'trust_device' && (
            <motion.div
              key="trust_device"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TrustDeviceStage
                userId={user.id}
                onComplete={() => completeStage('trust_device', { trusted_device_registered: true })}
              />
            </motion.div>
          )}

          {currentStage === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <OnboardingComplete onFinish={finalizeOnboarding} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer de segurança */}
      <footer className="border-t border-border py-4">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            🔒 Suas informações estão protegidas com criptografia de ponta
          </p>
        </div>
      </footer>
    </div>
  );
}
