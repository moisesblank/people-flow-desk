// ============================================
// 🔥🌌 STORAGE.TS — FORTALEZA DE ARMAZENAMENTO OMEGA 🌌🔥
// ANO 2300 — PROTEÇÃO NÍVEL NASA
// ZERO URLs PERSISTIDAS — ZERO VAZAMENTOS
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs (MONO-DOMÍNIO v2.0 - 27/12/2025):
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: pro.moisesmedeiros.com.br/gestaofc (STAFF)
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// ============================================

// ============================================
// CONSTANTES DE SEGURANÇA
// ============================================
export const OWNER_EMAIL = "moisesblank@gmail.com";
export const SIGNED_URL_TTL_SECONDS = 120; // URLs expiram em 2 minutos
export const MAX_FILE_SIZE_DEFAULT = 100 * 1024 * 1024; // 100MB

// ============================================
// TIPOS
// ============================================
export type BucketKey = keyof typeof BUCKETS;

export type BucketAccessLevel = "public" | "private" | "protected" | "premium";

export interface BucketDefinition {
  name: string;
  accessLevel: BucketAccessLevel;
  public: boolean;
  maxFileSize: number;
  allowedMimeTypes: string[];
  pathPattern: string;
  metadataTable?: string;
  requiresAuth: boolean;
  allowedRoles: string[];
  isPremium: boolean;
  isProtected: boolean;
  watermarkRequired: boolean;
  auditRequired: boolean;
  encryptionRequired: boolean;
  description: string;
}

export interface FileUploadResult {
  success: boolean;
  path?: string;
  bucket?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SecureDownloadResult {
  success: boolean;
  signedUrl?: string;
  expiresAt?: Date;
  error?: string;
}

// ============================================
// BUCKETS DO SISTEMA — CATÁLOGO COMPLETO
// ============================================
export const BUCKETS = {
  // === PÚBLICOS (Qualquer um pode ver) ===
  AVATARS: "avatars",
  COURSE_THUMBNAILS: "course-thumbnails",
  LESSON_THUMBNAILS: "lesson-thumbnails",
  PUBLIC_ASSETS: "public-assets",
  SITE_IMAGES: "site-images",
  MARKETING_ASSETS: "marketing-assets",
  
  // === COMUNIDADE (Cadastro gratuito) ===
  COMMUNITY_AVATARS: "community-avatars",
  COMMUNITY_POSTS: "community-posts",
  
  // === PROTEGIDOS (Requer autenticação) ===
  DOCUMENTOS: "documentos",
  ARQUIVOS: "arquivos",
  EMPLOYEE_DOCS: "employee-docs",
  STUDENT_DOCS: "student-docs",
  CONTRACTS: "contracts",
  INVOICES: "invoices",
  RECEIPTS: "receipts",
  REPORTS: "reports",
  EXPORTS: "exports",
  IMPORTS: "imports",
  BACKUPS: "backups",
  TEMP: "temp",
  
  // === PREMIUM (role=beta/owner) — SANCTUM PROTECTION ===
  COURSE_MATERIALS: "course-materials",
  LESSON_MATERIALS: "lesson-materials",
  CERTIFICATES: "certificates",
  PREMIUM_PDFS: "premium-pdfs",
  PREMIUM_EBOOKS: "premium-ebooks",
  PREMIUM_WORKSHEETS: "premium-worksheets",
  
  // === 🌌 SANCTUM 3.0 — FORTALEZA MÁXIMA ===
  ENA_ASSETS_RAW: "ena-assets-raw",
  ENA_ASSETS_TRANSMUTED: "ena-assets-transmuted",
  ENA_ASSETS_ENCRYPTED: "ena-assets-encrypted",
  
  // === GESTÃO (Funcionários) ===
  GESTAO_DOCS: "gestao-docs",
  GESTAO_REPORTS: "gestao-reports",
  GESTAO_EXPORTS: "gestao-exports",
} as const;

// ============================================
// DEFINIÇÕES COMPLETAS DE BUCKETS
// ============================================
export const BUCKET_DEFINITIONS: Record<BucketKey, BucketDefinition> = {
  // === PROTEGIDOS (LEI VII - Privados por padrão) ===
  AVATARS: {
    name: "avatars",
    accessLevel: "protected", // LEI VII: PRIVADO
    public: false, // LEI VII: PRIVADO OBRIGATÓRIO
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    pathPattern: "{user_id}/{timestamp}-{rand}.{ext}",
    metadataTable: "profiles",
    requiresAuth: true,
    allowedRoles: ["*"],
    isPremium: false,
    isProtected: true, // LEI VII
    watermarkRequired: false,
    auditRequired: true, // LEI VII
    encryptionRequired: false,
    description: "Avatares de usuários - BUCKET PRIVADO",
  },
  COURSE_THUMBNAILS: {
    name: "course-thumbnails",
    accessLevel: "public",
    public: true,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    pathPattern: "{course_id}/{timestamp}-{rand}.{ext}",
    metadataTable: "courses",
    requiresAuth: false,
    allowedRoles: ["*"],
    isPremium: false,
    isProtected: false,
    watermarkRequired: false,
    auditRequired: false,
    encryptionRequired: false,
    description: "Thumbnails de cursos",
  },
  LESSON_THUMBNAILS: {
    name: "lesson-thumbnails",
    accessLevel: "public",
    public: true,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    pathPattern: "{lesson_id}/{timestamp}-{rand}.{ext}",
    metadataTable: "lessons",
    requiresAuth: false,
    allowedRoles: ["*"],
    isPremium: false,
    isProtected: false,
    watermarkRequired: false,
    auditRequired: false,
    encryptionRequired: false,
    description: "Thumbnails de aulas",
  },
  PUBLIC_ASSETS: {
    name: "public-assets",
    accessLevel: "public",
    public: true,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["image/*", "video/*"],
    pathPattern: "{category}/{timestamp}-{rand}.{ext}",
    requiresAuth: false,
    allowedRoles: ["*"],
    isPremium: false,
    isProtected: false,
    watermarkRequired: false,
    auditRequired: false,
    encryptionRequired: false,
    description: "Assets públicos do site",
  },
  SITE_IMAGES: {
    name: "site-images",
    accessLevel: "public",
    public: true,
    maxFileSize: 20 * 1024 * 1024,
    allowedMimeTypes: ["image/*"],
    pathPattern: "site/{section}/{timestamp}-{rand}.{ext}",
    requiresAuth: false,
    allowedRoles: ["*"],
    isPremium: false,
    isProtected: false,
    watermarkRequired: false,
    auditRequired: false,
    encryptionRequired: false,
    description: "Imagens do site",
  },
  MARKETING_ASSETS: {
    name: "marketing-assets",
    accessLevel: "public",
    public: true,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["image/*", "video/*", "application/pdf"],
    pathPattern: "marketing/{campaign}/{timestamp}-{rand}.{ext}",
    requiresAuth: false,
    allowedRoles: ["owner", "admin", "marketing"],
    isPremium: false,
    isProtected: false,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Assets de marketing",
  },
  
  // === COMUNIDADE ===
  COMMUNITY_AVATARS: {
    name: "community-avatars",
    accessLevel: "protected",
    public: false,
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    pathPattern: "community/{user_id}/{timestamp}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta", "aluno", "viewer"],
    isPremium: false,
    isProtected: false,
    watermarkRequired: false,
    auditRequired: false,
    encryptionRequired: false,
    description: "Avatares da comunidade",
  },
  COMMUNITY_POSTS: {
    name: "community-posts",
    accessLevel: "protected",
    public: false,
    maxFileSize: 20 * 1024 * 1024,
    allowedMimeTypes: ["image/*"],
    pathPattern: "posts/{user_id}/{post_id}/{timestamp}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta", "aluno", "viewer"],
    isPremium: false,
    isProtected: false,
    watermarkRequired: false,
    auditRequired: false,
    encryptionRequired: false,
    description: "Imagens de posts da comunidade",
  },
  
  // === PROTEGIDOS (Gestão) ===
  DOCUMENTOS: {
    name: "documentos",
    accessLevel: "protected",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*", "application/msword", "application/vnd.openxmlformats-officedocument.*"],
    pathPattern: "{user_id}/{category}/{timestamp}-{rand}.{ext}",
    metadataTable: "documents",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "funcionario"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Documentos gerais",
  },
  ARQUIVOS: {
    name: "arquivos",
    accessLevel: "protected",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["*/*"],
    pathPattern: "{user_id}/{folder}/{timestamp}-{rand}.{ext}",
    metadataTable: "files",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "funcionario"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Arquivos gerais",
  },
  EMPLOYEE_DOCS: {
    name: "employee-docs",
    accessLevel: "protected",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "{employee_id}/{doc_type}/{timestamp}-{rand}.{ext}",
    metadataTable: "employee_documents",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: true,
    description: "Documentos de funcionários",
  },
  STUDENT_DOCS: {
    name: "student-docs",
    accessLevel: "protected",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "{student_id}/{doc_type}/{timestamp}-{rand}.{ext}",
    metadataTable: "student_documents",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "suporte"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Documentos de alunos",
  },
  CONTRACTS: {
    name: "contracts",
    accessLevel: "protected",
    public: false,
    maxFileSize: 20 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
    pathPattern: "{entity_type}/{entity_id}/{timestamp}-{rand}.pdf",
    metadataTable: "contracts",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: true,
    description: "Contratos",
  },
  INVOICES: {
    name: "invoices",
    accessLevel: "protected",
    public: false,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
    pathPattern: "{year}/{month}/{invoice_id}.pdf",
    metadataTable: "invoices",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "contabilidade"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Notas fiscais",
  },
  RECEIPTS: {
    name: "receipts",
    accessLevel: "protected",
    public: false,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "{year}/{month}/{receipt_id}.{ext}",
    metadataTable: "receipts",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "contabilidade"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Recibos",
  },
  REPORTS: {
    name: "reports",
    accessLevel: "protected",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    pathPattern: "{report_type}/{year}/{month}/{timestamp}-{rand}.{ext}",
    metadataTable: "generated_reports",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Relatórios gerados",
  },
  EXPORTS: {
    name: "exports",
    accessLevel: "protected",
    public: false,
    maxFileSize: 200 * 1024 * 1024,
    allowedMimeTypes: ["application/zip", "text/csv", "application/json"],
    pathPattern: "{user_id}/exports/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Exportações",
  },
  IMPORTS: {
    name: "imports",
    accessLevel: "protected",
    public: false,
    maxFileSize: 200 * 1024 * 1024,
    allowedMimeTypes: ["application/zip", "text/csv", "application/json", "application/vnd.ms-excel"],
    pathPattern: "{user_id}/imports/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Importações",
  },
  BACKUPS: {
    name: "backups",
    accessLevel: "private",
    public: false,
    maxFileSize: 1024 * 1024 * 1024,
    allowedMimeTypes: ["application/zip", "application/gzip"],
    pathPattern: "{backup_type}/{year}/{month}/{day}/{timestamp}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: true,
    description: "Backups do sistema",
  },
  TEMP: {
    name: "temp",
    accessLevel: "private",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["*/*"],
    pathPattern: "{user_id}/{session_id}/{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["*"],
    isPremium: false,
    isProtected: false,
    watermarkRequired: false,
    auditRequired: false,
    encryptionRequired: false,
    description: "Arquivos temporários",
  },

  // === PREMIUM (ALUNO BETA) — SANCTUM PROTECTED ===
  COURSE_MATERIALS: {
    name: "course-materials",
    accessLevel: "premium",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/zip", "video/*", "audio/*"],
    pathPattern: "{course_id}/materials/{timestamp}-{rand}.{ext}",
    metadataTable: "course_materials",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta", "professor"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Materiais de cursos (PREMIUM)",
  },
  LESSON_MATERIALS: {
    name: "lesson-materials",
    accessLevel: "premium",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/zip", "video/*", "audio/*"],
    pathPattern: "{lesson_id}/materials/{timestamp}-{rand}.{ext}",
    metadataTable: "lesson_materials",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta", "professor"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Materiais de aulas (PREMIUM)",
  },
  CERTIFICATES: {
    name: "certificates",
    accessLevel: "premium",
    public: false,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
    pathPattern: "{user_id}/certs/{course_id}-{timestamp}.pdf",
    metadataTable: "certificates",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Certificados (PREMIUM)",
  },
  PREMIUM_PDFS: {
    name: "premium-pdfs",
    accessLevel: "premium",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
    pathPattern: "{category}/{asset_id}/original.pdf",
    metadataTable: "ena_assets",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: true,
    description: "PDFs premium (SANCTUM)",
  },
  PREMIUM_EBOOKS: {
    name: "premium-ebooks",
    accessLevel: "premium",
    public: false,
    maxFileSize: 200 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/epub+zip"],
    pathPattern: "{ebook_id}/{timestamp}.{ext}",
    metadataTable: "ebooks",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: true,
    description: "E-books premium (SANCTUM)",
  },
  PREMIUM_WORKSHEETS: {
    name: "premium-worksheets",
    accessLevel: "premium",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "{worksheet_id}/{timestamp}.{ext}",
    metadataTable: "worksheets",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Listas de exercícios premium (SANCTUM)",
  },

  // === 🌌 SANCTUM 3.0 — FORTALEZA MÁXIMA ===
  ENA_ASSETS_RAW: {
    name: "ena-assets-raw",
    accessLevel: "private",
    public: false,
    maxFileSize: 500 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/epub+zip"],
    pathPattern: "{asset_id}/original.{ext}",
    metadataTable: "ena_assets",
    requiresAuth: true,
    allowedRoles: ["owner"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: true,
    description: "Assets originais (NUNCA EXPOR)",
  },
  ENA_ASSETS_TRANSMUTED: {
    name: "ena-assets-transmuted",
    accessLevel: "premium",
    public: false,
    maxFileSize: 20 * 1024 * 1024,
    allowedMimeTypes: ["image/webp", "image/avif", "image/png"],
    pathPattern: "{asset_id}/pages/{page_index}.webp",
    metadataTable: "ena_asset_pages",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta", "funcionario"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Páginas transmutadas (SANCTUM)",
  },
  ENA_ASSETS_ENCRYPTED: {
    name: "ena-assets-encrypted",
    accessLevel: "private",
    public: false,
    maxFileSize: 500 * 1024 * 1024,
    allowedMimeTypes: ["application/octet-stream"],
    pathPattern: "{asset_id}/encrypted.bin",
    metadataTable: "ena_assets",
    requiresAuth: true,
    allowedRoles: ["owner"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: true,
    description: "Assets criptografados (MÁXIMA SEGURANÇA)",
  },

  // === GESTÃO ===
  GESTAO_DOCS: {
    name: "gestao-docs",
    accessLevel: "protected",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*", "application/msword", "application/vnd.openxmlformats-officedocument.*"],
    pathPattern: "gestao/{department}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Documentos de gestão",
  },
  GESTAO_REPORTS: {
    name: "gestao-reports",
    accessLevel: "protected",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    pathPattern: "gestao/reports/{report_type}/{timestamp}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Relatórios de gestão",
  },
  GESTAO_EXPORTS: {
    name: "gestao-exports",
    accessLevel: "protected",
    public: false,
    maxFileSize: 500 * 1024 * 1024,
    allowedMimeTypes: ["application/zip", "text/csv", "application/json"],
    pathPattern: "gestao/exports/{user_id}/{timestamp}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Exportações de gestão",
  },
};

// ============================================
// HELPERS — FUNÇÕES UTILITÁRIAS
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

  // Substituir placeholders fornecidos
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`{${key}}`, value);
  });

  // Substituir placeholders padrão
  const now = new Date();
  path = path.replace("{timestamp}", now.getTime().toString());
  path = path.replace("{year}", now.getFullYear().toString());
  path = path.replace("{month}", (now.getMonth() + 1).toString().padStart(2, "0"));
  path = path.replace("{day}", now.getDate().toString().padStart(2, "0"));
  path = path.replace("{rand}", Math.random().toString(36).substring(2, 10));

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
 * Verifica se um usuário pode acessar um bucket
 */
export function canAccessBucket(
  bucketKey: BucketKey,
  userRole: string | null,
  userEmail?: string | null
): boolean {
  const def = BUCKET_DEFINITIONS[bucketKey];

  // Owner MASTER pode tudo
  if (userRole === "owner" || userEmail?.toLowerCase() === OWNER_EMAIL) {
    return true;
  }

  // Verificar se bucket permite qualquer role
  if (def.allowedRoles.includes("*")) {
    return true;
  }

  // Verificar role específica
  if (!userRole) return false;
  return def.allowedRoles.includes(userRole);
}

/**
 * Verifica se um bucket requer proteção SANCTUM
 */
export function requiresSanctumProtection(bucketKey: BucketKey): boolean {
  const def = BUCKET_DEFINITIONS[bucketKey];
  return def.isPremium && def.isProtected;
}

/**
 * Verifica se um bucket requer watermark
 */
export function requiresWatermark(bucketKey: BucketKey): boolean {
  const def = BUCKET_DEFINITIONS[bucketKey];
  return def.watermarkRequired;
}

/**
 * Verifica se um bucket requer auditoria
 */
export function requiresAudit(bucketKey: BucketKey): boolean {
  const def = BUCKET_DEFINITIONS[bucketKey];
  return def.auditRequired;
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

/**
 * Retorna todos os buckets de um nível de acesso
 */
export function getBucketsByAccessLevel(level: BucketAccessLevel): BucketKey[] {
  return (Object.keys(BUCKET_DEFINITIONS) as BucketKey[]).filter(
    key => BUCKET_DEFINITIONS[key].accessLevel === level
  );
}

/**
 * Retorna todos os buckets premium
 */
export function getPremiumBuckets(): BucketKey[] {
  return (Object.keys(BUCKET_DEFINITIONS) as BucketKey[]).filter(
    key => BUCKET_DEFINITIONS[key].isPremium
  );
}

/**
 * Retorna todos os buckets protegidos por SANCTUM
 */
export function getSanctumProtectedBuckets(): BucketKey[] {
  return (Object.keys(BUCKET_DEFINITIONS) as BucketKey[]).filter(
    key => requiresSanctumProtection(key)
  );
}

/**
 * Retorna todos os buckets que um usuário pode acessar
 */
export function getUserBuckets(userRole: string | null, userEmail?: string | null): BucketKey[] {
  return (Object.keys(BUCKETS) as BucketKey[]).filter((key) =>
    canAccessBucket(key, userRole, userEmail)
  );
}

/**
 * Audita todos os buckets e retorna estatísticas
 */
export function auditBuckets(): {
  total: number;
  public: number;
  protected: number;
  premium: number;
  private: number;
  requiresAuth: number;
  requiresWatermark: number;
  requiresAudit: number;
  requiresEncryption: number;
} {
  const buckets = Object.values(BUCKET_DEFINITIONS);
  return {
    total: buckets.length,
    public: buckets.filter(b => b.accessLevel === "public").length,
    protected: buckets.filter(b => b.accessLevel === "protected").length,
    premium: buckets.filter(b => b.accessLevel === "premium").length,
    private: buckets.filter(b => b.accessLevel === "private").length,
    requiresAuth: buckets.filter(b => b.requiresAuth).length,
    requiresWatermark: buckets.filter(b => b.watermarkRequired).length,
    requiresAudit: buckets.filter(b => b.auditRequired).length,
    requiresEncryption: buckets.filter(b => b.encryptionRequired).length,
  };
}

// ============================================
// EXPORTS
// ============================================
export default BUCKETS;
