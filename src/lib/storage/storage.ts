// ============================================
// 🔥🌌 STORAGE.TS — FORTALEZA DE ARMAZENAMENTO OMEGA 🌌🔥
// ANO 2300 — PROTEÇÃO NÍVEL NASA
// ZERO URLs PERSISTIDAS — ZERO VAZAMENTOS
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// ============================================

import { supabase } from "@/integrations/supabase/client";

// ============================================
// CONSTANTES DE SEGURANÇA
// ============================================
export const OWNER_EMAIL = "moisesblank@gmail.com";
export const MAX_FILE_SIZE_DEFAULT = 100 * 1024 * 1024; // 100MB

// TTLs por nível de sensibilidade (em segundos)
export const SIGNED_URL_TTL = {
  /** Páginas de livro, vídeos - 30 segundos */
  ULTRA_SENSITIVE: 30,
  /** Materiais premium - 60 segundos */
  SENSITIVE: 60,
  /** Documentos protegidos - 2 minutos */
  PROTECTED: 120,
  /** Downloads gerais - 5 minutos */
  MEDIUM: 300,
  /** Assets menos sensíveis - 1 hora */
  LONG: 3600,
  /** Assets públicos - 24 horas */
  PUBLIC: 86400,
} as const;

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
  ttlLevel: keyof typeof SIGNED_URL_TTL;
}

export interface FileUploadResult {
  success: boolean;
  path?: string;
  bucket?: string;
  fullPath?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SecureDownloadResult {
  success: boolean;
  signedUrl?: string;
  expiresAt?: Date;
  expiresIn?: number;
  error?: string;
}

export interface StorageAuditLog {
  bucket: string;
  path: string;
  action: 'download' | 'view' | 'upload' | 'delete' | 'list';
  userId?: string;
  userRole?: string;
  userEmail?: string;
  sessionId?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  success: boolean;
  error?: string;
  ttl?: number;
  fileSize?: number;
  mimeType?: string;
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
  COMPROVANTES: "comprovantes",
  WHATSAPP_ATTACHMENTS: "whatsapp-attachments",
  
  // === PREMIUM (role=beta/owner) — SANCTUM PROTECTION ===
  COURSE_MATERIALS: "course-materials",
  LESSON_MATERIALS: "lesson-materials",
  AULAS: "aulas",
  MATERIAIS: "materiais",
  CERTIFICATES: "certificates",
  CERTIFICADOS: "certificados",
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
  // === PÚBLICOS ===
  AVATARS: {
    name: "avatars",
    accessLevel: "public",
    public: true,
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    pathPattern: "{user_id}/{timestamp}-{rand}.{ext}",
    metadataTable: "profiles",
    requiresAuth: true,
    allowedRoles: ["*"],
    isPremium: false,
    isProtected: false,
    watermarkRequired: false,
    auditRequired: false,
    encryptionRequired: false,
    description: "Avatares de usuários",
    ttlLevel: "PUBLIC",
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
    ttlLevel: "PUBLIC",
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
    ttlLevel: "PUBLIC",
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
    ttlLevel: "PUBLIC",
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
    ttlLevel: "PUBLIC",
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
    ttlLevel: "LONG",
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
    ttlLevel: "LONG",
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
    ttlLevel: "LONG",
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
    ttlLevel: "PROTECTED",
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
    ttlLevel: "PROTECTED",
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
    ttlLevel: "PROTECTED",
  },
  STUDENT_DOCS: {
    name: "student-docs",
    accessLevel: "protected",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "{student_id}/{doc_type}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "funcionario"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Documentos de alunos",
    ttlLevel: "PROTECTED",
  },
  CONTRACTS: {
    name: "contracts",
    accessLevel: "protected",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
    pathPattern: "contracts/{year}/{month}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: true,
    description: "Contratos",
    ttlLevel: "PROTECTED",
  },
  INVOICES: {
    name: "invoices",
    accessLevel: "protected",
    public: false,
    maxFileSize: 20 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "invoices/{year}/{month}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "contabilidade"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Notas fiscais",
    ttlLevel: "PROTECTED",
  },
  RECEIPTS: {
    name: "receipts",
    accessLevel: "protected",
    public: false,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "receipts/{year}/{month}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "contabilidade"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Recibos",
    ttlLevel: "PROTECTED",
  },
  REPORTS: {
    name: "reports",
    accessLevel: "protected",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    pathPattern: "reports/{type}/{year}/{month}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Relatórios",
    ttlLevel: "MEDIUM",
  },
  EXPORTS: {
    name: "exports",
    accessLevel: "protected",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["*/*"],
    pathPattern: "exports/{type}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Exportações",
    ttlLevel: "MEDIUM",
  },
  IMPORTS: {
    name: "imports",
    accessLevel: "protected",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["*/*"],
    pathPattern: "imports/{type}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Importações",
    ttlLevel: "MEDIUM",
  },
  BACKUPS: {
    name: "backups",
    accessLevel: "private",
    public: false,
    maxFileSize: 500 * 1024 * 1024,
    allowedMimeTypes: ["*/*"],
    pathPattern: "backups/{type}/{date}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: true,
    description: "Backups do sistema",
    ttlLevel: "SENSITIVE",
  },
  TEMP: {
    name: "temp",
    accessLevel: "protected",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["*/*"],
    pathPattern: "temp/{user_id}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "funcionario"],
    isPremium: false,
    isProtected: false,
    watermarkRequired: false,
    auditRequired: false,
    encryptionRequired: false,
    description: "Arquivos temporários",
    ttlLevel: "MEDIUM",
  },
  COMPROVANTES: {
    name: "comprovantes",
    accessLevel: "protected",
    public: false,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "comprovantes/{year}/{month}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "contabilidade"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Comprovantes de pagamento",
    ttlLevel: "PROTECTED",
  },
  WHATSAPP_ATTACHMENTS: {
    name: "whatsapp-attachments",
    accessLevel: "protected",
    public: false,
    maxFileSize: 25 * 1024 * 1024,
    allowedMimeTypes: ["image/*", "audio/*", "video/*", "application/pdf"],
    pathPattern: "whatsapp/{conversation_id}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "funcionario"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Anexos do WhatsApp",
    ttlLevel: "PROTECTED",
  },
  
  // === PREMIUM (role=beta/owner) — SANCTUM PROTECTION ===
  COURSE_MATERIALS: {
    name: "course-materials",
    accessLevel: "premium",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "video/*", "image/*"],
    pathPattern: "courses/{course_id}/materials/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Materiais de cursos premium",
    ttlLevel: "SENSITIVE",
  },
  LESSON_MATERIALS: {
    name: "lesson-materials",
    accessLevel: "premium",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "video/*", "image/*"],
    pathPattern: "lessons/{lesson_id}/materials/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Materiais de aulas premium",
    ttlLevel: "SENSITIVE",
  },
  AULAS: {
    name: "aulas",
    accessLevel: "premium",
    public: false,
    maxFileSize: 500 * 1024 * 1024,
    allowedMimeTypes: ["video/mp4", "video/webm", "application/pdf", "image/*"],
    pathPattern: "aulas/{course_id}/{lesson_id}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Videoaulas",
    ttlLevel: "SENSITIVE",
  },
  MATERIAIS: {
    name: "materiais",
    accessLevel: "premium",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "video/*", "image/*"],
    pathPattern: "materiais/{type}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Materiais didáticos",
    ttlLevel: "SENSITIVE",
  },
  CERTIFICATES: {
    name: "certificates",
    accessLevel: "premium",
    public: false,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "certificates/{user_id}/{course_id}/{timestamp}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Certificados de conclusão",
    ttlLevel: "PROTECTED",
  },
  CERTIFICADOS: {
    name: "certificados",
    accessLevel: "premium",
    public: false,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "certificados/{user_id}/{course_id}/{timestamp}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Certificados (alias)",
    ttlLevel: "PROTECTED",
  },
  PREMIUM_PDFS: {
    name: "premium-pdfs",
    accessLevel: "premium",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
    pathPattern: "premium-pdfs/{category}/{timestamp}-{rand}.pdf",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "PDFs premium",
    ttlLevel: "SENSITIVE",
  },
  PREMIUM_EBOOKS: {
    name: "premium-ebooks",
    accessLevel: "premium",
    public: false,
    maxFileSize: 200 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/epub+zip"],
    pathPattern: "premium-ebooks/{category}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "E-books premium",
    ttlLevel: "SENSITIVE",
  },
  PREMIUM_WORKSHEETS: {
    name: "premium-worksheets",
    accessLevel: "premium",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*"],
    pathPattern: "premium-worksheets/{category}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Apostilas premium",
    ttlLevel: "SENSITIVE",
  },
  
  // === 🌌 SANCTUM 3.0 — FORTALEZA MÁXIMA ===
  ENA_ASSETS_RAW: {
    name: "ena-assets-raw",
    accessLevel: "private",
    public: false,
    maxFileSize: 200 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*", "video/*"],
    pathPattern: "raw/{book_id}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: true,
    description: "PDFs originais (NUNCA expor)",
    ttlLevel: "ULTRA_SENSITIVE",
  },
  ENA_ASSETS_TRANSMUTED: {
    name: "ena-assets-transmuted",
    accessLevel: "premium",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
    pathPattern: "transmuted/{book_id}/pages/{page_number}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "beta"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: true,
    auditRequired: true,
    encryptionRequired: false,
    description: "Páginas rasterizadas",
    ttlLevel: "ULTRA_SENSITIVE",
  },
  ENA_ASSETS_ENCRYPTED: {
    name: "ena-assets-encrypted",
    accessLevel: "private",
    public: false,
    maxFileSize: 200 * 1024 * 1024,
    allowedMimeTypes: ["*/*"],
    pathPattern: "encrypted/{book_id}/{timestamp}-{rand}.enc",
    requiresAuth: true,
    allowedRoles: ["owner"],
    isPremium: true,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: true,
    description: "Conteúdo criptografado",
    ttlLevel: "ULTRA_SENSITIVE",
  },
  
  // === GESTÃO (Funcionários) ===
  GESTAO_DOCS: {
    name: "gestao-docs",
    accessLevel: "protected",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/*", "application/msword", "application/vnd.openxmlformats-officedocument.*"],
    pathPattern: "gestao/{category}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin", "funcionario"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Documentos de gestão",
    ttlLevel: "PROTECTED",
  },
  GESTAO_REPORTS: {
    name: "gestao-reports",
    accessLevel: "protected",
    public: false,
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    pathPattern: "gestao/reports/{year}/{month}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Relatórios de gestão",
    ttlLevel: "PROTECTED",
  },
  GESTAO_EXPORTS: {
    name: "gestao-exports",
    accessLevel: "protected",
    public: false,
    maxFileSize: 100 * 1024 * 1024,
    allowedMimeTypes: ["*/*"],
    pathPattern: "gestao/exports/{type}/{timestamp}-{rand}.{ext}",
    requiresAuth: true,
    allowedRoles: ["owner", "admin"],
    isPremium: false,
    isProtected: true,
    watermarkRequired: false,
    auditRequired: true,
    encryptionRequired: false,
    description: "Exportações de gestão",
    ttlLevel: "MEDIUM",
  },
};

// ============================================
// BUCKETS SENSÍVEIS (DEVEM ser privados)
// ============================================
export const SENSITIVE_BUCKETS = [
  "ena-assets-raw",
  "ena-assets-transmuted",
  "ena-assets-encrypted",
  "certificados",
  "certificates",
  "comprovantes",
  "documentos",
  "aulas",
  "materiais",
  "premium-pdfs",
  "premium-ebooks",
  "premium-worksheets",
  "course-materials",
  "lesson-materials",
  "employee-docs",
  "student-docs",
  "contracts",
  "backups",
  "whatsapp-attachments",
] as const;

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Verifica se o usuário é owner
 */
export function isOwner(email: string | null | undefined): boolean {
  return email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

/**
 * Obtém definição do bucket pelo nome
 */
export function getBucketDefinition(bucketName: string): BucketDefinition | null {
  const key = Object.keys(BUCKET_DEFINITIONS).find(
    k => BUCKET_DEFINITIONS[k as BucketKey].name === bucketName
  ) as BucketKey | undefined;
  
  return key ? BUCKET_DEFINITIONS[key] : null;
}

/**
 * Verifica se o bucket é sensível
 */
export function isSensitiveBucket(bucketName: string): boolean {
  return SENSITIVE_BUCKETS.includes(bucketName as any);
}

/**
 * Verifica se o bucket requer watermark
 */
export function requiresWatermark(bucketName: string): boolean {
  const def = getBucketDefinition(bucketName);
  return def?.watermarkRequired ?? false;
}

/**
 * Obtém o TTL apropriado para o bucket
 */
export function getTTLForBucket(bucketName: string): number {
  const def = getBucketDefinition(bucketName);
  if (def) {
    return SIGNED_URL_TTL[def.ttlLevel];
  }
  
  // Fallback baseado em sensibilidade
  if (isSensitiveBucket(bucketName)) {
    return SIGNED_URL_TTL.SENSITIVE;
  }
  
  return SIGNED_URL_TTL.MEDIUM;
}

/**
 * Verifica se o usuário pode acessar o bucket
 */
export function canAccessBucket(
  bucketName: string, 
  userRole: string | null, 
  userEmail?: string | null
): boolean {
  // Owner pode tudo
  if (isOwner(userEmail)) return true;
  
  const def = getBucketDefinition(bucketName);
  if (!def) return false;
  
  // Buckets públicos
  if (def.public) return true;
  
  // Se não requer auth e é público
  if (!def.requiresAuth && def.accessLevel === 'public') return true;
  
  // Se não tem role, não pode acessar buckets protegidos
  if (!userRole) return false;
  
  // Verificar role permitida
  if (def.allowedRoles.includes('*')) return true;
  
  return def.allowedRoles.includes(userRole);
}

/**
 * Valida MIME type para o bucket
 */
export function isValidMimeType(bucketName: string, mimeType: string): boolean {
  const def = getBucketDefinition(bucketName);
  if (!def) return false;
  
  // Aceita qualquer tipo
  if (def.allowedMimeTypes.includes('*/*')) return true;
  
  // Verifica wildcards (ex: image/*)
  for (const allowed of def.allowedMimeTypes) {
    if (allowed.endsWith('/*')) {
      const category = allowed.split('/')[0];
      if (mimeType.startsWith(category + '/')) return true;
    } else if (mimeType === allowed) {
      return true;
    }
  }
  
  return false;
}

/**
 * Valida tamanho do arquivo para o bucket
 */
export function isValidFileSize(bucketName: string, fileSize: number): boolean {
  const def = getBucketDefinition(bucketName);
  if (!def) return false;
  return fileSize <= def.maxFileSize;
}

/**
 * Gera path seguro com padrão do bucket
 */
export function generateSecurePath(
  bucketName: string,
  replacements: Record<string, string>,
  originalFilename?: string
): string {
  const def = getBucketDefinition(bucketName);
  if (!def) {
    throw new Error(`Bucket ${bucketName} não encontrado`);
  }
  
  let path = def.pathPattern;
  
  // Substituir placeholders
  path = path.replace(/{timestamp}/g, Date.now().toString());
  path = path.replace(/{rand}/g, Math.random().toString(36).substring(2, 10));
  
  for (const [key, value] of Object.entries(replacements)) {
    path = path.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  
  // Adicionar extensão se fornecido filename
  if (originalFilename) {
    const ext = originalFilename.split('.').pop()?.toLowerCase() || '';
    path = path.replace(/{ext}/g, ext);
  }
  
  return path;
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
      source: 'storage-omega',
      description: `${log.action} em ${log.bucket}/${log.path}`,
      user_id: log.userId,
      payload: {
        bucket: log.bucket,
        path: log.path,
        userRole: log.userRole,
        userEmail: log.userEmail,
        sessionId: log.sessionId,
        deviceFingerprint: log.deviceFingerprint,
        ipAddress: log.ipAddress,
        ttl: log.ttl,
        fileSize: log.fileSize,
        mimeType: log.mimeType,
        error: log.error,
      },
    });
  } catch (error) {
    console.error('[StorageOmega] Erro ao logar acesso:', error);
  }
}

// ============================================
// OPERAÇÕES PRINCIPAIS
// ============================================

/**
 * Gera Signed URL governada com validação e logging
 */
export async function getSecureSignedUrl(
  bucket: string,
  path: string,
  options: {
    userId?: string;
    userRole?: string;
    userEmail?: string;
    sessionId?: string;
    deviceFingerprint?: string;
    customTTL?: number;
  } = {}
): Promise<SecureDownloadResult> {
  const { userId, userRole, userEmail, sessionId, deviceFingerprint, customTTL } = options;
  
  // Validar permissão
  if (!canAccessBucket(bucket, userRole || null, userEmail)) {
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
        error: error.message,
      };
    }
    
    const expiresAt = new Date(Date.now() + (ttl * 1000));
    
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
      signedUrl: data.signedUrl,
      expiresAt,
      expiresIn: ttl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Upload governado com validação completa
 */
export async function secureUpload(
  bucket: string,
  file: File,
  options: {
    userId?: string;
    userRole?: string;
    userEmail?: string;
    sessionId?: string;
    deviceFingerprint?: string;
    customPath?: string;
    pathReplacements?: Record<string, string>;
  } = {}
): Promise<FileUploadResult> {
  const { 
    userId, 
    userRole, 
    userEmail, 
    sessionId, 
    deviceFingerprint,
    customPath,
    pathReplacements = {}
  } = options;
  
  // Validar permissão
  if (!canAccessBucket(bucket, userRole || null, userEmail)) {
    await logStorageAccess({
      bucket,
      path: file.name,
      action: 'upload',
      userId,
      userRole,
      userEmail,
      success: false,
      error: 'Permissão negada',
    });
    
    return {
      success: false,
      error: 'Acesso não autorizado ao bucket',
    };
  }
  
  // Validar MIME type
  if (!isValidMimeType(bucket, file.type)) {
    await logStorageAccess({
      bucket,
      path: file.name,
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
      error: `Tipo de arquivo não permitido: ${file.type}`,
    };
  }
  
  // Validar tamanho
  if (!isValidFileSize(bucket, file.size)) {
    const def = getBucketDefinition(bucket);
    const limitMB = def ? (def.maxFileSize / 1024 / 1024).toFixed(0) : '?';
    
    await logStorageAccess({
      bucket,
      path: file.name,
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
      error: `Arquivo excede limite de ${limitMB}MB`,
    };
  }
  
  // Gerar path seguro
  const path = customPath || generateSecurePath(
    bucket, 
    { user_id: userId || 'anonymous', ...pathReplacements },
    file.name
  );
  
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
      bucket,
      fullPath: data.fullPath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete governado com validação e logging
 */
export async function secureDelete(
  bucket: string,
  path: string,
  options: {
    userId?: string;
    userRole?: string;
    userEmail?: string;
    sessionId?: string;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const { userId, userRole, userEmail, sessionId } = options;
  
  // Apenas owner/admin podem deletar
  if (!isOwner(userEmail) && (!userRole || !['owner', 'admin'].includes(userRole))) {
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
      success: true,
    });
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Lista arquivos de um bucket com validação
 */
export async function secureList(
  bucket: string,
  path: string,
  options: {
    userId?: string;
    userRole?: string;
    userEmail?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  const { userId, userRole, userEmail, limit = 100, offset = 0 } = options;
  
  // Validar permissão
  if (!canAccessBucket(bucket, userRole || null, userEmail)) {
    await logStorageAccess({
      bucket,
      path,
      action: 'list',
      userId,
      userRole,
      userEmail,
      success: false,
      error: 'Permissão negada',
    });
    
    return {
      success: false,
      error: 'Acesso não autorizado ao bucket',
    };
  }
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' },
      });
    
    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    await logStorageAccess({
      bucket,
      path,
      action: 'list',
      userId,
      userRole,
      userEmail,
      success: true,
    });
    
    return {
      success: true,
      files: data,
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
// EXPORTS
// ============================================

export const STORAGE_OMEGA_VERSION = '3.0.0';

export default {
  BUCKETS,
  BUCKET_DEFINITIONS,
  SENSITIVE_BUCKETS,
  SIGNED_URL_TTL,
  OWNER_EMAIL,
  isOwner,
  getBucketDefinition,
  isSensitiveBucket,
  requiresWatermark,
  getTTLForBucket,
  canAccessBucket,
  isValidMimeType,
  isValidFileSize,
  generateSecurePath,
  logStorageAccess,
  getSecureSignedUrl,
  secureUpload,
  secureDelete,
  secureList,
};
