// ============================================
// MOISÉS MEDEIROS v16.0 - MASTER DELETE OVERLAY
// Overlay de exclusão que aparece ao clicar em itens
// no Modo Master - Exclusão permanente em cascata
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Loader2, X, Edit, Copy, Check, Zap } from 'lucide-react';
import { useGodMode } from '@/stores/godModeStore';
import { useMasterRemove } from '@/hooks/useMasterRemove';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SelectedItem {
  element: HTMLElement;
  entityType: string;
  entityId: string;
  entityName: string;
  rect: DOMRect;
}

// Detectar tipo e ID da entidade baseado no elemento
function detectEntityFromElement(element: HTMLElement): { type: string; id: string; name: string } | null {
  // Procurar data attributes
  const entityType = element.dataset.entityType || element.closest('[data-entity-type]')?.getAttribute('data-entity-type');
  const entityId = element.dataset.entityId || element.closest('[data-entity-id]')?.getAttribute('data-entity-id');
  const entityName = element.dataset.entityName || element.closest('[data-entity-name]')?.getAttribute('data-entity-name');
  
  if (entityType && entityId) {
    return { type: entityType, id: entityId, name: entityName || 'Item' };
  }

  // Detectar por estrutura do elemento
  const card = element.closest('[class*="card"]');
  const row = element.closest('tr');
  const listItem = element.closest('li');
  
  // Verificar IDs em estruturas comuns
  if (row) {
    const rowId = row.getAttribute('data-row-id') || row.id;
    const rowType = row.getAttribute('data-type') || 'row';
    if (rowId) {
      return { type: rowType, id: rowId, name: row.textContent?.slice(0, 30) || 'Item' };
    }
  }

  if (card) {
    const cardId = card.getAttribute('data-id') || card.id;
    const cardType = card.getAttribute('data-type') || 'card';
    if (cardId) {
      return { type: cardType, id: cardId, name: card.querySelector('h1,h2,h3,h4,h5,h6')?.textContent?.slice(0, 30) || 'Item' };
    }
  }

  if (listItem) {
    const itemId = listItem.getAttribute('data-id') || listItem.id;
    const itemType = listItem.getAttribute('data-type') || 'item';
    if (itemId) {
      return { type: itemType, id: itemId, name: listItem.textContent?.slice(0, 30) || 'Item' };
    }
  }

  return null;
}

export const MasterDeleteOverlay = forwardRef<HTMLDivElement, Record<string, never>>(function MasterDeleteOverlay(_props, ref) {
  const { isOwner, isActive } = useGodMode();
  const { removeEntity, getRemovePreview, isRemoving } = useMasterRemove();
  
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [preview, setPreview] = useState<{
    entityName: string;
    affectedItems: string[];
    totalItems: number;
  } | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ x: number; y: number } | null>(null);
  
  const overlayRef = useRef<HTMLDivElement>(null);

  // Listener para SHIFT + Clique para exclusão rápida
  useEffect(() => {
    if (!isOwner || !isActive) return;

    const handleShiftClick = (e: MouseEvent) => {
      // Só ativa com SHIFT pressionado
      if (!e.shiftKey) return;
      
      const target = e.target as HTMLElement;
      
      // Ignorar elementos do sistema
      if (
        target.closest('[data-godmode-panel]') ||
        target.closest('[data-master-menu]') ||
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('.godmode-indicator') ||
        target.closest('[role="dialog"]')
      ) return;

      const entity = detectEntityFromElement(target);
      
      if (entity && entity.id) {
        e.preventDefault();
        e.stopPropagation();
        
        const rect = target.getBoundingClientRect();
        
        setSelectedItem({
          element: target,
          entityType: entity.type,
          entityId: entity.id,
          entityName: entity.name,
          rect
        });
        
        setActionMenuPosition({
          x: e.clientX,
          y: e.clientY
        });
        
        // Destacar elemento
        target.style.outline = '3px solid hsl(0 84% 60%)';
        target.style.outlineOffset = '2px';
        
        console.log('🗑️ [MasterDelete] Item selecionado para exclusão:', entity);
      }
    };

    // Listener de tecla DELETE
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedItem) {
        e.preventDefault();
        handleShowDeleteConfirm();
      }
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    document.addEventListener('click', handleShiftClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleShiftClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOwner, isActive, selectedItem]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        // Não limpar se clicou em diálogo
        if ((e.target as HTMLElement).closest('[role="dialog"]')) return;
        clearSelection();
      }
    };

    if (selectedItem) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedItem]);

  const clearSelection = useCallback(() => {
    if (selectedItem?.element) {
      selectedItem.element.style.outline = '';
      selectedItem.element.style.outlineOffset = '';
    }
    setSelectedItem(null);
    setActionMenuPosition(null);
    setPreview(null);
  }, [selectedItem]);

  const handleShowDeleteConfirm = useCallback(async () => {
    if (!selectedItem) return;
    
    const previewData = await getRemovePreview(selectedItem.entityType, selectedItem.entityId);
    setPreview(previewData);
    setShowDeleteConfirm(true);
    setActionMenuPosition(null);
  }, [selectedItem, getRemovePreview]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedItem) return;
    
    const result = await removeEntity(selectedItem.entityType, selectedItem.entityId);
    
    if (result.success) {
      // Remover elemento visual se ainda existir
      if (selectedItem.element && selectedItem.element.parentNode) {
        selectedItem.element.style.transition = 'opacity 0.3s, transform 0.3s';
        selectedItem.element.style.opacity = '0';
        selectedItem.element.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
          if (selectedItem.element.parentNode) {
            selectedItem.element.remove();
          }
        }, 300);
      }
      
      setShowDeleteConfirm(false);
      clearSelection();
    }
  }, [selectedItem, removeEntity, clearSelection]);

  if (!isOwner || !isActive) return null;

  return (
    <div ref={ref}>
      {/* Menu de ações flutuante */}
      <AnimatePresence>
        {actionMenuPosition && selectedItem && (
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[99999] bg-background/95 backdrop-blur-xl border border-destructive/50 rounded-xl shadow-2xl overflow-hidden"
            style={{
              left: Math.min(actionMenuPosition.x, window.innerWidth - 200),
              top: Math.min(actionMenuPosition.y, window.innerHeight - 150),
              boxShadow: '0 0 40px hsl(0 84% 60% / 0.3)'
            }}
          >
            {/* Header */}
            <div className="px-3 py-2 bg-gradient-to-r from-destructive/20 to-red-500/20 border-b border-destructive/20 flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-destructive flex items-center gap-1">
                <Zap className="w-3 h-3" />
                EXCLUSÃO RÁPIDA
              </span>
              <button
                onClick={clearSelection}
                className="p-1 hover:bg-destructive/20 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="p-2 min-w-[180px]">
              <div className="px-2 py-1 mb-2 text-xs text-muted-foreground truncate max-w-[200px]">
                {selectedItem.entityName}
              </div>

              {/* Botão Excluir */}
              <button
                onClick={handleShowDeleteConfirm}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-destructive/10 rounded-lg transition-all text-destructive"
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">Excluir Permanentemente</span>
              </button>

              <div className="mt-2 pt-2 border-t border-border/50">
                <div className="px-2 text-[10px] text-muted-foreground">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Delete</kbd> para confirmar
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog de confirmação */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="border-destructive/50 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão Permanente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a excluir <strong className="text-foreground">"{preview?.entityName || selectedItem?.entityName}"</strong>.
              </p>
              
              {preview && preview.affectedItems.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-2">
                  <p className="font-medium text-destructive mb-2 text-sm">
                    ⚠️ Itens que serão removidos permanentemente:
                  </p>
                  <ul className="text-sm space-y-1 max-h-[200px] overflow-y-auto">
                    {preview.affectedItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                        <span className="w-1.5 h-1.5 bg-destructive rounded-full flex-shrink-0" />
                        <span className="truncate">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-destructive/20">
                    Total: <strong>{preview.totalItems}</strong> item(ns) em cascata
                  </p>
                </div>
              )}

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-2">
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                  ⚡ Esta ação remove de TODAS as tabelas relacionadas, cruzamentos e referências no banco de dados.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving} onClick={clearSelection}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isRemoving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Tudo
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Instrução flutuante quando modo master ativo */}
      {isActive && !selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 right-4 z-[9998] bg-background/80 backdrop-blur-sm border border-primary/20 rounded-lg px-3 py-2 text-xs text-muted-foreground"
        >
          <span className="text-primary font-medium">SHIFT + Clique</span> para excluir item
        </motion.div>
      )}
    </div>
  );
});

MasterDeleteOverlay.displayName = 'MasterDeleteOverlay';
export default MasterDeleteOverlay;