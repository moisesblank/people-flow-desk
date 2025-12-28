// ============================================
// HOOK PARA BUSCAR PRESENÇA DOS ALUNOS
// Retorna mapa de aluno_id -> status de presença
// ============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface StudentPresence {
  aluno_id: string;
  is_online: boolean | null;
  last_seen_at: string | null;
  presence_status: 'online' | 'away' | 'offline';
}

export function useStudentPresence() {
  const query = useQuery({
    queryKey: ['student-presence'],
    queryFn: async (): Promise<Map<string, StudentPresence>> => {
      const { data, error } = await supabase
        .from('alunos_presence')
        .select('aluno_id, is_online, last_seen_at, presence_status');

      if (error) {
        console.error('[Presence] Query error:', error);
        return new Map();
      }

      const presenceMap = new Map<string, StudentPresence>();
      
      (data || []).forEach((row: any) => {
        if (row.aluno_id) {
          presenceMap.set(row.aluno_id, {
            aluno_id: row.aluno_id,
            is_online: row.is_online,
            last_seen_at: row.last_seen_at,
            presence_status: row.presence_status || 'offline'
          });
        }
      });

      return presenceMap;
    },
    staleTime: 60 * 1000, // 1 minuto
    refetchInterval: 60 * 1000, // Refetch a cada 1 minuto para ver atualizações
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('presence-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        () => {
          // Invalidate query when presence changes
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  return {
    presenceMap: query.data || new Map<string, StudentPresence>(),
    isLoading: query.isLoading,
    refetch: query.refetch
  };
}

// Helper para obter status de presença de um aluno
export function getPresenceStatus(
  presenceMap: Map<string, StudentPresence>,
  alunoId: string
): StudentPresence {
  return presenceMap.get(alunoId) || {
    aluno_id: alunoId,
    is_online: null,
    last_seen_at: null,
    presence_status: 'offline'
  };
}
