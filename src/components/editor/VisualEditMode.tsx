// ============================================
// SYNAPSE v14.0 - VISUAL EDIT MODE
// Sistema de edição visual inline estilo Elementor
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGodMode } from '@/contexts/GodModeContext';
import { X, Check, Type, Image, Link, Undo, Redo, Eye, EyeOff, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EditableElement {
  element: HTMLElement;
  type: 'text' | 'image' | 'link';
  originalValue: string;
  key: string;
}

export function VisualEditMode() {
  const { isActive, isOwner, updateContent, getContent } = useGodMode();
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);

  // Detectar elementos editáveis
  const detectEditableElements = useCallback(() => {
    if (!isActive || !isOwner) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Ignorar cliques no painel de edição
      if (target.closest('.visual-edit-panel') || target.closest('.god-mode-panel')) {
        return;
      }

      // Verificar se é um elemento editável
      const editableAttr = target.getAttribute('data-editable');
      const editableKey = target.getAttribute('data-editable-key');
      
      if (editableAttr === 'true' || editableKey) {
        e.preventDefault();
        e.stopPropagation();
        
        let type: 'text' | 'image' | 'link' = 'text';
        let value = '';
        
        if (target.tagName === 'IMG') {
          type = 'image';
          value = (target as HTMLImageElement).src;
        } else if (target.tagName === 'A') {
          type = 'link';
          value = (target as HTMLAnchorElement).href;
        } else {
          type = 'text';
          value = target.innerText || target.textContent || '';
        }

        setSelectedElement({
          element: target,
          type,
          originalValue: value,
          key: editableKey || `inline_${Date.now()}`
        });
        setEditValue(value);
        setIsEditing(true);
      } else {
        // Se clicar em qualquer texto/imagem, perguntar se quer editar
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'IMG'].includes(target.tagName)) {
          const value = target.tagName === 'IMG' 
            ? (target as HTMLImageElement).src 
            : target.innerText || '';
          
          if (value) {
            e.preventDefault();
            e.stopPropagation();
            
            setSelectedElement({
              element: target,
              type: target.tagName === 'IMG' ? 'image' : target.tagName === 'A' ? 'link' : 'text',
              originalValue: value,
              key: `dynamic_${target.tagName.toLowerCase()}_${Date.now()}`
            });
            setEditValue(value);
            setIsEditing(true);
          }
        }
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.visual-edit-panel') || target.closest('.god-mode-panel')) {
        return;
      }
      
      if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'IMG', 'BUTTON'].includes(target.tagName)) {
        setHoveredElement(target);
        target.style.outline = '2px dashed hsl(280, 80%, 50%)';
        target.style.outlineOffset = '2px';
        target.style.cursor = 'pointer';
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (hoveredElement === target) {
        target.style.outline = '';
        target.style.outlineOffset = '';
        target.style.cursor = '';
        setHoveredElement(null);
      }
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
    };
  }, [isActive, isOwner, hoveredElement]);

  useEffect(() => {
    const cleanup = detectEditableElements();
    return cleanup;
  }, [detectEditableElements]);

  // Limpar hover quando desativar
  useEffect(() => {
    if (!isActive && hoveredElement) {
      hoveredElement.style.outline = '';
      hoveredElement.style.outlineOffset = '';
      hoveredElement.style.cursor = '';
      setHoveredElement(null);
    }
  }, [isActive, hoveredElement]);

  const handleSave = async () => {
    if (!selectedElement) return;

    try {
      // Aplicar mudança visual imediata
      if (selectedElement.type === 'text') {
        selectedElement.element.innerText = editValue;
      } else if (selectedElement.type === 'image') {
        (selectedElement.element as HTMLImageElement).src = editValue;
      } else if (selectedElement.type === 'link') {
        (selectedElement.element as HTMLAnchorElement).href = editValue;
      }

      // Salvar no banco se tiver key
      if (selectedElement.key.startsWith('inline_') || selectedElement.key.startsWith('dynamic_')) {
        // Edição temporária apenas visual
        toast.success('Alteração aplicada!', {
          description: 'Esta é uma edição visual temporária'
        });
      } else {
        await updateContent(selectedElement.key, editValue, selectedElement.type);
      }

      setIsEditing(false);
      setSelectedElement(null);
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const handleCancel = () => {
    if (selectedElement) {
      // Reverter mudança
      if (selectedElement.type === 'text') {
        selectedElement.element.innerText = selectedElement.originalValue;
      } else if (selectedElement.type === 'image') {
        (selectedElement.element as HTMLImageElement).src = selectedElement.originalValue;
      } else if (selectedElement.type === 'link') {
        (selectedElement.element as HTMLAnchorElement).href = selectedElement.originalValue;
      }
    }
    setIsEditing(false);
    setSelectedElement(null);
  };

  if (!isActive || !isOwner) return null;

  return (
    <AnimatePresence>
      {isEditing && selectedElement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] visual-edit-panel"
        >
          <div 
            className="bg-background/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-2xl p-4 min-w-[400px] max-w-[600px]"
            style={{
              boxShadow: '0 0 40px rgba(147, 51, 234, 0.3)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                {selectedElement.type === 'text' && <Type className="w-5 h-5 text-primary" />}
                {selectedElement.type === 'image' && <Image className="w-5 h-5 text-primary" />}
                {selectedElement.type === 'link' && <Link className="w-5 h-5 text-primary" />}
                <span className="font-semibold text-foreground">
                  Editar {selectedElement.type === 'text' ? 'Texto' : selectedElement.type === 'image' ? 'Imagem' : 'Link'}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Editor */}
            <div className="space-y-4">
              {selectedElement.type === 'text' ? (
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Digite o novo texto..."
                  className="min-h-[100px] bg-muted/50 border-border focus:border-primary"
                  autoFocus
                />
              ) : (
                <Input
                  type={selectedElement.type === 'image' ? 'url' : 'url'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={selectedElement.type === 'image' ? 'URL da imagem...' : 'URL do link...'}
                  className="bg-muted/50 border-border focus:border-primary"
                  autoFocus
                />
              )}

              {/* Preview para imagens */}
              {selectedElement.type === 'image' && editValue && (
                <div className="rounded-lg overflow-hidden bg-muted/30 p-2">
                  <img 
                    src={editValue} 
                    alt="Preview" 
                    className="max-h-32 mx-auto rounded object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
              >
                <Check className="w-4 h-4 mr-2" />
                Aplicar
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VisualEditMode;
