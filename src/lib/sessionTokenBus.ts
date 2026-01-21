// ============================================
// 🎫 Session Token Bus (P0)
// Sincroniza mudanças do matriz_session_token entre módulos
// (localStorage não dispara events no MESMO tab)
// ============================================

export const SESSION_TOKEN_KEY = 'matriz_session_token';

const EVENT_NAME = 'matriz:session-token-changed';

export type SessionTokenChangedDetail = {
  token: string | null;
  source?: string;
};

export function emitSessionTokenChanged(detail: SessionTokenChangedDetail) {
  try {
    window.dispatchEvent(new CustomEvent<SessionTokenChangedDetail>(EVENT_NAME, { detail }));
  } catch {
    // fail-open
  }
}

export function subscribeSessionTokenChanged(
  handler: (detail: SessionTokenChangedDetail) => void,
): () => void {
  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<SessionTokenChangedDetail>;
    handler(ce.detail);
  };

  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
