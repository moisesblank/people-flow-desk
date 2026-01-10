// ============================================
// 📝 INLINE EDITABLE CELL
// Célula de tabela com edição inline
// ============================================

import { memo, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

interface InlineEditableCellProps {
  value: string | number;
  displayValue?: ReactNode; // Pode ser string ou JSX (Badge, etc)
  onSave: (newValue: string | number) => Promise<void>;
  type?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
  minWidth?: string;
}

// ============================================
// COMPONENTE
// ============================================

export const InlineEditableCell = memo(function InlineEditableCell({
  value,
  displayValue,
  onSave,
  type = 'text',
  options,
  className,
  placeholder = 'Clique para editar',
  minWidth = '120px',
}: InlineEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset editValue quando value externo muda
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focar input ao entrar em modo edição
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = useCallback(() => {
    setEditValue(value);
    setIsEditing(true);
  }, [value]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleSave = useCallback(async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      console.error('[InlineEditableCell] Erro ao salvar:', err);
      setEditValue(value); // Reverter
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, onSave]);

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
      <div className="flex items-center gap-1" style={{ minWidth }}>
        {type === 'select' && options ? (
          <Select
            value={String(editValue)}
            onValueChange={(val) => {
              setEditValue(val);
            }}
            disabled={isSaving}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(type === 'number' ? Number(e.target.value) : e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="h-8 text-sm"
            placeholder={placeholder}
          />
        )}
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
        "group flex items-center gap-1.5 cursor-pointer rounded px-1.5 py-0.5 -mx-1.5 transition-colors hover:bg-muted/50",
        className
      )}
      style={{ minWidth }}
      title="Clique para editar"
    >
      {displayValue ? (
        <>{displayValue}</>
      ) : value ? (
        <span className="text-sm">{value}</span>
      ) : (
        <span className="text-sm text-muted-foreground italic">{placeholder}</span>
      )}
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
});

export default InlineEditableCell;
