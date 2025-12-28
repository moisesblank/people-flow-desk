// ============================================
// 📦 CORE/BUCKETS — Storage Desacoplado
// Import direto: import { BUCKETS, validateFileForBucket } from "@/core/buckets"
// ============================================

export {
  BUCKETS,
  BUCKET_DEFINITIONS,
  getBucketDefinition,
  getUserBuckets,
  getBucket,
  validateFileForBucket,
  generateFilePath,
  requiresSanctumProtection,
  requiresWatermark,
  requiresAudit,
  getBucketsByAccessLevel,
  getPremiumBuckets,
  getSanctumProtectedBuckets,
  getFileExtension,
  sanitizeFileName,
  auditBuckets,
  canAccessBucket,
  SIGNED_URL_TTL_SECONDS,
  type BucketKey,
  type BucketDefinition,
  type BucketAccessLevel,
  type FileUploadResult,
  type SecureDownloadResult,
} from "../storage";
