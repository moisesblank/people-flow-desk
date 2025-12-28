// ============================================
// MOISÉS MEDEIROS v16.0 - GLOBAL DUPLICATION SYSTEM
// Sistema Global de Duplicação com Ctrl+D e Context Menu
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { Copy, Check, Loader2, X, Clipboard, MousePointer } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useInstantDuplication, DuplicableEntity } from '@/hooks/useInstantDuplication';
import { useDuplicationClipboard } from '@/stores/clipboardStore';
import { Button } from '@/components/ui/button';

const OWNER_EMAIL = 'moisesblank@gmail.com';

// Labels amigáveis para entidades
const ENTITY_LABELS: Record<string, string> = {
  course: 'Curso',
  lesson: 'Aula',
  module: 'Módulo',
  quiz: 'Quiz',
  task: 'Tarefa',
  calendar_task: 'Tarefa do Calendário',
  transaction: 'Transação',
  campaign: 'Campanha',
  automation: 'Automação',
  employee: 'Funcionário',
  affiliate: 'Afiliado',
  student: 'Aluno',
  aluno: 'Aluno',
  document: 'Documento',
  category: 'Categoria',
  expense: 'Despesa',
  income: 'Receita',
  conta_pagar: 'Conta a Pagar',
  conta_receber: 'Conta a Receber',
  alerta: 'Alerta',
  contabilidade: 'Registro Contábil',
};

interface SelectedItem {
  element: HTMLElement;
  entityType: DuplicableEntity;
  entityId: string;
  entityName: string;
  rect: DOMRect;
}

export function GlobalDuplicationSystem() {
  const { user } = useAuth();
  const { clipboard, copyToClipboard, pasteFromClipboard, clearClipboard, isDuplicating } = useInstantDuplication();
  const duplicationContext = useDuplicationClipboard();
  
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [showDuplicateButton, setShowDuplicateButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [justDuplicated, setJustDuplicated] = useState(false);

  const isOwner = (user?.email || '').toLowerCase() === OWNER_EMAIL;

  // Detectar itens duplicáveis ao passar o mouse (com data attributes)
  useEffect(() => {
    if (!isOwner) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Procurar elemento com atributo de duplicação
      const duplicableElement = target.closest('[data-duplicable]') as HTMLElement;
      
      if (duplicableElement) {
        const entityType = duplicableElement.dataset.duplicable as DuplicableEntity;
        const entityId = duplicableElement.dataset.entityId;
        const entityName = duplicableElement.dataset.entityName || ENTITY_LABELS[entityType] || 'Item';
        
        if (entityType && entityId) {
          const rect = duplicableElement.getBoundingClientRect();
          
          setSelectedItem({
            element: duplicableElement,
            entityType,
            entityId,
            entityName,
            rect
          });
          
          setButtonPosition({
            x: rect.right - 40,
            y: rect.top + 8
          });
          
          setShowDuplicateButton(true);
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const relatedTarget = e.relatedTarget as HTMLElement;
      
      // Não esconder se movendo para o botão de duplicação
      if (relatedTarget?.closest('[data-duplicate-button]')) {
        return;
      }
      
      // Não esconder se ainda está dentro de um elemento duplicável
      if (relatedTarget?.closest('[data-duplicable]')) {
        return;
      }
      
      setShowDuplicateButton(false);
      setSelectedItem(null);
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isOwner]);

  // Atalho Ctrl+D para duplicar item selecionado
  useEffect(() => {
    if (!isOwner) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ctrl+D - Duplicar item atual
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        
        if (selectedItem) {
          await handleDuplicate();
        } else if (clipboard) {
          await handlePaste();
        } else {
          toast.info('💡 Dica: Passe o mouse sobre um item para duplicá-lo', {
            description: 'Ou use o menu Ctrl+Shift+Q para criar novos itens'
          });
        }
      }

      // Ctrl+C - Copiar item para clipboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }

        if (selectedItem) {
          e.preventDefault();
          await handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwner, selectedItem, clipboard]);

  // Copiar para clipboard
  const handleCopy = useCallback(async () => {
    if (!selectedItem) return;

    const success = await copyToClipboard(selectedItem.entityType, selectedItem.entityId);
    
    if (success) {
      toast.success('📋 Copiado!', {
        description: `"${selectedItem.entityName}" copiado. Pressione Ctrl+V para colar.`
      });
    }
  }, [selectedItem, copyToClipboard]);

  // Colar do clipboard
  const handlePaste = useCallback(async () => {
    if (!clipboard) {
      toast.info('Nada para colar', {
        description: 'Copie um item primeiro com Ctrl+C'
      });
      return;
    }

    const result = await pasteFromClipboard();
    
    if (result.success) {
      setJustDuplicated(true);
      setTimeout(() => setJustDuplicated(false), 2000);
    }
  }, [clipboard, pasteFromClipboard]);

  // Duplicar diretamente
  const handleDuplicate = useCallback(async () => {
    if (!selectedItem) return;

    // Primeiro copiar
    const copied = await copyToClipboard(selectedItem.entityType, selectedItem.entityId);
    
    if (copied) {
      // Depois colar
      setTimeout(async () => {
        const result = await pasteFromClipboard();
        
        if (result.success) {
          setJustDuplicated(true);
          setTimeout(() => setJustDuplicated(false), 2000);
          
          // Animar o elemento original
          selectedItem.element.style.transition = 'all 0.3s ease';
          selectedItem.element.style.boxShadow = '0 0 20px hsl(280 80% 50% / 0.5)';
          setTimeout(() => {
            selectedItem.element.style.boxShadow = '';
          }, 500);
        }
      }, 100);
    }
  }, [selectedItem, copyToClipboard, pasteFromClipboard]);

  if (!isOwner) return null;

  return (
    <>
      {/* Botão flutuante de duplicação */}
      <AnimatePresence>
        {showDuplicateButton && selectedItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            data-duplicate-button
            className="fixed z-[99998] flex items-center gap-1"
            style={{
              top: buttonPosition.y,
              left: buttonPosition.x,
            }}
          >
            <Button
              size="sm"
              variant="default"
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              title="Duplicar (Ctrl+D)"
            >
              {isDuplicating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : justDuplicated ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="ml-1 text-xs">Duplicar</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de clipboard */}
      <AnimatePresence>
        {clipboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-4 z-[99997] bg-primary/90 text-primary-foreground px-4 py-3 rounded-xl shadow-xl flex items-center gap-3"
          >
            <Clipboard className="w-5 h-5" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                "{clipboard.originalName}" copiado
              </span>
              <span className="text-xs opacity-80">
                Ctrl+V para colar • {ENTITY_LABELS[clipboard.entityType] || clipboard.entityType}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearClipboard}
              className="h-6 w-6 p-0 hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dica de duplicação (aparece uma vez) */}
      <DuplicationHint />

      {/* Injetar CSS para destacar elementos duplicáveis */}
      <style>{`
        [data-duplicable]:hover {
          outline: 2px dashed hsl(280 80% 50% / 0.5) !important;
          outline-offset: 2px;
        }
        
        [data-duplicable][data-duplicating="true"] {
          opacity: 0.7;
          pointer-events: none;
        }
        
        .duplicate-flash {
          animation: duplicateFlash 0.5s ease-out;
        }
        
        @keyframes duplicateFlash {
          0% { box-shadow: 0 0 0 0 hsl(280 80% 50% / 0.8); }
          50% { box-shadow: 0 0 30px 10px hsl(280 80% 50% / 0.4); }
          100% { box-shadow: 0 0 0 0 hsl(280 80% 50% / 0); }
        }
      `}</style>
    </>
  );
}

// Dica que aparece uma vez para o usuário
function DuplicationHint() {
  const [showHint, setShowHint] = useState(false);
  const { user } = useAuth();
  const isOwner = (user?.email || '').toLowerCase() === OWNER_EMAIL;

  useEffect(() => {
    if (!isOwner) return;

    // Verificar se já mostrou a dica
    const hasShownHint = localStorage.getItem('mm-duplication-hint-shown');
    if (!hasShownHint) {
      setTimeout(() => {
        setShowHint(true);
        localStorage.setItem('mm-duplication-hint-shown', 'true');
      }, 3000);
    }
  }, [isOwner]);

  if (!showHint) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-20 right-4 z-[99996] bg-gradient-to-r from-primary/90 to-purple-600/90 text-primary-foreground p-4 rounded-xl shadow-2xl max-w-sm"
    >
      <div className="flex items-start gap-3">
        <Copy className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold mb-1">💡 Dica: Duplicação Rápida</h4>
          <p className="text-sm opacity-90 mb-2">
            Passe o mouse sobre qualquer item com borda tracejada para ver o botão de duplicar, ou use:
          </p>
          <div className="flex flex-col gap-1 text-xs bg-black/20 p-2 rounded">
            <span><kbd className="px-1 bg-white/20 rounded">Ctrl+C</kbd> Copiar item</span>
            <span><kbd className="px-1 bg-white/20 rounded">Ctrl+V</kbd> Colar item</span>
            <span><kbd className="px-1 bg-white/20 rounded">Ctrl+D</kbd> Duplicar diretamente</span>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowHint(false)}
          className="h-6 w-6 p-0 hover:bg-white/20 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export default GlobalDuplicationSystem;
