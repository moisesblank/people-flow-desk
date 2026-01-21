// ============================================
// SYNAPSE v16.0 - INLINE EDITOR ULTIMATE
// Editor flutuante para edição em tempo real
// Funciona em QUALQUER elemento do site
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Upload, RotateCcw, Type, Image, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGodMode } from '@/stores/godModeStore';

export function InlineEditor() {
  const { 
    editingElement, 
    setEditingElement, 
    updateContent, 
    uploadImage,
    saveDirectToElement,
    isActive 
  } = useGodMode();
  
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 350 });
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Calcular posição otimizada do editor
  useEffect(() => {
    if (!editingElement?.rect) return;

    const rect = editingElement.rect;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const editorWidth = 380;
    const editorHeight = 200;

    let top = rect.bottom + scrollY + 10;
    let left = rect.left + scrollX;

    // Ajustar se passar da borda direita
    if (left + editorWidth > viewportWidth + scrollX - 20) {
      left = viewportWidth + scrollX - editorWidth - 20;
    }

    // Ajustar se passar da borda inferior (mostrar acima)
    if (rect.bottom + editorHeight > viewportHeight) {
      top = rect.top + scrollY - editorHeight - 10;
    }

    // Garantir que não fique negativo
    left = Math.max(10, left);
    top = Math.max(10, top);

    setPosition({ top, left, width: editorWidth });
    setValue(editingElement.originalContent);
    
    // Focar no input após um pequeno delay
    setTimeout(() => {
      inputRef.current?.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }, 150);
  }, [editingElement]);

  const handleSave = useCallback(async () => {
    if (!editingElement) return;
    
    console.log('🔮 InlineEditor handleSave:', { 
      id: editingElement.id, 
      contentKey: editingElement.contentKey,
      value,
      originalContent: editingElement.originalContent 
    });
    
    setIsSaving(true);
    try {
      // Primeiro atualiza visualmente em tempo real
      saveDirectToElement(editingElement.element, value);
      console.log('✅ Elemento atualizado visualmente');
      
      // Depois salva no banco
      const key = editingElement.contentKey || editingElement.id;
      console.log('📝 Salvando no banco com key:', key);
      
      const success = await updateContent(key, value, editingElement.type);
      console.log('📝 Resultado do updateContent:', success);
      
      if (success) {
        editingElement.element.removeAttribute('data-godmode-editing');
        setEditingElement(null);
      } else {
        // Reverter visual se falhou
        saveDirectToElement(editingElement.element, editingElement.originalContent);
      }
    } catch (error) {
      console.error('❌ Erro no handleSave:', error);
      // Reverter visual em caso de erro
      saveDirectToElement(editingElement.element, editingElement.originalContent);
    } finally {
      setIsSaving(false);
    }
  }, [editingElement, value, updateContent, saveDirectToElement, setEditingElement]);

  const handleCancel = useCallback(() => {
    if (editingElement?.element) {
      editingElement.element.removeAttribute('data-godmode-editing');
    }
    setEditingElement(null);
  }, [editingElement, setEditingElement]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Enter para salvar (sem shift para texto curto)
    if (e.key === 'Enter' && !e.shiftKey && editingElement?.type === 'text') {
      const isShort = value.length < 100;
      if (isShort) {
        e.preventDefault();
        handleSave();
      }
    }
    // Ctrl+Enter sempre salva
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel, editingElement, value]);

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
        editingElement.element.removeAttribute('data-godmode-editing');
      }
      
      setEditingElement(null);
    } finally {
      setIsSaving(false);
    }
  }, [editingElement, uploadImage, setEditingElement]);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!editingElement) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (editorRef.current && !editorRef.current.contains(target)) {
        // Não fechar se clicou em outro elemento editável
        if (!target.closest('[data-godmode-editing]')) {
          handleCancel();
        }
      }
    };

    // Delay para não conflitar com o clique que abriu
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 200);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingElement, handleCancel]);

  if (!isActive || !editingElement) return null;

  const isMultiline = editingElement.originalContent.length > 80;
  const isImage = editingElement.type === 'image';

  return (
    <AnimatePresence>
      <motion.div
        ref={editorRef}
        initial={{ opacity: 0, scale: 0.95, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -5 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[10001]"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
        }}
        data-godmode-panel="true"
      >
        <div 
          className="bg-background/98 backdrop-blur-xl border-2 border-primary rounded-xl shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.35), 0 20px 50px rgba(0,0,0,0.3)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4 animate-pulse" />
              {isImage ? (
                <>
                  <Image className="h-4 w-4" />
                  Editar Imagem
                </>
              ) : (
                <>
                  <Type className="h-4 w-4" />
                  Editar Texto
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Editor de Texto */}
            {!isImage && (
              <>
                {isMultiline ? (
                  <Textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={5}
                    className="resize-none focus:ring-2 focus:ring-primary border-primary/30"
                    placeholder="Digite o novo texto..."
                  />
                ) : (
                  <Input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="focus:ring-2 focus:ring-primary border-primary/30"
                    placeholder="Digite o novo texto..."
                  />
                )}

                {/* Contador de caracteres */}
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{value.length} caracteres</span>
                  <span className="opacity-60">
                    {isMultiline ? 'Ctrl+Enter salva' : 'Enter salva'}
                  </span>
                </div>
              </>
            )}

            {/* Editor de Imagem */}
            {isImage && (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden bg-secondary/30 p-3">
                  <img 
                    src={editingElement.originalContent} 
                    alt="Preview"
                    className="max-h-40 w-auto mx-auto rounded-lg shadow-md"
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                >
                  <Upload className="h-4 w-4" />
                  {isSaving ? 'Enviando...' : 'Escolher nova imagem'}
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

            {/* Botões de ação para texto */}
            {!isImage && (
              <div className="flex justify-between gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue(editingElement.originalContent)}
                  disabled={isSaving || value === editingElement.originalContent}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Restaurar
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || value === editingElement.originalContent}
                    className="bg-primary hover:bg-primary/90 min-w-[90px]"
                  >
                    {isSaving ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
