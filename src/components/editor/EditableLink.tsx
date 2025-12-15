// ============================================
// MOISÉS MEDEIROS v7.0 - EDITABLE LINK
// Componente de link editável inline
// ============================================

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Link as LinkIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableLinkProps {
  href: string;
  children: React.ReactNode;
  onSave: (href: string) => void;
  isEditMode: boolean;
  canEdit: boolean;
  className?: string;
  target?: string;
}

export function EditableLink({
  href,
  children,
  onSave,
  isEditMode,
  canEdit,
  className = "",
  target = "_blank",
}: EditableLinkProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempHref, setTempHref] = useState(href);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempHref(href);
  }, [href]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(tempHref);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempHref(href);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isEditMode || !canEdit) {
    return (
      <a href={href} target={target} rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col gap-2 p-3 bg-background/95 border-2 border-primary rounded-lg shadow-xl"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LinkIcon className="h-4 w-4" />
          <span>Editar Link</span>
        </div>
        <input
          ref={inputRef}
          type="url"
          value={tempHref}
          onChange={(e) => setTempHref(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://exemplo.com"
          className="bg-muted border border-border rounded-lg px-3 py-2 min-w-[300px] outline-none focus:border-primary"
        />
        <div className="flex gap-2 justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm"
          >
            <Check className="h-4 w-4" />
            Salvar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCancel}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm"
          >
            <X className="h-4 w-4" />
            Cancelar
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative inline-block group cursor-pointer"
      onClick={() => setIsEditing(true)}
      whileHover={{ scale: 1.02 }}
    >
      <div
        className={cn(
          className,
          "border-2 border-dashed border-transparent group-hover:border-primary/50 rounded transition-all"
        )}
      >
        {children}
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute -top-2 -right-2 p-1 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
      >
        <ExternalLink className="h-3 w-3" />
      </motion.div>
    </motion.div>
  );
}
