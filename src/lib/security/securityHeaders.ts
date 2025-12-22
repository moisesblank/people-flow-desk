// ============================================
// 🛡️ Ω3.6: CSP + SECURITY HEADERS
// CONFIGURAÇÃO DE HEADERS DE SEGURANÇA
// ============================================

/**
 * Headers de segurança para aplicação
 * Usar em _headers do Netlify/Vercel ou middleware
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.supabase.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
    "media-src 'self' blob: https://*.supabase.co",
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),

  // Strict Transport Security (HSTS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent clickjacking
  'X-Frame-Options': 'SAMEORIGIN',

  // XSS Protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy (Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),

  // Prevent browsers from caching sensitive pages
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
  'Expires': '0',
} as const;

/**
 * Headers específicos para assets protegidos
 */
export const PROTECTED_ASSET_HEADERS = {
  ...SECURITY_HEADERS,
  'Content-Disposition': 'inline',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
} as const;

/**
 * Headers para edge functions que servem conteúdo protegido
 */
export const EDGE_FUNCTION_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'no-store',
} as const;

/**
 * Função para aplicar headers de segurança em resposta
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Gera meta tags CSP para inserir no HTML
 */
export function generateCSPMetaTag(): string {
  return `<meta http-equiv="Content-Security-Policy" content="${SECURITY_HEADERS['Content-Security-Policy']}">`;
}

export default SECURITY_HEADERS;
