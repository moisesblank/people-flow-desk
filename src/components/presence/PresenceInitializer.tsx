// ============================================
// INICIALIZADOR DE PRESENÇA
// Carrega o hook de heartbeat no nível global
// ============================================

import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';

export function PresenceInitializer() {
  // Ativa o heartbeat de presença automaticamente
  usePresenceHeartbeat();
  
  return null;
}
