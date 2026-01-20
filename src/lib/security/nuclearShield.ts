// ═══════════════════════════════════════════════════════════════════════════════
// ☢️ NUCLEAR SHIELD v3.1 — TEMPORARIAMENTE DESABILITADO (EMERGÊNCIA)
// ═══════════════════════════════════════════════════════════════════════════════
// MODO EMERGENCIAL: Todas as proteções desabilitadas para permitir acesso
// Reativar gradualmente após alunos acessarem com sucesso
// ═══════════════════════════════════════════════════════════════════════════════

// 🚨 MASTER KILL SWITCH - DESABILITA TUDO
const NUCLEAR_SHIELD_ENABLED = false;

export function setOwnerMode(roleOrEmail: string | null | undefined): void {
  // Desabilitado - aceita qualquer usuário
  console.log('[NUCLEAR SHIELD] DESABILITADO - Modo emergencial');
}

export function initNuclearShield(ownerRole?: string | null): () => void {
  // 🚨 PROTEÇÃO TOTALMENTE DESABILITADA
  if (!NUCLEAR_SHIELD_ENABLED) {
    console.log('[NUCLEAR SHIELD] ⚠️ TOTALMENTE DESABILITADO (modo emergencial)');
    console.log('[NUCLEAR SHIELD] Site acessível para todos os usuários');
    return () => {};
  }

  // Este código nunca vai rodar enquanto NUCLEAR_SHIELD_ENABLED = false
  return () => {};
}

export const nuclearShield = {
  init: initNuclearShield,
  setOwnerMode,
  executeNuclearResponse: () => {}, // Desabilitado
  isDomainAuthorized: () => true,   // Sempre autorizado
};

export default nuclearShield;
