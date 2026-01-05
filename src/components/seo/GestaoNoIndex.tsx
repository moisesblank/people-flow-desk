// ============================================
// 🚫 GESTAO NOINDEX - Bloco 6 Compliance
// Área /gestaofc não deve ser indexada por bots
// ✅ forwardRef para compatibilidade com Radix UI
// ============================================

import { useEffect, forwardRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';

/**
 * Componente que aplica noindex/nofollow em rotas /gestaofc/*
 * Também adiciona X-Robots-Tag via meta http-equiv (fallback)
 */
export function GestaoNoIndex() {
  const location = useLocation();
  const isGestaoPath = location.pathname.startsWith('/gestaofc');

  useEffect(() => {
    if (isGestaoPath) {
      // Adicionar meta tag dinamicamente se ainda não existir
      let metaRobots = document.querySelector('meta[name="robots"]');
      if (metaRobots) {
        // Salvar valor original
        const originalContent = metaRobots.getAttribute('content');
        metaRobots.setAttribute('content', 'noindex, nofollow');
        
        // Restaurar ao sair da área
        return () => {
          metaRobots?.setAttribute('content', originalContent || 'index, follow');
        };
      }
    }
  }, [isGestaoPath, location.pathname]);

  if (!isGestaoPath) {
    return null;
  }

  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta httpEquiv="X-Robots-Tag" content="noindex, nofollow" />
    </Helmet>
  );
}
