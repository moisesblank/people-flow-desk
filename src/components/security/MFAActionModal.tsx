// ============================================
// 🔐 MFA ACTION MODAL — Modal de Verificação 2FA
// Isolado do fluxo de login (para ações sensíveis)
// ============================================

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, ShieldCheck, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { MFAProtectedAction } from '@/hooks/useMFAGuard';

interface MFAActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  action: MFAProtectedAction;
  title?: string;
  description?: string;
}

const ACTION_LABELS: Record<MFAProtectedAction, { title: string; description: string }> = {
  change_password: {
    title: 'Alterar Senha',
    description: 'Para sua segurança, confirme sua identidade antes de alterar a senha.'
  },
  change_email: {
    title: 'Alterar E-mail',
    description: 'Confirme sua identidade antes de alterar seu e-mail.'
  },
  register_new_device: {
    title: 'Novo Dispositivo',
    description: 'Confirme sua identidade para registrar este dispositivo.'
  },
  change_subscription: {
    title: 'Alterar Plano',
    description: 'Confirme sua identidade antes de modificar seu plano.'
  },
  access_admin: {
    title: 'Acesso Administrativo',
    description: 'Esta área requer verificação adicional de segurança.'
  },
  manage_users: {
    title: 'Gerenciar Usuários',
    description: 'Confirme sua identidade para gerenciar usuários.'
  },
  financial_access: {
    title: 'Área Financeira',
    description: 'Confirme sua identidade para acessar informações financeiras.'
  },
  delete_account: {
    title: 'Excluir Conta',
    description: 'Esta ação é irreversível. Confirme sua identidade.'
  }
};

export function MFAActionModal({
  isOpen,
  onClose,
  onSuccess,
  action,
  title,
  description
}: MFAActionModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'send' | 'verify' | 'success'>('send');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeSentAt, setCodeSentAt] = useState<Date | null>(null);

  const actionLabel = ACTION_LABELS[action] || { 
    title: 'Verificação de Segurança', 
    description: 'Confirme sua identidade para continuar.' 
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('send');
      setCode('');
      setError(null);
    }
  }, [isOpen]);

  /**
   * Envia código 2FA por email
   */
  const handleSendCode = useCallback(async () => {
    if (!user?.id || !user?.email) {
      setError('Usuário não autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: sendError } = await supabase.functions.invoke('send-2fa-code', {
        body: {
          userId: user.id,
          email: user.email,
          action: action
        }
      });

      if (sendError) {
        throw sendError;
      }

      setCodeSentAt(new Date());
      setStep('verify');
      toast.success('Código enviado para seu e-mail');
    } catch (err: any) {
      console.error('[MFAActionModal] Erro ao enviar código:', err);
      setError(err.message || 'Erro ao enviar código');
      toast.error('Erro ao enviar código de verificação');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email, action]);

  /**
   * Verifica código 2FA
   */
  const handleVerifyCode = useCallback(async () => {
    if (!user?.id || code.length !== 6) {
      setError('Digite o código completo');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-2fa-code', {
        body: {
          userId: user.id,
          code: code
        }
      });

      if (verifyError) {
        throw verifyError;
      }

      if (!data?.success) {
        setError(data?.error || 'Código inválido');
        return;
      }

      setStep('success');
      toast.success('Verificação concluída!');
      
      // Delay para mostrar animação de sucesso
      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err: any) {
      console.error('[MFAActionModal] Erro ao verificar código:', err);
      setError(err.message || 'Código inválido ou expirado');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, code, onSuccess]);

  /**
   * Auto-submit quando código completo
   */
  useEffect(() => {
    if (code.length === 6 && step === 'verify') {
      handleVerifyCode();
    }
  }, [code, step, handleVerifyCode]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{title || actionLabel.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {description || actionLabel.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {/* Step: Enviar código */}
          {step === 'send' && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Verificação por E-mail</p>
                  <p className="text-muted-foreground mt-1">
                    Enviaremos um código de 6 dígitos para{' '}
                    <span className="font-medium text-foreground">
                      {user?.email || 'seu e-mail'}
                    </span>
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendCode}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Código'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Verificar código */}
          {step === 'verify' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Digite o código de 6 dígitos enviado para seu e-mail
                </p>

                <div className="flex justify-center">
                  <InputOTP
                    value={code}
                    onChange={setCode}
                    maxLength={6}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('send')}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Reenviar
                </Button>
                <Button
                  onClick={handleVerifyCode}
                  className="flex-1"
                  disabled={isLoading || code.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar'
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Não recebeu? Verifique a pasta de spam ou{' '}
                <button
                  onClick={() => setStep('send')}
                  className="text-primary hover:underline"
                  disabled={isLoading}
                >
                  solicite um novo código
                </button>
              </p>
            </div>
          )}

          {/* Step: Sucesso */}
          {step === 'success' && (
            <div className="text-center py-6">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Verificação Concluída!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sua identidade foi confirmada com sucesso.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MFAActionModal;
