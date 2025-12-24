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

export interface CloudflareValidationResult {
  allowed: boolean;
  context: CloudflareContext;
  action: "allow" | "challenge" | "block";
  reason?: string;
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

// Limpar rate limits expirados periodicamente
export function cleanupCloudflareRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of cfRateLimits.entries()) {
    if (now > record.resetAt) {
      cfRateLimits.delete(key);
    }
  }
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
): Promise<CloudflareValidationResult> {
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
  // 3. VERIFICAR PAÍSES BLOQUEADOS
  // ============================================
  if (config.blockedCountries.length > 0) {
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
  }

  // ============================================
  // 4. VERIFICAR PAÍSES PERMITIDOS (SE DEFINIDO)
  // ============================================
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
  // 5. VERIFICAR RATE LIMIT
  // ============================================
  const rateLimit = checkCloudflareRateLimit(
    context.clientIp,
    config.rateLimitPerMinute
  );

  if (!rateLimit.allowed) {
    await writeAuditLog({
      correlationId,
      action: "cloudflare_rate_limit",
      result: "deny",
      reason: "RATE_LIMITED",
      ipHash: context.clientIp.substring(0, 8) + "***",
      metadata: {
        retryAfter: rateLimit.retryAfter,
        country: context.country,
      },
    });

    return {
      allowed: false,
      context,
      action: "block",
      reason: `Rate limit excedido. Tente novamente em ${rateLimit.retryAfter}s`,
    };
  }

  // ============================================
  // 6. VERIFICAR SE WAF JÁ BLOQUEOU
  // ============================================
  if (context.wafAction === "block") {
    return {
      allowed: false,
      context,
      action: "block",
      reason: `WAF bloqueou: ${context.wafRuleId}`,
    };
  }

  // ============================================
  // 7. CHALLENGE SE SUSPEITO (MAS NÃO BLOQUEAR)
  // ============================================
  if (context.isSuspicious && config.mode === "challenge") {
    return {
      allowed: true, // Permitir mas sinalizar
      context,
      action: "challenge",
      reason: context.blockReason,
    };
  }

  // ============================================
  // 8. PERMITIR
  // ============================================
  return {
    allowed: true,
    context,
    action: "allow",
  };
}

// ============================================
// GERAR HEADERS DE SEGURANÇA
// ============================================
export function generateSecurityHeaders(): Record<string, string> {
  return {
    // Strict Transport Security
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    
    // Content Security Policy
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudflare.com",
      "frame-src 'self' https://challenges.cloudflare.com https://*.pandavideo.com.br",
      "frame-ancestors 'none'",
    ].join("; "),
    
    // Prevent clickjacking
    "X-Frame-Options": "DENY",
    
    // Prevent MIME sniffing
    "X-Content-Type-Options": "nosniff",
    
    // XSS Protection
    "X-XSS-Protection": "1; mode=block",
    
    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",
    
    // Permissions Policy
    "Permissions-Policy": [
      "accelerometer=()",
      "camera=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  };
}

// ============================================
// HOOK PARA USO NO FRONTEND
// ============================================
export function useCloudflareContext(): CloudflareContext | null {
  // No frontend, não temos acesso direto aos headers CF
  // Mas podemos detectar se estamos atrás do Cloudflare
  if (typeof window === "undefined") return null;

  // Detectar via performance API ou outros métodos
  const isCloudflare = document.querySelector('script[src*="cloudflare"]') !== null ||
    navigator.userAgent.includes("CF-") ||
    performance.getEntriesByType("resource").some(r => 
      r.name.includes("cloudflare") || r.name.includes("cf-")
    );

  if (!isCloudflare) return null;

  // Retornar contexto básico (sem dados sensíveis)
  return {
    rayId: generateCorrelationId(),
    clientIp: "client",
    country: Intl.DateTimeFormat().resolvedOptions().timeZone.split("/")[0] || "XX",
    botScore: 100, // Assumir humano no frontend
    isVerifiedBot: false,
    threatScore: 0,
    deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    isSuspicious: false,
    riskLevel: "low",
  };
}

// ============================================
// VERIFICAR SE USUÁRIO É OWNER (BYPASS TOTAL)
// ============================================
export function isCloudflareBypass(email?: string): boolean {
  if (!email) return false;
  return isOwnerEmail(email);
}

// ============================================
// CONFIG ESPECÍFICA POR ROTA
// ============================================
export const ROUTE_CLOUDFLARE_CONFIGS: Record<string, Partial<CloudflareSecurityConfig>> = {
  // Webhooks - mais permissivo (bots legítimos)
  "/webhooks": {
    minBotScore: 1,
    allowVerifiedBots: true,
    mode: "monitor",
  },
  "/functions/v1": {
    minBotScore: 1,
    allowVerifiedBots: true,
    mode: "monitor",
  },
  
  // Admin/Gestão - mais restritivo
  "/gestao": {
    minBotScore: 50,
    maxThreatScore: 30,
    mode: "block",
  },
  
  // API - equilíbrio
  "/api": {
    minBotScore: 20,
    rateLimitPerMinute: 100,
    mode: "challenge",
  },
  
  // Público - mais permissivo
  "/": {
    minBotScore: 10,
    rateLimitPerMinute: 120,
    mode: "challenge",
  },
};

// ============================================
// OBTER CONFIG POR ROTA
// ============================================
export function getCloudflareConfigForRoute(
  pathname: string
): CloudflareSecurityConfig {
  // Encontrar config mais específica
  const matchingRoute = Object.keys(ROUTE_CLOUDFLARE_CONFIGS)
    .filter(route => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0]; // Mais específico primeiro

  if (matchingRoute) {
    return {
      ...DEFAULT_CLOUDFLARE_CONFIG,
      ...ROUTE_CLOUDFLARE_CONFIGS[matchingRoute],
    };
  }

  return DEFAULT_CLOUDFLARE_CONFIG;
}

// ============================================
// EXPORTAR TUDO
// ============================================
export default {
  extractCloudflareContext,
  validateCloudflareRequest,
  checkCloudflareRateLimit,
  cleanupCloudflareRateLimits,
  generateSecurityHeaders,
  useCloudflareContext,
  isCloudflareBypass,
  getCloudflareConfigForRoute,
  DEFAULT_CLOUDFLARE_CONFIG,
  ROUTE_CLOUDFLARE_CONFIGS,
};
