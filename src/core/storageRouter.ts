// ============================================
// 🗄️ Ω5: STORAGE ROUTER SOBERANO
// Governança centralizada de todos os arquivos
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { STORAGE_CONTRACTS } from './uiContractsRegistry';
import { captureSignedUrlError, capturePermissionDenied } from './runtimeGuard';

// ============================================
// CONSTANTES E TIPOS
// ============================================

export const STORAGE_ROUTER_VERSION = '1.0.0';

// TTLs por tipo de conteúdo (em segundos)
export const SIGNED_URL_TTL = {
  ULTRA_SHORT: 30,      // Páginas de livro, conteúdo sensível
  SHORT: 60,            // Assets protegidos
  MEDIUM: 300,          // Downloads gerais (5 min)
  LONG: 3600,           // Assets menos sensíveis (1 hora)
  EXTENDED: 86400,      // Assets públicos (24 horas)
} as const;

// Mime types permitidos por bucket
export const BUCKET_MIME_TYPES: Record<string, string[]> = {
  'ena-assets-raw': ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'audio/mpeg'],
  'ena-assets-transmuted': ['image/webp', 'image/png', 'image/jpeg'],
  'avatars': ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  'certificados': ['application/pdf', 'image/png', 'image/jpeg'],
  'arquivos': ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'aulas': ['video/mp4', 'video/webm', 'application/pdf', 'image/png', 'image/jpeg'],
  'materiais': ['application/pdf', 'image/png', 'image/jpeg', 'video/mp4'],
  'comprovantes': ['application/pdf', 'image/png', 'image/jpeg'],
  'documentos': ['application/pdf', 'image/png', 'image/jpeg', 'application/msword'],
  'whatsapp-attachments': ['image/png', 'image/jpeg', 'image/webp', 'audio/ogg', 'audio/mpeg', 'video/mp4', 'application/pdf'],
};

// Limites de tamanho por bucket (em bytes)
export const BUCKET_SIZE_LIMITS: Record<string, number> = {
  'ena-assets-raw': 104857600,       // 100MB
  'ena-assets-transmuted': 52428800, // 50MB
  'avatars': 5242880,                // 5MB
  'certificados': 10485760,          // 10MB
  'arquivos': 52428800,              // 50MB
  'aulas': 524288000,                // 500MB
  'materiais': 104857600,            // 100MB
  'comprovantes': 10485760,          // 10MB
  'documentos': 52428800,            // 50MB
  'whatsapp-attachments': 26214400,  // 25MB
};

// Buckets sensíveis (DEVEM ser privados)
export const SENSITIVE_BUCKETS = [
  'ena-assets-raw',
  'ena-assets-transmuted',
  'certificados',
  'comprovantes',
  'documentos',
  'aulas',
  'materiais',
  'whatsapp-attachments',
] as const;

export interface StorageRouterConfig {
  bucket: string;
  path: string;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  sessionId?: string;
  deviceFingerprint?: string;
}

export interface SignedUrlResult {
  success: boolean;
  url: string | null;
  expiresAt: number | null;
  error: string | null;
}

export interface UploadResult {
  success: boolean;
  path: string | null;
  fullPath: string | null;
  error: string | null;
}

export interface StorageAuditLog {
  bucket: string;
  path: string;
  action: 'download' | 'view' | 'upload' | 'delete';
  userId?: string;
  userRole?: string;
  userEmail?: string;
  sessionId?: string;
  deviceFingerprint?: string;
  success: boolean;
  error?: string;
  ttl?: number;
  fileSize?: number;
  mimeType?: string;
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Verifica se o bucket é sensível e privado
 */
export function isSensitiveBucket(bucket: string): boolean {
  return SENSITIVE_BUCKETS.includes(bucket as any);
}

/**
 * Verifica se o usuário tem permissão para acessar o bucket
 */
export function canAccessBucket(bucket: string, userRole: string | null): boolean {
  const contract = STORAGE_CONTRACTS[bucket];
  if (!contract) return false;
  
  // Se permitir todos os roles
  if (contract.allowedRoles.includes('*')) return true;
  
  // Se não tiver role, não pode acessar buckets não públicos
  if (!userRole) return contract.public;
  
  // Owner pode tudo
  if (userRole === 'owner') return true;
  
  return contract.allowedRoles.includes(userRole);
}

/**
 * Valida MIME type para o bucket
 */
export function isValidMimeType(bucket: string, mimeType: string): boolean {
  const allowedTypes = BUCKET_MIME_TYPES[bucket];
  if (!allowedTypes) return true; // Se não definido, permitir
  return allowedTypes.includes(mimeType);
}

/**
 * Valida tamanho do arquivo para o bucket
 */
export function isValidFileSize(bucket: string, fileSize: number): boolean {
  const limit = BUCKET_SIZE_LIMITS[bucket];
  if (!limit) return true; // Se não definido, permitir
  return fileSize <= limit;
}

/**
 * Determina o TTL apropriado para o bucket/tipo de conteúdo
 */
export function getTTLForBucket(bucket: string): number {
  // Buckets ultra-sensíveis
  if (['ena-assets-raw', 'ena-assets-transmuted'].includes(bucket)) {
    return SIGNED_URL_TTL.ULTRA_SHORT;
  }
  
  // Buckets sensíveis
  if (SENSITIVE_BUCKETS.includes(bucket as any)) {
    return SIGNED_URL_TTL.SHORT;
  }
  
  // Buckets públicos
  if (bucket === 'avatars') {
    return SIGNED_URL_TTL.EXTENDED;
  }
  
  return SIGNED_URL_TTL.MEDIUM;
}

// ============================================
// LOGGING E AUDITORIA
// ============================================

/**
 * Registra evento de acesso ao storage
 */
export async function logStorageAccess(log: StorageAuditLog): Promise<void> {
  try {
    await supabase.from('security_events').insert({
      event_type: `STORAGE_${log.action.toUpperCase()}`,
      severity: log.success ? 'info' : 'warn',
      source: 'storage-router',
      description: `${log.action} em ${log.bucket}/${log.path}`,
      user_id: log.userId,
      payload: {
        bucket: log.bucket,
        path: log.path,
        userRole: log.userRole,
        userEmail: log.userEmail,
        sessionId: log.sessionId,
        deviceFingerprint: log.deviceFingerprint,
        ttl: log.ttl,
        fileSize: log.fileSize,
        mimeType: log.mimeType,
        error: log.error,
      },
    });
  } catch (error) {
    console.error('[StorageRouter] Erro ao logar acesso:', error);
  }
}

// ============================================
// OPERAÇÕES PRINCIPAIS
// ============================================

/**
 * Gera Signed URL governada com validação e logging
 */
export async function getGovernedSignedUrl(
  config: StorageRouterConfig,
  customTTL?: number
): Promise<SignedUrlResult> {
  const { bucket, path, userId, userRole, userEmail, sessionId, deviceFingerprint } = config;
  
  // Validar permissão
  if (!canAccessBucket(bucket, userRole || null)) {
    capturePermissionDenied(`${bucket}/${path}`, 'storage_access', userRole, userId);
    
    await logStorageAccess({
      bucket,
      path,
      action: 'view',
      userId,
      userRole,
      userEmail,
      sessionId,
      deviceFingerprint,
      success: false,
      error: 'Permissão negada',
    });
    
    return {
      success: false,
      url: null,
      expiresAt: null,
      error: 'Acesso não autorizado ao bucket',
    };
  }
  
  // Determinar TTL
  const ttl = customTTL || getTTLForBucket(bucket);
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, ttl);
    
    if (error) {
      captureSignedUrlError(bucket, path, error.message, userRole, userId);
      
      await logStorageAccess({
        bucket,
        path,
        action: 'view',
        userId,
        userRole,
        userEmail,
        sessionId,
        deviceFingerprint,
        success: false,
        error: error.message,
        ttl,
      });
      
      return {
        success: false,
        url: null,
        expiresAt: null,
        error: error.message,
      };
    }
    
    const expiresAt = Date.now() + (ttl * 1000);
    
    // Logar sucesso
    await logStorageAccess({
      bucket,
      path,
      action: 'view',
      userId,
      userRole,
      userEmail,
      sessionId,
      deviceFingerprint,
      success: true,
      ttl,
    });
    
    return {
      success: true,
      url: data.signedUrl,
      expiresAt,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    captureSignedUrlError(bucket, path, errorMessage, userRole, userId);
    
    return {
      success: false,
      url: null,
      expiresAt: null,
      error: errorMessage,
    };
  }
}

/**
 * Upload governado com validação completa
 */
export async function governedUpload(
  config: StorageRouterConfig & { file: File }
): Promise<UploadResult> {
  const { bucket, path, file, userId, userRole, userEmail, sessionId, deviceFingerprint } = config;
  
  // Validar permissão
  if (!canAccessBucket(bucket, userRole || null)) {
    await logStorageAccess({
      bucket,
      path,
      action: 'upload',
      userId,
      userRole,
      userEmail,
      success: false,
      error: 'Permissão negada',
    });
    
    return {
      success: false,
      path: null,
      fullPath: null,
      error: 'Acesso não autorizado ao bucket',
    };
  }
  
  // Validar MIME type
  if (!isValidMimeType(bucket, file.type)) {
    await logStorageAccess({
      bucket,
      path,
      action: 'upload',
      userId,
      userRole,
      userEmail,
      success: false,
      error: `Tipo de arquivo não permitido: ${file.type}`,
      mimeType: file.type,
    });
    
    return {
      success: false,
      path: null,
      fullPath: null,
      error: `Tipo de arquivo não permitido: ${file.type}`,
    };
  }
  
  // Validar tamanho
  if (!isValidFileSize(bucket, file.size)) {
    const limit = BUCKET_SIZE_LIMITS[bucket];
    const limitMB = limit ? (limit / 1024 / 1024).toFixed(0) : '?';
    
    await logStorageAccess({
      bucket,
      path,
      action: 'upload',
      userId,
      userRole,
      userEmail,
      success: false,
      error: `Arquivo excede limite de ${limitMB}MB`,
      fileSize: file.size,
    });
    
    return {
      success: false,
      path: null,
      fullPath: null,
      error: `Arquivo excede limite de ${limitMB}MB`,
    };
  }
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        cacheControl: '3600',
      });
    
    if (error) {
      await logStorageAccess({
        bucket,
        path,
        action: 'upload',
        userId,
        userRole,
        userEmail,
        sessionId,
        deviceFingerprint,
        success: false,
        error: error.message,
        fileSize: file.size,
        mimeType: file.type,
      });
      
      return {
        success: false,
        path: null,
        fullPath: null,
        error: error.message,
      };
    }
    
    // Logar sucesso
    await logStorageAccess({
      bucket,
      path,
      action: 'upload',
      userId,
      userRole,
      userEmail,
      sessionId,
      deviceFingerprint,
      success: true,
      fileSize: file.size,
      mimeType: file.type,
    });
    
    return {
      success: true,
      path: data.path,
      fullPath: data.fullPath,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      path: null,
      fullPath: null,
      error: errorMessage,
    };
  }
}

/**
 * Delete governado com validação e logging
 */
export async function governedDelete(
  config: StorageRouterConfig
): Promise<{ success: boolean; error: string | null }> {
  const { bucket, path, userId, userRole, userEmail, sessionId, deviceFingerprint } = config;
  
  // Apenas owner/admin podem deletar
  if (!userRole || !['owner', 'admin'].includes(userRole)) {
    await logStorageAccess({
      bucket,
      path,
      action: 'delete',
      userId,
      userRole,
      userEmail,
      success: false,
      error: 'Apenas owner/admin podem deletar arquivos',
    });
    
    return {
      success: false,
      error: 'Apenas owner/admin podem deletar arquivos',
    };
  }
  
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      await logStorageAccess({
        bucket,
        path,
        action: 'delete',
        userId,
        userRole,
        userEmail,
        sessionId,
        deviceFingerprint,
        success: false,
        error: error.message,
      });
      
      return {
        success: false,
        error: error.message,
      };
    }
    
    // Logar sucesso
    await logStorageAccess({
      bucket,
      path,
      action: 'delete',
      userId,
      userRole,
      userEmail,
      sessionId,
      deviceFingerprint,
      success: true,
    });
    
    return {
      success: true,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================
// HOOK: useStorageRouter
// ============================================

export interface UseStorageRouterOptions {
  bucket: string;
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

/**
 * Hook de configuração para o StorageRouter
 */
export function createStorageRouterContext(options: UseStorageRouterOptions) {
  const { bucket, userId, userRole, userEmail } = options;
  
  return {
    getSignedUrl: (path: string, customTTL?: number) =>
      getGovernedSignedUrl({ bucket, path, userId, userRole, userEmail }, customTTL),
    
    upload: (path: string, file: File) =>
      governedUpload({ bucket, path, file, userId, userRole, userEmail }),
    
    delete: (path: string) =>
      governedDelete({ bucket, path, userId, userRole, userEmail }),
    
    canAccess: () => canAccessBucket(bucket, userRole || null),
    
    isSensitive: () => isSensitiveBucket(bucket),
    
    getDefaultTTL: () => getTTLForBucket(bucket),
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  getGovernedSignedUrl,
  governedUpload,
  governedDelete,
  canAccessBucket,
  isSensitiveBucket,
  isValidMimeType,
  isValidFileSize,
  getTTLForBucket,
  logStorageAccess,
  createStorageRouterContext,
  SIGNED_URL_TTL,
  BUCKET_MIME_TYPES,
  BUCKET_SIZE_LIMITS,
  SENSITIVE_BUCKETS,
};
