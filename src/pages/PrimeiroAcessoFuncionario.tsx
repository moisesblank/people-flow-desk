// ============================================
// PRIMEIRO ACESSO FUNCIONÁRIO - ONBOARDING EXCLUSIVO GESTÃO
// 4 Etapas: Boas-Vindas → Tema → Senha → Dispositivo
// Redirect final: /gestaofc (NUNCA /alunos)
// ============================================

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Shield, Users, Building2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Reutilizar etapas do onboarding de aluno
import { ThemeSelectionStage } from "@/components/primeiro-acesso/ThemeSelectionStage";
import { PasswordDefinitionStage } from "@/components/primeiro-acesso/PasswordDefinitionStage";
import { TrustDeviceStage } from "@/components/primeiro-acesso/TrustDeviceStage";

// Tipos
type FuncionarioStage = 'welcome' | 'theme' | 'password' | 'trust_device' | 'complete';

interface OnboardingState {
  platform_steps_completed: boolean;
  ui_theme_selected: boolean;
  password_change_required: boolean;
  trusted_device_registered: boolean;
  onboarding_completed: boolean;
}

export default function PrimeiroAcessoFuncionario() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState<FuncionarioStage>('welcome');
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [userName, setUserName] = useState<string>('');

  // Carregar estado do onboarding
  useEffect(() => {
    if (!user?.id) return;

    const loadOnboardingState = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            nome,
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
          console.error('[PrimeiroAcessoFuncionario] Erro ao carregar estado:', error);
          toast.error('Erro ao carregar configuração');
          return;
        }

        if (!data) {
          console.log('[PrimeiroAcessoFuncionario] Perfil não encontrado');
          return;
        }

        setUserName(data.nome || user.email?.split('@')[0] || 'Colaborador');

        // Aplicar tema salvo se existir
        if (data.preferences && typeof data.preferences === 'object') {
          const prefs = data.preferences as { theme?: string };
          if (prefs.theme && ['light', 'dark', 'system', 'default'].includes(prefs.theme)) {
            const mappedTheme = prefs.theme === 'system' ? 'default' : prefs.theme;
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

        // Se já completou, redirecionar para /gestaofc
        if (state.onboarding_completed) {
          console.log('[PrimeiroAcessoFuncionario] Onboarding já completo, redirecionando para /gestaofc...');
          navigate('/gestaofc', { replace: true });
          return;
        }

        // Determinar etapa atual
        if (!state.platform_steps_completed) {
          setCurrentStage('welcome');
        } else if (!state.ui_theme_selected) {
          setCurrentStage('theme');
        } else if (state.password_change_required) {
          setCurrentStage('password');
        } else if (!state.trusted_device_registered) {
          setCurrentStage('trust_device');
        } else {
          setCurrentStage('complete');
        }

        // Marcar início do onboarding
        await supabase
          .from('profiles')
          .update({ onboarding_started_at: new Date().toISOString() })
          .eq('id', user.id)
          .is('onboarding_started_at', null);

      } catch (err) {
        console.error('[PrimeiroAcessoFuncionario] Erro inesperado:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOnboardingState();
  }, [user?.id, navigate, setTheme]);

  // Completar etapa Welcome (boas-vindas)
  const completeWelcome = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ platform_steps_completed: true })
        .eq('id', user.id);

      if (error) {
        console.error('[PrimeiroAcessoFuncionario] Erro ao completar welcome:', error);
        toast.error('Erro ao salvar progresso');
        return;
      }

      // Log de auditoria
      await supabase.from('audit_logs').insert({
        action: 'funcionario_onboarding_welcome_completed',
        user_id: user.id,
        metadata: { completed_at: new Date().toISOString() },
      });

      setOnboardingState(prev => prev ? { ...prev, platform_steps_completed: true } : null);
      setCurrentStage('theme');

    } catch (err) {
      console.error('[PrimeiroAcessoFuncionario] Erro:', err);
    }
  }, [user?.id]);

  // Completar etapa de tema
  const completeTheme = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ui_theme_selected: true })
        .eq('id', user.id);

      if (error) {
        toast.error('Erro ao salvar tema');
        return;
      }

      await supabase.from('audit_logs').insert({
        action: 'funcionario_onboarding_theme_completed',
        user_id: user.id,
        metadata: { completed_at: new Date().toISOString() },
      });

      setOnboardingState(prev => prev ? { ...prev, ui_theme_selected: true } : null);
      setCurrentStage('password');

    } catch (err) {
      console.error('[PrimeiroAcessoFuncionario] Erro:', err);
    }
  }, [user?.id]);

  // Completar etapa de senha
  const completePassword = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ password_change_required: false })
        .eq('id', user.id);

      if (error) {
        toast.error('Erro ao salvar progresso');
        return;
      }

      await supabase.from('audit_logs').insert({
        action: 'funcionario_onboarding_password_completed',
        user_id: user.id,
        metadata: { completed_at: new Date().toISOString() },
      });

      setOnboardingState(prev => prev ? { ...prev, password_change_required: false } : null);
      setCurrentStage('trust_device');

    } catch (err) {
      console.error('[PrimeiroAcessoFuncionario] Erro:', err);
    }
  }, [user?.id]);

  // Completar etapa de dispositivo
  const completeDevice = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ trusted_device_registered: true })
        .eq('id', user.id);

      if (error) {
        toast.error('Erro ao registrar dispositivo');
        return;
      }

      await supabase.from('audit_logs').insert({
        action: 'funcionario_onboarding_device_completed',
        user_id: user.id,
        metadata: { completed_at: new Date().toISOString() },
      });

      setOnboardingState(prev => prev ? { ...prev, trusted_device_registered: true } : null);
      setCurrentStage('complete');

    } catch (err) {
      console.error('[PrimeiroAcessoFuncionario] Erro:', err);
    }
  }, [user?.id]);

  // Finalizar onboarding - REDIRECIONA PARA /gestaofc
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
        console.error('[PrimeiroAcessoFuncionario] Erro ao finalizar:', error);
        toast.error('Erro ao finalizar configuração');
        return;
      }

      // Log de auditoria
      await supabase.from('audit_logs').insert({
        action: 'funcionario_onboarding_completed',
        user_id: user.id,
        metadata: { 
          completed_at: new Date().toISOString(),
          redirect_to: '/gestaofc'
        },
      });

      toast.success('Configuração concluída! Bem-vindo à equipe.');
      
      // 🛡️ CRÍTICO: Redirecionar para /gestaofc (NUNCA /alunos)
      setTimeout(() => {
        navigate('/gestaofc', { replace: true });
      }, 1500);

    } catch (err) {
      console.error('[PrimeiroAcessoFuncionario] Erro inesperado:', err);
    }
  }, [user?.id, navigate]);

  // Loading
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Preparando seu acesso...</p>
        </div>
      </div>
    );
  }

  // Progresso - 4 etapas para funcionários
  const stageOrder: FuncionarioStage[] = ['welcome', 'theme', 'password', 'trust_device', 'complete'];
  const stageIndex = stageOrder.indexOf(currentStage);
  const totalStages = 4; // Sem contar 'complete'
  const progress = Math.min((stageIndex / totalStages) * 100, 100);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header com progresso */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Configuração — Equipe
                </h1>
                <p className="text-sm text-muted-foreground">
                  Etapa {Math.min(stageIndex + 1, totalStages)} de {totalStages}
                </p>
              </div>
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
          {/* ETAPA 1: Boas-Vindas à Equipe */}
          {currentStage === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-primary/20">
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-10 w-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Bem-vindo à Equipe, {userName}!
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Você foi adicionado como membro da equipe de gestão. 
                      Vamos configurar seu acesso em poucos passos.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="font-medium text-sm">Acesso Seguro</h3>
                      <p className="text-xs text-muted-foreground">Área administrativa protegida</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="font-medium text-sm">Gestão FC</h3>
                      <p className="text-xs text-muted-foreground">Painel de gerenciamento</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="font-medium text-sm">Permissões</h3>
                      <p className="text-xs text-muted-foreground">Baseadas no seu cargo</p>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    onClick={completeWelcome}
                    className="min-w-[200px]"
                  >
                    Começar Configuração
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ETAPA 2: Tema */}
          {currentStage === 'theme' && (
            <motion.div
              key="theme"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ThemeSelectionStage 
                onComplete={completeTheme} 
              />
            </motion.div>
          )}

          {/* ETAPA 3: Senha */}
          {currentStage === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PasswordDefinitionStage 
                userEmail={user?.email || ''}
                userId={user?.id || ''}
                onComplete={completePassword} 
              />
            </motion.div>
          )}

          {/* ETAPA 4: Dispositivo */}
          {currentStage === 'trust_device' && (
            <motion.div
              key="trust_device"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TrustDeviceStage 
                userId={user?.id || ''}
                onComplete={completeDevice} 
              />
            </motion.div>
          )}

          {/* CONCLUSÃO */}
          {currentStage === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-2 border-green-500/30 bg-green-500/5">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Tudo Pronto!
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Sua conta está configurada. Você será redirecionado para o painel de gestão.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={finalizeOnboarding}
                    className="min-w-[200px] bg-green-600 hover:bg-green-700"
                  >
                    Acessar Painel de Gestão
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
