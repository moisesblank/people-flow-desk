// ============================================
// 🔥 HOOK: useSecureVideo - DOGMA III
// URLs assinadas e expiráveis para vídeos
// ============================================

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WatermarkData {
  nome?: string;
  cpf?: string;
  email?: string;
}

interface SignedVideoUrl {
  id: string;
  token: string;
  expires_at: string;
  video_id: string;
}

interface SecureVideoResult {
  signedUrl: SignedVideoUrl;
  watermark: WatermarkData;
}

export const useSecureVideo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gera uma URL assinada para um vídeo (expira em 5 minutos)
   */
  const generateSignedUrl = useCallback(async (videoId: string): Promise<SecureVideoResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('secure-video-url', {
        body: { action: 'generate', videoId }
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar URL');
      }

      console.log(`🔐 URL assinada gerada para vídeo ${videoId} - Expira em 5 minutos`);
      return data;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('❌ Erro ao gerar URL assinada:', err);
      toast.error('Erro ao acessar vídeo', { description: message });
      return null;

    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Valida se uma URL assinada ainda é válida
   */
  const validateSignedUrl = useCallback(async (token: string, videoId: string): Promise<boolean> => {
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('secure-video-url', {
        body: { action: 'validate', token, videoId }
      });

      if (invokeError || !data.valid) {
        console.warn('⚠️ URL assinada inválida ou expirada');
        return false;
      }

      return true;

    } catch (err) {
      console.error('❌ Erro ao validar URL:', err);
      return false;
    }
  }, []);

  /**
   * Obtém URL do Panda Video via proxy seguro
   */
  const getPandaVideoUrl = useCallback(async (videoId: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('secure-video-url', {
        body: { action: 'get_panda_url', videoId }
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      return data.videoUrl;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('❌ Erro ao obter URL do Panda:', err);
      return null;

    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Log de tentativa de acesso bloqueado
   */
  const logBlockedAccess = useCallback(async (contentType: string, contentId: string, reason: string) => {
    try {
      await supabase.from('content_access_log').insert({
        content_type: contentType,
        content_id: contentId,
        action: 'blocked_attempt',
        success: false,
        blocked_reason: reason
      });
      console.warn(`🚫 Acesso bloqueado logado: ${contentType}/${contentId} - ${reason}`);
    } catch (err) {
      console.error('Erro ao logar acesso bloqueado:', err);
    }
  }, []);

  return {
    isLoading,
    error,
    generateSignedUrl,
    validateSignedUrl,
    getPandaVideoUrl,
    logBlockedAccess
  };
};

export default useSecureVideo;
