// ============================================
// 🛡️ FORTALEZA SUPREME v3.0 - HOOK
// Sistema de Segurança PHD-Level 2300
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  checkUrlAccess,
  checkRateLimit,
  logSecurityEvent,
  getSecurityDashboard,
  detectSuspiciousActivity,
  checkClientRateLimit,
  SECURITY_CONFIG,
  type UrlAccessResult,
  type RateLimitResult,
  type SecurityDashboard,
} from '@/lib/security/fortalezaSupreme';

// ============================================
// HOOK: useUrlAccessGuard
// Protege rotas conforme MAPA DEFINITIVO
// ============================================

export function useUrlAccessGuard() {
  const { user } = useAuth();
  const location = useLocation();
  const [accessResult, setAccessResult] = useState<UrlAccessResult | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.id) {
        setAccessResult({ allowed: false, reason: 'Not authenticated', redirect_to: '/auth' });
        setIsChecking(false);
        return;
      }

      setIsChecking(true);
      const domain = window.location.hostname;
      const result = await checkUrlAccess(user.id, location.pathname, domain);
      setAccessResult(result);
      setIsChecking(false);

      // Log de acesso negado
      if (!result.allowed) {
        await logSecurityEvent('unauthorized_access', user.id, 'warning', {
          url: location.pathname,
          domain,
          reason: result.reason,
        });
      }
    };

    checkAccess();
  }, [user?.id, location.pathname]);

  return { accessResult, isChecking };
}

// ============================================
// HOOK: useRateLimiter
// Rate limiting avançado para 5000+ usuários
// ============================================

export function useRateLimiter(endpoint: string) {
  const { user, role } = useAuth();
  const [isLimited, setIsLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [remaining, setRemaining] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const checkLimit = useCallback(async (): Promise<boolean> => {
    const identifier = user?.id || 'anonymous';
    const userRole = role || 'anonymous';

    // Verificação client-side primeiro (mais rápido)
    const clientAllowed = checkClientRateLimit(
      `${identifier}:${endpoint}`,
      SECURITY_CONFIG.RATE_LIMIT.API.requests,
      SECURITY_CONFIG.RATE_LIMIT.API.windowMs
    );

    if (!clientAllowed) {
      setIsLimited(true);
      setRetryAfter(60);
      return false;
    }

    // Verificação server-side
    const result = await checkRateLimit(identifier, endpoint, userRole);
    
    setIsLimited(!result.allowed);
    setRetryAfter(result.retry_after);
    setRemaining(result.remaining);

    if (!result.allowed) {
      // Iniciar countdown
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRetryAfter(prev => {
          if (prev <= 1) {
            setIsLimited(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Log do rate limit
      await logSecurityEvent('rate_limit_exceeded', user?.id, 'warning', {
        endpoint,
        role: userRole,
      });
    }

    return result.allowed;
  }, [user?.id, role, endpoint]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { isLimited, retryAfter, remaining, checkLimit };
}

// ============================================
// HOOK: useSecurityDashboard
// Dashboard de segurança em tempo real
// ============================================

export function useSecurityDashboard(refreshInterval: number = 30000) {
  const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const data = await getSecurityDashboard();
    
    if (data) {
      setDashboard(data);
    } else {
      setError('Failed to load security dashboard');
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  return { dashboard, isLoading, error, refresh };
}

// ============================================
// HOOK: useThreatDetection
// Detecção de ameaças client-side
// ============================================

export function useThreatDetection() {
  const { user } = useAuth();
  const [threatLevel, setThreatLevel] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [riskScore, setRiskScore] = useState(0);
  const [reasons, setReasons] = useState<string[]>([]);

  useEffect(() => {
    const checkThreats = () => {
      const result = detectSuspiciousActivity();
      
      setRiskScore(result.riskScore);
      setReasons(result.reasons);
      
      if (result.riskScore >= 70) {
        setThreatLevel('high');
      } else if (result.riskScore >= 50) {
        setThreatLevel('medium');
      } else if (result.riskScore >= 30) {
        setThreatLevel('low');
      } else {
        setThreatLevel('none');
      }

      // Log se suspeito
      if (result.suspicious && user?.id) {
        logSecurityEvent('suspicious_activity_detected', user.id, 'warning', {
          riskScore: result.riskScore,
          reasons: result.reasons,
        });
      }
    };

    // Verificar periodicamente
    checkThreats();
    const interval = setInterval(checkThreats, 60000);

    return () => clearInterval(interval);
  }, [user?.id]);

  return { threatLevel, riskScore, reasons };
}

// ============================================
// HOOK: useSecurityLogger
// Logger de eventos de segurança
// ============================================

export function useSecurityLogger() {
  const { user } = useAuth();

  const log = useCallback(async (
    eventType: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
    details: Record<string, unknown> = {}
  ) => {
    return await logSecurityEvent(eventType, user?.id, severity, {
      ...details,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }, [user?.id]);

  const logLogin = useCallback((success: boolean) => {
    return log(success ? 'login_success' : 'login_failed', success ? 'info' : 'warning');
  }, [log]);

  const logLogout = useCallback(() => {
    return log('logout', 'info');
  }, [log]);

  const logAccessDenied = useCallback((resource: string, reason: string) => {
    return log('access_denied', 'warning', { resource, reason });
  }, [log]);

  const logSuspiciousActivity = useCallback((activity: string, details: Record<string, unknown>) => {
    return log('suspicious_activity', 'warning', { activity, ...details });
  }, [log]);

  return { log, logLogin, logLogout, logAccessDenied, logSuspiciousActivity };
}

// ============================================
// EXPORTAÇÕES
// ============================================

export default {
  useUrlAccessGuard,
  useRateLimiter,
  useSecurityDashboard,
  useThreatDetection,
  useSecurityLogger,
};
