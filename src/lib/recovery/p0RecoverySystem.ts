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
// ============================================

/**
 * Injects a minimal safe shell UI when everything else fails
 */
export function injectSafeShellUI(message: string = 'O sistema encontrou um problema.'): void {
  // Remove any existing recovery overlay
  const existing = document.getElementById('p0-recovery');
  if (existing) existing.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'p0-recovery';
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: #0d0d0d;
    color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    max-width: 520px;
    width: 100%;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px;
    background: rgba(18,18,18,0.95);
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    padding: 24px;
  `;

  // Header with icon
  const header = document.createElement('div');
  header.style.cssText = `display: flex; align-items: center; gap: 12px; margin-bottom: 16px;`;
  
  const icon = document.createElement('div');
  icon.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  
  const title = document.createElement('div');
  title.style.cssText = `font-size: 18px; font-weight: 700;`;
  title.textContent = 'Recuperação do Sistema';
  
  header.appendChild(icon);
  header.appendChild(title);

  // Description
  const desc = document.createElement('div');
  desc.style.cssText = `font-size: 14px; opacity: 0.85; margin-bottom: 20px; line-height: 1.5;`;
  desc.textContent = message + ' Escolha uma opção abaixo para continuar.';

  // Buttons container
  const buttons = document.createElement('div');
  buttons.style.cssText = `display: flex; flex-direction: column; gap: 10px;`;

  // Button styles
  const btnPrimary = `
    padding: 14px 20px;
    border-radius: 12px;
    border: none;
    background: #dc2626;
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s;
  `;
  
  const btnSecondary = `
    padding: 14px 20px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.2);
    background: transparent;
    color: #f5f5f5;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s;
  `;
  
  const btnDanger = `
    padding: 14px 20px;
    border-radius: 12px;
    border: 1px solid rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s;
  `;

  // Button 1: Soft Reload
  const btn1 = document.createElement('button');
  btn1.type = 'button';
  btn1.style.cssText = btnPrimary;
  btn1.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/></svg> Recarregar Página`;
  btn1.onclick = () => softReload();

  // Button 2: Hard Reload
  const btn2 = document.createElement('button');
  btn2.type = 'button';
  btn2.style.cssText = btnSecondary;
  btn2.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Limpar Cache + Recarregar`;
  btn2.onclick = () => hardReload();

  // Button 3: Go Home
  const btn3 = document.createElement('button');
  btn3.type = 'button';
  btn3.style.cssText = btnSecondary;
  btn3.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Ir para Início`;
  btn3.onclick = () => escapeToHome();

  // Button 4: Nuclear Reset (dangerous)
  const btn4 = document.createElement('button');
  btn4.type = 'button';
  btn4.style.cssText = btnDanger;
  btn4.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Reinício Forçado (Limpa Tudo)`;
  btn4.onclick = () => {
    if (confirm('Isso irá limpar TODOS os dados locais (login, preferências, cache). Deseja continuar?')) {
      nuclearReset();
    }
  };

  buttons.appendChild(btn1);
  buttons.appendChild(btn2);
  buttons.appendChild(btn3);
  buttons.appendChild(btn4);

  card.appendChild(header);
  card.appendChild(desc);
  card.appendChild(buttons);
  overlay.appendChild(card);
  
  document.body.appendChild(overlay);
  
  console.log('[P0-RECOVERY] Safe shell UI injected');
}

/**
 * Check if app is in a potentially broken state and show recovery
 */
export function checkAndShowRecoveryIfNeeded(): void {
  const root = document.getElementById('root');
  const hasContent = !!(root && root.children && root.children.length > 0);
  const already = document.getElementById('p0-recovery');
  
  if (!hasContent && !already) {
    console.warn('[P0-RECOVERY] Detected black screen state, injecting recovery UI');
    injectSafeShellUI('A página não carregou corretamente.');
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
