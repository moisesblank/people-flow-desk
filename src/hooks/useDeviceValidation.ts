// ============================================
// 🏛️ LEI VI: HOOK DE VALIDAÇÃO DE DISPOSITIVO
// Integra frontend → validate-device edge function
// ============================================

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeviceValidationResult {
  success: boolean;
  riskScore: number;
  action: 'allow' | 'monitor' | 'challenge' | 'block';
  requiresChallenge: boolean;
  message: string;
  isNewDevice: boolean;
  countryChanged: boolean;
  rapidChange: boolean;
  factors: Array<{ name: string; description: string }>;
  device: {
    trustScore: number;
    isTrusted: boolean;
    isBlocked: boolean;
    totalSessions: number;
  } | null;
  meta: {
    ip: string;
    country: string;
    timestamp: string;
  };
}

interface UseDeviceValidationReturn {
  validateDevice: (options: {
    userId?: string;
    email?: string;
    action: 'pre_login' | 'post_login' | 'validate' | 'register';
  }) => Promise<DeviceValidationResult>;
  lastResult: DeviceValidationResult | null;
  isValidating: boolean;
  error: string | null;
  needsChallenge: boolean;
  riskScore: number | null;
}

// ============================================
// HELPER: Coletar fingerprint simplificado (inline)
// ============================================
async function collectFingerprintData(): Promise<{ hash: string; data: Record<string, unknown> }> {
  const data: Record<string, unknown> = {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenColorDepth: window.screen.colorDepth,
    screenPixelRatio: window.devicePixelRatio || 1,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || null,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: [...navigator.languages],
    platform: navigator.platform,
    vendor: navigator.vendor,
    cookiesEnabled: navigator.cookieEnabled,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    deviceType: (() => {
      const ua = navigator.userAgent;
      // 🖥️ DESKTOP FIRST
      if (/Mac OS X|Macintosh/i.test(ua) && !/iPhone|iPad/i.test(ua)) return 'desktop';
      if (/Windows NT/i.test(ua) && !/Phone/i.test(ua)) return 'desktop';
      if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'desktop';
      // 📱 Tablet
      if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
      // 📲 Mobile
      if (/Mobi|Android.*Mobile|iPhone/i.test(ua)) return 'mobile';
      return 'desktop';
    })(),
    browser: navigator.userAgent.includes('Firefox') ? 'Firefox'
      : navigator.userAgent.includes('Edg') ? 'Edge'
      : navigator.userAgent.includes('Chrome') ? 'Chrome'
      : navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
    os: navigator.userAgent.includes('Windows') ? 'Windows'
      : navigator.userAgent.includes('Mac') ? 'macOS'
      : navigator.userAgent.includes('Linux') ? 'Linux'
      : navigator.userAgent.includes('Android') ? 'Android'
      : navigator.userAgent.includes('iPhone') ? 'iOS' : 'Unknown',
    localStorageAvailable: typeof window.localStorage !== 'undefined',
    sessionStorageAvailable: typeof window.sessionStorage !== 'undefined',
    pluginsCount: navigator.plugins?.length || 0,
    collectedAt: new Date().toISOString(),
  };
  
  // Adicionar WebGL se disponível
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        data.webglVendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
        data.webglRenderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
      }
    }
  } catch {
    data.webglVendor = 'error';
    data.webglRenderer = 'error';
  }
  
  // Generate hash
  const hashSource = JSON.stringify(data);
  const buffer = new TextEncoder().encode(hashSource);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash, data };
}

export function useDeviceValidation(): UseDeviceValidationReturn {
  const [lastResult, setLastResult] = useState<DeviceValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cachedFingerprint = useRef<{ hash: string; data: Record<string, unknown> } | null>(null);

  const validateDevice = useCallback(async (options: {
    userId?: string;
    email?: string;
    action: 'pre_login' | 'post_login' | 'validate' | 'register';
  }): Promise<DeviceValidationResult> => {
    setIsValidating(true);
    setError(null);

    try {
      // Coletar fingerprint (usar cache se disponível e recente)
      let fingerprintData = cachedFingerprint.current;
      if (!fingerprintData) {
        fingerprintData = await collectFingerprintData();
        cachedFingerprint.current = fingerprintData;
      }
      
      console.log('[DeviceValidation] Validando dispositivo...', { 
        action: options.action,
        hash: fingerprintData.hash.substring(0, 16) + '...'
      });

      // Chamar edge function
      const { data, error: fnError } = await supabase.functions.invoke('validate-device', {
        body: {
          fingerprint: fingerprintData.hash,
          fingerprintData: fingerprintData.data,
          userId: options.userId,
          email: options.email,
          action: options.action,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Erro ao validar dispositivo');
      }

      const result = data as DeviceValidationResult;
      setLastResult(result);

      console.log('[DeviceValidation] Resultado:', {
        riskScore: result.riskScore,
        action: result.action,
        requiresChallenge: result.requiresChallenge,
      });

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('[DeviceValidation] Erro:', errorMessage);
      
      // Retornar resultado de fallback que permite continuar (não bloquear por erro)
      const fallbackResult: DeviceValidationResult = {
        success: false,
        riskScore: 0,
        action: 'monitor',
        requiresChallenge: false,
        message: 'Erro na validação, continuar com monitoramento',
        isNewDevice: true,
        countryChanged: false,
        rapidChange: false,
        factors: [{ name: 'validation_error', description: errorMessage }],
        device: null,
        meta: {
          ip: 'unknown',
          country: 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
      
      setLastResult(fallbackResult);
      return fallbackResult;
      
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validateDevice,
    lastResult,
    isValidating,
    error,
    needsChallenge: lastResult?.requiresChallenge || false,
    riskScore: lastResult?.riskScore || null,
  };
}
