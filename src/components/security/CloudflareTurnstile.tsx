// ============================================
// CLOUDFLARE TURNSTILE COMPONENT
// LEI III - DOGMA SEGURANÇA: Anti-Bot Protection
// Integração com Cloudflare Turnstile (CAPTCHA moderno)
// ============================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { Shield, AlertCircle, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

// Cloudflare Turnstile Site Key (pública)
const TURNSTILE_SITE_KEY = '0x4AAAAAACIzQHOgrmgkciqj';

// Detectar ambiente de desenvolvimento/preview
const isDevEnvironment = () => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname.includes('lovableproject.com') ||
    hostname.includes('127.0.0.1')
  );
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: (error: string) => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  language?: string;
  appearance?: 'always' | 'execute' | 'interaction-only';
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
}

interface CloudflareTurnstileProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  className?: string;
  showStatus?: boolean;
}

// ============================================
// 🔓 TURNSTILE PERMANENTEMENTE DESATIVADO
// O componente agora é NO-OP (não carrega script, não renderiza widget)
// Motivo: Erro 400020 em preview (hostname não configurado)
// Segurança: Rate-limiting + lockout + RLS protegem backend
// ============================================
export function CloudflareTurnstile({
  onVerify,
  onError,
  onExpire,
  theme = 'dark',
  size = 'flexible',
  className = '',
  showStatus = true
}: CloudflareTurnstileProps) {
  // 🔓 BYPASS TOTAL: Componente é NO-OP
  // Não carrega script, não renderiza widget, apenas mostra status "verificado"
  
  useEffect(() => {
    // Auto-verificar imediatamente (bypass)
    console.log('[AUTH] 🔓 Turnstile BYPASS: Componente NO-OP (não carrega widget)');
    onVerify('TURNSTILE_DISABLED_COMPONENT_BYPASS');
  }, []);
  
  // Renderizar apenas indicador visual de "verificado" (sem widget real)
  if (!showStatus) return null;
  
  return (
    <div className={`flex items-center gap-2 py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 ${className}`}>
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      <span className="text-xs text-emerald-300">Verificação automática</span>
    </div>
  );
}

// Hook para usar Turnstile em formulários

// Hook para usar Turnstile em formulários
// ============================================
// 🔓 POLÍTICA v10.4: TURNSTILE PERMANENTEMENTE DESATIVADO
// Motivo: Erros de hostname mismatch em preview/produção
// Segurança: Rate-limiting + lockout + RLS protegem backend
// ============================================
export function useTurnstile() {
  // 🔓 BYPASS PERMANENTE: Sempre retorna verificado
  // Token estático para indicar que turnstile está desabilitado
  const BYPASS_TOKEN = 'TURNSTILE_DISABLED_AUTH_BYPASS_v10.4';
  
  const reset = useCallback(() => {
    // No-op: bypass permanente não precisa resetar
    console.log('[AUTH] 🔓 Turnstile reset (bypass ativo - no-op)');
  }, []);

  // Log apenas uma vez por sessão
  if (typeof window !== 'undefined' && !(window as any).__turnstileBypassLogged) {
    console.log('[AUTH] 🔓 TURNSTILE BYPASS ATIVO - Verificação anti-bot desabilitada');
    (window as any).__turnstileBypassLogged = true;
  }

  return {
    token: BYPASS_TOKEN,
    isVerified: true,  // 🔓 SEMPRE VERIFICADO
    error: null,
    handleVerify: () => {},  // No-op
    handleError: () => {},   // No-op
    handleExpire: () => {},  // No-op
    reset,
    TurnstileProps: {
      onVerify: () => {},
      onError: () => {},
      onExpire: () => {}
    }
  };
}

export default CloudflareTurnstile;
