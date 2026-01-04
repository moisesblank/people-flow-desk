/**
 * 🎯 SIMULADOS — Hook de Bloqueio de Navegação
 * Constituição SYNAPSE Ω v10.0
 * 
 * Bloqueia:
 * - beforeunload (fechar aba)
 * - Navegação interna (React Router)
 * - Botão voltar
 * 
 * Ativo apenas quando simulado está RUNNING.
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface UseSimuladoNavBlockOptions {
  isRunning: boolean;
  simuladoTitle?: string;
  onConfirmExit?: () => Promise<void>;
}

interface UseSimuladoNavBlockReturn {
  isBlocking: boolean;
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
  requestExit: () => void;
  allowNavigation: () => void;
  handleConfirmExit: () => Promise<void>;
  handleCancelExit: () => void;
}

export function useSimuladoNavBlock(options: UseSimuladoNavBlockOptions): UseSimuladoNavBlockReturn {
  const { isRunning, simuladoTitle = "Simulado", onConfirmExit } = options;
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const allowNavigationRef = useRef(false);

  // beforeunload - bloqueia fechamento de aba
  useEffect(() => {
    if (!isRunning) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return;
      
      e.preventDefault();
      const msg = "Você está no meio do simulado. Se sair, sua tentativa pode ser finalizada automaticamente.";
      e.returnValue = msg;
      return msg;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isRunning, simuladoTitle]);

  // Intercepta cliques em links
  useEffect(() => {
    if (!isRunning) return;

    const handleClick = (e: MouseEvent) => {
      if (allowNavigationRef.current) return;

      const target = e.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement;
      
      if (link && link.href) {
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
          const targetPath = url.pathname + url.search;
          if (targetPath !== location.pathname + location.search) {
            e.preventDefault();
            e.stopPropagation();
            setPendingNavigation(targetPath);
            setShowConfirmDialog(true);
          }
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isRunning, location]);

  // Intercepta popstate (botão voltar)
  useEffect(() => {
    if (!isRunning) return;

    const handlePopState = () => {
      if (allowNavigationRef.current) return;
      
      window.history.pushState(null, "", location.pathname + location.search);
      setPendingNavigation("back");
      setShowConfirmDialog(true);
    };

    window.history.pushState(null, "", location.pathname + location.search);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isRunning, location]);

  const allowNavigation = useCallback(() => {
    allowNavigationRef.current = true;
  }, []);

  const requestExit = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const handleConfirmExit = useCallback(async () => {
    allowNavigationRef.current = true;
    
    if (onConfirmExit) {
      await onConfirmExit();
    }

    setShowConfirmDialog(false);

    if (pendingNavigation) {
      if (pendingNavigation === "back") {
        navigate(-1);
      } else {
        navigate(pendingNavigation);
      }
    }
    
    setPendingNavigation(null);
  }, [navigate, pendingNavigation, onConfirmExit]);

  const handleCancelExit = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  }, []);

  return {
    isBlocking: isRunning && !allowNavigationRef.current,
    showConfirmDialog,
    setShowConfirmDialog,
    requestExit,
    allowNavigation,
    handleConfirmExit,
    handleCancelExit,
  };
}
