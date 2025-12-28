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
// INICIALIZAÇÃO DESACOPLADA (LAZY)
// ============================================

// Cache para evitar re-inicialização
let _initialized = false;

/**
 * Inicializa o Evangelho da Velocidade de forma assíncrona
 * Não bloqueia o boot da aplicação
 */
export async function initEvangelhoCompleto(): Promise<void> {
  if (_initialized) return;
  _initialized = true;
  
  // Defer para não bloquear TTI
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => doInit(), { timeout: 2000 });
  } else {
    setTimeout(doInit, 1000);
  }
}

async function doInit(): Promise<void> {
  try {
    // Imports dinâmicos para não carregar tudo no boot
    const [
      { budgetEnforcer },
      { rum },
      { initDependencyExorcism },
      { initServerOptimization },
      { detectPerformanceTier, prefetcher }
    ] = await Promise.all([
      import('./performanceBudgets'),
      import('./realUserMonitoring'),
      import('./dependencyExorcism'),
      import('./serverOptimization'),
      import('./evangelhoVelocidade')
    ]);
    
    console.log('[EVANGELHO] ⚡ Inicializando (desacoplado)...');
    
    // Detectar tier
    const tier = detectPerformanceTier();
    console.log(`[EVANGELHO] Tier: ${tier.tier} (${tier.score}/100)`);
    
    // Inicializar sistemas
    prefetcher.init?.();
    budgetEnforcer.start();
    rum.init();
    initDependencyExorcism();
    initServerOptimization();
    
    // Report após load (com mais delay)
    window.addEventListener('load', () => {
      setTimeout(() => {
        console.log(budgetEnforcer.generateReport());
      }, 8000); // Aumentado para não competir com conteúdo
    });
    
    console.log('[EVANGELHO] ✅ Todos os Dogmas ativados.');
  } catch (e) {
    console.warn('[EVANGELHO] Falha na inicialização:', e);
  }
}

// ============================================
// SYNC FALLBACK (para quem ainda importa direto)
// ============================================
export function initEvangelhoSync(): void {
  console.warn('[EVANGELHO] ⚠️ initEvangelhoSync() é deprecated. Use initEvangelhoCompleto()');
  initEvangelhoCompleto();
}
