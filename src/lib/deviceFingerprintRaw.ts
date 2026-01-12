// ============================================
// 🔐 deviceFingerprintRaw — REATIVADO v2.0
// Coleta de fingerprint COMPLETA para servidor
// Dados REAIS enviados para hash server-side
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
 * Gera hash do canvas para fingerprinting
 */
async function generateCanvasHash(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    
    // Desenhar texto com estilo específico
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Matriz Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas Hash', 4, 17);
    
    const dataUrl = canvas.toDataURL();
    
    // Gerar hash simples
    const encoder = new TextEncoder();
    const data = encoder.encode(dataUrl);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  } catch {
    return 'canvas-error';
  }
}

/**
 * Obtém informações do WebGL
 */
function getWebGLInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return { vendor: 'no-webgl', renderer: 'no-webgl' };
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return { vendor: 'unknown', renderer: 'unknown' };
    
    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown',
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown',
    };
  } catch {
    return { vendor: 'error', renderer: 'error' };
  }
}

/**
 * Gera audio fingerprint simplificado
 */
async function generateAudioFingerprint(): Promise<string> {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return 'no-audio-context';
    
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gainNode = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
    
    gainNode.gain.value = 0;
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start(0);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);
    
    oscillator.stop();
    context.close();
    
    // Hash simples dos dados de frequência
    const sum = frequencyData.reduce((acc, val) => acc + val, 0);
    return `audio-${sum}-${frequencyData[0]}-${frequencyData[Math.floor(frequencyData.length / 2)]}`;
  } catch {
    return 'audio-error';
  }
}

/**
 * REATIVADO: Coleta dados REAIS do dispositivo
 */
export async function collectFingerprintRawData(): Promise<FingerprintRawData> {
  console.log('[deviceFingerprintRaw] 🔐 ATIVADO - coletando dados reais');
  
  const ua = navigator.userAgent;
  const webgl = getWebGLInfo();
  const canvasHash = await generateCanvasHash();
  const audioFingerprint = await generateAudioFingerprint();
  
  return {
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
    userAgent: ua,
    language: navigator.language || 'unknown',
    languages: Array.from(navigator.languages || []),
    platform: navigator.platform || 'unknown',
    vendor: navigator.vendor || 'unknown',
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    
    // Timezone
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    timezoneOffset: new Date().getTimezoneOffset(),
    
    // WebGL
    webglVendor: webgl.vendor,
    webglRenderer: webgl.renderer,
    
    // Canvas & Audio
    canvasHash,
    audioFingerprint,
    
    // Plugins
    pluginsCount: navigator.plugins?.length || 0,
    
    // Device classification
    deviceType: detectDeviceType(ua),
    browser: detectBrowser(ua),
    os: detectOS(ua),
    
    collectedAt: new Date().toISOString(),
  };
}

/**
 * Gera nome legível do dispositivo
 */
export function generateDeviceName(data: FingerprintRawData): string {
  return `${data.os} • ${data.browser}`;
}

// Funções auxiliares de detecção
function detectDeviceType(ua: string): 'desktop' | 'mobile' | 'tablet' {
  // 🖥️ DESKTOP FIRST: macOS/Windows/Linux detection ANTES de Mobi check
  // Safari no macOS às vezes tem "Mobi" no UA, mas É desktop
  if (/Mac OS X|Macintosh/i.test(ua) && !/iPhone|iPad/i.test(ua)) {
    return 'desktop';
  }
  if (/Windows NT/i.test(ua) && !/Phone/i.test(ua)) {
    return 'desktop';
  }
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) {
    return 'desktop';
  }

  // 📱 Tablet detection
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'tablet';

  // 📲 Mobile detection
  if (/Mobi|iPhone|Android.*Mobile/i.test(ua)) return 'mobile';

  // Fallback por capacidade (touch + largura)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice && window.screen.width < 1024) return 'tablet';

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
