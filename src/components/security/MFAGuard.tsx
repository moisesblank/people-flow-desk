// ============================================
// 🛡️ MFA GUARD — C021 ENFORCEMENT
// Gate V011: Admin só entra com MFA
// ============================================

import { useEffect, useState, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MFAGuardProps {
  children: React.ReactNode;
  requireMFA?: boolean;
}

interface MFACheckResult {
  allowed: boolean;
  reason: string;
  requires_mfa?: boolean;
  redirect_to?: string;
}

const ADMIN_ROLES = ['owner', 'admin', 'coordenacao', 'contabilidade'];

function MFAGuardComponent({ children, requireMFA = true }: MFAGuardProps) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [mfaStatus, setMfaStatus] = useState<{
    enabled: boolean;
    verified: boolean;
    needsSetup: boolean;
  }>({ enabled: false, verified: false, needsSetup: false });

  useEffect(() => {
    const checkMFAStatus = async () => {
      if (!user || !role) {
        setIsChecking(false);
        return;
      }

      // Se não é role admin, não exige MFA
      if (!ADMIN_ROLES.includes(role)) {
        setIsChecking(false);
        setMfaStatus({ enabled: true, verified: true, needsSetup: false });
        return;
      }

      try {
        // 🔒 P0 FIX: Não acessar user_mfa_settings diretamente (RLS bloqueia para alunos)
        // Usar apenas active_sessions.mfa_verified como fonte de verdade
        
        // Verificar se sessão atual tem MFA verificado
        const { data: session, error: sessionError } = await supabase
          .from('active_sessions')
          .select('mfa_verified')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('last_activity_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionError) {
          console.warn('[MFA Guard] Erro ao verificar sessão:', sessionError.message);
        }

        const mfaVerified = session?.mfa_verified ?? false;
        
        // Para admins: se tem mfa_verified = true, considera MFA configurado e verificado
        // Se não tem, considera que precisa setup (comportamento conservador)
        const mfaEnabled = mfaVerified; // Simplificação: se verificou, está habilitado

        setMfaStatus({
          enabled: mfaEnabled,
          verified: mfaVerified,
          needsSetup: !mfaEnabled && ADMIN_ROLES.includes(role),
        });

        // Se MFA não configurado e é rota admin, mostrar aviso
        if (!mfaEnabled && requireMFA && ADMIN_ROLES.includes(role)) {
          toast.warning('MFA obrigatório', {
            description: 'Você precisa configurar a autenticação de dois fatores para acessar esta área.',
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('[MFA Guard] Erro ao verificar MFA:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkMFAStatus();
  }, [user, role, location.pathname, requireMFA]);

  // Loading
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Shield className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  // Se não é admin ou MFA não é obrigatório, permite
  if (!role || !ADMIN_ROLES.includes(role) || !requireMFA) {
    return <>{children}</>;
  }

  // Se MFA não configurado, bloquear e pedir configuração
  if (mfaStatus.needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-amber-500/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-full bg-amber-500/20">
                <AlertTriangle className="h-12 w-12 text-amber-500" />
              </div>
              <CardTitle className="text-xl">MFA Obrigatório</CardTitle>
              <CardDescription>
                A autenticação de dois fatores é obrigatória para acessar áreas administrativas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">Por que é obrigatório?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Proteção contra acesso não autorizado</li>
                  <li>Conformidade com políticas de segurança</li>
                  <li>Proteção de dados sensíveis</li>
                </ul>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => navigate('/configuracoes/seguranca')}
              >
                <Lock className="mr-2 h-4 w-4" />
                Configurar MFA Agora
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => navigate('/dashboard')}
              >
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Se MFA configurado mas não verificado nesta sessão
  if (!mfaStatus.verified && mfaStatus.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-primary/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-full bg-primary/20">
                <Shield className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-xl">Verificação MFA Necessária</CardTitle>
              <CardDescription>
                Por favor, verifique sua identidade para continuar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => navigate('/auth/mfa-verify', { 
                  state: { returnTo: location.pathname } 
                })}
              >
                <Shield className="mr-2 h-4 w-4" />
                Verificar MFA
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // MFA OK, permitir acesso
  return <>{children}</>;
}

MFAGuardComponent.displayName = 'MFAGuard';

export const MFAGuard = memo(MFAGuardComponent);
