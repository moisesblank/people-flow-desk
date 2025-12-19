// ============================================
// MOISÉS MEDEIROS v13.0 - ACTION CONFIRM DIALOG
// Diálogo de confirmação para Salvar / Não Salvar
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Save, X, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ActionType = 'add' | 'duplicate' | 'remove';

interface PendingAction {
  type: ActionType;
  entityType: string;
  entityId?: string;
  data?: Record<string, unknown>;
  preview?: {
    title: string;
    description: string;
    affectedItems?: string[];
  };
}

interface MasterActionConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: PendingAction | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function MasterActionConfirmDialog({
  isOpen,
  onClose,
  action,
  onConfirm,
  onCancel
}: MasterActionConfirmDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      setResult('success');
      setTimeout(() => {
        setResult(null);
        onClose();
      }, 1000);
    } catch (error) {
      setResult('error');
      setTimeout(() => setResult(null), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  const getActionInfo = () => {
    if (!action) return { title: '', icon: null, color: '' };
    
    switch (action.type) {
      case 'add':
        return {
          title: 'Adicionar Item',
          icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
          color: 'text-green-500',
          description: 'Um novo item será criado no sistema.'
        };
      case 'duplicate':
        return {
          title: 'Duplicar Item',
          icon: <CheckCircle2 className="w-6 h-6 text-blue-500" />,
          color: 'text-blue-500',
          description: 'O item será copiado com todas as suas associações.'
        };
      case 'remove':
        return {
          title: 'Remover Item',
          icon: <AlertTriangle className="w-6 h-6 text-destructive" />,
          color: 'text-destructive',
          description: 'O item será removido permanentemente de todo o sistema.'
        };
      default:
        return { title: '', icon: null, color: '', description: '' };
    }
  };

  const info = getActionInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {info.icon}
            <span className={info.color}>{info.title}</span>
          </DialogTitle>
          <DialogDescription>{info.description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {action?.preview && (
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{action.preview.title}</p>
                <p className="text-sm text-muted-foreground">{action.preview.description}</p>
              </div>
              
              {action.preview.affectedItems && action.preview.affectedItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Itens afetados ({action.preview.affectedItems.length}):
                  </p>
                  <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                    {action.preview.affectedItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Status de processamento */}
          <AnimatePresence>
            {result === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 p-3 mt-4 bg-green-500/10 text-green-500 rounded-lg"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Alteração aplicada com sucesso!</span>
              </motion.div>
            )}
            {result === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 p-3 mt-4 bg-destructive/10 text-destructive rounded-lg"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>Erro ao aplicar alteração</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Não Salvar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`flex-1 ${action?.type === 'remove' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
