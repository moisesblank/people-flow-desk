// ============================================
// 🔓 enhancedFingerprint — DESATIVADO
// Fingerprint avançado REMOVIDO
// Retorna hash aleatório
// ============================================

export interface EnhancedFingerprintResult {
  hash: string;
  data: Record<string, unknown>;
}

/**
 * DESATIVADO: Retorna hash aleatório
 * Nenhuma coleta de fingerprint
 */
export async function collectEnhancedFingerprint(): Promise<EnhancedFingerprintResult> {
  console.log('[enhancedFingerprint] 🔓 DESATIVADO - retornando hash aleatório');
  
  return {
    hash: crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, ''),
    data: {
      _fingerprinting_disabled: true,
      deviceType: detectDeviceType(),
      browser: detectBrowser(),
      os: detectOS(),
    },
  };
}

/**
 * DESATIVADO: Alias para compatibilidade
 */
export async function collectFingerprint(): Promise<{ hash: string; data: Record<string, unknown> }> {
  return collectEnhancedFingerprint();
}

/**
 * DESATIVADO: Sem efeito
 */
export function clearFingerprintCache(): void {
  console.log('[enhancedFingerprint] 🔓 clearFingerprintCache - sem efeito');
}

// Funções auxiliares para metadata básica
function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}
