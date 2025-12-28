// ============================================
// ⚡ CORE/ACTIONS — Ações Desacopladas
// Import direto: import { ACTIONS, canExecuteAction } from "@/core/actions-barrel"
// ============================================

export {
  ACTIONS,
  getAction,
  getActionDefinition,
  canExecuteAction,
  requiresConfirmation,
  getActionsByCategory,
  getUserActions,
  auditActions,
  type ActionKey,
  type ActionDefinition,
  type ActionCategory,
} from "../actions";

export { default } from "../actions";
