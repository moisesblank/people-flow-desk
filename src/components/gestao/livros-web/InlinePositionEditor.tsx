// ============================================
// 📍 INLINE POSITION EDITOR
// Editor de posição com preview visual
// ============================================

import { memo, useState, useCallback } from 'react';
import { Check, X, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

interface InlinePositionEditorProps {
  position: number;
  coverIndex?: number; // 1-5 se está nas 5 primeiras posições
  onSave: (newPosition: number) => Promise<void>;
  className?: string;
}

// ============================================
// COMPONENTE
// ============================================

export const InlinePositionEditor = memo(function InlinePositionEditor({
  position,
  coverIndex,
  onSave,
  className,
}: InlinePositionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(position);
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = useCallback(() => {
    setEditValue(position);
    setIsEditing(true);
  }, [position]);

  const handleCancel = useCallback(() => {
    setEditValue(position);
    setIsEditing(false);
  }, [position]);

  const handleSave = useCallback(async () => {
    if (editValue === position || editValue < 1) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      console.error('[InlinePositionEditor] Erro ao salvar:', err);
      setEditValue(position);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, position, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  // ============================================
  // MODO EDIÇÃO
  // ============================================

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={1}
          value={editValue}
          onChange={(e) => setEditValue(Math.max(1, Number(e.target.value)))}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="h-8 w-16 text-center text-sm"
          autoFocus
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-500/10"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // ============================================
  // MODO VISUALIZAÇÃO
  // ============================================

  return (
    <div
      onClick={handleStartEdit}
      className={cn(
        "group flex items-center gap-1 cursor-pointer rounded px-1 transition-colors hover:bg-muted/50",
        className
      )}
      title="Clique para editar posição"
    >
      {coverIndex ? (
        <Badge 
          variant="outline" 
          className="text-xs px-1.5 py-0 h-5 border-red-500/50 text-red-400 font-bold"
        >
          #{String(coverIndex).padStart(2, '0')}
        </Badge>
      ) : (
        <Badge 
          variant="outline" 
          className="text-xs px-1.5 py-0 h-5 border-muted-foreground/30 text-muted-foreground"
        >
          #{position || '—'}
        </Badge>
      )}
      <ArrowUpDown className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
});

export default InlinePositionEditor;
