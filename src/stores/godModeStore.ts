// ============================================
// 👑 GOD MODE STORE — ZUSTAND (substitui GodModeContext)
// Estado global sem Provider = zero re-renders extras
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OWNER_EMAIL = 'moisesblank@gmail.com';

interface EditingElement {
  id: string;
  type: 'text' | 'image';
  element: HTMLElement;
  originalContent: string;
  contentKey?: string;
  rect: DOMRect;
}

interface GodModeStore {
  // Status
  isOwner: boolean;
  isActive: boolean;
  isLoading: boolean;
  
  // Elemento sendo editado
  editingElement: EditingElement | null;
  
  // Cache de conteúdo
  contentCache: Record<string, string>;
  
  // Ações
  checkOwner: () => Promise<void>;
  toggle: () => void;
  activate: () => void;
  deactivate: () => void;
  setEditingElement: (el: EditingElement | null) => void;
  
  // Conteúdo
  getContent: (key: string, fallback?: string) => string;
  updateContent: (key: string, value: string, type?: string) => Promise<boolean>;
  loadContent: () => Promise<void>;
}

export const useGodModeStore = create<GodModeStore>()(
  persist(
    (set, get) => ({
      isOwner: false,
      isActive: false,
      isLoading: true,
      editingElement: null,
      contentCache: {},
      
      checkOwner: async () => {
        set({ isLoading: true });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const isOwner = (user?.email || '').toLowerCase() === OWNER_EMAIL;
          set({ isOwner, isLoading: false });
        } catch {
          set({ isOwner: false, isLoading: false });
        }
      },
      
      toggle: () => {
        const { isOwner, isActive } = get();
        if (!isOwner) {
          toast.error('Acesso negado');
          return;
        }
        
        const newState = !isActive;
        set({ isActive: newState });
        
        if (newState) {
          toast.success('🔮 MODO MASTER ativado', {
            description: 'Clique em elementos para editar',
          });
        } else {
          toast.info('MODO MASTER desativado');
          set({ editingElement: null });
        }
      },
      
      activate: () => {
        const { isOwner, isActive } = get();
        if (isOwner && !isActive) {
          set({ isActive: true });
          toast.success('🔮 MODO MASTER ativado');
        }
      },
      
      deactivate: () => {
        const { isActive } = get();
        if (isActive) {
          set({ isActive: false, editingElement: null });
          toast.info('MODO MASTER desativado');
        }
      },
      
      setEditingElement: (el) => set({ editingElement: el }),
      
      getContent: (key, fallback = '') => {
        return get().contentCache[key] ?? fallback;
      },
      
      updateContent: async (key, value, type = 'text') => {
        const { isOwner } = get();
        if (!isOwner) return false;
        
        const sanitized = value
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/javascript:/gi, '');
        
        try {
          const { data: existing } = await supabase
            .from('editable_content')
            .select('id')
            .eq('content_key', key)
            .maybeSingle();
          
          if (existing) {
            await supabase
              .from('editable_content')
              .update({ content_value: sanitized, updated_at: new Date().toISOString() })
              .eq('content_key', key);
          } else {
            await supabase
              .from('editable_content')
              .insert({
                content_key: key,
                content_value: sanitized,
                content_type: type,
                page_key: window.location.pathname.replace(/\//g, '_') || 'global',
              });
          }
          
          set(state => ({
            contentCache: { ...state.contentCache, [key]: sanitized }
          }));
          
          toast.success('✅ Salvo!');
          return true;
        } catch (err) {
          toast.error('Erro ao salvar');
          return false;
        }
      },
      
      loadContent: async () => {
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
          set({ contentCache: cache });
        }
      },
    }),
    {
      name: 'godmode-storage',
      partialize: (state) => ({ isActive: state.isActive }),
    }
  )
);

// Hook de compatibilidade
export function useGodMode() {
  const store = useGodModeStore();
  
  return {
    isOwner: store.isOwner,
    isGodMode: store.isActive,
    isActive: store.isActive,
    isLoading: store.isLoading,
    editingElement: store.editingElement,
    setEditingElement: store.setEditingElement,
    toggle: store.toggle,
    activate: store.activate,
    deactivate: store.deactivate,
    getContent: store.getContent,
    updateContent: store.updateContent,
    saveDirectToElement: (element: HTMLElement, value: string) => {
      if (element.tagName === 'IMG') {
        (element as HTMLImageElement).src = value;
      } else {
        element.innerText = value;
      }
    },
    getHistory: async () => [],
    revertToVersion: async () => false,
    uploadImage: async () => null,
  };
}
