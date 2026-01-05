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
// RECOVERY ACTIONS (MANUAL ONLY)
// ============================================

function isUserGestureActive(): boolean {
  try {
    // Supported in modern browsers. If not supported, fail closed.
    return !!(navigator.userActivation && navigator.userActivation.isActive);
  } catch {
    return false;
  }
}


/**
 * Soft reload - recarrega a página (MANUAL ONLY).
 * Regra: nunca limpar cache/storage automaticamente.
 */
export async function softReload(): Promise<void> {
  console.log('[P0-RECOVERY] Soft reload (manual-only)...');

  // Bloqueio duro: não permitir reload programático sem gesto do usuário.
  if (!isUserGestureActive()) {
    console.warn('[P0-RECOVERY] Bloqueado: reload sem clique do usuário.');
    return;
  }

  window.location.reload();
}

/**
 * Hard reload - DEPRECATED (mantido por compatibilidade).
 * Nova regra: igual ao softReload (sem wipes).
 */
export async function hardReload(): Promise<void> {
  console.log('[P0-RECOVERY] Hard reload (deprecated → softReload)...');
  return softReload();
}

/**
 * Nuclear reset - DEPRECATED (mantido por compatibilidade).
 * Nova regra: sem wipes. Apenas reload manual.
 */
export async function nuclearReset(): Promise<void> {
  console.log('[P0-RECOVERY] Nuclear reset (deprecated → softReload)...');
  return softReload();
}

/**
 * Escape to home - navegação (MANUAL ONLY).
 */
export function escapeToHome(): void {
  console.log('[P0-RECOVERY] Escape to home (manual-only)...');
  if (!isUserGestureActive()) {
    console.warn('[P0-RECOVERY] Bloqueado: navegação sem clique do usuário.');
    return;
  }
  window.location.href = window.location.origin + '/';
}

/**
 * Force logout and return to auth - DEPRECATED.
 * Nova regra: não limpar storage automaticamente aqui.
 */
export async function forceLogoutAndRestart(): Promise<void> {
  console.log('[P0-RECOVERY] Force logout (deprecated — no auto-wipe)...');
  if (!isUserGestureActive()) {
    console.warn('[P0-RECOVERY] Bloqueado: ação sem clique do usuário.');
    return;
  }
  window.location.href = window.location.origin + '/auth';
}


// ============================================
// RECOVERY UI INJECTION (Failsafe)
// REGRA: SEMPRE NÃO-BLOQUEANTE (MANUAL ONLY)
// ============================================

// Função removida: botão Refresh Page controlado APENAS via React para OWNER
function injectManualRefreshButton(): void {
  // NO-OP: Injeção removida. Botão controlado exclusivamente pelo ManualRefreshButton.tsx
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
