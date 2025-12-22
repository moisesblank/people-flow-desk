// ============================================
// 🛡️ FORTALEZA SUPREME v4.1
// Hook: useContentProtection
// Proteção completa de conteúdo educacional
// ============================================

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent, detectScreenCapture } from '@/lib/security/fortalezaSupreme';
import { generateDeviceFingerprint } from '@/lib/deviceFingerprint';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

export type ContentType = 'video' | 'pdf' | 'material' | 'live' | 'lesson' | 'course';
export type ContentAction = 'view_start' | 'view_end' | 'view_progress' | 'download_attempt' | 'completed';

export interface ContentAccessLog {
  user_id: string;
  content_type: ContentType;
  content_id: string;
  action: ContentAction;
  progress_percent?: number;
  duration_seconds?: number;
  device_hash?: string;
  session_id?: string;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

const SESSION_KEY = 'mm_session_token';

function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// ============================================
// FUNÇÃO: logContentAccess
// ============================================

export async function logContentAccess(
  userId: string,
  contentType: ContentType,
  contentId: string,
  action: ContentAction,
  progress?: number,
  duration?: number
): Promise<void> {
  try {
    const deviceHash = await generateDeviceFingerprint();
    const sessionId = getSessionId();

    // Inserir no log de acesso a conteúdo
    await supabase.from('content_access_log').insert({
      user_id: userId,
      content_type: contentType,
      content_id: contentId,
      action: action,
      progress_percent: progress || null,
      duration_seconds: duration || null,
      device_hash: deviceHash,
      session_id: sessionId,
    } as any);

    // Se for tentativa de download, registrar evento de segurança
    if (action === 'download_attempt') {
      await logSecurityEvent('content_download_attempt', userId, 'warning', {
        content_type: contentType,
        content_id: contentId,
      });
    }
  } catch (err) {
    console.warn('[ContentProtection] Log error:', err);
  }
}

// ============================================
// HOOK: useContentProtection
// ============================================

export interface UseContentProtectionReturn {
  updateProgress: (percent: number) => void;
  markCompleted: () => void;
}

export function useContentProtection(
  contentType: ContentType,
  contentId: string,
  enableScreenshotProtection: boolean = true
): UseContentProtectionReturn {
  const { user } = useAuth();
  const startTimeRef = useRef<number>(Date.now());
  const progressRef = useRef<number>(0);
  const lastLoggedProgressRef = useRef<number>(0);

  // Registrar início de visualização e habilitar proteções
  useEffect(() => {
    if (!user?.id || !contentId) return;

    startTimeRef.current = Date.now();
    lastLoggedProgressRef.current = 0;

    // Log de início
    logContentAccess(user.id, contentType, contentId, 'view_start');

    // Habilitar proteção de screenshot se solicitado
    let cleanupScreenshot: (() => void) | undefined;
    
    if (enableScreenshotProtection) {
      cleanupScreenshot = detectScreenCapture(() => {
        logSecurityEvent('screen_capture_attempted', user.id, 'warning', {
          content_type: contentType,
          content_id: contentId,
        });
        
        toast.warning('Captura de tela detectada', {
          description: 'Esta ação foi registrada para fins de segurança.',
        });
      });
    }

    // Cleanup: registrar fim de visualização
    return () => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      logContentAccess(user.id, contentType, contentId, 'view_end', progressRef.current, duration);
      
      if (cleanupScreenshot) {
        cleanupScreenshot();
      }
    };
  }, [user?.id, contentType, contentId, enableScreenshotProtection]);

  // Atualizar progresso (log a cada 25%)
  const updateProgress = useCallback((percent: number) => {
    progressRef.current = percent;

    if (!user?.id) return;

    // Log a cada 25%
    const threshold = Math.floor(percent / 25) * 25;
    if (threshold > lastLoggedProgressRef.current && threshold > 0) {
      lastLoggedProgressRef.current = threshold;
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      logContentAccess(user.id, contentType, contentId, 'view_progress', threshold, duration);
    }
  }, [user?.id, contentType, contentId]);

  // Marcar como completo
  const markCompleted = useCallback(() => {
    if (!user?.id) return;

    progressRef.current = 100;
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    logContentAccess(user.id, contentType, contentId, 'completed', 100, duration);
  }, [user?.id, contentType, contentId]);

  return {
    updateProgress,
    markCompleted,
  };
}

// ============================================
// HOOK: useContentLogger (simplificado)
// ============================================

export function useContentLogger() {
  const { user } = useAuth();

  const log = useCallback(async (
    contentType: ContentType,
    contentId: string,
    action: ContentAction,
    progress?: number,
    duration?: number
  ) => {
    if (!user?.id) return;
    await logContentAccess(user.id, contentType, contentId, action, progress, duration);
  }, [user?.id]);

  return { log };
}

export default useContentProtection;
