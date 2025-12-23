// ============================================
// 🔥 STORAGE.TS — BUCKETS DO SISTEMA (REGISTRO CENTRALIZADO)
// Todos os buckets de storage do Supabase
// PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import type { UserRole } from "./nav/navRouteMap";

// ============================================
// TIPOS
// ============================================

export type BucketKey = keyof typeof STORAGE_BUCKETS;

export interface BucketDefinition {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  allowedRoles: readonly string[];
  maxFileSize: number; // em MB
  allowedTypes: readonly string[];
  path: string;
}

// ============================================
// BUCKETS DO SISTEMA
// ============================================

export const STORAGE_BUCKETS = {
  // === AVATARES ===
  AVATARS: {
    id: "avatars",
    name: "Avatares",
    description: "Fotos de perfil dos usuários",
    isPublic: true,
    allowedRoles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor", "beta", "aluno", "viewer"],
    maxFileSize: 2,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    path: "avatars",
  },
  
  // === CURSOS ===
  COURSE_THUMBNAILS: {
    id: "course-thumbnails",
    name: "Thumbnails de Cursos",
    description: "Imagens de capa dos cursos",
    isPublic: true,
    allowedRoles: ["owner", "admin", "professor"],
    maxFileSize: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    path: "course-thumbnails",
  },
  COURSE_VIDEOS: {
    id: "course-videos",
    name: "Vídeos de Cursos",
    description: "Vídeos das aulas",
    isPublic: false,
    allowedRoles: ["owner", "admin", "professor"],
    maxFileSize: 500,
    allowedTypes: ["video/mp4", "video/webm"],
    path: "course-videos",
  },
  COURSE_MATERIALS: {
    id: "course-materials",
    name: "Materiais de Cursos",
    description: "PDFs, documentos e materiais complementares",
    isPublic: false,
    allowedRoles: ["owner", "admin", "professor"],
    maxFileSize: 50,
    allowedTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    path: "course-materials",
  },
  
  // === LIVROS ===
  BOOKS: {
    id: "books",
    name: "Livros",
    description: "Livros digitais (PDF, EPUB)",
    isPublic: false,
    allowedRoles: ["owner", "admin"],
    maxFileSize: 100,
    allowedTypes: ["application/pdf", "application/epub+zip"],
    path: "books",
  },
  BOOK_PAGES: {
    id: "book-pages",
    name: "Páginas de Livros",
    description: "Páginas processadas dos livros",
    isPublic: false,
    allowedRoles: ["owner", "admin"],
    maxFileSize: 10,
    allowedTypes: ["image/png", "image/jpeg", "image/webp"],
    path: "book-pages",
  },
  
  // === DOCUMENTOS ===
  DOCUMENTS: {
    id: "documents",
    name: "Documentos",
    description: "Documentos gerais do sistema",
    isPublic: false,
    allowedRoles: ["owner", "admin", "funcionario", "coordenacao"],
    maxFileSize: 20,
    allowedTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    path: "documents",
  },
  
  // === FINANCEIRO ===
  RECEIPTS: {
    id: "receipts",
    name: "Comprovantes",
    description: "Comprovantes de pagamento",
    isPublic: false,
    allowedRoles: ["owner", "admin", "contabilidade"],
    maxFileSize: 10,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    path: "receipts",
  },
  INVOICES: {
    id: "invoices",
    name: "Notas Fiscais",
    description: "Notas fiscais emitidas",
    isPublic: false,
    allowedRoles: ["owner", "admin", "contabilidade"],
    maxFileSize: 10,
    allowedTypes: ["application/pdf", "application/xml"],
    path: "invoices",
  },
  
  // === MARKETING ===
  MARKETING_ASSETS: {
    id: "marketing-assets",
    name: "Assets de Marketing",
    description: "Imagens e vídeos para marketing",
    isPublic: true,
    allowedRoles: ["owner", "admin", "marketing"],
    maxFileSize: 100,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "video/mp4", "image/gif"],
    path: "marketing-assets",
  },
  LANDING_PAGES: {
    id: "landing-pages",
    name: "Landing Pages",
    description: "Assets de landing pages",
    isPublic: true,
    allowedRoles: ["owner", "admin", "marketing"],
    maxFileSize: 20,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    path: "landing-pages",
  },
  
  // === ALUNOS ===
  STUDENT_SUBMISSIONS: {
    id: "student-submissions",
    name: "Envios de Alunos",
    description: "Arquivos enviados pelos alunos",
    isPublic: false,
    allowedRoles: ["owner", "admin", "professor", "beta", "aluno"],
    maxFileSize: 20,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    path: "student-submissions",
  },
  CERTIFICATES: {
    id: "certificates",
    name: "Certificados",
    description: "Certificados gerados",
    isPublic: false,
    allowedRoles: ["owner", "admin", "beta", "aluno"],
    maxFileSize: 5,
    allowedTypes: ["application/pdf"],
    path: "certificates",
  },
  
  // === SISTEMA ===
  BACKUPS: {
    id: "backups",
    name: "Backups",
    description: "Backups do sistema",
    isPublic: false,
    allowedRoles: ["owner"],
    maxFileSize: 1000,
    allowedTypes: ["application/zip", "application/gzip"],
    path: "backups",
  },
  LOGS: {
    id: "logs",
    name: "Logs",
    description: "Logs do sistema exportados",
    isPublic: false,
    allowedRoles: ["owner", "admin"],
    maxFileSize: 100,
    allowedTypes: ["text/plain", "application/json"],
    path: "logs",
  },
  TEMP: {
    id: "temp",
    name: "Temporário",
    description: "Arquivos temporários",
    isPublic: false,
    allowedRoles: ["owner", "admin", "funcionario"],
    maxFileSize: 50,
    allowedTypes: ["*/*"],
    path: "temp",
  },
  
  // === WHATSAPP ===
  WHATSAPP_ATTACHMENTS: {
    id: "whatsapp-attachments",
    name: "Anexos WhatsApp",
    description: "Anexos recebidos via WhatsApp",
    isPublic: false,
    allowedRoles: ["owner", "admin"],
    maxFileSize: 50,
    allowedTypes: ["*/*"],
    path: "whatsapp-attachments",
  },
  
  // === EMPRESAS ===
  COMPANY_DOCUMENTS: {
    id: "company-documents",
    name: "Documentos de Empresas",
    description: "Documentos das empresas",
    isPublic: false,
    allowedRoles: ["owner", "admin"],
    maxFileSize: 50,
    allowedTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    path: "company-documents",
  },
} as const;

// ============================================
// HELPERS
// ============================================

/**
 * Verifica se um usuário pode acessar um bucket
 */
export function canAccessBucket(bucketKey: BucketKey, role: string | null): boolean {
  const bucket = STORAGE_BUCKETS[bucketKey];
  if (!bucket) return false;
  
  if (role === "owner") return true;
  
  return role ? (bucket.allowedRoles as readonly string[]).includes(role) : false;
}

/**
 * Retorna a definição de um bucket
 */
export function getBucketDefinition(bucketKey: BucketKey): BucketDefinition | null {
  return STORAGE_BUCKETS[bucketKey] || null;
}

/**
 * Retorna todos os buckets que um usuário pode acessar
 */
export function getUserBuckets(role: string | null): BucketKey[] {
  if (!role) return [];
  
  return (Object.keys(STORAGE_BUCKETS) as BucketKey[]).filter(key => 
    canAccessBucket(key, role)
  );
}

/**
 * Verifica se um tipo de arquivo é permitido em um bucket
 */
export function isFileTypeAllowed(bucketKey: BucketKey, mimeType: string): boolean {
  const bucket = STORAGE_BUCKETS[bucketKey];
  if (!bucket) return false;
  
  const allowedTypes = bucket.allowedTypes as readonly string[];
  if (allowedTypes.includes("*/*")) return true;
  
  return allowedTypes.includes(mimeType);
}

/**
 * Verifica se o tamanho do arquivo é permitido
 */
export function isFileSizeAllowed(bucketKey: BucketKey, sizeInBytes: number): boolean {
  const bucket = STORAGE_BUCKETS[bucketKey];
  if (!bucket) return false;
  
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return sizeInMB <= bucket.maxFileSize;
}

/**
 * Audita o registro de buckets
 */
export function auditBuckets(): {
  total: number;
  public: number;
  private: number;
  totalMaxSize: number;
} {
  const keys = Object.keys(STORAGE_BUCKETS) as BucketKey[];
  
  let publicCount = 0;
  let privateCount = 0;
  let totalMaxSize = 0;
  
  keys.forEach(key => {
    const bucket = STORAGE_BUCKETS[key];
    if (bucket.isPublic) publicCount++;
    else privateCount++;
    totalMaxSize += bucket.maxFileSize;
  });
  
  return {
    total: keys.length,
    public: publicCount,
    private: privateCount,
    totalMaxSize,
  };
}

// ============================================
// EXPORTS
// ============================================

export default STORAGE_BUCKETS;
