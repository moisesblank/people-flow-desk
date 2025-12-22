// ============================================
// 🛡️ HOOK: useRolePermissions
// Sistema de permissões por role - DNA PROJETO
// Mapa de URLs definitivo conforme MATRIZ SAGRADA
// Design 2300 - Segurança Máxima
// ============================================

import { useMemo } from 'react';
import { useAuth } from './useAuth';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type UserRole = 'owner' | 'admin' | 'beta' | 'funcionario' | 'aluno_gratuito' | 'viewer';

// Tipo completo para compatibilidade com RoleManagementWidget
export type FullAppRole = 
  | 'owner' 
  | 'admin' 
  | 'coordenacao' 
  | 'suporte' 
  | 'monitoria' 
  | 'afiliado' 
  | 'marketing' 
  | 'contabilidade' 
  | 'employee' 
  | 'beta' 
  | 'aluno_gratuito';

export type SystemArea = 
  // Áreas públicas (qualquer um)
  | 'public'
  | 'home'
  | 'landing'
  | 'auth'
  | 'area_gratuita'
  // Áreas do aluno BETA (pro.moisesmedeiros.com.br/alunos)
  | 'alunos'
  | 'videoaulas'
  | 'questoes'
  | 'simulados'
  | 'flashcards'
  | 'ranking'
  | 'desempenho'
  | 'conquistas'
  | 'tutoria'
  // Áreas de gestão (gestao.moisesmedeiros.com.br)
  | 'dashboard'
  | 'funcionarios'
  | 'financas_empresa'
  | 'financas_pessoais'
  | 'afiliados'
  | 'gestao_alunos'
  | 'relatorios'
  | 'contabilidade'
  | 'marketing'
  | 'integracoes'
  | 'configuracoes'
  | 'equipe'
  | 'lives'
  | 'central_whatsapp'
  | 'auditoria'
  // Área do professor
  | 'area_professor'
  | 'planejamento'
  | 'cursos_gestao'
  // Área de sistema
  | 'sistema'
  | 'permissoes'
  | 'diagnostico';

export interface RolePermissions {
  role: UserRole;
  label: string;
  areas: SystemArea[];
  canAccessAll: boolean;
}

// ============================================
// MAPA DE URLs → ÁREAS DO SISTEMA
// ============================================

export const URL_TO_AREA: Record<string, SystemArea> = {
  // Públicas
  '/': 'home',
  '/site': 'landing',
  '/auth': 'auth',
  '/termos': 'public',
  '/privacidade': 'public',
  '/area-gratuita': 'area_gratuita',
  
  // Alunos BETA (pro.moisesmedeiros.com.br/alunos/*)
  '/alunos': 'alunos',
  '/alunos/dashboard': 'alunos',
  '/alunos/videoaulas': 'videoaulas',
  '/alunos/questoes': 'questoes',
  '/alunos/simulados': 'simulados',
  '/alunos/flashcards': 'flashcards',
  '/alunos/ranking': 'ranking',
  '/alunos/desempenho': 'desempenho',
  '/alunos/conquistas': 'conquistas',
  '/alunos/tutoria': 'tutoria',
  '/alunos/tabela-periodica': 'alunos',
  '/alunos/cronograma': 'alunos',
  '/alunos/materiais': 'alunos',
  '/alunos/resumos': 'alunos',
  '/alunos/mapas-mentais': 'alunos',
  '/alunos/redacao': 'alunos',
  '/alunos/forum': 'alunos',
  '/alunos/lives': 'alunos',
  '/alunos/duvidas': 'alunos',
  '/alunos/revisao': 'alunos',
  '/alunos/laboratorio': 'alunos',
  '/alunos/calculadora': 'alunos',
  '/alunos/metas': 'alunos',
  '/alunos/agenda': 'alunos',
  '/alunos/certificados': 'alunos',
  '/alunos/perfil': 'alunos',
  
  // Gestão (gestao.moisesmedeiros.com.br/*)
  '/app': 'dashboard',
  '/dashboard': 'dashboard',
  '/dashboard-executivo': 'dashboard',
  '/funcionarios': 'funcionarios',
  '/financas-empresa': 'financas_empresa',
  '/financas-pessoais': 'financas_pessoais',
  '/pagamentos': 'financas_empresa',
  '/entradas': 'financas_empresa',
  '/afiliados': 'afiliados',
  '/gestao-alunos': 'gestao_alunos',
  '/relatorios': 'relatorios',
  '/contabilidade': 'contabilidade',
  '/marketing': 'marketing',
  '/lancamento': 'marketing',
  '/metricas': 'marketing',
  '/integracoes': 'integracoes',
  '/configuracoes': 'configuracoes',
  '/gestao-equipe': 'equipe',
  '/lives': 'lives',
  '/central-whatsapp': 'central_whatsapp',
  '/whatsapp-live': 'central_whatsapp',
  '/leads-whatsapp': 'central_whatsapp',
  '/diagnostico-whatsapp': 'diagnostico',
  '/diagnostico-webhooks': 'diagnostico',
  '/auditoria-acessos': 'auditoria',
  '/central-monitoramento': 'sistema',
  '/central-metricas': 'sistema',
  '/central-ias': 'sistema',
  '/transacoes-hotmart': 'financas_empresa',
  '/arquivos': 'sistema',
  '/documentos': 'sistema',
  '/calendario': 'sistema',
  '/tarefas': 'sistema',
  '/vida-pessoal': 'sistema',
  '/pessoal': 'sistema',
  '/perfil': 'sistema',
  '/gestao-dispositivos': 'sistema',
  '/monitoramento': 'sistema',
  '/guia': 'sistema',
  '/gestao-site': 'sistema',
  '/site-programador': 'sistema',
  
  // Professor
  '/area-professor': 'area_professor',
  '/portal-aluno': 'area_professor',
  '/planejamento-aula': 'planejamento',
  '/cursos': 'cursos_gestao',
  '/simulados': 'cursos_gestao',
  '/laboratorio': 'cursos_gestao',
  '/turmas-online': 'cursos_gestao',
  '/turmas-presenciais': 'cursos_gestao',
  
  // Permissões
  '/permissoes': 'permissoes',
  
  // Empresarial
  '/empresas/dashboard': 'financas_empresa',
  '/empresas/receitas': 'financas_empresa',
  '/empresas/arquivos': 'financas_empresa',
  '/empresas/rh': 'funcionarios',
};

// ============================================
// PERMISSÕES POR ROLE
// ============================================

const USER_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  // 👑 OWNER - Acesso ABSOLUTO a TUDO
  owner: {
    role: 'owner',
    label: 'Proprietário',
    areas: [], // Vazio porque canAccessAll = true
    canAccessAll: true,
  },
  
  // 🔧 ADMIN - Quase tudo, exceto permissões
  admin: {
    role: 'admin',
    label: 'Administrador',
    areas: [
      'public', 'home', 'landing', 'auth', 'area_gratuita',
      'dashboard', 'funcionarios', 'financas_empresa', 'financas_pessoais',
      'afiliados', 'gestao_alunos', 'relatorios', 'contabilidade',
      'marketing', 'integracoes', 'configuracoes', 'equipe',
      'lives', 'central_whatsapp', 'auditoria', 'sistema',
      'area_professor', 'planejamento', 'cursos_gestao', 'diagnostico',
      'alunos', 'videoaulas', 'questoes', 'simulados', 'flashcards',
      'ranking', 'desempenho', 'conquistas', 'tutoria',
    ],
    canAccessAll: false,
  },
  
  // 👔 FUNCIONÁRIO - Gestão conforme permissões específicas
  funcionario: {
    role: 'funcionario',
    label: 'Funcionário',
    areas: [
      'public', 'home', 'landing', 'auth', 'area_gratuita',
      'dashboard', 'financas_pessoais', 'calendario', 'tarefas',
      'gestao_alunos', 'relatorios', 'equipe', 'sistema',
      'configuracoes', 'lives',
    ],
    canAccessAll: false,
  },
  
  // 👨‍🎓 BETA - Aluno pagante com acesso ativo
  beta: {
    role: 'beta',
    label: 'Aluno BETA',
    areas: [
      'public', 'home', 'landing', 'auth', 'area_gratuita',
      'alunos', 'videoaulas', 'questoes', 'simulados', 'flashcards',
      'ranking', 'desempenho', 'conquistas', 'tutoria',
    ],
    canAccessAll: false,
  },
  
  // 🌐 ALUNO GRATUITO - Apenas área gratuita
  aluno_gratuito: {
    role: 'aluno_gratuito',
    label: 'Aluno Gratuito',
    areas: [
      'public', 'home', 'landing', 'auth', 'area_gratuita',
    ],
    canAccessAll: false,
  },
  
  // 👀 VIEWER - Apenas visualização pública
  viewer: {
    role: 'viewer',
    label: 'Visitante',
    areas: [
      'public', 'home', 'landing', 'auth',
    ],
    canAccessAll: false,
  },
};

// ============================================
// LABELS PARA EXIBIÇÃO
// ============================================

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: '👑 Proprietário',
  admin: '🔧 Administrador',
  funcionario: '👔 Funcionário',
  beta: '👨‍🎓 Aluno BETA',
  aluno_gratuito: '🌐 Aluno Gratuito',
  viewer: '👀 Visitante',
};

// Labels estendidos para FullAppRole (compatibilidade)
export const FULL_ROLE_LABELS: Record<FullAppRole, string> = {
  owner: '👑 Proprietário',
  admin: '🔧 Administrador',
  coordenacao: '📋 Coordenação',
  suporte: '🎧 Suporte',
  monitoria: '🎓 Monitoria',
  afiliado: '💰 Afiliado',
  marketing: '📊 Marketing',
  contabilidade: '📈 Contabilidade',
  employee: '👔 Funcionário',
  beta: '⚡ Aluno BETA',
  aluno_gratuito: '🌐 Aluno Gratuito',
};

// Descrições dos cargos
export const ROLE_DESCRIPTIONS: Record<FullAppRole, string> = {
  owner: 'Acesso total e irrestrito a todas as áreas do sistema',
  admin: 'Gerenciamento completo exceto configurações críticas',
  coordenacao: 'Coordenação de turmas, alunos e conteúdo',
  suporte: 'Atendimento e suporte ao aluno',
  monitoria: 'Correção de questões e acompanhamento de alunos',
  afiliado: 'Visualização de comissões e materiais de divulgação',
  marketing: 'Gestão de campanhas e métricas de marketing',
  contabilidade: 'Acesso financeiro e relatórios contábeis',
  employee: 'Funcionário com permissões personalizadas',
  beta: 'Aluno com acesso completo ao conteúdo premium',
  aluno_gratuito: 'Aluno com acesso apenas ao conteúdo gratuito',
};

// Permissões completas por cargo (para RoleManagementWidget)
export const ROLE_PERMISSIONS: Record<FullAppRole, SystemArea[]> = {
  owner: [], // canAccessAll = true
  admin: [
    'public', 'home', 'landing', 'auth', 'area_gratuita',
    'dashboard', 'funcionarios', 'financas_empresa', 'financas_pessoais',
    'afiliados', 'gestao_alunos', 'relatorios', 'contabilidade',
    'marketing', 'integracoes', 'configuracoes', 'equipe',
    'lives', 'central_whatsapp', 'auditoria', 'sistema',
    'area_professor', 'planejamento', 'cursos_gestao', 'diagnostico',
    'alunos', 'videoaulas', 'questoes', 'simulados', 'flashcards',
    'ranking', 'desempenho', 'conquistas', 'tutoria',
  ],
  coordenacao: [
    'public', 'home', 'landing', 'auth', 'area_gratuita',
    'dashboard', 'gestao_alunos', 'relatorios', 'equipe',
    'area_professor', 'planejamento', 'cursos_gestao',
    'alunos', 'videoaulas', 'questoes', 'simulados',
  ],
  suporte: [
    'public', 'home', 'landing', 'auth', 'area_gratuita',
    'dashboard', 'gestao_alunos', 'central_whatsapp',
  ],
  monitoria: [
    'public', 'home', 'landing', 'auth', 'area_gratuita',
    'dashboard', 'gestao_alunos', 'questoes', 'simulados',
  ],
  afiliado: [
    'public', 'home', 'landing', 'auth', 'area_gratuita',
    'dashboard', 'afiliados', 'marketing',
  ],
  marketing: [
    'public', 'home', 'landing', 'auth', 'area_gratuita',
    'dashboard', 'marketing', 'relatorios',
  ],
  contabilidade: [
    'public', 'home', 'landing', 'auth', 'area_gratuita',
    'dashboard', 'financas_empresa', 'financas_pessoais',
    'contabilidade', 'relatorios',
  ],
  employee: [
    'public', 'home', 'landing', 'auth', 'area_gratuita',
    'dashboard', 'financas_pessoais', 'equipe', 'sistema',
  ],
  beta: [
    'public', 'home', 'landing', 'auth', 'area_gratuita',
    'alunos', 'videoaulas', 'questoes', 'simulados', 'flashcards',
    'ranking', 'desempenho', 'conquistas', 'tutoria',
  ],
  aluno_gratuito: [
    'public', 'home', 'landing', 'auth', 'area_gratuita',
  ],
};

// ============================================
// HOOK PRINCIPAL
// ============================================

export interface UseRolePermissionsReturn {
  /** Role atual do usuário */
  role: UserRole;
  /** Label do role */
  roleLabel: string;
  /** Está carregando? */
  isLoading: boolean;
  /** Usuário é owner? */
  isOwner: boolean;
  /** Usuário é admin ou owner? */
  isAdminOrOwner: boolean;
  /** Usuário é funcionário ou superior? */
  isFuncionarioOrAbove: boolean;
  /** Usuário é beta ou superior? */
  isBetaOrAbove: boolean;
  /** Verificar acesso a uma área */
  hasAccess: (area: SystemArea) => boolean;
  /** Verificar acesso a uma URL */
  hasAccessToUrl: (url: string) => boolean;
  /** Obter todas as áreas permitidas */
  allowedAreas: SystemArea[];
  /** Verificar se pode acessar gestão */
  canAccessGestao: boolean;
  /** Verificar se pode acessar portal do aluno */
  canAccessPortalAluno: boolean;
}

export function useRolePermissions(): UseRolePermissionsReturn {
  const { profile, isLoading } = useAuth();

  // Determinar role do usuário
  const role = useMemo((): UserRole => {
    if (!profile) return 'viewer';
    
    // @ts-ignore - profile pode ter role como string
    const profileRole = profile.role as string | undefined;
    
    // Verificar email do owner
    if (profile.email === 'moisesblank@gmail.com') {
      return 'owner';
    }
    
    // Mapear role do perfil
    switch (profileRole) {
      case 'owner':
        return 'owner';
      case 'admin':
        return 'admin';
      case 'funcionario':
        return 'funcionario';
      case 'beta':
        // Verificar se acesso ainda é válido
        // @ts-ignore
        const expiresAt = profile.access_expires_at;
        if (expiresAt && new Date(expiresAt) > new Date()) {
          return 'beta';
        }
        return 'aluno_gratuito';
      case 'aluno_gratuito':
        return 'aluno_gratuito';
      default:
        return 'viewer';
    }
  }, [profile]);

  // Obter permissões do role
  const permissions = useMemo(() => {
    return USER_ROLE_PERMISSIONS[role];
  }, [role]);

  // Verificar acesso a uma área
  const hasAccess = useMemo(() => {
    return (area: SystemArea): boolean => {
      if (permissions.canAccessAll) return true;
      return permissions.areas.includes(area);
    };
  }, [permissions]);

  // Verificar acesso a uma URL
  const hasAccessToUrl = useMemo(() => {
    return (url: string): boolean => {
      // Normalizar URL
      const normalizedUrl = url.split('?')[0].replace(/\/$/, '') || '/';
      
      // Buscar área correspondente
      const area = URL_TO_AREA[normalizedUrl];
      
      // Se não encontrou área, verificar prefixos
      if (!area) {
        // URLs de alunos
        if (normalizedUrl.startsWith('/alunos')) {
          return hasAccess('alunos');
        }
        // URLs de empresas
        if (normalizedUrl.startsWith('/empresas')) {
          return hasAccess('financas_empresa');
        }
        // URLs de cursos
        if (normalizedUrl.startsWith('/cursos')) {
          return hasAccess('cursos_gestao');
        }
        // Permitir por padrão para owner
        return permissions.canAccessAll;
      }
      
      return hasAccess(area);
    };
  }, [hasAccess, permissions]);

  // Áreas permitidas
  const allowedAreas = useMemo(() => {
    if (permissions.canAccessAll) {
      return Object.values(URL_TO_AREA).filter((v, i, a) => a.indexOf(v) === i) as SystemArea[];
    }
    return permissions.areas;
  }, [permissions]);

  // Helpers
  const isOwner = role === 'owner';
  const isAdminOrOwner = role === 'owner' || role === 'admin';
  const isFuncionarioOrAbove = isAdminOrOwner || role === 'funcionario';
  const isBetaOrAbove = isFuncionarioOrAbove || role === 'beta';
  
  // Acesso a gestão (gestao.moisesmedeiros.com.br)
  const canAccessGestao = useMemo(() => {
    return isOwner || role === 'admin' || role === 'funcionario';
  }, [isOwner, role]);
  
  // Acesso ao portal do aluno (pro.moisesmedeiros.com.br/alunos)
  const canAccessPortalAluno = useMemo(() => {
    return isOwner || role === 'admin' || role === 'beta';
  }, [isOwner, role]);

  return {
    role,
    roleLabel: ROLE_LABELS[role],
    isLoading,
    isOwner,
    isAdminOrOwner,
    isFuncionarioOrAbove,
    isBetaOrAbove,
    hasAccess,
    hasAccessToUrl,
    allowedAreas,
    canAccessGestao,
    canAccessPortalAluno,
  };
}

// ============================================
// FUNÇÃO AUXILIAR: is_beta_or_owner (SQL equivalent)
// ============================================

export function isBetaOrOwner(profile: any): boolean {
  if (!profile) return false;
  
  const role = profile.role;
  
  // Owner sempre tem acesso
  if (role === 'owner' || profile.email === 'moisesblank@gmail.com') {
    return true;
  }
  
  // Beta com acesso válido
  if (role === 'beta') {
    const expiresAt = profile.access_expires_at;
    if (expiresAt && new Date(expiresAt) > new Date()) {
      return true;
    }
  }
  
  return false;
}

export default useRolePermissions;
