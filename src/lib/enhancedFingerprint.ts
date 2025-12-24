// ============================================
// 🏛️ LEI III + LEI VI: FINGERPRINT REFORÇADO (STANDALONE)
// Versão funcional para uso no useAuth e edge functions
// Coleta múltiplos sinais para identificação única
// ============================================

interface EnhancedFingerprintData {
  // Screen
  screenWidth: number;
  screenHeight: number;
  screenColorDepth: number;
  screenPixelRatio: number;
  
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
  
  // WebGL
  webglVendor: string;
  webglRenderer: string;
  
  // Canvas (hash)
  canvasHash: string;
  
  // Connection
  connectionType: string | null;
  connectionEffectiveType: string | null;
  
  // Battery
  batteryLevel: number | null;
  batteryCharging: boolean | null;
  
  // Storage
  localStorageAvailable: boolean;
  sessionStorageAvailable: boolean;
  indexedDBAvailable: boolean;
  
  // WebRTC IPs
  webrtcIPs: string[];
  
  // Performance
  performanceScore: number;
  
  // Plugins
  pluginsCount: number;
  
  // Device Info
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  
  // Metadata
  collectedAt: string;
}

// ============================================
// HELPERS
// ============================================

async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getWebGLInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { vendor: 'unknown', renderer: 'unknown' };
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return { vendor: 'unknown', renderer: 'unknown' };
    
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
    return await sha256(dataUrl);
  } catch {
    return 'canvas-error';
  }
}

async function getWebRTCIPs(): Promise<string[]> {
  return new Promise((resolve) => {
    const ips: string[] = [];
    const timeout = setTimeout(() => resolve(ips), 1500); // Reduzido para 1.5s
    
    try {
      const RTCPeerConnection = window.RTCPeerConnection || (window as any).webkitRTCPeerConnection;
      if (!RTCPeerConnection) {
        clearTimeout(timeout);
        resolve([]);
        return;
      }
      
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      
      pc.createDataChannel('');
      
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          clearTimeout(timeout);
          pc.close();
          resolve([...new Set(ips)]);
          return;
        }
        
        const candidate = event.candidate.candidate;
        const ipMatch = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
        if (ipMatch && ipMatch[0]) {
          ips.push(ipMatch[0]);
        }
      };
      
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          clearTimeout(timeout);
          resolve([]);
        });
    } catch {
      clearTimeout(timeout);
      resolve([]);
    }
  });
}

function measurePerformance(): number {
  const iterations = 5000; // Reduzido para ser mais rápido
  const start = performance.now();
  
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  
  const duration = performance.now() - start;
  const score = Math.min(100, Math.max(0, 100 - (duration / 5)));
  
  return Math.round(score);
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
  
  if (/Win/i.test(platform)) return 'Windows';
  if (/Mac/i.test(platform)) return 'macOS';
  if (/Linux/i.test(platform)) return 'Linux';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  
  return 'Unknown';
}

async function getBatteryInfo(): Promise<{ level: number | null; charging: boolean | null }> {
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return {
        level: battery.level,
        charging: battery.charging,
      };
    }
  } catch {
    // Battery API não disponível
  }
  return { level: null, charging: null };
}

function getConnectionInfo(): { type: string | null; effectiveType: string | null } {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) {
    return { type: null, effectiveType: null };
  }
  
  return {
    type: connection.type || null,
    effectiveType: connection.effectiveType || null,
  };
}

function checkStorageAvailability(): { localStorage: boolean; sessionStorage: boolean; indexedDB: boolean } {
  let localStorage = false;
  let sessionStorage = false;
  let indexedDB = false;
  
  try {
    localStorage = typeof window.localStorage !== 'undefined';
    window.localStorage.setItem('_fp_test', '1');
    window.localStorage.removeItem('_fp_test');
  } catch {
    localStorage = false;
  }
  
  try {
    sessionStorage = typeof window.sessionStorage !== 'undefined';
  } catch {
    sessionStorage = false;
  }
  
  try {
    indexedDB = typeof window.indexedDB !== 'undefined';
  } catch {
    indexedDB = false;
  }
  
  return { localStorage, sessionStorage, indexedDB };
}

// ============================================
// FUNÇÃO PRINCIPAL DE COLETA
// ============================================

let cachedFingerprint: { hash: string; data: EnhancedFingerprintData } | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function collectEnhancedFingerprint(): Promise<{ hash: string; data: EnhancedFingerprintData }> {
  // Usar cache se disponível e recente
  if (cachedFingerprint && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedFingerprint;
  }

  // Coletar dados em paralelo
  const [webglInfo, canvasHash, webrtcIPs, batteryInfo] = await Promise.all([
    Promise.resolve(getWebGLInfo()),
    getCanvasHash(),
    getWebRTCIPs(),
    getBatteryInfo(),
  ]);

  const connectionInfo = getConnectionInfo();
  const storageInfo = checkStorageAvailability();
  const performanceScore = measurePerformance();

  const data: EnhancedFingerprintData = {
    // Screen
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenColorDepth: window.screen.colorDepth,
    screenPixelRatio: window.devicePixelRatio || 1,

    // Hardware
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || null,
    maxTouchPoints: navigator.maxTouchPoints || 0,

    // Browser
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: [...navigator.languages],
    platform: navigator.platform,
    vendor: navigator.vendor,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,

    // Timezone
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),

    // WebGL
    webglVendor: webglInfo.vendor,
    webglRenderer: webglInfo.renderer,

    // Canvas
    canvasHash,

    // Connection
    connectionType: connectionInfo.type,
    connectionEffectiveType: connectionInfo.effectiveType,

    // Battery
    batteryLevel: batteryInfo.level,
    batteryCharging: batteryInfo.charging,

    // Storage
    localStorageAvailable: storageInfo.localStorage,
    sessionStorageAvailable: storageInfo.sessionStorage,
    indexedDBAvailable: storageInfo.indexedDB,

    // WebRTC
    webrtcIPs,

    // Performance
    performanceScore,

    // Plugins
    pluginsCount: navigator.plugins?.length || 0,

    // Device Info
    deviceType: detectDeviceType(),
    browser: detectBrowser(),
    os: detectOS(),

    // Metadata
    collectedAt: new Date().toISOString(),
  };

  // Gerar hash único
  const hashSource = [
    data.screenWidth,
    data.screenHeight,
    data.screenColorDepth,
    data.hardwareConcurrency,
    data.timezone,
    data.webglVendor,
    data.webglRenderer,
    data.canvasHash,
    data.platform,
    data.language,
    data.deviceType,
  ].join('|');

  const hash = await sha256(hashSource);

  cachedFingerprint = { hash, data };
  cacheTime = Date.now();

  // 🛡️ LEI V: Log apenas em dev
  if (import.meta.env.DEV) {
    console.log('[EnhancedFingerprint] Collected');
  }

  return { hash, data };
}

// Função simplificada para compatibilidade
export async function collectFingerprint(): Promise<{ hash: string; data: Record<string, unknown> }> {
  const result = await collectEnhancedFingerprint();
  return { hash: result.hash, data: result.data as unknown as Record<string, unknown> };
}

// Limpar cache
export function clearFingerprintCache(): void {
  cachedFingerprint = null;
  cacheTime = 0;
}
