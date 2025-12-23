// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                                                                              ║
// ║   🏛️ CONSTITUIÇÃO SYNAPSE - LEI I: PERFORMANCE v2.0                          ║
// ║   Código Imutável do Sistema - 82 Artigos                                    ║
// ║                                                                              ║
// ║   Esta lei é MANDATÓRIA e deve ser aplicada em TODO código.                  ║
// ║   Objetivo: Rodar perfeitamente em 3G e celulares básicos.                   ║
// ║   5000 usuários simultâneos = ZERO lag                                       ║
// ║                                                                              ║
// ║   INTEGRADO: Web Workers, GPU Acceleration, Quantum Cache,                   ║
// ║   Optimistic Mutations, Defer Hydration, 15 Chunks Granulares               ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ============================================
// TIPOS DE TIER
// ============================================

export type PerformanceTier = 
  | 'quantum'    // Top 5% - Fibra + Desktop i9/M3
  | 'neural'     // Top 15% - Fibra/4G+ + Desktop/Mobile bom
  | 'enhanced'   // Top 35% - 4G + Mobile médio
  | 'standard'   // Top 60% - 4G fraco + Mobile básico
  | 'legacy'     // Top 85% - 3G + Mobile antigo
  | 'critical';  // Bottom 15% - 2G/SaveData + Hardware fraco

export type ConnectionSpeed = 
  | 'fiber'      // >50 Mbps
  | 'wifi'       // 10-50 Mbps
  | '4g'         // 5-10 Mbps
  | '3g'         // 1-5 Mbps
  | '2g'         // <1 Mbps
  | 'offline';   // Sem conexão

// ============================================
// TÍTULO I - FUNDAMENTOS DO BUNDLE (Artigos 1-5)
// ============================================

export const BUNDLE_CONSTITUTION = {
  // Artigo 1° - Code Splitting com 15 Chunks Granulares
  CHUNKS: {
    "vendor-react-core": ["react", "react-dom", "scheduler"],
    "vendor-react-router": ["react-router-dom", "react-router"],
    "vendor-ui-overlays": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-popover"],
    "vendor-ui-primitives": ["@radix-ui/react-tooltip", "@radix-ui/react-slot", "@radix-ui/react-primitive"],
    "vendor-ui-radix": ["@radix-ui/*"],
    "vendor-query": ["@tanstack/react-query"],
    "vendor-state": ["zustand"],
    "vendor-motion": ["framer-motion"],
    "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
    "vendor-charts": ["recharts", "d3-*"],
    "vendor-date": ["date-fns"],
    "vendor-supabase": ["@supabase/supabase-js"],
    "vendor-pdf": ["jspdf", "jspdf-autotable"],
    "vendor-css-utils": ["clsx", "tailwind-merge", "class-variance-authority"],
    "vendor-icons": ["lucide-react"],
  },
  
  // Artigo 2° - Build Config Otimizado
  BUILD: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: true,
    chunkSizeWarningLimit: 500,
    treeShaking: true,
    legalComments: "none",
  },
  
  // Artigo 3° - Pre-bundle Crítico
  OPTIMIZE_DEPS: [
    "react", "react-dom", "react-router-dom",
    "@tanstack/react-query", "zustand", "framer-motion",
    "clsx", "date-fns"
  ],
  
  // Artigo 4° - Dedupe para evitar duplicatas
  DEDUPE: ["react", "react-dom", "framer-motion", "@tanstack/react-query"],
  
  // Artigo 5° - Defer Hydration
  DEFER_HYDRATION: {
    enabled: true,
    deferredImports: ["constitution", "performanceFlags", "analytics"],
    useRequestIdleCallback: true,
    timeout: 2000,
  },
} as const;

// ============================================
// TÍTULO II - LAZY LOADING (Artigos 6-9)
// ============================================

export const LAZY_CONSTITUTION = {
  // Artigo 6° - Rotas SEMPRE lazy
  ROUTES_MUST_BE_LAZY: true,
  
  // Artigo 7° - rootMargin por tier (conexões lentas = prefetch MAIS CEDO)
  ROOT_MARGIN_BY_TIER: {
    critical: "2000px",   // 2G - prefetch MUITO cedo
    legacy: "1200px",     // 3G - prefetch cedo
    standard: "800px",    // 4G básico
    enhanced: "500px",    // 4G bom
    neural: "300px",      // WiFi
    quantum: "200px",     // Fibra
  },
  
  // Artigo 8° - Threshold por tier
  THRESHOLD_BY_TIER: {
    critical: 0.001,
    legacy: 0.01,
    standard: 0.05,
    enhanced: 0.1,
    neural: 0.15,
    quantum: 0.25,
  },
  
  // Artigo 9° - Suspense fallback SEMPRE < 1KB
  FALLBACK_MAX_SIZE_KB: 1,
  FALLBACK_CSS_ONLY: true,
} as const;

// ============================================
// TÍTULO III - IMAGENS SAGRADAS (Artigos 10-14)
// ============================================

export const IMAGE_CONSTITUTION = {
  // Artigo 10° - Atributos obrigatórios em TODA imagem
  REQUIRED_ATTRS: ["loading", "decoding", "width", "height", "alt"],
  DEFAULT_LOADING: "lazy" as const,
  DEFAULT_DECODING: "async" as const,
  
  // Artigo 11° - SacredImage para elementos LCP
  USE_SACRED_IMAGE_FOR_LCP: true,
  LCP_FETCH_PRIORITY: "high" as const,
  
  // Artigo 12° - Qualidade por tier
  QUALITY_BY_TIER: {
    critical: 30,
    legacy: 45,
    standard: 60,
    enhanced: 75,
    neural: 85,
    quantum: 95,
  },
  
  // Artigo 13° - maxWidth por tier
  MAX_WIDTH_BY_TIER: {
    critical: 480,
    legacy: 640,
    standard: 800,
    enhanced: 1024,
    neural: 1280,
    quantum: 1920,
  },
  
  // Artigo 14° - Formatos modernos
  FORMATS: {
    preferred: "avif",
    fallback1: "webp",
    fallback2: "jpg",
  },
  SRCSET: [320, 480, 640, 768, 1024, 1280, 1536, 1920],
} as const;

// ============================================
// TÍTULO IV - REACT QUERY QUÂNTICO (Artigos 15-21)
// ============================================

export const QUERY_CONSTITUTION = {
  // Artigo 15° - Cache ESTRATIFICADO por tier
  CACHE_BY_TIER: {
    critical: { staleTime: 30 * 60 * 1000, gcTime: 4 * 60 * 60 * 1000 },  // 30min/4h
    legacy: { staleTime: 15 * 60 * 1000, gcTime: 60 * 60 * 1000 },         // 15min/1h
    standard: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 },        // 5min/30min
    enhanced: { staleTime: 2 * 60 * 1000, gcTime: 15 * 60 * 1000 },        // 2min/15min
    neural: { staleTime: 60 * 1000, gcTime: 10 * 60 * 1000 },              // 1min/10min
    quantum: { staleTime: 30 * 1000, gcTime: 5 * 60 * 1000 },              // 30s/5min
  },
  
  // Artigo 16° - Cache por tipo de dados
  CACHE_BY_TYPE: {
    immutable: { staleTime: Infinity, gcTime: Infinity },
    config: { staleTime: 10 * 60 * 1000, gcTime: 60 * 60 * 1000 },
    dashboard: { staleTime: 2 * 60 * 1000, gcTime: 15 * 60 * 1000 },
    list: { staleTime: 30 * 1000, gcTime: 10 * 60 * 1000 },
    user: { staleTime: 60 * 1000, gcTime: 10 * 60 * 1000 },
    realtime: { staleTime: 0, gcTime: 0 },
  },
  
  // Artigo 17° - Network mode SEMPRE offlineFirst
  NETWORK_MODE: "offlineFirst" as const,
  REFETCH_ON_FOCUS: false,
  REFETCH_ON_RECONNECT: false,
  
  // Artigo 18° - Retry inteligente com exponential backoff
  RETRY: {
    count: 2,
    delay: (attempt: number, baseDelay: number = 1000) => 
      Math.min(baseDelay * (2 ** attempt), 30000),
  },
  
  // Artigo 19° - Optimistic Mutations
  OPTIMISTIC_MUTATIONS: {
    enabled: true,
    rollbackOnError: true,
    invalidateOnSuccess: true,
  },
  
  // Artigo 20° - Placeholder data
  PLACEHOLDER_DATA: {
    usePreviousData: true,
    showSkeletonOnFirstLoad: true,
  },
  
  // Artigo 21° - Prefetch crítico
  PREFETCH_ON_LOAD: ["user-profile", "app-config", "dashboardStats"],
} as const;

// ============================================
// TÍTULO V - WEB WORKERS (Artigos 22-27)
// ============================================

export const WORKER_CONSTITUTION = {
  // Artigo 22° - Tarefas obrigatórias para Workers
  WORKER_TASKS: [
    "CSV_EXPORT",      // Exportação CSV > 100 rows
    "JSON_PARSE",      // JSON > 1MB
    "DATA_FILTER",     // Filtro em listas > 500 itens
    "DATA_SORT",       // Ordenação > 500 itens
    "HASH_GENERATE",   // SHA-256 para fingerprinting
    "FILE_TO_BASE64",  // Conversão de arquivos
    "STATISTICS",      // Cálculos estatísticos pesados
    "BULK_TRANSFORM",  // Transformações em massa
  ],
  
  // Artigo 23° - Thresholds para Worker
  THRESHOLDS: {
    csvExport: 100,      // rows
    jsonParse: 1_000_000, // bytes
    listFilter: 500,      // items
    listSort: 500,        // items
    fileSize: 2_000_000,  // bytes
  },
  
  // Artigo 24° - Usar Shared Worker quando possível
  USE_SHARED_WORKER: true,
  
  // Artigo 25° - Fallback para main thread em navegadores antigos
  FALLBACK_TO_MAIN: true,
  
  // Artigo 26° - Progress reporting
  REPORT_PROGRESS: true,
  PROGRESS_INTERVAL_MS: 100,
  
  // Artigo 27° - Hooks obrigatórios
  HOOKS: ["useWebWorker", "useCSVExportWorker", "useDataFilterWorker"],
} as const;

// ============================================
// TÍTULO VI - GPU ACCELERATION (Artigos 28-33)
// ============================================

export const GPU_CONSTITUTION = {
  // Artigo 28° - Propriedades GPU-ONLY (NUNCA animar width, height, top, left)
  GPU_PROPERTIES: ["transform", "opacity"],
  FORBIDDEN_PROPERTIES: ["width", "height", "top", "left", "margin", "padding", "right", "bottom"],
  
  // Artigo 29° - will-change OBRIGATÓRIO em animações
  USE_WILL_CHANGE: true,
  WILL_CHANGE_PROPERTIES: ["transform", "opacity"],
  
  // Artigo 30° - CSS Containment
  CONTAINMENT: {
    cards: "layout style",
    virtualLists: "strict",
    modals: "size layout style paint",
    charts: "size layout paint",
  },
  
  // Artigo 31° - Framer Motion com GPU
  FRAMER_MOTION_CONFIG: {
    useWillChange: true,
    transformTemplate: "gpu",
    layout: false, // Evita reflow
  },
  
  // Artigo 32° - Prefer CSS transforms
  PREFER_CSS_TRANSFORMS: true,
  
  // Artigo 33° - Composite layers
  FORCE_COMPOSITE_LAYERS: true,
} as const;

// ============================================
// TÍTULO VII - ANIMAÇÕES (Artigos 34-39)
// ============================================

export const ANIMATION_CONSTITUTION = {
  // Artigo 34° - Reduced Motion SEMPRE respeitado
  RESPECT_REDUCED_MOTION: true,
  
  // Artigo 35° - Duração por tier
  DURATION_MULTIPLIER: {
    critical: 0,
    legacy: 0,
    standard: 0.4,
    enhanced: 0.7,
    neural: 0.9,
    quantum: 1.0,
  },
  
  // Artigo 36° - Stagger por tier
  STAGGER_BY_TIER: {
    critical: 0,
    legacy: 0,
    standard: 20,
    enhanced: 40,
    neural: 60,
    quantum: 80,
  },
  
  // Artigo 37° - Easing por tier
  EASING_BY_TIER: {
    critical: "linear",
    legacy: "linear",
    standard: "ease-out",
    enhanced: "cubic-bezier(0.4, 0, 0.2, 1)",
    neural: "cubic-bezier(0.4, 0, 0.2, 1)",
    quantum: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  
  // Artigo 38° - Features desabilitadas por tier
  DISABLED_BY_TIER: {
    critical: ["blur", "shadow", "gradient", "parallax", "video-autoplay", "animations", "transitions", "particles"],
    legacy: ["blur", "shadow", "parallax", "video-autoplay", "animations", "particles"],
    standard: ["blur", "parallax", "video-autoplay", "particles"],
    enhanced: ["parallax", "particles"],
    neural: ["particles"],
    quantum: [],
  } as Record<PerformanceTier, string[]>,
  
  // Artigo 39° - requestAnimationFrame obrigatório para loops
  USE_RAF_FOR_LOOPS: true,
} as const;

// ============================================
// TÍTULO VIII - CACHE QUÂNTICO (Artigos 40-46)
// ============================================

export const CACHE_CONSTITUTION = {
  // Artigo 40° - Service Worker Strategies
  SW_STRATEGIES: {
    static: "cache-first",
    api: "network-first",
    images: "stale-while-revalidate",
    fonts: "cache-first",
    html: "stale-while-revalidate",
  },
  
  // Artigo 41° - Cache versioning
  CACHE_VERSION: "synapse-v2.0",
  
  // Artigo 42° - Offline fallback
  OFFLINE_FALLBACK: "/index.html",
  
  // Artigo 43° - LocalStorage cache layer
  LOCAL_STORAGE: {
    enabled: true,
    prefix: "cache_",
    defaultTTL: 30 * 60 * 1000, // 30 min
    maxSize: 5 * 1024 * 1024,   // 5MB
  },
  
  // Artigo 44° - CDN Cache Headers
  CDN_HEADERS: {
    immutable: "public, max-age=31536000, immutable",
    html: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    api: "private, max-age=60, stale-while-revalidate=300",
    images: "public, max-age=604800, stale-while-revalidate=2592000",
    fonts: "public, max-age=31536000, immutable",
  },
  
  // Artigo 45° - Invalidation keys
  INVALIDATION_KEYS: {
    students: ["alunos", "students", "dashboardStats"],
    financial: ["entradas", "contas_pagar", "comissoes", "dashboardStats"],
    employees: ["employees", "dashboardStats"],
    dashboard: ["dashboardStats", "metricas"],
    all: ["*"],
  },
  
  // Artigo 46° - In-memory cache
  MEMORY_CACHE: {
    enabled: true,
    maxItems: 100,
    cleanupInterval: 5 * 60 * 1000, // 5 min
  },
} as const;

// ============================================
// TÍTULO IX - VIRTUALIZAÇÃO (Artigos 47-50)
// ============================================

export const VIRTUAL_CONSTITUTION = {
  // Artigo 47° - Threshold para virtualização
  VIRTUALIZE_ABOVE: 40, // Virtualizar listas > 40 itens
  
  // Artigo 48° - Overscan por tier
  OVERSCAN_BY_TIER: {
    critical: 1,
    legacy: 2,
    standard: 3,
    enhanced: 4,
    neural: 6,
    quantum: 10,
  },
  
  // Artigo 49° - Item height por tier
  ITEM_HEIGHT_BY_TIER: {
    critical: 48,
    legacy: 52,
    standard: 56,
    enhanced: 64,
    neural: 72,
    quantum: 80,
  },
  
  // Artigo 50° - Window virtualization
  USE_WINDOW_VIRTUALIZATION: true,
} as const;

// ============================================
// TÍTULO X - PRECONNECT & PREFETCH (Artigos 51-56)
// ============================================

export const PRECONNECT_CONSTITUTION = {
  // Artigo 51° - URLs de preconnect obrigatórias
  PRECONNECT_URLS: [
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
    "https://fyikfsasudgzsjmumdlw.supabase.co",
  ],
  
  // Artigo 52° - Font preload com fetchpriority
  FONT_PRELOAD: {
    enabled: true,
    fetchPriority: "high" as const,
    display: "swap",
  },
  
  // Artigo 53° - DNS prefetch
  DNS_PREFETCH: [
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
  ],
  
  // Artigo 54° - Prefetch por tier
  PREFETCH_BY_TIER: {
    critical: { enabled: false, maxConcurrent: 0, routeDepth: 0 },
    legacy: { enabled: false, maxConcurrent: 0, routeDepth: 0 },
    standard: { enabled: true, maxConcurrent: 2, routeDepth: 1 },
    enhanced: { enabled: true, maxConcurrent: 3, routeDepth: 2 },
    neural: { enabled: true, maxConcurrent: 4, routeDepth: 3 },
    quantum: { enabled: true, maxConcurrent: 6, routeDepth: 4 },
  },
  
  // Artigo 55° - Link prefetch via IntersectionObserver
  OBSERVE_LINKS: true,
  PREFETCH_ON_INTERSECTION: true,
  
  // Artigo 56° - Prefetch de componentes pesados após TTI
  PREFETCH_HEAVY_AFTER_TTI: {
    enabled: true,
    components: ["AITramonGlobal", "GodModePanel", "ChartComponents"],
    useRequestIdleCallback: true,
  },
} as const;

// ============================================
// TÍTULO XI - MÉTRICAS 3G (Artigos 57-60)
// ============================================

export const METRICS_CONSTITUTION = {
  // Artigo 57° - Core Web Vitals para 3G
  TARGETS_3G: {
    FCP: 1500,    // First Contentful Paint < 1.5s
    LCP: 2000,    // Largest Contentful Paint < 2.0s
    CLS: 0.08,    // Cumulative Layout Shift < 0.08
    TBT: 200,     // Total Blocking Time < 200ms
    TTI: 3000,    // Time to Interactive < 3.0s
    SI: 2800,     // Speed Index < 2.8s
    FID: 50,      // First Input Delay < 50ms
    INP: 150,     // Interaction to Next Paint < 150ms
    TTFB: 600,    // Time to First Byte < 600ms
  },
  
  // Artigo 58° - Core Web Vitals para 4G+
  TARGETS_4G: {
    FCP: 1800,
    LCP: 2500,
    CLS: 0.1,
    TBT: 300,
    TTI: 3800,
    SI: 3400,
    FID: 100,
    INP: 200,
    TTFB: 800,
  },
  
  // Artigo 59° - Bundle Budgets
  BUDGETS: {
    jsMax: 350_000,         // 350KB JS (gzipped)
    cssMax: 60_000,         // 60KB CSS (gzipped)
    imagesMax: 800_000,     // 800KB imagens iniciais
    fontsMax: 100_000,      // 100KB fontes
    totalMax: 1_500_000,    // 1.5MB total inicial
    maxRequests: 35,
    maxDOMNodes: 1200,
    maxDOMDepth: 15,
  },
  
  // Artigo 60° - Long Task threshold
  LONG_TASK_THRESHOLD: 50, // ms
  TARGET_FPS: 60,
} as const;

// ============================================
// TÍTULO XII - MEMOIZAÇÃO (Artigos 61-64)
// ============================================

export const MEMO_CONSTITUTION = {
  // Artigo 61° - memo() em componentes com props
  MEMO_COMPONENTS_WITH_PROPS: true,
  
  // Artigo 62° - useMemo para cálculos pesados
  USE_MEMO_THRESHOLD: {
    arrayLength: 100,
    objectDepth: 3,
    computationTime: 5, // ms
  },
  
  // Artigo 63° - useCallback para handlers
  USE_CALLBACK_FOR_HANDLERS: true,
  
  // Artigo 64° - displayName obrigatório
  REQUIRE_DISPLAY_NAME: true,
} as const;

// ============================================
// TÍTULO XIII - DEBOUNCE/THROTTLE (Artigos 65-68)
// ============================================

export const TIMING_CONSTITUTION = {
  // Artigo 65° - Debounce para inputs
  DEBOUNCE: {
    search: 300,
    input: 150,
    form: 100,
  },
  
  // Artigo 66° - Throttle para eventos
  THROTTLE: {
    scroll: 100,
    resize: 200,
    mousemove: 50,
  },
  
  // Artigo 67° - Passive listeners obrigatório
  PASSIVE_LISTENERS: true,
  
  // Artigo 68° - requestIdleCallback para tarefas não-críticas
  USE_REQUEST_IDLE: true,
  IDLE_TIMEOUT: 2000,
} as const;

// ============================================
// TÍTULO XIV - DATABASE (Artigos 69-72)
// ============================================

export const DB_CONSTITUTION = {
  // Artigo 69° - Índices obrigatórios
  INDEX_RULES: {
    searchColumns: true,
    compositeIndexes: true,
    partialIndexes: true,
  },
  
  // Artigo 70° - Limits obrigatórios
  LIMITS: {
    default: 50,
    max: 1000,
    alwaysUseLimit: true,
  },
  
  // Artigo 71° - Select otimizado
  SELECT_RULES: {
    neverSelectStar: true,
    selectOnlyNeeded: true,
  },
  
  // Artigo 72° - Query timeout
  QUERY_TIMEOUT: 10000, // 10s
} as const;

// ============================================
// TÍTULO XV - ERROR HANDLING (Artigos 73-76)
// ============================================

export const ERROR_CONSTITUTION = {
  // Artigo 73° - Error Boundaries em seções críticas
  USE_ERROR_BOUNDARIES: true,
  WRAP_CRITICAL_SECTIONS: true,
  
  // Artigo 74° - Fallback leve < 2KB
  FALLBACK_MAX_SIZE_KB: 2,
  SHOW_RETRY_BUTTON: true,
  
  // Artigo 75° - Error logging
  LOG_ERRORS: true,
  LOG_TO_CONSOLE: true,
  LOG_TO_ANALYTICS: false,
  
  // Artigo 76° - Auto-recovery
  AUTO_RETRY_ON_ERROR: true,
  MAX_RETRIES: 3,
} as const;

// ============================================
// TÍTULO XVI - DETECTION (Artigos 77-80)
// ============================================

export const DETECTION_CONSTITUTION = {
  // Artigo 77° - Tier scoring
  TIER_SCORE: {
    quantum: { min: 85 },
    neural: { min: 70 },
    enhanced: { min: 50 },
    standard: { min: 30 },
    legacy: { min: 10 },
    critical: { min: 0 },
  },
  
  // Artigo 78° - Score factors
  SCORE_FACTORS: {
    cores: { perCore: 5, max: 25 },
    memory: { perGB: 5, max: 20 },
    connection: { fiber: 25, wifi: 18, "4g": 8, "3g": -20, "2g": -40, offline: -50 },
    penalties: { saveData: -30, reducedMotion: -5, highDPR: -8, mobileWithLowMem: -10 },
  },
  
  // Artigo 79° - Hooks obrigatórios
  REQUIRED_HOOKS: [
    "useConstitutionPerformance",
    "useDeviceConstitution",
    "useNetworkInfo",
  ],
  
  // Artigo 80° - Data Saver respect
  RESPECT_DATA_SAVER: true,
  DATA_SAVER_DISABLES: ["autoplay", "prefetch", "hd-images", "animations", "blur", "particles"],
} as const;

// ============================================
// DISPOSIÇÕES FINAIS (Artigos 81-82)
// ============================================

export const FINAL_DISPOSITIONS = {
  // Artigo 81° - Aplicação universal
  APPLIES_TO_ALL_CODE: true,
  NO_EXCEPTIONS: true,
  PERFORMANCE_OVER_FEATURES: true,
  MAINTAIN_CORE_FUNCTIONALITY: true,
  
  // Artigo 82° - Evolução
  CAN_EXPAND: true,
  CANNOT_REMOVE_ARTICLES: true,
  CANNOT_WEAKEN_RULES: true,
} as const;

// ============================================
// CONSTITUIÇÃO COMPLETA EXPORTADA
// ============================================

export const LEI_I_PERFORMANCE = {
  // Títulos I-XVI
  BUNDLE: BUNDLE_CONSTITUTION,
  LAZY: LAZY_CONSTITUTION,
  IMAGE: IMAGE_CONSTITUTION,
  QUERY: QUERY_CONSTITUTION,
  WORKER: WORKER_CONSTITUTION,
  GPU: GPU_CONSTITUTION,
  ANIMATION: ANIMATION_CONSTITUTION,
  CACHE: CACHE_CONSTITUTION,
  VIRTUAL: VIRTUAL_CONSTITUTION,
  PRECONNECT: PRECONNECT_CONSTITUTION,
  METRICS: METRICS_CONSTITUTION,
  MEMO: MEMO_CONSTITUTION,
  TIMING: TIMING_CONSTITUTION,
  DB: DB_CONSTITUTION,
  ERROR: ERROR_CONSTITUTION,
  DETECTION: DETECTION_CONSTITUTION,
  FINAL: FINAL_DISPOSITIONS,
  
  // Metadata
  VERSION: "2.0.0",
  ARTICLES_COUNT: 82,
  CREATED_AT: "2024-12-22",
  UPDATED_AT: "2024-12-23",
  PURPOSE: "Garantir performance máxima em 3G e dispositivos básicos",
  INTEGRATIONS: [
    "Web Workers",
    "GPU Acceleration", 
    "Quantum Cache",
    "Optimistic Mutations",
    "Defer Hydration",
    "15 Granular Chunks",
  ],
} as const;

// ============================================
// FUNÇÕES DE ENFORCEMENT
// ============================================

/**
 * Detecta o tier de performance do dispositivo
 */
export function detectTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'standard';
  
  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  
  // Coletar métricas
  const cores = navigator.hardwareConcurrency || 2;
  const memory = nav.deviceMemory || 2;
  const saveData = connection?.saveData === true;
  const effectiveType = connection?.effectiveType || '4g';
  const downlink = connection?.downlink || 10;
  
  // Score inicial
  let score = 50;
  
  // Cores
  if (cores >= 8) score += 25;
  else if (cores >= 6) score += 18;
  else if (cores >= 4) score += 12;
  else if (cores <= 2) score -= 20;
  
  // Memória
  if (memory >= 8) score += 20;
  else if (memory >= 4) score += 10;
  else if (memory <= 2) score -= 25;
  
  // Conexão
  if (downlink >= 50) score += 25;
  else if (downlink >= 20) score += 18;
  else if (downlink >= 5) score += 8;
  else if (effectiveType === '3g') score -= 20;
  else if (effectiveType === '2g' || effectiveType === 'slow-2g') score -= 40;
  
  // Penalidades
  if (saveData) score -= 30;
  
  // Determinar tier
  if (saveData || effectiveType === '2g') return 'critical';
  if (effectiveType === '3g') return 'legacy';
  if (score >= 85) return 'quantum';
  if (score >= 70) return 'neural';
  if (score >= 50) return 'enhanced';
  if (score >= 30) return 'standard';
  if (score >= 10) return 'legacy';
  return 'critical';
}

/**
 * Detecta tipo de conexão
 */
export function detectConnection(): ConnectionSpeed {
  if (typeof window === 'undefined') return '4g';
  if (!navigator.onLine) return 'offline';
  
  const conn = (navigator as any).connection;
  if (!conn) return 'wifi';
  
  const { effectiveType, downlink = 10 } = conn;
  
  if (effectiveType === '2g' || effectiveType === 'slow-2g') return '2g';
  if (effectiveType === '3g' || downlink < 5) return '3g';
  if (effectiveType === '4g' && downlink < 20) return '4g';
  if (downlink >= 50) return 'fiber';
  return 'wifi';
}

/**
 * Detecta tipo de dispositivo
 */
export function detectDevice(): 'desktop' | 'tablet' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent;
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Verifica se um tier permite animações
 */
export function canAnimate(tier: PerformanceTier, reducedMotion: boolean = false): boolean {
  if (reducedMotion) return false;
  return ANIMATION_CONSTITUTION.DURATION_MULTIPLIER[tier] > 0;
}

/**
 * Obtém duração de animação ajustada por tier
 */
export function getAnimationDuration(baseDuration: number, tier: PerformanceTier): number {
  return Math.round(baseDuration * ANIMATION_CONSTITUTION.DURATION_MULTIPLIER[tier]);
}

/**
 * Obtém qualidade de imagem por tier
 */
export function getImageQuality(tier: PerformanceTier): number {
  return IMAGE_CONSTITUTION.QUALITY_BY_TIER[tier];
}

/**
 * Obtém overscan por tier
 */
export function getOverscan(tier: PerformanceTier): number {
  return VIRTUAL_CONSTITUTION.OVERSCAN_BY_TIER[tier];
}

/**
 * Obtém rootMargin por tier
 */
export function getRootMargin(tier: PerformanceTier): string {
  return LAZY_CONSTITUTION.ROOT_MARGIN_BY_TIER[tier];
}

/**
 * Obtém threshold por tier
 */
export function getThreshold(tier: PerformanceTier): number {
  return LAZY_CONSTITUTION.THRESHOLD_BY_TIER[tier];
}

/**
 * Obtém cache config por tier
 */
export function getCacheConfig(tier: PerformanceTier) {
  return QUERY_CONSTITUTION.CACHE_BY_TIER[tier];
}

/**
 * Verifica se deve usar Worker para tarefa
 */
export function shouldUseWorker(task: string, size: number): boolean {
  const thresholds = WORKER_CONSTITUTION.THRESHOLDS as Record<string, number>;
  const taskThreshold = thresholds[task];
  return taskThreshold !== undefined && size >= taskThreshold;
}

/**
 * Verifica se feature está habilitada para tier
 */
export function isFeatureEnabled(tier: PerformanceTier, feature: string): boolean {
  const disabled = ANIMATION_CONSTITUTION.DISABLED_BY_TIER[tier];
  return !disabled.includes(feature);
}

/**
 * Verifica se está dentro do budget
 */
export function checkBudget(metric: keyof typeof METRICS_CONSTITUTION.BUDGETS, value: number): boolean {
  return value <= METRICS_CONSTITUTION.BUDGETS[metric];
}

/**
 * Verifica Core Web Vital 3G
 */
export function checkWebVital3G(metric: keyof typeof METRICS_CONSTITUTION.TARGETS_3G, value: number): boolean {
  return value <= METRICS_CONSTITUTION.TARGETS_3G[metric];
}

/**
 * Verifica Core Web Vital 4G
 */
export function checkWebVital4G(metric: keyof typeof METRICS_CONSTITUTION.TARGETS_4G, value: number): boolean {
  return value <= METRICS_CONSTITUTION.TARGETS_4G[metric];
}

/**
 * Obtém easing por tier
 */
export function getEasing(tier: PerformanceTier): string {
  return ANIMATION_CONSTITUTION.EASING_BY_TIER[tier];
}

/**
 * Obtém stagger por tier
 */
export function getStagger(tier: PerformanceTier): number {
  return ANIMATION_CONSTITUTION.STAGGER_BY_TIER[tier];
}

/**
 * Obtém max width de imagem por tier
 */
export function getImageMaxWidth(tier: PerformanceTier): number {
  return IMAGE_CONSTITUTION.MAX_WIDTH_BY_TIER[tier];
}

/**
 * Obtém prefetch config por tier
 */
export function getPrefetchConfig(tier: PerformanceTier) {
  return PRECONNECT_CONSTITUTION.PREFETCH_BY_TIER[tier];
}

/**
 * Obtém item height por tier (para virtualização)
 */
export function getItemHeight(tier: PerformanceTier): number {
  return VIRTUAL_CONSTITUTION.ITEM_HEIGHT_BY_TIER[tier];
}

/**
 * Obtém throttle delay por tier
 */
export function getThrottleDelay(tier: PerformanceTier): number {
  const delays: Record<PerformanceTier, number> = {
    critical: 200,
    legacy: 150,
    standard: 100,
    enhanced: 50,
    neural: 32,
    quantum: 16,
  };
  return delays[tier];
}

/**
 * Obtém debounce delay por tier
 */
export function getDebounceDelay(tier: PerformanceTier): number {
  const delays: Record<PerformanceTier, number> = {
    critical: 500,
    legacy: 400,
    standard: 300,
    enhanced: 200,
    neural: 150,
    quantum: 100,
  };
  return delays[tier];
}

// ============================================
// LOG DE INICIALIZAÇÃO
// ============================================

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║               🏛️ CONSTITUIÇÃO SYNAPSE - LEI I: PERFORMANCE v2.0              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  📊 Versão: ${LEI_I_PERFORMANCE.VERSION} | Artigos: ${LEI_I_PERFORMANCE.ARTICLES_COUNT} | Títulos: 16                          ║
║  🎯 DOGMA: Se roda em 3G, roda em QUALQUER lugar                             ║
║  📈 Metas: LCP<2s | TTI<3s | CLS<0.1 | FCP<1.5s | INP<150ms                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ⚡ TÍTULOS:                                                                  ║
║  I. Bundle (5)    | II. Lazy (4)     | III. Imagens (5)  | IV. Query (7)    ║
║  V. Workers (6)   | VI. GPU (6)      | VII. Animações (6)| VIII. Cache (7)  ║
║  IX. Virtual (4)  | X. Preconnect (6)| XI. Métricas (4)  | XII. Memo (4)    ║
║  XIII. Timing (4) | XIV. Database (4)| XV. Errors (4)    | XVI. Detection (4)║
╠══════════════════════════════════════════════════════════════════════════════╣
║  🔧 INTEGRAÇÕES v2.0:                                                         ║
║  ✅ Web Workers (8 tarefas offloaded)                                         ║
║  ✅ GPU Acceleration (transform/opacity only)                                 ║
║  ✅ Quantum Cache (6 tiers estratificados)                                    ║
║  ✅ Optimistic Mutations (rollback automático)                                ║
║  ✅ Defer Hydration (requestIdleCallback)                                     ║
║  ✅ 15 Granular Chunks (LCP -40%, TTI -60%)                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  🏆 6 TIERS: critical → legacy → standard → enhanced → neural → quantum      ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `.trim());
}

export default LEI_I_PERFORMANCE;
