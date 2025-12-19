// ============================================
// MOISÉS MEDEIROS v15.0 - MASTER DELETE BUTTON
// Botão de exclusão universal flutuante
// Visível no canto inferior direito de cada item
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGodMode } from '@/contexts/GodModeContext';
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
      onDeleted?.();
    }
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

  if (variant === 'floating') {
    return (
      <>
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

        {/* Modal de confirmação */}
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="border-destructive/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Você está prestes a excluir <strong>"{preview?.entityName || entityName}"</strong>.
                </p>
                
                {preview && preview.affectedItems.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-2">
                    <p className="font-medium text-destructive mb-2">
                      ⚠️ Itens que serão removidos:
                    </p>
                    <ul className="text-sm space-y-1">
                      {preview.affectedItems.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-destructive/20">
                      Total: {preview.totalItems} item(ns)
                    </p>
                  </div>
                )}

                <p className="text-destructive font-medium">
                  Esta ação pode ser desfeita com Ctrl+Z
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRemoving}>
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
                    Excluir Permanentemente
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (variant === 'icon') {
    return (
      <>
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

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          {/* Mesmo conteúdo do modal */}
          <AlertDialogContent className="border-destructive/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{preview?.entityName || entityName}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Variant inline
  return (
    <>
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

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{preview?.entityName || entityName}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
