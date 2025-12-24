// ============================================
// ⚡ SYNAPSE v7.0 - SW CLEANUP (LEI V - ESTABILIDADE)
// SW/PWA SUSPENSO por estabilidade - "Anti Tela Preta"
// ============================================

/**
 * v7.0: SW/PWA SUSPENSO por estabilidade (LEI V + incidente "tela preta")
 * 
 * Esta função NÃO registra Service Worker.
 * Em vez disso, LIMPA qualquer SW/cache legado para evitar
 * aprisionamento de versões antigas e tela preta.
 */
export async function registerServiceWorker(): Promise<void> {
  try {
    // Limpar todos os Service Workers registrados
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
      
      if (registrations.length > 0) {
        console.log(`[SYNAPSE] 🧹 ${registrations.length} Service Worker(s) removido(s)`);
      }
    }

    // Limpar todos os caches
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      
      if (keys.length > 0) {
        console.log(`[SYNAPSE] 🧹 ${keys.length} cache(s) limpo(s)`);
      }
    }
  } catch {
    // Silêncio intencional: não quebrar bootstrap
    // Qualquer erro aqui é aceitável - o importante é não travar o app
  }
}

/**
 * Verificar se está offline (funciona sem SW)
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Listener para mudanças de conexão (funciona sem SW)
 */
export function onConnectionChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
