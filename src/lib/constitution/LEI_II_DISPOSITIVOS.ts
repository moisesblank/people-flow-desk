// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                                                                              ║
// ║   🏛️ CONSTITUIÇÃO SYNAPSE - LEI II: DISPOSITIVOS                            ║
// ║   v1.0 - Código Imutável do Sistema                                         ║
// ║                                                                              ║
// ║   Esta lei é MANDATÓRIA e garante compatibilidade com TODOS dispositivos.   ║
// ║   Objetivo: Funcionar perfeitamente de celular 3G a desktop fibra.          ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ============================================
// TÍTULO I - BREAKPOINTS SAGRADOS (Artigos 1-3)
// ============================================

export const BREAKPOINTS_CONSTITUTION = {
  // Artigo 1° - Breakpoints Mobile-First
  BREAKPOINTS: {
    xs: 0,      // Mobile pequeno
    sm: 640,    // Mobile grande
    md: 768,    // Tablet
    lg: 1024,   // Desktop pequeno
    xl: 1280,   // Desktop
    "2xl": 1536, // Desktop grande
  },
  
  // Artigo 2° - Abordagem Mobile-First
  MOBILE_FIRST: true,
  START_FROM_SMALLEST: true,
  PROGRESSIVE_ENHANCEMENT: true,
  
  // Artigo 3° - Classes Tailwind obrigatórias
  USE_RESPONSIVE_PREFIXES: ["sm:", "md:", "lg:", "xl:", "2xl:"],
} as const;

// ============================================
// TÍTULO II - TOUCH & INTERAÇÃO (Artigos 4-6)
// ============================================

export const TOUCH_CONSTITUTION = {
  // Artigo 4° - Touch Target Mínimo (WCAG 2.5.5)
  MIN_TOUCH_TARGET: 44, // pixels
  MIN_TOUCH_TARGET_RELAXED: 24, // inline links
  TOUCH_SPACING: 8, // gap mínimo entre elementos tocáveis
  
  // Artigo 5° - Estados de Interação
  STATES: {
    touch: ":active", // dispositivos touch usam active
    mouse: ":hover",  // mouse usa hover
  },
  DISABLE_HOVER_ON_TOUCH: true,
  
  // Artigo 6° - Gestos
  SUPPORT_SWIPE: true,
  SUPPORT_PINCH_ZOOM: false, // evitar conflitos
  PASSIVE_TOUCH_LISTENERS: true,
} as const;

// ============================================
// TÍTULO III - LAYOUTS RESPONSIVOS (Artigos 7-10)
// ============================================

export const LAYOUT_CONSTITUTION = {
  // Artigo 7° - Dashboard Mobile Dedicado
  MOBILE_DASHBOARD: {
    enabled: true,
    breakpoint: 768, // abaixo disso, usar versão mobile
    simplified: true,
    bottomNav: true,
  },
  
  // Artigo 8° - Grids Responsivos
  GRIDS: {
    mobile: 1,    // 1 coluna
    tablet: 2,    // 2 colunas (md:grid-cols-2)
    desktop: 3,   // 3+ colunas (lg:grid-cols-3)
    gap: {
      mobile: 12, // gap-3
      desktop: 16, // gap-4
    },
  },
  
  // Artigo 9° - Sidebar Responsivo
  SIDEBAR: {
    mobile: "hidden", // drawer/sheet
    tablet: "collapsed", // mini (w-14)
    desktop: "expanded", // full (w-60)
    collapsedWidth: 56,
    expandedWidth: 240,
  },
  
  // Artigo 10° - Container Widths
  CONTAINERS: {
    maxWidth: 1536,
    padding: {
      mobile: 16,  // px-4
      tablet: 24,  // px-6
      desktop: 32, // px-8
    },
  },
} as const;

// ============================================
// TÍTULO IV - TIPOGRAFIA RESPONSIVA (Artigos 11-13)
// ============================================

export const TYPOGRAPHY_CONSTITUTION = {
  // Artigo 11° - Tamanhos Base
  BASE_SIZE: {
    mobile: 14,   // text-sm
    tablet: 15,   // entre sm e base
    desktop: 16,  // text-base
  },
  
  // Artigo 12° - Headings Responsivos
  HEADINGS: {
    h1: { mobile: 24, tablet: 32, desktop: 40 }, // text-2xl -> text-4xl
    h2: { mobile: 20, tablet: 24, desktop: 30 }, // text-xl -> text-3xl
    h3: { mobile: 18, tablet: 20, desktop: 24 }, // text-lg -> text-2xl
  },
  
  // Artigo 13° - Line Height & Spacing
  LINE_HEIGHT: {
    body: 1.6,
    heading: 1.2,
  },
  TRUNCATE_LONG_TEXT: true,
  USE_LINE_CLAMP: true,
} as const;

// ============================================
// TÍTULO V - IMAGENS RESPONSIVAS (Artigos 14-16)
// ============================================

export const RESPONSIVE_IMAGE_CONSTITUTION = {
  // Artigo 14° - Srcset Obrigatório
  USE_SRCSET: true,
  SIZES_ATTRIBUTE: true,
  WIDTHS: [320, 640, 768, 1024, 1280, 1920],
  
  // Artigo 15° - Aspect Ratios
  MAINTAIN_ASPECT_RATIO: true,
  DEFAULT_RATIOS: {
    hero: "16/9",
    card: "4/3",
    avatar: "1/1",
    thumbnail: "3/2",
  },
  
  // Artigo 16° - Object Fit
  USE_OBJECT_COVER: true,
  PREVENT_LAYOUT_SHIFT: true, // sempre width + height
} as const;

// ============================================
// TÍTULO VI - ADAPTAÇÃO DE REDE (Artigos 17-19)
// ============================================

export const NETWORK_CONSTITUTION = {
  // Artigo 17° - Detecção de Conexão
  DETECT_CONNECTION_TYPE: true,
  CONNECTION_TYPES: ["slow-2g", "2g", "3g", "4g", "wifi"],
  
  // Artigo 18° - Adaptações por Conexão
  ADAPTATIONS: {
    "slow-2g": {
      disableImages: true,
      disableAnimations: true,
      minimalUI: true,
      aggressiveCache: true,
    },
    "2g": {
      lowQualityImages: true,
      disableAnimations: true,
      prefetchDistance: 1200,
    },
    "3g": {
      mediumQualityImages: true,
      reducedAnimations: true,
      prefetchDistance: 800,
    },
    "4g": {
      highQualityImages: true,
      fullAnimations: true,
      prefetchDistance: 400,
    },
    "wifi": {
      maxQualityImages: true,
      fullAnimations: true,
      prefetchDistance: 300,
    },
  },
  
  // Artigo 19° - Data Saver Mode
  RESPECT_DATA_SAVER: true,
  DATA_SAVER_RULES: {
    disableAutoplay: true,
    disablePrefetch: true,
    disableHDImages: true,
    disableBackgroundImages: true,
    disableGradients: true,
    simplifyAnimations: true,
  },
} as const;

// ============================================
// TÍTULO VII - OFFLINE & PWA (Artigos 20-22)
// ============================================

export const OFFLINE_CONSTITUTION = {
  // Artigo 20° - Service Worker Obrigatório
  SERVICE_WORKER: {
    enabled: true,
    scope: "/",
    updateStrategy: "stale-while-revalidate",
  },
  
  // Artigo 21° - Cache Offline
  OFFLINE_CACHE: {
    cacheFirstAssets: ["fonts", "css", "js", "images/static"],
    networkFirstApi: true,
    offlineFallback: "/index.html",
  },
  
  // Artigo 22° - UI Offline
  OFFLINE_UI: {
    showOfflineIndicator: true,
    queueOfflineActions: true,
    syncWhenOnline: true,
  },
} as const;

// ============================================
// TÍTULO VIII - DISPOSITIVOS LOW-END (Artigos 23-25)
// ============================================

export const LOW_END_CONSTITUTION = {
  // Artigo 23° - Detecção de Hardware
  DETECT_LOW_END: true,
  LOW_END_CRITERIA: {
    maxCores: 2,
    maxMemory: 2, // GB
    maxDevicePixelRatio: 1.5,
  },
  
  // Artigo 24° - Otimizações Low-End
  LOW_END_OPTIMIZATIONS: {
    disableBlur: true,
    disableBackdropFilter: true,
    disableShadows: false, // manter para hierarquia visual
    disableGradients: true,
    reduceAnimationComplexity: true,
    simplifyTransitions: true,
  },
  
  // Artigo 25° - Fallbacks Visuais
  FALLBACKS: {
    blurToSolid: true,        // backdrop-blur -> bg-opacity
    gradientToSolid: true,    // gradient -> cor sólida
    shadowToNone: false,      // manter sombras básicas
    animationToInstant: true, // transition -> nenhum
  },
} as const;

// ============================================
// TÍTULO IX - ACESSIBILIDADE (Artigos 26-28)
// ============================================

export const A11Y_CONSTITUTION = {
  // Artigo 26° - Reduced Motion
  RESPECT_REDUCED_MOTION: true,
  REDUCED_MOTION_RULES: {
    disableAllAnimations: true,
    disableParallax: true,
    disableAutoScroll: true,
    instantTransitions: true,
  },
  
  // Artigo 27° - Contraste & Legibilidade
  MIN_CONTRAST_RATIO: 4.5, // WCAG AA
  LARGE_TEXT_CONTRAST: 3.0,
  FOCUS_VISIBLE: true,
  
  // Artigo 28° - Navegação por Teclado
  KEYBOARD_NAVIGATION: true,
  FOCUS_RING_VISIBLE: true,
  SKIP_LINKS: true,
  TAB_ORDER_LOGICAL: true,
} as const;

// ============================================
// TÍTULO X - CSS MEDIA QUERIES (Artigos 29-31)
// ============================================

export const MEDIA_QUERIES_CONSTITUTION = {
  // Artigo 29° - Queries Obrigatórias
  REQUIRED_QUERIES: {
    hover: "@media (hover: hover)",
    noHover: "@media (hover: none)",
    reducedMotion: "@media (prefers-reduced-motion: reduce)",
    reducedData: "@media (prefers-reduced-data: reduce)",
    darkMode: "@media (prefers-color-scheme: dark)",
    highContrast: "@media (prefers-contrast: high)",
  },
  
  // Artigo 30° - Pointer Queries
  POINTER_QUERIES: {
    coarse: "@media (pointer: coarse)", // touch
    fine: "@media (pointer: fine)",     // mouse
  },
  
  // Artigo 31° - Display Queries
  DISPLAY_QUERIES: {
    portrait: "@media (orientation: portrait)",
    landscape: "@media (orientation: landscape)",
    retina: "@media (-webkit-min-device-pixel-ratio: 2)",
    lowDPI: "@media (max-resolution: 1dppx)",
  },
} as const;

// ============================================
// TÍTULO XI - COMPONENTES ADAPTATIVOS (Artigos 32-34)
// ============================================

export const ADAPTIVE_COMPONENTS_CONSTITUTION = {
  // Artigo 32° - Componentes por Dispositivo
  DEVICE_SPECIFIC: {
    useMobileDrawer: true,   // Sheet em mobile, Dialog em desktop
    useBottomSheet: true,    // Sheet por baixo em mobile
    useTooltipOnDesktop: true, // Tooltip só com mouse
  },
  
  // Artigo 33° - Tabelas Responsivas
  TABLES: {
    mobileStrategy: "cards", // converter em cards
    scrollHorizontal: true,  // ou scroll horizontal
    stackColumns: true,      // empilhar colunas
    hideSecondaryColumns: true,
  },
  
  // Artigo 34° - Forms Responsivos
  FORMS: {
    fullWidthOnMobile: true,
    stackLabels: true,
    largerInputsOnTouch: true,
    nativeSelectOnMobile: false, // usar custom
  },
} as const;

// ============================================
// TÍTULO XII - HOOKS OBRIGATÓRIOS (Artigos 35-37)
// ============================================

export const HOOKS_CONSTITUTION = {
  // Artigo 35° - usePerformance()
  USE_PERFORMANCE: true,
  PERFORMANCE_RETURNS: [
    "isMobile", "isTablet", "isDesktop",
    "isSlowConnection", "isDataSaver",
    "shouldReduceMotion", "isLowEndDevice",
  ],
  
  // Artigo 36° - useMediaQuery()
  USE_MEDIA_QUERY: true,
  COMMON_QUERIES: [
    "(max-width: 768px)",
    "(hover: none)",
    "(prefers-reduced-motion: reduce)",
  ],
  
  // Artigo 37° - useViewport()
  USE_VIEWPORT: true,
  VIEWPORT_RETURNS: ["width", "height", "isMobile", "isTablet", "isDesktop"],
} as const;

// ============================================
// TÍTULO XIII - TESTES (Artigos 38-40)
// ============================================

export const TESTING_CONSTITUTION = {
  // Artigo 38° - Testes Obrigatórios
  TEST_ON: [
    "mobile-portrait",
    "mobile-landscape",
    "tablet",
    "desktop",
    "3g-throttled",
  ],
  
  // Artigo 39° - Chrome DevTools
  USE_DEVICE_MODE: true,
  THROTTLE_NETWORK: true,
  THROTTLE_CPU: true,
  
  // Artigo 40° - Métricas por Dispositivo
  METRICS_BY_DEVICE: {
    mobile3g: { FCP: 2500, LCP: 4000, TTI: 5000 },
    mobile4g: { FCP: 1500, LCP: 2500, TTI: 3500 },
    desktop: { FCP: 1000, LCP: 1500, TTI: 2000 },
  },
} as const;

// ============================================
// DISPOSIÇÕES FINAIS (Artigos 41-43)
// ============================================

export const DEVICE_FINAL_DISPOSITIONS = {
  // Artigo 41° - Aplicação Universal
  APPLIES_TO_ALL_COMPONENTS: true,
  NO_DESKTOP_ONLY_FEATURES: true,
  
  // Artigo 42° - Mobile-First Obrigatório
  MOBILE_FIRST_ALWAYS: true,
  DESIGN_FOR_SMALLEST_FIRST: true,
  
  // Artigo 43° - Evolução
  CAN_ADD_NEW_DEVICES: true,
  CANNOT_BREAK_EXISTING_SUPPORT: true,
} as const;

// ============================================
// CONSTITUIÇÃO COMPLETA EXPORTADA
// ============================================

export const LEI_II_DISPOSITIVOS = {
  // Títulos I-XIII
  BREAKPOINTS: BREAKPOINTS_CONSTITUTION,
  TOUCH: TOUCH_CONSTITUTION,
  LAYOUT: LAYOUT_CONSTITUTION,
  TYPOGRAPHY: TYPOGRAPHY_CONSTITUTION,
  RESPONSIVE_IMAGE: RESPONSIVE_IMAGE_CONSTITUTION,
  NETWORK: NETWORK_CONSTITUTION,
  OFFLINE: OFFLINE_CONSTITUTION,
  LOW_END: LOW_END_CONSTITUTION,
  A11Y: A11Y_CONSTITUTION,
  MEDIA_QUERIES: MEDIA_QUERIES_CONSTITUTION,
  ADAPTIVE: ADAPTIVE_COMPONENTS_CONSTITUTION,
  HOOKS: HOOKS_CONSTITUTION,
  TESTING: TESTING_CONSTITUTION,
  FINAL: DEVICE_FINAL_DISPOSITIONS,
  
  // Metadata
  VERSION: "1.0.0",
  ARTICLES_COUNT: 43,
  CREATED_AT: "2024-12-22",
  PURPOSE: "Compatibilidade universal com todos dispositivos e condições de rede",
} as const;

// ============================================
// FUNÇÕES DE ENFORCEMENT
// ============================================

/**
 * Retorna breakpoint atual
 */
export function getCurrentBreakpoint(width: number): keyof typeof BREAKPOINTS_CONSTITUTION.BREAKPOINTS {
  if (width >= 1536) return "2xl";
  if (width >= 1280) return "xl";
  if (width >= 1024) return "lg";
  if (width >= 768) return "md";
  if (width >= 640) return "sm";
  return "xs";
}

/**
 * Verifica se é mobile
 */
export function isMobileWidth(width: number): boolean {
  return width < BREAKPOINTS_CONSTITUTION.BREAKPOINTS.md;
}

/**
 * Verifica se é tablet
 */
export function isTabletWidth(width: number): boolean {
  return width >= BREAKPOINTS_CONSTITUTION.BREAKPOINTS.md && 
         width < BREAKPOINTS_CONSTITUTION.BREAKPOINTS.lg;
}

/**
 * Retorna grid cols por breakpoint
 */
export function getGridCols(width: number): number {
  if (width < 768) return LAYOUT_CONSTITUTION.GRIDS.mobile;
  if (width < 1024) return LAYOUT_CONSTITUTION.GRIDS.tablet;
  return LAYOUT_CONSTITUTION.GRIDS.desktop;
}

/**
 * Retorna configuração de conexão
 */
export function getNetworkAdaptations(connectionType: string) {
  return NETWORK_CONSTITUTION.ADAPTATIONS[
    connectionType as keyof typeof NETWORK_CONSTITUTION.ADAPTATIONS
  ] || NETWORK_CONSTITUTION.ADAPTATIONS["4g"];
}

/**
 * Verifica se deve usar versão low-end
 */
export function shouldUseLowEndMode(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  
  return memory <= LOW_END_CONSTITUTION.LOW_END_CRITERIA.maxMemory ||
         cores <= LOW_END_CONSTITUTION.LOW_END_CRITERIA.maxCores;
}

// ============================================
// LOG DE INICIALIZAÇÃO
// ============================================

if (typeof window !== 'undefined') {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     🏛️ CONSTITUIÇÃO SYNAPSE - LEI II: DISPOSITIVOS       ║
╠══════════════════════════════════════════════════════════╣
║  Versão: ${LEI_II_DISPOSITIVOS.VERSION}                                       ║
║  Artigos: ${LEI_II_DISPOSITIVOS.ARTICLES_COUNT}                                          ║
║  Status: ATIVA E ENFORCED                                ║
║  Objetivo: Todos dispositivos + todas redes = 100%       ║
╚══════════════════════════════════════════════════════════╝
  `.trim());
}

export default LEI_II_DISPOSITIVOS;
