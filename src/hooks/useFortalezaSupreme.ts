// ============================================
// 🛡️ FORTALEZA SUPREME v4.0 - HOOKS
// Sistema de Segurança PHD-Level 2300
// Otimizado para 5000+ usuários e 3G
// ============================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [accessResult, setAccessResult] = useState<UrlAccessResult | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    // Evitar verificações duplicadas
    if (lastPathRef.current === location.pathname && accessResult) {
      return;
    }
    lastPathRef.current = location.pathname;

    const checkAccess = async () => {
      // Rotas públicas não precisam de verificação
      const publicPaths = ['/', '/auth', '/login', '/registro', '/termos', '/privacidade', '/area-gratuita'];
      if (publicPaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))) {
        setAccessResult({ allowed: true, reason: 'Public route', redirect_to: null });
        setIsChecking(false);
        return;
      }

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

      // Log de acesso negado (fire-and-forget)
      if (!result.allowed) {
        logSecurityEvent('unauthorized_access', user.id, 'warning', {
          url: location.pathname,
          domain,
          reason: result.reason,
        });

        // Redirecionar se necessário
        if (result.redirect_to) {
          navigate(result.redirect_to, { replace: true });
        }
      }
    };

    checkAccess();
  }, [user?.id, location.pathname, navigate]);

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
  const lastCheckRef = useRef<number>(0);

  const checkLimit = useCallback(async (): Promise<boolean> => {
    // Debounce: evitar múltiplas verificações em menos de 1s
    const now = Date.now();
    if (now - lastCheckRef.current < 1000) {
      return !isLimited;
    }
    lastCheckRef.current = now;

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

      // Log do rate limit (fire-and-forget)
      logSecurityEvent('rate_limit_exceeded', user?.id, 'warning', {
        endpoint,
        role: userRole,
      });
    }

    return result.allowed;
  }, [user?.id, role, endpoint, isLimited]);

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
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    const data = await getSecurityDashboard();
    
    if (!isMountedRef.current) return;
    
    if (data) {
      setDashboard(data);
    } else {
      setError('Failed to load security dashboard');
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    refresh();
    
    const interval = setInterval(refresh, refreshInterval);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
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
  const hasLoggedRef = useRef(false);

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

      // Log apenas uma vez se suspeito (evitar spam)
      if (result.suspicious && user?.id && !hasLoggedRef.current) {
        hasLoggedRef.current = true;
        logSecurityEvent('suspicious_activity_detected', user.id, 'warning', {
          riskScore: result.riskScore,
          reasons: result.reasons,
        });
      }
    };

    // Verificar imediatamente
    checkThreats();
    
    // Verificar periodicamente (a cada 60s)
    const interval = setInterval(checkThreats, SECURITY_CONFIG.THREAT_DETECTION.CHECK_INTERVAL_MS);

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
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    });
  }, [user?.id]);

  const logLogin = useCallback((success: boolean, method?: string) => {
    return log(success ? 'login_success' : 'login_failed', success ? 'info' : 'warning', { method });
  }, [log]);

  const logLogout = useCallback((reason?: string) => {
    return log('logout', 'info', { reason });
  }, [log]);

  const logAccessDenied = useCallback((resource: string, reason: string) => {
    return log('access_denied', 'warning', { resource, reason });
  }, [log]);

  const logSuspiciousActivity = useCallback((activity: string, details: Record<string, unknown>) => {
    return log('suspicious_activity', 'warning', { activity, ...details });
  }, [log]);

  const logDataAccess = useCallback((table: string, action: string, recordCount?: number) => {
    return log('data_access', 'info', { table, action, recordCount });
  }, [log]);

  return { 
    log, 
    logLogin, 
    logLogout, 
    logAccessDenied, 
    logSuspiciousActivity,
    logDataAccess 
  };
}

// ============================================
// HOOK: useSessionSecurity
// Segurança de sessão integrada
// ============================================

export function useSessionSecurity() {
  const { user, signOut } = useAuth();
  const [isSecure, setIsSecure] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Resetar timer de inatividade
  const resetIdleTimer = useCallback(() => {
    setLastActivity(Date.now());
    
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    // Configurar timeout de inatividade
    idleTimeoutRef.current = setTimeout(() => {
      if (user) {
        logSecurityEvent('session_idle_timeout', user.id, 'info');
        signOut();
      }
    }, SECURITY_CONFIG.SESSION.IDLE_TIMEOUT_MS);
  }, [user, signOut]);

  // Monitorar atividade do usuário
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleActivity = () => resetIdleTimer();
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    resetIdleTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [user, resetIdleTimer]);

  // Verificar visibilidade da página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetIdleTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [resetIdleTimer]);

  return { isSecure, lastActivity, resetIdleTimer };
}

// ============================================
// HOOK: useSecurityStatus
// Status geral de segurança
// ============================================

export function useSecurityStatus() {
  const { threatLevel, riskScore } = useThreatDetection();
  const { isSecure } = useSessionSecurity();

  const status = useMemo(() => {
    if (riskScore >= 70 || !isSecure) return 'danger';
    if (riskScore >= 50 || threatLevel === 'medium') return 'warning';
    if (riskScore >= 30 || threatLevel === 'low') return 'caution';
    return 'secure';
  }, [riskScore, threatLevel, isSecure]);

  const message = useMemo(() => {
    switch (status) {
      case 'danger': return 'Atividade suspeita detectada';
      case 'warning': return 'Monitorando atividade';
      case 'caution': return 'Verificação de segurança';
      default: return 'Conexão segura';
    }
  }, [status]);

  return { status, message, threatLevel, riskScore, isSecure };
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
  useSessionSecurity,
  useSecurityStatus,
};
