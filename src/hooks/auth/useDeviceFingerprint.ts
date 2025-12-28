// ============================================
// 🔐 useDeviceFingerprint — Fingerprint Isolado
// Extraído do useAuth para Single Responsibility
// ============================================

import { useCallback } from "react";
import { collectEnhancedFingerprint } from "@/lib/enhancedFingerprint";

export interface FingerprintResult {
  hash: string;
  data: Record<string, unknown>;
}

export function useDeviceFingerprint() {
  const collect = useCallback(async (): Promise<FingerprintResult> => {
    try {
      const result = await collectEnhancedFingerprint();
      return { hash: result.hash, data: result.data as unknown as Record<string, unknown> };
    } catch (err) {
      console.warn('[Fingerprint] Versão reforçada falhou, usando básico:', err);
      return collectBasicFingerprint();
    }
  }, []);

  return { collect };
}

// Fallback para fingerprint básico
async function collectBasicFingerprint(): Promise<FingerprintResult> {
  const data: Record<string, unknown> = {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || null,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    deviceType: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) 
      ? (/iPad|Tablet/i.test(navigator.userAgent) ? 'tablet' : 'mobile')
      : 'desktop',
    browser: detectBrowser(),
    os: detectOS(),
  };
  
  const hashSource = JSON.stringify(data);
  const buffer = new TextEncoder().encode(hashSource);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash, data };
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone')) return 'iOS';
  return 'Unknown';
}
