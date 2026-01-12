// ============================================
// 🛡️ ANTI-DEBUGGER LAYER v2.0
// Proteção adicional contra leitura de código
// OWNER BYPASS SEMPRE
// ============================================

const OWNER_EMAIL = 'moisesblank@gmail.com';
let isOwnerMode = false;
let antiDebugActive = false;
let infiniteLoopActive = false;

// ============================================
// CONFIGURAR OWNER MODE
// ============================================
export function setOwnerMode(email: string | null | undefined): void {
  isOwnerMode = email?.toLowerCase() === OWNER_EMAIL;
}

// ============================================
// 1. CONSOLE FLOODING - Inunda o console com lixo
// ============================================
function floodConsole(): void {
  if (isOwnerMode) return;
  
  const junkMessages = [
    '🛡️ Conteúdo protegido por Lei de Direitos Autorais',
    '⚠️ Tentativas de cópia são monitoradas e registradas',
    '🔒 Este sistema possui rastreamento forense',
    '📍 Seu IP e dispositivo foram registrados',
    '⛔ Violações serão reportadas às autoridades competentes',
  ];
  
  // Inundar console a cada 100ms
  for (let i = 0; i < 50; i++) {
    console.log('%c' + junkMessages[i % junkMessages.length], 
      'color: red; font-size: 14px; background: black; padding: 5px;');
    console.warn('%c🚨 SISTEMA DE PROTEÇÃO ATIVO 🚨', 
      'color: yellow; font-size: 20px; font-weight: bold;');
  }
  console.clear();
}

// ============================================
// 2. INFINITE DEBUGGER LOOP - Pausa execução infinitamente
// ============================================
function startInfiniteDebugger(): void {
  if (isOwnerMode || infiniteLoopActive) return;
  infiniteLoopActive = true;
  
  const loop = (): void => {
    if (isOwnerMode) {
      infiniteLoopActive = false;
      return;
    }
    
    // eslint-disable-next-line no-debugger
    debugger;
    
    // Continuar o loop após 50ms
    setTimeout(loop, 50);
  };
  
  loop();
}

// ============================================
// 3. PROTOTYPE POLLUTION DETECTION
// ============================================
function protectPrototypes(): void {
  if (isOwnerMode) return;
  
  try {
    // Detectar se alguém está inspecionando objetos
    const originalToString = Object.prototype.toString;
    Object.defineProperty(Object.prototype, 'toString', {
      value: function() {
        // Se chamado em contexto de debug, pode indicar inspeção
        return originalToString.call(this);
      },
      writable: false,
      configurable: false,
    });
  } catch {
    // Já protegido
  }
}

// ============================================
// 4. DISABLE CONSOLE METHODS
// ============================================
function disableConsoleMethods(): void {
  if (isOwnerMode) return;
  
  const noop = (): void => {};
  const methods: (keyof Console)[] = ['log', 'debug', 'info', 'warn', 'error', 'table', 'dir', 'dirxml', 'trace'];
  
  methods.forEach(method => {
    try {
      // @ts-expect-error - Override console methods
      console[method] = noop;
    } catch {
      // Método protegido
    }
  });
}

// ============================================
// 5. DETECT DEVTOOLS VIA ELEMENT INSPECTION
// ============================================
function detectDevToolsViaElement(): boolean {
  if (isOwnerMode) return false;
  
  let devtoolsOpen = false;
  
  const element = document.createElement('div');
  Object.defineProperty(element, 'id', {
    get: function() {
      devtoolsOpen = true;
      return '';
    }
  });
  
  console.debug(element);
  
  return devtoolsOpen;
}

// ============================================
// 6. TIMING ATTACK DETECTION
// ============================================
function detectViaTimingAttack(): boolean {
  if (isOwnerMode) return false;
  
  const start = performance.now();
  // eslint-disable-next-line no-debugger
  debugger;
  const duration = performance.now() - start;
  
  // Se demorou mais de 100ms, DevTools está aberto com breakpoints
  return duration > 100;
}

// ============================================
// 7. DIMENSION CHECK (mais confiável)
// ============================================
function detectViaDimensions(): boolean {
  if (isOwnerMode) return false;
  
  const widthThreshold = window.outerWidth - window.innerWidth > 160;
  const heightThreshold = window.outerHeight - window.innerHeight > 160;
  
  return widthThreshold || heightThreshold;
}

// ============================================
// 8. OVERRIDE toString PARA ESCONDER CÓDIGO
// ============================================
function hideSourceCode(): void {
  if (isOwnerMode) return;
  
  // Override Function.prototype.toString para esconder implementação
  const originalFunctionToString = Function.prototype.toString;
  
  try {
    Function.prototype.toString = function() {
      // Se é uma função nossa, retornar mensagem genérica
      const original = originalFunctionToString.call(this);
      
      if (original.includes('sanctum') || 
          original.includes('protect') || 
          original.includes('security') ||
          original.includes('violation')) {
        return 'function() { [protected code] }';
      }
      
      return original;
    };
  } catch {
    // Já protegido
  }
}

// ============================================
// HANDLER DE DETECÇÃO
// ============================================
function handleDevToolsDetected(): void {
  if (isOwnerMode) return;
  
  // 1. Limpar e inundar console
  console.clear();
  floodConsole();
  
  // 2. Desabilitar métodos do console
  disableConsoleMethods();
  
  // 3. Iniciar loop infinito de debugger
  startInfiniteDebugger();
}

// ============================================
// INICIALIZAÇÃO DO SISTEMA
// ============================================
export function initAntiDebugger(userEmail?: string | null): () => void {
  if (antiDebugActive) return () => {};
  
  setOwnerMode(userEmail);
  
  if (isOwnerMode) {
    console.log('[AntiDebugger] Owner mode - bypassed');
    return () => {};
  }
  
  antiDebugActive = true;
  
  // Proteger protótipos
  protectPrototypes();
  
  // Esconder código fonte
  hideSourceCode();
  
  // Verificação periódica
  const intervalId = setInterval(() => {
    if (isOwnerMode) {
      clearInterval(intervalId);
      return;
    }
    
    const devToolsOpen = 
      detectDevToolsViaElement() || 
      detectViaDimensions();
    
    if (devToolsOpen) {
      handleDevToolsDetected();
    }
  }, 1000);
  
  // Cleanup
  return () => {
    antiDebugActive = false;
    infiniteLoopActive = false;
    clearInterval(intervalId);
  };
}

// ============================================
// ATIVAR MODO AGRESSIVO (para páginas de conteúdo)
// ============================================
export function enableAggressiveMode(): void {
  if (isOwnerMode) return;
  
  // Verificação imediata
  if (detectDevToolsViaElement() || detectViaDimensions()) {
    handleDevToolsDetected();
  }
  
  // Adicionar listener de resize (detecta abertura do DevTools)
  window.addEventListener('resize', () => {
    if (detectViaDimensions()) {
      handleDevToolsDetected();
    }
  });
  
  // Verificação via timing a cada 5s (menos intrusivo)
  setInterval(() => {
    if (!isOwnerMode && detectViaTimingAttack()) {
      handleDevToolsDetected();
    }
  }, 5000);
}

// ============================================
// EXPORTAR PARA USO EM HOOKS
// ============================================
export const antiDebugger = {
  init: initAntiDebugger,
  setOwnerMode,
  enableAggressiveMode,
  detectDevTools: detectDevToolsViaElement,
  detectDimensions: detectViaDimensions,
};

export default antiDebugger;
