// ============================================
// 🛡️ DOGMA XI: Device Fingerprinting
// Identificação única de dispositivo (não IP)
// ============================================

// Gera fingerprint baseado em características do dispositivo
export async function generateDeviceFingerprint(): Promise<string> {
  const components: string[] = [];
  
  // 1. Screen info
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  components.push(`${screen.availWidth}x${screen.availHeight}`);
  
  // 2. Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  components.push(String(new Date().getTimezoneOffset()));
  
  // 3. Language
  components.push(navigator.language);
  components.push((navigator.languages || []).join(','));
  
  // 4. Platform
  components.push(navigator.platform || 'unknown');
  
  // 5. Hardware concurrency (CPU cores)
  components.push(String(navigator.hardwareConcurrency || 0));
  
  // 6. Device memory (if available)
  components.push(String((navigator as any).deviceMemory || 0));
  
  // 7. Touch support
  components.push(String('ontouchstart' in window));
  components.push(String(navigator.maxTouchPoints || 0));
  
  // 8. WebGL info
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '');
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
      }
    }
  } catch (e) {
    components.push('webgl-error');
  }
  
  // 9. Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = '#069';
      ctx.fillText('MatrizDigital2300', 2, 15);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch (e) {
    components.push('canvas-error');
  }
  
  // 10. Audio context fingerprint
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    components.push(String(audioContext.sampleRate));
    audioContext.close();
  } catch (e) {
    components.push('audio-error');
  }
  
  // Hash all components
  const fingerprint = components.join('|||');
  const hash = await hashString(fingerprint);
  
  return hash;
}

// Hash usando Web Crypto API
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Gerar nome amigável do dispositivo
export function generateDeviceName(): string {
  const ua = navigator.userAgent;
  
  let os = 'Desktop';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'Mac';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  let browser = 'Browser';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  
  return `${os} • ${browser}`;
}

// Detectar tipo de dispositivo
export function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}
