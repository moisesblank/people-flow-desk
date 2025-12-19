// ============================================
// MOISÉS MEDEIROS v12.0 - PASTE INDICATOR
// Indicador visual de item pronto para colar
// Segue o mouse e aparece instantaneamente
// Owner: moisesblank@gmail.com
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardPaste, X, Sparkles, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInstantDuplication } from '@/hooks/useInstantDuplication';
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

export function PasteIndicator() {
  const { 
    clipboard, 
    clearClipboard, 
    pasteFromClipboard, 
    isDuplicating,
    isOwner,
    lastMousePosition 
  } = useInstantDuplication();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [timeSinceCopy, setTimeSinceCopy] = useState(0);

  // Atualizar tempo desde cópia
  useEffect(() => {
    if (!clipboard) {
      setTimeSinceCopy(0);
      return;
    }

    const interval = setInterval(() => {
      setTimeSinceCopy(Math.floor((Date.now() - clipboard.copiedAt) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [clipboard]);

  // Não mostrar se não é owner ou não tem item
  if (!isOwner || !clipboard) return null;

  const entityLabel = ENTITY_LABELS[clipboard.entityType] || clipboard.entityType;

  const handlePaste = async () => {
    const result = await pasteFromClipboard();
    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  // Formatar tempo
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20 }}
        className={cn(
          "fixed z-[9998] transition-all duration-200",
          isMinimized ? "bottom-4 right-4" : "bottom-6 right-6"
        )}
      >
        {isMinimized ? (
          // Versão minimizada
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMinimized(false)}
            className="relative p-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full shadow-xl"
            style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)' }}
          >
            <ClipboardPaste className="h-5 w-5 text-white" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
            />
          </motion.button>
        ) : (
          // Versão expandida
          <motion.div
            layout
            className="bg-card/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden"
            style={{ 
              boxShadow: '0 0 40px rgba(168, 85, 247, 0.3)',
              minWidth: 280
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-500/20 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </motion.div>
                <span className="font-semibold text-sm">Área de Transferência</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsMinimized(true)}
                >
                  <span className="text-lg">−</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={clearClipboard}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Item info */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Copy className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {clipboard.originalName}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {entityLabel}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      há {formatTime(timeSinceCopy)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Paste button */}
              <Button
                onClick={handlePaste}
                disabled={isDuplicating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400"
              >
                {isDuplicating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Colando...</span>
                  </div>
                ) : showSuccess ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      ✨
                    </motion.div>
                    <span>Colado!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ClipboardPaste className="h-4 w-4" />
                    <span>Colar (Ctrl+V)</span>
                  </div>
                )}
              </Button>

              {/* Mouse position hint */}
              <p className="text-[10px] text-center text-muted-foreground">
                Posição atual: {Math.round(lastMousePosition.x)}, {Math.round(lastMousePosition.y)}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
