// ============================================
// ⚡ EVANGELHO DA VELOCIDADE - ÍNDICE SAGRADO ⚡
// ============================================
// Todos os 10 Dogmas reunidos em um único ponto de entrada

// DOGMA I: Critical Render Path (em index.html)
// DOGMA II: Compressão Total
export * from './compressionUtils';

// DOGMA III: Lazy Loading Inteligente
export { SacredImage, SacredIframe } from '@/components/performance/SacredImage';

// DOGMA IV: Queries Sub-50ms
export * from './queryOptimizer';

// DOGMA V: Cache Omnipresente
export * from './cacheConfig';

// DOGMA VI: Silêncio das Requisições
export * from './requestBatching';

// DOGMA VII: Ressurreição no Servidor
export * from './serverOptimization';

// DOGMA VIII: Exorcismo de Dependências
export * from './dependencyExorcism';

// DOGMA IX: Peregrinação ao 3G
export * from './performanceBudgets';

// DOGMA X: Vigília Eterna
export * from './realUserMonitoring';

// Core - Evangelho Principal
export * from './evangelhoVelocidade';

// ============================================
// INICIALIZAÇÃO UNIFICADA
// ============================================

import { budgetEnforcer } from './performanceBudgets';
import { rum } from './realUserMonitoring';
import { initDependencyExorcism } from './dependencyExorcism';
import { initServerOptimization } from './serverOptimization';
import { detectPerformanceTier, prefetcher } from './evangelhoVelocidade';

export function initEvangelhoCompleto(): void {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║      ⚡ EVANGELHO DA VELOCIDADE v2.0 - INICIALIZANDO ⚡    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  // Detectar tier de performance
  const tier = detectPerformanceTier();
  console.log(`[EVANGELHO] Performance Tier: ${tier.tier} (${tier.score}/100)`);

  // Inicializar todos os sistemas
  prefetcher.init?.();
  budgetEnforcer.start();
  rum.init();
  initDependencyExorcism();
  initServerOptimization();

  // Report após carregamento
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.log(budgetEnforcer.generateReport());
      console.log(`[EVANGELHO] RUM Score: ${rum.getScore()}/100`);
    }, 5000);
  });

  console.log('[EVANGELHO] ⚡ Todos os 10 Dogmas ativados. A Matriz está protegida.');
}

// ============================================
// AUTO-INIT DESABILITADO
// A inicialização é feita via main.tsx com defer
// para não bloquear o TTI
// ============================================
// if (typeof window !== 'undefined') {
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initEvangelhoCompleto);
//   } else {
//     initEvangelhoCompleto();
//   }
// }
