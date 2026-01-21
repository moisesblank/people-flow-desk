// ============================================
// CLOUDFLARE TURNSTILE COMPONENT
// LEI III - DOGMA SEGURANÇA: Anti-Bot Protection
// 🔓 BYPASS PERMANENTE (v10.4): Componente NO-OP
// Segurança mantida via rate-limiting + lockout + RLS
// ============================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface CloudflareTurnstileProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  className?: string;
  showStatus?: boolean;
}

// Token de bypass (indica que turnstile está desabilitado)
const BYPASS_TOKEN = 'TURNSTILE_DISABLED_BYPASS_v10.4';

// ============================================
// 🔓 COMPONENTE TURNSTILE (NO-OP)
// Não carrega script, não renderiza widget
// Auto-verifica imediatamente no mount
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
  const hasVerifiedRef = useRef(false);
  
  // 🔓 BYPASS: Auto-verificar imediatamente no mount
  // Usar ref para garantir que só dispara uma vez
  useEffect(() => {
    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;
    
    console.log('[AUTH] 🔓 Turnstile BYPASS: Auto-verificação imediata');
    
    // Chamar onVerify com pequeno delay para garantir que o estado do formulário está pronto
    const timer = setTimeout(() => {
      onVerify(BYPASS_TOKEN);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [onVerify]);
  
  // Renderizar indicador visual de "verificado"
  if (!showStatus) return null;
  
  return (
    <div className={`flex items-center gap-2 py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 ${className}`}>
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      <span className="text-xs text-emerald-300">Verificação automática</span>
    </div>
  );
}

// ============================================
// 🔓 HOOK useTurnstile (BYPASS PERMANENTE)
// Sempre retorna isVerified: true
// ============================================
export function useTurnstile() {
  const [isVerified, setIsVerified] = useState(true); // 🔓 Já inicia verificado
  
  const handleVerify = useCallback((token: string) => {
    console.log('[AUTH] 🔓 Turnstile handleVerify chamado (bypass)');
    setIsVerified(true);
  }, []);
  
  const handleError = useCallback((error: string) => {
    // No bypass, erros são ignorados
    console.log('[AUTH] 🔓 Turnstile erro ignorado (bypass):', error);
  }, []);
  
  const handleExpire = useCallback(() => {
    // No bypass, expiração é ignorada (mantém verificado)
    console.log('[AUTH] 🔓 Turnstile expiração ignorada (bypass)');
  }, []);
  
  const reset = useCallback(() => {
    // No bypass, reset mantém verificado
    console.log('[AUTH] 🔓 Turnstile reset (bypass - mantém verificado)');
    setIsVerified(true);
  }, []);

  // Log apenas uma vez por sessão
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).__turnstileBypassLogged) {
      console.log('[AUTH] 🔓 TURNSTILE BYPASS ATIVO (v10.4) - Verificação anti-bot desabilitada');
      (window as any).__turnstileBypassLogged = true;
    }
  }, []);

  return {
    token: BYPASS_TOKEN,
    isVerified: true, // 🔓 SEMPRE TRUE
    error: null,
    handleVerify,
    handleError,
    handleExpire,
    reset,
    // Props para passar ao componente CloudflareTurnstile
    TurnstileProps: {
      onVerify: handleVerify,
      onError: handleError,
      onExpire: handleExpire
    }
  };
}

export default CloudflareTurnstile;
