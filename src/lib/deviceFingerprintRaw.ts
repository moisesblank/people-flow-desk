// ============================================
// 🔓 deviceFingerprintRaw — DESATIVADO
// Coleta de fingerprint REMOVIDA
// Retorna dados mínimos para compatibilidade
// ============================================

export interface FingerprintRawData {
  screenWidth: number;
  screenHeight: number;
  screenColorDepth: number;
  screenPixelRatio: number;
  availWidth: number;
  availHeight: number;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  maxTouchPoints: number;
  userAgent: string;
  language: string;
  languages: string[];
  platform: string;
  vendor: string;
  cookiesEnabled: boolean;
  doNotTrack: string | null;
  timezone: string;
  timezoneOffset: number;
  webglVendor: string;
  webglRenderer: string;
  canvasHash: string;
  audioFingerprint: string;
  pluginsCount: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  collectedAt: string;
}

/**
 * DESATIVADO: Retorna dados mínimos
 * Nenhuma coleta real de fingerprint
 */
export async function collectFingerprintRawData(): Promise<FingerprintRawData> {
  console.log('[deviceFingerprintRaw] 🔓 DESATIVADO - retornando dados mínimos');
  
  const ua = navigator.userAgent;
  
  return {
    screenWidth: 0,
    screenHeight: 0,
    screenColorDepth: 0,
    screenPixelRatio: 1,
    availWidth: 0,
    availHeight: 0,
    hardwareConcurrency: 0,
    deviceMemory: null,
    maxTouchPoints: 0,
    userAgent: ua,
    language: navigator.language || 'unknown',
    languages: [],
    platform: 'disabled',
    vendor: 'disabled',
    cookiesEnabled: true,
    doNotTrack: null,
    timezone: 'disabled',
    timezoneOffset: 0,
    webglVendor: 'disabled',
    webglRenderer: 'disabled',
    canvasHash: 'disabled',
    audioFingerprint: 'disabled',
    pluginsCount: 0,
    deviceType: detectDeviceType(ua),
    browser: detectBrowser(ua),
    os: detectOS(ua),
    collectedAt: new Date().toISOString(),
  };
}

/**
 * Gera nome legível do dispositivo (metadata apenas)
 */
export function generateDeviceName(data: FingerprintRawData): string {
  return `${data.os} • ${data.browser}`;
}

// Funções auxiliares
function detectDeviceType(ua: string): 'desktop' | 'mobile' | 'tablet' {
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function detectBrowser(ua: string): string {
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
}

function detectOS(ua: string): string {
  if (ua.includes('Windows NT 10.0')) return 'Windows 10/11';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('iPhone')) return 'iOS';
  if (ua.includes('iPad')) return 'iOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
}
