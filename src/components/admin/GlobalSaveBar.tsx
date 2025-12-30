// ============================================
// 👑 GLOBAL SAVE BAR — MASTER MODE TRANSACTIONAL
// Barra fixa inferior que aparece quando há mudanças pendentes
// Permite salvar ou descartar todas as alterações
// ============================================

import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMasterTransaction } from '@/stores/masterModeTransactionStore';
import { useGodMode } from '@/stores/godModeStore';

export const GlobalSaveBar = memo(function GlobalSaveBar() {
  const { isOwner, isActive } = useGodMode();
  const { isDirty, changeCount, isCommitting, commitAll, discardAll } = useMasterTransaction();

  // Guard: só aparece se Owner + Master Mode ativo + tem mudanças
  const shouldShow = isOwner && isActive && isDirty;

  // Listener para beforeunload - avisar antes de sair com mudanças pendentes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Atalho de teclado: Ctrl+S para salvar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isDirty && !isCommitting) {
        e.preventDefault();
        commitAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isCommitting, commitAll]);

  const handleSave = async () => {
    const result = await commitAll();
    if (!result.success && result.error) {
      console.error('Save failed:', result.error);
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none"
        >
          <div className="max-w-3xl mx-auto px-4 pb-4 pointer-events-auto">
            <div className="bg-gradient-to-r from-purple-900/95 via-fuchsia-900/95 to-purple-900/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Ícone e mensagem */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      Você tem alterações não salvas
                    </p>
                    <p className="text-purple-200/70 text-xs">
                      {changeCount} {changeCount === 1 ? 'alteração pendente' : 'alterações pendentes'} 
                      <span className="text-purple-400 ml-2">• Ctrl+S para salvar</span>
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={discardAll}
                    disabled={isCommitting}
                    className="text-purple-200 hover:text-white hover:bg-purple-800/50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Descartar
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isCommitting}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30"
                  >
                    {isCommitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Salvar alterações
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
