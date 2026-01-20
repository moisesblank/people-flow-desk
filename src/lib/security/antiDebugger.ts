// ============================================
// 🛡️ ANTI-DEBUGGER LAYER v2.1 — TEMPORARIAMENTE DESABILITADO
// ============================================
// MODO EMERGENCIAL: Todas as proteções desabilitadas
// Reativar gradualmente após alunos acessarem com sucesso
// ============================================

// 🚨 MASTER KILL SWITCH
const ANTI_DEBUGGER_ENABLED = false;

export function setOwnerMode(roleOrEmail: string | null | undefined): void {
  console.log('[ANTI-DEBUGGER] DESABILITADO - Modo emergencial');
}

export function initAntiDebugger(userEmail?: string | null): () => void {
  if (!ANTI_DEBUGGER_ENABLED) {
    console.log('[ANTI-DEBUGGER] ⚠️ TOTALMENTE DESABILITADO (modo emergencial)');
    return () => {};
  }

  return () => {};
}

export function enableAggressiveMode(): void {
  // Desabilitado
}

export const antiDebugger = {
  init: initAntiDebugger,
  setOwnerMode,
  enableAggressiveMode: () => {},
  detectDevTools: () => false,
  detectDimensions: () => false,
  aggressiveResponse: () => {},
  blockDebugger: () => {},
};

export default antiDebugger;
