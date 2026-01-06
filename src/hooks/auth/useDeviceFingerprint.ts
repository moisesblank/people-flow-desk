// ============================================
// 🔐 useDeviceFingerprint — REATIVADO v2.0
// Browser Fingerprinting ATIVO
// Usa fingerprint PERSISTENTE do localStorage
// ============================================

import { useCallback } from "react";
import { generateDeviceFingerprint, generateDeviceName, detectDeviceType } from "@/lib/deviceFingerprint";

export interface FingerprintResult {
  hash: string;
  data: Record<string, unknown>;
}

/**
 * Hook ATIVADO - retorna fingerprint PERSISTENTE
 * Reconhece dispositivo entre sessões (30 dias de cache)
 */
export function useDeviceFingerprint() {
  const collect = useCallback(async (): Promise<FingerprintResult> => {
    // 🔐 ATIVADO: Usa fingerprint persistente do localStorage
    const hash = await generateDeviceFingerprint();
    const deviceType = detectDeviceType();
    const deviceName = generateDeviceName();
    
    // Extrair browser e OS do deviceName
    const parts = deviceName.split(' • ');
    const os = parts[0] || 'Unknown';
    const browser = parts[1] || 'Unknown';
    
    console.log('[Fingerprint] 🔐 ATIVADO - fingerprint persistente:', hash.slice(0, 8) + '...');
    
    return {
      hash,
      data: {
        deviceType,
        browser,
        os,
        deviceName,
        _fingerprinting_disabled: false,
      },
    };
  }, []);

  return { collect };
}
