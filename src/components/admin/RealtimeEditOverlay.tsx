// ============================================
// MOISÉS MEDEIROS v12.0 - REALTIME EDIT OVERLAY
// Overlay de edição em tempo real com equivalências
// Owner: moisesblank@gmail.com
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Upload, RotateCcw, Sparkles, Copy, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGodMode } from '@/stores/godModeStore';
import { useRealtimeEquivalences } from '@/hooks/useRealtimeEquivalences';
import { useMasterTransaction } from '@/stores/masterModeTransactionStore';
import { cn } from '@/lib/utils';

export function RealtimeEditOverlay() {
  const { 
    editingElement, 
    setEditingElement, 
    uploadImage,
    isOwner,
    isActive 
  } = useGodMode();

  const { propagateChange } = useRealtimeEquivalences();
  const { stageChange, commitAll, isCommitting } = useMasterTransaction();

  const [editValue, setEditValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar valor quando elemento muda
  useEffect(() => {
    if (editingElement) {
      setEditValue(editingElement.originalContent);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [editingElement]);

  // Preview em tempo real
  useEffect(() => {
    if (editingElement && editValue !== editingElement.originalContent) {
      const el = editingElement.element;
      if (editingElement.type === 'text') {
        el.textContent = editValue;
      }
    }
  }, [editValue, editingElement]);

  // Stage alteração (transacional - salva automaticamente para evitar perda)
  const handleSave = useCallback(async () => {
    if (!editingElement || !editingElement.contentKey) return;
    if (editValue === editingElement.originalContent) return;

    // ✅ STAGE: adicionar ao pendingChanges (garante Undo/Discard)
    stageChange({
      type: 'content_edit',
      table: 'editable_content',
      operation: 'upsert',
      key: editingElement.contentKey,
      data: {
        content_key: editingElement.contentKey,
        content_value: editValue,
        content_type: editingElement.type,
        page_key: window.location.pathname.replace(/\//g, '_') || 'global',
        updated_at: new Date().toISOString(),
      },
      originalValue: editingElement.originalContent,
    });

    // Propagar preview para equivalentes (visual apenas)
    propagateChange(
      'editable_content',
      'content_value',
      editingElement.originalContent,
      editValue,
      editingElement.contentKey
    );

    // Fechar editor
    editingElement.element.removeAttribute('data-godmode-editing');
    setEditingElement(null);

    // ✅ AUTO-SAVE (P0): evita "apliquei e ao atualizar sumiu"
    if (!isCommitting) {
      const result = await commitAll();
      if (!result.success) {
        console.error('[RealtimeEditOverlay] ❌ Auto-save failed:', result.error);
      }
    }

    console.log('[RealtimeEditOverlay] ✏️ Change staged:', editingElement.contentKey);
  }, [editingElement, editValue, stageChange, propagateChange, setEditingElement, commitAll, isCommitting]);

  // Cancelar edição
  const handleCancel = useCallback(() => {
    if (editingElement) {
      // Restaurar valor original
      if (editingElement.type === 'text') {
        editingElement.element.textContent = editingElement.originalContent;
      } else {
        (editingElement.element as HTMLImageElement).src = editingElement.originalContent;
      }
      editingElement.element.removeAttribute('data-godmode-editing');
      setEditingElement(null);
    }
  }, [editingElement, setEditingElement]);

  // Upload de imagem (upload imediato, mas stage a referência)
  const handleImageUpload = useCallback(async (file: File) => {
    if (!editingElement || !editingElement.contentKey) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(editingElement.contentKey, file);
      if (url) {
        setEditValue(url);
        (editingElement.element as HTMLImageElement).src = url;

        // ✅ STAGE: adicionar ao pendingChanges
        stageChange({
          type: 'content_edit',
          table: 'editable_content',
          operation: 'upsert',
          key: editingElement.contentKey,
          data: {
            content_key: editingElement.contentKey,
            content_value: url,
            content_type: 'image',
            page_key: window.location.pathname.replace(/\//g, '_') || 'global',
            updated_at: new Date().toISOString(),
          },
          originalValue: editingElement.originalContent,
        });

        // Propagar preview visual
        propagateChange(
          'editable_content',
          'content_value',
          editingElement.originalContent,
          url,
          editingElement.contentKey
        );

        // ✅ AUTO-SAVE (P0)
        if (!isCommitting) {
          const result = await commitAll();
          if (!result.success) {
            console.error('[RealtimeEditOverlay] ❌ Auto-save failed:', result.error);
          }
        }

        console.log('[RealtimeEditOverlay] 🖼️ Image change staged:', editingElement.contentKey);
      }
    } finally {
      setIsUploading(false);
    }
  }, [editingElement, uploadImage, stageChange, propagateChange, commitAll, isCommitting]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingElement) return;

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }

      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingElement, handleSave, handleCancel]);

  if (!isOwner || !isActive || !editingElement) return null;

  const isImage = editingElement.type === 'image';
  const isMultiline = editingElement.originalContent.length > 100 || editingElement.originalContent.includes('\n');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed z-[10001] bg-card/95 backdrop-blur-xl border border-purple-500/50 rounded-xl shadow-2xl p-4"
        style={{
          top: Math.min(editingElement.rect.bottom + 10, window.innerHeight - 300),
          left: Math.min(editingElement.rect.left, window.innerWidth - 400),
          minWidth: 320,
          maxWidth: 500,
          boxShadow: '0 0 40px rgba(168, 85, 247, 0.3)'
        }}
        data-godmode-panel
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">
              {isImage ? 'Editar Imagem' : 'Editar Texto'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">
              Ctrl+Enter para salvar
            </span>
          </div>
        </div>

        {/* Editor */}
        {isImage ? (
          <div className="space-y-3">
            {/* Preview da imagem */}
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img 
                src={editValue} 
                alt="Preview"
                className="w-full h-32 object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                </div>
              )}
            </div>
            
            {/* Upload button */}
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Enviando...' : 'Trocar Imagem'}
              </Button>
            </div>

            {/* URL input */}
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="URL da imagem"
              className="text-sm"
            />
          </div>
        ) : isMultiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="min-h-[100px] text-sm resize-none"
            placeholder="Digite o novo texto..."
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="text-sm"
            placeholder="Digite o novo texto..."
          />
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditValue(editingElement.originalContent)}
            className="text-muted-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Resetar
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={editValue === editingElement.originalContent}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400"
            >
              <Check className="h-4 w-4 mr-1" />
              Aplicar
            </Button>
          </div>
        </div>

        {/* Key indicator */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Wand2 className="h-3 w-3" />
            <span className="truncate">
              Key: {editingElement.contentKey}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => {
                navigator.clipboard.writeText(editingElement.contentKey || '');
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RealtimeEditOverlay;
