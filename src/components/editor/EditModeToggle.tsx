// ============================================
// MOISÉS MEDEIROS v7.0 - EDIT MODE TOGGLE
// Botão flutuante para ativar modo de edição
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Check, Shield, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditModeToggleProps {
  isEditMode: boolean;
  canEdit: boolean;
  onToggle: () => void;
}

export function EditModeToggle({
  isEditMode,
  canEdit,
  onToggle,
}: EditModeToggleProps) {
  if (!canEdit) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className={cn(
          "flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl transition-all duration-300",
          isEditMode
            ? "bg-green-500 text-white"
            : "bg-primary text-primary-foreground"
        )}
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
              <Check className="h-5 w-5" />
              <span className="font-semibold">Editando</span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              >
                <Wand2 className="h-4 w-4" />
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
              <span className="font-semibold">Modo Edição</span>
              <Edit3 className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Pulse effect when edit mode is active */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0.5, 0], scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full bg-green-500 -z-10"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
