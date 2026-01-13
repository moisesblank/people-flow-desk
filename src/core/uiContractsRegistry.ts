// ============================================
// 🛡️ Ω2: REGISTRO DE CONTRATOS UI → BACK → STORAGE → LOGS
// MATRIZ DE INTEGRIDADE TOTAL
// ANO 2300 — NENHUM CLIQUE PERDIDO
// ============================================

/**
 * Registro de contrato de um elemento clicável
 */
export interface UIContract {
  /** ID único do elemento (data-ui-id) */
  uiId: string;
  /** Localização no app (path da página) */
  location: string;
  /** Descrição do elemento */
  label: string;
  /** Tipo de ação */
  actionType: 'navigate' | 'submit' | 'fetch' | 'modal' | 'download' | 'external' | 'toggle';
  /** Destino (rota, endpoint, modal) */
  destination: string;
  /** Tabelas afetadas (se houver) */
  tables?: string[];
  /** Bucket/path de storage (se houver) */
  storagePath?: string;
  /** Role mínima necessária */
  requiredRole?: string;
  /** Se gera log de atividade */
  logsActivity: boolean;
  /** Status: active, disabled, deprecated */
  status: 'active' | 'disabled' | 'deprecated';
  /** Motivo se desabilitado */
  disabledReason?: string;
}

/**
 * Resultado de validação de contrato
 */
export interface ContractValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================
// REGISTRY DE CONTRATOS PRINCIPAIS
// ============================================

/**
 * Mapa de rotas protegidas e seus requisitos
 */
export const ROUTE_CONTRACTS: Record<string, { role: string; area: string }> = {
  // === ROTAS PÚBLICAS ===
  '/': { role: 'public', area: 'publico' },
  '/site': { role: 'public', area: 'publico' },
  '/auth': { role: 'public', area: 'publico' },
  '/termos': { role: 'public', area: 'publico' },
  '/privacidade': { role: 'public', area: 'publico' },
  '/area-gratuita': { role: 'public', area: 'publico' },
  '/comunidade': { role: 'viewer', area: 'comunidade' },
  
  // === ROTAS DE ALUNOS (BETA) ===
  '/alunos': { role: 'beta', area: 'alunos' },
  '/alunos/dashboard': { role: 'beta', area: 'alunos' },
  '/alunos/livro-web': { role: 'beta', area: 'alunos' },
  '/alunos/videoaulas': { role: 'beta', area: 'alunos' },
  '/alunos/questoes': { role: 'beta', area: 'alunos' },
  '/alunos/simulados': { role: 'beta', area: 'alunos' },
  '/alunos/ranking': { role: 'beta', area: 'alunos' },
  // DEPRECATED: '/alunos/flashcards' migrado para /alunos/materiais (mantido para redirect)
  '/alunos/flashcards': { role: 'beta', area: 'alunos' },
  '/alunos/tabela-periodica': { role: 'beta', area: 'alunos' },
  '/alunos/cronograma': { role: 'beta', area: 'alunos' },
  '/alunos/materiais': { role: 'beta', area: 'alunos' },
  '/alunos/resumos': { role: 'beta', area: 'alunos' },
  '/alunos/mapas-mentais': { role: 'beta', area: 'alunos' },
  '/alunos/redacao': { role: 'beta', area: 'alunos' },
  '/alunos/desempenho': { role: 'beta', area: 'alunos' },
  '/alunos/conquistas': { role: 'beta', area: 'alunos' },
  '/alunos/tutoria': { role: 'beta', area: 'alunos' },
  '/alunos/forum': { role: 'beta', area: 'alunos' },
  '/alunos/lives': { role: 'beta', area: 'alunos' },
  '/alunos/duvidas': { role: 'beta', area: 'alunos' },
  '/alunos/revisao': { role: 'beta', area: 'alunos' },
  '/alunos/laboratorio': { role: 'beta', area: 'alunos' },
  '/alunos/calculadora': { role: 'beta', area: 'alunos' },
  '/alunos/metas': { role: 'beta', area: 'alunos' },
  '/alunos/agenda': { role: 'beta', area: 'alunos' },
  '/alunos/certificados': { role: 'beta', area: 'alunos' },
  '/alunos/perfil': { role: 'beta', area: 'alunos' },
  
  // === ROTAS DE GESTÃO (FUNCIONÁRIOS) ===
  '/app': { role: 'employee', area: 'gestao' },
  '/dashboard': { role: 'employee', area: 'gestao' },
  '/funcionarios': { role: 'admin', area: 'gestao' },
  '/financas-pessoais': { role: 'owner', area: 'gestao' },
  '/financas-empresa': { role: 'employee', area: 'gestao' },
  '/entradas': { role: 'employee', area: 'gestao' },
  '/afiliados': { role: 'employee', area: 'gestao' },
  '/gestaofc/gestao-alunos': { role: 'employee', area: 'gestao' },
  '/relatorios': { role: 'employee', area: 'gestao' },
  '/configuracoes': { role: 'admin', area: 'gestao' },
  '/gestao-equipe': { role: 'admin', area: 'gestao' },
  '/calendario': { role: 'employee', area: 'gestao' },
  '/contabilidade': { role: 'contabilidade', area: 'gestao' },
  '/gestao-site': { role: 'admin', area: 'gestao' },
  '/area-professor': { role: 'employee', area: 'gestao' },
  '/portal-aluno': { role: 'beta', area: 'alunos' },
  '/integracoes': { role: 'admin', area: 'gestao' },
  '/permissoes': { role: 'owner', area: 'gestao' },
  '/cursos': { role: 'employee', area: 'gestao' },
  '/marketing': { role: 'marketing', area: 'gestao' },
  '/lancamento': { role: 'marketing', area: 'gestao' },
  '/metricas': { role: 'employee', area: 'gestao' },
  '/arquivos': { role: 'employee', area: 'gestao' },
  '/documentos': { role: 'employee', area: 'gestao' },
  '/planejamento-aula': { role: 'employee', area: 'gestao' },
  '/turmas-online': { role: 'employee', area: 'gestao' },
  '/turmas-presenciais': { role: 'employee', area: 'gestao' },
  '/perfil': { role: 'viewer', area: 'gestao' },
  '/dashboard-executivo': { role: 'admin', area: 'gestao' },
  '/monitoramento': { role: 'admin', area: 'gestao' },
  '/simulados': { role: 'employee', area: 'gestao' },
  '/laboratorio': { role: 'employee', area: 'gestao' },
  '/tarefas': { role: 'employee', area: 'gestao' },
  '/leads-whatsapp': { role: 'employee', area: 'gestao' },
  '/central-whatsapp': { role: 'employee', area: 'gestao' },
  '/whatsapp-live': { role: 'employee', area: 'gestao' },
  '/central-metricas': { role: 'admin', area: 'gestao' },
  '/auditoria-acessos': { role: 'admin', area: 'gestao' },
  '/central-ias': { role: 'admin', area: 'gestao' },
  '/transacoes-hotmart': { role: 'employee', area: 'gestao' },
  '/lives': { role: 'employee', area: 'gestao' },
  '/gestao-dispositivos': { role: 'admin', area: 'gestao' },
  '/gestao/livros-web': { role: 'owner', area: 'gestao' },
  
  // === ROTAS EMPRESARIAIS ===
  '/empresas/dashboard': { role: 'employee', area: 'gestao' },
  '/empresas/receitas': { role: 'employee', area: 'gestao' },
  '/empresas/arquivos': { role: 'employee', area: 'gestao' },
  '/empresas/rh': { role: 'admin', area: 'gestao' },
  
  // === ROTAS OWNER ONLY ===
  '/site-programador': { role: 'owner', area: 'owner' },
  '/pessoal': { role: 'owner', area: 'owner' },
  '/vida-pessoal': { role: 'owner', area: 'owner' },
  '/diagnostico-whatsapp': { role: 'owner', area: 'owner' },
  '/diagnostico-webhooks': { role: 'owner', area: 'owner' },
  '/central-monitoramento': { role: 'owner', area: 'owner' },
};

/**
 * Mapa de buckets e suas políticas esperadas
 */
export const STORAGE_CONTRACTS: Record<string, { public: boolean; allowedRoles: string[] }> = {
  'arquivos': { public: false, allowedRoles: ['owner', 'admin', 'employee'] }, // LEI VII: PRIVADO
  'aulas': { public: false, allowedRoles: ['owner', 'admin', 'employee', 'beta'] },
  'avatars': { public: false, allowedRoles: ['*'] }, // LEI VII: PRIVADO
  'certificados': { public: false, allowedRoles: ['owner', 'admin', 'beta'] },
  'comprovantes': { public: false, allowedRoles: ['owner', 'admin', 'contabilidade'] },
  'documentos': { public: false, allowedRoles: ['owner', 'admin', 'employee'] },
  'ena-assets-raw': { public: false, allowedRoles: ['owner', 'admin'] },
  'ena-assets-transmuted': { public: false, allowedRoles: ['owner', 'admin', 'beta'] },
  'materiais': { public: false, allowedRoles: ['owner', 'admin', 'employee', 'beta'] },
  'whatsapp-attachments': { public: false, allowedRoles: ['owner', 'admin', 'employee'] },
};

/**
 * Edge Functions e seus requisitos de autenticação
 */
export const EDGE_FUNCTION_CONTRACTS: Record<string, { requiresAuth: boolean; allowedRoles: string[] }> = {
  'ai-assistant': { requiresAuth: true, allowedRoles: ['*'] },
  'ai-tramon': { requiresAuth: true, allowedRoles: ['beta', 'owner', 'admin'] },
  'ai-tutor': { requiresAuth: true, allowedRoles: ['beta', 'owner', 'admin'] },
  'book-page-manifest': { requiresAuth: true, allowedRoles: ['beta', 'owner'] },
  'book-page-signed-url': { requiresAuth: true, allowedRoles: ['beta', 'owner'] },
  'genesis-book-upload': { requiresAuth: true, allowedRoles: ['owner', 'admin'] },
  'secure-video-url': { requiresAuth: true, allowedRoles: ['beta', 'owner', 'admin'] },
  'video-authorize-omega': { requiresAuth: true, allowedRoles: ['beta', 'owner', 'admin'] },
  'hotmart-webhook-processor': { requiresAuth: false, allowedRoles: ['*'] }, // Webhook externo
  'webhook-handler': { requiresAuth: false, allowedRoles: ['*'] }, // Webhook externo
  'sna-gateway': { requiresAuth: true, allowedRoles: ['owner', 'admin'] },
  'sna-worker': { requiresAuth: true, allowedRoles: ['owner'] },
};

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Valida se um contrato de rota está íntegro
 */
export function validateRouteContract(path: string): ContractValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const contract = ROUTE_CONTRACTS[path];
  
  if (!contract) {
    warnings.push(`Rota '${path}' não está registrada no contrato`);
  }
  
  // Verificar se a rota não é href="#" ou vazia
  if (path === '#' || path === '') {
    errors.push('Rota inválida: href="#" ou vazio');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valida todos os contratos de rotas
 */
export function validateAllRouteContracts(): ContractValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  Object.entries(ROUTE_CONTRACTS).forEach(([path, contract]) => {
    if (!contract.role) {
      errors.push(`Rota '${path}' sem role definida`);
    }
    if (!contract.area) {
      errors.push(`Rota '${path}' sem área definida`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Obtém o contrato de uma rota
 */
export function getRouteContract(path: string): { role: string; area: string } | null {
  // Tentar match exato
  if (ROUTE_CONTRACTS[path]) {
    return ROUTE_CONTRACTS[path];
  }
  
  // Tentar match com parâmetros dinâmicos
  const pathParts = path.split('/');
  for (const [routePath, contract] of Object.entries(ROUTE_CONTRACTS)) {
    const routeParts = routePath.split('/');
    if (routeParts.length === pathParts.length) {
      const matches = routeParts.every((part, i) => 
        part === pathParts[i] || part.startsWith(':')
      );
      if (matches) return contract;
    }
  }
  
  return null;
}

/**
 * Verifica se um bucket pode ser acessado por uma role
 */
export function canAccessBucket(bucketName: string, role: string): boolean {
  const contract = STORAGE_CONTRACTS[bucketName];
  if (!contract) return false;
  
  if (contract.allowedRoles.includes('*')) return true;
  return contract.allowedRoles.includes(role);
}

/**
 * Verifica se uma edge function pode ser chamada por uma role
 */
export function canCallEdgeFunction(functionName: string, role: string, isAuthenticated: boolean): boolean {
  const contract = EDGE_FUNCTION_CONTRACTS[functionName];
  if (!contract) return true; // Se não registrada, permitir (legacy)
  
  if (contract.requiresAuth && !isAuthenticated) return false;
  if (contract.allowedRoles.includes('*')) return true;
  return contract.allowedRoles.includes(role);
}

// ============================================
// EXPORTS
// ============================================

export const UI_CONTRACTS_VERSION = '2.0.0';

export default {
  ROUTE_CONTRACTS,
  STORAGE_CONTRACTS,
  EDGE_FUNCTION_CONTRACTS,
  validateRouteContract,
  validateAllRouteContracts,
  getRouteContract,
  canAccessBucket,
  canCallEdgeFunction,
};
