// ============================================
// MASTER PRO ULTRA v3.0 - SERVICE WORKER REGISTER
// Registro do SW com tratamento de atualizações
// ============================================

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers não suportados');
    return undefined;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[SW] Registrado com sucesso:', registration.scope);

    // Verificar atualizações
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nova versão disponível
          console.log('[SW] Nova versão disponível');
          
          // Notificar usuário (opcional - pode usar toast)
          if (window.confirm('Nova versão disponível! Atualizar agora?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Verificar atualizações periodicamente (a cada hora)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error('[SW] Falha ao registrar:', error);
    return undefined;
  }
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
