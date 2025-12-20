// ============================================
// MOISÉS MEDEIROS v16.0 - MASTER DELETE BUTTON
// Botão de exclusão universal com confirmação SIM/NÃO
// Exclusão permanente de QUALQUER lugar do banco
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGodMode } from '@/contexts/GodModeContext';
import { useMasterRemove } from '@/hooks/useMasterRemove';
import { MasterConfirmDialog } from './MasterConfirmDialog';

interface MasterDeleteButtonProps {
  entityType: string;
  entityId: string;
  entityName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'floating' | 'inline' | 'icon';
  onDeleted?: () => void;
  className?: string;
}

export function MasterDeleteButton({
  entityType,
  entityId,
  entityName = 'este item',
  size = 'sm',
  variant = 'floating',
  onDeleted,
  className = ''
}: MasterDeleteButtonProps) {
  const { isOwner, isActive } = useGodMode();
  const { removeEntity, getRemovePreview, isRemoving } = useMasterRemove();
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [preview, setPreview] = useState<{
    entityName: string;
    affectedItems: string[];
    totalItems: number;
    crossReferences?: { table: string; count: number }[];
  } | null>(null);

  // Só exibe se for Owner e Master Mode estiver ativo
  if (!isOwner || !isActive) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Buscar preview do que será removido
    const previewData = await getRemovePreview(entityType, entityId);
    setPreview(previewData);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    const result = await removeEntity(entityType, entityId);
    
    if (result.success) {
      setShowConfirm(false);
      setPreview(null);
      onDeleted?.();
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPreview(null);
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Componente do botão de delete
  const DeleteButton = () => {
    if (variant === 'floating') {
      return (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClick}
          disabled={isRemoving}
          className={`
            absolute bottom-2 right-2 z-50
            ${sizeClasses[size]}
            flex items-center justify-center
            bg-destructive/90 hover:bg-destructive
            text-destructive-foreground
            rounded-full shadow-lg
            transition-all duration-200
            hover:shadow-xl hover:shadow-destructive/30
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          title={`Excluir ${entityName}`}
        >
          {isRemoving ? (
            <Loader2 className={`${iconSizes[size]} animate-spin`} />
          ) : (
            <Trash2 className={iconSizes[size]} />
          )}
        </motion.button>
      );
    }

    if (variant === 'icon') {
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          disabled={isRemoving}
          className={`text-destructive hover:bg-destructive/10 ${className}`}
          title={`Excluir ${entityName}`}
        >
          {isRemoving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      );
    }

    // Variant inline
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={handleClick}
        disabled={isRemoving}
        className={className}
      >
        {isRemoving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4 mr-2" />
        )}
        Excluir
      </Button>
    );
  };

  return (
    <>
      <DeleteButton />

      {/* Diálogo de confirmação SIM/NÃO */}
      <MasterConfirmDialog
        isOpen={showConfirm}
        onClose={handleCancel}
        onConfirm={handleConfirmDelete}
        entityName={preview?.entityName || entityName}
        entityType={entityType}
        preview={preview}
        isLoading={isRemoving}
      />
    </>
  );
}

// Wrapper que adiciona o botão de exclusão automaticamente a qualquer componente
export function WithMasterDelete({
  children,
  entityType,
  entityId,
  entityName,
  onDeleted
}: {
  children: React.ReactNode;
  entityType: string;
  entityId: string;
  entityName?: string;
  onDeleted?: () => void;
}) {
  const { isOwner, isActive } = useGodMode();

  if (!isOwner || !isActive) {
    return <>{children}</>;
  }

  return (
    <div className="relative group">
      {children}
      <AnimatePresence>
        <MasterDeleteButton
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
          onDeleted={onDeleted}
        />
      </AnimatePresence>
    </div>
  );
}
