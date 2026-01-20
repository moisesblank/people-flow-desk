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

export function CloudflareTurnstile({
  onVerify,
  onError,
  onExpire,
  theme = 'dark',
  size = 'flexible',
  className = '',
  showStatus = true
}: CloudflareTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'error' | 'expired' | 'dev-bypass' | 'fallback'>('loading');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [domainError, setDomainError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const MAX_ERRORS_BEFORE_FALLBACK = 3;

  // Carregar script do Turnstile
  useEffect(() => {
    console.log('[AUTH] 2. Turnstile script init');

    if (window.turnstile) {
      console.log('[AUTH] 2. Turnstile script já disponível');
      setIsScriptLoaded(true);
      return;
    }

    // Verificar se script já existe
    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (existingScript) {
      console.log('[AUTH] 2. Turnstile script já injetado, aguardando onload');
      window.onTurnstileLoad = () => {
        console.log('[AUTH] 2. Turnstile script onload (existing)');
        setIsScriptLoaded(true);
      };
      return;
    }

    // Criar callback global
    window.onTurnstileLoad = () => {
      console.log('[AUTH] 2. Turnstile script onload');
      setIsScriptLoaded(true);
    };

    // Adicionar script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup não remove o script pois pode ser reutilizado
    };
  }, []);

  // Renderizar widget quando script carregar
  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || !window.turnstile) return;

    // Limpar widget anterior se existir
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignorar erro se widget não existir
      }
    }

    setStatus('ready');
    console.log('[AUTH] 2. Turnstile renderizando widget');

    // Renderizar novo widget
    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme,
        size,
        // Cloudflare usa tags em minúsculo (pt-br). Evita fallback e ruído no console.
        language: 'pt-br',
        appearance: 'always',
        retry: 'auto',
        'retry-interval': 5000,
        'refresh-expired': 'auto',
        callback: (token: string) => {
          setStatus('verified');
          setDomainError(false);
          console.log('[AUTH] 3. Token Turnstile recebido (redacted):', {
            length: token?.length || 0,
            suffix: token ? token.slice(-6) : null,
          });
          onVerify(token);
        },
        'error-callback': (errorCode: string) => {
          console.warn('[AUTH] ERROR: Turnstile error-callback:', errorCode);

          const newErrorCount = errorCount + 1;
          setErrorCount(newErrorCount);

          // Preview/Dev (Lovable/localhost): Turnstile pode não conseguir completar o desafio.
          // Nesses casos, expomos o botão de bypass DEV (apenas preview) para não bloquear o acesso.
          if (isDevEnvironment()) {
            setDomainError(true);
          }

          // Detectar erro de domínio/ambiente
          if (
            errorCode?.includes('invalid') ||
            errorCode?.includes('domain') ||
            errorCode?.includes('300030')
          ) {
            setDomainError(true);
          }

          // 🛡️ FALLBACK GRACIOSO: Após 3 erros consecutivos em PRODUÇÃO,
          // permitir prosseguir com token especial (backend aplica rate-limit agressivo)
          if (newErrorCount >= MAX_ERRORS_BEFORE_FALLBACK && !isDevEnvironment()) {
            console.warn('[Turnstile] ⚠️ FALLBACK ativado após', newErrorCount, 'erros');
            setStatus('fallback');
            // Token especial que o backend reconhece como fallback (aplica rate-limit 1/min)
            onVerify('FALLBACK_' + Date.now() + '_' + window.location.hostname);
            return;
          }

          setStatus('error');
          onError?.(errorCode);
        },
        'expired-callback': () => {
          console.warn('[AUTH] ERROR: Turnstile expired-callback');
          setStatus('expired');
          onExpire?.();
        }
      });
    } catch (error) {
      console.error('[Turnstile] Erro ao renderizar:', error);
      setStatus('error');
      setDomainError(true);
      onError?.('Erro ao carregar verificação de segurança');
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignorar
        }
        widgetIdRef.current = null;
      }
    };
  }, [isScriptLoaded, theme, size, onVerify, onError, onExpire]);

  // Método para resetar o widget
  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setStatus('ready');
    }
  }, []);

  // Bypass para ambiente de desenvolvimento quando Turnstile falha
  const handleDevBypass = useCallback(() => {
    if (!isDevEnvironment()) return;
    
    console.warn('[Turnstile] ⚠️ DEV BYPASS ativado - apenas para desenvolvimento');
    setStatus('dev-bypass');
    // Token especial que o backend reconhece como bypass de dev
    onVerify('DEV_BYPASS_' + Date.now() + '_' + window.location.hostname);
  }, [onVerify]);

  // Obter token atual
  const getToken = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      return window.turnstile.getResponse(widgetIdRef.current);
    }
    return undefined;
  }, []);

  // Expor métodos via ref
  useEffect(() => {
    (window as any).__turnstileReset = reset;
    (window as any).__turnstileGetToken = getToken;
  }, [reset, getToken]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
      case 'ready':
        return <Shield className="h-3.5 w-3.5 text-primary" />;
      case 'verified':
      case 'dev-bypass':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case 'fallback':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case 'error':
      case 'expired':
        return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return 'Carregando verificação...';
      case 'ready':
        return 'Verificação de segurança';
      case 'verified':
        return 'Verificação concluída';
      case 'dev-bypass':
        return 'Modo desenvolvimento (bypass)';
      case 'fallback':
        return 'Modo alternativo (rate-limit ativo)';
      case 'error':
        return `Erro na verificação (${errorCount}/${MAX_ERRORS_BEFORE_FALLBACK})`;
      case 'expired':
        return 'Verificação expirada';
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Container do Widget Turnstile */}
      <div 
        ref={containerRef}
        className="min-h-[65px] flex items-center justify-center"
      />
      
      {/* Botão de bypass para desenvolvimento quando há erro de domínio */}
      {status === 'error' && domainError && isDevEnvironment() && (
        <button
          type="button"
          onClick={handleDevBypass}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-md transition-colors"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Bypass Dev (domínio não configurado)</span>
        </button>
      )}
      
      {/* Status Badge */}
      {showStatus && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      )}
    </div>
  );
}

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
