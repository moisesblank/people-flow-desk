// ============================================
// 🏛️ LEI III + LEI VI: FINGERPRINT REFORÇADO
// Coleta múltiplos sinais para identificação única
// Difícil de falsificar, detecta VMs e VPNs
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';

interface EnhancedFingerprint {
  // Core
  hash: string;
  
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
  
  // Canvas
  canvasHash: string;
  
  // Audio
  audioHash: string;
  
  // Fonts (subset)
  fontsHash: string;
  
  // Connection (Network Information API)
  connectionType: string | null;
  connectionEffectiveType: string | null;
  connectionDownlink: number | null;
  connectionRtt: number | null;
  
  // Battery (se disponível)
  batteryLevel: number | null;
  batteryCharging: boolean | null;
  
  // Storage
  localStorageAvailable: boolean;
  sessionStorageAvailable: boolean;
  indexedDBAvailable: boolean;
  
  // WebRTC IPs (detecta VPN)
  webrtcIPs: string[];
  
  // Performance Timing (detecta VMs)
  performanceScore: number;
  
  // Plugins
  pluginsCount: number;
  
  // Device Info
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  
  // Metadata
  collectedAt: string;
  version: string;
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
    
    // Texto com estilo único
    ctx.textBaseline = 'alphabetic';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Fingerprint 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Security Check', 4, 45);
    
    const dataUrl = canvas.toDataURL();
    return await sha256(dataUrl);
  } catch {
    return 'canvas-error';
  }
}

async function getAudioHash(): Promise<string> {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return 'no-audio';
    
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    
    gainNode.gain.value = 0; // Mute
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(0);
    
    const fingerprint = await new Promise<string>((resolve) => {
      scriptProcessor.onaudioprocess = (event) => {
        const bins = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(bins);
        
        const values = bins.slice(0, 30).map(v => Math.round(v)).join(',');
        oscillator.disconnect();
        scriptProcessor.disconnect();
        gainNode.disconnect();
        audioContext.close();
        
        sha256(values).then(resolve);
      };
    });
    
    return fingerprint;
  } catch {
    return 'audio-error';
  }
}

async function getFontsHash(): Promise<string> {
  // Lista reduzida de fontes para testar
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Comic Sans MS', 'Impact', 'Trebuchet MS', 'Lucida Console',
    'Palatino', 'Garamond', 'Bookman', 'Tahoma', 'Arial Black',
  ];
  
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'no-canvas';
  
  const getTextWidth = (font: string): number => {
    ctx.font = `${testSize} ${font}`;
    return ctx.measureText(testString).width;
  };
  
  const baseWidths = baseFonts.map(getTextWidth);
  
  const detectedFonts = testFonts.filter(font => {
    return baseFonts.some((baseFont, i) => {
      const width = getTextWidth(`${font}, ${baseFont}`);
      return width !== baseWidths[i];
    });
  });
  
  return await sha256(detectedFonts.join(','));
}

async function getWebRTCIPs(): Promise<string[]> {
  return new Promise((resolve) => {
    const ips: string[] = [];
    const timeout = setTimeout(() => resolve(ips), 2000);
    
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
  // Mede tempo de execução de operações (VMs geralmente são mais lentas)
  const iterations = 10000;
  const start = performance.now();
  
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  
  const duration = performance.now() - start;
  
  // Score de 0-100, onde 100 = hardware real rápido
  // VMs geralmente têm score < 50
  const score = Math.min(100, Math.max(0, 100 - (duration / 10)));
  
  return Math.round(score);
}

function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent;
  
  // 🖥️ DESKTOP FIRST: macOS/Windows/Linux detection ANTES de Mobi check
  if (/Mac OS X|Macintosh/i.test(ua) && !/iPhone|iPad/i.test(ua)) return 'desktop';
  if (/Windows NT/i.test(ua) && !/Phone/i.test(ua)) return 'desktop';
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'desktop';
  
  // 📱 Tablet detection
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'tablet';
  
  // 📲 Mobile detection
  if (/Mobi|iPhone|Android.*Mobile/i.test(ua)) return 'mobile';
  
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

function getConnectionInfo(): { type: string | null; effectiveType: string | null; downlink: number | null; rtt: number | null } {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) {
    return { type: null, effectiveType: null, downlink: null, rtt: null };
  }
  
  return {
    type: connection.type || null,
    effectiveType: connection.effectiveType || null,
    downlink: connection.downlink || null,
    rtt: connection.rtt || null,
  };
}

function checkStorageAvailability(): { localStorage: boolean; sessionStorage: boolean; indexedDB: boolean } {
  let localStorage = false;
  let sessionStorage = false;
  let indexedDB = false;
  
  try {
    localStorage = typeof window.localStorage !== 'undefined';
    window.localStorage.setItem('test', 'test');
    window.localStorage.removeItem('test');
  } catch {
    localStorage = false;
  }
  
  try {
    sessionStorage = typeof window.sessionStorage !== 'undefined';
    window.sessionStorage.setItem('test', 'test');
    window.sessionStorage.removeItem('test');
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
// HOOK PRINCIPAL
// ============================================

interface UseEnhancedFingerprintReturn {
  fingerprint: EnhancedFingerprint | null;
  hash: string | null;
  isCollecting: boolean;
  error: string | null;
  collect: () => Promise<EnhancedFingerprint>;
  getHash: () => string | null;
}

export function useEnhancedFingerprint(): UseEnhancedFingerprintReturn {
  const [fingerprint, setFingerprint] = useState<EnhancedFingerprint | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cachedHash = useRef<string | null>(null);

  const collect = useCallback(async (): Promise<EnhancedFingerprint> => {
    setIsCollecting(true);
    setError(null);

    try {
      // Coletar todos os dados em paralelo onde possível
      const [
        webglInfo,
        canvasHash,
        audioHash,
        fontsHash,
        webrtcIPs,
        batteryInfo,
      ] = await Promise.all([
        Promise.resolve(getWebGLInfo()),
        getCanvasHash(),
        getAudioHash(),
        getFontsHash(),
        getWebRTCIPs(),
        getBatteryInfo(),
      ]);

      const connectionInfo = getConnectionInfo();
      const storageInfo = checkStorageAvailability();
      const performanceScore = measurePerformance();

      const fp: Omit<EnhancedFingerprint, 'hash'> = {
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

        // Canvas & Audio & Fonts
        canvasHash,
        audioHash,
        fontsHash,

        // Connection
        connectionType: connectionInfo.type,
        connectionEffectiveType: connectionInfo.effectiveType,
        connectionDownlink: connectionInfo.downlink,
        connectionRtt: connectionInfo.rtt,

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
        version: '2.0',
      };

      // Gerar hash único combinando os principais identificadores
      const hashSource = [
        fp.screenWidth,
        fp.screenHeight,
        fp.screenColorDepth,
        fp.hardwareConcurrency,
        fp.timezone,
        fp.webglVendor,
        fp.webglRenderer,
        fp.canvasHash,
        fp.audioHash,
        fp.fontsHash,
        fp.platform,
        fp.language,
      ].join('|');

      const hash = await sha256(hashSource);

      const fullFingerprint: EnhancedFingerprint = {
        ...fp,
        hash,
      };

      setFingerprint(fullFingerprint);
      cachedHash.current = hash;

      // 🛡️ LEI V: Log apenas em dev
      if (import.meta.env.DEV) {
        console.log('[EnhancedFingerprint] Collected successfully');
      }

      return fullFingerprint;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao coletar fingerprint';
      setError(errorMessage);
      console.error('[EnhancedFingerprint] Error:', err);
      throw err;
    } finally {
      setIsCollecting(false);
    }
  }, []);

  const getHash = useCallback((): string | null => {
    return cachedHash.current || fingerprint?.hash || null;
  }, [fingerprint]);

  // Coletar automaticamente na montagem
  useEffect(() => {
    if (!fingerprint && !isCollecting) {
      collect().catch(() => {
        // Erro já foi tratado
      });
    }
  }, []);

  return {
    fingerprint,
    hash: fingerprint?.hash || cachedHash.current,
    isCollecting,
    error,
    collect,
    getHash,
  };
}

export default useEnhancedFingerprint;
