// ============================================
// 🏛️ LEI I - LAZY PDF GENERATOR
// jsPDF só carrega quando usuário clica "Gerar PDF"
// Economiza ~300KB no bundle inicial
// ============================================

// Cache do módulo carregado
let jsPDFModule: any = null;
let autoTableLoaded = false;

/**
 * Carrega jsPDF e jspdf-autotable sob demanda
 * @returns Promise com classe jsPDF
 */
export async function getJsPDF(): Promise<any> {
  if (!jsPDFModule) {
    console.log('[LAZY] 📄 Carregando jsPDF...');
    const startTime = performance.now();
    
    // Import paralelo
    const [{ default: jsPDF }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    
    jsPDFModule = jsPDF;
    autoTableLoaded = true;
    
    const loadTime = performance.now() - startTime;
    console.log(`[LAZY] ✅ jsPDF carregado em ${loadTime.toFixed(0)}ms`);
  }
  
  return jsPDFModule;
}

/**
 * Verifica se jsPDF já está carregado
 */
export function isJsPDFLoaded(): boolean {
  return jsPDFModule !== null;
}

/**
 * Pré-carrega jsPDF (para hover em botões PDF)
 */
export function preloadJsPDF(): void {
  if (!jsPDFModule) {
    // Usa requestIdleCallback se disponível
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        getJsPDF().catch(() => {});
      });
    } else {
      setTimeout(() => {
        getJsPDF().catch(() => {});
      }, 100);
    }
  }
}
