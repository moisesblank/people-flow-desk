// ============================================
// 📦 UTILS - Barrel Export
// Utilitários consolidados
// ============================================

// Core utils
export { cn } from '@/lib/utils';

// ============================================
// 🔢 FORMATAÇÃO CENTRALIZADA (CONSTITUIÇÃO v10.x)
// NUNCA declare formatCurrency/formatDate localmente!
// SEMPRE importe daqui: import { formatCurrency } from '@/utils';
// ============================================
export {
  // Moeda
  formatCurrency,
  formatCurrencyFromReais,
  formatCurrencyCompact,
  formatCurrencyMasked,
  formatCurrencyShort,
  // Porcentagem
  formatPercent,
  formatPercentFromValue,
  // Data/Hora
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTime,
  // Números
  formatNumber,
  formatNumberCompact,
  // Documentos
  formatCPF,
  formatCPFMasked,
  formatPhone,
} from './format';

// Sanitization (security)
export {
  escapeHtml,
  sanitizeHtml,
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeName,
  sanitizeMoneyValue,
  sanitizeForLog,
  sanitizeCpf,
  sanitizeJsonString,
  maskEmail,
  maskCpf,
  isValidUuid,
} from '@/lib/sanitize';

// CSV Export
export { exportToCSV } from './exportData';

// Lazy PDF generator
export { getJsPDF, isJsPDFLoaded, preloadJsPDF } from './pdfGeneratorLazy';
