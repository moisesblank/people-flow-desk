// ============================================
// 👑 GOD MODE STORE — ZUSTAND (substitui GodModeContext)
// Estado global sem Provider = zero re-renders extras
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OWNER_EMAIL = 'moisesblank@gmail.com';

/**
 * 🔧 CORREÇÃO P0: Aplicar conteúdo salvo de volta ao DOM
 * Procura elementos com data-editable-key ou reconstrói XPath
 */
function applyContentToDOM(cache: Record<string, string>) {
  const currentPageKey = window.location.pathname.replace(/\//g, '_') || 'global';
  
  Object.entries(cache).forEach(([key, value]) => {
    // Verificar se a key pertence a esta página
    if (!key.startsWith(currentPageKey + '_') && !key.includes('#')) {
      return;
    }
    
    // 1. Tentar encontrar por data-editable-key
    const byDataKey = document.querySelector(`[data-editable-key="${key}"]`);
    if (byDataKey) {
      if (byDataKey.tagName === 'IMG') {
        (byDataKey as HTMLImageElement).src = value;
      } else {
        byDataKey.textContent = value;
      }
      console.log('[GodModeStore] ✅ Aplicado por data-key:', key);
      return;
    }
    
    // 2. Tentar encontrar por ID
    if (key.includes('#')) {
      const idMatch = key.match(/#([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        const byId = document.getElementById(idMatch[1]);
        if (byId) {
          if (byId.tagName === 'IMG') {
            (byId as HTMLImageElement).src = value;
          } else {
            byId.textContent = value;
          }
          console.log('[GodModeStore] ✅ Aplicado por ID:', idMatch[1]);
          return;
        }
      }
    }
    
    // 3. Para XPath-based keys, tentar reconstruir o caminho
    const xpath = key.replace(currentPageKey + '_', '');
    if (xpath.includes('>')) {
      try {
        const element = resolveXPathToElement(xpath);
        if (element) {
          if (element.tagName === 'IMG') {
            (element as HTMLImageElement).src = value;
          } else {
            element.textContent = value;
          }
          console.log('[GodModeStore] ✅ Aplicado por XPath:', xpath);
        }
      } catch {
        // XPath não encontrado, ok - elemento pode ter mudado
      }
    }
  });
}

/**
 * Resolver XPath simplificado de volta para elemento
 */
function resolveXPathToElement(xpath: string): HTMLElement | null {
  const parts = xpath.split('>');
  let current: HTMLElement = document.body;
  
  for (const part of parts) {
    // Parse: tag.class[index] ou tag#id ou tag[index]
    const match = part.match(/^(\w+)(?:\.([a-zA-Z0-9-_]+))?(?:#([a-zA-Z0-9-_]+))?\[(\d+)\]$/);
    if (!match) continue;
    
    const [, tag, className, id, indexStr] = match;
    const index = parseInt(indexStr, 10);
    
    if (id) {
      const byId = document.getElementById(id);
      if (byId) {
        current = byId;
        continue;
      }
    }
    
    // Encontrar filho pelo índice
    const children = Array.from(current.children).filter(c => 
      c.tagName.toLowerCase() === tag &&
      (!className || c.className.includes(className))
    );
    
    if (children[index]) {
      current = children[index] as HTMLElement;
    } else {
      return null;
    }
  }
  
  return current !== document.body ? current : null;
}

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
          .select('content_key, content_value, page_key');
        
        if (data) {
          const cache: Record<string, string> = {};
          data.forEach(item => {
            if (item.content_value) {
              cache[item.content_key] = item.content_value;
            }
          });
          set({ contentCache: cache });
          
          // 🔧 FIX P0: Aplicar conteúdo salvo ao DOM após carregamento
          setTimeout(() => {
            applyContentToDOM(cache);
          }, 500);
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
    uploadImage: async (key: string, file: File) => {
      if (!store.isOwner) return null;
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `godmode/${key.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('avatars')
          .createSignedUrl(fileName, 31536000);
        if (signedUrlError) throw signedUrlError;

        // Guardar path (não URL) para manter LEI VII e permitir revalidação
        await store.updateContent(key, fileName, 'image');

        return signedUrlData?.signedUrl || fileName;
      } catch {
        toast.error('Erro ao fazer upload');
        return null;
      }
    },
  };
}
