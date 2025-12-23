// ============================================
// MOISÉS MEDEIROS v16.0 - MASTER CONFIRM DIALOG
// GPU-ONLY animations via useQuantumReactivity
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Loader2, Check, X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';

interface MasterConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  entityName: string;
  entityType: string;
  preview?: {
    affectedItems: string[];
    totalItems: number;
    crossReferences?: { table: string; count: number }[];
  } | null;
  isLoading?: boolean;
}

export function MasterConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "TEM CERTEZA?",
  entityName,
  entityType,
  preview,
  isLoading = false,
}: MasterConfirmDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const isDisabled = isLoading || isProcessing;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-lg border-2 border-destructive/50 bg-background/95 backdrop-blur-sm">
        <DialogHeader className="text-center pb-2">
          {/* Ícone de alerta animado */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4"
          >
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center border-2 border-destructive/30">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.2,
                  repeat: 2,
                }}
              >
                <ShieldAlert className="w-10 h-10 text-destructive" />
              </motion.div>
            </div>
          </motion.div>

          <DialogTitle className="text-2xl font-bold text-destructive text-center">
            {title}
          </DialogTitle>
          
          <DialogDescription className="text-center text-base mt-2">
            Você está prestes a excluir permanentemente:
          </DialogDescription>
        </DialogHeader>

        {/* Nome do item a ser excluído */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 my-4">
          <div className="text-center">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {entityType}
            </span>
            <h3 className="text-lg font-bold text-foreground mt-1">
              "{entityName}"
            </h3>
          </div>
        </div>

        {/* Preview dos itens afetados */}
        {preview && preview.affectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="font-semibold text-destructive text-sm">
                Itens que serão removidos em cascata:
              </span>
            </div>
            
            <ul className="space-y-1.5 max-h-40 overflow-y-auto">
              {preview.affectedItems.slice(0, 10).map((item, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="w-1.5 h-1.5 bg-destructive rounded-full flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </motion.li>
              ))}
              {preview.affectedItems.length > 10 && (
                <li className="text-xs text-muted-foreground italic pl-4">
                  ... e mais {preview.affectedItems.length - 10} itens
                </li>
              )}
            </ul>

            <div className="mt-3 pt-3 border-t border-destructive/20 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Total de itens:
              </span>
              <span className="font-bold text-destructive">
                {preview.totalItems}
              </span>
            </div>
          </motion.div>
        )}

        {/* Aviso de ação irreversível */}
        <div className="text-center text-sm text-muted-foreground mb-6">
          <p className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Esta ação <strong className="text-foreground">NÃO</strong> pode ser facilmente desfeita
          </p>
        </div>

        {/* Botões SIM / NÃO */}
        <div className="flex gap-4 justify-center">
          {/* Botão NÃO */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleCancel}
            disabled={isDisabled}
            className="flex-1 h-14 text-lg font-bold border-2 hover:bg-green-500/10 hover:border-green-500 hover:text-green-500 transition-all"
          >
            <X className="w-5 h-5 mr-2" />
            NÃO
          </Button>

          {/* Botão SIM */}
          <Button
            variant="destructive"
            size="lg"
            onClick={handleConfirm}
            disabled={isDisabled}
            className="flex-1 h-14 text-lg font-bold hover:bg-destructive/90 transition-all"
          >
            {isDisabled ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                SIM
              </>
            )}
          </Button>
        </div>

        {/* Instruções de atalho */}
        <div className="text-center text-xs text-muted-foreground mt-4">
          Pressione <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">ESC</kbd> para cancelar
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook para usar o diálogo de confirmação
export function useMasterConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    entityName: string;
    entityType: string;
    preview?: MasterConfirmDialogProps['preview'];
    onConfirm: () => Promise<void>;
  } | null>(null);

  const confirm = async (options: {
    entityName: string;
    entityType: string;
    preview?: MasterConfirmDialogProps['preview'];
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({
        ...options,
        onConfirm: async () => {
          setIsOpen(false);
          resolve(true);
        },
      });
      setIsOpen(true);

      // Se fechar sem confirmar
      const handleClose = () => {
        resolve(false);
      };
      
      // Armazenar a função de close para uso posterior
      (window as any).__masterConfirmClose = handleClose;
    });
  };

  const close = () => {
    setIsOpen(false);
    if ((window as any).__masterConfirmClose) {
      (window as any).__masterConfirmClose();
      delete (window as any).__masterConfirmClose;
    }
  };

  const ConfirmDialogComponent = config ? (
    <MasterConfirmDialog
      isOpen={isOpen}
      onClose={close}
      onConfirm={config.onConfirm}
      entityName={config.entityName}
      entityType={config.entityType}
      preview={config.preview}
    />
  ) : null;

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
}
