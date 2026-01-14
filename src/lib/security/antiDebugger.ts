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
// VERIFICAÇÃO DE AMBIENTE PREVIEW (LOVABLE)
// ⚠️ 2026-01-13: Bypass APENAS para localhost/lovable preview
// PRODUÇÃO (pro.moisesmedeiros.com.br) = PROTEÇÃO TOTAL
// ============================================
function isPreviewEnvironment(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  
  // 🛡️ PRODUÇÃO: NUNCA bypass em domínios de produção PUBLICADOS
  const isProductionDomain = 
    hostname === 'pro.moisesmedeiros.com.br' ||
    hostname === 'moisesmedeiros.com.br' ||
    hostname === 'gestao.moisesmedeiros.com.br' ||
    hostname === 'people-flow-desk.lovable.app'; // Domínio publicado oficial
  
  if (isProductionDomain) {
    return false; // PROTEÇÃO ATIVA
  }
  
  // Preview/desenvolvimento: bypass para testes
  // Inclui id-preview--.lovable.app (preview do Lovable)
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('lovableproject.com') ||
    hostname.includes('id-preview--') // Preview do Lovable (id-preview--xxx.lovable.app)
  );
}

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
  if (isOwnerMode || isPreviewEnvironment()) return;
  
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
  if (isOwnerMode || isPreviewEnvironment() || infiniteLoopActive) return;
  infiniteLoopActive = true;
  
  const loop = (): void => {
    if (isOwnerMode || isPreviewEnvironment()) {
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
  if (isOwnerMode || isPreviewEnvironment()) return;
  
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
  if (isOwnerMode || isPreviewEnvironment()) return;
  
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
  if (isOwnerMode || isPreviewEnvironment()) return false;
  
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
  if (isOwnerMode || isPreviewEnvironment()) return false;
  
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
  if (isOwnerMode || isPreviewEnvironment()) return false;
  
  const widthThreshold = window.outerWidth - window.innerWidth > 160;
  const heightThreshold = window.outerHeight - window.innerHeight > 160;
  
  return widthThreshold || heightThreshold;
}

// ============================================
// 8. OVERRIDE toString PARA ESCONDER CÓDIGO (REFORÇADO 2026-01-12)
// ============================================
function hideSourceCode(): void {
  if (isOwnerMode || isPreviewEnvironment()) return;
  
  // Override Function.prototype.toString para esconder implementação
  const originalFunctionToString = Function.prototype.toString;
  
  try {
    Function.prototype.toString = function() {
      // Se é uma função nossa, retornar mensagem genérica
      const original = originalFunctionToString.call(this);
      
      // Palavras-chave que indicam código de segurança
      const protectedKeywords = [
        'sanctum', 'protect', 'security', 'violation', 'screenshot',
        'devtools', 'debugger', 'watermark', 'fingerprint', 'keydown',
        'keyup', 'clipboard', 'printscreen', 'detection', 'guard',
        'shield', 'fortress', 'lei_vii', 'leiVII', 'anti'
      ];
      
      const lowerOriginal = original.toLowerCase();
      if (protectedKeywords.some(kw => lowerOriginal.includes(kw))) {
        return 'function() { [CONTEÚDO PROTEGIDO - Lei 9.610/98] }';
      }
      
      return original;
    };
  } catch {
    // Já protegido
  }
}

// ============================================
// 9. BLOQUEAR DEBUGGER STATEMENT (NOVO 2026-01-12)
// ============================================
function blockDebuggerStatement(): void {
  if (isOwnerMode || isPreviewEnvironment()) return;
  
  // Injetar CSS que oculta conteúdo quando DevTools está aberto
  const style = document.createElement('style');
  style.id = 'anti-debug-css';
  style.textContent = `
    @media (min-width: 0px) {
      body.devtools-detected [data-sanctum-protected] {
        filter: blur(50px) !important;
        opacity: 0.1 !important;
        pointer-events: none !important;
      }
      body.devtools-detected::after {
        content: "⚠️ DEVTOOLS DETECTADO - CONTEÚDO BLOQUEADO" !important;
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        background: #dc2626 !important;
        color: white !important;
        padding: 40px !important;
        font-size: 24px !important;
        font-weight: bold !important;
        z-index: 999999999 !important;
        border-radius: 16px !important;
        box-shadow: 0 0 100px rgba(220, 38, 38, 0.8) !important;
      }
    }
  `;
  
  if (!document.getElementById('anti-debug-css')) {
    document.head.appendChild(style);
  }
}

// ============================================
// 10. DETECTAR E RESPONDER A DEVTOOLS (REFORÇADO)
// ============================================
function aggressiveDevToolsResponse(): void {
  if (isOwnerMode || isPreviewEnvironment()) return;
  
  // Marcar body como detectado
  document.body.classList.add('devtools-detected');
  
  // Limpar clipboard
  try {
    navigator.clipboard.writeText('© Prof. Moisés Medeiros - Conteúdo Protegido por Lei');
  } catch {
    // Clipboard não disponível
  }
  
  // Disparar evento de violação
  window.dispatchEvent(new CustomEvent('sanctum-violation', {
    detail: { type: 'devtools_aggressive', severity: 10 }
  }));
}

// ============================================
// HANDLER DE DETECÇÃO
// ============================================
function handleDevToolsDetected(): void {
  if (isOwnerMode || isPreviewEnvironment()) return;
  
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
  
  // ⚡ BYPASS TOTAL: Owner OU ambiente de preview Lovable
  if (isOwnerMode || isPreviewEnvironment()) {
    console.log('[AntiDebugger] ⚡ Bypass ativo (Owner ou Preview) - proteções desativadas');
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
// ATIVAR MODO AGRESSIVO (para páginas de conteúdo) - REFORÇADO 2026-01-12
// ============================================
export function enableAggressiveMode(): void {
  if (isOwnerMode || isPreviewEnvironment()) return;
  
  // Injetar CSS de bloqueio
  blockDebuggerStatement();
  
  // Verificação imediata
  if (detectDevToolsViaElement() || detectViaDimensions()) {
    handleDevToolsDetected();
    aggressiveDevToolsResponse();
  }
  
  // Adicionar listener de resize (detecta abertura do DevTools)
  window.addEventListener('resize', () => {
    if (detectViaDimensions()) {
      handleDevToolsDetected();
      aggressiveDevToolsResponse();
    }
  });
  
  // Verificação via timing a cada 3s (mais agressivo)
  setInterval(() => {
    if (!isOwnerMode && !isPreviewEnvironment()) {
      const detected = detectViaTimingAttack() || detectViaDimensions();
      if (detected) {
        handleDevToolsDetected();
        aggressiveDevToolsResponse();
      }
    }
  }, 3000);
  
  // Listener para keyboard shortcuts de DevTools
  window.addEventListener('keydown', (e) => {
    if (isOwnerMode || isPreviewEnvironment()) return;
    
    const key = e.key?.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    
    // Detectar abertura de DevTools
    if (key === 'f12' || (ctrl && shift && ['i', 'j', 'c', 'k'].includes(key))) {
      e.preventDefault();
      e.stopPropagation();
      handleDevToolsDetected();
      aggressiveDevToolsResponse();
      return false;
    }
  }, { capture: true, passive: false });
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
  aggressiveResponse: aggressiveDevToolsResponse,
  blockDebugger: blockDebuggerStatement,
};

export default antiDebugger;
