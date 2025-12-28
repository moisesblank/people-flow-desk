// ============================================
// 📋 CLIPBOARD STORE — ZUSTAND (substitui DuplicationClipboardContext)
// Sem Provider, sem aninhamento, sem re-renders extras
// ============================================

import { create } from 'zustand';
import { toast } from 'sonner';
import type { DuplicableEntityType } from '@/hooks/useMasterDuplication';

interface ClipboardItem {
  id: string;
  entityType: DuplicableEntityType;
  entityName: string;
  originalId: string;
  data: Record<string, unknown>;
  copiedAt: Date;
}

interface ClipboardStore {
  item: ClipboardItem | null;
  hasItem: boolean;
  
  // Ações
  copy: (item: Omit<ClipboardItem, 'copiedAt'>) => void;
  paste: () => ClipboardItem | null;
  clear: () => void;
}

export const useClipboardStore = create<ClipboardStore>((set, get) => ({
  item: null,
  hasItem: false,
  
  copy: (item) => {
    const newItem: ClipboardItem = {
      ...item,
      copiedAt: new Date()
    };
    
    set({ item: newItem, hasItem: true });
    
    toast.success('📋 Item copiado!', {
      description: `"${item.entityName}" copiado. Use Ctrl+V para colar.`,
      duration: 3000,
    });
  },
  
  paste: () => {
    const { item } = get();
    if (item) {
      toast.success('✅ Item colado!', {
        description: `"${item.entityName}" inserido.`
      });
    }
    return item;
  },
  
  clear: () => set({ item: null, hasItem: false }),
}));

// Hook de compatibilidade (para transição suave)
export function useDuplicationClipboard() {
  const item = useClipboardStore(s => s.item);
  const hasItem = useClipboardStore(s => s.hasItem);
  const copy = useClipboardStore(s => s.copy);
  const paste = useClipboardStore(s => s.paste);
  const clear = useClipboardStore(s => s.clear);
  
  return {
    clipboardItem: item,
    setClipboardItem: (newItem: ClipboardItem | null) => newItem ? copy(newItem) : clear(),
    clearClipboard: clear,
    hasClipboardItem: hasItem,
    copyToClipboard: copy,
    pasteFromClipboard: paste,
  };
}
