// ============================================
// MOISÉS MEDEIROS v9.0 - MODO MASTER TOGGLE
// Botão flutuante com gradiente roxo/rosa
// Exclusivo para Owner: moisesblank@gmail.com
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, Shield, Wand2, Crown, Eye, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditModeToggleProps {
  isEditMode: boolean;
  canEdit: boolean;
  onToggle: () => void;
  isGodMode?: boolean;
}

export function EditModeToggle({
  isEditMode,
  canEdit,
  onToggle,
  isGodMode = false,
}: EditModeToggleProps) {
  if (!canEdit) return null;

  return (
    <>
      {/* Main Toggle Button */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-6 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl transition-all duration-300",
            isEditMode
              ? "bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white animate-god-pulse"
              : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-500 hover:to-pink-400"
          )}
          style={{
            boxShadow: isEditMode 
              ? "0 0 40px rgba(168, 85, 247, 0.5), 0 0 80px rgba(236, 72, 153, 0.3)" 
              : "0 0 20px rgba(168, 85, 247, 0.3)"
          }}
        >
          <AnimatePresence mode="wait">
            {isEditMode ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
                className="flex items-center gap-2"
              >
                <Crown className="h-5 w-5" />
                <span className="font-bold tracking-wide">MODO MASTER</span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, rotate: 180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -180 }}
                className="flex items-center gap-2"
              >
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Ativar MODO MASTER</span>
                <Wand2 className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Pulse effect when edit mode is active */}
        <AnimatePresence>
          {isEditMode && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: [0.5, 0], scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 -z-10"
              />
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating indicator when in god mode */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed top-20 left-4 z-50"
          >
            <div className="bg-gradient-to-r from-purple-600/90 to-pink-500/90 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl border border-purple-400/30">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Crown className="h-5 w-5 text-yellow-300" />
                </motion.div>
                <div>
                  <p className="font-bold text-sm">MODO MASTER ATIVO</p>
                  <p className="text-xs text-purple-200">Ctrl+Shift+E para sair</p>
                </div>
              </div>
              
              {/* Quick actions */}
              <div className="flex gap-2 mt-3">
                <button className="flex items-center gap-1 px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-xs transition-colors">
                  <Eye className="h-3 w-3" /> Preview
                </button>
                <button className="flex items-center gap-1 px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-xs transition-colors">
                  <History className="h-3 w-3" /> Histórico
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcut hint */}
      <AnimatePresence>
        {!isEditMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 2 }}
            className="fixed bottom-20 left-6 z-40"
          >
            <div className="bg-card/80 backdrop-blur-sm text-muted-foreground px-3 py-1.5 rounded-lg text-xs border border-border/50">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Ctrl</kbd>
              {" + "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift</kbd>
              {" + "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">E</kbd>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
