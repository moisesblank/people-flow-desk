// ============================================
// 🔐 MFA ACTION GUARD — 2FA Isolado por Ação Sensível
// TOTALMENTE DESACOPLADO de login/sessão/dispositivo
// ============================================

import React, { useState, useCallback } from 'react';
import { useMFAGuard, type MFAProtectedAction } from '@/hooks/useMFAGuard';
import { MFAActionModal } from './MFAActionModal';
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MFAActionGuardProps {
  /** Ação que requer 2FA */
  action: MFAProtectedAction;
  /** Conteúdo a ser renderizado quando verificado */
  children: React.ReactNode;
  /** Callback quando ação é bloqueada por falta de 2FA */
  onBlocked?: () => void;
  /** Callback quando 2FA é verificado com sucesso */
  onVerified?: () => void;
  /** Mostrar UI de bloqueio em vez de esconder conteúdo */
  showBlockedUI?: boolean;
  /** Título customizado para o modal */
  modalTitle?: string;
  /** Descrição customizada para o modal */
  modalDescription?: string;
}

/**
 * Wrapper que protege ações sensíveis com 2FA
 * 
 * @example
 * <MFAActionGuard action="change_password" onVerified={handlePasswordChange}>
 *   <Button>Alterar Senha</Button>
 * </MFAActionGuard>
 */
export function MFAActionGuard({
  action,
  children,
  onBlocked,
  onVerified,
  showBlockedUI = true,
  modalTitle,
  modalDescription
}: MFAActionGuardProps) {
  const [showModal, setShowModal] = useState(false);
  const { 
    isChecking, 
    needsMFA, 
    isVerified, 
    error,
    onVerificationComplete 
  } = useMFAGuard(action);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isVerified) {
      // 2FA já verificado, permite ação
      onVerified?.();
      return;
    }

    // Bloqueia ação e mostra modal
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
    onBlocked?.();
  }, [isVerified, onVerified, onBlocked]);

  const handleVerificationSuccess = useCallback(() => {
    onVerificationComplete(true);
    setShowModal(false);
    onVerified?.();
  }, [onVerificationComplete, onVerified]);

  const handleVerificationCancel = useCallback(() => {
    setShowModal(false);
  }, []);

  // Loading state
  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Verificando...</span>
      </div>
    );
  }

  // Já verificado - renderiza children normalmente
  if (isVerified) {
    return (
      <>
        {children}
        <MFAActionModal
          isOpen={showModal}
          onClose={handleVerificationCancel}
          onSuccess={handleVerificationSuccess}
          action={action}
          title={modalTitle}
          description={modalDescription}
        />
      </>
    );
  }

  // Precisa de 2FA - adiciona interceptor de clique
  if (needsMFA) {
    return (
      <>
        <div onClick={handleClick} className="cursor-pointer">
          {showBlockedUI ? (
            <div className="relative">
              {children}
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full border">
                  <ShieldAlert className="h-3 w-3 text-amber-500" />
                  <span>2FA necessário</span>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </div>

        <MFAActionModal
          isOpen={showModal}
          onClose={handleVerificationCancel}
          onSuccess={handleVerificationSuccess}
          action={action}
          title={modalTitle}
          description={modalDescription}
        />
      </>
    );
  }

  // Fallback - renderiza children com modal disponível
  return (
    <>
      <div onClick={handleClick}>
        {children}
      </div>
      <MFAActionModal
        isOpen={showModal}
        onClose={handleVerificationCancel}
        onSuccess={handleVerificationSuccess}
        action={action}
        title={modalTitle}
        description={modalDescription}
      />
    </>
  );
}

/**
 * Botão protegido por 2FA
 */
interface MFAProtectedButtonProps {
  action: MFAProtectedAction;
  onClick: () => void | Promise<void>;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export function MFAProtectedButton({
  action,
  onClick,
  children,
  variant = 'default',
  size = 'default',
  className,
  disabled
}: MFAProtectedButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const { isVerified, onVerificationComplete } = useMFAGuard(action);

  const handleClick = useCallback(async () => {
    if (isVerified) {
      setIsExecuting(true);
      try {
        await onClick();
      } finally {
        setIsExecuting(false);
      }
      return;
    }
    setShowModal(true);
  }, [isVerified, onClick]);

  const handleVerificationSuccess = useCallback(async () => {
    onVerificationComplete(true);
    setShowModal(false);
    setIsExecuting(true);
    try {
      await onClick();
    } finally {
      setIsExecuting(false);
    }
  }, [onVerificationComplete, onClick]);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={disabled || isExecuting}
      >
        {isExecuting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : !isVerified ? (
          <ShieldCheck className="h-4 w-4 mr-2" />
        ) : null}
        {children}
      </Button>

      <MFAActionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleVerificationSuccess}
        action={action}
      />
    </>
  );
}

export default MFAActionGuard;
