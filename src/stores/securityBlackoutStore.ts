// ============================================
// 🚨 BLACKOUT ANTI-PIRATARIA v1.0
// Store Zustand para persistência de violações
// Rota alvo: /alunos/videoaulas
// ============================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViolationType = 
  | "devtools" 
  | "printscreen" 
  | "screenshot" 
  | "screen_capture" 
  | "window_blur"
  | "copy";

export type BlockType = "permanent" | "temporary" | null;

interface ViolationRecord {
  type: ViolationType;
  timestamp: number;
  url: string;
}

interface SecurityBlackoutState {
  // Estado de bloqueio
  isBlocked: boolean;
  blockType: BlockType;
  blockEndTime: number | null; // timestamp para bloqueio temporário
  
  // Contadores progressivos
  printScreenCount: number;
  copyCount: number;
  
  // Histórico
  lastViolationType: ViolationType | null;
  violations: ViolationRecord[];
  
  // Punição intensificada de watermark
  watermarkBoostEndTime: number | null;
  
  // Actions
  registerViolation: (type: ViolationType, url: string) => void;
  clearTemporaryBlock: () => void;
  resetAll: () => void; // Para owner/debug
  checkAndClearExpiredBlocks: () => void;
}

// Violações SEVERAS = bloqueio permanente IMEDIATO
const SEVERE_VIOLATIONS: ViolationType[] = ["devtools", "window_blur", "screen_capture"];

// Violações LEVES = punição progressiva
const MINOR_VIOLATIONS: ViolationType[] = ["printscreen", "screenshot", "copy"];

export const useSecurityBlackoutStore = create<SecurityBlackoutState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      isBlocked: false,
      blockType: null,
      blockEndTime: null,
      printScreenCount: 0,
      copyCount: 0,
      lastViolationType: null,
      violations: [],
      watermarkBoostEndTime: null,

      registerViolation: (type: ViolationType, url: string) => {
        const state = get();
        const now = Date.now();
        
        // Registrar violação no histórico
        const newViolation: ViolationRecord = { type, timestamp: now, url };
        const updatedViolations = [...state.violations, newViolation].slice(-50); // Manter últimas 50
        
        // ═══════════════════════════════════════════════════════════
        // VIOLAÇÃO SEVERA → BLOQUEIO PERMANENTE IMEDIATO
        // ═══════════════════════════════════════════════════════════
        if (SEVERE_VIOLATIONS.includes(type)) {
          set({
            isBlocked: true,
            blockType: "permanent",
            blockEndTime: null,
            lastViolationType: type,
            violations: updatedViolations,
          });
          return;
        }
        
        // ═══════════════════════════════════════════════════════════
        // VIOLAÇÃO LEVE → PUNIÇÃO PROGRESSIVA
        // ═══════════════════════════════════════════════════════════
        if (type === "printscreen" || type === "screenshot") {
          const newCount = state.printScreenCount + 1;
          
          if (newCount === 1) {
            // 1ª vez: Warning + watermark intensificado por 60s
            set({
              printScreenCount: newCount,
              lastViolationType: type,
              violations: updatedViolations,
              watermarkBoostEndTime: now + 60000, // 60s de watermark intenso
            });
          } else if (newCount === 2) {
            // 2ª vez: Bloqueio temporário de 30s
            set({
              printScreenCount: newCount,
              isBlocked: true,
              blockType: "temporary",
              blockEndTime: now + 30000, // 30s de bloqueio
              lastViolationType: type,
              violations: updatedViolations,
            });
          } else {
            // 3ª+ vez: Bloqueio permanente
            set({
              printScreenCount: newCount,
              isBlocked: true,
              blockType: "permanent",
              blockEndTime: null,
              lastViolationType: type,
              violations: updatedViolations,
            });
          }
          return;
        }
        
        if (type === "copy") {
          const newCount = state.copyCount + 1;
          
          if (newCount >= 3) {
            // 3ª cópia: Bloqueio temporário de 15s
            set({
              copyCount: newCount,
              isBlocked: true,
              blockType: "temporary",
              blockEndTime: now + 15000,
              lastViolationType: type,
              violations: updatedViolations,
            });
          } else {
            // Apenas registrar
            set({
              copyCount: newCount,
              lastViolationType: type,
              violations: updatedViolations,
            });
          }
          return;
        }
        
        // Fallback: registrar qualquer outra violação
        set({
          lastViolationType: type,
          violations: updatedViolations,
        });
      },

      clearTemporaryBlock: () => {
        const state = get();
        if (state.blockType === "temporary") {
          set({
            isBlocked: false,
            blockType: null,
            blockEndTime: null,
          });
        }
      },

      checkAndClearExpiredBlocks: () => {
        const state = get();
        const now = Date.now();
        
        // Limpar bloqueio temporário expirado
        if (state.blockType === "temporary" && state.blockEndTime && now >= state.blockEndTime) {
          set({
            isBlocked: false,
            blockType: null,
            blockEndTime: null,
          });
        }
        
        // Limpar boost de watermark expirado
        if (state.watermarkBoostEndTime && now >= state.watermarkBoostEndTime) {
          set({ watermarkBoostEndTime: null });
        }
      },

      resetAll: () => {
        set({
          isBlocked: false,
          blockType: null,
          blockEndTime: null,
          printScreenCount: 0,
          copyCount: 0,
          lastViolationType: null,
          violations: [],
          watermarkBoostEndTime: null,
        });
      },
    }),
    {
      name: "security-blackout-v1",
      // Persistir apenas campos críticos
      partialize: (state) => ({
        isBlocked: state.isBlocked,
        blockType: state.blockType,
        blockEndTime: state.blockEndTime,
        printScreenCount: state.printScreenCount,
        copyCount: state.copyCount,
        violations: state.violations,
      }),
    }
  )
);
