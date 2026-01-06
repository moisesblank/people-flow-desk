// ============================================
// 🔓 deviceFingerprint — DESATIVADO
// Browser Fingerprinting REMOVIDO
// Cada chamada gera hash ALEATÓRIO
// ============================================

/**
 * DESATIVADO: Retorna hash aleatório
 * Nenhuma coleta de fingerprint real
 */
export async function generateDeviceFingerprint(): Promise<string> {
  console.log('[deviceFingerprint] 🔓 DESATIVADO - retornando hash aleatório');
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

/**
 * Gera nome legível do dispositivo (metadata apenas, não identificação)
 */
export function generateDeviceName(): string {
  const ua = navigator.userAgent;
  
  let os = 'Unknown OS';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  let browser = 'Unknown Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';

  return `${os} • ${browser}`;
}

/**
 * Detecta tipo de dispositivo (metadata apenas)
 */
export function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;
  
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice && window.screen.width < 1024) return 'tablet';
  
  return 'desktop';
}

/**
 * DESATIVADO: Limpar cache não tem efeito
 */
export function clearFingerprintCache(): void {
  console.log('[deviceFingerprint] 🔓 clearFingerprintCache - sem efeito (desativado)');
}

/**
 * DESATIVADO: Sempre retorna false
 */
export function isFingerprintCached(): boolean {
  return false;
}
