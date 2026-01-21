// ============================================
// 🔒 OWNER GUARD — RESOLUÇÃO DE ROLE
// P0: Múltiplas fontes para garantir detecção
// ============================================

import { OWNER_ROLE, OWNER_EMAIL } from './constants';
import { supabase } from '@/integrations/supabase/client';

export type RoleSource = 'jwt' | 'metadata' | 'database' | 'cache' | 'email_fallback';

export interface RoleResolution {
  role: string | null;
  source: RoleSource | null;
  isOwner: boolean;
  email?: string;
}

/**
 * Resolve role do cache local (mais rápido)
 */
export function resolveRoleFromCache(): RoleResolution {
  try {
    const cachedRole = localStorage.getItem('matriz_user_role');
    const isOwnerCache = localStorage.getItem('matriz_is_owner_cache') === 'true';
    
    if (isOwnerCache) {
      return { role: OWNER_ROLE, source: 'cache', isOwner: true };
    }
    
    if (cachedRole) {
      return { 
        role: cachedRole, 
        source: 'cache', 
        isOwner: cachedRole === OWNER_ROLE 
      };
    }
  } catch {
    // localStorage indisponível
  }
  
  return { role: null, source: null, isOwner: false };
}

/**
 * Resolve role do JWT/session atual
 */
export async function resolveRoleFromSession(): Promise<RoleResolution> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { role: null, source: null, isOwner: false };
    }
    
    const email = session.user.email?.toLowerCase();
    
    // Fallback de emergência por email
    if (email === OWNER_EMAIL) {
      return { role: OWNER_ROLE, source: 'email_fallback', isOwner: true, email };
    }
    
    // Verifica metadata
    const metadataRole = session.user.user_metadata?.role;
    if (metadataRole) {
      return { 
        role: metadataRole, 
        source: 'metadata', 
        isOwner: metadataRole === OWNER_ROLE,
        email 
      };
    }
    
    return { role: null, source: null, isOwner: false, email };
  } catch {
    return { role: null, source: null, isOwner: false };
  }
}

/**
 * Resolve role do banco de dados (mais confiável, mas mais lento)
 */
export async function resolveRoleFromDatabase(userId?: string): Promise<RoleResolution> {
  try {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetUserId = user?.id;
      
      // Fallback por email
      if (user?.email?.toLowerCase() === OWNER_EMAIL) {
        return { role: OWNER_ROLE, source: 'email_fallback', isOwner: true, email: user.email };
      }
    }
    
    if (!targetUserId) {
      return { role: null, source: null, isOwner: false };
    }
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .maybeSingle();
    
    if (data?.role) {
      return { 
        role: data.role, 
        source: 'database', 
        isOwner: data.role === OWNER_ROLE 
      };
    }
    
    return { role: null, source: null, isOwner: false };
  } catch {
    return { role: null, source: null, isOwner: false };
  }
}

/**
 * Resolve role usando todas as fontes disponíveis (prioridade: cache > session > db)
 */
export async function resolveRole(): Promise<RoleResolution> {
  // 1. Tenta cache primeiro (síncrono, mais rápido)
  const cached = resolveRoleFromCache();
  if (cached.isOwner || cached.role) {
    return cached;
  }
  
  // 2. Tenta session/JWT
  const session = await resolveRoleFromSession();
  if (session.isOwner || session.role) {
    return session;
  }
  
  // 3. Fallback para banco
  return resolveRoleFromDatabase();
}

/**
 * Verifica se é Owner de forma síncrona (usa cache)
 */
export function isOwnerSync(): boolean {
  const cached = resolveRoleFromCache();
  return cached.isOwner;
}

/**
 * Verifica se é Owner de forma assíncrona (mais confiável)
 */
export async function isOwnerAsync(): Promise<boolean> {
  const resolution = await resolveRole();
  return resolution.isOwner;
}
