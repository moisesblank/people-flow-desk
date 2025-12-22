// ============================================
// 🔥 ACTIONS.TS — AÇÕES CENTRALIZADAS (ZERO HANDLERS VAZIOS)
// Single Source of Truth para todas as ações do sistema
// ============================================

// ============================================
// TIPOS
// ============================================
export type ActionKey = keyof typeof ACTIONS;

export type ActionCategory = 
  | "navigation"
  | "crud"
  | "upload"
  | "download"
  | "auth"
  | "form"
  | "modal"
  | "notification"
  | "ai"
  | "payment"
  | "integration"
  | "report"
  | "export"
  | "import"
  | "share"
  | "delete"
  | "archive"
  | "restore";

export interface ActionDefinition {
  key: string;
  label: string;
  category: ActionCategory;
  requiresAuth: boolean;
  roles?: string[];
  confirmRequired?: boolean;
  trackable: boolean;
  description?: string;
}

// ============================================
// AÇÕES DO SISTEMA (CONSTANTES TIPADAS)
// ============================================
export const ACTIONS = {
  // === NAVEGAÇÃO ===
  NAV_TO_DASHBOARD: "nav:dashboard",
  NAV_TO_TAREFAS: "nav:tarefas",
  NAV_TO_CALENDARIO: "nav:calendario",
  NAV_TO_CURSOS: "nav:cursos",
  NAV_TO_ALUNOS: "nav:alunos",
  NAV_TO_PERFIL: "nav:perfil",
  NAV_TO_CONFIGURACOES: "nav:configuracoes",
  NAV_BACK: "nav:back",
  NAV_REFRESH: "nav:refresh",
  
  // === CRUD GENÉRICO ===
  CREATE: "crud:create",
  READ: "crud:read",
  UPDATE: "crud:update",
  DELETE: "crud:delete",
  DUPLICATE: "crud:duplicate",
  ARCHIVE: "crud:archive",
  RESTORE: "crud:restore",
  
  // === CURSOS ===
  CURSO_CREATE: "curso:create",
  CURSO_EDIT: "curso:edit",
  CURSO_DELETE: "curso:delete",
  CURSO_PUBLISH: "curso:publish",
  CURSO_UNPUBLISH: "curso:unpublish",
  CURSO_DUPLICATE: "curso:duplicate",
  AULA_CREATE: "aula:create",
  AULA_EDIT: "aula:edit",
  AULA_DELETE: "aula:delete",
  AULA_WATCH: "aula:watch",
  AULA_COMPLETE: "aula:complete",
  
  // === ALUNOS ===
  ALUNO_CREATE: "aluno:create",
  ALUNO_EDIT: "aluno:edit",
  ALUNO_DELETE: "aluno:delete",
  ALUNO_BLOCK: "aluno:block",
  ALUNO_UNBLOCK: "aluno:unblock",
  ALUNO_EXPORT: "aluno:export",
  ALUNO_SEND_EMAIL: "aluno:send_email",
  ALUNO_SEND_WHATSAPP: "aluno:send_whatsapp",
  
  // === FUNCIONÁRIOS ===
  FUNCIONARIO_CREATE: "funcionario:create",
  FUNCIONARIO_EDIT: "funcionario:edit",
  FUNCIONARIO_DELETE: "funcionario:delete",
  FUNCIONARIO_INVITE: "funcionario:invite",
  
  // === TAREFAS ===
  TAREFA_CREATE: "tarefa:create",
  TAREFA_EDIT: "tarefa:edit",
  TAREFA_DELETE: "tarefa:delete",
  TAREFA_COMPLETE: "tarefa:complete",
  TAREFA_REOPEN: "tarefa:reopen",
  TAREFA_ASSIGN: "tarefa:assign",
  
  // === CALENDÁRIO ===
  EVENTO_CREATE: "evento:create",
  EVENTO_EDIT: "evento:edit",
  EVENTO_DELETE: "evento:delete",
  
  // === FINANÇAS ===
  TRANSACAO_CREATE: "transacao:create",
  TRANSACAO_EDIT: "transacao:edit",
  TRANSACAO_DELETE: "transacao:delete",
  TRANSACAO_CATEGORIZE: "transacao:categorize",
  RELATORIO_GERAR: "relatorio:gerar",
  RELATORIO_EXPORTAR: "relatorio:exportar",
  
  // === UPLOAD/DOWNLOAD ===
  UPLOAD_FILE: "file:upload",
  DOWNLOAD_FILE: "file:download",
  DELETE_FILE: "file:delete",
  SHARE_FILE: "file:share",
  PREVIEW_FILE: "file:preview",
  
  // === DOCUMENTOS ===
  DOC_CREATE: "doc:create",
  DOC_EDIT: "doc:edit",
  DOC_DELETE: "doc:delete",
  DOC_SIGN: "doc:sign",
  DOC_SHARE: "doc:share",
  DOC_DOWNLOAD: "doc:download",
  
  // === LIVES ===
  LIVE_CREATE: "live:create",
  LIVE_EDIT: "live:edit",
  LIVE_DELETE: "live:delete",
  LIVE_START: "live:start",
  LIVE_END: "live:end",
  LIVE_JOIN: "live:join",
  LIVE_CHAT_SEND: "live:chat_send",
  
  // === SIMULADOS ===
  SIMULADO_CREATE: "simulado:create",
  SIMULADO_EDIT: "simulado:edit",
  SIMULADO_DELETE: "simulado:delete",
  SIMULADO_START: "simulado:start",
  SIMULADO_SUBMIT: "simulado:submit",
  SIMULADO_REVIEW: "simulado:review",
  
  // === FLASHCARDS ===
  FLASHCARD_CREATE: "flashcard:create",
  FLASHCARD_STUDY: "flashcard:study",
  FLASHCARD_RATE: "flashcard:rate",
  FLASHCARD_DELETE: "flashcard:delete",
  
  // === AUTH ===
  AUTH_LOGIN: "auth:login",
  AUTH_LOGOUT: "auth:logout",
  AUTH_REGISTER: "auth:register",
  AUTH_FORGOT_PASSWORD: "auth:forgot_password",
  AUTH_RESET_PASSWORD: "auth:reset_password",
  AUTH_VERIFY_EMAIL: "auth:verify_email",
  AUTH_ENABLE_2FA: "auth:enable_2fa",
  AUTH_DISABLE_2FA: "auth:disable_2fa",
  
  // === AI ===
  AI_CHAT: "ai:chat",
  AI_GENERATE_FLASHCARDS: "ai:generate_flashcards",
  AI_GENERATE_RESUMO: "ai:generate_resumo",
  AI_GENERATE_MAPA_MENTAL: "ai:generate_mapa_mental",
  AI_GENERATE_CRONOGRAMA: "ai:generate_cronograma",
  AI_TUTOR_ASK: "ai:tutor_ask",
  
  // === INTEGRAÇÕES ===
  INTEGRATION_CONNECT: "integration:connect",
  INTEGRATION_DISCONNECT: "integration:disconnect",
  INTEGRATION_SYNC: "integration:sync",
  HOTMART_SYNC: "hotmart:sync",
  WHATSAPP_SEND: "whatsapp:send",
  EMAIL_SEND: "email:send",
  
  // === MARKETING ===
  CAMPANHA_CREATE: "campanha:create",
  CAMPANHA_EDIT: "campanha:edit",
  CAMPANHA_DELETE: "campanha:delete",
  CAMPANHA_LAUNCH: "campanha:launch",
  LEAD_CAPTURE: "lead:capture",
  
  // === PAGAMENTOS ===
  PAYMENT_CREATE: "payment:create",
  PAYMENT_REFUND: "payment:refund",
  SUBSCRIPTION_CREATE: "subscription:create",
  SUBSCRIPTION_CANCEL: "subscription:cancel",
  
  // === MODAL ===
  MODAL_OPEN: "modal:open",
  MODAL_CLOSE: "modal:close",
  MODAL_CONFIRM: "modal:confirm",
  MODAL_CANCEL: "modal:cancel",
  
  // === NOTIFICAÇÕES ===
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_DISMISS: "notification:dismiss",
  NOTIFICATION_SETTINGS: "notification:settings",
  
  // === CONFIGURAÇÕES ===
  SETTINGS_UPDATE: "settings:update",
  SETTINGS_RESET: "settings:reset",
  THEME_TOGGLE: "theme:toggle",
  LANGUAGE_CHANGE: "language:change",
  
  // === EXPORT/IMPORT ===
  EXPORT_CSV: "export:csv",
  EXPORT_PDF: "export:pdf",
  EXPORT_EXCEL: "export:excel",
  IMPORT_DATA: "import:data",
  
  // === ADMIN/OWNER ===
  ADMIN_IMPERSONATE: "admin:impersonate",
  ADMIN_REVOKE_SESSION: "admin:revoke_session",
  ADMIN_BAN_USER: "admin:ban_user",
  ADMIN_UNBAN_USER: "admin:unban_user",
  OWNER_PURGE_CACHE: "owner:purge_cache",
  OWNER_RUN_DIAGNOSTICO: "owner:run_diagnostico",
} as const;

// ============================================
// DEFINIÇÕES DE AÇÕES (METADATA)
// ============================================
export const ACTION_DEFINITIONS: Partial<Record<ActionKey, ActionDefinition>> = {
  // Navegação
  NAV_TO_DASHBOARD: { key: "nav:dashboard", label: "Ir para Dashboard", category: "navigation", requiresAuth: true, trackable: true },
  
  // CRUD
  CREATE: { key: "crud:create", label: "Criar", category: "crud", requiresAuth: true, trackable: true },
  DELETE: { key: "crud:delete", label: "Excluir", category: "delete", requiresAuth: true, confirmRequired: true, trackable: true },
  
  // Cursos
  CURSO_CREATE: { key: "curso:create", label: "Criar Curso", category: "crud", requiresAuth: true, roles: ["owner", "admin", "professor"], trackable: true },
  CURSO_DELETE: { key: "curso:delete", label: "Excluir Curso", category: "delete", requiresAuth: true, roles: ["owner", "admin"], confirmRequired: true, trackable: true },
  
  // Auth
  AUTH_LOGOUT: { key: "auth:logout", label: "Sair", category: "auth", requiresAuth: true, trackable: true },
  
  // Upload/Download
  UPLOAD_FILE: { key: "file:upload", label: "Enviar Arquivo", category: "upload", requiresAuth: true, trackable: true },
  DOWNLOAD_FILE: { key: "file:download", label: "Baixar Arquivo", category: "download", requiresAuth: true, trackable: true },
};

// ============================================
// HELPERS
// ============================================

/**
 * Retorna a chave de uma ação
 */
export function getAction(key: ActionKey): string {
  return ACTIONS[key];
}

/**
 * Verifica se uma ação existe
 */
export function isValidAction(action: string): boolean {
  return Object.values(ACTIONS).includes(action as any);
}

/**
 * Retorna a definição de uma ação
 */
export function getActionDefinition(key: ActionKey): ActionDefinition | undefined {
  return ACTION_DEFINITIONS[key];
}

/**
 * Verifica se uma ação requer confirmação
 */
export function requiresConfirmation(key: ActionKey): boolean {
  return ACTION_DEFINITIONS[key]?.confirmRequired ?? false;
}

/**
 * Verifica se o usuário pode executar uma ação
 */
export function canExecuteAction(key: ActionKey, userRole?: string | null): boolean {
  const def = ACTION_DEFINITIONS[key];
  if (!def) return true;
  if (!def.requiresAuth) return true;
  if (!def.roles) return true;
  if (!userRole) return false;
  
  return def.roles.includes(userRole) || userRole === "owner";
}

// ============================================
// EXPORTS
// ============================================
export default ACTIONS;
