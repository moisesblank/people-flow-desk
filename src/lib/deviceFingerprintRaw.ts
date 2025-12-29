// ============================================
// 🛡️ BLOCO 1 FIX: FINGERPRINT RAW DATA
// Coleta dados BRUTOS para enviar ao servidor
// Servidor gera o hash final com pepper secreto
// SEM IP, SEM webrtcIPs
// ============================================

export interface FingerprintRawData {
  // Screen
  screenWidth: number;
  screenHeight: number;
  screenColorDepth: number;
  screenPixelRatio: number;
  availWidth: number;
  availHeight: number;
  
  // Hardware
  hardwareConcurrency: number;
  deviceMemory: number | null;
  maxTouchPoints: number;
  
  // Browser
  userAgent: string;
  language: string;
  languages: string[];
  platform: string;
  vendor: string;
  cookiesEnabled: boolean;
  doNotTrack: string | null;
  
  // Timezone
  timezone: string;
  timezoneOffset: number;
  
  // WebGL (identificação de GPU)
  webglVendor: string;
  webglRenderer: string;
  
  // Canvas hash
  canvasHash: string;
  
  // Audio fingerprint
  audioFingerprint: string;
  
  // Plugins
  pluginsCount: number;
  
  // Device classification
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  
  // Timestamp de coleta
  collectedAt: string;
}

// ============================================
// HELPERS
// ============================================

function getWebGLInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { vendor: 'unknown', renderer: 'unknown' };
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return { vendor: 'basic', renderer: 'basic' };
    
    return {
      vendor: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown',
      renderer: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown',
    };
  } catch {
    return { vendor: 'error', renderer: 'error' };
  }
}

async function getCanvasHash(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    
    ctx.textBaseline = 'alphabetic';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Security', 4, 45);
    
    const dataUrl = canvas.toDataURL();
    
    // Hash simples do dataUrl (servidor irá usar isso junto com outros dados)
    const buffer = new TextEncoder().encode(dataUrl);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  } catch {
    return 'canvas-error';
  }
}

function getAudioFingerprint(): string {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return 'no-audio';
    
    const ctx = new AudioCtx();
    const rate = ctx.sampleRate;
    ctx.close();
    return String(rate);
  } catch {
    return 'audio-error';
  }
}

function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return 'mobile';
  }
  if (/tablet|ipad/i.test(ua) || (navigator.maxTouchPoints > 1 && !/mobile/i.test(ua))) {
    return 'tablet';
  }
  return 'desktop';
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  
  return 'Unknown';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  
  if (/Win/i.test(platform)) {
    if (ua.includes('Windows NT 10')) return 'Windows 10/11';
    return 'Windows';
  }
  if (/Mac/i.test(platform)) return 'macOS';
  if (/Linux/i.test(platform)) return 'Linux';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  
  return 'Unknown';
}

// ============================================
// FUNÇÃO PRINCIPAL: Coleta dados BRUTOS
// ============================================

export async function collectFingerprintRawData(): Promise<FingerprintRawData> {
  const webglInfo = getWebGLInfo();
  const canvasHash = await getCanvasHash();
  const audioFingerprint = getAudioFingerprint();
  
  const data: FingerprintRawData = {
    // Screen
    screenWidth: screen.width,
    screenHeight: screen.height,
    screenColorDepth: screen.colorDepth,
    screenPixelRatio: window.devicePixelRatio || 1,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    
    // Hardware
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    deviceMemory: (navigator as any).deviceMemory || null,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    
    // Browser
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: Array.from(navigator.languages || [navigator.language]),
    platform: navigator.platform || 'unknown',
    vendor: navigator.vendor || 'unknown',
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || null,
    
    // Timezone
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    
    // WebGL
    webglVendor: webglInfo.vendor,
    webglRenderer: webglInfo.renderer,
    
    // Canvas
    canvasHash,
    
    // Audio
    audioFingerprint,
    
    // Plugins
    pluginsCount: navigator.plugins?.length || 0,
    
    // Device classification
    deviceType: detectDeviceType(),
    browser: detectBrowser(),
    os: detectOS(),
    
    // Timestamp
    collectedAt: new Date().toISOString(),
  };
  
  return data;
}

// ============================================
// FUNÇÃO UTILITÁRIA: Gerar nome do dispositivo
// ============================================

export function generateDeviceName(data: FingerprintRawData): string {
  return `${data.os} • ${data.browser}`;
}
