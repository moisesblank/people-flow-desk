/**
 * 🎯 SIMULADOS — Barrel Export
 * Constituição SYNAPSE Ω v10.0
 * 
 * Exporta todos os hooks do sistema de simulados.
 * Nenhum hook aqui afeta o sistema de TREINO.
 */

// Hook principal de tentativas
export { useSimuladoAttempt } from "./useSimuladoAttempt";
export type { 
  SimuladoAttemptConfig, 
  AttemptState, 
  AttemptResult 
} from "./useSimuladoAttempt";

// Hook de timer
export { useSimuladoTimer } from "./useSimuladoTimer";
export type { TimerState } from "./useSimuladoTimer";

// Hook de respostas
export { useSimuladoAnswers } from "./useSimuladoAnswers";
export type { Answer, AnswersState } from "./useSimuladoAnswers";

// Hooks do Modo Hard
export { useTabFocus } from "./useTabFocus";
export type { TabFocusState } from "./useTabFocus";

export { useCameraStream } from "./useCameraStream";
export type { CameraState } from "./useCameraStream";

export { useAntiCheat } from "./useAntiCheat";
export type { AntiCheatState, AntiCheatViolation } from "./useAntiCheat";

// Hook de estado
export { useSimuladoState } from "./useSimuladoState";
