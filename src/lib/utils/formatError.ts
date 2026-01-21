// ============================================
// 🛡️ FORMAT ERROR — ANTI React Error #61
// Converte QUALQUER erro para string segura
// NUNCA renderize {error} diretamente em JSX!
// Use formatError(error) SEMPRE
// ============================================

/**
 * Converte qualquer tipo de erro para string segura para renderização em React
 * Evita React Error #61: "Objects are not valid as a React child"
 * 
 * @param error - Qualquer tipo de erro (Error, PostgrestError, objeto, string, etc.)
 * @param fallback - Mensagem padrão caso não consiga extrair (default: "Erro desconhecido")
 * @returns String segura para renderização
 */
export function formatError(error: unknown, fallback = "Erro desconhecido"): string {
  // Null/undefined
  if (error === null || error === undefined) {
    return fallback;
  }

  // Já é string
  if (typeof error === "string") {
    return error.trim() || fallback;
  }

  // Número ou booleano
  if (typeof error === "number" || typeof error === "boolean") {
    return String(error);
  }

  // Error nativo ou subclasse
  if (error instanceof Error) {
    return error.message || error.name || fallback;
  }

  // Objeto com propriedades comuns de erro
  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;

    // PostgrestError e similares
    if (typeof obj.message === "string" && obj.message) {
      return obj.message;
    }

    // Supabase error format
    if (typeof obj.error === "string" && obj.error) {
      return obj.error;
    }

    // Error description
    if (typeof obj.error_description === "string" && obj.error_description) {
      return obj.error_description;
    }

    // Details
    if (typeof obj.details === "string" && obj.details) {
      return obj.details;
    }

    // Hint
    if (typeof obj.hint === "string" && obj.hint) {
      return obj.hint;
    }

    // Code (fallback)
    if (typeof obj.code === "string" && obj.code) {
      return `Erro: ${obj.code}`;
    }

    // Último recurso: stringify
    try {
      const str = JSON.stringify(obj);
      if (str && str !== "{}") {
        return str.length > 200 ? str.slice(0, 200) + "..." : str;
      }
    } catch {
      // Objeto circular ou não-serializável
    }
  }

  // Função (não deveria acontecer, mas...)
  if (typeof error === "function") {
    return fallback;
  }

  return fallback;
}

/**
 * Wrapper para usar em catch blocks
 * Retorna a mensagem de erro formatada
 */
export function catchErrorMessage(error: unknown): string {
  return formatError(error, "Ocorreu um erro inesperado");
}

/**
 * Extrai mensagem de erro e loga detalhes no console
 */
export function logAndFormatError(error: unknown, context?: string): string {
  const message = formatError(error);
  console.error(`[${context || 'Error'}]`, error);
  return message;
}

export default formatError;
