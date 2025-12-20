// ============================================
// MOISÉS MEDEIROS v15.0 - ACTION CONFIRM DIALOG
// Diálogo de confirmação para Salvar / Não Salvar
// Com confirmação explícita para exclusão permanente
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Save, X, Loader2, CheckCircle2, Trash2, Plus, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ActionType = 'add' | 'duplicate' | 'remove';

interface PendingAction {
  type: ActionType;
  entityType: string;
  entityId?: string;
  data?: Record<string, unknown>;
  table?: string;
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
  const [confirmText, setConfirmText] = useState('');
  
  // Para exclusão, exigir digitação de "EXCLUIR"
  const isRemove = action?.type === 'remove';
  const canConfirmRemove = !isRemove || confirmText.toUpperCase() === 'EXCLUIR';

  const handleConfirm = async () => {
    if (isRemove && !canConfirmRemove) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await onConfirm();
      setResult('success');
      setTimeout(() => {
        setResult(null);
        setConfirmText('');
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
    setConfirmText('');
    onCancel();
    onClose();
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  const getActionInfo = () => {
    if (!action) return { title: '', icon: null, color: '', description: '' };
    
    switch (action.type) {
      case 'add':
        return {
          title: '➕ Adicionar Item',
          icon: <Plus className="w-6 h-6 text-green-500" />,
          color: 'text-green-500',
          description: action.preview?.description || 'Um novo item será criado no sistema.'
        };
      case 'duplicate':
        return {
          title: '📋 Duplicar Item',
          icon: <Copy className="w-6 h-6 text-blue-500" />,
          color: 'text-blue-500',
          description: action.preview?.description || 'O item será copiado com todas as suas associações.'
        };
      case 'remove':
        return {
          title: '⚠️ EXCLUSÃO PERMANENTE',
          icon: <Trash2 className="w-6 h-6 text-destructive" />,
          color: 'text-destructive',
          description: action.preview?.description || 'O item será removido permanentemente de todo o sistema.'
        };
      default:
        return { title: '', icon: null, color: '', description: '' };
    }
  };

  const info = getActionInfo();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-md ${isRemove ? 'border-destructive/50' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {info.icon}
            <span className={info.color}>{action?.preview?.title || info.title}</span>
          </DialogTitle>
          <DialogDescription className={isRemove ? 'text-destructive/80' : ''}>
            {info.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {action?.preview && (
            <div className="space-y-3">
              {/* Preview de dados para ADD */}
              {action.type === 'add' && action.preview.affectedItems && action.preview.affectedItems.length > 0 && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="font-medium text-green-500 mb-2">Dados a serem criados:</p>
                  <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                    {action.preview.affectedItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview de itens afetados para REMOVE */}
              {action.type === 'remove' && action.preview.affectedItems && action.preview.affectedItems.length > 0 && (
                <div className="space-y-3">
                  <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                    <p className="font-medium text-destructive mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Itens que serão EXCLUÍDOS PERMANENTEMENTE:
                    </p>
                    <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                      {action.preview.affectedItems.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-destructive/80">
                          <Trash2 className="w-3 h-3" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Campo de confirmação para exclusão */}
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <p className="text-sm font-medium text-yellow-600 mb-2">
                      ⚠️ Para confirmar, digite <strong className="text-destructive">EXCLUIR</strong> abaixo:
                    </p>
                    <Input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Digite EXCLUIR para confirmar"
                      className={`${confirmText.toUpperCase() === 'EXCLUIR' ? 'border-green-500' : 'border-destructive/50'}`}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Preview para DUPLICATE */}
              {action.type === 'duplicate' && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="font-medium text-blue-500 mb-2">Será criada uma cópia:</p>
                  <ul className="text-sm space-y-1">
                    {action.preview.affectedItems?.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
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
                <span>
                  {action?.type === 'remove' 
                    ? '🗑️ Excluído permanentemente!' 
                    : action?.type === 'add'
                    ? '✅ Adicionado com sucesso!'
                    : '📋 Duplicado com sucesso!'}
                </span>
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
                <span>Erro ao executar ação</span>
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
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || (isRemove && !canConfirmRemove)}
            className={`flex-1 ${
              action?.type === 'remove' 
                ? 'bg-destructive hover:bg-destructive/90' 
                : action?.type === 'add'
                ? 'bg-green-600 hover:bg-green-700'
                : ''
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : action?.type === 'remove' ? (
              <Trash2 className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {action?.type === 'remove' 
              ? 'EXCLUIR PERMANENTEMENTE' 
              : action?.type === 'add'
              ? 'Criar Item'
              : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
