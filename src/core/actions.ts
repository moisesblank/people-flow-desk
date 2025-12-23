// ============================================
// 🔥 ACTIONS.TS — AÇÕES DO SISTEMA (REGISTRO CENTRALIZADO)
// Todas as ações que podem ser executadas com permissões
// PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import type { UserRole } from "./nav/navRouteMap";

// ============================================
// TIPOS
// ============================================

export type ActionKey = keyof typeof ACTIONS;

export interface ActionDefinition {
  id: string;
  label: string;
  description: string;
  category: ActionCategory;
  requiredRoles: readonly string[];
  requiresConfirmation: boolean;
  isDestructive: boolean;
  audit: boolean;
}

export type ActionCategory = 
  | "crud"        // Create, Read, Update, Delete
  | "navigation"  // Navegação
  | "admin"       // Administração
  | "finance"     // Finanças
  | "content"     // Conteúdo
  | "user"        // Usuário
  | "system";     // Sistema

// ============================================
// AÇÕES DO SISTEMA
// ============================================

export const ACTIONS = {
  // === CRUD GERAL ===
  CREATE: {
    id: "CREATE",
    label: "Criar",
    description: "Criar novo item",
    category: "crud",
    requiredRoles: ["owner", "admin", "funcionario", "coordenacao", "professor", "marketing"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  READ: {
    id: "READ",
    label: "Visualizar",
    description: "Visualizar item",
    category: "crud",
    requiredRoles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor", "beta", "aluno", "viewer"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: false,
  },
  UPDATE: {
    id: "UPDATE",
    label: "Editar",
    description: "Editar item existente",
    category: "crud",
    requiredRoles: ["owner", "admin", "funcionario", "coordenacao", "professor", "marketing"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  DELETE: {
    id: "DELETE",
    label: "Excluir",
    description: "Excluir item permanentemente",
    category: "crud",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: true,
    isDestructive: true,
    audit: true,
  },
  
  // === CURSOS ===
  CURSO_CREATE: {
    id: "CURSO_CREATE",
    label: "Criar Curso",
    description: "Criar novo curso",
    category: "content",
    requiredRoles: ["owner", "admin", "professor"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  CURSO_UPDATE: {
    id: "CURSO_UPDATE",
    label: "Editar Curso",
    description: "Editar curso existente",
    category: "content",
    requiredRoles: ["owner", "admin", "professor"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  CURSO_DELETE: {
    id: "CURSO_DELETE",
    label: "Excluir Curso",
    description: "Excluir curso permanentemente",
    category: "content",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: true,
    isDestructive: true,
    audit: true,
  },
  CURSO_PUBLISH: {
    id: "CURSO_PUBLISH",
    label: "Publicar Curso",
    description: "Publicar curso para alunos",
    category: "content",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: true,
    isDestructive: false,
    audit: true,
  },
  
  // === AULAS ===
  AULA_CREATE: {
    id: "AULA_CREATE",
    label: "Criar Aula",
    description: "Criar nova aula",
    category: "content",
    requiredRoles: ["owner", "admin", "professor"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  AULA_UPDATE: {
    id: "AULA_UPDATE",
    label: "Editar Aula",
    description: "Editar aula existente",
    category: "content",
    requiredRoles: ["owner", "admin", "professor"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  AULA_DELETE: {
    id: "AULA_DELETE",
    label: "Excluir Aula",
    description: "Excluir aula permanentemente",
    category: "content",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: true,
    isDestructive: true,
    audit: true,
  },
  
  // === ALUNOS ===
  ALUNO_CREATE: {
    id: "ALUNO_CREATE",
    label: "Criar Aluno",
    description: "Criar novo aluno",
    category: "user",
    requiredRoles: ["owner", "admin", "suporte"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  ALUNO_UPDATE: {
    id: "ALUNO_UPDATE",
    label: "Editar Aluno",
    description: "Editar dados do aluno",
    category: "user",
    requiredRoles: ["owner", "admin", "suporte"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  ALUNO_DELETE: {
    id: "ALUNO_DELETE",
    label: "Excluir Aluno",
    description: "Excluir aluno permanentemente",
    category: "user",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: true,
    isDestructive: true,
    audit: true,
  },
  ALUNO_IMPORT: {
    id: "ALUNO_IMPORT",
    label: "Importar Alunos",
    description: "Importar lista de alunos",
    category: "user",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: true,
    isDestructive: false,
    audit: true,
  },
  ALUNO_EXPORT: {
    id: "ALUNO_EXPORT",
    label: "Exportar Alunos",
    description: "Exportar lista de alunos",
    category: "user",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  
  // === FUNCIONÁRIOS ===
  FUNCIONARIO_CREATE: {
    id: "FUNCIONARIO_CREATE",
    label: "Criar Funcionário",
    description: "Criar novo funcionário",
    category: "admin",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  FUNCIONARIO_UPDATE: {
    id: "FUNCIONARIO_UPDATE",
    label: "Editar Funcionário",
    description: "Editar dados do funcionário",
    category: "admin",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  FUNCIONARIO_DELETE: {
    id: "FUNCIONARIO_DELETE",
    label: "Excluir Funcionário",
    description: "Excluir funcionário",
    category: "admin",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: true,
    isDestructive: true,
    audit: true,
  },
  
  // === FINANÇAS ===
  TRANSACAO_CREATE: {
    id: "TRANSACAO_CREATE",
    label: "Criar Transação",
    description: "Criar nova transação financeira",
    category: "finance",
    requiredRoles: ["owner", "admin", "contabilidade"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  TRANSACAO_UPDATE: {
    id: "TRANSACAO_UPDATE",
    label: "Editar Transação",
    description: "Editar transação financeira",
    category: "finance",
    requiredRoles: ["owner", "admin", "contabilidade"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  TRANSACAO_DELETE: {
    id: "TRANSACAO_DELETE",
    label: "Excluir Transação",
    description: "Excluir transação financeira",
    category: "finance",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: true,
    isDestructive: true,
    audit: true,
  },
  RELATORIO_FINANCEIRO: {
    id: "RELATORIO_FINANCEIRO",
    label: "Gerar Relatório",
    description: "Gerar relatório financeiro",
    category: "finance",
    requiredRoles: ["owner", "admin", "contabilidade"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
  
  // === PERMISSÕES ===
  ROLE_ASSIGN: {
    id: "ROLE_ASSIGN",
    label: "Atribuir Role",
    description: "Atribuir role a usuário",
    category: "admin",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: true,
    isDestructive: false,
    audit: true,
  },
  ROLE_REVOKE: {
    id: "ROLE_REVOKE",
    label: "Revogar Role",
    description: "Revogar role de usuário",
    category: "admin",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: true,
    isDestructive: false,
    audit: true,
  },
  
  // === SISTEMA ===
  BACKUP_CREATE: {
    id: "BACKUP_CREATE",
    label: "Criar Backup",
    description: "Criar backup do sistema",
    category: "system",
    requiredRoles: ["owner"],
    requiresConfirmation: true,
    isDestructive: false,
    audit: true,
  },
  BACKUP_RESTORE: {
    id: "BACKUP_RESTORE",
    label: "Restaurar Backup",
    description: "Restaurar backup do sistema",
    category: "system",
    requiredRoles: ["owner"],
    requiresConfirmation: true,
    isDestructive: true,
    audit: true,
  },
  CACHE_CLEAR: {
    id: "CACHE_CLEAR",
    label: "Limpar Cache",
    description: "Limpar cache do sistema",
    category: "system",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: true,
    isDestructive: false,
    audit: true,
  },
  LOGS_VIEW: {
    id: "LOGS_VIEW",
    label: "Ver Logs",
    description: "Visualizar logs do sistema",
    category: "system",
    requiredRoles: ["owner", "admin"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: false,
  },
  DIAGNOSTICO_RUN: {
    id: "DIAGNOSTICO_RUN",
    label: "Executar Diagnóstico",
    description: "Executar diagnóstico do sistema",
    category: "system",
    requiredRoles: ["owner"],
    requiresConfirmation: false,
    isDestructive: false,
    audit: true,
  },
} as const;

// ============================================
// HELPERS
// ============================================

/**
 * Verifica se um usuário pode executar uma ação
 */
export function canExecuteAction(actionKey: ActionKey, role: string | null): boolean {
  const action = ACTIONS[actionKey];
  if (!action) return false;
  
  if (role === "owner") return true;
  
  return role ? action.requiredRoles.includes(role as UserRole) : false;
}

/**
 * Retorna a definição de uma ação
 */
export function getActionDefinition(actionKey: ActionKey): ActionDefinition | null {
  return ACTIONS[actionKey] || null;
}

/**
 * Retorna todas as ações que um usuário pode executar
 */
export function getUserActions(role: string | null): ActionKey[] {
  if (!role) return [];
  
  return (Object.keys(ACTIONS) as ActionKey[]).filter(key => 
    canExecuteAction(key, role)
  );
}

/**
 * Retorna ações por categoria
 */
export function getActionsByCategory(category: ActionCategory): ActionKey[] {
  return (Object.keys(ACTIONS) as ActionKey[]).filter(key => 
    ACTIONS[key].category === category
  );
}

/**
 * Audita o registro de ações
 */
export function auditActions(): {
  total: number;
  byCategory: Record<ActionCategory, number>;
  destructive: number;
  requireConfirmation: number;
} {
  const keys = Object.keys(ACTIONS) as ActionKey[];
  const byCategory: Record<ActionCategory, number> = {
    crud: 0,
    navigation: 0,
    admin: 0,
    finance: 0,
    content: 0,
    user: 0,
    system: 0,
  };
  
  let destructive = 0;
  let requireConfirmation = 0;
  
  keys.forEach(key => {
    const action = ACTIONS[key];
    byCategory[action.category]++;
    if (action.isDestructive) destructive++;
    if (action.requiresConfirmation) requireConfirmation++;
  });
  
  return {
    total: keys.length,
    byCategory,
    destructive,
    requireConfirmation,
  };
}

// ============================================
// EXPORTS
// ============================================

export default ACTIONS;
