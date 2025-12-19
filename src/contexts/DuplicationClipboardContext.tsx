// ============================================
// MOISÉS MEDEIROS v11.0 - DUPLICATION CLIPBOARD CONTEXT
// Sistema de Área de Transferência para Duplicação
// Owner: moisesblank@gmail.com
// ============================================

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { DuplicableEntityType } from '@/hooks/useMasterDuplication';

interface ClipboardItem {
  id: string;
  entityType: DuplicableEntityType;
  entityName: string;
  originalId: string;
  data: Record<string, unknown>;
  copiedAt: Date;
}

interface DuplicationClipboardContextType {
  clipboardItem: ClipboardItem | null;
  setClipboardItem: (item: ClipboardItem | null) => void;
  clearClipboard: () => void;
  hasClipboardItem: boolean;
  copyToClipboard: (item: Omit<ClipboardItem, 'copiedAt'>) => void;
  pasteFromClipboard: () => ClipboardItem | null;
}

const DuplicationClipboardContext = createContext<DuplicationClipboardContextType | undefined>(undefined);

export function DuplicationClipboardProvider({ children }: { children: ReactNode }) {
  const [clipboardItem, setClipboardItemState] = useState<ClipboardItem | null>(null);

  const setClipboardItem = useCallback((item: ClipboardItem | null) => {
    setClipboardItemState(item);
  }, []);

  const clearClipboard = useCallback(() => {
    setClipboardItemState(null);
  }, []);

  const copyToClipboard = useCallback((item: Omit<ClipboardItem, 'copiedAt'>) => {
    const newItem: ClipboardItem = {
      ...item,
      copiedAt: new Date()
    };
    setClipboardItemState(newItem);
    
    toast.success('📋 Item copiado!', {
      description: `"${item.entityName}" copiado para área de transferência. Use Ctrl+V para colar ou arraste.`,
      duration: 5000,
      action: {
        label: 'Ver',
        onClick: () => {}
      }
    });
  }, []);

  const pasteFromClipboard = useCallback(() => {
    if (clipboardItem) {
      toast.success('✅ Item colado!', {
        description: `"${clipboardItem.entityName}" foi inserido.`
      });
      return clipboardItem;
    }
    return null;
  }, [clipboardItem]);

  // Listener para Ctrl+V global
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardItem) {
        // Não interceptar se estiver em um input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        
        e.preventDefault();
        pasteFromClipboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clipboardItem, pasteFromClipboard]);

  return (
    <DuplicationClipboardContext.Provider
      value={{
        clipboardItem,
        setClipboardItem,
        clearClipboard,
        hasClipboardItem: !!clipboardItem,
        copyToClipboard,
        pasteFromClipboard
      }}
    >
      {children}
    </DuplicationClipboardContext.Provider>
  );
}

export function useDuplicationClipboard() {
  const context = useContext(DuplicationClipboardContext);
  if (!context) {
    throw new Error('useDuplicationClipboard must be used within DuplicationClipboardProvider');
  }
  return context;
}
