// ============================================
// 🔄 useAppVersionCheck — FORCE REFRESH AUTOMÁTICO
// Quando owner/admin incrementa a versão, todos os 
// clientes fazem refresh instantâneo via Realtime
// ============================================

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRolePermissions } from '@/hooks/useRolePermissions';

const VERSION_KEY = 'app_version_current';

export function useAppVersionCheck() {
  const { isOwner, isAdmin } = useRolePermissions();
  const initialVersionRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    // Buscar versão inicial
    const fetchInitialVersion = async () => {
      const { data } = await supabase
        .from('app_version')
        .select('version')
        .eq('id', 'main')
        .single();
      
      if (data) {
        const storedVersion = localStorage.getItem(VERSION_KEY);
        const currentVersion = data.version;
        
        // Se é a primeira vez ou versão mudou desde última visita
        if (storedVersion && parseInt(storedVersion) < currentVersion && isFirstLoadRef.current) {
          // Versão mudou desde última visita - refresh silencioso
          localStorage.setItem(VERSION_KEY, currentVersion.toString());
          window.location.reload();
          return;
        }
        
        // Salvar versão atual
        localStorage.setItem(VERSION_KEY, currentVersion.toString());
        initialVersionRef.current = currentVersion;
        isFirstLoadRef.current = false;
      }
    };

    fetchInitialVersion();

    // Escutar mudanças em tempo real (para refresh DURANTE a sessão)
    const channel = supabase
      .channel('app-version-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_version',
          filter: 'id=eq.main'
        },
        (payload) => {
          const newVersion = (payload.new as { version: number }).version;
          
          // Owner/Admin não faz refresh automático (é quem publicou)
          if (isOwner || isAdmin) {
            console.log('[AppVersion] Nova versão detectada:', newVersion, '(admin ignorado)');
            localStorage.setItem(VERSION_KEY, newVersion.toString());
            return;
          }
          
          // Alunos: refresh automático silencioso
          if (initialVersionRef.current && newVersion > initialVersionRef.current) {
            console.log('[AppVersion] Nova versão detectada! Refresh automático...');
            localStorage.setItem(VERSION_KEY, newVersion.toString());
            window.location.reload();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOwner, isAdmin]);
}

// Hook para incrementar versão (usado pelo admin)
export function useForceRefreshAll() {
  const incrementVersion = async () => {
    const { data: current } = await supabase
      .from('app_version')
      .select('version')
      .eq('id', 'main')
      .single();
    
    if (current) {
      const { error } = await supabase
        .from('app_version')
        .update({ 
          version: current.version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'main');
      
      if (error) {
        console.error('[ForceRefresh] Erro:', error);
        return false;
      }
      
      console.log('[ForceRefresh] Versão incrementada para:', current.version + 1);
      return true;
    }
    return false;
  };

  return { forceRefreshAll: incrementVersion };
}
