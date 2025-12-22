// ============================================
// 🗄️ Ω5: HOOK - useStorageRouter
// Hook React para governança de storage
// ============================================

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getGovernedSignedUrl,
  governedUpload,
  governedDelete,
  canAccessBucket,
  isSensitiveBucket,
  getTTLForBucket,
  SignedUrlResult,
  UploadResult,
  SIGNED_URL_TTL,
} from '@/core/storageRouter';

export interface UseStorageRouterOptions {
  bucket: string;
  sessionId?: string;
  deviceFingerprint?: string;
}

export interface UseStorageRouterReturn {
  // Estado
  isLoading: boolean;
  error: string | null;
  
  // Operações
  getSignedUrl: (path: string, customTTL?: number) => Promise<SignedUrlResult>;
  upload: (path: string, file: File) => Promise<UploadResult>;
  deleteFile: (path: string) => Promise<{ success: boolean; error: string | null }>;
  
  // Utilitários
  canAccess: boolean;
  isSensitive: boolean;
  defaultTTL: number;
  
  // Cache de URLs
  getCachedUrl: (path: string) => string | null;
  refreshUrl: (path: string) => Promise<SignedUrlResult>;
}

// Cache local de URLs assinadas
const urlCache = new Map<string, { url: string; expiresAt: number }>();

export function useStorageRouter(options: UseStorageRouterOptions): UseStorageRouterReturn {
  const { bucket, sessionId, deviceFingerprint } = options;
  const auth = useAuth();
  const user = auth?.user;
  const profile = (auth as any)?.profile;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dados do usuário
  const userId = user?.id;
  const userRole = profile?.role || null;
  const userEmail = user?.email || undefined;
  
  // Verificações de acesso
  const canAccess = useMemo(() => canAccessBucket(bucket, userRole), [bucket, userRole]);
  const isSensitive = useMemo(() => isSensitiveBucket(bucket), [bucket]);
  const defaultTTL = useMemo(() => getTTLForBucket(bucket), [bucket]);
  
  // Obter URL do cache
  const getCachedUrl = useCallback((path: string): string | null => {
    const cacheKey = `${bucket}:${path}`;
    const cached = urlCache.get(cacheKey);
    
    if (!cached) return null;
    
    // Verificar se expirou (com margem de 5s)
    if (Date.now() > cached.expiresAt - 5000) {
      urlCache.delete(cacheKey);
      return null;
    }
    
    return cached.url;
  }, [bucket]);
  
  // Obter Signed URL
  const getSignedUrl = useCallback(async (
    path: string,
    customTTL?: number
  ): Promise<SignedUrlResult> => {
    // Verificar cache primeiro
    const cachedUrl = getCachedUrl(path);
    if (cachedUrl) {
      return {
        success: true,
        url: cachedUrl,
        expiresAt: urlCache.get(`${bucket}:${path}`)?.expiresAt || null,
        error: null,
      };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getGovernedSignedUrl({
        bucket,
        path,
        userId,
        userRole: userRole || undefined,
        userEmail,
        sessionId,
        deviceFingerprint,
      }, customTTL);
      
      if (result.success && result.url && result.expiresAt) {
        // Salvar no cache
        urlCache.set(`${bucket}:${path}`, {
          url: result.url,
          expiresAt: result.expiresAt,
        });
      } else if (result.error) {
        setError(result.error);
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [bucket, userId, userRole, userEmail, sessionId, deviceFingerprint, getCachedUrl]);
  
  // Forçar refresh da URL (ignora cache)
  const refreshUrl = useCallback(async (path: string): Promise<SignedUrlResult> => {
    // Limpar cache
    urlCache.delete(`${bucket}:${path}`);
    
    // Buscar nova URL
    return getSignedUrl(path);
  }, [bucket, getSignedUrl]);
  
  // Upload
  const upload = useCallback(async (path: string, file: File): Promise<UploadResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await governedUpload({
        bucket,
        path,
        file,
        userId,
        userRole: userRole || undefined,
        userEmail,
        sessionId,
        deviceFingerprint,
      });
      
      if (result.error) {
        setError(result.error);
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [bucket, userId, userRole, userEmail, sessionId, deviceFingerprint]);
  
  // Delete
  const deleteFile = useCallback(async (
    path: string
  ): Promise<{ success: boolean; error: string | null }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await governedDelete({
        bucket,
        path,
        userId,
        userRole: userRole || undefined,
        userEmail,
        sessionId,
        deviceFingerprint,
      });
      
      if (result.error) {
        setError(result.error);
      } else {
        // Limpar cache
        urlCache.delete(`${bucket}:${path}`);
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [bucket, userId, userRole, userEmail, sessionId, deviceFingerprint]);
  
  return {
    isLoading,
    error,
    getSignedUrl,
    upload,
    deleteFile,
    canAccess,
    isSensitive,
    defaultTTL,
    getCachedUrl,
    refreshUrl,
  };
}

// ============================================
// HOOK: useMultiBucketStorage
// Para operações em múltiplos buckets
// ============================================

export function useMultiBucketStorage(sessionId?: string, deviceFingerprint?: string) {
  const auth = useAuth();
  const user = auth?.user;
  const profile = (auth as any)?.profile;
  
  const getSignedUrl = useCallback(async (
    bucket: string,
    path: string,
    customTTL?: number
  ): Promise<SignedUrlResult> => {
    return getGovernedSignedUrl({
      bucket,
      path,
      userId: user?.id,
      userRole: profile?.role || undefined,
      userEmail: user?.email || undefined,
      sessionId,
      deviceFingerprint,
    }, customTTL);
  }, [user, profile, sessionId, deviceFingerprint]);
  
  const upload = useCallback(async (
    bucket: string,
    path: string,
    file: File
  ): Promise<UploadResult> => {
    return governedUpload({
      bucket,
      path,
      file,
      userId: user?.id,
      userRole: profile?.role || undefined,
      userEmail: user?.email || undefined,
      sessionId,
      deviceFingerprint,
    });
  }, [user, profile, sessionId, deviceFingerprint]);
  
  const deleteFile = useCallback(async (
    bucket: string,
    path: string
  ): Promise<{ success: boolean; error: string | null }> => {
    return governedDelete({
      bucket,
      path,
      userId: user?.id,
      userRole: profile?.role || undefined,
      userEmail: user?.email || undefined,
      sessionId,
      deviceFingerprint,
    });
  }, [user, profile, sessionId, deviceFingerprint]);
  
  const canAccessBucketCheck = useCallback((bucket: string): boolean => {
    return canAccessBucket(bucket, profile?.role || null);
  }, [profile]);
  
  return {
    getSignedUrl,
    upload,
    deleteFile,
    canAccessBucket: canAccessBucketCheck,
    isSensitiveBucket,
    getTTLForBucket,
    SIGNED_URL_TTL,
  };
}

export default useStorageRouter;
