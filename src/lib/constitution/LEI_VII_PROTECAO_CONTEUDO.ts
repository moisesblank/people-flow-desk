// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ LEI VII - CONSTITUIÇÃO DA PROTEÇÃO DE CONTEÚDO SOBERANA v1.1
// ═══════════════════════════════════════════════════════════════════════════════
// 127 Artigos | 18 Títulos | Objetivo: BLINDAGEM TOTAL DE CONTEÚDO
// DOGMA SUPREMO: CONTEÚDO PROTEGIDO = CONTEÚDO RASTREÁVEL
// ═══════════════════════════════════════════════════════════════════════════════
// v1.1 - REFATORADO: Removido código literal (strings não-executáveis)
//        Mantido apenas types, constantes e funções úteis
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO I — DEFINIÇÕES E CONSTANTES SAGRADAS (Artigos 1-8)
// ═══════════════════════════════════════════════════════════════════════════════

export const LEI_VII_VERSION = '1.1.0';
export const LEI_VII_CODENAME = 'SANCTUM_SHIELD';
export const LEI_VII_ARTICLES = 127;
export const LEI_VII_ACTIVE = true;

/** 
 * Art. 1° - OWNER SUPREMO - IMUNIDADE TOTAL 
 * @deprecated P1-2 FIX: Usar role='owner' para verificações. Email apenas para audit.
 */
export const OWNER_EMAIL = 'moisesblank@gmail.com'; // Legacy: apenas audit/log

/** Art. 2° - NÍVEIS DE PROTEÇÃO */
export type ProtectionLevel = 'OMEGA' | 'ALPHA' | 'BETA' | 'GAMMA';

/** Art. 3° - TIPOS DE CONTEÚDO PROTEGIDO */
export type ProtectedContentType = 
  | 'VIDEO' | 'PDF' | 'WEB_BOOK' | 'AUDIO' | 'IMAGE' | 'INTERACTIVE';

/** Art. 4° - TIPOS DE VIOLAÇÃO */
export type ViolationType = 
  | 'SCREENSHOT_ATTEMPT' | 'SCREEN_RECORD_ATTEMPT' | 'DEVTOOLS_OPEN'
  | 'COPY_ATTEMPT' | 'PRINT_ATTEMPT' | 'DOWNLOAD_ATTEMPT' | 'RIGHT_CLICK'
  | 'KEYBOARD_SHORTCUT' | 'LONG_PRESS' | 'GESTURE_BLOCKED' | 'AUTOMATION_DETECTED'
  | 'CONSOLE_ACCESS' | 'SCRIPT_INJECTION' | 'EXTENSION_DETECTED' | 'PIP_DETECTED'
  | 'VISIBILITY_CHANGE' | 'MULTI_TOUCH_SUSPICIOUS';

/** Art. 5° - NÍVEIS DE AMEAÇA */
export type ThreatLevel = 'NONE' | 'L1_WARNING' | 'L2_BLUR' | 'L3_LOGOUT' | 'L4_BLOCK';

/** Art. 6° - CONFIGURAÇÃO DE THRESHOLDS */
export const THREAT_THRESHOLDS = {
  L1_WARNING: 30,
  L2_BLUR: 60,
  L3_LOGOUT: 90,
  L4_BLOCK: 120,
  DECAY_RATE: 1,
  COOLDOWN_MINUTES: 15,
  BLOCK_HOURS: 24,
} as const;

/** Art. 7° - SEVERIDADE DE EVENTOS */
export const EVENT_SEVERITIES: Record<string, number> = {
  devtools_open: 25, automation_detected: 25, script_injection: 20, extension_detected: 20,
  screen_record_attempt: 15, screenshot_attempt: 15, download_attempt: 15, print_attempt: 12,
  console_access: 10, copy_attempt: 8, right_click: 5, keyboard_shortcut: 5, long_press: 5,
  gesture_blocked: 5, pip_detected: 3, visibility_change: 2, multi_touch_suspicious: 2,
} as const;

/** Art. 8° - PLATAFORMAS SUPORTADAS */
export const SUPPORTED_PLATFORMS = {
  desktop: ['windows', 'macos', 'linux', 'chromeos'],
  mobile: ['ios', 'android'],
  tablet: ['ipad', 'android_tablet'],
  browsers: ['chrome', 'firefox', 'safari', 'edge', 'opera', 'samsung', 'brave'],
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO II — PROTEÇÕES DE TECLADO (Artigos 9-18)
// ═══════════════════════════════════════════════════════════════════════════════

/** Art. 9° - ATALHOS BLOQUEADOS */
export const BLOCKED_SHORTCUTS = {
  'ctrl+s': 'Salvar página', 'cmd+s': 'Salvar página (Mac)',
  'ctrl+p': 'Imprimir', 'cmd+p': 'Imprimir (Mac)',
  'ctrl+u': 'Ver código fonte', 'cmd+u': 'Ver código fonte (Mac)',
  'f12': 'DevTools',
  'ctrl+shift+i': 'DevTools Inspector', 'cmd+opt+i': 'DevTools Inspector (Mac)',
  'ctrl+shift+j': 'DevTools Console', 'cmd+opt+j': 'DevTools Console (Mac)',
  'ctrl+shift+c': 'Element Picker', 'cmd+opt+c': 'Element Picker (Mac)',
  'ctrl+c': 'Copiar', 'cmd+c': 'Copiar (Mac)',
  'ctrl+a': 'Selecionar tudo', 'cmd+a': 'Selecionar tudo (Mac)',
  'printscreen': 'Print Screen', 'alt+printscreen': 'Print Screen janela',
  'win+printscreen': 'Print Screen Windows', 'win+shift+s': 'Snipping Tool',
  'cmd+shift+3': 'Screenshot Mac (tela)', 'cmd+shift+4': 'Screenshot Mac (área)',
  'cmd+shift+5': 'Screenshot Mac (menu)',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO III — PROTEÇÕES DE MOUSE (Artigos 19-28)
// ═══════════════════════════════════════════════════════════════════════════════

/** Art. 19° - EVENTOS DE MOUSE BLOQUEADOS */
export const BLOCKED_MOUSE_EVENTS = [
  'contextmenu', 'selectstart', 'dragstart', 'drop', 'copy', 'cut', 'paste',
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO IV — PROTEÇÕES TOUCH/MOBILE (Artigos 29-42)
// ═══════════════════════════════════════════════════════════════════════════════

/** Art. 29° - CONFIGURAÇÃO TOUCH */
export const BLOCKED_TOUCH_EVENTS = {
  longPress: { threshold: 500, action: 'prevent_menu' },
  multiTouch: { fingers: 3, action: 'detect_screenshot' },
  gesture: { types: ['gesturestart', 'gesturechange', 'gestureend'], action: 'prevent_all' },
  pinchZoom: { action: 'prevent_zoom', exception: 'accessibility' },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO V — DETECÇÃO DE DEVTOOLS (Artigos 43-52)
// ═══════════════════════════════════════════════════════════════════════════════

/** Art. 43° - MÉTODOS DE DETECÇÃO */
export const DEVTOOLS_DETECTION_METHODS = {
  dimensionCheck: { threshold: 160, interval: 1000 },
  debuggerTiming: { threshold: 100, interval: 2000 },
  consoleOverride: { enabled: true },
  firebugCheck: { enabled: true },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO VI — PROTEÇÃO DE SCREENSHOT/GRAVAÇÃO (Artigos 53-65)
// ═══════════════════════════════════════════════════════════════════════════════

/** Art. 53° - NÍVEIS DE PROTEÇÃO */
export const CAPTURE_PROTECTION_LEVELS = {
  software: { detection: 'partial', response: 'blur_and_log' },
  hardware: { detection: 'impossible', response: 'watermark_forensic' },
  extensions: { detection: 'active', response: 'block_and_log' },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO VII — MARCA D'ÁGUA FORENSE (Artigos 66-78)
// ═══════════════════════════════════════════════════════════════════════════════

/** Art. 66° - REQUISITOS DA MARCA D'ÁGUA */
export const WATERMARK_REQUIREMENTS = {
  content: {
    userName: true, userEmail: true, userId: true,
    sessionId: true, timestamp: true, cpf: 'masked' as const,
  },
  appearance: {
    opacity: { normal: 0.08, threat: 0.25 },
    rotation: -25,
    fontSize: { desktop: 14, tablet: 12, mobile: 10 },
    color: 'rgba(255,255,255,0.15)',
  },
  grid: {
    desktop: { rows: 12, cols: 3 },
    tablet: { rows: 10, cols: 3 },
    mobile: { rows: 6, cols: 2 },
  },
  update: { interval: 15000, includeTimestamp: true },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO VIII — PROTEÇÃO DE VÍDEO (Artigos 79-88)
// ═══════════════════════════════════════════════════════════════════════════════

/** Art. 79° - REQUISITOS DE PROTEÇÃO DE VÍDEO */
export const VIDEO_PROTECTION_REQUIREMENTS = {
  signedUrls: { enabled: true, expiration: 3600, regenerateOnExpiry: true },
  player: { disableRightClick: true, disableControls: ['download', 'pip'], customControls: true },
  drm: { widevine: 'optional', fairplay: 'optional', playready: 'optional' },
  watermark: { overlay: true, position: 'dynamic', interval: 30000 },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO IX — PROTEÇÃO DE PDF/LIVROS (Artigos 89-98)
// ═══════════════════════════════════════════════════════════════════════════════

/** Art. 89° - REQUISITOS PDF */
export const PDF_PROTECTION_REQUIREMENTS = {
  rendering: { useCanvas: true, disableTextLayer: true, disableCopy: true },
  watermark: { onEveryPage: true, dynamic: true, includeUserInfo: true },
  blockedControls: ['download', 'print', 'save', 'share'],
  signedUrls: { perPage: true, expiration: 300 },
} as const;

/** Art. 94° - REQUISITOS LIVROS WEB */
export const WEB_BOOK_PROTECTION_REQUIREMENTS = {
  images: { signedUrls: true, expiration: 300, lazyLoad: true, blurOnThreat: true },
  readingSession: { trackPages: true, trackTime: true, heartbeat: 30000, maxInactive: 300000 },
  violations: { logToDatabase: true, includeContext: true, includeFingerprint: true },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO X — SISTEMA DE THREAT SCORE (Artigos 99-108)
// ═══════════════════════════════════════════════════════════════════════════════

/** Art. 99° - FUNCIONAMENTO DO THREAT SCORE */
export const THREAT_SCORE_SYSTEM = {
  accumulation: { perViolation: true, maxScore: 200 },
  decay: { rate: 1, minScore: 0, activeOnlyWhenVisible: true },
  responses: {
    L1_WARNING: { action: 'toast_warning', message: 'Comportamento suspeito detectado' },
    L2_BLUR: { action: 'blur_content', duration: 5000, intensity: 10 },
    L3_LOGOUT: { action: 'force_logout', cooldown: 900 },
    L4_BLOCK: { action: 'block_access', duration: 86400 },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO XI — FINGERPRINTING (Artigos 109-115)
// ═══════════════════════════════════════════════════════════════════════════════

/** Art. 109° - COMPONENTES DO FINGERPRINT */
export const FINGERPRINT_COMPONENTS = {
  collected: [
    'userAgent', 'language', 'colorDepth', 'screenResolution', 'timezone',
    'platform', 'hardwareConcurrency', 'deviceMemory', 'canvas', 'webgl',
    'audio', 'fonts', 'plugins', 'touchSupport',
  ],
  hashing: { algorithm: 'SHA-256', salt: 'sanctum-shield-v1' },
  storage: { localStorage: true, indexedDB: true, sessionStorage: true },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO XII — DETECÇÃO DE AUTOMAÇÃO (Artigos 116-120)
// ═══════════════════════════════════════════════════════════════════════════════

/** Art. 116° - SINAIS DE AUTOMAÇÃO */
export const AUTOMATION_SIGNALS = {
  webdriver: [
    'navigator.webdriver', 'window.callPhantom', 'window._phantom',
    'window.__nightmare', 'window.domAutomation', 'window.domAutomationController',
  ],
  testing: ['window.Cypress', 'window.__coverage__', 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__'],
  headless: { checkPlugins: true, checkLanguages: true, checkWebGL: true },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO XIII — LOGGING E AUDITORIA (Artigos 121-127)
// ═══════════════════════════════════════════════════════════════════════════════

/** Art. 121° - EVENTOS REGISTRADOS */
export const LOGGED_EVENTS = {
  structure: {
    id: 'UUID', event_type: 'ViolationType', user_id: 'UUID', user_email: 'string',
    user_name: 'string', session_id: 'string', device_fingerprint: 'string',
    ip_hash: 'string', user_agent: 'string', metadata: 'JSON',
    threat_score: 'number', is_violation: 'boolean', created_at: 'timestamp',
  },
  tables: ['security_events', 'book_access_logs', 'video_access_logs', 'threat_events', 'active_sessions'],
  retention: { violations: 365, access: 90, sessions: 30 },
} as const;

/** Art. 126° - BYPASS DO OWNER */
export const OWNER_BYPASS = {
  email: OWNER_EMAIL,
  capabilities: [
    'bypass_all_protections', 'view_all_logs', 'reset_threat_scores',
    'manage_sessions', 'impersonate_users',
  ],
} as const;

/** Art. 127° - DISPOSIÇÕES FINAIS */
export const FINAL_PROVISIONS = {
  version: LEI_VII_VERSION,
  codename: LEI_VII_CODENAME,
  articles: LEI_VII_ARTICLES,
  status: 'VIGENTE',
  effectiveDate: '2024-12-24',
  hash: 'LEI_VII_PROTECAO_CONTEUDO_v1.1_SANCTUM_SHIELD',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE VERIFICAÇÃO E STATUS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @deprecated P1-2 FIX: Use isOwnerByRole() para verificação segura
 * Esta função existe apenas para bypass de UX (proteções de conteúdo)
 * A autorização REAL deve vir do banco via user_roles.role='owner'
 */
export const isOwner = (email?: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
};

/**
 * ✅ Verificação segura de owner via role (preferir esta)
 */
export const isOwnerByRole = (role?: string | null): boolean => {
  return role === 'owner';
};

/** Retorna o status completo da LEI VII */
export const getLeiVIIStatus = () => ({
  active: LEI_VII_ACTIVE,
  version: LEI_VII_VERSION,
  codename: LEI_VII_CODENAME,
  articles: LEI_VII_ARTICLES,
  protections: {
    keyboard: Object.keys(BLOCKED_SHORTCUTS).length,
    mouse: BLOCKED_MOUSE_EVENTS.length,
    touch: Object.keys(BLOCKED_TOUCH_EVENTS).length,
    devtools: Object.keys(DEVTOOLS_DETECTION_METHODS).length,
    threatLevels: Object.keys(THREAT_THRESHOLDS).length,
    fingerprint: FINGERPRINT_COMPONENTS.collected.length,
    automationSignals: AUTOMATION_SIGNALS.webdriver.length + AUTOMATION_SIGNALS.testing.length,
  },
  owner: OWNER_EMAIL,
  ownerImmune: true,
});

/** Log do status da LEI VII no console */
export const logLeiVIIStatus = (): void => {
  const status = getLeiVIIStatus();
  console.log(`
═══════════════════════════════════════════════════════════════
🛡️ LEI VII - CONSTITUIÇÃO DA PROTEÇÃO DE CONTEÚDO SOBERANA
═══════════════════════════════════════════════════════════════
📋 Versão: ${status.version} (${status.codename})
📊 Artigos: ${status.articles}
✅ Status: ${status.active ? 'ATIVA' : 'INATIVA'}
🔒 Proteções: ${Object.values(status.protections).reduce((a, b) => a + b, 0)} regras
👑 OWNER: ${status.owner} (IMUNE)
═══════════════════════════════════════════════════════════════
  `);
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  VERSION: LEI_VII_VERSION,
  CODENAME: LEI_VII_CODENAME,
  ARTICLES: LEI_VII_ARTICLES,
  ACTIVE: LEI_VII_ACTIVE,
  OWNER_EMAIL,
  THREAT_THRESHOLDS,
  EVENT_SEVERITIES,
  SUPPORTED_PLATFORMS,
  BLOCKED_SHORTCUTS,
  BLOCKED_MOUSE_EVENTS,
  BLOCKED_TOUCH_EVENTS,
  DEVTOOLS_DETECTION_METHODS,
  CAPTURE_PROTECTION_LEVELS,
  WATERMARK_REQUIREMENTS,
  VIDEO_PROTECTION_REQUIREMENTS,
  PDF_PROTECTION_REQUIREMENTS,
  WEB_BOOK_PROTECTION_REQUIREMENTS,
  THREAT_SCORE_SYSTEM,
  FINGERPRINT_COMPONENTS,
  AUTOMATION_SIGNALS,
  LOGGED_EVENTS,
  OWNER_BYPASS,
  FINAL_PROVISIONS,
  isOwner,
  getLeiVIIStatus,
  logLeiVIIStatus,
};
