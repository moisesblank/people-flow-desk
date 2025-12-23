// ============================================
// CLOUDFLARE TURNSTILE COMPONENT
// LEI III - DOGMA SEGURANÇA: Anti-Bot Protection
// Integração com Cloudflare Turnstile (CAPTCHA moderno)
// ============================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { Shield, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// Cloudflare Turnstile Site Key (pública)
const TURNSTILE_SITE_KEY = '0x4AAAAAACIzQHOgrmgkciqj';

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
  const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'error' | 'expired'>('loading');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Carregar script do Turnstile
  useEffect(() => {
    if (window.turnstile) {
      setIsScriptLoaded(true);
      return;
    }

    // Verificar se script já existe
    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (existingScript) {
      window.onTurnstileLoad = () => setIsScriptLoaded(true);
      return;
    }

    // Criar callback global
    window.onTurnstileLoad = () => {
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

    // Renderizar novo widget
    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme,
        size,
        language: 'pt-BR',
        appearance: 'always',
        retry: 'auto',
        'retry-interval': 5000,
        'refresh-expired': 'auto',
        callback: (token: string) => {
          setStatus('verified');
          onVerify(token);
        },
        'error-callback': (error: string) => {
          setStatus('error');
          onError?.(error);
        },
        'expired-callback': () => {
          setStatus('expired');
          onExpire?.();
        }
      });
    } catch (error) {
      console.error('[Turnstile] Erro ao renderizar:', error);
      setStatus('error');
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
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
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
      case 'error':
        return 'Erro na verificação';
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
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = useCallback((newToken: string) => {
    setToken(newToken);
    setIsVerified(true);
    setError(null);
  }, []);

  const handleError = useCallback((errorMsg: string) => {
    setToken(null);
    setIsVerified(false);
    setError(errorMsg);
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
    setIsVerified(false);
    setError('Verificação expirada');
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setIsVerified(false);
    setError(null);
    if ((window as any).__turnstileReset) {
      (window as any).__turnstileReset();
    }
  }, []);

  return {
    token,
    isVerified,
    error,
    handleVerify,
    handleError,
    handleExpire,
    reset,
    TurnstileProps: {
      onVerify: handleVerify,
      onError: handleError,
      onExpire: handleExpire
    }
  };
}

export default CloudflareTurnstile;
