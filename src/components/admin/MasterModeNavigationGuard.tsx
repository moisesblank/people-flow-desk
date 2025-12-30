// ============================================
// 🛡️ MASTER MODE NAVIGATION GUARDS
// Impede navegação/refresh e SAÍDA do Master Mode com mudanças pendentes
// NOTA: Usa beforeunload + useNavigate (sem useBlocker que requer data router)
// ============================================

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();

  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const lastLocation = useRef(location.pathname);

  // Bloquear navegação quando há mudanças pendentes
  const shouldBlock = isOwner && isActive && isDirty;

  // ✅ Bloquear refresh/fechar aba do navegador
  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldBlock]);

  // ✅ Interceptar cliques em links para mostrar modal
  useEffect(() => {
    if (!shouldBlock) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        const url = new URL(link.href, window.location.origin);
        // Só interceptar navegação interna
        if (url.origin === window.location.origin && url.pathname !== location.pathname) {
          e.preventDefault();
          e.stopPropagation();
          setPendingNavigation(url.pathname);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [shouldBlock, location.pathname]);

  // ✅ Detectar mudança de rota via popstate (botão voltar)
  useEffect(() => {
    if (!shouldBlock) return;

    const handlePopState = () => {
      if (location.pathname !== lastLocation.current) {
        // Voltar para onde estava e mostrar modal
        window.history.pushState(null, '', lastLocation.current);
        setPendingNavigation(location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [shouldBlock, location.pathname]);

  // Atualizar última localização
  useEffect(() => {
    if (!pendingNavigation) {
      lastLocation.current = location.pathname;
    }
  }, [location.pathname, pendingNavigation]);

  // Handler para salvar e prosseguir (navegação)
  const handleSaveAndProceed = async () => {
    const result = await commitAll();
    if (result.success && pendingNavigation) {
      const dest = pendingNavigation;
      setPendingNavigation(null);
      navigate(dest);
    }
  };

  // Handler para descartar e prosseguir (navegação)
  const handleDiscardAndProceed = () => {
    discardAll();
    if (pendingNavigation) {
      const dest = pendingNavigation;
      setPendingNavigation(null);
      navigate(dest);
    }
  };

  // Handler para cancelar navegação
  const handleCancel = () => {
    setPendingNavigation(null);
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

  // Modal de navegação pendente
  const navigationDialogOpen = pendingNavigation !== null;

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
