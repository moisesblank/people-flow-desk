// ============================================
// SYNAPSE v14.0 - GOD MODE CONTEXT
// Context Provider para o MODO DEUS completo
// Exclusivo para Owner: moisesblank@gmail.com
// ============================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OWNER_EMAIL = 'moisesblank@gmail.com';

interface GodModeContextType {
  // Status
  isOwner: boolean;
  isGodMode: boolean;
  isActive: boolean;
  isLoading: boolean;
  
  // Ações
  toggle: () => void;
  activate: () => void;
  deactivate: () => void;
  
  // Conteúdo editável
  getContent: (key: string, fallback?: string) => string;
  updateContent: (key: string, value: string, type?: string) => Promise<boolean>;
  
  // Histórico
  getHistory: (key: string) => Promise<any[]>;
  revertToVersion: (key: string, version: number) => Promise<boolean>;
}

const GodModeContext = createContext<GodModeContextType | null>(null);

export function GodModeProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contentCache, setContentCache] = useState<Record<string, string>>({});

  // Verificar usuário e status de owner
  useEffect(() => {
    const checkOwner = async () => {
      setIsLoading(true);
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (!currentUser) {
          setIsOwner(false);
          setIsLoading(false);
          return;
        }

        const isEmailOwner = currentUser.email?.toLowerCase() === OWNER_EMAIL;

        // Regra principal: email do owner (confiável para este projeto)
        if (isEmailOwner) {
          setIsOwner(true);

          // Confirmação extra via backend (não bloqueia o modo caso falhe)
          try {
            const { data, error } = await supabase.rpc('is_owner');
            if (error) {
              console.warn('[GODMODE] is_owner rpc error (ignored):', error.message);
            } else if (data === false) {
              // Se o backend disser explicitamente que não é owner, respeitar
              setIsOwner(false);
            }
          } catch (err) {
            console.warn('[GODMODE] is_owner rpc exception (ignored)');
          }

          console.log('🔮 MODO DEUS disponível - Ctrl+Shift+E para ativar');
        } else {
          setIsOwner(false);
        }
      } catch (err) {
        console.error('Erro ao verificar owner:', err);
        setIsOwner(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOwner();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setIsOwner(false);
        setIsActive(false);
      } else {
        // Evita chamadas Supabase dentro do callback (anti-deadlock)
        setTimeout(() => {
          checkOwner();
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carregar conteúdo editável
  useEffect(() => {
    const loadContent = async () => {
      const { data } = await supabase
        .from('editable_content')
        .select('content_key, content_value');
      
      if (data) {
        const cache: Record<string, string> = {};
        data.forEach(item => {
          if (item.content_value) {
            cache[item.content_key] = item.content_value;
          }
        });
        setContentCache(cache);
      }
    };

    loadContent();
  }, []);

  // Atalho de teclado Ctrl+Shift+E
  useEffect(() => {
    if (!isOwner) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwner, isActive]);

  const toggle = useCallback(() => {
    if (!isOwner) {
      toast.error('Acesso negado');
      return;
    }
    setIsActive(prev => {
      const newState = !prev;
      if (newState) {
        toast.success('🔮 MODO DEUS ativado', {
          description: 'Clique em qualquer texto para editar'
        });
      } else {
        toast.info('MODO DEUS desativado');
      }
      return newState;
    });
  }, [isOwner]);

  const activate = useCallback(() => {
    if (isOwner && !isActive) {
      setIsActive(true);
      toast.success('🔮 MODO DEUS ativado');
    }
  }, [isOwner, isActive]);

  const deactivate = useCallback(() => {
    if (isActive) {
      setIsActive(false);
      toast.info('MODO DEUS desativado');
    }
  }, [isActive]);

  const getContent = useCallback((key: string, fallback = ''): string => {
    return contentCache[key] ?? fallback;
  }, [contentCache]);

  const updateContent = useCallback(async (key: string, value: string, type = 'text'): Promise<boolean> => {
    if (!isOwner) {
      toast.error('Sem permissão para editar');
      return false;
    }

    // Sanitizar HTML básico
    const sanitized = value
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');

    try {
      // Tentar atualizar
      const { error: updateError } = await supabase
        .from('editable_content')
        .update({ content_value: sanitized })
        .eq('content_key', key);

      if (updateError) {
        // Se não existir, criar
        const { error: insertError } = await supabase
          .from('editable_content')
          .insert({
            content_key: key,
            content_value: sanitized,
            content_type: type,
            page_key: key.split('_')[0] || 'global'
          });

        if (insertError) {
          toast.error('Erro ao salvar');
          return false;
        }
      }

      setContentCache(prev => ({ ...prev, [key]: sanitized }));
      toast.success('Conteúdo salvo!');
      return true;
    } catch (err) {
      toast.error('Erro ao salvar');
      return false;
    }
  }, [isOwner]);

  const getHistory = useCallback(async (key: string): Promise<any[]> => {
    if (!isOwner) return [];

    const { data } = await supabase
      .from('content_history')
      .select('*')
      .eq('content_key', key)
      .order('version', { ascending: false })
      .limit(20);

    return data || [];
  }, [isOwner]);

  const revertToVersion = useCallback(async (key: string, version: number): Promise<boolean> => {
    if (!isOwner) return false;

    const { data: historyItem } = await supabase
      .from('content_history')
      .select('old_value')
      .eq('content_key', key)
      .eq('version', version)
      .single();

    if (historyItem?.old_value) {
      return updateContent(key, historyItem.old_value);
    }

    return false;
  }, [isOwner, updateContent]);

  const value: GodModeContextType = {
    isOwner,
    isGodMode: isOwner,
    isActive,
    isLoading,
    toggle,
    activate,
    deactivate,
    getContent,
    updateContent,
    getHistory,
    revertToVersion,
  };

  return (
    <GodModeContext.Provider value={value}>
      {children}
    </GodModeContext.Provider>
  );
}

export function useGodMode() {
  const context = useContext(GodModeContext);
  if (!context) {
    throw new Error('useGodMode must be used within GodModeProvider');
  }
  return context;
}

export default GodModeContext;
