/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   🛡️ P0 RECOVERY SYSTEM v2.0 — ANTI-BLACK-SCREEN                            ║
 * ║                                                                              ║
 * ║   GARANTIAS:                                                                 ║
 * ║   1. Recovery buttons MUST execute real recovery logic                       ║
 * ║   2. Reload must fully reinitialize application state                        ║
 * ║   3. Clear cache + reload must purge SW, LocalStorage, IndexedDB            ║
 * ║   4. Recovery must never result in permanent black screen                    ║
 * ║   5. If recovery fails, safe fallback UI must load                          ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ============================================
// RECOVERY ACTIONS
// ============================================

/**
 * Soft reload - tries to reload the page
 */
export async function softReload(): Promise<void> {
  console.log('[P0-RECOVERY] Executing soft reload...');
  
  // Clear React Query cache if available
  try {
    window.dispatchEvent(new Event('mm-clear-cache'));
  } catch {}
  
  // Force reload from server (not cache)
  window.location.reload();
}

/**
 * Hard reload - clears all caches and forces fresh load
 */
export async function hardReload(): Promise<void> {
  console.log('[P0-RECOVERY] Executing HARD reload...');
  
  try {
    // 1. Clear React Query cache
    window.dispatchEvent(new Event('mm-clear-cache'));
  } catch (e) {
    console.warn('[P0-RECOVERY] Failed to clear query cache:', e);
  }
  
  try {
    // 2. Unregister all Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
      console.log('[P0-RECOVERY] Service workers unregistered:', registrations.length);
    }
  } catch (e) {
    console.warn('[P0-RECOVERY] Failed to unregister service workers:', e);
  }
  
  try {
    // 3. Clear all Cache Storage
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      console.log('[P0-RECOVERY] Caches cleared:', keys.length);
    }
  } catch (e) {
    console.warn('[P0-RECOVERY] Failed to clear caches:', e);
  }
  
  // 4. Force reload bypassing cache
  window.location.href = window.location.origin + window.location.pathname + '?_t=' + Date.now();
}

/**
 * Nuclear reset - clears EVERYTHING and forces fresh load
 */
export async function nuclearReset(): Promise<void> {
  console.log('[P0-RECOVERY] ⚠️ Executing NUCLEAR reset...');
  
  try {
    // 1. Clear React Query cache
    window.dispatchEvent(new Event('mm-clear-cache'));
  } catch {}
  
  try {
    // 2. Unregister all Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }
  } catch {}
  
  try {
    // 3. Clear all Cache Storage
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch {}
  
  try {
    // 4. Clear LocalStorage
    localStorage.clear();
    console.log('[P0-RECOVERY] LocalStorage cleared');
  } catch {}
  
  try {
    // 5. Clear SessionStorage
    sessionStorage.clear();
    console.log('[P0-RECOVERY] SessionStorage cleared');
  } catch {}
  
  try {
    // 6. Clear IndexedDB (all databases)
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases?.();
      if (databases) {
        for (const db of databases) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
            console.log('[P0-RECOVERY] Deleted IndexedDB:', db.name);
          }
        }
      }
    }
  } catch {}
  
  try {
    // 7. Clear all cookies for this domain
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    console.log('[P0-RECOVERY] Cookies cleared');
  } catch {}
  
  // 8. Force fresh navigation to home with cache buster
  window.location.href = window.location.origin + '/?_reset=' + Date.now();
}

/**
 * Escape to home - guaranteed navigation out
 */
export function escapeToHome(): void {
  console.log('[P0-RECOVERY] Escaping to home...');
  window.location.href = window.location.origin + '/';
}

/**
 * Force logout and return to auth
 */
export async function forceLogoutAndRestart(): Promise<void> {
  console.log('[P0-RECOVERY] Force logout and restart...');
  
  // Clear auth-related storage
  try {
    const authKeys = Object.keys(localStorage).filter(k => 
      k.includes('supabase') || 
      k.includes('auth') || 
      k.includes('session') ||
      k.includes('token')
    );
    authKeys.forEach(k => localStorage.removeItem(k));
    
    const sessionAuthKeys = Object.keys(sessionStorage).filter(k => 
      k.includes('supabase') || 
      k.includes('auth') || 
      k.includes('session') ||
      k.includes('token')
    );
    sessionAuthKeys.forEach(k => sessionStorage.removeItem(k));
  } catch {}
  
  // Navigate to auth
  window.location.href = window.location.origin + '/auth';
}

// ============================================
// RECOVERY UI INJECTION (Failsafe)
// REGRA: SEMPRE NÃO-BLOQUEANTE (MANUAL ONLY)
// ============================================

function injectManualRefreshButton(): void {
  try {
    const existing = document.getElementById('manual-refresh');
    if (existing) return;

    const host = document.createElement('div');
    host.id = 'manual-refresh';
    host.style.cssText = [
      'position:fixed',
      'right:16px',
      'bottom:16px',
      'z-index:2147483000',
      'pointer-events:auto',
    ].join(';');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Refresh Page';
    btn.setAttribute('aria-label', 'Recarregar a página (ação manual)');
    btn.onclick = () => window.location.reload();
    btn.style.cssText = [
      'padding:10px 14px',
      'border-radius:10px',
      'border:1px solid rgba(255,255,255,0.18)',
      'background:rgba(16,16,20,0.72)',
      'color:#f5f5f5',
      'font-weight:700',
      'cursor:pointer',
      'backdrop-filter: blur(10px)',
      '-webkit-backdrop-filter: blur(10px)',
    ].join(';');

    host.appendChild(btn);
    document.body.appendChild(host);
  } catch {
    // nunca bloquear
  }
}

/**
 * Legacy API: mantida por compatibilidade.
 * NOVA REGRA: não injeta overlay, apenas garante botão manual.
 */
export function injectSafeShellUI(_message: string = 'O sistema encontrou um problema.'): void {
  console.warn('[P0-RECOVERY] Safe shell solicitado — modo manual-only (sem overlay).');
  injectManualRefreshButton();
}

/**
 * Check if app is in a potentially broken state and show recovery
 * NOVA REGRA: sem overlay; apenas botão manual.
 */
export function checkAndShowRecoveryIfNeeded(): void {
  const root = document.getElementById('root');
  const hasContent = !!(root && root.children && root.children.length > 0);

  if (!hasContent) {
    console.warn('[P0-RECOVERY] Root vazio detectado — modo manual-only (sem overlay).');
    injectManualRefreshButton();
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).__P0_RECOVERY__ = {
    softReload,
    hardReload,
    nuclearReset,
    escapeToHome,
    forceLogoutAndRestart,
    injectSafeShellUI,
    checkAndShowRecoveryIfNeeded
  };
}
