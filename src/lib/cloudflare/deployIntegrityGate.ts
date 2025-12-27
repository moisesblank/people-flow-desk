// ============================================
// 🚀🛡️ DEPLOY INTEGRITY GATE v2.0 🛡️🚀
// VERIFICAÇÃO ANTI-VITE-DEV / ANTI-PREVIEW
// ============================================
//
// 📍 OBJETIVO:
//   Garantir que produção NUNCA sirva código de desenvolvimento
//   Detectar deploy parcial/rasgado
//   Verificar integridade de assets
//
// ⚠️ GATES OBRIGATÓRIOS:
//   ✅ HTML deve conter /assets/*.js (produção)
//   ❌ HTML NUNCA deve conter /@vite/client ou /src/main.tsx
//
// ============================================

import { OWNER_EMAIL } from "@/core/urlAccessControl";

// ============================================
// TIPOS
// ============================================

export type DeployEnvironment = "production" | "preview" | "development" | "unknown";

export interface HTMLGateResult {
  environment: DeployEnvironment;
  passed: boolean;
  hasProductionAssets: boolean;
  hasViteClient: boolean;
  hasSrcMainTsx: boolean;
  hasHMR: boolean;
  assetUrls: string[];
  errors: string[];
  warnings: string[];
  timestamp: string;
}

export interface DomainDeployStatus {
  domain: string;
  gateResult: HTMLGateResult;
  liveStatus: "live" | "pending" | "error";
  lastPublish?: string;
  recommendation: string;
}

// ============================================
// PADRÕES DE DETECÇÃO
// ============================================

const PRODUCTION_PATTERNS = {
  // Assets de produção (fingerprinted)
  productionAsset: /\/assets\/[a-zA-Z0-9_-]+(-[a-f0-9]{8})?\.js/g,
  productionCss: /\/assets\/[a-zA-Z0-9_-]+(-[a-f0-9]{8})?\.css/g,
  
  // Script correto de produção
  correctModuleScript: /<script\s+type="module"\s+.*src="\/assets\//,
};

const DEVELOPMENT_PATTERNS = {
  // Vite HMR client (NUNCA deve aparecer em produção)
  viteClient: /\/@vite\/client/,
  
  // Source direto (NUNCA deve aparecer em produção)
  srcMainTsx: /\/src\/main\.tsx/,
  srcMainTs: /\/src\/main\.ts/,
  
  // HMR patterns
  hmrPattern: /\/@hmr/,
  hotPattern: /hot-update/,
  
  // React Refresh (dev only)
  reactRefresh: /\/@react-refresh/,
  
  // Vite env
  viteEnv: /\/@vite\/env/,
};

// ============================================
// FUNÇÃO PRINCIPAL: HTML GATE CHECK
// ============================================

export function checkHTMLGate(htmlContent: string): HTMLGateResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const assetUrls: string[] = [];
  
  // 1. Verificar assets de produção
  const productionAssets = htmlContent.match(PRODUCTION_PATTERNS.productionAsset) || [];
  const hasProductionAssets = productionAssets.length > 0;
  assetUrls.push(...productionAssets);
  
  // 2. Verificar padrões de desenvolvimento (PROIBIDOS)
  const hasViteClient = DEVELOPMENT_PATTERNS.viteClient.test(htmlContent);
  const hasSrcMainTsx = 
    DEVELOPMENT_PATTERNS.srcMainTsx.test(htmlContent) || 
    DEVELOPMENT_PATTERNS.srcMainTs.test(htmlContent);
  const hasHMR = 
    DEVELOPMENT_PATTERNS.hmrPattern.test(htmlContent) || 
    DEVELOPMENT_PATTERNS.hotPattern.test(htmlContent) ||
    DEVELOPMENT_PATTERNS.reactRefresh.test(htmlContent);
  
  // 3. Determinar ambiente
  let environment: DeployEnvironment = "unknown";
  
  if (hasViteClient || hasSrcMainTsx || hasHMR) {
    environment = "development";
    errors.push("❌ CRÍTICO: Código de desenvolvimento detectado em produção!");
    
    if (hasViteClient) {
      errors.push("  → /@vite/client encontrado (Vite HMR)");
    }
    if (hasSrcMainTsx) {
      errors.push("  → /src/main.tsx encontrado (source direto)");
    }
    if (hasHMR) {
      errors.push("  → Padrões HMR encontrados");
    }
  } else if (hasProductionAssets) {
    environment = "production";
  } else {
    environment = "unknown";
    warnings.push("⚠️ Não foi possível determinar ambiente (sem assets detectados)");
  }
  
  // 4. Verificações adicionais
  if (!htmlContent.includes('<div id="root">') && !htmlContent.includes("<div id='root'>")) {
    warnings.push("⚠️ Elemento #root não encontrado");
  }
  
  if (!htmlContent.includes('type="module"')) {
    warnings.push("⚠️ Script type=module não encontrado");
  }
  
  // 5. Resultado final
  const passed = environment === "production" && errors.length === 0;
  
  return {
    environment,
    passed,
    hasProductionAssets,
    hasViteClient,
    hasSrcMainTsx,
    hasHMR,
    assetUrls,
    errors,
    warnings,
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// VERIFICAÇÃO RUNTIME (NO BROWSER)
// ============================================

export function checkRuntimeIntegrity(): HTMLGateResult {
  if (typeof document === "undefined") {
    return {
      environment: "unknown",
      passed: false,
      hasProductionAssets: false,
      hasViteClient: false,
      hasSrcMainTsx: false,
      hasHMR: false,
      assetUrls: [],
      errors: ["Não é ambiente browser"],
      warnings: [],
      timestamp: new Date().toISOString(),
    };
  }
  
  const html = document.documentElement.outerHTML;
  return checkHTMLGate(html);
}

// ============================================
// VERIFICAÇÃO DE DOMÍNIO ESPECÍFICO
// ============================================

export async function checkDomainDeploy(domain: string): Promise<DomainDeployStatus> {
  try {
    // Em produção, verificar via fetch
    const response = await fetch(`https://${domain}/`, {
      method: "GET",
      headers: {
        "Accept": "text/html",
      },
    });
    
    if (!response.ok) {
      return {
        domain,
        gateResult: {
          environment: "unknown",
          passed: false,
          hasProductionAssets: false,
          hasViteClient: false,
          hasSrcMainTsx: false,
          hasHMR: false,
          assetUrls: [],
          errors: [`HTTP ${response.status}: ${response.statusText}`],
          warnings: [],
          timestamp: new Date().toISOString(),
        },
        liveStatus: "error",
        recommendation: "Verificar se domínio está acessível",
      };
    }
    
    const html = await response.text();
    const gateResult = checkHTMLGate(html);
    
    return {
      domain,
      gateResult,
      liveStatus: gateResult.passed ? "live" : "error",
      recommendation: gateResult.passed 
        ? "✅ Deploy válido - Produção OK"
        : "❌ Deploy inválido - Verificar Lovable Publish",
    };
  } catch (error) {
    return {
      domain,
      gateResult: {
        environment: "unknown",
        passed: false,
        hasProductionAssets: false,
        hasViteClient: false,
        hasSrcMainTsx: false,
        hasHMR: false,
        assetUrls: [],
        errors: [`Erro ao verificar: ${error instanceof Error ? error.message : "Desconhecido"}`],
        warnings: [],
        timestamp: new Date().toISOString(),
      },
      liveStatus: "error",
      recommendation: "Verificar conectividade e CORS",
    };
  }
}

// ============================================
// VERIFICAÇÃO DE TODOS OS DOMÍNIOS
// ============================================

// MONO-DOMÍNIO: gestao.* descontinuado
export const MONITORED_DOMAINS = [
  "pro.moisesmedeiros.com.br",
];

export async function checkAllDomainsIntegrity(): Promise<DomainDeployStatus[]> {
  const results = await Promise.all(
    MONITORED_DOMAINS.map(domain => checkDomainDeploy(domain))
  );
  return results;
}

// ============================================
// CHECKLIST PRÉ-DEPLOY
// ============================================

export interface DeployChecklist {
  step: string;
  description: string;
  required: boolean;
  automated: boolean;
}

export const DEPLOY_CHECKLIST: DeployChecklist[] = [
  {
    step: "1. Build Local",
    description: "npm run build deve completar sem erros",
    required: true,
    automated: true,
  },
  {
    step: "2. Console Limpo",
    description: "Verificar console por warnings/erros",
    required: true,
    automated: false,
  },
  {
    step: "3. Preview Local",
    description: "Testar /dist/index.html localmente",
    required: true,
    automated: false,
  },
  {
    step: "4. Publish Lovable",
    description: "Clicar Publish → Update no Lovable",
    required: true,
    automated: false,
  },
  {
    step: "5. Aguardar Status Live",
    description: "Aguardar domínio mudar para 'Live'",
    required: true,
    automated: false,
  },
  {
    step: "6. Purge Cloudflare",
    description: "Purge Everything no Cloudflare (se proxied)",
    required: false, // Só se MODO B
    automated: false,
  },
  {
    step: "7. Teste Anônimo",
    description: "Abrir em janela anônima e testar",
    required: true,
    automated: false,
  },
  {
    step: "8. HTML Gate",
    description: "Verificar que HTML contém /assets/*.js",
    required: true,
    automated: true,
  },
];

// ============================================
// PROCESSO DE REBIND DE DOMÍNIO
// ============================================

export const REBIND_PROCESS = {
  description: "Processo para reconectar domínio ao Lovable",
  steps: [
    "1. No Lovable: Settings → Domains → Remove domain",
    "2. Aguardar 1-2 minutos",
    "3. No Lovable: Connect domain → Inserir domínio",
    "4. Configurar DNS se necessário (A record → 185.158.133.1)",
    "5. Aguardar status 'Live' (pode levar até 10min)",
    "6. Clicar Publish → Update",
    "7. Executar HTML Gate para verificar",
  ],
  dnsRecords: {
    type: "A",
    name: "@", // ou subdomínio
    value: "185.158.133.1",
    proxy: false, // DNS Only (grey) recomendado
  },
};

// ============================================
// HOOK PARA USO EM COMPONENTES
// ============================================

export function useDeployIntegrity() {
  const checkCurrent = () => checkRuntimeIntegrity();
  const checkDomain = (domain: string) => checkDomainDeploy(domain);
  const checkAll = () => checkAllDomainsIntegrity();
  
  return {
    checkCurrent,
    checkDomain,
    checkAll,
    DEPLOY_CHECKLIST,
    REBIND_PROCESS,
    MONITORED_DOMAINS,
  };
}

// ============================================
// OWNER BYPASS
// ============================================

export function isOwnerBypass(email?: string): boolean {
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

// ============================================
// EXPORT
// ============================================

export default {
  checkHTMLGate,
  checkRuntimeIntegrity,
  checkDomainDeploy,
  checkAllDomainsIntegrity,
  useDeployIntegrity,
  DEPLOY_CHECKLIST,
  REBIND_PROCESS,
  MONITORED_DOMAINS,
  isOwnerBypass,
};
