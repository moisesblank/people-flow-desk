// ============================================
// 🛡️ MASTER MODE NAVIGATION GUARDS
// Impede navegação/refresh e SAÍDA do Master Mode com mudanças pendentes
// ============================================

import { useEffect, useCallback, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useMasterTransaction } from '@/stores/masterModeTransactionStore';
import { useGodMode } from '@/stores/godModeStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function MasterModeNavigationGuard() {
  const { isOwner, isActive, deactivate } = useGodMode();
  const { isDirty, discardAll, commitAll, isCommitting } = useMasterTransaction();

  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  // Bloquear navegação via React Router quando há mudanças pendentes
  const shouldBlock = isOwner && isActive && isDirty;

  const blocker = useBlocker(useCallback(() => shouldBlock, [shouldBlock]));

  // Handler para salvar e prosseguir (navegação)
  const handleSaveAndProceed = async () => {
    const result = await commitAll();
    if (result.success && blocker.state === 'blocked') {
      blocker.proceed?.();
    }
  };

  // Handler para descartar e prosseguir (navegação)
  const handleDiscardAndProceed = () => {
    discardAll();
    if (blocker.state === 'blocked') {
      blocker.proceed?.();
    }
  };

  // Handler para cancelar navegação
  const handleCancel = () => {
    if (blocker.state === 'blocked') {
      blocker.reset?.();
    }
  };

  // ✅ Listener: tentativa de desativar Master Mode com mudanças pendentes
  useEffect(() => {
    const handleMasterModeDeactivate = (e: CustomEvent) => {
      if (isOwner && isActive && isDirty) {
        e.preventDefault();
        setExitConfirmOpen(true);
      }
    };

    window.addEventListener('master-mode-deactivating', handleMasterModeDeactivate as EventListener);
    return () => window.removeEventListener('master-mode-deactivating', handleMasterModeDeactivate as EventListener);
  }, [isOwner, isActive, isDirty]);

  // Listener para reversão visual ao descartar
  useEffect(() => {
    const handleDiscardAll = (e: CustomEvent) => {
      const { changes } = e.detail;

      changes.forEach((change: { type: string; key?: string; originalValue?: unknown }) => {
        if (change.type === 'content_edit' && change.key && change.originalValue !== undefined) {
          const element = document.querySelector(`[data-editable-key="${change.key}"]`);
          if (element) {
            if (element.tagName === 'IMG') {
              (element as HTMLImageElement).src = change.originalValue as string;
            } else {
              element.textContent = change.originalValue as string;
            }
          }
        }
      });
    };

    window.addEventListener('master-discard-all', handleDiscardAll as EventListener);
    return () => window.removeEventListener('master-discard-all', handleDiscardAll as EventListener);
  }, []);

  // ✅ A) Modal de confirmação para NAVEGAÇÃO (React Router blocker)
  const navigationDialogOpen = blocker.state === 'blocked';

  // ✅ B) Modal de confirmação para SAIR do Master Mode
  const handleExitSave = async () => {
    const result = await commitAll();
    if (result.success) {
      setExitConfirmOpen(false);
      deactivate();
    }
  };

  const handleExitDiscard = () => {
    discardAll();
    setExitConfirmOpen(false);
    deactivate();
  };

  const handleExitCancel = () => setExitConfirmOpen(false);

  if (!navigationDialogOpen && !exitConfirmOpen) return null;

  return (
    <>
      <AlertDialog open={navigationDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-950 to-slate-900 border-purple-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              ⚠️ Alterações não salvas
            </AlertDialogTitle>
            <AlertDialogDescription className="text-purple-200/80">
              Você tem alterações pendentes no Modo Master. O que deseja fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel
              onClick={handleCancel}
              className="bg-transparent border-purple-500/30 text-purple-200 hover:bg-purple-800/30"
            >
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardAndProceed}
              className="bg-red-600/80 hover:bg-red-700 text-white"
            >
              Descartar e sair
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleSaveAndProceed}
              disabled={isCommitting}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              {isCommitting ? 'Salvando...' : 'Salvar e sair'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={exitConfirmOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-950 to-slate-900 border-purple-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              ✅ Confirmar correção
            </AlertDialogTitle>
            <AlertDialogDescription className="text-purple-200/80">
              Você tem alterações pendentes. Para valer de verdade, confirme e salve agora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel
              onClick={handleExitCancel}
              className="bg-transparent border-purple-500/30 text-purple-200 hover:bg-purple-800/30"
            >
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExitDiscard}
              className="bg-red-600/80 hover:bg-red-700 text-white"
            >
              Descartar
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleExitSave}
              disabled={isCommitting}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              {isCommitting ? 'Salvando...' : 'Confirmar e salvar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

