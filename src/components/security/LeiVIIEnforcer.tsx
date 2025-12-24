// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ LEI VII ENFORCER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
// Componente que executa a LEI VII automaticamente no App
// Deve ser incluído no nível mais alto da aplicação
// ═══════════════════════════════════════════════════════════════════════════════

import { memo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { executeLeiVII, updateLeiVIIUser } from '@/lib/constitution/executeLeiVII';

interface LeiVIIEnforcerProps {
  children: React.ReactNode;
}

/**
 * Componente que executa a LEI VII automaticamente
 * Deve envolver toda a aplicação para garantir proteção global
 */
export const LeiVIIEnforcer = memo(({ children }: LeiVIIEnforcerProps) => {
  const { user } = useAuth();

  // Executar LEI VII quando usuário mudar
  useEffect(() => {
    // Executar proteções
    const report = executeLeiVII(user?.email);
    
    // Log do resultado
    if (report.executed) {
      console.log(`[LEI VII] ✅ Proteções ativas: ${report.protectionsActive}`);
      
      if (report.handlers.includes('owner_bypass')) {
        console.log('[LEI VII] 👑 OWNER Mode - Bypass Total Ativo');
      }
    }
    
    // Cleanup: atualizar quando usuário mudar
    return () => {
      updateLeiVIIUser(user?.email || null);
    };
  }, [user?.email]);

  // Listener global para eventos de violação
  useEffect(() => {
    const handleViolation = (e: CustomEvent) => {
      const { type, severity, count } = e.detail;
      
      // Log violações no console (apenas dev)
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[LEI VII] Violação: ${type} (severity: ${severity}, count: ${count})`);
      }
    };

    window.addEventListener('sanctum-violation', handleViolation as EventListener);
    
    return () => {
      window.removeEventListener('sanctum-violation', handleViolation as EventListener);
    };
  }, []);

  return <>{children}</>;
});

LeiVIIEnforcer.displayName = 'LeiVIIEnforcer';

export default LeiVIIEnforcer;
