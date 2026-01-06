// ============================================
// 🛡️ SAFE OPTION TEXT HELPER
// Previne erro "Objects are not valid as a React child"
// Garante que qualquer option.text seja string
// ============================================

/**
 * Extrai texto seguro de uma opção de questão.
 * Trata casos onde option.text pode ser:
 * - string (retorna direto)
 * - objeto {id, text} aninhado (extrai .text)
 * - null/undefined (retorna string vazia)
 * - qualquer outro tipo (converte para string)
 */
export function safeOptionText(optionText: unknown): string {
  // Caso 1: Já é string
  if (typeof optionText === 'string') {
    return optionText;
  }
  
  // Caso 2: É null/undefined
  if (optionText == null) {
    return '';
  }
  
  // Caso 3: É objeto com propriedade .text (aninhamento)
  if (typeof optionText === 'object' && 'text' in optionText) {
    const nestedText = (optionText as { text: unknown }).text;
    // Recursão para tratar aninhamento duplo
    return safeOptionText(nestedText);
  }
  
  // Caso 4: Qualquer outro tipo - coerção segura
  return String(optionText);
}

/**
 * Extrai texto seguro de uma opção completa (objeto ou string).
 * Para uso quando a opção pode ser string direta ou objeto {id, text}.
 */
export function safeOption(option: unknown): string {
  if (typeof option === 'string') {
    return option;
  }
  
  if (option == null) {
    return '';
  }
  
  if (typeof option === 'object' && 'text' in option) {
    return safeOptionText((option as { text: unknown }).text);
  }
  
  return String(option);
}
