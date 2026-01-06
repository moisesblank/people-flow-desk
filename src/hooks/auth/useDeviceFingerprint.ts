// ============================================
// 🔐 useDeviceFingerprint — DESATIVADO
// Browser Fingerprinting REMOVIDO
// Cada acesso gera hash ALEATÓRIO = sempre navegador novo
// ============================================

import { useCallback } from "react";

export interface FingerprintResult {
  hash: string;
  data: Record<string, unknown>;
}

/**
 * Hook DESATIVADO - retorna hash aleatório sempre
 * Nenhum reconhecimento de navegador/dispositivo
 */
export function useDeviceFingerprint() {
  const collect = useCallback(async (): Promise<FingerprintResult> => {
    // 🔓 DESATIVADO: Gera hash aleatório a cada chamada
    // Cada acesso = navegador novo = sem reconhecimento
    const randomHash = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    
    console.log('[Fingerprint] 🔓 DESATIVADO - hash aleatório gerado');
    
    return {
      hash: randomHash,
      data: {
        deviceType: detectDeviceType(),
        browser: detectBrowser(),
        os: detectOS(),
        _fingerprinting_disabled: true,
      },
    };
  }, []);

  return { collect };
}

// Funções auxiliares mantidas para metadata básica (não usadas para identificação)
function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
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
