// ============================================
// SYNAPSE v15.0 - INLINE EDITOR
// Editor flutuante para edição em tempo real
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Upload, RotateCcw, Type, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGodMode } from '@/contexts/GodModeContext';
import { cn } from '@/lib/utils';

export function InlineEditor() {
  const { 
    editingElement, 
    setEditingElement, 
    updateContent, 
    uploadImage,
    isActive 
  } = useGodMode();
  
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Posicionar editor próximo ao elemento
  useEffect(() => {
    if (editingElement?.element) {
      const rect = editingElement.element.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      setPosition({
        top: rect.top + scrollY - 10,
        left: Math.max(10, rect.left + scrollX),
      });
      
      setValue(editingElement.originalContent);
      
      // Focar no input após um pequeno delay
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);

      // Adicionar highlight ao elemento
      editingElement.element.style.outline = '3px solid hsl(280 80% 50%)';
      editingElement.element.style.outlineOffset = '2px';
    }

    return () => {
      if (editingElement?.element) {
        editingElement.element.style.outline = '';
        editingElement.element.style.outlineOffset = '';
      }
    };
  }, [editingElement]);

  const handleSave = useCallback(async () => {
    if (!editingElement) return;
    
    setIsSaving(true);
    try {
      const success = await updateContent(
        editingElement.contentKey || editingElement.id, 
        value, 
        editingElement.type
      );
      
      if (success && editingElement.element) {
        // Atualizar elemento na página em tempo real
        if (editingElement.type === 'text') {
          editingElement.element.innerText = value;
        }
      }
      
      setEditingElement(null);
    } finally {
      setIsSaving(false);
    }
  }, [editingElement, value, updateContent, setEditingElement]);

  const handleCancel = useCallback(() => {
    setEditingElement(null);
  }, [setEditingElement]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && editingElement?.type === 'text') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel, editingElement]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingElement) return;

    setIsSaving(true);
    try {
      const newUrl = await uploadImage(
        editingElement.contentKey || editingElement.id, 
        file
      );
      
      if (newUrl && editingElement.element) {
        (editingElement.element as HTMLImageElement).src = newUrl;
      }
      
      setEditingElement(null);
    } finally {
      setIsSaving(false);
    }
  }, [editingElement, uploadImage, setEditingElement]);

  if (!isActive || !editingElement) return null;

  const isMultiline = editingElement.originalContent.length > 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        className="fixed z-[10000] max-w-md"
        style={{
          top: position.top,
          left: position.left,
        }}
        data-godmode-editing="true"
      >
        <div 
          className="bg-background/95 backdrop-blur-xl border-2 border-primary/50 rounded-xl shadow-2xl p-4 space-y-3"
          style={{
            boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              {editingElement.type === 'text' ? (
                <>
                  <Type className="h-4 w-4" />
                  Editar Texto
                </>
              ) : (
                <>
                  <Image className="h-4 w-4" />
                  Editar Imagem
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Editor de Texto */}
          {editingElement.type === 'text' && (
            <>
              {isMultiline ? (
                <Textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={4}
                  className="min-w-[300px] resize-none focus:ring-2 focus:ring-primary"
                  placeholder="Digite o novo texto..."
                />
              ) : (
                <Input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-w-[300px] focus:ring-2 focus:ring-primary"
                  placeholder="Digite o novo texto..."
                />
              )}
            </>
          )}

          {/* Editor de Imagem */}
          {editingElement.type === 'image' && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-secondary/50 p-2">
                <img 
                  src={editingElement.originalContent} 
                  alt="Preview"
                  className="max-h-32 w-auto mx-auto rounded"
                />
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
              >
                <Upload className="h-4 w-4" />
                Escolher nova imagem
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Botões de ação */}
          {editingElement.type === 'text' && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setValue(editingElement.originalContent)}
                disabled={isSaving}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Restaurar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90"
              >
                {isSaving ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Dica */}
          <p className="text-[10px] text-muted-foreground text-center">
            Enter para salvar • Esc para cancelar
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default InlineEditor;
