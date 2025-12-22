// ============================================
// 🛡️ FORTALEZA DIGITAL ULTRA v2.0
// SECURITY CONTEXT - PROVIDER GLOBAL
// Zero-Trust Security para 5.000+ usuários
// ============================================

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

export type AppRole = 'owner' | 'admin' | 'beta' | 'funcionario' | 'aluno_gratuito' | 'viewer';

export interface SecurityUser {
  id: string;
  email: string;
  role: AppRole;
  mfaEnabled: boolean;
  isVerified: boolean;
}

export interface SecuritySession {
  id: string;
  token: string;
  deviceHash: string;
  deviceName: string;
  isActive: boolean;
  expiresAt: Date;
  lastActivity: Date;
}

export interface SecurityState {
  isInitialized: boolean;
  isSecure: boolean;
  isBlocked: boolean;
  blockReason?: string;
  riskScore: number;
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityContextValue {
  // Estado
  state: SecurityState;
  user: SecurityUser | null;
  session: SecuritySession | null;
  
  // Verificações
  isOwner: boolean;
  isAdmin: boolean;
  isBeta: boolean;
  isFuncionario: boolean;
  canAccessGestao: boolean;
  canAccessAlunos: boolean;
  
  // Ações
  checkUrlAccess: (url: string) => boolean;
  logSecurityEvent: (type: string, riskScore?: number, details?: Record<string, unknown>) => Promise<void>;
  revokeAllSessions: () => Promise<void>;
  refreshSecurityState: () => Promise<void>;
}

// ============================================
// MAPA DE URLs DEFINITIVO
// ============================================

/**
 * 📍 MAPA DE URLs DEFINITIVO
 * 
 * | Quem           | URL                                    | Validação                    |
 * |----------------|----------------------------------------|------------------------------|
 * | 🌐 NÃO PAGANTE | pro.moisesmedeiros.com.br/             | Criar conta = acesso livre   |
 * | 👨‍🎓 ALUNO BETA  | pro.moisesmedeiros.com.br/alunos       | role='beta' + acesso válido  |
 * | 👔 FUNCIONÁRIO | gestao.moisesmedeiros.com.br/          | role='funcionario'           |
 * | 👑 OWNER       | TODAS                                  | role='owner'                 |
 */

const PUBLIC_URLS = ['/', '/auth', '/termos', '/privacidade', '/area-gratuita', '/site'];

const ALUNO_URLS_PREFIX = '/alunos';

const GESTAO_URLS = [
  '/dashboard', '/app', '/funcionarios', '/financas-pessoais', '/financas-empresa',
  '/entradas', '/afiliados', '/gestao-alunos', '/relatorios', '/configuracoes',
  '/gestao-equipe', '/guia', '/calendario', '/pagamentos', '/contabilidade',
  '/gestao-site', '/area-professor', '/portal-aluno', '/integracoes', '/permissoes',
  '/cursos', '/marketing', '/lancamento', '/metricas', '/arquivos', '/documentos',
  '/planejamento-aula', '/turmas-online', '/turmas-presenciais', '/site-programador',
  '/pessoal', '/perfil', '/dashboard-executivo', '/monitoramento', '/simulados',
  '/laboratorio', '/vida-pessoal', '/tarefas', '/leads-whatsapp', '/central-whatsapp',
  '/whatsapp-live', '/diagnostico-whatsapp', '/diagnostico-webhooks', '/central-metricas',
  '/auditoria-acessos', '/central-monitoramento', '/central-ias', '/transacoes-hotmart',
  '/lives', '/empresas', '/gestao-dispositivos',
];

// ============================================
// CONTEXTO
// ============================================

const SecurityContext = createContext<SecurityContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface SecurityProviderProps {
  children: ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estado
  const [state, setState] = useState<SecurityState>({
    isInitialized: false,
    isSecure: false,
    isBlocked: false,
    riskScore: 0,
    threatLevel: 'none',
  });
  
  const [user, setUser] = useState<SecurityUser | null>(null);
  const [session, setSession] = useState<SecuritySession | null>(null);
  
  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  
  useEffect(() => {
    if (authLoading) return;
    
    const initSecurity = async () => {
      if (!authUser) {
        setUser(null);
        setSession(null);
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isSecure: false,
        }));
        return;
      }
      
      try {
        // Buscar perfil com role
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, email, role, nome_completo')
          .eq('id', authUser.id)
          .single();
        
        if (error) {
          console.warn('[Security] Profile fetch error:', error);
        }
        
        const userRole: AppRole = (profile?.role as AppRole) || 'viewer';
        
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          role: userRole,
          mfaEnabled: false, // TODO: verificar MFA
          isVerified: !!authUser.email_confirmed_at,
        });
        
        // Gerar/recuperar sessão
        let sessionToken = sessionStorage.getItem('mm_session_token');
        if (!sessionToken) {
          sessionToken = crypto.randomUUID();
          sessionStorage.setItem('mm_session_token', sessionToken);
        }
        
        setSession({
          id: sessionToken,
          token: sessionToken,
          deviceHash: await generateDeviceHash(),
          deviceName: getDeviceName(),
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          lastActivity: new Date(),
        });
        
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isSecure: true,
          riskScore: 0,
          threatLevel: 'none',
        }));
        
      } catch (err) {
        console.error('[Security] Init error:', err);
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isSecure: false,
        }));
      }
    };
    
    initSecurity();
  }, [authUser, authLoading]);
  
  // ============================================
  // VERIFICAÇÕES DE ROLE
  // ============================================
  
  const isOwner = useMemo(() => user?.role === 'owner', [user?.role]);
  const isAdmin = useMemo(() => ['owner', 'admin'].includes(user?.role || ''), [user?.role]);
  const isBeta = useMemo(() => ['owner', 'admin', 'beta'].includes(user?.role || ''), [user?.role]);
  const isFuncionario = useMemo(() => ['owner', 'admin', 'funcionario'].includes(user?.role || ''), [user?.role]);
  
  const canAccessGestao = useMemo(() => {
    return isOwner || isAdmin || isFuncionario;
  }, [isOwner, isAdmin, isFuncionario]);
  
  const canAccessAlunos = useMemo(() => {
    return isOwner || isAdmin || isBeta;
  }, [isOwner, isAdmin, isBeta]);
  
  // ============================================
  // VERIFICAÇÃO DE ACESSO A URL
  // ============================================
  
  const checkUrlAccess = useCallback((url: string): boolean => {
    // Sem usuário, apenas URLs públicas
    if (!user) {
      return PUBLIC_URLS.some(pub => url === pub || url.startsWith(pub + '/'));
    }
    
    // Owner acessa TUDO
    if (isOwner) return true;
    
    // Admin acessa quase tudo
    if (isAdmin) return true;
    
    // URL pública - todos podem
    if (PUBLIC_URLS.some(pub => url === pub || url.startsWith(pub + '/'))) {
      return true;
    }
    
    // Área de alunos
    if (url === ALUNO_URLS_PREFIX || url.startsWith(ALUNO_URLS_PREFIX + '/')) {
      return isBeta;
    }
    
    // Área de gestão
    if (GESTAO_URLS.some(g => url === g || url.startsWith(g + '/'))) {
      return isFuncionario;
    }
    
    // Default: negar
    return false;
  }, [user, isOwner, isAdmin, isBeta, isFuncionario]);
  
  // ============================================
  // VERIFICAÇÃO DE ACESSO NA NAVEGAÇÃO
  // ============================================
  
  useEffect(() => {
    if (!state.isInitialized) return;
    
    const currentPath = location.pathname;
    
    // Se não tem acesso, redirecionar
    if (!checkUrlAccess(currentPath)) {
      // Se não está logado, vai para auth
      if (!user) {
        if (!PUBLIC_URLS.includes(currentPath)) {
          navigate('/auth', { replace: true });
        }
        return;
      }
      
      // Se está logado mas não tem permissão
      toast.error('Acesso negado', {
        description: 'Você não tem permissão para acessar esta área.',
      });
      
      // Redirecionar para área apropriada
      if (isBeta && !isFuncionario) {
        navigate('/alunos', { replace: true });
      } else if (isFuncionario) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
      
      // Logar evento de segurança
      logSecurityEvent('permission_denied', 40, {
        attempted_url: currentPath,
        user_role: user.role,
      });
    }
  }, [location.pathname, state.isInitialized, user, checkUrlAccess, isBeta, isFuncionario, navigate]);
  
  // ============================================
  // LOG DE EVENTOS DE SEGURANÇA
  // ============================================
  
  const logSecurityEvent = useCallback(async (
    type: string,
    riskScore: number = 0,
    details?: Record<string, unknown>
  ) => {
    if (!user) return;
    
    try {
      await supabase.rpc('log_security_event', {
        p_event_type: type,
        p_user_id: user.id,
        p_risk_score: riskScore,
        p_details: {
          ...details,
          url: location.pathname,
          session_id: session?.id,
          device_hash: session?.deviceHash,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.warn('[Security] Event log error:', err);
    }
  }, [user, location.pathname, session]);
  
  // ============================================
  // REVOGAR TODAS AS SESSÕES
  // ============================================
  
  const revokeAllSessions = useCallback(async () => {
    if (!user || !session) return;
    
    try {
      await supabase.rpc('revoke_other_sessions', {
        p_user_id: user.id,
        p_current_session_token: session.token,
      });
      
      toast.success('Sessões revogadas', {
        description: 'Todas as outras sessões foram encerradas.',
      });
    } catch (err) {
      console.error('[Security] Revoke sessions error:', err);
      toast.error('Erro ao revogar sessões');
    }
  }, [user, session]);
  
  // ============================================
  // REFRESH SECURITY STATE
  // ============================================
  
  const refreshSecurityState = useCallback(async () => {
    if (!user) return;
    
    try {
      // Re-verificar perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile && profile.role !== user.role) {
        setUser(prev => prev ? { ...prev, role: profile.role as AppRole } : null);
        
        toast.info('Permissões atualizadas', {
          description: 'Suas permissões foram atualizadas.',
        });
      }
    } catch (err) {
      console.warn('[Security] Refresh error:', err);
    }
  }, [user]);
  
  // ============================================
  // VALOR DO CONTEXTO
  // ============================================
  
  const value = useMemo<SecurityContextValue>(() => ({
    state,
    user,
    session,
    isOwner,
    isAdmin,
    isBeta,
    isFuncionario,
    canAccessGestao,
    canAccessAlunos,
    checkUrlAccess,
    logSecurityEvent,
    revokeAllSessions,
    refreshSecurityState,
  }), [
    state,
    user,
    session,
    isOwner,
    isAdmin,
    isBeta,
    isFuncionario,
    canAccessGestao,
    canAccessAlunos,
    checkUrlAccess,
    logSecurityEvent,
    revokeAllSessions,
    refreshSecurityState,
  ]);
  
  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

// ============================================
// HOOK DE CONSUMO
// ============================================

export function useSecurity(): SecurityContextValue {
  const context = useContext(SecurityContext);
  
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  
  return context;
}

// ============================================
// UTILIDADES
// ============================================

async function generateDeviceHash(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
  ];
  
  const data = components.join('|');
  
  if (crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    } catch {
      // Fallback
    }
  }
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).padStart(16, '0');
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Linux/.test(ua)) return 'Linux';
  
  return 'Dispositivo Desconhecido';
}

export default SecurityProvider;
