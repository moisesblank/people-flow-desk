// ============================================
// SYNAPSE v15.0 - MASTER MODE CONTEXT
// Context Provider para o MODO MASTER completo
// Edição em tempo real de textos e imagens
// Exclusivo para Owner: moisesblank@gmail.com
// ============================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OWNER_EMAIL = 'moisesblank@gmail.com';

interface EditingElement {
  id: string;
  type: 'text' | 'image';
  element: HTMLElement;
  originalContent: string;
  contentKey?: string;
}

interface GodModeContextType {
  // Status
  isOwner: boolean;
  isGodMode: boolean;
  isActive: boolean;
  isLoading: boolean;
  
  // Elemento sendo editado
  editingElement: EditingElement | null;
  setEditingElement: (el: EditingElement | null) => void;
  
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
  
  // Upload de imagem
  uploadImage: (key: string, file: File) => Promise<string | null>;
}

const GodModeContext = createContext<GodModeContextType | null>(null);

export function GodModeProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contentCache, setContentCache] = useState<Record<string, string>>({});
  const [editingElement, setEditingElement] = useState<EditingElement | null>(null);
  const clickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);

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

        if (isEmailOwner) {
          setIsOwner(true);

          try {
            const { data, error } = await supabase.rpc('is_owner');
            if (!error && data === false) {
              setIsOwner(false);
            }
          } catch {
            // Silencioso
          }
        } else {
          setIsOwner(false);
        }
      } catch {
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
        setTimeout(checkOwner, 0);
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

  // Handler de clique global para edição em tempo real
  useEffect(() => {
    if (!isOwner || !isActive) {
      // Remover handler se não estiver ativo
      if (clickHandlerRef.current) {
        document.removeEventListener('click', clickHandlerRef.current, true);
        clickHandlerRef.current = null;
      }
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Ignorar cliques no painel do God Mode e em botões/inputs
      if (
        target.closest('[data-godmode-panel]') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('[data-godmode-editing]')
      ) {
        return;
      }

      // Verificar se é um elemento editável
      const isImage = target.tagName === 'IMG';
      const isText = 
        target.tagName === 'H1' ||
        target.tagName === 'H2' ||
        target.tagName === 'H3' ||
        target.tagName === 'H4' ||
        target.tagName === 'H5' ||
        target.tagName === 'H6' ||
        target.tagName === 'P' ||
        target.tagName === 'SPAN' ||
        target.tagName === 'A' ||
        target.tagName === 'LABEL' ||
        target.tagName === 'LI' ||
        (target.tagName === 'DIV' && target.innerText && target.children.length === 0);

      if (isImage || isText) {
        e.preventDefault();
        e.stopPropagation();

        const contentKey = target.dataset.editableKey || `${target.tagName.toLowerCase()}_${Date.now()}`;

        setEditingElement({
          id: contentKey,
          type: isImage ? 'image' : 'text',
          element: target,
          originalContent: isImage ? (target as HTMLImageElement).src : target.innerText,
          contentKey,
        });
      }
    };

    clickHandlerRef.current = handleClick;
    document.addEventListener('click', handleClick, true);

    return () => {
      if (clickHandlerRef.current) {
        document.removeEventListener('click', clickHandlerRef.current, true);
        clickHandlerRef.current = null;
      }
    };
  }, [isOwner, isActive]);

  // Atalho de teclado Ctrl+Shift+E
  useEffect(() => {
    if (!isOwner) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        toggle();
      }
      // ESC para cancelar edição
      if (e.key === 'Escape' && editingElement) {
        setEditingElement(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwner, isActive, editingElement]);

  const toggle = useCallback(() => {
    if (!isOwner) {
      toast.error('Acesso negado');
      return;
    }
    setIsActive(prev => {
      const newState = !prev;
      if (newState) {
        toast.success('🔮 MODO MASTER ativado', {
          description: 'Clique em qualquer texto ou imagem para editar em tempo real'
        });
      } else {
        toast.info('MODO MASTER desativado');
        setEditingElement(null);
      }
      return newState;
    });
  }, [isOwner]);

  const activate = useCallback(() => {
    if (isOwner && !isActive) {
      setIsActive(true);
      toast.success('🔮 MODO MASTER ativado');
    }
  }, [isOwner, isActive]);

  const deactivate = useCallback(() => {
    if (isActive) {
      setIsActive(false);
      setEditingElement(null);
      toast.info('MODO MASTER desativado');
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
      // Verificar se existe
      const { data: existing } = await supabase
        .from('editable_content')
        .select('id')
        .eq('content_key', key)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from('editable_content')
          .update({ 
            content_value: sanitized,
            updated_at: new Date().toISOString()
          })
          .eq('content_key', key);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('editable_content')
          .insert({
            content_key: key,
            content_value: sanitized,
            content_type: type,
            page_key: key.split('_')[0] || 'global'
          });

        if (insertError) throw insertError;
      }

      setContentCache(prev => ({ ...prev, [key]: sanitized }));
      toast.success('✨ Conteúdo salvo!');
      return true;
    } catch (err) {
      console.error('Erro ao salvar:', err);
      toast.error('Erro ao salvar');
      return false;
    }
  }, [isOwner]);

  const uploadImage = useCallback(async (key: string, file: File): Promise<string | null> => {
    if (!isOwner) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `godmode/${key}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      await updateContent(key, publicUrl, 'image');

      toast.success('📷 Imagem atualizada!');
      return publicUrl;
    } catch (err) {
      console.error('Erro no upload:', err);
      toast.error('Erro ao fazer upload');
      return null;
    }
  }, [isOwner, updateContent]);

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
    editingElement,
    setEditingElement,
    toggle,
    activate,
    deactivate,
    getContent,
    updateContent,
    getHistory,
    revertToVersion,
    uploadImage,
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
