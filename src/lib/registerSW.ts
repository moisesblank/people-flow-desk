// ============================================
// MASTER PRO ULTRA v3.0 - SERVICE WORKER REGISTER
// ⚠️ DESABILITADO - Causava problemas de MIME type em produção
// ============================================

/**
 * @deprecated Service Worker desabilitado para evitar problemas de cache
 * O cache é gerenciado via CDN/Cloudflare + hash de arquivos
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  console.warn('[SW] ⚠️ Service Worker DESABILITADO - usando cache via CDN');
  
  // 🧹 CLEANUP: Remove qualquer SW existente
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[SW] 🧹 Service Worker removido:', registration.scope);
      }
    } catch (error) {
      console.warn('[SW] Erro ao remover SW:', error);
    }
  }
  
  return undefined;
}

// Verificar se está offline
export function isOffline(): boolean {
  return !navigator.onLine;
}

// Listener para mudanças de conexão
export function onConnectionChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}