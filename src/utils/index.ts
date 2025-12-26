// ============================================
// 📦 UTILS - Barrel Export
// Utilitários consolidados
// ============================================

// Core utils
export { cn } from '@/lib/utils';

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
