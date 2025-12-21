// ============================================
// MOISÉS MEDEIROS v7.0 - EDITABLE TEXT
// Componente de texto editável inline
// ============================================

import { useState, useRef, useEffect, forwardRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  isEditMode: boolean;
  canEdit: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  multiline?: boolean;
  placeholder?: string;
}

// Corrigido com forwardRef para compatibilidade com refs externas
export const EditableText = memo(forwardRef<HTMLDivElement, EditableTextProps>(function EditableText({
  value,
  onSave,
  isEditMode,
  canEdit,
  className = "",
  as: Component = "span",
  multiline = false,
  placeholder = "Clique para editar...",
}, ref) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isEditMode || !canEdit) {
    return <Component className={className}>{value || placeholder}</Component>;
  }

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative inline-flex items-center gap-2"
      >
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "bg-background/90 border-2 border-primary rounded-lg px-3 py-2 min-w-[200px] outline-none resize-none",
              className
            )}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "bg-background/90 border-2 border-primary rounded-lg px-3 py-1 min-w-[100px] outline-none",
              className
            )}
          />
        )}
        <div className="flex gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            className="p-1.5 rounded-full bg-green-500 text-white shadow-lg"
          >
            <Check className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCancel}
            className="p-1.5 rounded-full bg-red-500 text-white shadow-lg"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className="relative inline-block group cursor-pointer"
      onClick={() => setIsEditing(true)}
      whileHover={{ scale: 1.02 }}
    >
      <Component
        className={cn(
          className,
          "relative border-2 border-dashed border-transparent group-hover:border-primary/50 rounded px-1 transition-all"
        )}
      >
        {value || placeholder}
      </Component>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute -top-2 -right-2 p-1 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
      >
        <Edit3 className="h-3 w-3" />
      </motion.div>
    </motion.div>
  );
}));

EditableText.displayName = 'EditableText';
