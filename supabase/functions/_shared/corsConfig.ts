// ============================================
// 🛡️ CORS CONFIGURATION — LEI VI COMPLIANCE
// CENTRALIZADO PARA TODAS AS EDGE FUNCTIONS
// ============================================

/**
 * Domínios permitidos (ALLOWLIST)
 * Adicionar novos domínios aqui conforme necessário
 */
export const ALLOWED_ORIGINS = [
  // Produção
  'https://gestao.moisesmedeiros.com.br',
  'https://pro.moisesmedeiros.com.br',
  'https://moisesmedeiros.com.br',
  'https://www.moisesmedeiros.com.br',
  
  // Lovable Preview/Deploy
  'https://lovable.dev',
  'https://lovable.app',
  
  // Supabase
  'https://fyikfsasudgzsjmumdlw.supabase.co',
  
  // Desenvolvimento local
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

/**
 * Padrões de origem permitidos (regex)
 */
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.dev$/,
  /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.lovable\.app$/,
];

/**
 * Verifica se a origem é permitida
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  // Check direct match
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Check patterns
  for (const pattern of ALLOWED_ORIGIN_PATTERNS) {
    if (pattern.test(origin)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Retorna headers CORS baseados na origem
 * Se origem não permitida, retorna headers restritivos
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  
  // Se origem null/undefined, bloquear (possível ataque)
  if (!origin) {
    console.warn('[CORS] Requisição sem Origin header');
    return {
      'Access-Control-Allow-Origin': 'null',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
  }
  
  // Se origem permitida, incluir no header
  if (isOriginAllowed(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok, x-session-token, x-internal-secret',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
  }
  
  // Origem não permitida - logar e bloquear
  console.warn(`[CORS] Origem não permitida: ${origin}`);
  return {
    'Access-Control-Allow-Origin': 'null',
    'Access-Control-Allow-Headers': 'authorization',
    'Access-Control-Allow-Methods': 'OPTIONS',
    'Vary': 'Origin',
  };
}

/**
 * Headers CORS para webhooks externos (Hotmart, Stripe, etc)
 * Estes endpoints NÃO vêm de browsers, mas de servidores
 */
export function getWebhookCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*', // Webhooks server-to-server
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok, x-stripe-signature, x-webhook-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
  };
}

/**
 * Resposta para requisição CORS inválida
 */
export function corsBlockedResponse(origin: string | null): Response {
  console.error(`[CORS BLOCKED] Origem bloqueada: ${origin}`);
  
  return new Response(
    JSON.stringify({ 
      error: 'CORS policy: Origin not allowed',
      blocked: true,
    }),
    { 
      status: 403, 
      headers: { 
        'Content-Type': 'application/json',
        'X-Blocked-Reason': 'CORS',
      } 
    }
  );
}

/**
 * Handler para preflight OPTIONS
 */
export function handleCorsOptions(req: Request): Response {
  const origin = req.headers.get('Origin');
  
  if (!isOriginAllowed(origin)) {
    return corsBlockedResponse(origin);
  }
  
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}
