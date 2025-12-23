// ============================================
// MOISÉS MEDEIROS v18.0 - MASTER FLOATING PANEL
// Painel flutuante com TODOS os poderes do OWNER
// Controle total sobre URLs, Seções, Edição, Drag
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { 
  Crown, Link2, Layers, Settings, Edit3,
  Eye, EyeOff, Wand2, RotateCcw, Redo2,
  MousePointer, Sparkles, ChevronRight, X,
  Grid3X3, Move, Palette, Code, Zap, Shield,
  GripVertical, RefreshCw, Save, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGodMode } from '@/contexts/GodModeContext';
import { MasterSectionOrganizer } from './MasterSectionOrganizer';
import { useMasterDrag } from '@/hooks/useMasterDrag';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MasterFloatingPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MasterFloatingPanel({ isOpen, onToggle }: MasterFloatingPanelProps) {
  const { isOwner, isActive, toggle: toggleMaster } = useGodMode();
  const [showSectionOrganizer, setShowSectionOrganizer] = useState(false);
  const { isDragModeActive, setIsDragModeActive, resetAllPositions } = useMasterDrag();

  // Atalho para abrir painel
  useEffect(() => {
    if (!isOwner) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+M = Toggle Painel Master
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        onToggle();
      }
      // Ctrl+Shift+O = Organizar Seções
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        setShowSectionOrganizer(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwner, onToggle]);

  if (!isOwner) return null;

  const tools = [
    {
      id: 'edit-mode',
      label: 'Modo Edição',
      description: isActive ? 'Desativar edição' : 'Ativar edição visual',
      icon: Edit3,
      active: isActive,
      onClick: toggleMaster,
      color: 'from-purple-500 to-pink-500',
      shortcut: 'Ctrl+Shift+E',
    },
    {
      id: 'drag-mode',
      label: 'Modo Arrastar',
      description: isDragModeActive ? 'Desativar drag' : 'Arrastar elementos',
      icon: Move,
      active: isDragModeActive,
      onClick: () => {
        setIsDragModeActive(!isDragModeActive);
        toast(isDragModeActive ? 'Modo Drag DESATIVADO' : 'Modo Drag ATIVADO', {
          description: !isDragModeActive ? 'Alt+Click para arrastar qualquer elemento' : '',
        });
      },
      color: 'from-orange-500 to-amber-500',
      shortcut: 'Ctrl+Shift+D',
    },
    {
      id: 'url-edit',
      label: 'Editar URLs',
      description: 'Ctrl+Click em qualquer link',
      icon: Link2,
      active: false,
      onClick: () => toast.info('Ctrl+Click ou Alt+Click em qualquer link para editar URL'),
      color: 'from-blue-500 to-cyan-500',
      shortcut: 'Ctrl+Click',
    },
    {
      id: 'sections',
      label: 'Organizar Seções',
      description: 'Reordenar seções da landing',
      icon: Layers,
      active: showSectionOrganizer,
      onClick: () => setShowSectionOrganizer(true),
      color: 'from-green-500 to-emerald-500',
      shortcut: 'Ctrl+Shift+O',
    },
  ];

  const quickActions = [
    {
      id: 'undo',
      label: 'Desfazer',
      icon: RotateCcw,
      shortcut: 'Ctrl+Z',
      onClick: () => window.dispatchEvent(new CustomEvent('master-undo')),
    },
    {
      id: 'redo',
      label: 'Refazer',
      icon: Redo2,
      shortcut: 'Ctrl+Y',
      onClick: () => window.dispatchEvent(new CustomEvent('master-redo')),
    },
    {
      id: 'reset-drag',
      label: 'Resetar',
      icon: RefreshCw,
      onClick: resetAllPositions,
    },
  ];

  return (
    <>
      {/* Botão Flutuante Principal */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-[9999]"
        data-master-panel
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className={cn(
            "relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center",
            "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
            (isActive || isDragModeActive) && "ring-4 ring-purple-400/50 animate-pulse"
          )}
          style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.5)' }}
        >
          <Crown className="w-7 h-7 text-white" />
          {(isActive || isDragModeActive) && (
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Painel Expandido */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-[9998] w-80"
            data-master-panel
          >
            <div 
              className="bg-card/95 backdrop-blur-xl rounded-2xl border-2 border-primary/30 shadow-2xl overflow-hidden"
              style={{ boxShadow: '0 0 60px rgba(168, 85, 247, 0.3)' }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-500/20 p-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">MASTER CONTROL v18</h3>
                      <p className="text-[10px] text-muted-foreground">Controle Total do Sistema</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tools */}
              <div className="p-3 space-y-2">
                {tools.map((tool) => (
                  <motion.button
                    key={tool.id}
                    whileHover={{ x: 4 }}
                    onClick={tool.onClick}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                      "hover:bg-muted/50 border border-transparent",
                      tool.active && "bg-primary/10 border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg bg-gradient-to-br",
                      tool.color
                    )}>
                      <tool.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{tool.label}</span>
                        {tool.active && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-green-500/20 text-green-400 rounded-full">
                            ATIVO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{tool.description}</p>
                    </div>
                    <div className="text-[9px] text-muted-foreground bg-muted px-2 py-1 rounded">
                      {tool.shortcut}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Drag Mode Instructions */}
              {isDragModeActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-3 pb-3"
                >
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-orange-400 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-bold text-orange-400 mb-1">Modo Drag Ativo</p>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• Alt+Click para arrastar</li>
                          <li>• Solte para reposicionar</li>
                          <li>• Posições salvas automaticamente</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Actions */}
              <div className="p-3 pt-0 flex gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={action.onClick}
                    className="flex-1 text-xs"
                  >
                    <action.icon className="h-3 w-3 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Status Bar */}
              <div className="bg-muted/30 p-3 border-t border-border/50">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">Owner: moisesblank@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <Sparkles className="h-3 w-3" />
                    <span>v18.0</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Organizador de Seções */}
      <MasterSectionOrganizer
        isOpen={showSectionOrganizer}
        onClose={() => setShowSectionOrganizer(false)}
      />
    </>
  );
}
