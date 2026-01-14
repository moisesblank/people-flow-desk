// ============================================
// 🔥🌌 USE SECURE STORAGE HOOK — FORTALEZA OMEGA 🌌🔥
// ANO 2300 — PROTEÇÃO NÍVEL NASA
// React Hook para operações seguras de storage
// ============================================

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  BUCKETS,
  BUCKET_DEFINITIONS,
  SENSITIVE_BUCKETS,
  type BucketKey,
  type FileUploadResult,
  type SecureDownloadResult,
  getSecureSignedUrl,
  secureUpload,
  secureDelete,
  secureList,
  canAccessBucket,
  isSensitiveBucket,
  requiresWatermark,
  getTTLForBucket,
  isValidMimeType,
  isValidFileSize,
  getBucketDefinition,
  isOwner,
  OWNER_EMAIL,
} from '@/lib/storage/storage';

// ============================================
// TIPOS
// ============================================

interface UseSecureStorageOptions {
  /** Bucket padrão para operações */
  defaultBucket?: string;
  /** Mostrar toasts de erro */
  showErrors?: boolean;
  /** Mostrar toasts de sucesso */
  showSuccess?: boolean;
  /** Cache local de URLs assinadas */
  enableCache?: boolean;
  /** TTL do cache em ms (padrão: 20s para permitir renovação) */
  cacheTTL?: number;
}

interface CachedUrl {
  url: string;
  expiresAt: number;
  bucket: string;
  path: string;
}

interface UploadProgress {
  bucket: string;
  path: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useSecureStorage(options: UseSecureStorageOptions = {}) {
  const {
    defaultBucket,
    showErrors = true,
    showSuccess = false,
    enableCache = true,
    cacheTTL = 20000, // 20 segundos
  } = options;

  const { user, role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  
  // Cache de URLs assinadas
  const urlCache = useMemo(() => new Map<string, CachedUrl>(), []);

  // ============================================
  // CONTEXTO DO USUÁRIO
  // ============================================

  const userContext = useMemo(() => ({
    userId: user?.id,
    userRole: role || undefined,
    userEmail: user?.email || undefined,
    sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('session_id') || undefined : undefined,
    deviceFingerprint: typeof window !== 'undefined' ? localStorage.getItem('device_fingerprint') || undefined : undefined,
  }), [user, role]);

  // ============================================
  // FUNÇÕES DE CACHE
  // ============================================

  const getCacheKey = useCallback((bucket: string, path: string) => {
    return `${bucket}:${path}`;
  }, []);

  const getCachedUrl = useCallback((bucket: string, path: string): string | null => {
    if (!enableCache) return null;
    
    const key = getCacheKey(bucket, path);
    const cached = urlCache.get(key);
    
    if (!cached) return null;
    
    // Verificar se ainda é válido (com margem de 10s para renovação)
    if (cached.expiresAt - 10000 > Date.now()) {
      return cached.url;
    }
    
    // Expirado, remover do cache
    urlCache.delete(key);
    return null;
  }, [enableCache, getCacheKey, urlCache]);

  const setCachedUrl = useCallback((
    bucket: string, 
    path: string, 
    url: string, 
    expiresAt: Date
  ) => {
    if (!enableCache) return;
    
    const key = getCacheKey(bucket, path);
    urlCache.set(key, {
      url,
      expiresAt: expiresAt.getTime(),
      bucket,
      path,
    });
    
    // Limpar cache após TTL
    setTimeout(() => {
      urlCache.delete(key);
    }, cacheTTL);
  }, [enableCache, getCacheKey, urlCache, cacheTTL]);

  const clearCache = useCallback(() => {
    urlCache.clear();
  }, [urlCache]);

  // ============================================
  // OPERAÇÕES DE STORAGE
  // ============================================

  /**
   * Obtém URL assinada com cache
   */
  const getSignedUrl = useCallback(async (
    path: string,
    bucket?: string
  ): Promise<SecureDownloadResult> => {
    const targetBucket = bucket || defaultBucket;
    
    if (!targetBucket) {
      return { success: false, error: 'Bucket não especificado' };
    }
    
    // Verificar cache
    const cachedUrl = getCachedUrl(targetBucket, path);
    if (cachedUrl) {
      return {
        success: true,
        signedUrl: cachedUrl,
        expiresAt: new Date(Date.now() + getTTLForBucket(targetBucket) * 1000),
        expiresIn: getTTLForBucket(targetBucket),
      };
    }
    
    setIsLoading(true);
    
    try {
      const result = await getSecureSignedUrl(targetBucket, path, userContext);
      
      if (result.success && result.signedUrl && result.expiresAt) {
        setCachedUrl(targetBucket, path, result.signedUrl, result.expiresAt);
      } else if (!result.success && showErrors) {
        toast.error('Erro ao obter arquivo', {
          description: result.error,
        });
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [defaultBucket, getCachedUrl, setCachedUrl, userContext, showErrors]);

  /**
   * Upload de arquivo
   */
  const upload = useCallback(async (
    file: File,
    options: {
      bucket?: string;
      customPath?: string;
      pathReplacements?: Record<string, string>;
    } = {}
  ): Promise<FileUploadResult> => {
    const targetBucket = options.bucket || defaultBucket;
    
    if (!targetBucket) {
      return { success: false, error: 'Bucket não especificado' };
    }
    
    // Adicionar ao progresso
    const progressId = `${targetBucket}:${file.name}:${Date.now()}`;
    setUploadProgress(prev => [...prev, {
      bucket: targetBucket,
      path: file.name,
      progress: 0,
      status: 'uploading',
    }]);
    
    setIsLoading(true);
    
    try {
      const result = await secureUpload(targetBucket, file, {
        ...userContext,
        customPath: options.customPath,
        pathReplacements: options.pathReplacements,
      });
      
      // Atualizar progresso
      setUploadProgress(prev => prev.map(p => 
        p.bucket === targetBucket && p.path === file.name
          ? { ...p, progress: 100, status: result.success ? 'success' : 'error', error: result.error }
          : p
      ));
      
      if (result.success && showSuccess) {
        toast.success('Arquivo enviado', {
          description: `${file.name} foi enviado com sucesso`,
        });
      } else if (!result.success && showErrors) {
        toast.error('Erro no upload', {
          description: result.error,
        });
      }
      
      // Limpar progresso após 3s
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(p => 
          !(p.bucket === targetBucket && p.path === file.name)
        ));
      }, 3000);
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [defaultBucket, userContext, showSuccess, showErrors]);

  /**
   * Delete de arquivo
   */
  const deleteFile = useCallback(async (
    path: string,
    bucket?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const targetBucket = bucket || defaultBucket;
    
    if (!targetBucket) {
      return { success: false, error: 'Bucket não especificado' };
    }
    
    setIsLoading(true);
    
    try {
      const result = await secureDelete(targetBucket, path, userContext);
      
      if (result.success) {
        // Limpar cache
        urlCache.delete(getCacheKey(targetBucket, path));
        
        if (showSuccess) {
          toast.success('Arquivo removido', {
            description: 'O arquivo foi removido com sucesso',
          });
        }
      } else if (showErrors) {
        toast.error('Erro ao remover', {
          description: result.error,
        });
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [defaultBucket, userContext, showSuccess, showErrors, urlCache, getCacheKey]);

  /**
   * Listar arquivos
   */
  const listFiles = useCallback(async (
    path: string,
    options: { bucket?: string; limit?: number; offset?: number } = {}
  ) => {
    const targetBucket = options.bucket || defaultBucket;
    
    if (!targetBucket) {
      return { success: false, error: 'Bucket não especificado' };
    }
    
    setIsLoading(true);
    
    try {
      const result = await secureList(targetBucket, path, {
        ...userContext,
        limit: options.limit,
        offset: options.offset,
      });
      
      if (!result.success && showErrors) {
        toast.error('Erro ao listar arquivos', {
          description: result.error,
        });
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [defaultBucket, userContext, showErrors]);

  // ============================================
  // FUNÇÕES DE VALIDAÇÃO
  // ============================================

  const checkAccess = useCallback((bucket: string): boolean => {
    return canAccessBucket(bucket, role || null, user?.email);
  }, [role, user?.email]);

  const validateFile = useCallback((bucket: string, file: File): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!isValidMimeType(bucket, file.type)) {
      errors.push(`Tipo de arquivo não permitido: ${file.type}`);
    }
    
    if (!isValidFileSize(bucket, file.size)) {
      const def = getBucketDefinition(bucket);
      const limitMB = def ? (def.maxFileSize / 1024 / 1024).toFixed(0) : '?';
      errors.push(`Arquivo excede limite de ${limitMB}MB`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }, []);

  // ============================================
  // RETORNO DO HOOK
  // ============================================

  return {
    // Estado
    isLoading,
    uploadProgress,
    
    // Operações
    getSignedUrl,
    upload,
    deleteFile,
    listFiles,
    
    // Cache
    clearCache,
    
    // Validação
    checkAccess,
    validateFile,
    
    // Utilitários
    userContext,
    // P1-2 FIX: Role-based check primário
    isOwner: userContext?.userRole === 'owner',
    
    // Constantes
    BUCKETS,
    BUCKET_DEFINITIONS,
    SENSITIVE_BUCKETS,
  };
}

// ============================================
// HOOK ESPECIALIZADO PARA LIVRO WEB
// ============================================

export function useBookStorage() {
  const storage = useSecureStorage({
    defaultBucket: 'ena-assets-transmuted',
    showErrors: true,
    showSuccess: false,
    enableCache: true,
    cacheTTL: 25000, // 25s para páginas de livro
  });
  
  /**
   * Obtém URL da página do livro com prefetch
   */
  const getPageUrl = useCallback(async (
    bookId: string,
    pageNumber: number
  ): Promise<string | null> => {
    const path = `transmuted/${bookId}/pages/${pageNumber}.webp`;
    const result = await storage.getSignedUrl(path);
    return result.success ? result.signedUrl || null : null;
  }, [storage]);
  
  /**
   * Prefetch das próximas páginas
   */
  const prefetchPages = useCallback(async (
    bookId: string,
    currentPage: number,
    count: number = 2
  ): Promise<void> => {
    const promises = [];
    
    for (let i = 1; i <= count; i++) {
      const nextPage = currentPage + i;
      const path = `transmuted/${bookId}/pages/${nextPage}.webp`;
      promises.push(storage.getSignedUrl(path));
    }
    
    await Promise.allSettled(promises);
  }, [storage]);
  
  return {
    ...storage,
    getPageUrl,
    prefetchPages,
  };
}

// ============================================
// HOOK ESPECIALIZADO PARA UPLOADS MÚLTIPLOS
// ============================================

export function useMultiUpload(bucket: string) {
  const storage = useSecureStorage({
    defaultBucket: bucket,
    showErrors: true,
    showSuccess: true,
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<FileUploadResult[]>([]);
  
  const addFiles = useCallback((newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  }, []);
  
  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const clearFiles = useCallback(() => {
    setFiles([]);
    setResults([]);
  }, []);
  
  const uploadAll = useCallback(async (
    pathReplacements?: Record<string, string>
  ): Promise<FileUploadResult[]> => {
    const uploadResults: FileUploadResult[] = [];
    
    for (const file of files) {
      const result = await storage.upload(file, { pathReplacements });
      uploadResults.push(result);
    }
    
    setResults(uploadResults);
    return uploadResults;
  }, [files, storage]);
  
  return {
    files,
    results,
    addFiles,
    removeFile,
    clearFiles,
    uploadAll,
    isLoading: storage.isLoading,
    progress: storage.uploadProgress,
    validateFile: (file: File) => storage.validateFile(bucket, file),
  };
}

// ============================================
// EXPORTS
// ============================================

export default useSecureStorage;
