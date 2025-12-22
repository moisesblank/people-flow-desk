// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                                                                              ║
// ║   🏛️ CONSTITUIÇÃO SYNAPSE - LEI I: PERFORMANCE                              ║
// ║   v1.0 - Código Imutável do Sistema                                         ║
// ║                                                                              ║
// ║   Esta lei é MANDATÓRIA e deve ser aplicada em TODO código.                 ║
// ║   Objetivo: Rodar perfeitamente em 3G e celulares básicos.                  ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ============================================
// TÍTULO I - FUNDAMENTOS (Artigos 1-3)
// ============================================

export const BUNDLE_CONSTITUTION = {
  // Artigo 1° - Code Splitting Obrigatório
  CHUNKS: {
    "vendor-react": ["react", "react-dom", "react-router-dom"],
    "vendor-ui": ["@radix-ui/*"],
    "vendor-query": ["@tanstack/react-query"],
    "vendor-motion": ["framer-motion"],
    "vendor-forms": ["react-hook-form", "zod"],
    "vendor-charts": ["recharts"],
    "vendor-utils": ["date-fns", "zustand", "clsx"],
  },
  
  // Artigo 2° - Build Config
  BUILD: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
  },
  
  // Artigo 3° - Pre-bundle
  OPTIMIZE_DEPS: [
    "react", "react-dom", "react-router-dom",
    "@tanstack/react-query", "zustand", "framer-motion"
  ],
} as const;

// ============================================
// TÍTULO II - LAZY LOADING (Artigos 4-6)
// ============================================

export const LAZY_CONSTITUTION = {
  // Artigo 4° - Rotas SEMPRE lazy
  ROUTES_MUST_BE_LAZY: true,
  
  // Artigo 5° - rootMargin por conexão
  ROOT_MARGIN: {
    slow: "800px",    // 3G - carrega mais cedo
    mobile: "500px",  // 4G mobile
    desktop: "300px", // WiFi
  },
  
  // Artigo 6° - Suspense fallback < 1KB
  FALLBACK_MAX_SIZE_KB: 1,
} as const;

// ============================================
// TÍTULO III - IMAGENS (Artigos 7-9)
// ============================================

export const IMAGE_CONSTITUTION = {
  // Artigo 7° - Atributos obrigatórios
  REQUIRED_ATTRS: ["loading", "decoding", "width", "height", "alt"],
  DEFAULT_LOADING: "lazy" as const,
  DEFAULT_DECODING: "async" as const,
  
  // Artigo 8° - SacredImage para LCP
  USE_SACRED_IMAGE_FOR_LCP: true,
  
  // Artigo 9° - Qualidade por tier
  QUALITY_BY_TIER: {
    critical: 40, // 2G
    low: 60,      // 3G
    medium: 75,   // 4G
    high: 85,     // WiFi
    ultra: 95,    // Fibra
  },
} as const;

// ============================================
// TÍTULO IV - REACT QUERY (Artigos 10-12)
// ============================================

export const QUERY_CONSTITUTION = {
  // Artigo 10° - Cache por tipo
  CACHE_CONFIG: {
    realtime: { staleTime: 0, gcTime: 30_000 },
    dashboard: { staleTime: 30_000, gcTime: 300_000 },
    list: { staleTime: 60_000, gcTime: 600_000 },
    static: { staleTime: 3600_000, gcTime: 86400_000 },
    user: { staleTime: 300_000, gcTime: 600_000 },
  },
  
  // Artigo 11° - Network mode
  NETWORK_MODE: "offlineFirst" as const,
  REFETCH_ON_FOCUS: false,
  REFETCH_ON_RECONNECT: false,
  RETRY: 1,
  
  // Artigo 12° - Prefetch crítico
  PREFETCH_ON_LOAD: ["user-profile", "app-config"],
} as const;

// ============================================
// TÍTULO V - SERVICE WORKER (Artigos 13-15)
// ============================================

export const SW_CONSTITUTION = {
  // Artigo 13° - Estratégias
  STRATEGIES: {
    static: "cache-first",
    api: "network-first",
    images: "stale-while-revalidate",
    fonts: "cache-first",
  },
  
  // Artigo 14° - Versionamento
  CACHE_VERSION: "dogma-v7.0",
  
  // Artigo 15° - Offline
  OFFLINE_FALLBACK: "/index.html",
} as const;

// ============================================
// TÍTULO VI - DETECÇÃO (Artigos 16-18)
// ============================================

export const DETECTION_CONSTITUTION = {
  // Artigo 16° - Tiers
  TIERS: {
    ultra: { minCores: 8, minMemory: 8, connection: "wifi" },
    high: { minCores: 4, minMemory: 4, connection: "4g" },
    medium: { minCores: 2, minMemory: 2, connection: "4g" },
    low: { minCores: 1, minMemory: 1, connection: "3g" },
    critical: { minCores: 1, minMemory: 1, connection: "2g" },
  },
  
  // Artigo 17° - Hooks obrigatórios
  USE_NETWORK_INFO: true,
  USE_PERFORMANCE_MODE: true,
  
  // Artigo 18° - Data Saver
  RESPECT_DATA_SAVER: true,
  DATA_SAVER_DISABLES: ["autoplay", "prefetch", "hd-images", "animations"],
} as const;

// ============================================
// TÍTULO VII - ANIMAÇÕES (Artigos 19-21)
// ============================================

export const ANIMATION_CONSTITUTION = {
  // Artigo 19° - Reduced Motion
  RESPECT_REDUCED_MOTION: true,
  
  // Artigo 20° - GPU only
  ALLOWED_PROPERTIES: ["transform", "opacity"],
  FORBIDDEN_PROPERTIES: ["width", "height", "top", "left", "margin", "padding"],
  USE_WILL_CHANGE: true,
  
  // Artigo 21° - Duração por tier
  DURATION_MULTIPLIER: {
    critical: 0,
    low: 0.3,
    medium: 0.6,
    high: 0.8,
    ultra: 1.0,
  },
} as const;

// ============================================
// TÍTULO VIII - CSS (Artigos 22-24)
// ============================================

export const CSS_CONSTITUTION = {
  // Artigo 22° - Critical inline
  CRITICAL_CSS_INLINE: true,
  CRITICAL_INCLUDES: ["root-vars", "body", "initial-loader"],
  
  // Artigo 23° - CSS Containment
  USE_CONTAIN: true,
  CONTAIN_CARDS: "layout style",
  CONTAIN_VIRTUAL_LIST: "strict",
  
  // Artigo 24° - Media queries
  MEDIA_QUERIES: {
    reducedData: "@media (prefers-reduced-data: reduce)",
    noHover: "@media (hover: none)",
    reducedMotion: "@media (prefers-reduced-motion: reduce)",
  },
} as const;

// ============================================
// TÍTULO IX - VIRTUALIZAÇÃO (Artigos 25-26)
// ============================================

export const VIRTUAL_CONSTITUTION = {
  // Artigo 25° - Threshold
  VIRTUALIZE_ABOVE: 50, // itens
  
  // Artigo 26° - Overscan por tier
  OVERSCAN_BY_TIER: {
    critical: 1,
    low: 2,
    medium: 3,
    high: 5,
    ultra: 8,
  },
} as const;

// ============================================
// TÍTULO X - PRECONNECT (Artigos 27-29)
// ============================================

export const PRECONNECT_CONSTITUTION = {
  // Artigo 27° - URLs obrigatórias
  PRECONNECT_URLS: [
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
    "https://fyikfsasudgzsjmumdlw.supabase.co",
  ],
  
  // Artigo 28° - Font display
  FONT_DISPLAY: "swap",
  PRELOAD_CRITICAL_FONTS: true,
  
  // Artigo 29° - Link prefetch
  OBSERVE_LINKS: true,
  PREFETCH_ON_INTERSECTION: true,
} as const;

// ============================================
// TÍTULO XI - MÉTRICAS (Artigos 30-31)
// ============================================

export const METRICS_CONSTITUTION = {
  // Artigo 30° - Core Web Vitals (3G)
  TARGETS: {
    FCP: 1800,   // First Contentful Paint < 1.8s
    LCP: 2500,   // Largest Contentful Paint < 2.5s
    CLS: 0.1,    // Cumulative Layout Shift < 0.1
    TBT: 300,    // Total Blocking Time < 300ms
    TTI: 3800,   // Time to Interactive < 3.8s
    SI: 3400,    // Speed Index < 3.4s
    FID: 100,    // First Input Delay < 100ms
  },
  
  // Artigo 31° - Budgets
  BUDGETS: {
    totalJS: 500_000,       // 500KB max
    totalCSS: 100_000,      // 100KB max
    totalImages: 1_000_000, // 1MB max
    maxRequests: 50,
    maxDOMNodes: 1500,
  },
} as const;

// ============================================
// TÍTULO XII - MEMOIZAÇÃO (Artigos 32-33)
// ============================================

export const MEMO_CONSTITUTION = {
  // Artigo 32° - Obrigatório
  MEMO_COMPONENTS_WITH_PROPS: true,
  USE_MEMO_FOR_HEAVY_CALC: true,
  USE_CALLBACK_FOR_HANDLERS: true,
  
  // Artigo 33° - displayName
  REQUIRE_DISPLAY_NAME: true,
} as const;

// ============================================
// TÍTULO XIII - DEBOUNCE/THROTTLE (Artigos 34-35)
// ============================================

export const TIMING_CONSTITUTION = {
  // Artigo 34° - Debounce
  SEARCH_DEBOUNCE_MS: 300,
  INPUT_DEBOUNCE_MS: 150,
  
  // Artigo 35° - Throttle
  SCROLL_THROTTLE_MS: 100,
  RESIZE_THROTTLE_MS: 200,
  USE_PASSIVE_SCROLL: true,
} as const;

// ============================================
// TÍTULO XIV - DATABASE (Artigos 36-38)
// ============================================

export const DB_CONSTITUTION = {
  // Artigo 36° - Índices
  INDEX_SEARCH_COLUMNS: true,
  USE_COMPOSITE_INDEXES: true,
  USE_PARTIAL_INDEXES: true,
  
  // Artigo 37° - Limits
  DEFAULT_QUERY_LIMIT: 50,
  MAX_QUERY_LIMIT: 1000,
  ALWAYS_USE_LIMIT: true,
  
  // Artigo 38° - Select
  NEVER_SELECT_STAR: true,
  SELECT_ONLY_NEEDED: true,
} as const;

// ============================================
// TÍTULO XV - ERROR HANDLING (Artigos 39-40)
// ============================================

export const ERROR_CONSTITUTION = {
  // Artigo 39° - Error Boundaries
  USE_ERROR_BOUNDARIES: true,
  WRAP_CRITICAL_SECTIONS: true,
  
  // Artigo 40° - Fallback leve
  FALLBACK_MAX_SIZE_KB: 2,
  SHOW_RETRY_BUTTON: true,
} as const;

// ============================================
// DISPOSIÇÕES FINAIS (Artigos 41-43)
// ============================================

export const FINAL_DISPOSITIONS = {
  // Artigo 41° - Aplicação universal
  APPLIES_TO_ALL_CODE: true,
  NO_EXCEPTIONS: true,
  
  // Artigo 42° - Prioridade
  PERFORMANCE_OVER_FEATURES: true,
  MAINTAIN_CORE_FUNCTIONALITY: true,
  
  // Artigo 43° - Evolução
  CAN_EXPAND: true,
  CANNOT_REMOVE_ARTICLES: true,
  CANNOT_WEAKEN_RULES: true,
} as const;

// ============================================
// CONSTITUIÇÃO COMPLETA EXPORTADA
// ============================================

export const LEI_I_PERFORMANCE = {
  // Títulos I-XV
  BUNDLE: BUNDLE_CONSTITUTION,
  LAZY: LAZY_CONSTITUTION,
  IMAGE: IMAGE_CONSTITUTION,
  QUERY: QUERY_CONSTITUTION,
  SW: SW_CONSTITUTION,
  DETECTION: DETECTION_CONSTITUTION,
  ANIMATION: ANIMATION_CONSTITUTION,
  CSS: CSS_CONSTITUTION,
  VIRTUAL: VIRTUAL_CONSTITUTION,
  PRECONNECT: PRECONNECT_CONSTITUTION,
  METRICS: METRICS_CONSTITUTION,
  MEMO: MEMO_CONSTITUTION,
  TIMING: TIMING_CONSTITUTION,
  DB: DB_CONSTITUTION,
  ERROR: ERROR_CONSTITUTION,
  FINAL: FINAL_DISPOSITIONS,
  
  // Metadata
  VERSION: "1.0.0",
  ARTICLES_COUNT: 43,
  CREATED_AT: "2024-12-22",
  PURPOSE: "Garantir performance máxima em 3G e dispositivos básicos",
} as const;

// ============================================
// FUNÇÕES DE ENFORCEMENT
// ============================================

/**
 * Verifica se um tier permite animações
 */
export function canAnimate(tier: keyof typeof ANIMATION_CONSTITUTION.DURATION_MULTIPLIER): boolean {
  return ANIMATION_CONSTITUTION.DURATION_MULTIPLIER[tier] > 0;
}

/**
 * Obtém duração de animação ajustada por tier
 */
export function getAnimationDuration(
  baseDuration: number, 
  tier: keyof typeof ANIMATION_CONSTITUTION.DURATION_MULTIPLIER
): number {
  return baseDuration * ANIMATION_CONSTITUTION.DURATION_MULTIPLIER[tier];
}

/**
 * Obtém qualidade de imagem por tier
 */
export function getImageQuality(tier: keyof typeof IMAGE_CONSTITUTION.QUALITY_BY_TIER): number {
  return IMAGE_CONSTITUTION.QUALITY_BY_TIER[tier];
}

/**
 * Obtém overscan por tier
 */
export function getOverscan(tier: keyof typeof VIRTUAL_CONSTITUTION.OVERSCAN_BY_TIER): number {
  return VIRTUAL_CONSTITUTION.OVERSCAN_BY_TIER[tier];
}

/**
 * Obtém rootMargin por tipo de conexão
 */
export function getRootMargin(connectionType: keyof typeof LAZY_CONSTITUTION.ROOT_MARGIN): string {
  return LAZY_CONSTITUTION.ROOT_MARGIN[connectionType];
}

/**
 * Verifica se está dentro do budget
 */
export function checkBudget(metric: keyof typeof METRICS_CONSTITUTION.BUDGETS, value: number): boolean {
  return value <= METRICS_CONSTITUTION.BUDGETS[metric];
}

/**
 * Verifica Core Web Vital
 */
export function checkWebVital(metric: keyof typeof METRICS_CONSTITUTION.TARGETS, value: number): boolean {
  return value <= METRICS_CONSTITUTION.TARGETS[metric];
}

// ============================================
// LOG DE INICIALIZAÇÃO
// ============================================

if (typeof window !== 'undefined') {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     🏛️ CONSTITUIÇÃO SYNAPSE - LEI I: PERFORMANCE         ║
╠══════════════════════════════════════════════════════════╣
║  Versão: ${LEI_I_PERFORMANCE.VERSION}                                       ║
║  Artigos: ${LEI_I_PERFORMANCE.ARTICLES_COUNT}                                          ║
║  Status: ATIVA E ENFORCED                                ║
║  Objetivo: 3G + Dispositivos Básicos = 100%              ║
╚══════════════════════════════════════════════════════════╝
  `.trim());
}

export default LEI_I_PERFORMANCE;
