// ============================================
// TIPOS DE AUTENTICAÇÃO E AUTORIZAÇÃO
// Centralizados por domínio
// ============================================

// Roles do sistema
// 🎯 CONSTITUIÇÃO ROLES v1.0.0 - Nomenclatura Definitiva
// "employee" e "funcionario" são CATEGORIAS, não roles individuais
export type FullAppRole = 
  | "owner"           // Nível 0 - Proprietário (TOTAL)
  | "admin"           // Nível 1 - Administrador
  | "coordenacao"     // Nível 2 - Coordenação
  | "contabilidade"   // Nível 2 - Contabilidade
  | "suporte"         // Nível 3 - Suporte
  | "monitoria"       // Nível 3 - Monitoria
  | "marketing"       // Nível 3 - Marketing
  | "afiliado"        // Nível 3 - Afiliados
  | "beta"            // ALUNO PAGANTE (permanente)
  | "aluno_gratuito"  // CADASTRO COMUM (apenas área gratuita)
  | "aluno_presencial" // ALUNO PRESENCIAL (v10.x)
  | "beta_expira";    // BETA COM EXPIRAÇÃO (v10.x)

// Alias para compatibilidade
export type UserRole = FullAppRole;

// Labels de roles para exibição
export const FULL_ROLE_LABELS: Record<FullAppRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  coordenacao: "Coordenação",
  contabilidade: "Contabilidade",
  suporte: "Suporte",
  monitoria: "Monitoria",
  marketing: "Marketing",
  afiliado: "Afiliado",
  beta: "Aluno Beta",
  aluno_gratuito: "Aluno Gratuito",
  aluno_presencial: "Aluno Presencial",
  beta_expira: "Beta com Expiração",
};

// Áreas do sistema
export type SystemArea = 
  | "dashboard"
  | "dashboard-executivo"
  | "tarefas"
  | "integracoes"
  | "calendario"
  | "funcionarios"
  | "area-professor"
  | "gestao-equipe"
  | "marketing"
  | "lancamento"
  | "metricas"
  | "arquivos"
  | "planejamento-aula"
  | "turmas-online"
  | "turmas-presenciais"
  | "financas-pessoais"
  | "financas-empresa"
  | "entradas"
  | "pagamentos"
  | "contabilidade"
  | "cursos"
  | "simulados"
  | "afiliados"
  | "alunos"
  | "portal-aluno"
  | "gestao-site"
  | "relatorios"
  | "guia"
  | "laboratorio"
  | "site-programador"
  | "pessoal"
  | "vida-pessoal"
  | "permissoes"
  | "configuracoes"
  | "monitoramento"
  | "central-whatsapp"
  | "diagnostico-whatsapp"
  | "auditoria-acessos"
  | "central-monitoramento"
  | "central-ias"
  | "central-metricas"
  | "documentos"
  // Áreas empresariais
  | "dashboard-empresarial"
  | "receitas-empresariais"
  | "rh-funcionarios"
  | "arquivos-empresariais"
  | "fluxo-caixa"
  | "contas-pagar"
  | "contas-receber"
  // Áreas para alunos
  | "area-beta"
  | "area-gratuita"
  | "comunidade"
  | "portal-beta"
  // Central do Aluno
  | "aluno-dashboard"
  | "aluno-cronograma"
  | "aluno-videoaulas"
  | "aluno-materiais"
  | "aluno-resumos"
  | "aluno-mapas-mentais"
  | "aluno-questoes"
  | "aluno-simulados"
  | "aluno-redacao"
  | "aluno-desempenho"
  | "aluno-ranking"
  | "aluno-conquistas"
  | "aluno-tutoria"
  | "aluno-forum"
  | "aluno-lives"
  | "aluno-duvidas"
  | "aluno-revisao"
  | "aluno-laboratorio"
  | "aluno-calculadora"
  | "aluno-tabela-periodica"
  | "aluno-flashcards"
  | "aluno-metas"
  | "aluno-agenda"
  | "aluno-certificados"
  | "aluno-perfil"
  | "aluno-livro-web";

// Domínios do sistema
export type SystemDomain = "gestao" | "pro" | "public" | "unknown";

// Categoria de acesso
export type AccessCategory = "owner" | "gestao" | "beta" | "publico";

// Resultado de validação de acesso
export interface AccessValidationResult {
  permitido: boolean;
  redirecionarPara?: string;
  motivo?: string;
}

// Permissões de uma role
export interface RolePermission {
  areas: SystemArea[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canViewFinancials: boolean;
  canManageUsers: boolean;
  canAccessGestao: boolean;
  canAccessBeta: boolean;
}

// Dados de usuário autenticado
export interface AuthUser {
  id: string;
  email: string;
  role: FullAppRole;
  nome?: string;
  avatar_url?: string;
  created_at?: string;
}
