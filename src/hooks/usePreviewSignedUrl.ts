// ============================================
// 🔐 PREVIEW SIGNED URL HOOK v1.0
// Gera signed URLs dinamicamente para previews de PDF
// Bucket pdf-previews é PRIVADO
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PREVIEW_BUCKET = 'pdf-previews';
const DEFAULT_TTL = 3600; // 1 hora
const CACHE_TTL = 3000000; // 50 min (refresh antes de expirar)

// Cache global para evitar requests duplicados
const urlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Normaliza path - extrai path relativo de URLs antigas ou retorna path como está
 */
function normalizePreviewPath(input: string | null | undefined): string | null {
  if (!input) return null;
  
  // Se já é path relativo, retornar como está
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return input;
  }
  
  // Tentar extrair de URL antiga
  const patterns = [
    /\/storage\/v1\/object\/(?:public|sign)\/pdf-previews\/(.+?)(?:\?|$)/,
    /pdf-previews\/(.+?)(?:\?|$)/,
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  
  // Se não conseguiu extrair, pode ser URL externa - retornar como está
  return input;
}

/**
 * Hook para gerar signed URL a partir de preview path
 */
export function usePreviewSignedUrl(
  previewPath: string | null | undefined,
  ttl: number = DEFAULT_TTL
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const normalizedPath = normalizePreviewPath(previewPath);
    
    if (!normalizedPath) {
      setSignedUrl(null);
      return;
    }

    // Se é URL externa (não do nosso storage), usar diretamente
    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
      setSignedUrl(normalizedPath);
      return;
    }

    // Verificar cache
    const cacheKey = `${PREVIEW_BUCKET}:${normalizedPath}`;
    const cached = urlCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      setSignedUrl(cached.url);
      return;
    }

    // Buscar nova signed URL
    const fetchSignedUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: storageError } = await supabase.storage
          .from(PREVIEW_BUCKET)
          .createSignedUrl(normalizedPath, ttl);

        if (!mountedRef.current) return;

        if (storageError) {
          throw new Error(storageError.message);
        }

        if (data?.signedUrl) {
          // Salvar no cache
          urlCache.set(cacheKey, {
            url: data.signedUrl,
            expiresAt: Date.now() + CACHE_TTL,
          });
          setSignedUrl(data.signedUrl);
        } else {
          setSignedUrl(null);
        }
      } catch (err: any) {
        if (!mountedRef.current) return;
        console.error('[usePreviewSignedUrl] Erro:', err);
        setError(err.message);
        setSignedUrl(null);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchSignedUrl();
  }, [previewPath, ttl]);

  return { signedUrl, isLoading, error };
}

/**
 * Função utilitária para gerar signed URL (não-hook)
 */
export async function getPreviewSignedUrl(
  previewPath: string | null | undefined,
  ttl: number = DEFAULT_TTL
): Promise<string | null> {
  const normalizedPath = normalizePreviewPath(previewPath);
  
  if (!normalizedPath) return null;
  
  // Se é URL externa, retornar como está
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath;
  }
  
  // Verificar cache
  const cacheKey = `${PREVIEW_BUCKET}:${normalizedPath}`;
  const cached = urlCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.url;
  }
  
  // Buscar nova signed URL
  const { data, error } = await supabase.storage
    .from(PREVIEW_BUCKET)
    .createSignedUrl(normalizedPath, ttl);
  
  if (error || !data?.signedUrl) {
    console.error('[getPreviewSignedUrl] Erro:', error);
    return null;
  }
  
  // Salvar no cache
  urlCache.set(cacheKey, {
    url: data.signedUrl,
    expiresAt: Date.now() + CACHE_TTL,
  });
  
  return data.signedUrl;
}

export default usePreviewSignedUrl;
