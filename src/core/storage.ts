// ============================================
// 🔥 STORAGE.TS — STORAGE CENTRALIZADO (ZERO URLs PERSISTIDAS)
// Single Source of Truth para buckets e paths
// ============================================

// ============================================
// TIPOS
// ============================================
export type BucketKey = keyof typeof BUCKETS;

export interface BucketDefinition {
  name: string;
  public: boolean;
  maxFileSize: number; // em bytes
  allowedMimeTypes: string[];
  pathPattern: string;
  metadataTable?: string;
}

// ============================================
// BUCKETS DO SISTEMA
// ============================================
export const BUCKETS = {
  // === PÚBLICOS ===
  AVATARS: "avatars",
  COURSE_THUMBNAILS: "course-thumbnails",
  LESSON_THUMBNAILS: "lesson-thumbnails",
  PUBLIC_ASSETS: "public-assets",
  
  // === PRIVADOS ===
  DOCUMENTOS: "documentos",
  ARQUIVOS: "arquivos",
  EMPLOYEE_DOCS: "employee-docs",
  STUDENT_DOCS: "student-docs",
  COURSE_MATERIALS: "course-materials",
  LESSON_MATERIALS: "lesson-materials",
  CERTIFICATES: "certificates",
  CONTRACTS: "contracts",
  INVOICES: "invoices",
  RECEIPTS: "receipts",
  REPORTS: "reports",
  EXPORTS: "exports",
  IMPORTS: "imports",
  BACKUPS: "backups",
  TEMP: "temp",
} as const;

// ============================================
// DEFINIÇÕES DE BUCKETS
// ============================================
export const BUCKET_DEFINITIONS: Record<BucketKey, BucketDefinition> = {
  // Públicos
  AVATARS: {
    name: "avatars",
    public: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    pathPattern: "{user_id}/{timestamp}-{rand}.{ext}",
    metadataTable: "profiles",
  },
  COURSE_THUMBNAILS: {
    name: "course-thumbnails",
    public: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    pathPattern: "{course_id}/{timestamp}-{rand}.{ext}",
    metadataTable: "courses",
  },
  LESSON_THUMBNAILS: {
    name: "lesson-thumbnails",
    public: true,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    pathPattern: "{lesson_id}/{timestamp}-{rand}.{ext}",
    metadataTable: "lessons",
  },
  PUBLIC_ASSETS: {
    name: "public-assets",
    public: true,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["image/*", "video/*", "application/pdf"],
    pathPattern: "{category}/{timestamp}-{rand}.{ext}",
  },
  
  // Privados
  DOCUMENTOS: {
    name: "documentos",
    public: false,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ["application/pdf", "image/*", "application/msword", "application/vnd.openxmlformats-officedocument.*"],
    pathPattern: "{user_id}/{category}/{timestamp}-{rand}.{ext}",
    metadataTable: "documents",
  },
  ARQUIVOS: {
    name: "arquivos",
    public: false,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ["*/*"],
    pathPattern: "{user_id}/{folder}/{timestamp}-{rand}.{ext}",
    metadataTable: "files",
  },
  EMPLOYEE_DOCS: {
    name: "employee-docs",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "{employee_id}/{doc_type}/{timestamp}-{rand}.{ext}",
    metadataTable: "employee_documents",
  },
  STUDENT_DOCS: {
    name: "student-docs",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "{student_id}/{doc_type}/{timestamp}-{rand}.{ext}",
    metadataTable: "student_documents",
  },
  COURSE_MATERIALS: {
    name: "course-materials",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/zip", "video/*", "audio/*"],
    pathPattern: "{course_id}/materials/{timestamp}-{rand}.{ext}",
    metadataTable: "course_materials",
  },
  LESSON_MATERIALS: {
    name: "lesson-materials",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/zip", "video/*", "audio/*"],
    pathPattern: "{lesson_id}/materials/{timestamp}-{rand}.{ext}",
    metadataTable: "lesson_materials",
  },
  CERTIFICATES: {
    name: "certificates",
    public: false,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
    pathPattern: "{user_id}/certs/{course_id}-{timestamp}.pdf",
    metadataTable: "certificates",
  },
  CONTRACTS: {
    name: "contracts",
    public: false,
    maxFileSize: 20 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
    pathPattern: "{entity_type}/{entity_id}/{timestamp}-{rand}.pdf",
    metadataTable: "contracts",
  },
  INVOICES: {
    name: "invoices",
    public: false,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
    pathPattern: "{year}/{month}/{invoice_id}.pdf",
    metadataTable: "invoices",
  },
  RECEIPTS: {
    name: "receipts",
    public: false,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "{year}/{month}/{receipt_id}.{ext}",
    metadataTable: "receipts",
  },
  REPORTS: {
    name: "reports",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    pathPattern: "{report_type}/{year}/{month}/{timestamp}-{rand}.{ext}",
    metadataTable: "generated_reports",
  },
  EXPORTS: {
    name: "exports",
    public: false,
    maxFileSize: 200 * 1024 * 1024,
    allowedMimeTypes: ["application/zip", "text/csv", "application/json"],
    pathPattern: "{user_id}/exports/{timestamp}-{rand}.{ext}",
  },
  IMPORTS: {
    name: "imports",
    public: false,
    maxFileSize: 200 * 1024 * 1024,
    allowedMimeTypes: ["application/zip", "text/csv", "application/json", "application/vnd.ms-excel"],
    pathPattern: "{user_id}/imports/{timestamp}-{rand}.{ext}",
  },
  BACKUPS: {
    name: "backups",
    public: false,
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    allowedMimeTypes: ["application/zip", "application/gzip"],
    pathPattern: "{backup_type}/{year}/{month}/{day}/{timestamp}.{ext}",
  },
  TEMP: {
    name: "temp",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["*/*"],
    pathPattern: "{user_id}/{session_id}/{rand}.{ext}",
  },
};

// ============================================
// HELPERS
// ============================================

/**
 * Retorna o nome do bucket
 */
export function getBucket(key: BucketKey): string {
  return BUCKETS[key];
}

/**
 * Retorna a definição de um bucket
 */
export function getBucketDefinition(key: BucketKey): BucketDefinition {
  return BUCKET_DEFINITIONS[key];
}

/**
 * Gera o path para um arquivo
 */
export function generateFilePath(
  bucketKey: BucketKey,
  params: Record<string, string>
): string {
  const def = BUCKET_DEFINITIONS[bucketKey];
  let path = def.pathPattern;
  
  // Substituir placeholders
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`{${key}}`, value);
  });
  
  // Substituir placeholders padrão
  const now = new Date();
  path = path.replace("{timestamp}", now.getTime().toString());
  path = path.replace("{year}", now.getFullYear().toString());
  path = path.replace("{month}", (now.getMonth() + 1).toString().padStart(2, "0"));
  path = path.replace("{day}", now.getDate().toString().padStart(2, "0"));
  path = path.replace("{rand}", Math.random().toString(36).substring(2, 8));
  
  return path;
}

/**
 * Valida se um arquivo pode ser enviado para um bucket
 */
export function validateFileForBucket(
  bucketKey: BucketKey,
  file: { size: number; type: string }
): { valid: boolean; error?: string } {
  const def = BUCKET_DEFINITIONS[bucketKey];
  
  // Verificar tamanho
  if (file.size > def.maxFileSize) {
    const maxMB = Math.round(def.maxFileSize / (1024 * 1024));
    return { valid: false, error: `Arquivo muito grande. Máximo: ${maxMB}MB` };
  }
  
  // Verificar MIME type
  const allowedTypes = def.allowedMimeTypes;
  const typeAllowed = allowedTypes.some(allowed => {
    if (allowed === "*/*") return true;
    if (allowed.endsWith("/*")) {
      const prefix = allowed.replace("/*", "");
      return file.type.startsWith(prefix);
    }
    return file.type === allowed;
  });
  
  if (!typeAllowed) {
    return { valid: false, error: `Tipo de arquivo não permitido: ${file.type}` };
  }
  
  return { valid: true };
}

/**
 * Extrai a extensão de um nome de arquivo
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Gera um nome de arquivo seguro
 */
export function sanitizeFileName(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================
// EXPORTS
// ============================================
export default BUCKETS;
