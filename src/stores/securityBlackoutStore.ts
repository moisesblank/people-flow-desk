// ============================================
// 🚨 BLACKOUT ANTI-PIRATARIA v1.2
// Store Zustand para persistência de violações
// PROTEÇÃO GLOBAL + DETECÇÃO DE GRAVAÇÃO
// ============================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViolationType = 
  | "devtools" 
  | "printscreen" 
  | "screenshot" 
  | "screen_capture" 
  | "window_blur"
  | "copy"
  // v1.2: Novos tipos de violação
  | "recording_api"          // getDisplayMedia/MediaRecorder
  | "recording_extension"    // Loom, Vidyard, etc.
  | "picture_in_picture"     // PiP detectado
  | "suspicious_blur";       // Padrão suspeito de blur (5+ em <3s)

export type BlockType = "permanent" | "temporary" | null;

interface ViolationRecord {
  type: ViolationType;
  timestamp: number;
  url: string;
  details?: string; // v1.2: Detalhes adicionais
}

interface SecurityBlackoutState {
  // Estado de bloqueio
  isBlocked: boolean;
  blockType: BlockType;
  blockEndTime: number | null; // timestamp para bloqueio temporário
  
  // Contadores progressivos
  printScreenCount: number;
  copyCount: number;
  blurCount: number;              // v1.2: Contador de blurs rápidos
  lastBlurTimestamp: number;      // v1.2: Timestamp do último blur
  
  // Histórico
  lastViolationType: ViolationType | null;
  violations: ViolationRecord[];
  
  // Punição intensificada de watermark
  watermarkBoostEndTime: number | null;
  
  // Actions
  registerViolation: (type: ViolationType, url: string, details?: string) => void;
  clearTemporaryBlock: () => void;
  resetAll: () => void; // Para owner/debug
  checkAndClearExpiredBlocks: () => void;
  registerBlur: () => boolean; // v1.2: Retorna true se padrão suspeito detectado
}

// v1.2: Violações SEVERAS = bloqueio permanente IMEDIATO
// REMOVIDO window_blur - agora usa padrão suspeito (5+ em <3s)
const SEVERE_VIOLATIONS: ViolationType[] = [
  "devtools", 
  "screen_capture",
  "recording_api",           // API de gravação
  "recording_extension",     // Extensão de gravação
  "picture_in_picture",      // PiP
  "suspicious_blur",         // 5+ blurs rápidos
];

// Violações LEVES = punição progressiva
const MINOR_VIOLATIONS: ViolationType[] = ["printscreen", "screenshot", "copy", "window_blur"];

// v1.2: Constantes para detecção de blur pattern
const BLUR_PATTERN_THRESHOLD = 5;     // 5 blurs rápidos = suspeito
const BLUR_PATTERN_WINDOW_MS = 3000;  // Em menos de 3 segundos

export const useSecurityBlackoutStore = create<SecurityBlackoutState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      isBlocked: false,
      blockType: null,
      blockEndTime: null,
      printScreenCount: 0,
      copyCount: 0,
      blurCount: 0,           // v1.2
      lastBlurTimestamp: 0,   // v1.2
      lastViolationType: null,
      violations: [],
      watermarkBoostEndTime: null,

      // v1.2: Registrar blur e verificar padrão suspeito
      registerBlur: (): boolean => {
        const state = get();
        const now = Date.now();
        
        // Se o último blur foi há menos de 3 segundos, incrementar contador
        if (now - state.lastBlurTimestamp < BLUR_PATTERN_WINDOW_MS) {
          const newCount = state.blurCount + 1;
          
          if (newCount >= BLUR_PATTERN_THRESHOLD) {
            // Padrão suspeito detectado! Reset contador e retornar true
            set({
              blurCount: 0,
              lastBlurTimestamp: now,
            });
            return true; // Padrão suspeito!
          }
          
          set({
            blurCount: newCount,
            lastBlurTimestamp: now,
          });
        } else {
          // Reset contador - começar nova janela
          set({
            blurCount: 1,
            lastBlurTimestamp: now,
          });
        }
        
        return false; // Sem padrão suspeito
      },

      registerViolation: (type: ViolationType, url: string, details?: string) => {
        const state = get();
        const now = Date.now();
        
        // Registrar violação no histórico
        const newViolation: ViolationRecord = { type, timestamp: now, url, details };
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

        // v1.2: window_blur agora é leve (não bloqueia imediatamente)
        if (type === "window_blur") {
          set({
            lastViolationType: type,
            violations: updatedViolations,
          });
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
          blurCount: 0,           // v1.2
          lastBlurTimestamp: 0,   // v1.2
          lastViolationType: null,
          violations: [],
          watermarkBoostEndTime: null,
        });
      },
    }),
    {
      name: "security-blackout-v1.2", // v1.2: Nova versão do storage
      // Persistir apenas campos críticos
      partialize: (state) => ({
        isBlocked: state.isBlocked,
        blockType: state.blockType,
        blockEndTime: state.blockEndTime,
        printScreenCount: state.printScreenCount,
        copyCount: state.copyCount,
        blurCount: state.blurCount,           // v1.2
        lastBlurTimestamp: state.lastBlurTimestamp, // v1.2
        violations: state.violations,
      }),
    }
  )
);
