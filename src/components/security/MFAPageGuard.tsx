// ============================================
// 🔐 MFA PAGE GUARD — Proteção de Páginas Inteiras
// Exige 2FA antes de acessar conteúdo sensível
// Validade: 24 horas por ação
// ============================================

import { ReactNode, useState, useEffect } from 'react';
import { useMFAGuard, MFAProtectedAction } from '@/hooks/useMFAGuard';
import { MFAActionModal } from './MFAActionModal';
import { Shield, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface MFAPageGuardProps {
  action: MFAProtectedAction;
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: ReactNode;
}

const ACTION_PAGE_LABELS: Record<MFAProtectedAction, { title: string; description: string }> = {
  change_password: {
    title: 'Alterar Senha',
    description: 'Verificação necessária para alterar sua senha.'
  },
  change_email: {
    title: 'Alterar Email',
    description: 'Verificação necessária para alterar seu email.'
  },
  register_new_device: {
    title: 'Novo Dispositivo',
    description: 'Verificação necessária para registrar novo dispositivo.'
  },
  change_subscription: {
    title: 'Alterar Assinatura',
    description: 'Verificação necessária para alterar sua assinatura.'
  },
  access_admin: {
    title: 'Área Administrativa',
    description: 'Verificação necessária para acessar área administrativa.'
  },
  manage_users: {
    title: 'Gerenciamento de Usuários',
    description: 'Esta área contém dados sensíveis. Confirme sua identidade.'
  },
  financial_access: {
    title: 'Área Financeira',
    description: 'Esta área contém informações financeiras confidenciais.'
  },
  delete_account: {
    title: 'Excluir Conta',
    description: 'Ação irreversível. Confirme sua identidade.'
  },
  device_verification: {
    title: 'Verificar Dispositivo',
    description: 'Confirme sua identidade para autorizar este dispositivo.'
  }
};

export function MFAPageGuard({ 
  action, 
  children, 
  title,
  description,
  icon
}: MFAPageGuardProps) {
  const { 
    isChecking, 
    isVerified, 
    needsMFA, 
    error,
    checkMFA,
    onVerificationComplete 
  } = useMFAGuard(action);

  const [showModal, setShowModal] = useState(false);

  const labels = ACTION_PAGE_LABELS[action];
  const displayTitle = title || labels.title;
  const displayDescription = description || labels.description;

  // Quando precisa de MFA, abre modal automaticamente
  useEffect(() => {
    if (needsMFA && !isVerified) {
      setShowModal(true);
    }
  }, [needsMFA, isVerified]);

  const handleVerificationSuccess = () => {
    onVerificationComplete(true);
    setShowModal(false);
  };

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
            </div>
          </div>
          <p className="text-muted-foreground">Verificando autorização...</p>
        </motion.div>
      </div>
    );
  }

  // Verified - show content
  if (isVerified) {
    return <>{children}</>;
  }

  // Needs MFA - show gate
  return (
    <>
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-card to-card/80">
            <CardHeader className="text-center pb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="mx-auto mb-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    {icon || <Lock className="w-10 h-10 text-primary-foreground" />}
                  </div>
                </div>
              </motion.div>
              <CardTitle className="text-xl">{displayTitle}</CardTitle>
              <CardDescription className="text-base">
                {displayDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Para sua segurança, enviaremos um código de verificação para seu email.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive text-center"
                >
                  {error}
                </motion.div>
              )}

              <Button 
                onClick={() => setShowModal(true)} 
                className="w-full gap-2"
                size="lg"
              >
                <Shield className="w-4 h-4" />
                Verificar Identidade
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                A verificação é válida por 24 horas para esta ação.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <MFAActionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleVerificationSuccess}
        action={action}
      />
    </>
  );
}
