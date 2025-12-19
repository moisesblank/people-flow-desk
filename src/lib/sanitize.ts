// ============================================
// MASTER PRO ULTRA v3.0 - SANITIZAÇÃO DE INPUT
// Prevenção de XSS e SQL Injection
// ============================================

// Sanitizar HTML básico (remove scripts maliciosos)
export function sanitizeHtml(dirty: string): string {
  return dirty
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
}

// Sanitizar texto puro (sem HTML)
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, 10000); // Limite de 10k caracteres
}

// Validar e sanitizar email
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.toLowerCase().trim().slice(0, 255);

  if (!emailRegex.test(sanitized)) {
    return null;
  }

  return sanitized;
}

// Validar e sanitizar telefone
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(0, 15);
}

// Sanitizar para uso em URLs
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    // Permitir apenas http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

// Validar UUID
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Sanitizar nome (apenas letras, números, espaços)
export function sanitizeName(name: string): string {
  if (!name) return '';
  return name
    .replace(/[^a-zA-ZÀ-ÿ0-9\s\-\.]/g, '')
    .trim()
    .slice(0, 255);
}

// Sanitizar valor monetário
export function sanitizeMoneyValue(value: string | number): number {
  if (typeof value === 'number') {
    return Math.max(0, Math.round(value * 100) / 100);
  }
  const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed * 100) / 100);
}

// Escape para exibição segura
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
