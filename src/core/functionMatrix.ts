// ============================================
// 🔥 FUNCTION MATRIX — MATRIZ DE FUNÇÕES DO SISTEMA
// Mapeia funções/permissões por role
// PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import type { UserRole } from "./nav/navRouteMap";

// ============================================
// TIPOS
// ============================================

export type PermissionKey = keyof typeof PERMISSIONS;

export interface PermissionDefinition {
  id: string;
  label: string;
  description: string;
  category: PermissionCategory;
}

export type PermissionCategory = 
  | "crud"
  | "admin"
  | "finance"
  | "content"
  | "user"
  | "system"
  | "view";

// ============================================
// PERMISSÕES DO SISTEMA
// ============================================

export const PERMISSIONS = {
  // === CRUD ===
  CREATE: { id: "CREATE", label: "Criar", description: "Criar itens", category: "crud" },
  READ: { id: "READ", label: "Ler", description: "Visualizar itens", category: "crud" },
  UPDATE: { id: "UPDATE", label: "Editar", description: "Editar itens", category: "crud" },
  DELETE: { id: "DELETE", label: "Excluir", description: "Excluir itens", category: "crud" },
  
  // === ADMIN ===
  MANAGE_USERS: { id: "MANAGE_USERS", label: "Gerenciar Usuários", description: "Gerenciar usuários do sistema", category: "admin" },
  MANAGE_ROLES: { id: "MANAGE_ROLES", label: "Gerenciar Roles", description: "Atribuir e revogar roles", category: "admin" },
  MANAGE_PERMISSIONS: { id: "MANAGE_PERMISSIONS", label: "Gerenciar Permissões", description: "Configurar permissões", category: "admin" },
  VIEW_AUDIT: { id: "VIEW_AUDIT", label: "Ver Auditoria", description: "Visualizar logs de auditoria", category: "admin" },
  
  // === FINANCE ===
  VIEW_FINANCE: { id: "VIEW_FINANCE", label: "Ver Finanças", description: "Visualizar dados financeiros", category: "finance" },
  MANAGE_FINANCE: { id: "MANAGE_FINANCE", label: "Gerenciar Finanças", description: "Gerenciar transações financeiras", category: "finance" },
  EXPORT_FINANCE: { id: "EXPORT_FINANCE", label: "Exportar Finanças", description: "Exportar relatórios financeiros", category: "finance" },
  
  // === CONTENT ===
  MANAGE_COURSES: { id: "MANAGE_COURSES", label: "Gerenciar Cursos", description: "Gerenciar cursos e aulas", category: "content" },
  MANAGE_LESSONS: { id: "MANAGE_LESSONS", label: "Gerenciar Aulas", description: "Gerenciar aulas", category: "content" },
  MANAGE_MATERIALS: { id: "MANAGE_MATERIALS", label: "Gerenciar Materiais", description: "Gerenciar materiais", category: "content" },
  PUBLISH_CONTENT: { id: "PUBLISH_CONTENT", label: "Publicar Conteúdo", description: "Publicar conteúdo", category: "content" },
  
  // === USER ===
  MANAGE_STUDENTS: { id: "MANAGE_STUDENTS", label: "Gerenciar Alunos", description: "Gerenciar alunos", category: "user" },
  IMPORT_STUDENTS: { id: "IMPORT_STUDENTS", label: "Importar Alunos", description: "Importar lista de alunos", category: "user" },
  EXPORT_STUDENTS: { id: "EXPORT_STUDENTS", label: "Exportar Alunos", description: "Exportar lista de alunos", category: "user" },
  
  // === SYSTEM ===
  VIEW_DIAGNOSTICS: { id: "VIEW_DIAGNOSTICS", label: "Ver Diagnósticos", description: "Ver diagnósticos do sistema", category: "system" },
  MANAGE_BACKUPS: { id: "MANAGE_BACKUPS", label: "Gerenciar Backups", description: "Criar e restaurar backups", category: "system" },
  MANAGE_CACHE: { id: "MANAGE_CACHE", label: "Gerenciar Cache", description: "Limpar e gerenciar cache", category: "system" },
  VIEW_LOGS: { id: "VIEW_LOGS", label: "Ver Logs", description: "Visualizar logs do sistema", category: "system" },
  
  // === VIEW ===
  VIEW_DASHBOARD: { id: "VIEW_DASHBOARD", label: "Ver Dashboard", description: "Visualizar dashboard", category: "view" },
  VIEW_REPORTS: { id: "VIEW_REPORTS", label: "Ver Relatórios", description: "Visualizar relatórios", category: "view" },
  VIEW_ANALYTICS: { id: "VIEW_ANALYTICS", label: "Ver Analytics", description: "Visualizar analytics", category: "view" },
} as const;

// ============================================
// MATRIZ DE PERMISSÕES POR ROLE
// ============================================

export const FUNCTION_MATRIX: Record<UserRole, PermissionKey[]> = {
  // 👑 OWNER - TUDO
  owner: Object.keys(PERMISSIONS) as PermissionKey[],
  
  // 👔 ADMIN
  admin: [
    "CREATE", "READ", "UPDATE", "DELETE",
    "MANAGE_USERS", "MANAGE_ROLES", "VIEW_AUDIT",
    "VIEW_FINANCE", "MANAGE_FINANCE", "EXPORT_FINANCE",
    "MANAGE_COURSES", "MANAGE_LESSONS", "MANAGE_MATERIALS", "PUBLISH_CONTENT",
    "MANAGE_STUDENTS", "IMPORT_STUDENTS", "EXPORT_STUDENTS",
    "VIEW_DIAGNOSTICS", "VIEW_LOGS",
    "VIEW_DASHBOARD", "VIEW_REPORTS", "VIEW_ANALYTICS",
  ],
  
  // 👔 FUNCIONÁRIO
  funcionario: [
    "CREATE", "READ", "UPDATE",
    "VIEW_DASHBOARD", "VIEW_REPORTS",
  ],
  
  // 👔 SUPORTE
  suporte: [
    "READ", "UPDATE",
    "MANAGE_STUDENTS",
    "VIEW_DASHBOARD",
  ],
  
  // 👔 COORDENAÇÃO
  coordenacao: [
    "CREATE", "READ", "UPDATE",
    "MANAGE_COURSES", "MANAGE_LESSONS", "MANAGE_MATERIALS",
    "VIEW_DASHBOARD", "VIEW_REPORTS",
  ],
  
  // 👔 MONITORIA
  monitoria: [
    "READ", "UPDATE",
    "VIEW_DASHBOARD",
  ],
  
  // 👔 MARKETING
  marketing: [
    "CREATE", "READ", "UPDATE",
    "VIEW_ANALYTICS",
    "VIEW_DASHBOARD", "VIEW_REPORTS",
  ],
  
  // 👔 CONTABILIDADE
  contabilidade: [
    "READ", "UPDATE",
    "VIEW_FINANCE", "MANAGE_FINANCE", "EXPORT_FINANCE",
    "VIEW_DASHBOARD", "VIEW_REPORTS",
  ],
  
  // 👔 PROFESSOR
  professor: [
    "CREATE", "READ", "UPDATE",
    "MANAGE_COURSES", "MANAGE_LESSONS", "MANAGE_MATERIALS",
    "VIEW_DASHBOARD",
  ],
  
  // 👔 AFILIADO
  afiliado: [
    "READ",
    "VIEW_DASHBOARD", "VIEW_REPORTS",
  ],
  
  // 👨‍🎓 BETA (Aluno Pagante)
  beta: [
    "READ",
    "VIEW_DASHBOARD",
  ],
  
  // 👨‍🎓 ALUNO
  aluno: [
    "READ",
    "VIEW_DASHBOARD",
  ],
  
  // 🌐 VIEWER
  viewer: [
    "READ",
  ],
};

// ============================================
// HELPERS
// ============================================

/**
 * Verifica se uma role tem uma permissão
 */
export function hasPermission(role: UserRole | null, permission: PermissionKey): boolean {
  if (!role) return false;
  if (role === "owner") return true;
  
  const permissions = FUNCTION_MATRIX[role];
  return permissions?.includes(permission) || false;
}

/**
 * Retorna todas as permissões de uma role
 */
export function getRolePermissions(role: UserRole | null): PermissionKey[] {
  if (!role) return [];
  return FUNCTION_MATRIX[role] || [];
}

/**
 * Verifica se uma role tem todas as permissões especificadas
 */
export function hasAllPermissions(role: UserRole | null, permissions: PermissionKey[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Verifica se uma role tem alguma das permissões especificadas
 */
export function hasAnyPermission(role: UserRole | null, permissions: PermissionKey[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Retorna roles que têm uma permissão específica
 */
export function getRolesWithPermission(permission: PermissionKey): UserRole[] {
  return (Object.entries(FUNCTION_MATRIX) as [UserRole, PermissionKey[]][])
    .filter(([_, perms]) => perms.includes(permission))
    .map(([role]) => role);
}

/**
 * Audita a matriz de funções
 */
export function auditFunctionMatrix(): {
  totalPermissions: number;
  totalRoles: number;
  coverage: Record<UserRole, number>;
  byCategory: Record<PermissionCategory, number>;
} {
  const totalPermissions = Object.keys(PERMISSIONS).length;
  const totalRoles = Object.keys(FUNCTION_MATRIX).length;
  
  const coverage: Record<string, number> = {};
  (Object.entries(FUNCTION_MATRIX) as [UserRole, PermissionKey[]][]).forEach(([role, perms]) => {
    coverage[role] = Math.round((perms.length / totalPermissions) * 100);
  });
  
  const byCategory: Record<PermissionCategory, number> = {
    crud: 0,
    admin: 0,
    finance: 0,
    content: 0,
    user: 0,
    system: 0,
    view: 0,
  };
  
  (Object.values(PERMISSIONS) as PermissionDefinition[]).forEach(perm => {
    byCategory[perm.category]++;
  });
  
  return {
    totalPermissions,
    totalRoles,
    coverage: coverage as Record<UserRole, number>,
    byCategory,
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  PERMISSIONS,
  FUNCTION_MATRIX,
  hasPermission,
  getRolePermissions,
  hasAllPermissions,
  hasAnyPermission,
  getRolesWithPermission,
  auditFunctionMatrix,
};
