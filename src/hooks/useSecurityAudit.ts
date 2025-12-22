// ============================================
// 🛡️ HOOK: useSecurityAudit
// Auditoria e logs de segurança client-side
// Implementa: C014, C023, C064
// ============================================

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// TIPOS
// ============================================
type AuditAction = 
  | 'page_view'
  | 'content_access'
  | 'download_attempt'
  | 'share_attempt'
  | 'screenshot_attempt'
  | 'login'
  | 'logout'
  | 'session_start'
  | 'session_end'
  | 'permission_denied'
  | 'suspicious_activity';

type ContentType = 'video' | 'pdf' | 'material' | 'live' | 'page';

interface AuditEvent {
  action: AuditAction;
  contentType?: ContentType;
  contentId?: string;
  contentTitle?: string;
  metadata?: Record<string, unknown>;
}

interface SecurityEvent {
  eventType: string;
  riskScore?: number;
  details?: Record<string, unknown>;
}

// ============================================
// UTILIDADES
// ============================================
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  
  return {
    userAgent: ua,
    platform,
    language,
    screenResolution: screenRes,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookiesEnabled: navigator.cookieEnabled,
  };
};

const generateDeviceHash = async (): Promise<string> => {
  const info = getDeviceInfo();
  const data = JSON.stringify(info);
  
  // Gerar hash simples
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
};

// ============================================
// HOOK PRINCIPAL
// ============================================
export function useSecurityAudit() {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const deviceHashRef = useRef<string | null>(null);

  // Inicializar session e device hash
  useEffect(() => {
    const init = async () => {
      sessionIdRef.current = crypto.randomUUID();
      deviceHashRef.current = await generateDeviceHash();
    };
    init();
  }, []);

  // Log de auditoria genérico
  const logAudit = useCallback(async (event: AuditEvent) => {
    if (!user?.id) return;

    try {
      // Para conteúdo, usar tabela específica
      if (event.contentType && event.contentId) {
        const { error } = await supabase
          .from('content_access_logs')
          .insert({
            user_id: user.id,
            content_type: event.contentType,
            content_id: event.contentId,
            content_title: event.contentTitle || null,
            action: event.action,
            device_hash: deviceHashRef.current,
            session_id: sessionIdRef.current,
            metadata: event.metadata || null,
          });

        if (error && !error.message.includes('does not exist')) {
          console.warn('[Audit] Content log error:', error.message);
        }
      }

      // Log genérico via função
      await supabase.rpc('log_audit_event', {
        p_action: event.action,
        p_table_name: event.contentType || null,
        p_record_id: event.contentId || null,
        p_metadata: event.metadata || null,
      });
    } catch (err) {
      // Não quebrar a aplicação por falha de log
      console.warn('[Audit] Log failed:', err);
    }
  }, [user?.id]);

  // Log de evento de segurança
  const logSecurityEvent = useCallback(async (event: SecurityEvent) => {
    if (!user?.id) return;

    try {
      const deviceInfo = getDeviceInfo();
      
      await supabase.rpc('log_security_event', {
        p_event_type: event.eventType,
        p_user_id: user.id,
        p_user_agent: deviceInfo.userAgent,
        p_risk_score: event.riskScore || 0,
        p_details: {
          ...event.details,
          device: deviceInfo,
          session_id: sessionIdRef.current,
        },
      });
    } catch (err) {
      console.warn('[Security] Event log failed:', err);
    }
  }, [user?.id]);

  // ============================================
  // MÉTODOS ESPECÍFICOS
  // ============================================

  // Log de visualização de página
  const logPageView = useCallback((pagePath: string, pageTitle?: string) => {
    logAudit({
      action: 'page_view',
      contentType: 'page',
      contentId: pagePath,
      contentTitle: pageTitle,
      metadata: {
        url: window.location.href,
        referrer: document.referrer,
      },
    });
  }, [logAudit]);

  // Log de acesso a conteúdo
  const logContentAccess = useCallback((
    contentType: ContentType,
    contentId: string,
    contentTitle?: string,
    metadata?: Record<string, unknown>
  ) => {
    logAudit({
      action: 'content_access',
      contentType,
      contentId,
      contentTitle,
      metadata,
    });
  }, [logAudit]);

  // Log de tentativa de download (suspeito)
  const logDownloadAttempt = useCallback((
    contentType: ContentType,
    contentId: string,
    contentTitle?: string
  ) => {
    logAudit({
      action: 'download_attempt',
      contentType,
      contentId,
      contentTitle,
    });

    // Também registrar como evento de segurança
    logSecurityEvent({
      eventType: 'data_access_anomaly',
      riskScore: 60,
      details: {
        type: 'download_attempt',
        content_type: contentType,
        content_id: contentId,
      },
    });
  }, [logAudit, logSecurityEvent]);

  // Log de tentativa de screenshot
  const logScreenshotAttempt = useCallback((
    contentType: ContentType,
    contentId: string
  ) => {
    logAudit({
      action: 'screenshot_attempt',
      contentType,
      contentId,
    });

    logSecurityEvent({
      eventType: 'data_access_anomaly',
      riskScore: 50,
      details: {
        type: 'screenshot_attempt',
        content_type: contentType,
        content_id: contentId,
      },
    });
  }, [logAudit, logSecurityEvent]);

  // Log de permissão negada
  const logPermissionDenied = useCallback((
    resource: string,
    action: string
  ) => {
    logSecurityEvent({
      eventType: 'permission_denied',
      riskScore: 40,
      details: {
        resource,
        attempted_action: action,
      },
    });
  }, [logSecurityEvent]);

  // Log de atividade suspeita
  const logSuspiciousActivity = useCallback((
    description: string,
    riskScore: number = 70,
    details?: Record<string, unknown>
  ) => {
    logSecurityEvent({
      eventType: 'login_suspicious',
      riskScore,
      details: {
        description,
        ...details,
      },
    });
  }, [logSecurityEvent]);

  return {
    logAudit,
    logSecurityEvent,
    logPageView,
    logContentAccess,
    logDownloadAttempt,
    logScreenshotAttempt,
    logPermissionDenied,
    logSuspiciousActivity,
    sessionId: sessionIdRef.current,
    deviceHash: deviceHashRef.current,
  };
}

export default useSecurityAudit;
