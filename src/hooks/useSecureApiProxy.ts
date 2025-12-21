// ============================================
// 🔥 HOOK: useSecureApiProxy - DOGMA IV
// TODAS as chamadas de API via proxy seguro
// ZERO chaves de API no frontend
// ============================================

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SupportedService = 'openai' | 'stripe' | 'panda' | 'hotmart' | 'youtube';

interface ApiProxyOptions {
  showErrorToast?: boolean;
}

export const useSecureApiProxy = (options: ApiProxyOptions = {}) => {
  const { showErrorToast = true } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Faz uma chamada segura para APIs externas via Edge Function
   * NUNCA expõe chaves de API no frontend
   */
  const callApi = useCallback(async <T = any>(
    service: SupportedService,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: Record<string, any>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔐 Chamada segura para ${service}/${endpoint}`);

      const { data: response, error: invokeError } = await supabase.functions.invoke('secure-api-proxy', {
        body: { service, endpoint, method, data }
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (response?.error) {
        throw new Error(response.error);
      }

      return response as T;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro na chamada de API';
      setError(message);
      console.error(`❌ Erro no proxy API (${service}):`, err);
      
      if (showErrorToast) {
        toast.error('Erro na operação', { description: message });
      }
      
      return null;

    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast]);

  // ============================================
  // MÉTODOS ESPECÍFICOS POR SERVIÇO
  // ============================================

  /**
   * Chamadas para OpenAI (Chat, Embeddings, etc.)
   */
  const openai = {
    chat: useCallback(async (messages: any[], model = 'gpt-4o-mini') => {
      return callApi('openai', 'chat/completions', 'POST', {
        model,
        messages,
        max_tokens: 2000
      });
    }, [callApi]),

    embedding: useCallback(async (text: string) => {
      return callApi('openai', 'embeddings', 'POST', {
        model: 'text-embedding-3-small',
        input: text
      });
    }, [callApi])
  };

  /**
   * Chamadas para Stripe (Pagamentos)
   */
  const stripe = {
    createPaymentIntent: useCallback(async (amount: number, currency = 'brl') => {
      return callApi('stripe', 'payment_intents', 'POST', {
        amount,
        currency
      });
    }, [callApi]),

    getCustomer: useCallback(async (customerId: string) => {
      return callApi('stripe', `customers/${customerId}`, 'GET');
    }, [callApi])
  };

  /**
   * Chamadas para Panda Video
   */
  const panda = {
    getVideo: useCallback(async (videoId: string) => {
      return callApi('panda', `videos/${videoId}`, 'GET');
    }, [callApi]),

    listVideos: useCallback(async () => {
      return callApi('panda', 'videos', 'GET');
    }, [callApi])
  };

  /**
   * Chamadas para Hotmart
   */
  const hotmart = {
    getSubscriptions: useCallback(async () => {
      return callApi('hotmart', 'subscriptions', 'GET');
    }, [callApi]),

    getSales: useCallback(async () => {
      return callApi('hotmart', 'sales', 'GET');
    }, [callApi])
  };

  /**
   * Chamadas para YouTube Data API
   */
  const youtube = {
    getChannelStats: useCallback(async (channelId: string) => {
      return callApi('youtube', `channels?part=statistics&id=${channelId}`, 'GET');
    }, [callApi]),

    getVideos: useCallback(async (playlistId: string) => {
      return callApi('youtube', `playlistItems?part=snippet&playlistId=${playlistId}`, 'GET');
    }, [callApi])
  };

  return {
    isLoading,
    error,
    callApi,
    openai,
    stripe,
    panda,
    hotmart,
    youtube
  };
};

export default useSecureApiProxy;
