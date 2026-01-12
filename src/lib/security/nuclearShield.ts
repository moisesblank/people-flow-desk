// ═══════════════════════════════════════════════════════════════════════════════
// ☢️ NUCLEAR SHIELD v3.0 — OPÇÃO NUCLEAR DE PROTEÇÃO
// ═══════════════════════════════════════════════════════════════════════════════
// Proteção extrema contra inspeção e roubo de código
// OWNER (moisesblank@gmail.com) SEMPRE BYPASS
// ═══════════════════════════════════════════════════════════════════════════════

const OWNER_EMAIL = 'moisesblank@gmail.com';
const AUTHORIZED_DOMAINS = [
  'pro.moisesmedeiros.com.br',
  'moisesmedeiros.com.br',
  // Lovable preview domains
  'lovableproject.com',
  'lovable.app',
];

let isOwnerMode = false;
let isShieldActive = false;
let lastDetectionTime = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DE OWNER
// ═══════════════════════════════════════════════════════════════════════════════

export function setOwnerMode(email: string | null | undefined): void {
  isOwnerMode = email?.toLowerCase() === OWNER_EMAIL;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. VERIFICAÇÃO DE DOMÍNIO AUTORIZADO
// ═══════════════════════════════════════════════════════════════════════════════

function isDomainAuthorized(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  
  // Permitir localhost/preview em desenvolvimento
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true; // Permitir desenvolvimento local
  }
  
  return AUTHORIZED_DOMAINS.some(domain => 
    hostname === domain || hostname.endsWith('.' + domain)
  );
}

function enforceAuthorizedDomain(): void {
  if (isOwnerMode) return;
  
  if (!isDomainAuthorized()) {
    // Bloquear acesso em proxy/clone
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #0a0a0a;
        color: #dc2626;
        font-family: monospace;
        text-align: center;
        padding: 40px;
      ">
        <h1 style="font-size: 48px; margin-bottom: 20px;">⛔ ACESSO BLOQUEADO</h1>
        <p style="font-size: 18px; max-width: 600px; line-height: 1.6;">
          Este conteúdo é protegido e só pode ser acessado através do domínio oficial.
          <br/><br/>
          <strong>Domínio autorizado:</strong> pro.moisesmedeiros.com.br
        </p>
        <p style="margin-top: 40px; color: #666; font-size: 12px;">
          Sua tentativa de acesso foi registrada. Lei 9.610/98
        </p>
      </div>
    `;
    
    // Parar toda execução
    throw new Error('[NUCLEAR SHIELD] Unauthorized domain access blocked');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. DETECÇÃO AVANÇADA DE DEVTOOLS (Performance Timing Attack)
// ═══════════════════════════════════════════════════════════════════════════════

function detectDevToolsViaPerformance(): boolean {
  if (isOwnerMode) return false;
  
  const threshold = 100; // ms
  const t1 = performance.now();
  
  // Força re-render que é afetado pelo DevTools
  for (let i = 0; i < 10; i++) {
    console.log(Object.create(null));
    console.clear();
  }
  
  const t2 = performance.now();
  return (t2 - t1) > threshold;
}

function detectDevToolsViaDimensions(): boolean {
  if (isOwnerMode) return false;
  
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;
  
  // DevTools docked lateralmente ou embaixo
  return widthDiff > 200 || heightDiff > 200;
}

function detectDevToolsViaDebugger(): boolean {
  if (isOwnerMode) return false;
  
  const start = performance.now();
  // eslint-disable-next-line no-debugger
  debugger;
  const duration = performance.now() - start;
  
  // Se demorou mais de 100ms, alguém está steppando no debugger
  return duration > 100;
}

// Detecção via Console getter trap
function detectDevToolsViaConsoleTrap(): boolean {
  if (isOwnerMode) return false;
  
  let detected = false;
  const element = new Image();
  
  Object.defineProperty(element, 'id', {
    get: () => {
      detected = true;
      return '';
    }
  });
  
  console.log(element);
  console.clear();
  
  return detected;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RESPOSTA NUCLEAR (Quando DevTools é detectado)
// ═══════════════════════════════════════════════════════════════════════════════

function executeNuclearResponse(): void {
  if (isOwnerMode) return;
  
  // Previne chamadas múltiplas em sequência
  const now = Date.now();
  if (now - lastDetectionTime < 5000) return;
  lastDetectionTime = now;
  
  console.warn('[NUCLEAR SHIELD] ☢️ RESPOSTA NUCLEAR ATIVADA');
  
  // 1. Limpar todos os storages
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // Storage pode estar bloqueado
  }
  
  // 2. Limpar cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // 3. Sobrescrever body com mensagem
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #1a0a0a 0%, #2a0a0a 100%);
      color: #ff4444;
      font-family: 'Courier New', monospace;
      text-align: center;
      padding: 40px;
      animation: pulse 2s infinite;
    ">
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes blink {
          0%, 100% { color: #ff4444; }
          50% { color: #ff0000; }
        }
      </style>
      <div style="font-size: 80px; margin-bottom: 20px;">☢️</div>
      <h1 style="font-size: 36px; margin-bottom: 16px; animation: blink 1s infinite;">
        VIOLAÇÃO DE SEGURANÇA DETECTADA
      </h1>
      <p style="font-size: 16px; max-width: 500px; line-height: 1.6; color: #ff8888;">
        Sua tentativa de inspeção foi detectada e registrada.
        <br/><br/>
        Esta sessão foi encerrada e seus dados de acesso foram revogados.
      </p>
      <div style="
        margin-top: 40px;
        padding: 20px;
        background: rgba(255, 0, 0, 0.1);
        border: 1px solid #ff4444;
        border-radius: 8px;
        font-size: 12px;
        color: #888;
      ">
        <p>IP e dispositivo registrados para auditoria.</p>
        <p>Lei 9.610/98 — Direitos Autorais</p>
      </div>
    </div>
  `;
  
  // 4. Iniciar loop infinito de debugger (trava DevTools)
  startMassiveDebuggerLoop();
  
  // 5. Disparar evento para revogar sessão no backend
  window.dispatchEvent(new CustomEvent('nuclear-shield-triggered', {
    detail: { timestamp: now, reason: 'devtools_detected' }
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. LOOP MASSIVO DE DEBUGGER (Trava a thread do DevTools)
// ═══════════════════════════════════════════════════════════════════════════════

let debuggerLoopActive = false;

function startMassiveDebuggerLoop(): void {
  if (isOwnerMode || debuggerLoopActive) return;
  debuggerLoopActive = true;
  
  const recursiveDebugger = (): void => {
    if (isOwnerMode) {
      debuggerLoopActive = false;
      return;
    }
    
    // eslint-disable-next-line no-debugger
    debugger;
    
    // Loop recursivo com mínimo delay para maximizar consumo de CPU no DevTools
    setTimeout(recursiveDebugger, 1);
  };
  
  // Iniciar múltiplas instâncias do loop
  for (let i = 0; i < 5; i++) {
    setTimeout(recursiveDebugger, i * 10);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. BLOQUEIO GLOBAL DE TECLADO (stopImmediatePropagation)
// ═══════════════════════════════════════════════════════════════════════════════

function setupNuclearKeyboardBlock(): void {
  const blockedKeys = new Set([
    'F12',
    'PrintScreen',
  ]);
  
  const blockedCombos = [
    { ctrl: true, shift: true, key: 'I' },
    { ctrl: true, shift: true, key: 'J' },
    { ctrl: true, shift: true, key: 'C' },
    { ctrl: true, shift: true, key: 'K' },
    { ctrl: true, key: 'U' },
    { ctrl: true, key: 'S' },
    { ctrl: true, key: 'P' },
    { meta: true, alt: true, key: 'I' }, // macOS
    { meta: true, alt: true, key: 'J' }, // macOS
    { meta: true, alt: true, key: 'C' }, // macOS
    { meta: true, shift: true, key: '3' }, // macOS screenshot
    { meta: true, shift: true, key: '4' }, // macOS screenshot
    { meta: true, shift: true, key: '5' }, // macOS screenshot
  ];
  
  const handler = (e: KeyboardEvent): boolean | void => {
    if (isOwnerMode) return;
    
    const key = e.key?.toUpperCase() || '';
    
    // Bloqueio direto de teclas
    if (blockedKeys.has(key)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      executeNuclearResponse();
      return false;
    }
    
    // Verificar combos
    for (const combo of blockedCombos) {
      const ctrlMatch = (combo.ctrl ?? false) === (e.ctrlKey || e.metaKey);
      const shiftMatch = (combo.shift ?? false) === e.shiftKey;
      const metaMatch = (combo.meta ?? false) === e.metaKey;
      const altMatch = (combo.alt ?? false) === e.altKey;
      const keyMatch = combo.key.toUpperCase() === key;
      
      if (keyMatch && ctrlMatch && shiftMatch && (metaMatch || !combo.meta) && (altMatch || !combo.alt)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        executeNuclearResponse();
        return false;
      }
    }
  };
  
  // Capturar no início da fase de captura
  window.addEventListener('keydown', handler, { capture: true, passive: false });
  window.addEventListener('keyup', handler, { capture: true, passive: false });
  document.addEventListener('keydown', handler, { capture: true, passive: false });
  document.addEventListener('keyup', handler, { capture: true, passive: false });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. BLOQUEIO DE RIGHT-CLICK GLOBAL
// ═══════════════════════════════════════════════════════════════════════════════

function setupContextMenuBlock(): void {
  const handler = (e: MouseEvent): boolean | void => {
    if (isOwnerMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  };
  
  window.addEventListener('contextmenu', handler, { capture: true, passive: false });
  document.addEventListener('contextmenu', handler, { capture: true, passive: false });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. SELF-DEFENDING CODE (Detecta se foi beautificado/modificado)
// ═══════════════════════════════════════════════════════════════════════════════

function setupSelfDefense(): void {
  if (isOwnerMode) return;
  
  // Hash de verificação - se a função foi modificada, o hash muda
  const functionSignature = setupSelfDefense.toString();
  const originalLength = 650; // Tamanho aproximado da função minificada
  
  // Se o código foi beautificado, o tamanho aumenta significativamente
  if (functionSignature.length > originalLength * 3) {
    console.error('[NUCLEAR SHIELD] Code tampering detected');
    executeNuclearResponse();
  }
  
  // Verificar se debugger foi removido
  const codeHasDebugger = /debugger/.test(startMassiveDebuggerLoop.toString());
  if (!codeHasDebugger) {
    console.error('[NUCLEAR SHIELD] Critical code stripped');
    executeNuclearResponse();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. MONITORAMENTO CONTÍNUO
// ═══════════════════════════════════════════════════════════════════════════════

function startContinuousMonitoring(): void {
  if (isOwnerMode) return;
  
  // Verificação a cada 2 segundos
  setInterval(() => {
    if (isOwnerMode) return;
    
    // Checar múltiplos métodos de detecção
    const detected = 
      detectDevToolsViaDimensions() || 
      detectDevToolsViaConsoleTrap();
    
    if (detected) {
      executeNuclearResponse();
    }
  }, 2000);
  
  // Verificação via timing (menos frequente, mais intrusivo)
  setInterval(() => {
    if (isOwnerMode) return;
    
    if (detectDevToolsViaPerformance()) {
      executeNuclearResponse();
    }
  }, 5000);
  
  // Verificação no resize (DevTools docked)
  window.addEventListener('resize', () => {
    if (isOwnerMode) return;
    
    if (detectDevToolsViaDimensions()) {
      executeNuclearResponse();
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. STRIP CONSOLE EM PRODUÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

function stripConsoleInProduction(): void {
  if (isOwnerMode) return;
  if (process.env.NODE_ENV !== 'production') return;
  
  const noop = (): void => {};
  const methods: (keyof Console)[] = [
    'log', 'debug', 'info', 'warn', 'error', 
    'table', 'dir', 'dirxml', 'trace', 'group', 
    'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 
    'timeLog', 'assert', 'count', 'countReset'
  ];
  
  methods.forEach(method => {
    try {
      // @ts-expect-error - Override console
      console[method] = noop;
    } catch {
      // Método protegido
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. CSS ANTI-SELECTION E ANTI-PRINT
// ═══════════════════════════════════════════════════════════════════════════════

function injectNuclearCSS(): void {
  const styleId = 'nuclear-shield-css';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* NUCLEAR SHIELD - Proteção Global */
    
    /* Desabilitar seleção de texto globalmente */
    body {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    
    /* Permitir seleção apenas em inputs */
    input, textarea, [contenteditable="true"] {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
    
    /* Bloquear impressão */
    @media print {
      * {
        display: none !important;
        visibility: hidden !important;
      }
      
      body::before {
        content: "☢️ IMPRESSÃO BLOQUEADA ☢️\\A\\APor Prof. Moisés Medeiros\\Apro.moisesmedeiros.com.br" !important;
        display: block !important;
        visibility: visible !important;
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        font-size: 32px !important;
        font-weight: bold !important;
        color: #dc2626 !important;
        text-align: center !important;
        white-space: pre-wrap !important;
        z-index: 2147483647 !important;
      }
    }
    
    /* Bloquear drag de imagens */
    img {
      -webkit-user-drag: none !important;
      user-drag: none !important;
      pointer-events: none !important;
    }
    
    /* Bloquear highlight em iOS */
    * {
      -webkit-tap-highlight-color: transparent !important;
    }
  `;
  
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO DO NUCLEAR SHIELD
// ═══════════════════════════════════════════════════════════════════════════════

export function initNuclearShield(userEmail?: string | null): () => void {
  if (isShieldActive) return () => {};
  
  setOwnerMode(userEmail);
  
  if (isOwnerMode) {
    console.log('[NUCLEAR SHIELD] ⚡ Owner mode - all protections bypassed');
    return () => {};
  }
  
  isShieldActive = true;
  
  console.log('[NUCLEAR SHIELD] ☢️ Iniciando proteção nuclear...');
  
  // 1. Verificar domínio autorizado
  enforceAuthorizedDomain();
  
  // 2. Injetar CSS de proteção
  injectNuclearCSS();
  
  // 3. Bloquear teclado
  setupNuclearKeyboardBlock();
  
  // 4. Bloquear right-click
  setupContextMenuBlock();
  
  // 5. Setup self-defense
  setTimeout(setupSelfDefense, 1000);
  
  // 6. Strip console em produção
  stripConsoleInProduction();
  
  // 7. Iniciar monitoramento contínuo
  startContinuousMonitoring();
  
  console.log('[NUCLEAR SHIELD] ☢️ Proteção nuclear ATIVA');
  
  return () => {
    isShieldActive = false;
    debuggerLoopActive = false;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const nuclearShield = {
  init: initNuclearShield,
  setOwnerMode,
  executeNuclearResponse,
  isDomainAuthorized,
};

export default nuclearShield;
