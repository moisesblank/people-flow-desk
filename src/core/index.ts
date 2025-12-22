// ============================================
// 🔥 CORE — ÍNDICE CENTRAL
// Single Source of Truth para todo o sistema
// ============================================

// Rotas
export * from "./routes";
export { default as ROUTES } from "./routes";

// Ações
export * from "./actions";
export { default as ACTIONS } from "./actions";

// Storage
export * from "./storage";
export { default as BUCKETS } from "./storage";

// Function Matrix
export * from "./functionMatrix";
export { default as FUNCTION_MATRIX } from "./functionMatrix";

// Safe Components
export * from "./SafeComponents";

// Navigation
export * from "./nav/navRouteMap";

// ============================================
// VERSÃO
// ============================================
export const CORE_VERSION = "1.0-OMEGA";
export const CORE_BUILD_DATE = "2024-12-22";

// ============================================
// HELPERS GLOBAIS
// ============================================

/**
 * Verifica integridade do core
 */
export function verifyCoreIntegrity(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Verificar imports
  try {
    if (!ROUTES) errors.push("ROUTES não carregado");
    if (!ACTIONS) errors.push("ACTIONS não carregado");
    if (!BUCKETS) errors.push("BUCKETS não carregado");
    if (!FUNCTION_MATRIX) errors.push("FUNCTION_MATRIX não carregado");
  } catch (e) {
    errors.push(`Erro ao verificar imports: ${e}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
