// ============================================
// ☁️🛡️ CLOUDFLARE SAFE SPA PROFILE v2.0 🛡️☁️
// CONFIGURAÇÃO ANTI-QUEBRA PARA LOVABLE SPAs
// ============================================
//
// 📍 MODOS DE OPERAÇÃO:
//   MODO A (DNS Only/cinza): Segurança via Edge Guard + RLS + Supabase
//   MODO B (Proxied/laranja): WAF + Bot + Rate Limit no edge
//
// ⚠️ MODO A é PADRÃO para pro.* e gestao.*
// ============================================

import { OWNER_EMAIL } from "@/core/urlAccessControl";

// ============================================
// TIPOS
// ============================================

export type CloudflareMode = "dns_only" | "proxied";
export type ProxyStatus = "grey" | "orange";

export interface CloudflareDomainConfig {
  domain: string;
  mode: CloudflareMode;
  proxyStatus: ProxyStatus;
  sslMode: "off" | "flexible" | "full" | "full_strict";
  minTLS: "1.0" | "1.1" | "1.2" | "1.3";
  alwaysHttps: boolean;
  notes: string[];
}

export interface CloudflareSpeedConfig {
  rocketLoader: boolean;
  autoMinifyJs: boolean;
  autoMinifyCss: boolean;
  autoMinifyHtml: boolean;
  polish: boolean;
  mirage: boolean;
  emailObfuscation: boolean;
  transformRulesHtmlJs: boolean;
}

export interface CloudflareCacheRule {
  pattern: string;
  action: "bypass" | "cache_everything" | "standard";
  ttl?: string;
  description: string;
}

export interface CloudflareRateLimitRule {
  pattern: string;
  requestsPerMinute: number;
  action: "challenge" | "block" | "log";
  description: string;
}

export interface CloudflareWAFConfig {
  managedRulesOwasp: boolean;
  botFightMode: boolean;
  botFightModeExcludeAssets: boolean;
  hotlinkProtection: boolean;
}

export interface CloudflareSafeProfile {
  mode: CloudflareMode;
  domains: CloudflareDomainConfig[];
  speedConfig: CloudflareSpeedConfig;
  cacheRules: CloudflareCacheRule[];
  rateLimitRules: CloudflareRateLimitRule[];
  wafConfig: CloudflareWAFConfig;
  securityLevel: "essentially_off" | "low" | "medium" | "high" | "under_attack";
}

// ============================================
// MODO A: DNS ONLY (PADRÃO RECOMENDADO)
// ============================================

export const MODO_A_DNS_ONLY: CloudflareSafeProfile = {
  mode: "dns_only",
  
  domains: [
    {
      domain: "pro.moisesmedeiros.com.br",
      mode: "dns_only",
      proxyStatus: "grey",
      sslMode: "full_strict",
      minTLS: "1.2",
      alwaysHttps: true,
      notes: [
        "DNS Only - Cloudflare não processa tráfego",
        "Segurança via Edge Guard + RLS + Signed URLs",
        "Zero risco de quebrar SPA/assets",
      ],
    },
    // ❌ gestao.moisesmedeiros.com.br DESCONTINUADO
    // Arquitetura migrada para mono-domínio (pro.moisesmedeiros.com.br/gestaofc)
    // Configuração mantida apenas para período de transição (redirect 302)
  ],
  
  // MODO A: Não precisa configurar speed (não proxied)
  speedConfig: {
    rocketLoader: false,
    autoMinifyJs: false,
    autoMinifyCss: false,
    autoMinifyHtml: false,
    polish: false,
    mirage: false,
    emailObfuscation: false,
    transformRulesHtmlJs: false,
  },
  
  // MODO A: Não precisa configurar cache (não proxied)
  cacheRules: [],
  
  // MODO A: Não precisa configurar rate limit (não proxied)
  rateLimitRules: [],
  
  // MODO A: WAF não se aplica
  wafConfig: {
    managedRulesOwasp: false,
    botFightMode: false,
    botFightModeExcludeAssets: false,
    hotlinkProtection: false,
  },
  
  securityLevel: "essentially_off",
};

// ============================================
// MODO B: PROXIED COM SAFE SPA PROFILE
// ============================================

export const MODO_B_PROXIED_SAFE: CloudflareSafeProfile = {
  mode: "proxied",
  
  domains: [
    {
      domain: "pro.moisesmedeiros.com.br",
      mode: "proxied",
      proxyStatus: "orange",
      sslMode: "full_strict",
      minTLS: "1.2",
      alwaysHttps: true,
      notes: [
        "Proxied - WAF/Bot/Rate Limit ativos",
        "REQUER configurações anti-quebra abaixo",
        "Verificar gates antes de ativar",
      ],
    },
    // ❌ gestao.moisesmedeiros.com.br DESCONTINUADO em MODO B também
    // Arquitetura migrada para mono-domínio (pro.moisesmedeiros.com.br/gestaofc)
  ],
  
  // MODO B: Desabilitar tudo que quebra SPA
  speedConfig: {
    rocketLoader: false,    // ❌ CRÍTICO: Quebra módulos ES
    autoMinifyJs: false,    // ❌ CRÍTICO: Quebra React
    autoMinifyCss: false,   // ⚠️ Pode causar regressão
    autoMinifyHtml: false,  // ⚠️ Pode causar regressão
    polish: false,          // ❌ Não aplicar em pro/gestao
    mirage: false,          // ❌ Não aplicar em pro/gestao
    emailObfuscation: false,// ❌ Não aplicar em pro/gestao
    transformRulesHtmlJs: false, // ❌ CRÍTICO: Não transformar
  },
  
  // MODO B: Cache rules obrigatórias
  cacheRules: [
    {
      pattern: "*.html",
      action: "bypass",
      description: "HTML/documento - SEMPRE bypass para evitar cache de index.html antigo",
    },
    {
      pattern: "/",
      action: "bypass",
      description: "Root - SEMPRE bypass",
    },
    {
      pattern: "/assets/*",
      action: "cache_everything",
      ttl: "1 year",
      description: "Assets fingerprinted - cache longo (hash no nome garante invalidação)",
    },
    {
      pattern: "/sw.js",
      action: "bypass",
      description: "Service Worker - sempre buscar versão atual (EMBORA SW SEJA PROIBIDO)",
    },
    {
      pattern: "/manifest.json",
      action: "cache_everything",
      ttl: "1 hour",
      description: "Manifest - cache moderado",
    },
  ],
  
  // MODO B: Rate limit em endpoints sensíveis
  rateLimitRules: [
    {
      pattern: "/auth/*",
      requestsPerMinute: 10,
      action: "block",
      description: "Auth - anti brute force",
    },
    {
      pattern: "/login*",
      requestsPerMinute: 10,
      action: "block",
      description: "Login - anti brute force",
    },
    {
      pattern: "/reset*",
      requestsPerMinute: 5,
      action: "block",
      description: "Reset password - anti abuse",
    },
    {
      pattern: "/functions/*",
      requestsPerMinute: 100,
      action: "challenge",
      description: "Edge functions - rate limit moderado",
    },
    {
      pattern: "/api/*",
      requestsPerMinute: 100,
      action: "challenge",
      description: "API - rate limit moderado",
    },
    {
      pattern: "/upload*",
      requestsPerMinute: 20,
      action: "block",
      description: "Upload - anti abuse de storage",
    },
  ],
  
  // MODO B: WAF configurado
  wafConfig: {
    managedRulesOwasp: true,       // ✅ OWASP Core Rule Set
    botFightMode: true,            // ✅ Bot detection
    botFightModeExcludeAssets: true, // ✅ NUNCA bloquear /assets/*
    hotlinkProtection: false,      // ❌ Pode quebrar imagens
  },
  
  securityLevel: "medium",
};

// ============================================
// PERFIL ATIVO (CONFIGURÁVEL)
// ============================================

export const CLOUDFLARE_ACTIVE_MODE: CloudflareMode = "dns_only";

export function getActiveCloudflareProfile(): CloudflareSafeProfile {
  return CLOUDFLARE_ACTIVE_MODE === "dns_only" 
    ? MODO_A_DNS_ONLY 
    : MODO_B_PROXIED_SAFE;
}

// ============================================
// CHECKLIST DE VERIFICAÇÃO PRÉ-MODO B
// ============================================

export interface ModoB_ChecklistItem {
  id: string;
  description: string;
  command: string;
  expectedResult: string;
  critical: boolean;
}

export const MODO_B_CHECKLIST: ModoB_ChecklistItem[] = [
  {
    id: "cf_headers",
    description: "Verificar headers Cloudflare no /",
    command: "curl -sI https://pro.moisesmedeiros.com.br/ | grep -i cf-ray",
    expectedResult: "cf-ray: <hash>-<datacenter>",
    critical: true,
  },
  {
    id: "js_mime",
    description: "Verificar MIME type dos JS bundles",
    command: "curl -sI https://pro.moisesmedeiros.com.br/assets/index-*.js | grep content-type",
    expectedResult: "content-type: application/javascript",
    critical: true,
  },
  {
    id: "html_no_cache",
    description: "Verificar que HTML não está cacheado indevidamente",
    command: "curl -sI https://pro.moisesmedeiros.com.br/ | grep cf-cache-status",
    expectedResult: "cf-cache-status: DYNAMIC ou BYPASS",
    critical: true,
  },
  {
    id: "black_screen_gate",
    description: "Verificar que app não mostra tela preta",
    command: "Abrir em janela anônima e verificar console",
    expectedResult: "App carrega sem erros de módulo",
    critical: true,
  },
  {
    id: "assets_cached",
    description: "Verificar que assets estão cacheados",
    command: "curl -sI https://pro.moisesmedeiros.com.br/assets/vendor-*.js | grep cf-cache-status",
    expectedResult: "cf-cache-status: HIT (após segundo request)",
    critical: false,
  },
];

// ============================================
// FUNÇÃO DE VERIFICAÇÃO
// ============================================

export interface CloudflareVerificationResult {
  passed: boolean;
  mode: CloudflareMode;
  checks: {
    id: string;
    passed: boolean;
    message: string;
  }[];
  recommendation: string;
}

export function verifyCloudflareReadiness(): CloudflareVerificationResult {
  const profile = getActiveCloudflareProfile();
  
  // Em MODO A, sempre passa (não há risco)
  if (profile.mode === "dns_only") {
    return {
      passed: true,
      mode: "dns_only",
      checks: [
        {
          id: "mode_a_safe",
          passed: true,
          message: "MODO A (DNS Only) - Zero risco de quebrar SPA",
        },
      ],
      recommendation: "MODO A ativo. Segurança via Edge Guard + RLS + Signed URLs.",
    };
  }
  
  // MODO B requer verificação manual dos gates
  return {
    passed: false, // Precisa validação manual
    mode: "proxied",
    checks: MODO_B_CHECKLIST.map(item => ({
      id: item.id,
      passed: false, // Requer execução manual dos comandos
      message: `Verificar: ${item.description}`,
    })),
    recommendation: "MODO B requer validação manual de todos os gates antes de ativar.",
  };
}

// ============================================
// OWNER BYPASS (SEMPRE)
// ============================================

export function isCloudflareBypassUser(email?: string): boolean {
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

// ============================================
// EXPORT
// ============================================

export default {
  MODO_A_DNS_ONLY,
  MODO_B_PROXIED_SAFE,
  CLOUDFLARE_ACTIVE_MODE,
  getActiveCloudflareProfile,
  MODO_B_CHECKLIST,
  verifyCloudflareReadiness,
  isCloudflareBypassUser,
};
