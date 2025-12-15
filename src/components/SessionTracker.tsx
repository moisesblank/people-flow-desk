// ============================================
// SYNAPSE v14.0 - SESSION TRACKER COMPONENT
// Componente que ativa o tracking de sessões
// ============================================

import { useSessionTracking } from '@/hooks/useSessionTracking';

export function SessionTracker() {
  useSessionTracking();
  return null;
}

export default SessionTracker;
