/**
 * 🛡️ FORMAT ERROR UTILITY v1.0
 * Previne React Error #61: "Objects are not valid as React child"
 * Converte qualquer tipo de erro em string segura para renderização
 */

export function formatError(err: unknown): string {
  if (!err) return 'Erro desconhecido';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || 'Erro desconhecido';
  
  // Tentar converter objeto para string
  try {
    const str = JSON.stringify(err);
    // Se for um objeto vazio ou muito longo, retornar mensagem genérica
    if (str === '{}' || str.length > 500) {
      return 'Ocorreu um erro inesperado';
    }
    return str;
  } catch {
    return String(err) || 'Erro desconhecido';
  }
}

export default formatError;
