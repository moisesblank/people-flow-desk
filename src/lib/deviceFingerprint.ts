// ============================================
// 🛡️ DOGMA XI v2.0: Device Fingerprinting
// Identificação única de dispositivo (não IP)
// Otimizado para Alta Performance - 5000+ usuários
// Matriz Digital 2300
// ============================================

// Cache do fingerprint para evitar recálculo
let cachedFingerprint: string | null = null;
let fingerprintTimestamp: number = 0;
const FINGERPRINT_CACHE_TTL = 1000 * 60 * 30; // 30 minutos

// Gera fingerprint baseado em características do dispositivo
export async function generateDeviceFingerprint(): Promise<string> {
  // Usar cache se ainda válido
  const now = Date.now();
  if (cachedFingerprint && (now - fingerprintTimestamp) < FINGERPRINT_CACHE_TTL) {
    return cachedFingerprint;
  }
  
  const components: string[] = [];
  
  try {
    // 1. Screen info (rápido e confiável)
    components.push(`scr:${screen.width}x${screen.height}x${screen.colorDepth}`);
    components.push(`avail:${screen.availWidth}x${screen.availHeight}`);
    
    // 2. Timezone
    components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    components.push(`tzo:${new Date().getTimezoneOffset()}`);
    
    // 3. Language
    components.push(`lang:${navigator.language}`);
    components.push(`langs:${(navigator.languages || []).slice(0, 3).join(',')}`);
    
    // 4. Platform
    components.push(`plat:${navigator.platform || 'unknown'}`);
    
    // 5. Hardware concurrency (CPU cores)
    components.push(`cpu:${navigator.hardwareConcurrency || 0}`);
    
    // 6. Device memory (if available)
    components.push(`mem:${(navigator as any).deviceMemory || 0}`);
    
    // 7. Touch support
    components.push(`touch:${'ontouchstart' in window ? 1 : 0}:${navigator.maxTouchPoints || 0}`);
    
    // 8. WebGL info (otimizado - sem criar canvas desnecessariamente)
    const webglInfo = getWebGLInfo();
    components.push(`gl:${webglInfo}`);
    
    // 9. Canvas fingerprint (otimizado)
    const canvasHash = await getCanvasFingerprint();
    components.push(`cv:${canvasHash}`);
    
    // 10. Audio context fingerprint (otimizado)
    const audioHash = getAudioFingerprint();
    components.push(`au:${audioHash}`);
    
    // 11. Plugins count (rápido)
    components.push(`plug:${navigator.plugins?.length || 0}`);
    
    // 12. Cookie enabled
    components.push(`ck:${navigator.cookieEnabled ? 1 : 0}`);
    
    // 13. Do Not Track
    components.push(`dnt:${navigator.doNotTrack || 'u'}`);
    
    // 14. User Agent hash (últimos 32 chars)
    components.push(`ua:${navigator.userAgent.slice(-32)}`);
    
  } catch (e) {
    console.warn('[Fingerprint] Erro parcial:', e);
  }
  
  // Hash all components
  const fingerprint = components.join('|');
  const hash = await hashString(fingerprint);
  
  // Cache do resultado
  cachedFingerprint = hash;
  fingerprintTimestamp = now;
  
  return hash;
}

// WebGL info otimizado
function getWebGLInfo(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        return `${vendor.slice(0, 20)}:${renderer.slice(0, 30)}`;
      }
      return gl.getParameter(gl.RENDERER) || 'basic';
    }
  } catch (e) {
    // Silent fail
  }
  return 'none';
}

// Canvas fingerprint otimizado
async function getCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-ctx';
    
    canvas.width = 120;
    canvas.height = 30;
    
    // Desenho único
    ctx.textBaseline = 'top';
    ctx.font = '12px monospace';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 60, 30);
    ctx.fillStyle = '#069';
    ctx.fillText('M2300', 2, 8);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('XY', 65, 8);
    
    // Hash parcial do dataURL
    const dataUrl = canvas.toDataURL();
    return dataUrl.slice(-40, -10);
  } catch (e) {
    return 'err';
  }
}

// Audio fingerprint otimizado (sem criar AudioContext se não suportado)
function getAudioFingerprint(): string {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return 'no-audio';
    
    // Apenas pegar sample rate sem criar contexto completo
    const ctx = new AudioCtx();
    const rate = ctx.sampleRate;
    ctx.close();
    return String(rate);
  } catch (e) {
    return 'err';
  }
}

// 🏛️ LEI I - Hash usando Web Worker quando disponível (off-thread)
let hashWorkerAvailable = true;
let hashWorker: Worker | null = null;
const hashPending = new Map<string, { resolve: (v: string) => void; reject: (e: Error) => void }>();

function getHashWorker(): Worker | null {
  if (!hashWorker && typeof Worker !== 'undefined' && hashWorkerAvailable) {
    try {
      const code = `
        self.onmessage = async (e) => {
          const { id, data } = e.data;
          try {
            const encoder = new TextEncoder();
            const buffer = encoder.encode(data);
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            self.postMessage({ id, hash });
          } catch (err) {
            self.postMessage({ id, error: err.message });
          }
        };
      `;
      const blob = new Blob([code], { type: 'application/javascript' });
      hashWorker = new Worker(URL.createObjectURL(blob));
      hashWorker.onmessage = (e) => {
        const { id, hash, error } = e.data;
        const pending = hashPending.get(id);
        if (pending) {
          hashPending.delete(id);
          if (error) pending.reject(new Error(error));
          else pending.resolve(hash);
        }
      };
    } catch {
      hashWorkerAvailable = false;
    }
  }
  return hashWorker;
}

async function hashString(str: string): Promise<string> {
  // Tentar usar worker (off-thread)
  const worker = getHashWorker();
  if (worker) {
    return new Promise((resolve, reject) => {
      const id = `hash_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      hashPending.set(id, { resolve, reject });
      worker.postMessage({ id, data: str });
      // Timeout de 2s para fallback
      setTimeout(() => {
        if (hashPending.has(id)) {
          hashPending.delete(id);
          hashStringFallback(str).then(resolve).catch(reject);
        }
      }, 2000);
    });
  }
  return hashStringFallback(str);
}

async function hashStringFallback(str: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback para hash simples se crypto não disponível
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }
}

// Gerar nome amigável do dispositivo
export function generateDeviceName(): string {
  const ua = navigator.userAgent;
  
  let deviceModel = '';
  let os = 'Desktop';
  
  // Detectar modelo específico
  if (ua.includes('iPhone')) {
    os = 'iPhone';
    deviceModel = 'iPhone';
  } else if (ua.includes('iPad')) {
    os = 'iPad';
    deviceModel = 'iPad';
  } else if (ua.includes('Android')) {
    os = 'Android';
    // Tentar extrair modelo
    const match = ua.match(/Android[^;]*;([^)]*)\)/);
    if (match) deviceModel = match[1].trim().split(' ')[0];
  } else if (ua.includes('Windows NT 10')) {
    os = 'Windows 10/11';
  } else if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('CrOS')) {
    os = 'Chrome OS';
  }
  
  let browser = 'Navegador';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  
  if (deviceModel) {
    return `${deviceModel} • ${browser}`;
  }
  return `${os} • ${browser}`;
}

// Detectar tipo de dispositivo
export function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;
  
  // Tablets específicos
  if (/iPad/i.test(ua)) return 'tablet';
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'tablet';
  if (/Tablet/i.test(ua)) return 'tablet';
  
  // Mobile
  if (/Mobi|Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'mobile';
  }
  
  // Verificar por touch em telas grandes (pode ser tablet)
  if ('ontouchstart' in window && screen.width >= 768 && screen.width <= 1024) {
    return 'tablet';
  }
  
  return 'desktop';
}

// Limpar cache (útil para forçar nova verificação)
export function clearFingerprintCache(): void {
  cachedFingerprint = null;
  fingerprintTimestamp = 0;
}

// Verificar se fingerprint está em cache
export function isFingerprintCached(): boolean {
  const now = Date.now();
  return cachedFingerprint !== null && (now - fingerprintTimestamp) < FINGERPRINT_CACHE_TTL;
}
