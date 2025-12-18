// ============================================
// SYNAPSE v16.0 - MASTER MODE CONTEXT ULTIMATE
// Context Provider para o MODO MASTER completo
// Edição em tempo real de QUALQUER elemento
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
  rect: DOMRect;
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
  saveDirectToElement: (element: HTMLElement, value: string) => void;
  
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
  const hoverStylesRef = useRef<Map<HTMLElement, string>>(new Map());

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

  // Adicionar estilos de hover nos elementos editáveis
  const addHoverStyles = useCallback(() => {
    if (!isActive || !isOwner) return;

    const styleId = 'godmode-hover-styles';
    let styleEl = document.getElementById(styleId);
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      body.godmode-active h1:hover,
      body.godmode-active h2:hover,
      body.godmode-active h3:hover,
      body.godmode-active h4:hover,
      body.godmode-active h5:hover,
      body.godmode-active h6:hover,
      body.godmode-active p:hover,
      body.godmode-active span:hover,
      body.godmode-active label:hover,
      body.godmode-active li:hover,
      body.godmode-active a:not([data-godmode-panel] *):hover,
      body.godmode-active img:not([data-godmode-panel] *):hover,
      body.godmode-active div[class*="text"]:hover {
        outline: 2px dashed hsl(280 80% 50%) !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
        position: relative;
      }
      
      body.godmode-active h1:hover::after,
      body.godmode-active h2:hover::after,
      body.godmode-active h3:hover::after,
      body.godmode-active p:hover::after,
      body.godmode-active span:hover::after,
      body.godmode-active img:hover::after {
        content: '✏️ Clique para editar (ALT em links/botões)';
        position: absolute;
        top: -24px;
        left: 0;
        font-size: 10px;
        background: hsl(280 80% 50%);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        z-index: 10000;
        font-weight: normal;
        pointer-events: none;
      }
      
      body.godmode-active [data-godmode-editing="true"] {
        outline: 3px solid hsl(280 80% 50%) !important;
        outline-offset: 3px !important;
      }
      
      .godmode-indicator {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background: linear-gradient(135deg, hsl(280 80% 50%), hsl(300 80% 60%));
        color: white;
        padding: 8px 16px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4);
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;

    document.body.classList.add('godmode-active');
  }, [isActive, isOwner]);

  const removeHoverStyles = useCallback(() => {
    const styleEl = document.getElementById('godmode-hover-styles');
    if (styleEl) {
      styleEl.remove();
    }
    document.body.classList.remove('godmode-active');
  }, []);

  useEffect(() => {
    if (isActive && isOwner) {
      addHoverStyles();
    } else {
      removeHoverStyles();
    }

    return () => removeHoverStyles();
  }, [isActive, isOwner, addHoverStyles, removeHoverStyles]);

  // Handler de clique global para edição em tempo real
  useEffect(() => {
    if (!isOwner || !isActive) {
      if (clickHandlerRef.current) {
        document.removeEventListener('click', clickHandlerRef.current, true);
        clickHandlerRef.current = null;
      }
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Elemento explicitamente marcável (preferência máxima)
      const explicitEditable = target.closest('[data-editable-key]') as HTMLElement | null;
      const candidate = explicitEditable ?? target;

      const isInsideGodModeUi =
        candidate.closest('[data-godmode-panel]') ||
        candidate.closest('[data-godmode-editing]') ||
        candidate.closest('[data-radix-popper-content-wrapper]') ||
        candidate.closest('.godmode-indicator');

      if (isInsideGodModeUi) return;

      // Se for um elemento de navegação/ação, só editar com ALT pressionado
      const isInteractive = !!candidate.closest('a, button, [role="button"], [data-sidebar="menu-button"]');
      if (isInteractive && !e.altKey && !explicitEditable) {
        return;
      }

      // Verificar se é um elemento editável
      const elementToEdit = explicitEditable ?? candidate;
      const isImage = elementToEdit.tagName === 'IMG';
      const isText =
        elementToEdit.tagName === 'H1' ||
        elementToEdit.tagName === 'H2' ||
        elementToEdit.tagName === 'H3' ||
        elementToEdit.tagName === 'H4' ||
        elementToEdit.tagName === 'H5' ||
        elementToEdit.tagName === 'H6' ||
        elementToEdit.tagName === 'P' ||
        elementToEdit.tagName === 'SPAN' ||
        elementToEdit.tagName === 'A' ||
        elementToEdit.tagName === 'LABEL' ||
        elementToEdit.tagName === 'LI' ||
        elementToEdit.tagName === 'TD' ||
        elementToEdit.tagName === 'TH' ||
        elementToEdit.tagName === 'STRONG' ||
        elementToEdit.tagName === 'EM' ||
        elementToEdit.tagName === 'B' ||
        elementToEdit.tagName === 'I' ||
        (elementToEdit.tagName === 'DIV' && elementToEdit.innerText);

      if (isImage || isText) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const rect = elementToEdit.getBoundingClientRect();
        
        // Priorizar data-editable-key, depois id, depois gerar um baseado no conteúdo
        const dataKey = (elementToEdit as HTMLElement).dataset.editableKey;
        const elementId = elementToEdit.id;
        const textContent = elementToEdit.innerText || '';
        
        let contentKey: string;
        if (dataKey) {
          contentKey = dataKey;
        } else if (elementId) {
          contentKey = elementId;
        } else {
          // Gerar key única baseada no conteúdo e posição
          const sanitizedText = textContent.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          contentKey = `${elementToEdit.tagName.toLowerCase()}_${sanitizedText}_${Date.now()}`;
        }
        
        console.log('🔮 Elemento selecionado para edição:', {
          tagName: elementToEdit.tagName,
          dataKey,
          elementId,
          contentKey,
          text: textContent.slice(0, 50)
        });

        setEditingElement({
          id: contentKey,
          type: isImage ? 'image' : 'text',
          element: elementToEdit,
          originalContent: isImage ? (elementToEdit as HTMLImageElement).src : textContent,
          contentKey,
          rect,
        });

        elementToEdit.setAttribute('data-godmode-editing', 'true');
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

  // Limpar highlight quando elemento de edição muda
  useEffect(() => {
    return () => {
      document.querySelectorAll('[data-godmode-editing]').forEach(el => {
        el.removeAttribute('data-godmode-editing');
      });
    };
  }, [editingElement]);

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
        editingElement.element.removeAttribute('data-godmode-editing');
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
          description: 'Clique em qualquer texto ou imagem para editar',
          duration: 4000,
        });
      } else {
        toast.info('MODO MASTER desativado');
        setEditingElement(null);
        document.querySelectorAll('[data-godmode-editing]').forEach(el => {
          el.removeAttribute('data-godmode-editing');
        });
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
      document.querySelectorAll('[data-godmode-editing]').forEach(el => {
        el.removeAttribute('data-godmode-editing');
      });
      toast.info('MODO MASTER desativado');
    }
  }, [isActive]);

  const getContent = useCallback((key: string, fallback = ''): string => {
    return contentCache[key] ?? fallback;
  }, [contentCache]);

  // Salvar diretamente no elemento (para edição em tempo real)
  const saveDirectToElement = useCallback((element: HTMLElement, value: string) => {
    if (element.tagName === 'IMG') {
      (element as HTMLImageElement).src = value;
    } else {
      element.innerText = value;
    }
  }, []);

  const updateContent = useCallback(async (key: string, value: string, type = 'text'): Promise<boolean> => {
    console.log('🔮 updateContent chamado:', { key, value, type, isOwner });
    
    if (!isOwner) {
      console.warn('❌ Sem permissão - isOwner:', isOwner);
      toast.error('Sem permissão para editar');
      return false;
    }

    // Sanitizar HTML básico
    const sanitized = value
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');

    try {
      console.log('📝 Salvando no banco...', { key, sanitized });
      
      // Verificar se existe
      const { data: existing, error: selectError } = await supabase
        .from('editable_content')
        .select('id')
        .eq('content_key', key)
        .maybeSingle();

      if (selectError) {
        console.error('Erro ao verificar existência:', selectError);
      }

      if (existing) {
        console.log('📝 Atualizando registro existente:', existing.id);
        const { error: updateError } = await supabase
          .from('editable_content')
          .update({ 
            content_value: sanitized,
            updated_at: new Date().toISOString()
          })
          .eq('content_key', key);

        if (updateError) {
          console.error('Erro no update:', updateError);
          throw updateError;
        }
        console.log('✅ Update realizado com sucesso!');
      } else {
        console.log('📝 Inserindo novo registro...');
        const { error: insertError } = await supabase
          .from('editable_content')
          .insert({
            content_key: key,
            content_value: sanitized,
            content_type: type,
            page_key: window.location.pathname.replace(/\//g, '_') || 'global'
          });

        if (insertError) {
          console.error('Erro no insert:', insertError);
          throw insertError;
        }
        console.log('✅ Insert realizado com sucesso!');
      }

      setContentCache(prev => ({ ...prev, [key]: sanitized }));
      toast.success('✨ Salvo com sucesso!', {
        description: `Conteúdo "${key}" atualizado`,
        duration: 3000
      });
      return true;
    } catch (err: any) {
      console.error('❌ Erro ao salvar:', err);
      toast.error('Erro ao salvar', {
        description: err?.message || 'Tente novamente'
      });
      return false;
    }
  }, [isOwner]);

  const uploadImage = useCallback(async (key: string, file: File): Promise<string | null> => {
    if (!isOwner) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `godmode/${key.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.${fileExt}`;

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
    saveDirectToElement,
    getHistory,
    revertToVersion,
    uploadImage,
  };

  return (
    <GodModeContext.Provider value={value}>
      {children}
      {/* Indicador visual quando ativo */}
      {isActive && isOwner && (
        <div className="godmode-indicator" data-godmode-panel="true">
          🔮 MODO MASTER ATIVO
        </div>
      )}
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
