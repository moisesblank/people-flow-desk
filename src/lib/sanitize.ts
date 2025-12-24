// ============================================
// 🛡️ MASTER PRO ULTRA v4.0 - SANITIZAÇÃO BANK-GRADE
// Prevenção de XSS, SQL Injection e Data Exposure
// LEI III SEGURANÇA + OWASP ASVS L2
// ============================================

/**
 * NÍVEL 1: Escape HTML completo (MAIS SEGURO)
 * Converte TODOS os caracteres especiais em entidades HTML
 * Use para: qualquer texto do usuário exibido na UI
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

/**
 * NÍVEL 2: Sanitizar HTML (remove tags perigosas)
 * Remove scripts, iframes, event handlers, data URIs
 * Use para: conteúdo que PRECISA manter algum HTML
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return dirty
    // Remove scripts e variações
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*\/>/gi, '')
    // Remove iframes
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<iframe[^>]*\/>/gi, '')
    // Remove styles (pode conter expression/behavior)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove objetos e embeds
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<applet[^>]*>[\s\S]*?<\/applet>/gi, '')
    // Remove links perigosos
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    // Remove event handlers (on*)
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')
    // Remove SVG com scripts
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    // Remove meta refresh
    .replace(/<meta[^>]*http-equiv[^>]*refresh[^>]*>/gi, '')
    // Remove base tags
    .replace(/<base[^>]*>/gi, '')
    // Remove form actions perigosos
    .replace(/formaction\s*=/gi, 'data-blocked=');
}

/**
 * NÍVEL 3: Sanitizar texto puro (sem HTML permitido)
 * Use para: campos de formulário, nomes, descrições
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control chars
    .trim()
    .slice(0, 10000);
}

/**
 * Validar e sanitizar email
 * Previne header injection e normaliza formato
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;
  
  // Remove caracteres de controle e newlines (header injection)
  const cleaned = email
    .replace(/[\r\n\x00-\x1F\x7F]/g, '')
    .toLowerCase()
    .trim()
    .slice(0, 255);
  
  // RFC 5322 simplified
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  
  if (!emailRegex.test(cleaned)) {
    return null;
  }
  
  return cleaned;
}

/**
 * Validar e sanitizar telefone
 * Apenas dígitos, formato internacional
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(0, 15);
}

/**
 * Sanitizar para uso em URLs
 * Previne open redirect e protocol injection
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    // Apenas http/https permitidos
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    // Bloquear credenciais na URL
    if (parsed.username || parsed.password) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Validar UUID v4
 */
export function isValidUuid(uuid: string): boolean {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitizar nome
 * Apenas letras, números, espaços, hífen, ponto
 */
export function sanitizeName(name: string): string {
  if (!name) return '';
  return name
    .replace(/[^a-zA-ZÀ-ÿ0-9\s\-\.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 255);
}

/**
 * Sanitizar valor monetário
 * Previne NaN e valores negativos
 */
export function sanitizeMoneyValue(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.round(value * 100) / 100);
  }
  const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed * 100) / 100);
}

/**
 * Sanitizar para log (remove PII)
 * Use em console.log para não expor dados sensíveis
 */
export function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const PII_FIELDS = ['email', 'cpf', 'telefone', 'phone', 'password', 'senha', 'token', 'secret', 'key', 'apiKey', 'api_key'];
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (PII_FIELDS.some(pii => lowerKey.includes(pii))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 50) {
      result[key] = value.substring(0, 20) + '...[TRUNCATED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeForLog(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Mascarar email para exibição
 * ex: m***@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';
  return `${local[0]}***@${domain}`;
}

/**
 * Mascarar CPF para exibição
 * ex: ***.***.123-45
 */
export function maskCpf(cpf: string): string {
  if (!cpf) return '';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return '***.***.***-**';
  return `***.***${clean.substring(6, 9)}-${clean.substring(9)}`;
}

/**
 * Validar e sanitizar CPF
 */
export function sanitizeCpf(cpf: string): string | null {
  if (!cpf) return null;
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return null;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(clean)) return null;
  
  // Validar dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i]) * (10 - i);
  }
  let d1 = ((sum * 10) % 11) % 10;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i]) * (11 - i);
  }
  let d2 = ((sum * 10) % 11) % 10;
  
  if (d1 !== parseInt(clean[9]) || d2 !== parseInt(clean[10])) {
    return null;
  }
  
  return clean;
}

/**
 * Sanitizar JSON string (previne prototype pollution)
 */
export function sanitizeJsonString(json: string): string | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    
    // Prevenir prototype pollution
    const dangerous = ['__proto__', 'constructor', 'prototype'];
    const check = (obj: unknown): boolean => {
      if (typeof obj !== 'object' || obj === null) return true;
      for (const key of Object.keys(obj as object)) {
        if (dangerous.includes(key)) return false;
        if (!check((obj as Record<string, unknown>)[key])) return false;
      }
      return true;
    };
    
    if (!check(parsed)) return null;
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}
