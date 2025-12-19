// ============================================
// MOISÉS MEDEIROS v11.0 - DUPLICATION CLIPBOARD INDICATOR
// Indicador Visual de Item na Área de Transferência
// Owner: moisesblank@gmail.com
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, X, ClipboardPaste, GripVertical, Trash2, Sparkles, Check } from 'lucide-react';
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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showSuccess, setShowSuccess] = useState(false);
  const [timeSinceCopy, setTimeSinceCopy] = useState(0);

  // Update time since copy
  useEffect(() => {
    if (!clipboardItem) return;
    
    const interval = setInterval(() => {
      setTimeSinceCopy(Math.round((Date.now() - clipboardItem.copiedAt.getTime()) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [clipboardItem]);

  // Reset on new item
  useEffect(() => {
    if (clipboardItem) {
      setIsMinimized(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  }, [clipboardItem?.id]);

  // Auto minimize after 15 seconds
  useEffect(() => {
    if (clipboardItem && !isMinimized) {
      const timer = setTimeout(() => setIsMinimized(true), 15000);
      return () => clearTimeout(timer);
    }
  }, [clipboardItem, isMinimized]);

  if (!isOwner || !clipboardItem) return null;

  const entityLabel = ENTITY_LABELS[clipboardItem.entityType] || clipboardItem.entityType;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const handlePaste = () => {
    pasteFromClipboard();
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      clearClipboard();
    }, 1500);
  };

  return (
    <AnimatePresence mode="wait">
      {/* Success overlay flash */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="bg-green-500/20 backdrop-blur-sm p-8 rounded-full"
          >
            <Check className="h-16 w-16 text-green-500" />
          </motion.div>
        </motion.div>
      )}

      <motion.div
        key={isMinimized ? 'minimized' : 'expanded'}
        initial={{ opacity: 0, scale: 0.5, y: 100 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          x: position.x,
        }}
        exit={{ opacity: 0, scale: 0.5, y: 100 }}
        drag
        dragMomentum={false}
        onDragEnd={(_, info) => {
          setPosition(prev => ({
            x: prev.x + info.offset.x,
            y: prev.y + info.offset.y
          }));
        }}
        className={cn(
          "fixed bottom-8 right-8 z-50 cursor-grab active:cursor-grabbing",
          "select-none"
        )}
      >
        {isMinimized ? (
          // === VERSÃO MINIMIZADA ===
          <motion.div
            onClick={() => setIsMinimized(false)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative p-4 rounded-2xl cursor-pointer",
              "bg-gradient-to-br from-primary via-primary/90 to-purple-600",
              "shadow-2xl shadow-primary/50",
              "border-2 border-white/20"
            )}
          >
            {/* Pulse ring animation */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-primary/50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <Copy className="h-6 w-6 text-white" />
                <motion.span 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
              <div className="text-white">
                <p className="font-bold text-sm">1 item copiado</p>
                <p className="text-xs opacity-80">Clique para expandir</p>
              </div>
            </div>
          </motion.div>
        ) : (
          // === VERSÃO EXPANDIDA ===
          <motion.div
            layoutId="clipboard-card"
            className={cn(
              "w-[380px] rounded-2xl overflow-hidden",
              "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
              "border-2 border-primary/50",
              "shadow-2xl shadow-primary/30"
            )}
          >
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-primary via-purple-500 to-primary p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-6 w-6 text-yellow-300" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Item Copiado!</h3>
                    <p className="text-white/80 text-xs">Modo Master Ativo</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                    onClick={() => setIsMinimized(true)}
                  >
                    <span className="text-lg font-bold">−</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-300 hover:text-red-400 hover:bg-red-500/20"
                    onClick={clearClipboard}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-4 space-y-4">
              {/* Item copiado */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={cn(
                  "p-4 rounded-xl",
                  "bg-gradient-to-r from-primary/20 to-purple-500/20",
                  "border border-primary/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-primary/30 shrink-0">
                    <Copy className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-base truncate">
                      {clipboardItem.entityName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-primary/20 text-primary border-primary/30">
                        {entityLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        há {formatTime(timeSinceCopy)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Instruções visuais */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardPaste className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-medium text-white">Colar</span>
                  </div>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 rounded bg-slate-700 text-white text-[10px] font-mono">Ctrl</kbd>
                    <span className="text-muted-foreground">+</span>
                    <kbd className="px-2 py-1 rounded bg-slate-700 text-white text-[10px] font-mono">V</kbd>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <GripVertical className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-medium text-white">Arrastar</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Arraste este card
                  </p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2">
                <Button
                  onClick={handlePaste}
                  className={cn(
                    "flex-1 gap-2 h-12 text-base font-bold",
                    "bg-gradient-to-r from-green-500 to-emerald-600",
                    "hover:from-green-600 hover:to-emerald-700",
                    "shadow-lg shadow-green-500/30"
                  )}
                >
                  <ClipboardPaste className="h-5 w-5" />
                  Colar Agora
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                  onClick={clearClipboard}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Dica */}
              <p className="text-center text-xs text-muted-foreground">
                💡 O item foi duplicado e está pronto para posicionar
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
