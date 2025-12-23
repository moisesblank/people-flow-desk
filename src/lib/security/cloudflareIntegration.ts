// ============================================
// ☁️🛡️ CLOUDFLARE PRO INTEGRATION — NÍVEL PENTAGON 🛡️☁️
// ANO 2300 — SEGURANÇA COM WAF + CDN + BOT PROTECTION
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 🎯 CLOUDFLARE PRO FEATURES:
//   ✅ WAF com 225 regras
//   ✅ 20 regras customizáveis
//   ✅ Proteção dia zero
//   ✅ Bot detection
//   ✅ CDN inteligente
//   ✅ Otimização de imagens
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (role='beta')
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao (role='funcionario')
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// ============================================

import { generateCorrelationId, writeAuditLog, isOwnerEmail, OWNER_EMAIL } from "./sanctumGate";

// ============================================
// TIPOS CLOUDFLARE
// ============================================
export interface CloudflareHeaders {
  // Headers de segurança do Cloudflare
  "cf-ray"?: string;
  "cf-connecting-ip"?: string;
  "cf-ipcountry"?: string;
  "cf-visitor"?: string;
  
  // Bot Management
  "cf-bot-score"?: string;
  "cf-verified-bot"?: string;
  "cf-threat-score"?: string;
  
  // WAF
  "cf-waf-action"?: string;
  "cf-waf-rule-id"?: string;
  
  // Geo
  "cf-region"?: string;
  "cf-city"?: string;
  "cf-postal-code"?: string;
  "cf-timezone"?: string;
  
  // Device
  "cf-device-type"?: string;
}

export interface CloudflareContext {
  // Identificação
  rayId: string;
  clientIp: string;
  country: string;
  
  // Bot Score (0-100, menor = mais provável bot)
  botScore: number;
  isVerifiedBot: boolean;
  threatScore: number;
  
  // Geo
  region?: string;
  city?: string;
  timezone?: string;
  
  // Device
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  
  // WAF
  wafAction?: string;
  wafRuleId?: string;
  
  // Análise
  isSuspicious: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  blockReason?: string;
}

export interface CloudflareSecurityConfig {
  // Bot Score threshold (bloquear se menor que)
  minBotScore: number;
  
  // Threat Score threshold (bloquear se maior que)
  maxThreatScore: number;
  
  // Países bloqueados
  blockedCountries: string[];
  
  // Países permitidos (se definido, só aceita estes)
  allowedCountries?: string[];
  
  // Rate limit por IP (requests por minuto)
  rateLimitPerMinute: number;
  
  // Modo de operação
  mode: "monitor" | "challenge" | "block";
  
  // Permitir bots verificados (Google, Bing, etc)
  allowVerifiedBots: boolean;
}

// ============================================
// CONFIGURAÇÃO PADRÃO
// ============================================
export const DEFAULT_CLOUDFLARE_CONFIG: CloudflareSecurityConfig = {
  minBotScore: 30,        // Bloquear se bot score < 30
  maxThreatScore: 50,     // Bloquear se threat score > 50
  blockedCountries: [],   // Nenhum país bloqueado por padrão
  rateLimitPerMinute: 60, // 60 requests por minuto por IP
  mode: "challenge",      // Desafiar suspeitos (não bloquear direto)
  allowVerifiedBots: true, // Permitir Googlebot, Bingbot, etc
};

// ============================================
// RATE LIMIT POR IP (CLOUDFLARE)
// ============================================
const cfRateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkCloudflareRateLimit(
  clientIp: string,
  maxPerMinute: number = 60
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const key = `cf:${clientIp}`;
  const record = cfRateLimits.get(key);

  if (!record || now > record.resetAt) {
    cfRateLimits.set(key, { count: 1, resetAt: now + 60000 });
    return { allowed: true, remaining: maxPerMinute - 1 };
  }

  if (record.count >= maxPerMinute) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  record.count++;
  return { allowed: true, remaining: maxPerMinute - record.count };
}

// ============================================
// EXTRAIR CONTEXTO CLOUDFLARE DOS HEADERS
// ============================================
export function extractCloudflareContext(
  headers: Headers | Record<string, string>
): CloudflareContext {
  const get = (name: string): string => {
    if (headers instanceof Headers) {
      return headers.get(name) || "";
    }
    return headers[name] || headers[name.toLowerCase()] || "";
  };

  const rayId = get("cf-ray") || generateCorrelationId();
  const clientIp = get("cf-connecting-ip") || "unknown";
  const country = get("cf-ipcountry") || "XX";
  const botScore = parseInt(get("cf-bot-score") || "100");
  const isVerifiedBot = get("cf-verified-bot") === "true";
  const threatScore = parseInt(get("cf-threat-score") || "0");
  const region = get("cf-region") || undefined;
  const city = get("cf-city") || undefined;
  const timezone = get("cf-timezone") || undefined;
  const wafAction = get("cf-waf-action") || undefined;
  const wafRuleId = get("cf-waf-rule-id") || undefined;

  // Device type
  const deviceTypeRaw = get("cf-device-type") || "desktop";
  const deviceType = ["desktop", "mobile", "tablet"].includes(deviceTypeRaw)
    ? (deviceTypeRaw as "desktop" | "mobile" | "tablet")
    : "unknown";

  // Análise de risco
  let riskLevel: CloudflareContext["riskLevel"] = "low";
  let isSuspicious = false;
  let blockReason: string | undefined;

  // Bot score baixo = suspeito
  if (botScore < 30 && !isVerifiedBot) {
    isSuspicious = true;
    riskLevel = "high";
    blockReason = `Bot score muito baixo: ${botScore}`;
  }

  // Threat score alto = suspeito
  if (threatScore > 50) {
    isSuspicious = true;
    riskLevel = threatScore > 80 ? "critical" : "high";
    blockReason = `Threat score alto: ${threatScore}`;
  }

  // WAF bloqueou = suspeito
  if (wafAction === "block" || wafAction === "challenge") {
    isSuspicious = true;
    riskLevel = "high";
    blockReason = `WAF action: ${wafAction} (rule: ${wafRuleId})`;
  }

  return {
    rayId,
    clientIp,
    country,
    botScore,
    isVerifiedBot,
    threatScore,
    region,
    city,
    timezone,
    deviceType,
    wafAction,
    wafRuleId,
    isSuspicious,
    riskLevel,
    blockReason,
  };
}

// ============================================
// VALIDAR REQUEST COM CLOUDFLARE
// ============================================
export async function validateCloudflareRequest(
  headers: Headers | Record<string, string>,
  config: CloudflareSecurityConfig = DEFAULT_CLOUDFLARE_CONFIG
): Promise<{
  allowed: boolean;
  context: CloudflareContext;
  action: "allow" | "challenge" | "block";
  reason?: string;
}> {
  const context = extractCloudflareContext(headers);
  const correlationId = context.rayId;

  // ============================================
  // 1. VERIFICAR BOT SCORE
  // ============================================
  if (context.botScore < config.minBotScore) {
    // Permitir bots verificados (Google, Bing, etc)
    if (config.allowVerifiedBots && context.isVerifiedBot) {
      // OK - bot verificado
    } else {
      await writeAuditLog({
        correlationId,
        action: "cloudflare_block",
        result: "deny",
        reason: "BOT_DETECTED",
        ipHash: context.clientIp.substring(0, 8) + "***",
        metadata: {
          botScore: context.botScore,
          isVerifiedBot: context.isVerifiedBot,
          country: context.country,
        },
      });

      return {
        allowed: false,
        context,
        action: config.mode === "block" ? "block" : "challenge",
        reason: `Bot detectado (score: ${context.botScore})`,
      };
    }
  }

  // ============================================
  // 2. VERIFICAR THREAT SCORE
  // ============================================
  if (context.threatScore > config.maxThreatScore) {
    await writeAuditLog({
      correlationId,
      action: "cloudflare_block",
      result: "deny",
      reason: "HIGH_THREAT",
      ipHash: context.clientIp.substring(0, 8) + "***",
      metadata: {
        threatScore: context.threatScore,
        country: context.country,
      },
    });

    return {
      allowed: false,
      context,
      action: "block",
      reason: `Ameaça detectada (score: ${context.threatScore})`,
    };
  }

  // ============================================
  // 3. VERIFICAR PAÍS
  // ============================================
  if (config.blockedCountries.includes(context.country)) {
    await writeAuditLog({
      correlationId,
      action: "cloudflare_block",
      result: "deny",
      reason: "BLOCKED_COUNTRY",
      ipHash: context.clientIp.substring(0, 8) + "***",
      metadata: { country: context.country },
    });

    return {
      allowed: false,
      context,
      action: "block",
      reason: `País bloqueado: ${context.country}`,
    };
  }

  if (config.allowedCountries && config.allowedCountries.length > 0) {
    if (!config.allowedCountries.includes(context.country)) {
      await writeAuditLog({
        correlationId,
        action: "cloudflare_block",
        result: "deny",
        reason: "COUNTRY_NOT_ALLOWED",
        ipHash: context.clientIp.substring(0, 8) + "***",
        metadata: { country: context.country },
      });

      return {
        allowed: false,
        context,
        action: "block",
        reason: `País não permitido: ${context.country}`,
      };
    }
  }

  // ============================================
  // 4. VERIFICAR RATE LIMIT
  // ============================================
  const rateLimitResult = checkCloudflareRateLimit(
    context.clientIp,
    config.rateLimitPerMinute
  );

  if (!rateLimitResult.allowed) {
    await writeAuditLog({
      correlationId,
      action: "cloudflare_block",
      result: "deny",
      reason: "RATE_LIMITED",
      ipHash: context.clientIp.substring(0, 8) + "***",
      metadata: { retryAfter: rateLimitResult.retryAfter },
    });

    return {
      allowed: false,
      context,
      action: "block",
      reason: `Rate limit excedido. Tente em ${rateLimitResult.retryAfter}s`,
    };
  }

  // ============================================
  // 5. PERMITIDO
  // ============================================
  return {
    allowed: true,
    context,
    action: "allow",
  };
}

// ============================================
// HEADERS DE SEGURANÇA RECOMENDADOS
// ============================================
export const SECURITY_HEADERS = {
  // Prevenir clickjacking
  "X-Frame-Options": "DENY",
  
  // Prevenir MIME sniffing
  "X-Content-Type-Options": "nosniff",
  
  // XSS Protection
  "X-XSS-Protection": "1; mode=block",
  
  // Referrer Policy
  "Referrer-Policy": "strict-origin-when-cross-origin",
  
  // Permissions Policy (antes Feature-Policy)
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  
  // HSTS (Strict Transport Security)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  
  // Content Security Policy (básico)
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' https://*.panda.video https://*.youtube.com https://*.vimeo.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.cloudflare.com",
    "frame-src 'self' https://*.youtube.com https://*.vimeo.com https://*.panda.video",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};

// ============================================
// GERAR HEADERS DE RESPOSTA SEGURA
// ============================================
export function getSecureResponseHeaders(
  cfContext?: CloudflareContext
): Record<string, string> {
  const headers: Record<string, string> = { ...SECURITY_HEADERS };

  // Adicionar Ray ID se disponível
  if (cfContext?.rayId) {
    headers["X-Request-Id"] = cfContext.rayId;
  }

  // Cache headers para CDN
  headers["Cache-Control"] = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";
  headers["Vary"] = "Accept-Encoding, Accept, Cookie";

  return headers;
}

// ============================================
// REGRAS WAF CUSTOMIZADAS (20 disponíveis no Pro)
// ============================================
export const RECOMMENDED_WAF_RULES = [
  {
    id: 1,
    name: "Block SQL Injection",
    expression: `(http.request.uri.query contains "UNION" and http.request.uri.query contains "SELECT")`,
    action: "block",
    priority: 1,
  },
  {
    id: 2,
    name: "Block XSS Attempts",
    expression: `(http.request.uri.query contains "<script" or http.request.body.raw contains "<script")`,
    action: "block",
    priority: 2,
  },
  {
    id: 3,
    name: "Block Admin Bruteforce",
    expression: `(http.request.uri.path contains "/login" and http.request.method eq "POST" and cf.threat_score gt 20)`,
    action: "challenge",
    priority: 3,
  },
  {
    id: 4,
    name: "Protect API Endpoints",
    expression: `(http.request.uri.path contains "/api/" and cf.bot_management.score lt 30)`,
    action: "challenge",
    priority: 4,
  },
  {
    id: 5,
    name: "Block Suspicious User Agents",
    expression: `(http.user_agent contains "curl" or http.user_agent contains "wget" or http.user_agent contains "python")`,
    action: "challenge",
    priority: 5,
  },
  {
    id: 6,
    name: "Protect Content Endpoints",
    expression: `(http.request.uri.path contains "/video" or http.request.uri.path contains "/pdf") and cf.threat_score gt 10`,
    action: "challenge",
    priority: 6,
  },
  {
    id: 7,
    name: "Block Path Traversal",
    expression: `(http.request.uri.path contains "../" or http.request.uri.query contains "../")`,
    action: "block",
    priority: 7,
  },
  {
    id: 8,
    name: "Rate Limit Login",
    expression: `(http.request.uri.path eq "/login" and http.request.method eq "POST")`,
    action: "challenge",
    priority: 8,
    rateLimit: { requests: 5, period: 60 },
  },
  {
    id: 9,
    name: "Block Known Bad IPs",
    expression: `(cf.threat_score gt 80)`,
    action: "block",
    priority: 9,
  },
  {
    id: 10,
    name: "Protect Webhooks",
    expression: `(http.request.uri.path contains "/webhook" and not http.request.headers["x-hotmart-hottok"])`,
    action: "block",
    priority: 10,
  },
];

// ============================================
// CLOUDFLARE PAGE RULES RECOMENDADAS
// ============================================
export const RECOMMENDED_PAGE_RULES = [
  {
    url: "*.moisesmedeiros.com.br/api/*",
    settings: {
      cache_level: "bypass",
      security_level: "high",
      browser_check: "on",
    },
  },
  {
    url: "*.moisesmedeiros.com.br/alunos/*",
    settings: {
      cache_level: "aggressive",
      edge_cache_ttl: 3600,
      security_level: "medium",
    },
  },
  {
    url: "*.moisesmedeiros.com.br/gestao/*",
    settings: {
      cache_level: "bypass",
      security_level: "high",
      browser_check: "on",
    },
  },
  {
    url: "*.moisesmedeiros.com.br/*.mp4",
    settings: {
      cache_level: "bypass",
      security_level: "high",
    },
  },
  {
    url: "*.moisesmedeiros.com.br/*.pdf",
    settings: {
      cache_level: "bypass",
      security_level: "high",
    },
  },
];

export default validateCloudflareRequest;
