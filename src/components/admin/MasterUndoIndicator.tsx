// ============================================
// MOISÉS MEDEIROS v15.0 - MASTER UNDO INDICATOR
// Indicador visual de undo/redo disponível
// Mostra atalhos e histórico
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Redo2, History, Trash2 } from 'lucide-react';
import { useGodMode } from '@/stores/godModeStore';
import { useMasterUndo } from '@/hooks/useMasterUndo';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function MasterUndoIndicator() {
  const { isOwner, isActive } = useGodMode();
  const { 
    undo, 
    redo, 
    clearHistory,
    canUndo, 
    canRedo, 
    undoCount, 
    redoCount,
    lastAction,
    isProcessing 
  } = useMasterUndo();

  if (!isOwner || !isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 left-4 z-[9999] flex items-center gap-1 bg-background/95 backdrop-blur-xl border border-primary/30 rounded-full shadow-xl px-2 py-1"
      style={{ boxShadow: '0 0 30px hsl(280 80% 50% / 0.2)' }}
    >
      <TooltipProvider delayDuration={100}>
        {/* Undo Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => undo()}
              disabled={!canUndo || isProcessing}
            >
              <Undo2 className={`w-4 h-4 ${canUndo ? 'text-primary' : 'text-muted-foreground'}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span>Desfazer</span>
              <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Ctrl+Z</kbd>
            </div>
            {lastAction && (
              <span className="text-xs text-muted-foreground">
                {lastAction.description}
              </span>
            )}
            {undoCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {undoCount} ação(ões) no histórico
              </span>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Redo Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => redo()}
              disabled={!canRedo || isProcessing}
            >
              <Redo2 className={`w-4 h-4 ${canRedo ? 'text-primary' : 'text-muted-foreground'}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span>Refazer</span>
              <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Ctrl+Y</kbd>
            </div>
            {redoCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {redoCount} ação(ões) para refazer
              </span>
            )}
          </TooltipContent>
        </Tooltip>

        {/* History Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <History className="w-4 h-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" side="top" align="start">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm font-medium">Histórico de Ações</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-destructive"
                  onClick={clearHistory}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Limpar
                </Button>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {undoCount === 0 && redoCount === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma ação registrada
                  </p>
                ) : (
                  <>
                    <div className="text-xs text-muted-foreground">
                      ↩️ {undoCount} para desfazer • ↪️ {redoCount} para refazer
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 border-t text-[10px] text-muted-foreground space-y-0.5">
                <p>Ctrl+Z → Desfazer</p>
                <p>Ctrl+Y / Ctrl+Shift+Z → Refazer</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </TooltipProvider>

      {/* Contador visual */}
      {(undoCount > 0 || redoCount > 0) && (
        <div className="text-[10px] text-muted-foreground px-2 border-l border-border">
          {undoCount}/{redoCount}
        </div>
      )}
    </motion.div>
  );
}
