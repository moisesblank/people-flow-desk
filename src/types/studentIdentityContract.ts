// ============================================
// 📜 STUDENT IDENTITY CONTRACT v1.0.0
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
// ============================================
// FONTE DA VERDADE: tabelas `alunos`, `profiles`, `user_roles`
// USO: UI /gestaofc/gestao-alunos + Edge Functions
// REGRA: NÃO ALTERA TABELA, NÃO ALTERA RLS/POLICY
// ============================================

/**
 * Roles válidas para alunos (CONSTITUIÇÃO v10.x)
 * - beta: aluno pagante com acesso completo
 * - aluno_gratuito: cadastro grátis com acesso limitado
 */
export type StudentRole = 'beta' | 'aluno_gratuito';

/**
 * Endereço completo do aluno (campos opcionais)
 * Baseado em colunas existentes + extensão futura
 */
export interface StudentAddress {
  /** Logradouro (rua, avenida, etc.) */
  logradouro?: string;
  /** Número do endereço */
  numero?: string;
  /** Complemento (apto, bloco, etc.) */
  complemento?: string;
  /** Bairro */
  bairro?: string;
  /** Cidade — coluna `alunos.cidade` */
  cidade?: string;
  /** Estado (UF) — coluna `alunos.estado` */
  estado?: string;
  /** CEP */
  cep?: string;
}

/**
 * CONTRATO CANÔNICO: Identidade do Aluno
 * 
 * Campos mapeados das tabelas reais:
 * - `alunos.email` → email (obrigatório)
 * - `alunos.nome` / `profiles.nome` → nome (obrigatório)
 * - `user_roles.role` → role (obrigatório: beta | aluno_gratuito)
 * - `alunos.telefone` / `profiles.phone` → telefone (opcional)
 * - `alunos.foto_url` / `profiles.avatar_url` → foto_aluno (opcional)
 * - `alunos.cpf` / `profiles.cpf` → cpf (readonly, opcional)
 * - `alunos.cidade`, `alunos.estado` → endereço parcial (opcional)
 */
export interface StudentIdentityContract {
  // ============================================
  // CAMPOS OBRIGATÓRIOS
  // ============================================
  
  /** Email do aluno — fonte: `alunos.email` ou `profiles.email` */
  email: string;
  
  /** Nome completo — fonte: `alunos.nome` ou `profiles.nome` */
  nome: string;
  
  /** Role do aluno — fonte: `user_roles.role` */
  role: StudentRole;

  // ============================================
  // CAMPOS OPCIONAIS
  // ============================================
  
  /** Telefone — fonte: `alunos.telefone` ou `profiles.phone` */
  telefone?: string;
  
  /** URL da foto do aluno — fonte: `alunos.foto_url` ou `profiles.avatar_url` */
  foto_aluno?: string;
  
  /** Endereço completo — fonte: `alunos.cidade`, `alunos.estado` + extensão */
  endereco?: StudentAddress;
  
  /** 
   * CPF (somente leitura) — fonte: `alunos.cpf` ou `profiles.cpf`
   * ⚠️ PII CRÍTICO: Apenas owner/admin podem visualizar
   */
  readonly cpf?: string;
}

// ============================================
// VALIDAÇÃO & HELPERS
// ============================================

/**
 * Valida se um objeto atende ao contrato mínimo obrigatório
 */
export function isValidStudentIdentity(data: unknown): data is StudentIdentityContract {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as Record<string, unknown>;
  
  // Campos obrigatórios
  if (typeof obj.email !== 'string' || !obj.email.trim()) return false;
  if (typeof obj.nome !== 'string' || !obj.nome.trim()) return false;
  if (obj.role !== 'beta' && obj.role !== 'aluno_gratuito') return false;
  
  return true;
}

/**
 * Roles válidas para alunos (array para validação)
 */
export const STUDENT_ROLES: readonly StudentRole[] = ['beta', 'aluno_gratuito'] as const;

/**
 * Labels amigáveis para as roles de aluno
 */
export const STUDENT_ROLE_LABELS: Record<StudentRole, string> = {
  beta: 'Aluno Beta (Premium)',
  aluno_gratuito: 'Aluno Gratuito',
} as const;

/**
 * Mapeia dados da tabela `alunos` para o contrato
 * @param aluno - Row da tabela `alunos`
 * @param role - Role do user_roles (deve ser buscada separadamente)
 */
export function mapAlunoToContract(
  aluno: {
    email: string;
    nome: string;
    telefone?: string | null;
    foto_url?: string | null;
    cpf?: string | null;
    cidade?: string | null;
    estado?: string | null;
  },
  role: StudentRole
): StudentIdentityContract {
  return {
    email: aluno.email,
    nome: aluno.nome,
    role,
    telefone: aluno.telefone ?? undefined,
    foto_aluno: aluno.foto_url ?? undefined,
    cpf: aluno.cpf ?? undefined,
    endereco: (aluno.cidade || aluno.estado) ? {
      cidade: aluno.cidade ?? undefined,
      estado: aluno.estado ?? undefined,
    } : undefined,
  };
}

/**
 * Mapeia dados da tabela `profiles` para o contrato
 * @param profile - Row da tabela `profiles`
 * @param role - Role do user_roles (deve ser buscada separadamente)
 */
export function mapProfileToContract(
  profile: {
    email?: string | null;
    nome: string;
    phone?: string | null;
    avatar_url?: string | null;
    cpf?: string | null;
  },
  role: StudentRole
): StudentIdentityContract | null {
  // Email é obrigatório no contrato
  if (!profile.email) return null;
  
  return {
    email: profile.email,
    nome: profile.nome,
    role,
    telefone: profile.phone ?? undefined,
    foto_aluno: profile.avatar_url ?? undefined,
    cpf: profile.cpf ?? undefined,
  };
}
