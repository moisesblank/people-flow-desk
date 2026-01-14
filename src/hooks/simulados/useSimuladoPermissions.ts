// ============================================
// 🔒 SIMULADOS PERMISSIONS HOOK
// FASE 5: Permissões Granulares para Simulados
// Constituição SYNAPSE Ω v10.0
// ============================================

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * @deprecated P1-2: OWNER_EMAIL mantido apenas como fallback UX.
 * Verificação primária é via role === 'owner'.
 */
const OWNER_EMAIL = 'moisesblank@gmail.com';

// Roles que podem CRIAR simulados
const CAN_CREATE_ROLES = ['owner', 'admin', 'coordenacao'] as const;

// Roles que podem EDITAR simulados (mais amplo que criar)
const CAN_EDIT_ROLES = ['owner', 'admin', 'coordenacao', 'monitoria'] as const;

// Roles que podem PUBLICAR simulados (restrito)
const CAN_PUBLISH_ROLES = ['owner', 'admin'] as const;

// Roles que podem DELETAR simulados (muito restrito)
const CAN_DELETE_ROLES = ['owner', 'admin'] as const;

// Roles que podem RESPONDER CONTESTAÇÕES (restrito)
const CAN_RESPOND_DISPUTES_ROLES = ['owner', 'admin'] as const;

// Roles que podem VER CONTESTAÇÕES (mais amplo)
const CAN_VIEW_DISPUTES_ROLES = ['owner', 'admin', 'coordenacao'] as const;

// Roles que podem GERENCIAR FLAGS (muito restrito)
const CAN_MANAGE_FLAGS_ROLES = ['owner', 'admin'] as const;

// Roles que podem VER AUDITORIA
const CAN_VIEW_AUDIT_ROLES = ['owner', 'admin', 'coordenacao'] as const;

// Roles que podem VER ALERTAS
const CAN_VIEW_ALERTS_ROLES = ['owner', 'admin', 'coordenacao'] as const;

// Roles que podem VER HEALTHCHECK
const CAN_VIEW_HEALTHCHECK_ROLES = ['owner', 'admin'] as const;

export interface SimuladoPermissions {
  // Básicas
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  
  // Publicação
  canPublish: boolean;
  canUnpublish: boolean;
  
  // Contestações
  canViewDisputes: boolean;
  canRespondDisputes: boolean;
  
  // Sistema
  canManageFlags: boolean;
  canViewAudit: boolean;
  canViewAlerts: boolean;
  canViewHealthcheck: boolean;
  
  // Meta
  isOwner: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  role: string | null;
}

export function useSimuladoPermissions(): SimuladoPermissions {
  const { user, role, isLoading } = useAuth();
  
  // P1-2 SECURITY FIX: Owner APENAS via role (email removido do bundle)
  const isOwner = role === 'owner';
  
  const isAdmin = role === 'admin';
  
  const permissions = useMemo<SimuladoPermissions>(() => {
    // Owner tem TUDO
    if (isOwner) {
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canPublish: true,
        canUnpublish: true,
        canViewDisputes: true,
        canRespondDisputes: true,
        canManageFlags: true,
        canViewAudit: true,
        canViewAlerts: true,
        canViewHealthcheck: true,
        isOwner: true,
        isAdmin: false,
        isLoading,
        role,
      };
    }
    
    // Verificação por role
    const currentRole = role as string;
    
    return {
      canCreate: CAN_CREATE_ROLES.includes(currentRole as any),
      canEdit: CAN_EDIT_ROLES.includes(currentRole as any),
      canDelete: CAN_DELETE_ROLES.includes(currentRole as any),
      canPublish: CAN_PUBLISH_ROLES.includes(currentRole as any),
      canUnpublish: CAN_PUBLISH_ROLES.includes(currentRole as any),
      canViewDisputes: CAN_VIEW_DISPUTES_ROLES.includes(currentRole as any),
      canRespondDisputes: CAN_RESPOND_DISPUTES_ROLES.includes(currentRole as any),
      canManageFlags: CAN_MANAGE_FLAGS_ROLES.includes(currentRole as any),
      canViewAudit: CAN_VIEW_AUDIT_ROLES.includes(currentRole as any),
      canViewAlerts: CAN_VIEW_ALERTS_ROLES.includes(currentRole as any),
      canViewHealthcheck: CAN_VIEW_HEALTHCHECK_ROLES.includes(currentRole as any),
      isOwner: false,
      isAdmin,
      isLoading,
      role,
    };
  }, [isOwner, isAdmin, role, isLoading]);
  
  return permissions;
}

// ============================================
// MATRIZ DE PERMISSÕES (DOCUMENTAÇÃO)
// ============================================
/*
| Ação                  | Owner | Admin | Coord | Monitoria | Outros |
|-----------------------|-------|-------|-------|-----------|--------|
| Criar Simulado        | ✅    | ✅    | ✅    | ❌        | ❌     |
| Editar Simulado       | ✅    | ✅    | ✅    | ✅        | ❌     |
| Deletar Simulado      | ✅    | ✅    | ❌    | ❌        | ❌     |
| Publicar Simulado     | ✅    | ✅    | ❌    | ❌        | ❌     |
| Despublicar Simulado  | ✅    | ✅    | ❌    | ❌        | ❌     |
| Ver Contestações      | ✅    | ✅    | ✅    | ❌        | ❌     |
| Responder Contestações| ✅    | ✅    | ❌    | ❌        | ❌     |
| Gerenciar Flags       | ✅    | ✅    | ❌    | ❌        | ❌     |
| Ver Auditoria         | ✅    | ✅    | ✅    | ❌        | ❌     |
| Ver Alertas           | ✅    | ✅    | ✅    | ❌        | ❌     |
| Ver Healthcheck       | ✅    | ✅    | ❌    | ❌        | ❌     |
*/
