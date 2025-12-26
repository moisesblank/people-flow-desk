// ============================================
// TIPOS DE AUTENTICAÇÃO E AUTORIZAÇÃO
// Centralizados por domínio
// ============================================

// Roles do sistema
export type FullAppRole = 
  | "owner" 
  | "admin" 
  | "employee" 
  | "coordenacao" 
  | "suporte" 
  | "monitoria" 
  | "afiliado" 
  | "marketing" 
  | "contabilidade"
  | "beta"           // ALUNO PAGANTE (365 dias)
  | "aluno_gratuito"; // CADASTRO COMUM (apenas área gratuita)

// Alias para compatibilidade
export type UserRole = FullAppRole;

// Labels de roles para exibição
export const FULL_ROLE_LABELS: Record<FullAppRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  employee: "Funcionário",
  coordenacao: "Coordenação",
  suporte: "Suporte",
  monitoria: "Monitoria",
  afiliado: "Afiliado",
  marketing: "Marketing",
  contabilidade: "Contabilidade",
  beta: "Aluno Beta",
  aluno_gratuito: "Aluno Gratuito",
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
