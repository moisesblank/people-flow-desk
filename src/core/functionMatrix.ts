// ============================================
// 🔥 FUNCTION MATRIX — O CÉREBRO DO SISTEMA
// Single Source of Truth para todas as funções
// ============================================

import { RouteKey, ROUTES, ROUTE_DEFINITIONS } from "./routes";
import { ActionKey, ACTIONS } from "./actions";
import { BucketKey, BUCKETS } from "./storage";

// ============================================
// TIPOS
// ============================================

export type FunctionDomain = 
  | "gestao"
  | "marketing"
  | "aulas"
  | "financas"
  | "negocios"
  | "laboratorio"
  | "pessoal"
  | "admin"
  | "owner"
  | "aluno"
  | "empresas"
  | "auth"
  | "system";

export type FunctionStatus = "active" | "disabled" | "coming_soon" | "deprecated";

export type UITriggerType = 
  | "nav"
  | "button"
  | "card"
  | "link"
  | "icon"
  | "tableRow"
  | "formSubmit"
  | "upload"
  | "download"
  | "menu"
  | "submenu"
  | "context_menu"
  | "keyboard_shortcut";

export type BackendMode = 
  | "supabase-client"
  | "rpc"
  | "edge-function"
  | "third-party"
  | "hybrid";

export interface UITrigger {
  type: UITriggerType;
  label?: string;
  component?: string;
  selectorHint?: string;
  icon?: string;
  shortcut?: string;
}

export interface BackendHandler {
  name: string;
  supabase?: {
    tables?: string[];
    views?: string[];
    rpcs?: string[];
  };
  edgeFunctions?: string[];
  thirdParty?: string[];
}

export interface StorageOperation {
  bucket: BucketKey;
  operations: ("upload" | "download" | "signedUrl" | "delete")[];
  pathPattern: string;
  metadataTable?: string;
}

export interface SecuritySpec {
  authRequired: boolean;
  rolesAllowed: string[];
  rlsTables: string[];
  storagePolicies: string[];
  abuseControls: ("rate-limit" | "captcha" | "idempotency" | "csrf" | "replay-protection")[];
}

export interface ObservabilitySpec {
  auditEventNames: string[];
  metrics: string[];
  logs: ("info" | "warn" | "error")[];
}

export interface UXSpec {
  emptyStates: boolean;
  loadingStates: boolean;
  errorStates: boolean;
  offline3gStrategy: ("skeleton" | "retry" | "cache" | "defer" | "compress")[];
}

export interface TestSpec {
  unit: boolean;
  integration: boolean;
  e2e: boolean;
  smoke: boolean;
}

// ============================================
// FUNÇÃO — O ÁTOMO DO SISTEMA
// ============================================

export interface FunctionSpec {
  id: string;
  name: string;
  description?: string;
  domain: FunctionDomain;
  status: FunctionStatus;
  ui: {
    triggers: UITrigger[];
  };
  route?: {
    key: RouteKey;
    params?: string[];
  };
  action?: {
    key: ActionKey;
  };
  backend: {
    mode: BackendMode;
    handlers: BackendHandler[];
  };
  storage?: StorageOperation[];
  security: SecuritySpec;
  observability: ObservabilitySpec;
  ux: UXSpec;
  tests: TestSpec;
}

// ============================================
// MATRIZ DE FUNÇÕES (REGISTRY)
// ============================================

export const FUNCTION_MATRIX: FunctionSpec[] = [
  // ============================================
  // NAVEGAÇÃO PRINCIPAL
  // ============================================
  {
    id: "F.NAV.DASHBOARD",
    name: "Ir para Dashboard",
    domain: "gestao",
    status: "active",
    ui: {
      triggers: [
        { type: "nav", label: "Dashboard", component: "SidebarNavDnd", selectorHint: "nav-dashboard" },
      ],
    },
    route: { key: "DASHBOARD" },
    backend: {
      mode: "supabase-client",
      handlers: [{ name: "dashboardService.getStats", supabase: { views: ["dashboard_stats"] } }],
    },
    security: {
      authRequired: true,
      rolesAllowed: ["*"],
      rlsTables: ["profiles"],
      storagePolicies: [],
      abuseControls: [],
    },
    observability: {
      auditEventNames: ["page_view:dashboard"],
      metrics: ["dashboard_load_time"],
      logs: ["info"],
    },
    ux: {
      emptyStates: true,
      loadingStates: true,
      errorStates: true,
      offline3gStrategy: ["skeleton", "cache"],
    },
    tests: { unit: true, integration: true, e2e: true, smoke: true },
  },

  // ============================================
  // CURSOS
  // ============================================
  {
    id: "F.CURSOS.LIST",
    name: "Listar Cursos",
    domain: "aulas",
    status: "active",
    ui: {
      triggers: [
        { type: "nav", label: "Cursos", component: "SidebarNavDnd", selectorHint: "nav-cursos" },
      ],
    },
    route: { key: "CURSOS" },
    backend: {
      mode: "supabase-client",
      handlers: [{ 
        name: "coursesService.listCourses", 
        supabase: { tables: ["courses", "lessons"], views: ["courses_with_stats"] } 
      }],
    },
    security: {
      authRequired: true,
      rolesAllowed: ["owner", "admin", "professor"],
      rlsTables: ["courses", "lessons"],
      storagePolicies: ["course-thumbnails"],
      abuseControls: [],
    },
    observability: {
      auditEventNames: ["page_view:cursos"],
      metrics: ["courses_list_time"],
      logs: ["info"],
    },
    ux: {
      emptyStates: true,
      loadingStates: true,
      errorStates: true,
      offline3gStrategy: ["skeleton", "cache"],
    },
    tests: { unit: true, integration: true, e2e: true, smoke: true },
  },
  {
    id: "F.CURSOS.CREATE",
    name: "Criar Curso",
    domain: "aulas",
    status: "active",
    ui: {
      triggers: [
        { type: "button", label: "Novo Curso", component: "CursosPage", selectorHint: "btn-novo-curso" },
      ],
    },
    action: { key: "CURSO_CREATE" },
    backend: {
      mode: "supabase-client",
      handlers: [{ 
        name: "coursesService.createCourse", 
        supabase: { tables: ["courses"] } 
      }],
    },
    storage: [{
      bucket: "COURSE_THUMBNAILS",
      operations: ["upload"],
      pathPattern: "{course_id}/{timestamp}-{rand}.{ext}",
      metadataTable: "courses",
    }],
    security: {
      authRequired: true,
      rolesAllowed: ["owner", "admin", "professor"],
      rlsTables: ["courses"],
      storagePolicies: ["course-thumbnails"],
      abuseControls: ["rate-limit"],
    },
    observability: {
      auditEventNames: ["curso:created"],
      metrics: ["courses_created"],
      logs: ["info"],
    },
    ux: {
      emptyStates: false,
      loadingStates: true,
      errorStates: true,
      offline3gStrategy: ["defer"],
    },
    tests: { unit: true, integration: true, e2e: true, smoke: false },
  },

  // ============================================
  // ALUNOS
  // ============================================
  {
    id: "F.ALUNOS.LIST",
    name: "Listar Alunos",
    domain: "negocios",
    status: "active",
    ui: {
      triggers: [
        { type: "nav", label: "Alunos", component: "SidebarNavDnd", selectorHint: "nav-alunos" },
      ],
    },
    route: { key: "GESTAO_ALUNOS" },
    backend: {
      mode: "supabase-client",
      handlers: [{ 
        name: "studentsService.listStudents", 
        supabase: { tables: ["alunos_perfil", "profiles"], views: ["students_with_progress"] } 
      }],
    },
    security: {
      authRequired: true,
      rolesAllowed: ["owner", "admin", "suporte"],
      rlsTables: ["alunos_perfil", "profiles"],
      storagePolicies: [],
      abuseControls: [],
    },
    observability: {
      auditEventNames: ["page_view:alunos"],
      metrics: ["students_list_time"],
      logs: ["info"],
    },
    ux: {
      emptyStates: true,
      loadingStates: true,
      errorStates: true,
      offline3gStrategy: ["skeleton", "cache"],
    },
    tests: { unit: true, integration: true, e2e: true, smoke: true },
  },

  // ============================================
  // FUNCIONÁRIOS
  // ============================================
  {
    id: "F.FUNCIONARIOS.LIST",
    name: "Listar Funcionários",
    domain: "gestao",
    status: "active",
    ui: {
      triggers: [
        { type: "nav", label: "Funcionários", component: "SidebarNavDnd", selectorHint: "nav-funcionarios" },
      ],
    },
    route: { key: "FUNCIONARIOS" },
    backend: {
      mode: "supabase-client",
      handlers: [{ 
        name: "employeesService.listEmployees", 
        supabase: { tables: ["employees", "user_roles"] } 
      }],
    },
    security: {
      authRequired: true,
      rolesAllowed: ["owner", "admin"],
      rlsTables: ["employees", "user_roles"],
      storagePolicies: ["employee-docs"],
      abuseControls: [],
    },
    observability: {
      auditEventNames: ["page_view:funcionarios"],
      metrics: ["employees_list_time"],
      logs: ["info"],
    },
    ux: {
      emptyStates: true,
      loadingStates: true,
      errorStates: true,
      offline3gStrategy: ["skeleton", "cache"],
    },
    tests: { unit: true, integration: true, e2e: true, smoke: true },
  },

  // ============================================
  // FINANÇAS
  // ============================================
  {
    id: "F.FINANCAS.EMPRESA",
    name: "Finanças da Empresa",
    domain: "financas",
    status: "active",
    ui: {
      triggers: [
        { type: "nav", label: "Finanças", component: "SidebarNavDnd", selectorHint: "nav-financas-empresa" },
      ],
    },
    route: { key: "FINANCAS_EMPRESA" },
    backend: {
      mode: "supabase-client",
      handlers: [{ 
        name: "financeService.getCompanyFinances", 
        supabase: { tables: ["transacoes", "receitas_empresa", "despesas_fixas_empresa", "despesas_extras_empresa"] } 
      }],
    },
    security: {
      authRequired: true,
      rolesAllowed: ["owner", "admin", "contabilidade"],
      rlsTables: ["transacoes", "receitas_empresa", "despesas_fixas_empresa"],
      storagePolicies: ["invoices", "receipts"],
      abuseControls: [],
    },
    observability: {
      auditEventNames: ["page_view:financas_empresa"],
      metrics: ["finance_load_time"],
      logs: ["info"],
    },
    ux: {
      emptyStates: true,
      loadingStates: true,
      errorStates: true,
      offline3gStrategy: ["skeleton", "cache"],
    },
    tests: { unit: true, integration: true, e2e: true, smoke: true },
  },

  // ============================================
  // UPLOAD/DOWNLOAD (ARQUIVOS)
  // ============================================
  {
    id: "F.ARQUIVOS.UPLOAD",
    name: "Upload de Arquivo",
    domain: "system",
    status: "active",
    ui: {
      triggers: [
        { type: "upload", label: "Enviar", component: "FileUploader", selectorHint: "btn-upload" },
        { type: "button", label: "Anexar", component: "AttachmentButton", selectorHint: "btn-anexar" },
      ],
    },
    action: { key: "FILE_UPLOAD" },
    backend: {
      mode: "hybrid",
      handlers: [
        { name: "filesService.uploadFile", supabase: { tables: ["files"] } },
        { name: "storage-signed-url", edgeFunctions: ["storage-signed-url"] },
      ],
    },
    storage: [{
      bucket: "ARQUIVOS",
      operations: ["upload", "signedUrl"],
      pathPattern: "{user_id}/{folder}/{timestamp}-{rand}.{ext}",
      metadataTable: "files",
    }],
    security: {
      authRequired: true,
      rolesAllowed: ["*"],
      rlsTables: ["files"],
      storagePolicies: ["arquivos"],
      abuseControls: ["rate-limit"],
    },
    observability: {
      auditEventNames: ["file:uploaded"],
      metrics: ["files_uploaded", "upload_size_bytes"],
      logs: ["info"],
    },
    ux: {
      emptyStates: false,
      loadingStates: true,
      errorStates: true,
      offline3gStrategy: ["defer", "compress"],
    },
    tests: { unit: true, integration: true, e2e: true, smoke: false },
  },
  {
    id: "F.ARQUIVOS.DOWNLOAD",
    name: "Download de Arquivo",
    domain: "system",
    status: "active",
    ui: {
      triggers: [
        { type: "download", label: "Baixar", component: "FileDownloadButton", selectorHint: "btn-download" },
        { type: "icon", label: "Download", component: "FileRow", selectorHint: "icon-download" },
      ],
    },
    action: { key: "FILE_DOWNLOAD" },
    backend: {
      mode: "edge-function",
      handlers: [
        { name: "storage-signed-url", edgeFunctions: ["storage-signed-url"] },
      ],
    },
    security: {
      authRequired: true,
      rolesAllowed: ["*"],
      rlsTables: ["files"],
      storagePolicies: ["arquivos"],
      abuseControls: ["rate-limit"],
    },
    observability: {
      auditEventNames: ["file:downloaded"],
      metrics: ["files_downloaded", "download_size_bytes"],
      logs: ["info"],
    },
    ux: {
      emptyStates: false,
      loadingStates: true,
      errorStates: true,
      offline3gStrategy: ["retry"],
    },
    tests: { unit: true, integration: true, e2e: true, smoke: false },
  },

  // ============================================
  // LIVES
  // ============================================
  {
    id: "F.LIVES.LIST",
    name: "Listar Lives",
    domain: "aulas",
    status: "active",
    ui: {
      triggers: [
        { type: "nav", label: "Lives", component: "SidebarNavDnd", selectorHint: "nav-lives" },
      ],
    },
    route: { key: "LIVES" },
    backend: {
      mode: "supabase-client",
      handlers: [{ 
        name: "livesService.listLives", 
        supabase: { tables: ["lives", "live_chat_messages"] } 
      }],
    },
    security: {
      authRequired: true,
      rolesAllowed: ["*"],
      rlsTables: ["lives", "live_chat_messages"],
      storagePolicies: [],
      abuseControls: [],
    },
    observability: {
      auditEventNames: ["page_view:lives"],
      metrics: ["lives_list_time"],
      logs: ["info"],
    },
    ux: {
      emptyStates: true,
      loadingStates: true,
      errorStates: true,
      offline3gStrategy: ["skeleton", "cache"],
    },
    tests: { unit: true, integration: true, e2e: true, smoke: true },
  },

  // ============================================
  // OWNER - DIAGNÓSTICO
  // ============================================
  {
    id: "F.OWNER.DIAGNOSTICO",
    name: "Central de Diagnóstico",
    domain: "owner",
    status: "active",
    ui: {
      triggers: [
        { type: "nav", label: "Diagnóstico", component: "SidebarNavDnd", selectorHint: "nav-diagnostico" },
      ],
    },
    route: { key: "CENTRAL_MONITORAMENTO" },
    backend: {
      mode: "hybrid",
      handlers: [
        { name: "diagnosticoService.runAudits", supabase: { tables: ["audit_logs"], rpcs: ["run_full_audit"] } },
        { name: "healthcheck", edgeFunctions: ["healthcheck"] },
      ],
    },
    security: {
      authRequired: true,
      rolesAllowed: ["owner"],
      rlsTables: ["audit_logs"],
      storagePolicies: [],
      abuseControls: [],
    },
    observability: {
      auditEventNames: ["diagnostico:executed"],
      metrics: ["diagnostico_duration", "diagnostico_pass_rate"],
      logs: ["info", "warn", "error"],
    },
    ux: {
      emptyStates: false,
      loadingStates: true,
      errorStates: true,
      offline3gStrategy: ["retry"],
    },
    tests: { unit: true, integration: true, e2e: true, smoke: true },
  },
];

// ============================================
// HELPERS
// ============================================

/**
 * Retorna uma função pelo ID
 */
export function getFunctionById(id: string): FunctionSpec | undefined {
  return FUNCTION_MATRIX.find(f => f.id === id);
}

/**
 * Retorna todas as funções de um domínio
 */
export function getFunctionsByDomain(domain: FunctionDomain): FunctionSpec[] {
  return FUNCTION_MATRIX.filter(f => f.domain === domain);
}

/**
 * Retorna todas as funções ativas
 */
export function getActiveFunctions(): FunctionSpec[] {
  return FUNCTION_MATRIX.filter(f => f.status === "active");
}

/**
 * Retorna funções que usam uma rota específica
 */
export function getFunctionsByRoute(routeKey: RouteKey): FunctionSpec[] {
  return FUNCTION_MATRIX.filter(f => f.route?.key === routeKey);
}

/**
 * Retorna funções que usam uma ação específica
 */
export function getFunctionsByAction(actionKey: ActionKey): FunctionSpec[] {
  return FUNCTION_MATRIX.filter(f => f.action?.key === actionKey);
}

/**
 * Verifica se uma função tem todos os requisitos
 */
export function validateFunction(func: FunctionSpec): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verificar rota
  if (func.route?.key && !ROUTES[func.route.key]) {
    errors.push(`Rota não existe: ${func.route.key}`);
  }

  // Verificar ação
  if (func.action?.key && !ACTIONS[func.action.key]) {
    errors.push(`Ação não existe: ${func.action.key}`);
  }

  // Verificar storage
  if (func.storage) {
    func.storage.forEach(s => {
      if (!BUCKETS[s.bucket]) {
        errors.push(`Bucket não existe: ${s.bucket}`);
      }
    });
  }

  // Verificar triggers
  if (func.ui.triggers.length === 0) {
    errors.push("Nenhum trigger de UI definido");
  }

  // Verificar handlers
  if (func.backend.handlers.length === 0) {
    errors.push("Nenhum handler de backend definido");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Audita todas as funções
 */
export function auditAllFunctions(): {
  total: number;
  valid: number;
  invalid: number;
  errors: Array<{ id: string; errors: string[] }>;
} {
  let valid = 0;
  let invalid = 0;
  const errors: Array<{ id: string; errors: string[] }> = [];

  FUNCTION_MATRIX.forEach(func => {
    const result = validateFunction(func);
    if (result.valid) {
      valid++;
    } else {
      invalid++;
      errors.push({ id: func.id, errors: result.errors });
    }
  });

  return { total: FUNCTION_MATRIX.length, valid, invalid, errors };
}

// ============================================
// EXPORTS
// ============================================
export default FUNCTION_MATRIX;
