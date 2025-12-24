// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ useLeiVII - Hook para integração com LEI VII
// ═══════════════════════════════════════════════════════════════════════════════
// Hook React que executa e gerencia a LEI VII de Proteção de Conteúdo
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  executeLeiVII, 
  updateLeiVIIUser, 
  getLeiVIIExecutionStatus,
  getLeiVIIStatus,
  isOwner,
  type LeiVIIExecutionReport,
} from '@/lib/constitution/executeLeiVII';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface LeiVIIState {
  executed: boolean;
  isOwner: boolean;
  isImmune: boolean;
  protectionsActive: number;
  violations: Record<string, number>;
  report: LeiVIIExecutionReport | null;
}

export interface UseLeiVIIReturn extends LeiVIIState {
  execute: () => void;
  getStatus: () => ReturnType<typeof getLeiVIIStatus>;
  recordViolation: (type: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function useLeiVII(): UseLeiVIIReturn {
  const { user } = useAuth();
  const [state, setState] = useState<LeiVIIState>({
    executed: false,
    isOwner: false,
    isImmune: false,
    protectionsActive: 0,
    violations: {},
    report: null,
  });

  // Verificar se é owner
  const userIsOwner = useMemo(() => {
    return isOwner(user?.email);
  }, [user?.email]);

  // Executar LEI VII quando usuário mudar
  useEffect(() => {
    const report = executeLeiVII(user?.email);
    
    setState({
      executed: report.executed,
      isOwner: userIsOwner,
      isImmune: userIsOwner,
      protectionsActive: report.protectionsActive,
      violations: {},
      report,
    });

    // Atualizar usuário no executor
    updateLeiVIIUser(user?.email || null);
  }, [user?.email, userIsOwner]);

  // Listener para violações
  useEffect(() => {
    const handleViolation = (e: CustomEvent) => {
      const { type } = e.detail;
      setState(prev => ({
        ...prev,
        violations: {
          ...prev.violations,
          [type]: (prev.violations[type] || 0) + 1,
        },
      }));
    };

    window.addEventListener('sanctum-violation', handleViolation as EventListener);
    
    return () => {
      window.removeEventListener('sanctum-violation', handleViolation as EventListener);
    };
  }, []);

  // Função para executar manualmente
  const execute = useCallback(() => {
    const report = executeLeiVII(user?.email);
    setState(prev => ({
      ...prev,
      executed: report.executed,
      protectionsActive: report.protectionsActive,
      report,
    }));
  }, [user?.email]);

  // Função para obter status
  const getStatus = useCallback(() => {
    return getLeiVIIStatus();
  }, []);

  // Função para registrar violação manual
  const recordViolation = useCallback((type: string) => {
    if (userIsOwner) return;
    
    const event = new CustomEvent('sanctum-violation', {
      detail: { type, severity: 5, metadata: { manual: true } }
    });
    window.dispatchEvent(event);
  }, [userIsOwner]);

  return {
    ...state,
    execute,
    getStatus,
    recordViolation,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK PARA COMPONENTES PROTEGIDOS
// ═══════════════════════════════════════════════════════════════════════════════

export function useLeiVIIProtection(resourceId?: string): {
  isProtected: boolean;
  isOwner: boolean;
  sessionId: string;
} {
  const { user } = useAuth();
  const userIsOwner = isOwner(user?.email);
  
  const sessionId = useMemo(() => {
    const status = getLeiVIIExecutionStatus();
    return `${user?.id?.slice(0, 8) || 'anon'}-${Date.now().toString(36)}`;
  }, [user?.id]);

  // Executar proteções
  useEffect(() => {
    if (!userIsOwner) {
      executeLeiVII(user?.email);
    }
  }, [user?.email, userIsOwner]);

  return {
    isProtected: !userIsOwner,
    isOwner: userIsOwner,
    sessionId,
  };
}

export default useLeiVII;
