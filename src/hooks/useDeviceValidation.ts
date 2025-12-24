// ============================================
// 🏛️ LEI VI: HOOK DE VALIDAÇÃO DE DISPOSITIVO
// Integra frontend → validate-device edge function
// ============================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedFingerprint } from './useEnhancedFingerprint';

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

export function useDeviceValidation(): UseDeviceValidationReturn {
  const [lastResult, setLastResult] = useState<DeviceValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { collect, hash } = useEnhancedFingerprint();

  const validateDevice = useCallback(async (options: {
    userId?: string;
    email?: string;
    action: 'pre_login' | 'post_login' | 'validate' | 'register';
  }): Promise<DeviceValidationResult> => {
    setIsValidating(true);
    setError(null);

    try {
      // Coletar fingerprint
      const fingerprintData = await collect();
      
      console.log('[DeviceValidation] Validando dispositivo...', { 
        action: options.action,
        hash: fingerprintData.hash.substring(0, 16) + '...'
      });

      // Chamar edge function
      const { data, error: fnError } = await supabase.functions.invoke('validate-device', {
        body: {
          fingerprint: fingerprintData.hash,
          fingerprintData: {
            ...fingerprintData,
            hash: undefined, // Não enviar o hash no body
          },
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
  }, [collect]);

  return {
    validateDevice,
    lastResult,
    isValidating,
    error,
    needsChallenge: lastResult?.requiresChallenge || false,
    riskScore: lastResult?.riskScore || null,
  };
}
