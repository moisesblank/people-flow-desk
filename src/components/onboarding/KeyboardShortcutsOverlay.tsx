// ============================================
// SYNAPSE v14.0 - KEYBOARD SHORTCUTS OVERLAY
// Overlay de atalhos de teclado (tecla ?)
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, Command, Navigation, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KEYBOARD_SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsOverlay({ isOpen, onClose }: KeyboardShortcutsOverlayProps) {
  const systemShortcuts = KEYBOARD_SHORTCUTS.filter(s => s.category === "system");
  const navigationShortcuts = KEYBOARD_SHORTCUTS.filter(s => s.category === "navigation");
  const actionShortcuts = KEYBOARD_SHORTCUTS.filter(s => s.category === "action");

  const renderKey = (shortcut: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }) => {
    const keys: string[] = [];
    if (shortcut.ctrl) keys.push("Ctrl");
    if (shortcut.shift) keys.push("Shift");
    if (shortcut.alt) keys.push("Alt");
    keys.push(shortcut.key);
    
    return (
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i}>
            <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border shadow-sm">
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="text-muted-foreground mx-0.5">+</span>}
          </span>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl z-[9999] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Keyboard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Atalhos de Teclado</h2>
                  <p className="text-xs text-muted-foreground">SYNAPSE v14.0</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Sistema */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-sm">Sistema</h3>
                  <Badge variant="outline" className="text-[10px]">Essenciais</Badge>
                </div>
                <div className="space-y-2">
                  {systemShortcuts.map((shortcut, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-foreground">{shortcut.description}</span>
                      {renderKey(shortcut)}
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Navegação */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="w-4 h-4 text-stats-blue" />
                  <h3 className="font-medium text-sm">Navegação Rápida</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {navigationShortcuts.map((shortcut, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.03 }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-xs text-foreground">{shortcut.description}</span>
                      {renderKey(shortcut)}
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Ações */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Command className="w-4 h-4 text-stats-gold" />
                  <h3 className="font-medium text-sm">Ações Rápidas</h3>
                </div>
                <div className="space-y-2">
                  {actionShortcuts.map((shortcut, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-foreground">{shortcut.description}</span>
                      {renderKey(shortcut)}
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30">
              <p className="text-xs text-center text-muted-foreground">
                Pressione <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">?</kbd> a qualquer momento para ver este menu
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default KeyboardShortcutsOverlay;
