// ============================================
// MOISÉS MEDEIROS v11.0 - DUPLICATION CLIPBOARD INDICATOR
// Indicador Visual de Item na Área de Transferência
// Owner: moisesblank@gmail.com
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, X, ClipboardPaste, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDuplicationClipboard } from '@/contexts/DuplicationClipboardContext';
import { useMasterDuplication } from '@/hooks/useMasterDuplication';
import { cn } from '@/lib/utils';

const ENTITY_LABELS: Record<string, string> = {
  course: 'Curso',
  lesson: 'Aula',
  module: 'Módulo',
  quiz: 'Quiz',
  task: 'Tarefa',
  calendar_task: 'Tarefa',
  transaction: 'Transação',
  campaign: 'Campanha',
  automation: 'Automação',
  employee: 'Funcionário',
  affiliate: 'Afiliado',
  student: 'Aluno',
  document: 'Documento',
  category: 'Categoria',
  expense: 'Despesa',
  income: 'Receita',
  conta_pagar: 'Conta a Pagar',
  conta_receber: 'Conta a Receber',
  alerta: 'Alerta',
  contabilidade: 'Registro',
};

export function DuplicationClipboardIndicator() {
  const { clipboardItem, clearClipboard, pasteFromClipboard } = useDuplicationClipboard();
  const { isOwner } = useMasterDuplication();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-minimize após 10 segundos
  useEffect(() => {
    if (clipboardItem && !isMinimized) {
      const timer = setTimeout(() => setIsMinimized(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [clipboardItem, isMinimized]);

  // Reset minimized quando novo item é copiado
  useEffect(() => {
    if (clipboardItem) {
      setIsMinimized(false);
    }
  }, [clipboardItem?.id]);

  if (!isOwner || !clipboardItem) return null;

  const entityLabel = ENTITY_LABELS[clipboardItem.entityType] || clipboardItem.entityType;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          width: isMinimized ? 'auto' : '320px'
        }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        drag={isDragging}
        dragConstraints={{ left: -500, right: 500, top: -300, bottom: 100 }}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "bg-gradient-to-br from-primary/20 via-background to-primary/10",
          "border-2 border-primary/40 rounded-xl shadow-2xl shadow-primary/20",
          "backdrop-blur-xl"
        )}
      >
        {isMinimized ? (
          // Versão minimizada
          <motion.div
            className="p-3 cursor-pointer flex items-center gap-2"
            onClick={() => setIsMinimized(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <Copy className="h-5 w-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <span className="text-xs font-medium text-primary">1 item copiado</span>
          </motion.div>
        ) : (
          // Versão expandida
          <div className="p-4 space-y-3">
            {/* Header com drag handle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-primary/10 rounded"
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                  <Copy className="h-3 w-3 mr-1" />
                  Área de Transferência
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMinimized(true)}
                >
                  <span className="text-xs">−</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive/70 hover:text-destructive"
                  onClick={clearClipboard}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Item copiado */}
            <motion.div
              className="p-3 rounded-lg bg-card/80 border border-border/50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Copy className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {clipboardItem.entityName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entityLabel} • Copiado há{' '}
                    {Math.round((Date.now() - clipboardItem.copiedAt.getTime()) / 1000)}s
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Instruções */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <ClipboardPaste className="h-4 w-4 text-primary" />
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">Ctrl</kbd>
                  {' + '}
                  <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">V</kbd>
                  {' para colar'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <GripVertical className="h-4 w-4 text-primary" />
                <span>Arraste este card para posicionar</span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => {
                  pasteFromClipboard();
                }}
              >
                <ClipboardPaste className="h-4 w-4" />
                Colar Agora
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={clearClipboard}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
