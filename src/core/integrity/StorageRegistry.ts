// ============================================
// 🔥 STORAGE REGISTRY — VALIDAÇÃO DE BUCKETS
// Garante zero uploads órfãos
// ============================================

import { BUCKETS, BUCKET_DEFINITIONS, type BucketKey } from '../storage';

// ============================================
// TIPOS
// ============================================

export interface StorageValidation {
  bucketKey: BucketKey;
  bucketName: string;
  accessLevel: 'public' | 'private' | 'protected' | 'premium';
  hasDefinition: boolean;
  requiresAuth: boolean;
  allowedRoles: string[];
  maxFileSize: number;
  allowedMimeTypes: string[];
  hasMetadataTable: boolean;
  auditRequired: boolean;
}

// ============================================
// VALIDAÇÃO DE BUCKETS
// ============================================

export function validateStorageBuckets(): StorageValidation[] {
  return (Object.keys(BUCKETS) as BucketKey[]).map(key => {
    const def = BUCKET_DEFINITIONS[key];
    
    return {
      bucketKey: key,
      bucketName: BUCKETS[key],
      accessLevel: def?.accessLevel || 'private',
      hasDefinition: Boolean(def),
      requiresAuth: def?.requiresAuth ?? true,
      allowedRoles: def?.allowedRoles || [],
      maxFileSize: def?.maxFileSize || 100 * 1024 * 1024,
      allowedMimeTypes: def?.allowedMimeTypes || [],
      hasMetadataTable: Boolean(def?.metadataTable),
      auditRequired: def?.auditRequired ?? true,
    };
  });
}

// ============================================
// AUDITORIA DE STORAGE
// ============================================

export interface StorageAuditResult {
  totalBuckets: number;
  withDefinition: number;
  withoutDefinition: number;
  publicBuckets: number;
  privateBuckets: number;
  protectedBuckets: number;
  premiumBuckets: number;
  withMetadataTable: number;
  withoutMetadataTable: number;
  bucketsWithAudit: number;
  orphanBuckets: string[];
}

export function auditStorage(): StorageAuditResult {
  const bucketKeys = Object.keys(BUCKETS) as BucketKey[];
  const orphanBuckets: string[] = [];
  
  let withDefinition = 0;
  let publicBuckets = 0;
  let privateBuckets = 0;
  let protectedBuckets = 0;
  let premiumBuckets = 0;
  let withMetadataTable = 0;
  let bucketsWithAudit = 0;
  
  for (const key of bucketKeys) {
    const def = BUCKET_DEFINITIONS[key];
    
    if (def) {
      withDefinition++;
      
      if (def.accessLevel === 'public') publicBuckets++;
      else if (def.accessLevel === 'private') privateBuckets++;
      else if (def.accessLevel === 'protected') protectedBuckets++;
      else if (def.accessLevel === 'premium') premiumBuckets++;
      
      if (def.metadataTable) withMetadataTable++;
      if (def.auditRequired) bucketsWithAudit++;
    } else {
      orphanBuckets.push(key);
    }
  }
  
  return {
    totalBuckets: bucketKeys.length,
    withDefinition,
    withoutDefinition: bucketKeys.length - withDefinition,
    publicBuckets,
    privateBuckets,
    protectedBuckets,
    premiumBuckets,
    withMetadataTable,
    withoutMetadataTable: bucketKeys.length - withMetadataTable,
    bucketsWithAudit,
    orphanBuckets,
  };
}

// ============================================
// VALIDAÇÃO DE UPLOAD
// ============================================

export interface UploadValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateUpload(
  bucketKey: BucketKey,
  file: { name: string; size: number; type: string },
  userRole: string | null
): UploadValidationResult {
  const errors: string[] = [];
  const def = BUCKET_DEFINITIONS[bucketKey];
  
  if (!def) {
    errors.push(`Bucket não configurado: ${bucketKey}`);
    return { valid: false, errors };
  }
  
  // Verificar autenticação
  if (def.requiresAuth && !userRole) {
    errors.push('Autenticação necessária');
  }
  
  // Verificar role
  if (def.allowedRoles.length > 0 && userRole !== 'owner') {
    if (!userRole || !def.allowedRoles.includes(userRole)) {
      errors.push(`Role não permitida: ${userRole}`);
    }
  }
  
  // Verificar tamanho
  if (file.size > def.maxFileSize) {
    errors.push(`Arquivo muito grande: ${file.size} > ${def.maxFileSize}`);
  }
  
  // Verificar tipo MIME
  if (def.allowedMimeTypes.length > 0) {
    const allowed = def.allowedMimeTypes.some(mime => {
      if (mime.endsWith('/*')) {
        return file.type.startsWith(mime.replace('/*', ''));
      }
      return file.type === mime;
    });
    
    if (!allowed) {
      errors.push(`Tipo não permitido: ${file.type}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// HELPERS
// ============================================

export function getBucketsByAccess(access: 'public' | 'private' | 'protected' | 'premium'): BucketKey[] {
  return (Object.keys(BUCKET_DEFINITIONS) as BucketKey[]).filter(
    key => BUCKET_DEFINITIONS[key]?.accessLevel === access
  );
}

export function requiresWatermark(bucketKey: BucketKey): boolean {
  return BUCKET_DEFINITIONS[bucketKey]?.watermarkRequired ?? false;
}

export function requiresEncryption(bucketKey: BucketKey): boolean {
  return BUCKET_DEFINITIONS[bucketKey]?.encryptionRequired ?? false;
}
