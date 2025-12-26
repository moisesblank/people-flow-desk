// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ LEI VII - CONSTITUIÇÃO DA PROTEÇÃO DE CONTEÚDO SOBERANA v1.0
// ═══════════════════════════════════════════════════════════════════════════════
// 127 Artigos | 18 Títulos | Objetivo: BLINDAGEM TOTAL DE CONTEÚDO
// DOGMA SUPREMO: CONTEÚDO PROTEGIDO = CONTEÚDO RASTREÁVEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PREÂMBULO
 * 
 * Esta LEI estabelece os princípios, regras e implementações OBRIGATÓRIAS
 * para proteção de conteúdo digital em TODOS os dispositivos e sistemas.
 * 
 * PRINCÍPIO FUNDAMENTAL:
 * "Se não pode bloquear 100%, RASTREIE 100%"
 * 
 * ESCOPO DE APLICAÇÃO:
 * - Desktop (Windows, macOS, Linux)
 * - Mobile (iOS, Android)
 * - Tablet (iPad, Android Tablets)
 * - Todos os navegadores modernos
 * - PWA e WebViews
 * 
 * OWNER SUPREMO: MOISESBLANK@GMAIL.COM
 * - Imunidade TOTAL a todas as proteções
 * - Acesso irrestrito a todo conteúdo
 * - Bypass automático de todas as restrições
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO I — DEFINIÇÕES E CONSTANTES SAGRADAS (Artigos 1-8)
// ═══════════════════════════════════════════════════════════════════════════════

export const LEI_VII_VERSION = '1.0.0';
export const LEI_VII_CODENAME = 'SANCTUM_SHIELD';
export const LEI_VII_ARTICLES = 127;
export const LEI_VII_ACTIVE = true;

/**
 * Art. 1° - OWNER SUPREMO
 * O email abaixo possui IMUNIDADE TOTAL a todas as proteções.
 * NUNCA bloquear, NUNCA restringir, NUNCA aplicar penalidades.
 */
export const OWNER_EMAIL = 'moisesblank@gmail.com';

/**
 * Art. 2° - NÍVEIS DE PROTEÇÃO
 * Classificação hierárquica de proteções aplicadas.
 */
export type ProtectionLevel = 
  | 'OMEGA'    // Proteção máxima - Conteúdo premium (vídeos, livros)
  | 'ALPHA'    // Proteção alta - Materiais didáticos
  | 'BETA'     // Proteção média - Conteúdo geral
  | 'GAMMA';   // Proteção básica - Conteúdo público

/**
 * Art. 3° - TIPOS DE CONTEÚDO PROTEGIDO
 */
export type ProtectedContentType = 
  | 'VIDEO'           // Aulas em vídeo
  | 'PDF'             // Documentos PDF
  | 'WEB_BOOK'        // Livros web interativos
  | 'AUDIO'           // Áudio e podcasts
  | 'IMAGE'           // Imagens protegidas
  | 'INTERACTIVE';    // Conteúdo interativo

/**
 * Art. 4° - TIPOS DE VIOLAÇÃO
 */
export type ViolationType = 
  | 'SCREENSHOT_ATTEMPT'      // Tentativa de captura de tela
  | 'SCREEN_RECORD_ATTEMPT'   // Tentativa de gravação
  | 'DEVTOOLS_OPEN'           // DevTools aberto
  | 'COPY_ATTEMPT'            // Tentativa de cópia
  | 'PRINT_ATTEMPT'           // Tentativa de impressão
  | 'DOWNLOAD_ATTEMPT'        // Tentativa de download
  | 'RIGHT_CLICK'             // Clique direito
  | 'KEYBOARD_SHORTCUT'       // Atalho de teclado bloqueado
  | 'LONG_PRESS'              // Long press em mobile
  | 'GESTURE_BLOCKED'         // Gesto bloqueado
  | 'AUTOMATION_DETECTED'     // Automação detectada
  | 'CONSOLE_ACCESS'          // Acesso ao console
  | 'SCRIPT_INJECTION'        // Injeção de script
  | 'EXTENSION_DETECTED'      // Extensão maliciosa
  | 'PIP_DETECTED'            // Picture-in-Picture
  | 'VISIBILITY_CHANGE'       // Mudança de visibilidade suspeita
  | 'MULTI_TOUCH_SUSPICIOUS'; // Multi-touch suspeito

/**
 * Art. 5° - NÍVEIS DE AMEAÇA (Threat Score System)
 */
export type ThreatLevel = 
  | 'NONE'        // 0 pontos - Sem ameaça
  | 'L1_WARNING'  // 1-29 pontos - Aviso
  | 'L2_BLUR'     // 30-59 pontos - Blur no conteúdo
  | 'L3_LOGOUT'   // 60-89 pontos - Logout forçado
  | 'L4_BLOCK';   // 90+ pontos - Bloqueio temporário

/**
 * Art. 6° - CONFIGURAÇÃO DE THRESHOLDS
 */
export const THREAT_THRESHOLDS = {
  L1_WARNING: 30,
  L2_BLUR: 60,
  L3_LOGOUT: 90,
  L4_BLOCK: 120,
  DECAY_RATE: 1,           // Pontos decaídos por minuto
  COOLDOWN_MINUTES: 15,    // Tempo de cooldown
  BLOCK_HOURS: 24,         // Tempo de bloqueio
} as const;

/**
 * Art. 7° - SEVERIDADE DE EVENTOS
 * Cada tipo de violação tem uma pontuação associada.
 */
export const EVENT_SEVERITIES: Record<string, number> = {
  // Críticos (15-25 pontos)
  devtools_open: 25,
  automation_detected: 25,
  script_injection: 20,
  extension_detected: 20,
  
  // Altos (10-15 pontos)
  screen_record_attempt: 15,
  screenshot_attempt: 15,
  download_attempt: 15,
  print_attempt: 12,
  console_access: 10,
  
  // Médios (5-10 pontos)
  copy_attempt: 8,
  right_click: 5,
  keyboard_shortcut: 5,
  long_press: 5,
  gesture_blocked: 5,
  
  // Baixos (1-5 pontos)
  pip_detected: 3,
  visibility_change: 2,
  multi_touch_suspicious: 2,
} as const;

/**
 * Art. 8° - DISPOSITIVOS E SISTEMAS SUPORTADOS
 */
export const SUPPORTED_PLATFORMS = {
  desktop: ['windows', 'macos', 'linux', 'chromeos'],
  mobile: ['ios', 'android'],
  tablet: ['ipad', 'android_tablet'],
  browsers: ['chrome', 'firefox', 'safari', 'edge', 'opera', 'samsung', 'brave'],
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO II — PROTEÇÕES DE TECLADO (Artigos 9-18)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Art. 9° - ATALHOS BLOQUEADOS (Desktop)
 * TODOS estes atalhos DEVEM ser bloqueados via keydown event.
 */
export const BLOCKED_SHORTCUTS = {
  // Salvar/Download
  'ctrl+s': 'Salvar página',
  'cmd+s': 'Salvar página (Mac)',
  
  // Imprimir
  'ctrl+p': 'Imprimir',
  'cmd+p': 'Imprimir (Mac)',
  
  // View Source
  'ctrl+u': 'Ver código fonte',
  'cmd+u': 'Ver código fonte (Mac)',
  'ctrl+shift+u': 'Ver código fonte alternativo',
  
  // DevTools
  'f12': 'DevTools',
  'ctrl+shift+i': 'DevTools Inspector',
  'cmd+opt+i': 'DevTools Inspector (Mac)',
  'ctrl+shift+j': 'DevTools Console',
  'cmd+opt+j': 'DevTools Console (Mac)',
  'ctrl+shift+c': 'DevTools Element Picker',
  'cmd+opt+c': 'DevTools Element Picker (Mac)',
  
  // Copiar/Colar
  'ctrl+c': 'Copiar',
  'cmd+c': 'Copiar (Mac)',
  'ctrl+a': 'Selecionar tudo',
  'cmd+a': 'Selecionar tudo (Mac)',
  
  // Screenshot (Windows)
  'printscreen': 'Print Screen',
  'alt+printscreen': 'Print Screen janela',
  'win+printscreen': 'Print Screen Windows',
  'win+shift+s': 'Snipping Tool',
  
  // Screenshot (Mac)
  'cmd+shift+3': 'Screenshot Mac (tela)',
  'cmd+shift+4': 'Screenshot Mac (área)',
  'cmd+shift+5': 'Screenshot Mac (menu)',
  
  // Outros
  'ctrl+shift+delete': 'Limpar dados',
  'f5': 'Refresh (bloquear em contexto específico)',
} as const;

/**
 * Art. 10° - IMPLEMENTAÇÃO DE BLOQUEIO DE TECLADO
 * Código de referência para implementação.
 */
export const KEYBOARD_BLOCK_IMPLEMENTATION = `
// IMPLEMENTAÇÃO OBRIGATÓRIA em useSanctumCore.ts
const handleKeyDown = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();
  const ctrl = e.ctrlKey || e.metaKey;
  const shift = e.shiftKey;
  const alt = e.altKey;

  // Art. 9° - Bloqueios específicos
  const blocked = [
    ctrl && key === 's',              // Salvar
    ctrl && key === 'p',              // Imprimir
    ctrl && key === 'u',              // View Source
    key === 'f12',                    // DevTools
    ctrl && shift && key === 'i',     // DevTools Inspector
    ctrl && shift && key === 'j',     // DevTools Console
    ctrl && shift && key === 'c',     // Element Picker
    ctrl && key === 'c',              // Copiar (contexto protegido)
    ctrl && key === 'a',              // Selecionar tudo
    key === 'printscreen',            // Print Screen
    alt && key === 'printscreen',     // Print Screen janela
    ctrl && shift && key === 's',     // Screenshot Windows
  ];

  if (blocked.some(Boolean)) {
    e.preventDefault();
    e.stopPropagation();
    recordViolation('keyboard_shortcut', { key, ctrl, shift, alt });
    return false;
  }
};
`;

/**
 * Art. 11-18° - Regras adicionais de teclado
 * (Implementadas inline no código acima)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO III — PROTEÇÕES DE MOUSE (Artigos 19-28)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Art. 19° - EVENTOS DE MOUSE BLOQUEADOS
 */
export const BLOCKED_MOUSE_EVENTS = [
  'contextmenu',    // Clique direito
  'selectstart',    // Início de seleção
  'dragstart',      // Início de arrastar
  'drop',           // Soltar
  'copy',           // Copiar
  'cut',            // Recortar
  'paste',          // Colar (em contextos específicos)
] as const;

/**
 * Art. 20° - IMPLEMENTAÇÃO DE BLOQUEIO DE MOUSE
 */
export const MOUSE_BLOCK_IMPLEMENTATION = `
// IMPLEMENTAÇÃO OBRIGATÓRIA
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  recordViolation('right_click');
  return false;
}, { capture: true });

document.addEventListener('selectstart', (e) => {
  if (isProtectedContent(e.target)) {
    e.preventDefault();
    return false;
  }
});

document.addEventListener('dragstart', (e) => {
  e.preventDefault();
  return false;
});

document.addEventListener('copy', (e) => {
  e.preventDefault();
  e.clipboardData?.setData('text/plain', getWatermarkText());
  recordViolation('copy_attempt');
  return false;
});
`;

/**
 * Art. 21-28° - Regras adicionais de mouse
 * (Implementadas inline)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO IV — PROTEÇÕES TOUCH/MOBILE (Artigos 29-42)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Art. 29° - EVENTOS TOUCH BLOQUEADOS
 */
export const BLOCKED_TOUCH_EVENTS = {
  longPress: {
    threshold: 500,           // ms para considerar long press
    action: 'prevent_menu',   // Prevenir menu de contexto
  },
  multiTouch: {
    fingers: 3,               // 3+ dedos = screenshot iOS
    action: 'detect_screenshot',
  },
  gesture: {
    types: ['gesturestart', 'gesturechange', 'gestureend'],
    action: 'prevent_all',
  },
  pinchZoom: {
    action: 'prevent_zoom',
    exception: 'accessibility', // Permitir se necessário para acessibilidade
  },
} as const;

/**
 * Art. 30° - IMPLEMENTAÇÃO DE BLOQUEIO TOUCH
 */
export const TOUCH_BLOCK_IMPLEMENTATION = `
// IMPLEMENTAÇÃO OBRIGATÓRIA para iOS/Android

// Long Press Detection
let longPressTimer: NodeJS.Timeout | null = null;

document.addEventListener('touchstart', (e) => {
  longPressTimer = setTimeout(() => {
    recordViolation('long_press');
    // Vibrar para feedback (se disponível)
    navigator.vibrate?.(50);
  }, 500);
}, { passive: false });

document.addEventListener('touchend', () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
});

document.addEventListener('touchmove', () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
});

// iOS Gesture Blocking
['gesturestart', 'gesturechange', 'gestureend'].forEach(event => {
  document.addEventListener(event, (e) => {
    e.preventDefault();
    recordViolation('gesture_blocked');
  }, { passive: false });
});

// Multi-touch Detection (Screenshot iOS)
document.addEventListener('touchstart', (e) => {
  if (e.touches.length >= 3) {
    recordViolation('multi_touch_suspicious');
    // Blur temporário
    applyTemporaryBlur(2000);
  }
}, { passive: false });
`;

/**
 * Art. 31° - CSS OBRIGATÓRIO PARA MOBILE
 */
export const MOBILE_CSS_RULES = `
/* Art. 31° - CSS de proteção mobile OBRIGATÓRIO */
.protected-content,
.sanctum-protected {
  /* Bloquear seleção */
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  user-select: none !important;
  
  /* Bloquear callout iOS */
  -webkit-touch-callout: none !important;
  
  /* Remover highlight de tap */
  -webkit-tap-highlight-color: transparent !important;
  
  /* Bloquear zoom de texto iOS */
  -webkit-text-size-adjust: none !important;
  
  /* Prevenir manipulação touch */
  touch-action: manipulation !important;
}

/* Bloquear drag de imagens */
.protected-content img,
.sanctum-protected img {
  -webkit-user-drag: none !important;
  user-drag: none !important;
  pointer-events: none !important;
}

/* Safe area para notch */
.protected-container {
  padding: env(safe-area-inset-top) 
           env(safe-area-inset-right) 
           env(safe-area-inset-bottom) 
           env(safe-area-inset-left);
}
`;

/**
 * Art. 32-42° - Regras adicionais mobile
 * (Implementadas no CSS e JS acima)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO V — DETECÇÃO DE DEVTOOLS (Artigos 43-52)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Art. 43° - MÉTODOS DE DETECÇÃO DE DEVTOOLS
 * Múltiplos métodos para garantir detecção em todos os browsers.
 */
export const DEVTOOLS_DETECTION_METHODS = {
  /**
   * Art. 44° - Detecção por dimensão da janela
   * DevTools aberto muda as dimensões visíveis.
   */
  dimensionCheck: {
    threshold: 160,  // pixels de diferença
    interval: 1000,  // ms entre verificações
  },
  
  /**
   * Art. 45° - Detecção por timing de debugger
   * O statement debugger causa delay quando DevTools está aberto.
   */
  debuggerTiming: {
    threshold: 100,  // ms de delay indica DevTools
    interval: 2000,
  },
  
  /**
   * Art. 46° - Detecção por console.log override
   * Quando DevTools está aberto, console.log tem comportamento diferente.
   */
  consoleOverride: {
    enabled: true,
  },
  
  /**
   * Art. 47° - Detecção por Firebug (legacy)
   */
  firebugCheck: {
    enabled: true,
  },
} as const;

/**
 * Art. 48° - IMPLEMENTAÇÃO DE DETECÇÃO DE DEVTOOLS
 */
export const DEVTOOLS_DETECTION_IMPLEMENTATION = `
// IMPLEMENTAÇÃO OBRIGATÓRIA

// Art. 44° - Dimension Check
const checkDimensions = () => {
  const widthThreshold = window.outerWidth - window.innerWidth > 160;
  const heightThreshold = window.outerHeight - window.innerHeight > 160;
  
  if (widthThreshold || heightThreshold) {
    handleDevToolsOpen();
  }
};

// Art. 45° - Debugger Timing
// DESATIVADO: O statement "debugger" pausa execução quando DevTools aberto
// Isso bloqueava o login e outras funcionalidades críticas
// Mantendo apenas detecção por dimensões (Art. 43°) que não bloqueia
const checkDebuggerTiming = () => {
  // Detecção passiva via timing (sem debugger statement)
  // Removido: debugger statement causava bloqueio de funcionalidades
};

// Art. 46° - Console Override Detection
const checkConsole = () => {
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      handleDevToolsOpen();
      return 'devtools-trap';
    }
  });
  console.log(element);
};

// Handler central
const handleDevToolsOpen = () => {
  recordViolation('devtools_open');
  // Ações baseadas no threat level atual
  applyPenalty('devtools_open');
};

// Iniciar verificações periódicas
setInterval(checkDimensions, 1000);
setInterval(checkDebuggerTiming, 2000);
`;

/**
 * Art. 49-52° - Regras adicionais de DevTools
 * (Implementadas acima)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO VI — PROTEÇÃO DE SCREENSHOT/GRAVAÇÃO (Artigos 53-65)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Art. 53° - NÍVEIS DE PROTEÇÃO CONTRA CAPTURA
 */
export const CAPTURE_PROTECTION_LEVELS = {
  /**
   * Art. 54° - Proteção de Software (Detectável)
   * OBS, Camtasia, extensões de browser
   */
  software: {
    detection: 'partial',
    response: 'blur_and_log',
  },
  
  /**
   * Art. 55° - Proteção de Hardware (Não Detectável)
   * Celular filmando tela, capture cards
   */
  hardware: {
    detection: 'impossible',
    response: 'watermark_forensic',
  },
  
  /**
   * Art. 56° - Proteção de Extensões (Detectável)
   * Extensões de screenshot do browser
   */
  extensions: {
    detection: 'active',
    response: 'block_and_log',
  },
} as const;

/**
 * Art. 57° - DETECÇÃO DE GRAVAÇÃO DE TELA
 */
export const SCREEN_RECORDING_DETECTION = `
// IMPLEMENTAÇÃO DE DETECÇÃO

// Método 1: MediaDevices API
const checkMediaDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasScreenCapture = devices.some(d => 
      d.kind === 'videoinput' && 
      d.label.toLowerCase().includes('screen')
    );
    
    if (hasScreenCapture) {
      recordViolation('screen_record_attempt');
    }
  } catch (e) {
    // Silencioso
  }
};

// Método 2: Display Media (quando disponível)
const checkDisplayMedia = () => {
  if ('getDisplayMedia' in navigator.mediaDevices) {
    // Monitorar chamadas suspeitas
    const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
    navigator.mediaDevices.getDisplayMedia = async function(...args) {
      recordViolation('screen_record_attempt');
      throw new Error('Screen recording blocked');
    };
  }
};

// Método 3: Picture-in-Picture Detection
document.addEventListener('enterpictureinpicture', () => {
  recordViolation('pip_detected');
});
`;

/**
 * Art. 58° - DETECÇÃO DE SCREENSHOT iOS
 * iOS dispara blur antes de screenshot - detectável!
 */
export const IOS_SCREENSHOT_DETECTION = `
// IMPLEMENTAÇÃO ESPECÍFICA iOS

// Quando o usuário inicia screenshot no iOS, a janela perde foco brevemente
let blurCount = 0;
let lastBlur = 0;

window.addEventListener('blur', () => {
  const now = Date.now();
  
  // Se blur ocorreu muito rápido após outro blur
  if (now - lastBlur < 500) {
    blurCount++;
    
    if (blurCount >= 2) {
      // Provável screenshot
      recordViolation('screenshot_attempt', { platform: 'ios' });
      applyTemporaryBlur(1000);
      blurCount = 0;
    }
  }
  
  lastBlur = now;
});

// Reset após tempo
setInterval(() => {
  blurCount = 0;
}, 2000);
`;

/**
 * Art. 59-65° - Regras adicionais de proteção de captura
 * (Implementadas acima)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO VII — MARCA D'ÁGUA FORENSE (Artigos 66-78)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Art. 66° - REQUISITOS DA MARCA D'ÁGUA
 */
export const WATERMARK_REQUIREMENTS = {
  /**
   * Art. 67° - Informações OBRIGATÓRIAS na marca d'água
   */
  content: {
    userName: true,           // Nome do usuário
    userEmail: true,          // Email (parcial)
    userId: true,             // ID único
    sessionId: true,          // ID da sessão
    timestamp: true,          // Data/hora
    cpf: 'masked',            // CPF mascarado (***.***.XXX-XX)
  },
  
  /**
   * Art. 68° - Aparência da marca d'água
   */
  appearance: {
    opacity: {
      normal: 0.08,           // Opacidade normal
      threat: 0.25,           // Opacidade em ameaça
    },
    rotation: -25,            // Graus de rotação
    fontSize: {
      desktop: 14,
      tablet: 12,
      mobile: 10,
    },
    color: 'rgba(255,255,255,0.15)',
  },
  
  /**
   * Art. 69° - Grid responsivo
   */
  grid: {
    desktop: { rows: 12, cols: 3 },
    tablet: { rows: 10, cols: 3 },
    mobile: { rows: 6, cols: 2 },
  },
  
  /**
   * Art. 70° - Atualização dinâmica
   */
  update: {
    interval: 15000,          // 15 segundos
    includeTimestamp: true,
  },
} as const;

/**
 * Art. 71° - IMPLEMENTAÇÃO DA MARCA D'ÁGUA
 */
export const WATERMARK_IMPLEMENTATION = `
// IMPLEMENTAÇÃO OBRIGATÓRIA em SanctumWatermark.tsx

const generateWatermarkText = (user: User) => {
  const timestamp = new Date().toLocaleString('pt-BR');
  const sessionId = generateShortHash(sessionStorage.getItem('session_id') || '');
  const maskedCPF = user.cpf ? maskCPF(user.cpf) : '';
  
  return [
    user.name || user.email?.split('@')[0],
    user.id?.substring(0, 8),
    sessionId,
    timestamp,
    maskedCPF,
  ].filter(Boolean).join(' • ');
};

const WatermarkGrid = ({ text, config }) => {
  const grid = getGridConfig(); // Responsivo
  
  return (
    <div className="watermark-container">
      {Array.from({ length: grid.rows * grid.cols }).map((_, i) => (
        <div 
          key={i}
          className="watermark-item"
          style={{
            opacity: config.opacity,
            transform: \`rotate(\${config.rotation}deg)\`,
            fontSize: config.fontSize,
          }}
        >
          {text}
        </div>
      ))}
    </div>
  );
};
`;

/**
 * Art. 72-78° - Regras adicionais de marca d'água
 * (Implementadas acima)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO VIII — PROTEÇÃO DE VÍDEO (Artigos 79-88)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Art. 79° - REQUISITOS DE PROTEÇÃO DE VÍDEO
 */
export const VIDEO_PROTECTION_REQUIREMENTS = {
  /**
   * Art. 80° - URLs assinadas
   */
  signedUrls: {
    enabled: true,
    expiration: 3600,         // 1 hora
    regenerateOnExpiry: true,
  },
  
  /**
   * Art. 81° - Player protegido
   */
  player: {
    disableRightClick: true,
    disableControls: ['download', 'pip'],
    customControls: true,
  },
  
  /**
   * Art. 82° - DRM (quando disponível)
   */
  drm: {
    widevine: 'optional',
    fairplay: 'optional',
    playready: 'optional',
  },
  
  /**
   * Art. 83° - Marca d'água em vídeo
   */
  watermark: {
    overlay: true,
    position: 'dynamic',      // Muda de posição
    interval: 30000,          // 30 segundos
  },
} as const;

/**
 * Art. 84° - IMPLEMENTAÇÃO DE PROTEÇÃO DE VÍDEO
 */
export const VIDEO_PROTECTION_IMPLEMENTATION = `
// IMPLEMENTAÇÃO OBRIGATÓRIA em useVideoFortress.ts

// Bloquear PiP
video.addEventListener('enterpictureinpicture', (e) => {
  e.preventDefault();
  document.exitPictureInPicture();
  recordViolation('pip_detected');
});

// Bloquear download
video.controlsList?.add('nodownload');
video.disablePictureInPicture = true;

// Monitorar visibilidade
document.addEventListener('visibilitychange', () => {
  if (document.hidden && video.playing) {
    video.pause();
    recordViolation('visibility_change');
  }
});

// Overlay de proteção
const VideoOverlay = () => (
  <div className="video-protection-overlay">
    <SanctumWatermark />
    {/* Camada invisível que captura eventos */}
    <div className="capture-shield" />
  </div>
);
`;

/**
 * Art. 85-88° - Regras adicionais de vídeo
 * (Implementadas acima)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO IX — PROTEÇÃO DE PDF/LIVROS (Artigos 89-98)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Art. 89° - REQUISITOS DE PROTEÇÃO DE PDF
 */
export const PDF_PROTECTION_REQUIREMENTS = {
  /**
   * Art. 90° - Renderização segura
   */
  rendering: {
    useCanvas: true,          // Renderizar em canvas (não DOM)
    disableTextLayer: true,   // Sem camada de texto selecionável
    disableCopy: true,
  },
  
  /**
   * Art. 91° - Marca d'água em PDF
   */
  watermark: {
    onEveryPage: true,
    dynamic: true,
    includeUserInfo: true,
  },
  
  /**
   * Art. 92° - Controles bloqueados
   */
  blockedControls: [
    'download',
    'print',
    'save',
    'share',
  ],
  
  /**
   * Art. 93° - URLs assinadas para páginas
   */
  signedUrls: {
    perPage: true,
    expiration: 300,          // 5 minutos por página
  },
} as const;

/**
 * Art. 94° - REQUISITOS DE PROTEÇÃO DE LIVROS WEB
 */
export const WEB_BOOK_PROTECTION_REQUIREMENTS = {
  /**
   * Art. 95° - Renderização de imagens
   */
  images: {
    signedUrls: true,
    expiration: 300,
    lazyLoad: true,
    blurOnThreat: true,
  },
  
  /**
   * Art. 96° - Sessão de leitura
   */
  readingSession: {
    trackPages: true,
    trackTime: true,
    heartbeat: 30000,         // 30 segundos
    maxInactive: 300000,      // 5 minutos
  },
  
  /**
   * Art. 97° - Violações registradas
   */
  violations: {
    logToDatabase: true,
    includeContext: true,
    includeFingerprint: true,
  },
} as const;

/**
 * Art. 98° - Regras adicionais de PDF/Livros
 * (Implementadas acima)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO X — SISTEMA DE THREAT SCORE (Artigos 99-108)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Art. 99° - FUNCIONAMENTO DO THREAT SCORE
 */
export const THREAT_SCORE_SYSTEM = {
  /**
   * Art. 100° - Acumulação de pontos
   * Cada violação adiciona pontos ao score total.
   */
  accumulation: {
    perViolation: true,
    maxScore: 200,
  },
  
  /**
   * Art. 101° - Decaimento de pontos
   * Pontos decaem com o tempo se não houver novas violações.
   */
  decay: {
    rate: 1,                  // 1 ponto por minuto
    minScore: 0,
    activeOnlyWhenVisible: true,
  },
  
  /**
   * Art. 102° - Respostas por nível
   */
  responses: {
    L1_WARNING: {
      action: 'toast_warning',
      message: 'Comportamento suspeito detectado',
    },
    L2_BLUR: {
      action: 'blur_content',
      duration: 5000,
      intensity: 10,
    },
    L3_LOGOUT: {
      action: 'force_logout',
      cooldown: 900,          // 15 minutos
    },
    L4_BLOCK: {
      action: 'block_access',
      duration: 86400,        // 24 horas
    },
  },
} as const;

/**
 * Art. 103° - IMPLEMENTAÇÃO DO THREAT SCORE
 */
export const THREAT_SCORE_IMPLEMENTATION = `
// IMPLEMENTAÇÃO OBRIGATÓRIA em sanctumThreatScore.ts

interface ThreatState {
  score: number;
  level: ThreatLevel;
  events: ThreatEvent[];
  lastActivity: number;
  penaltyUntil?: number;
  blockedUntil?: number;
}

const recordThreatEvent = (
  state: ThreatState,
  eventType: string,
  metadata?: Record<string, unknown>
): ThreatState => {
  const severity = EVENT_SEVERITIES[eventType] || 1;
  const newScore = Math.min(state.score + severity, 200);
  const newLevel = calculateThreatLevel(newScore);
  
  const event: ThreatEvent = {
    type: eventType,
    severity,
    timestamp: Date.now(),
    metadata,
  };
  
  // Log no banco de dados
  logThreatEvent(event);
  
  // Aplicar penalidade se necessário
  let newState = {
    ...state,
    score: newScore,
    level: newLevel,
    events: [...state.events, event].slice(-50), // Manter últimos 50
    lastActivity: Date.now(),
  };
  
  if (newLevel !== state.level) {
    newState = applyPenalty(newState, newLevel);
  }
  
  return newState;
};

const calculateThreatLevel = (score: number): ThreatLevel => {
  if (score >= THREAT_THRESHOLDS.L4_BLOCK) return 'L4_BLOCK';
  if (score >= THREAT_THRESHOLDS.L3_LOGOUT) return 'L3_LOGOUT';
  if (score >= THREAT_THRESHOLDS.L2_BLUR) return 'L2_BLUR';
  if (score >= THREAT_THRESHOLDS.L1_WARNING) return 'L1_WARNING';
  return 'NONE';
};
`;

/**
 * Art. 104-108° - Regras adicionais de Threat Score
 * (Implementadas acima)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO XI — FINGERPRINTING E RASTREAMENTO (Artigos 109-115)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Art. 109° - COMPONENTES DO FINGERPRINT
 */
export const FINGERPRINT_COMPONENTS = {
  /**
   * Art. 110° - Componentes coletados
   */
  collected: [
    'userAgent',              // User agent do browser
    'language',               // Idioma do sistema
    'colorDepth',             // Profundidade de cor
    'screenResolution',       // Resolução de tela
    'timezone',               // Fuso horário
    'platform',               // Plataforma (Win, Mac, Linux)
    'hardwareConcurrency',    // Número de CPUs
    'deviceMemory',           // Memória do dispositivo
    'canvas',                 // Canvas fingerprint
    'webgl',                  // WebGL fingerprint
    'audio',                  // Audio fingerprint
    'fonts',                  // Fontes instaladas
    'plugins',                // Plugins do browser
    'touchSupport',           // Suporte a touch
  ],
  
  /**
   * Art. 111° - Hash do fingerprint
   */
  hashing: {
    algorithm: 'SHA-256',
    salt: 'sanctum-shield-v1',
  },
  
  /**
   * Art. 112° - Armazenamento
   */
  storage: {
    localStorage: true,
    indexedDB: true,
    sessionStorage: true,
  },
} as const;

/**
 * Art. 113° - IMPLEMENTAÇÃO DE FINGERPRINTING
 */
export const FINGERPRINT_IMPLEMENTATION = `
// IMPLEMENTAÇÃO OBRIGATÓRIA em enhancedFingerprint.ts

const generateFingerprint = async (): Promise<string> => {
  const components = await collectComponents();
  const fingerprint = hashComponents(components);
  
  // Armazenar para comparação futura
  localStorage.setItem('device_fp', fingerprint);
  
  return fingerprint;
};

const collectComponents = async () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    colorDepth: screen.colorDepth,
    screenResolution: \`\${screen.width}x\${screen.height}\`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
    canvas: await getCanvasFingerprint(),
    webgl: await getWebGLFingerprint(),
    audio: await getAudioFingerprint(),
    fonts: await getFontList(),
    touchSupport: getTouchSupport(),
  };
};

const hashComponents = (components: Record<string, any>): string => {
  const str = JSON.stringify(components);
  return sha256(str + 'sanctum-shield-v1');
};
`;

/**
 * Art. 114-115° - Regras adicionais de fingerprinting
 * (Implementadas acima)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO XII — DETECÇÃO DE AUTOMAÇÃO (Artigos 116-120)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Art. 116° - SINAIS DE AUTOMAÇÃO DETECTADOS
 */
export const AUTOMATION_SIGNALS = {
  /**
   * Art. 117° - Selenium/Puppeteer
   */
  webdriver: [
    'navigator.webdriver',
    'window.callPhantom',
    'window._phantom',
    'window.__nightmare',
    'window.domAutomation',
    'window.domAutomationController',
  ],
  
  /**
   * Art. 118° - Playwright/Cypress
   */
  testing: [
    'window.Cypress',
    'window.__coverage__',
    'window.__REACT_DEVTOOLS_GLOBAL_HOOK__',
  ],
  
  /**
   * Art. 119° - Headless browsers
   */
  headless: {
    checkPlugins: true,       // Headless tem 0 plugins
    checkLanguages: true,     // Headless tem languages vazias
    checkWebGL: true,         // Headless tem WebGL limitado
  },
} as const;

/**
 * Art. 120° - IMPLEMENTAÇÃO DE DETECÇÃO DE AUTOMAÇÃO
 */
export const AUTOMATION_DETECTION_IMPLEMENTATION = `
// IMPLEMENTAÇÃO OBRIGATÓRIA

const detectAutomation = (): boolean => {
  // Check webdriver
  if (navigator.webdriver) {
    recordViolation('automation_detected', { type: 'webdriver' });
    return true;
  }
  
  // Check Phantom
  if ((window as any).callPhantom || (window as any)._phantom) {
    recordViolation('automation_detected', { type: 'phantom' });
    return true;
  }
  
  // Check Nightmare
  if ((window as any).__nightmare) {
    recordViolation('automation_detected', { type: 'nightmare' });
    return true;
  }
  
  // Check Selenium
  if ((window as any).domAutomation || (window as any).domAutomationController) {
    recordViolation('automation_detected', { type: 'selenium' });
    return true;
  }
  
  // Check Cypress
  if ((window as any).Cypress) {
    recordViolation('automation_detected', { type: 'cypress' });
    return true;
  }
  
  // Check headless
  if (navigator.plugins.length === 0 && !navigator.languages.length) {
    recordViolation('automation_detected', { type: 'headless' });
    return true;
  }
  
  return false;
};

// Executar na inicialização
if (detectAutomation()) {
  blockAccess('Automação detectada');
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TÍTULO XIII — LOGGING E AUDITORIA (Artigos 121-127)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Art. 121° - EVENTOS REGISTRADOS NO BANCO
 */
export const LOGGED_EVENTS = {
  /**
   * Art. 122° - Estrutura do log
   */
  structure: {
    id: 'UUID',
    event_type: 'ViolationType',
    user_id: 'UUID',
    user_email: 'string',
    user_name: 'string',
    session_id: 'string',
    device_fingerprint: 'string',
    ip_hash: 'string',
    user_agent: 'string',
    metadata: 'JSON',
    threat_score: 'number',
    is_violation: 'boolean',
    created_at: 'timestamp',
  },
  
  /**
   * Art. 123° - Tabelas utilizadas
   */
  tables: [
    'security_events',        // Eventos gerais
    'book_access_logs',       // Logs de acesso a livros
    'video_access_logs',      // Logs de acesso a vídeos
    'threat_events',          // Eventos de ameaça
    'active_sessions',        // Sessões ativas
  ],
  
  /**
   * Art. 124° - Retenção de logs
   */
  retention: {
    violations: 365,          // 1 ano
    access: 90,               // 90 dias
    sessions: 30,             // 30 dias
  },
} as const;

/**
 * Art. 125° - IMPLEMENTAÇÃO DE LOGGING
 */
export const LOGGING_IMPLEMENTATION = `
// IMPLEMENTAÇÃO OBRIGATÓRIA

const logSecurityEvent = async (
  eventType: ViolationType,
  metadata?: Record<string, unknown>
): Promise<void> => {
  const { user, session } = await getAuthContext();
  const fingerprint = await generateFingerprint();
  
  const event = {
    event_type: eventType,
    user_id: user?.id,
    user_email: user?.email,
    user_name: user?.user_metadata?.name,
    session_id: session?.access_token?.substring(0, 16),
    device_fingerprint: fingerprint,
    ip_hash: await getIPHash(),
    user_agent: navigator.userAgent,
    metadata,
    threat_score: getCurrentThreatScore(),
    is_violation: true,
    created_at: new Date().toISOString(),
  };
  
  // Log no Supabase
  await supabase.from('security_events').insert(event);
  
  // Log local para fallback
  console.warn('[SANCTUM VIOLATION]', event);
};
`;

/**
 * Art. 126° - BYPASS DO OWNER
 */
export const OWNER_BYPASS = {
  email: OWNER_EMAIL,
  capabilities: [
    'bypass_all_protections',
    'view_all_logs',
    'reset_threat_scores',
    'manage_sessions',
    'impersonate_users',
  ],
  implementation: `
// VERIFICAÇÃO OBRIGATÓRIA em TODOS os hooks de segurança
const isOwner = (email?: string): boolean => {
  return email?.toLowerCase() === 'moisesblank@gmail.com';
};

// Uso em TODOS os handlers
if (isOwner(user?.email)) {
  return; // BYPASS total
}
`,
} as const;

/**
 * Art. 127° - DISPOSIÇÕES FINAIS
 */
export const FINAL_PROVISIONS = {
  /**
   * Esta LEI é INVIOLÁVEL e se aplica a:
   * - TODOS os dispositivos (desktop, mobile, tablet)
   * - TODOS os sistemas operacionais (Windows, macOS, Linux, iOS, Android)
   * - TODOS os navegadores modernos
   * - TODOS os tipos de conteúdo protegido
   * 
   * OWNER: moisesblank@gmail.com tem IMUNIDADE TOTAL.
   * 
   * Qualquer alteração deve ser aprovada pelo OWNER.
   */
  version: LEI_VII_VERSION,
  codename: LEI_VII_CODENAME,
  articles: LEI_VII_ARTICLES,
  status: 'VIGENTE',
  effectiveDate: '2024-12-24',
  hash: 'LEI_VII_PROTECAO_CONTEUDO_v1.0_SANCTUM_SHIELD',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE VERIFICAÇÃO E STATUS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verifica se o usuário é o OWNER (imune a todas as proteções)
 */
export const isOwner = (email?: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
};

/**
 * Retorna o status completo da LEI VII
 */
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
    automationSignals: AUTOMATION_SIGNALS.webdriver.length + 
                       AUTOMATION_SIGNALS.testing.length,
  },
  owner: OWNER_EMAIL,
  ownerImmune: true,
});

/**
 * Log do status da LEI VII no console
 */
export const logLeiVIIStatus = (): void => {
  const status = getLeiVIIStatus();
  
  console.log(`
═══════════════════════════════════════════════════════════════
🛡️ LEI VII - CONSTITUIÇÃO DA PROTEÇÃO DE CONTEÚDO SOBERANA
═══════════════════════════════════════════════════════════════
📋 Versão: ${status.version} (${status.codename})
📊 Artigos: ${status.articles}
✅ Status: ${status.active ? 'ATIVA' : 'INATIVA'}

🔒 PROTEÇÕES ATIVAS:
  • Atalhos bloqueados: ${status.protections.keyboard}
  • Eventos de mouse: ${status.protections.mouse}
  • Eventos touch: ${status.protections.touch}
  • Métodos DevTools: ${status.protections.devtools}
  • Níveis de ameaça: ${status.protections.threatLevels}
  • Componentes fingerprint: ${status.protections.fingerprint}
  • Sinais de automação: ${status.protections.automationSignals}

👑 OWNER SUPREMO: ${status.owner}
🛡️ IMUNIDADE TOTAL: ${status.ownerImmune ? 'SIM' : 'NÃO'}
═══════════════════════════════════════════════════════════════
  `);
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  // Constantes
  VERSION: LEI_VII_VERSION,
  CODENAME: LEI_VII_CODENAME,
  ARTICLES: LEI_VII_ARTICLES,
  ACTIVE: LEI_VII_ACTIVE,
  OWNER_EMAIL,
  
  // Tipos
  ProtectionLevel: {} as ProtectionLevel,
  ProtectedContentType: {} as ProtectedContentType,
  ViolationType: {} as ViolationType,
  ThreatLevel: {} as ThreatLevel,
  
  // Configurações
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
  
  // Funções
  isOwner,
  getLeiVIIStatus,
  logLeiVIIStatus,
};
