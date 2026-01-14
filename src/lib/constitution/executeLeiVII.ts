// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ EXECUTOR DA LEI VII - PROTEÇÃO DE CONTEÚDO SOBERANA
// ═══════════════════════════════════════════════════════════════════════════════
// Este arquivo EXECUTA todas as proteções da LEI VII em tempo real
// OBRIGATÓRIO em TODO o sistema
// ═══════════════════════════════════════════════════════════════════════════════

import { 
  isOwner, 
  logLeiVIIStatus,
  getLeiVIIStatus,
  THREAT_THRESHOLDS,
  EVENT_SEVERITIES,
  BLOCKED_SHORTCUTS,
  // OWNER_EMAIL importado apenas para report legacy (deprecated)
  OWNER_EMAIL,
} from './LEI_VII_PROTECAO_CONTEUDO';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface LeiVIIExecutionReport {
  executed: boolean;
  timestamp: string;
  protectionsActive: number;
  /** @deprecated P1-2: Use role='owner' para verificações */
  ownerEmail: string;
  version: string;
  handlers: string[];
  cssRulesInjected: boolean;
  consoleTrapsActive: boolean;
  mobileProtectionActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════════════════════════════════════

let isExecuted = false;
let currentUserEmail: string | null = null;
const violationCounters: Record<string, number> = {};

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE REGISTRO DE VIOLAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

function recordViolation(type: string, metadata?: Record<string, unknown>): void {
  if (isOwner(currentUserEmail)) return;
  
  violationCounters[type] = (violationCounters[type] || 0) + 1;
  const severity = EVENT_SEVERITIES[type] || 5;
  
  console.warn(`[LEI VII] Violação detectada: ${type} (severidade: ${severity})`, metadata);
  
  // Dispatch evento customizado para hooks capturarem
  const event = new CustomEvent('sanctum-violation', {
    detail: { type, severity, metadata, count: violationCounters[type] }
  });
  window.dispatchEvent(event);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROTEÇÕES DE TECLADO (Art. 9-18)
// ═══════════════════════════════════════════════════════════════════════════════

function setupKeyboardProtection(): void {
  const handler = (e: KeyboardEvent) => {
    if (isOwner(currentUserEmail)) return;
    
    // Safe guard: e.key pode ser undefined em alguns dispositivos
    if (!e.key) return;
    
    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;
    
    // Lista de bloqueios - 🚨 REATIVADO 2026-01-12 após incidente de segurança
    const blocked = [
      // Salvar/Download
      ctrl && key === 's',
      // Imprimir
      ctrl && key === 'p',
      // View Source
      ctrl && key === 'u',
      ctrl && shift && key === 'u',
      // DevTools - REATIVADO
      key === 'f12',
      ctrl && shift && key === 'i',
      ctrl && shift && key === 'j',
      ctrl && shift && key === 'c',
      ctrl && shift && key === 'k',
      // Screenshot Windows - REATIVADO
      key === 'printscreen',
      alt && key === 'printscreen',
      // Copiar (em contexto protegido)
      ctrl && key === 'c' && document.querySelector('[data-sanctum-protected]'),
      // Selecionar tudo
      ctrl && key === 'a' && document.querySelector('[data-sanctum-protected]'),
      // macOS Screenshots
      e.metaKey && shift && key === '3',
      e.metaKey && shift && key === '4',
      e.metaKey && shift && key === '5',
    ];
    
    if (blocked.some(Boolean)) {
      e.preventDefault();
      e.stopPropagation();
      recordViolation('keyboard_shortcut', { key, ctrl, shift, alt });
      return false;
    }
  };
  
  window.addEventListener('keydown', handler, { capture: true, passive: false });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROTEÇÕES DE MOUSE (Art. 19-28)
// ═══════════════════════════════════════════════════════════════════════════════

function setupMouseProtection(): void {
  // Clique direito
  document.addEventListener('contextmenu', (e) => {
    if (isOwner(currentUserEmail)) return;

    const target = e.target;
    if (target instanceof Element && target.closest('[data-sanctum-protected]')) {
      e.preventDefault();
      recordViolation('right_click');
    }
  }, { capture: true });

  // Drag
  document.addEventListener('dragstart', (e) => {
    if (isOwner(currentUserEmail)) return;

    const target = e.target;
    if (target instanceof Element && target.closest('[data-sanctum-protected]')) {
      e.preventDefault();
      recordViolation('drag_attempt');
    }
  }, { capture: true });

  // Seleção
  document.addEventListener('selectstart', (e) => {
    if (isOwner(currentUserEmail)) return;

    const target = e.target;
    if (target instanceof Element && target.closest('[data-sanctum-protected]')) {
      e.preventDefault();
    }
  }, { capture: true });
  
  // Cópia
  document.addEventListener('copy', (e) => {
    if (isOwner(currentUserEmail)) return;
    
    const selection = window.getSelection()?.toString() || '';
    if (selection && document.querySelector('[data-sanctum-protected]')) {
      e.preventDefault();
      e.clipboardData?.setData('text/plain', '© Prof. Moisés Medeiros - Conteúdo Protegido');
      recordViolation('copy_attempt');
    }
  }, { capture: true });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROTEÇÕES TOUCH/MOBILE (Art. 29-42)
// ═══════════════════════════════════════════════════════════════════════════════

function setupTouchProtection(): void {
  let longPressTimer: NodeJS.Timeout | null = null;
  let touchStartPos: { x: number; y: number } | null = null;
  
  // Detectar dispositivo
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return;
  
  // Touch start
  document.addEventListener('touchstart', (e) => {
    if (isOwner(currentUserEmail)) return;
    
    // Multi-touch (3+ dedos = possível screenshot iOS)
    if (e.touches.length >= 3) {
      recordViolation('multi_touch_suspicious', { fingers: e.touches.length });
    }
    
    // Long press detection
    if (e.touches.length === 1) {
      touchStartPos = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      
      longPressTimer = setTimeout(() => {
        recordViolation('long_press');
      }, 500);
    }
  }, { capture: true, passive: false });
  
  // Touch end
  document.addEventListener('touchend', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    touchStartPos = null;
  }, { capture: true, passive: true });
  
  // Touch move
  document.addEventListener('touchmove', (e) => {
    if (longPressTimer && touchStartPos) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPos.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPos.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }
    
    // Bloquear multi-touch em conteúdo protegido
    if (e.touches.length >= 3) {
      const target = e.target;
      if (target instanceof Element && target.closest('[data-sanctum-protected]')) {
        e.preventDefault();
      }
    }
  }, { capture: true, passive: false });

  // iOS gesture events
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(event => {
    document.addEventListener(event, (e) => {
      if (isOwner(currentUserEmail)) return;

      const target = e.target;
      if (target instanceof Element && target.closest('[data-sanctum-protected]')) {
        e.preventDefault();
        recordViolation('gesture_blocked');
      }
    }, { capture: true, passive: false });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECÇÃO DE DEVTOOLS (Art. 43-52)
// ═══════════════════════════════════════════════════════════════════════════════

function setupDevToolsDetection(): void {
  // Método 1: Dimension check
  let devtoolsOpen = false;
  
  const checkDimensions = () => {
    if (isOwner(currentUserEmail)) return;
    
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    
    if ((widthThreshold || heightThreshold) && !devtoolsOpen) {
      devtoolsOpen = true;
      recordViolation('devtools_open', { method: 'dimension' });
    } else if (!widthThreshold && !heightThreshold) {
      devtoolsOpen = false;
    }
  };
  
  setInterval(checkDimensions, 1500);
  
  // Método 2: Console trap
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      if (!isOwner(currentUserEmail)) {
        recordViolation('console_access');
      }
      return 'devtools-trap';
    }
  });
  
  setInterval(() => {
    if (!isOwner(currentUserEmail)) {
      console.debug(element);
      console.clear();
    }
  }, 3000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECÇÃO DE AUTOMAÇÃO (Art. 116-120)
// ═══════════════════════════════════════════════════════════════════════════════

function checkAutomation(): boolean {
  if (isOwner(currentUserEmail)) return false;
  
  const nav = navigator as unknown as Record<string, unknown>;
  const win = window as unknown as Record<string, unknown>;
  
  // Selenium/Puppeteer
  if (nav.webdriver === true) {
    recordViolation('automation_detected', { type: 'webdriver' });
    return true;
  }
  
  // PhantomJS
  if (win.callPhantom || win._phantom) {
    recordViolation('automation_detected', { type: 'phantom' });
    return true;
  }
  
  // Nightmare
  if (win.__nightmare) {
    recordViolation('automation_detected', { type: 'nightmare' });
    return true;
  }
  
  // Selenium DOM
  if (win.domAutomation || win.domAutomationController) {
    recordViolation('automation_detected', { type: 'selenium' });
    return true;
  }
  
  // Cypress
  if (win.Cypress) {
    recordViolation('automation_detected', { type: 'cypress' });
    return true;
  }
  
  // Headless indicators
  if (navigator.plugins?.length === 0 && !navigator.languages?.length) {
    recordViolation('automation_detected', { type: 'headless' });
    return true;
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INJEÇÃO DE CSS DE PROTEÇÃO (Art. 31)
// ═══════════════════════════════════════════════════════════════════════════════

function injectProtectionCSS(): void {
  const existingStyle = document.getElementById('lei-vii-protection-css');
  if (existingStyle) return;
  
  const style = document.createElement('style');
  style.id = 'lei-vii-protection-css';
  style.textContent = `
    /* LEI VII - Art. 31 - CSS de Proteção */
    [data-sanctum-protected],
    .sanctum-protected-surface,
    .sanctum-protected {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
      -webkit-tap-highlight-color: transparent !important;
      -webkit-text-size-adjust: none !important;
      touch-action: manipulation !important;
    }
    
    [data-sanctum-protected] img,
    .sanctum-protected img {
      -webkit-user-drag: none !important;
      user-drag: none !important;
      pointer-events: none !important;
    }
    
    /* Bloqueio de impressão */
    @media print {
      [data-sanctum-protected],
      .sanctum-protected-surface,
      .sanctum-protected {
        display: none !important;
        visibility: hidden !important;
      }
      
      body::after {
        content: "⚠️ IMPRESSÃO BLOQUEADA ⚠️\\A\\AConteúdo protegido por direitos autorais.\\AProf. Moisés Medeiros\\Amoisesmedeiros.com.br";
        display: block !important;
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        font-size: 24px !important;
        text-align: center !important;
        padding: 40px !important;
        color: #dc2626 !important;
        font-weight: bold !important;
        white-space: pre-wrap !important;
        z-index: 999999999 !important;
        background: white !important;
        border: 4px solid #dc2626 !important;
        border-radius: 16px !important;
      }
    }
    
    /* Safe area iOS */
    .sanctum-container {
      padding: env(safe-area-inset-top) 
               env(safe-area-inset-right) 
               env(safe-area-inset-bottom) 
               env(safe-area-inset-left);
    }
  `;
  
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROTEÇÃO DE PRINT (Art. 79-88)
// ═══════════════════════════════════════════════════════════════════════════════

function setupPrintProtection(): void {
  window.addEventListener('beforeprint', () => {
    if (!isOwner(currentUserEmail)) {
      recordViolation('print_attempt');
    }
  });
  
  window.addEventListener('afterprint', () => {
    if (!isOwner(currentUserEmail)) {
      recordViolation('print_attempt', { phase: 'after' });
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROTEÇÃO DE VISIBILIDADE
// ═══════════════════════════════════════════════════════════════════════════════

function setupVisibilityProtection(): void {
  let visibilityCount = 0;
  
  document.addEventListener('visibilitychange', () => {
    if (isOwner(currentUserEmail)) return;
    
    if (document.hidden) {
      visibilityCount++;
      
      if (visibilityCount > 5) {
        recordViolation('visibility_change', { count: visibilityCount });
      }
    }
  });
  
  // iOS screenshot detection via blur
  let blurCount = 0;
  let lastBlur = 0;
  
  window.addEventListener('blur', () => {
    if (isOwner(currentUserEmail)) return;
    
    const now = Date.now();
    if (now - lastBlur < 500) {
      blurCount++;
      if (blurCount >= 2) {
        recordViolation('screenshot_attempt', { platform: 'ios', method: 'blur_pattern' });
        blurCount = 0;
      }
    }
    lastBlur = now;
  });
  
  // Reset blur count
  setInterval(() => { blurCount = 0; }, 2000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL DE EXECUÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

export function executeLeiVII(userEmail?: string | null): LeiVIIExecutionReport {
  // Evitar dupla execução
  if (isExecuted) {
    return {
      executed: true,
      timestamp: new Date().toISOString(),
      protectionsActive: 0,
      ownerEmail: OWNER_EMAIL,
      version: getLeiVIIStatus().version,
      handlers: [],
      cssRulesInjected: true,
      consoleTrapsActive: true,
      mobileProtectionActive: true,
    };
  }
  
  // Salvar email do usuário atual
  currentUserEmail = userEmail || null;
  
  // Se é owner, não aplicar proteções mas marcar como executado
  if (isOwner(userEmail)) {
    isExecuted = true;
    console.log('[LEI VII] 👑 OWNER detectado - BYPASS TOTAL ativado');
    return {
      executed: true,
      timestamp: new Date().toISOString(),
      protectionsActive: 0,
      ownerEmail: OWNER_EMAIL,
      version: getLeiVIIStatus().version,
      handlers: ['owner_bypass'],
      cssRulesInjected: false,
      consoleTrapsActive: false,
      mobileProtectionActive: false,
    };
  }
  
  const handlers: string[] = [];
  
  try {
    // 1. Verificar automação primeiro
    if (checkAutomation()) {
      console.error('[LEI VII] ❌ AUTOMAÇÃO DETECTADA - Acesso será bloqueado');
    }
    handlers.push('automation_check');
    
    // 2. Injetar CSS de proteção
    injectProtectionCSS();
    handlers.push('css_injection');
    
    // 3. Proteções de teclado
    setupKeyboardProtection();
    handlers.push('keyboard_protection');
    
    // 4. Proteções de mouse
    setupMouseProtection();
    handlers.push('mouse_protection');
    
    // 5. Proteções touch/mobile
    setupTouchProtection();
    handlers.push('touch_protection');
    
    // 6. Detecção de DevTools
    setupDevToolsDetection();
    handlers.push('devtools_detection');
    
    // 7. Proteção de print
    setupPrintProtection();
    handlers.push('print_protection');
    
    // 8. Proteção de visibilidade
    setupVisibilityProtection();
    handlers.push('visibility_protection');
    
    isExecuted = true;
    
    // Log status
    logLeiVIIStatus();
    
    console.log('[LEI VII] ✅ Todas as proteções ativas:', handlers);
    
    return {
      executed: true,
      timestamp: new Date().toISOString(),
      protectionsActive: handlers.length,
      ownerEmail: OWNER_EMAIL,
      version: getLeiVIIStatus().version,
      handlers,
      cssRulesInjected: true,
      consoleTrapsActive: true,
      mobileProtectionActive: 'ontouchstart' in window,
    };
    
  } catch (error) {
    console.error('[LEI VII] Erro ao executar:', error);
    return {
      executed: false,
      timestamp: new Date().toISOString(),
      protectionsActive: handlers.length,
      ownerEmail: OWNER_EMAIL,
      version: getLeiVIIStatus().version,
      handlers,
      cssRulesInjected: false,
      consoleTrapsActive: false,
      mobileProtectionActive: false,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PARA ATUALIZAR USUÁRIO
// ═══════════════════════════════════════════════════════════════════════════════

export function updateLeiVIIUser(userEmail: string | null): void {
  currentUserEmail = userEmail;
  
  if (isOwner(userEmail)) {
    console.log('[LEI VII] 👑 OWNER identificado - proteções em bypass');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PARA VERIFICAR STATUS
// ═══════════════════════════════════════════════════════════════════════════════

export function getLeiVIIExecutionStatus(): {
  executed: boolean;
  currentUser: string | null;
  isOwner: boolean;
  violations: Record<string, number>;
} {
  return {
    executed: isExecuted,
    currentUser: currentUserEmail,
    isOwner: isOwner(currentUserEmail),
    violations: { ...violationCounters },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// P1-2: OWNER_EMAIL deprecated - usar role='owner' para verificações
export { isOwner, getLeiVIIStatus, logLeiVIIStatus, OWNER_EMAIL };

export default executeLeiVII;
