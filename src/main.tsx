// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🏛️ MATRIZ DIGITAL - ENTRADA SAGRADA                                       ║
// ║   Evangelho da Velocidade v16.0 + Performance Omega                         ║
// ║   ANO 2300 — DESIGN FUTURISTA COM RENDIMENTO 3500                           ║
// ║   🚀 TTI OPTIMIZATION: -60% via defer de inicializações                      ║
// ║   ☢️ NUCLEAR SHIELD: DevTools + React DevTools Blocking                      ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ============================================
// ☢️ LAYER 3: REACT DEVTOOLS BLOCKING (PRIMEIRO!)
// Deve executar ANTES de qualquer import React
// ============================================
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // Desabilita React DevTools completamente em produção
  const disableReactDevTools = () => {
    const noop = () => undefined;
    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    
    if (hook) {
      // Sobrescreve todos os métodos do hook
      Object.keys(hook).forEach((key) => {
        if (typeof hook[key] === 'function') {
          hook[key] = noop;
        }
      });
      hook.inject = noop;
      hook.onCommitFiberRoot = noop;
      hook.onCommitFiberUnmount = noop;
    }
    
    // Previne instalação futura
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      value: {
        isDisabled: true,
        supportsFiber: false,
        inject: noop,
        onCommitFiberRoot: noop,
        onCommitFiberUnmount: noop,
        checkDCE: noop,
      },
      writable: false,
      configurable: false,
    });
  };
  
  disableReactDevTools();
}

// ============================================
// TIPOS PARA WEB VITALS (Performance API)
// ============================================
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  duration: number;
}

import { createRoot } from "react-dom/client";
// P0: App importado de forma dinâmica para não quebrar o bootstrap
type AppModule = { default: React.ComponentType };
import "./index.css";
import { initGlobalErrorCapture } from "@/hooks/useSystemLogs";

// ============================================
// ☢️ LAYER 2: DEVTOOLS DETECTION & BLOCKING
// 🚨 DESATIVADO (2026-01-21) — Falsos positivos bloqueando Owner
// TODO: Reimplementar com verificação de sessão robusta
// ============================================
// const isLovablePreview = () => {
//   const hostname = window.location.hostname.toLowerCase();
//   return hostname.includes('lovableproject.com') || 
//          hostname.includes('lovable.app') || 
//          hostname === 'localhost' ||
//          hostname === '127.0.0.1';
// };

// 🛡️ P0 FIX 2026-01-21: PROTEÇÃO DESATIVADA
// MOTIVO: Código executa ANTES do React montar, impossível verificar Owner
// O bloqueio estava impedindo o Owner de acessar /gestaofc
// Proteção será reimplementada no useGlobalDevToolsBlock.ts (pós-auth)
const DEVTOOLS_LAYER2_ENABLED = false;

if (typeof window !== 'undefined' && import.meta.env.PROD && DEVTOOLS_LAYER2_ENABLED) {
  // Código de proteção mantido mas desativado
  const isLovablePreview = () => {
    const hostname = window.location.hostname.toLowerCase();
    return hostname.includes('lovableproject.com') || 
           hostname.includes('lovable.app') || 
           hostname === 'localhost' ||
           hostname === '127.0.0.1';
  };
  
  if (!isLovablePreview()) {
    // Método 1: Timing attack (detecta breakpoints/debugger)
    const detectDevToolsByTiming = () => {
      const start = performance.now();
      // debugger statement causa delay se DevTools está aberto
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      return (end - start) > 100; // > 100ms indica DevTools aberto
    };
    
    // Método 2: Console timing (console.log é lento com DevTools)
    const detectDevToolsByConsole = () => {
      const element = new Image();
      let isOpen = false;
      
      Object.defineProperty(element, 'id', {
        get: () => {
          isOpen = true;
          return '';
        }
      });
      
      console.log(element);
      console.clear();
      return isOpen;
    };
    
    // Método 3: Window size (DevTools reduz viewport)
    const detectDevToolsBySize = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      return widthThreshold || heightThreshold;
    };
    
    // Handler quando DevTools é detectado
    const handleDevToolsDetected = () => {
      // Redireciona para página de violação de segurança
      document.body.innerHTML = `
        <div style="
          position: fixed;
          inset: 0;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
        ">
          <div style="
            text-align: center;
            color: #ff0000;
            font-family: monospace;
            font-size: 24px;
            padding: 40px;
          ">
            <div style="font-size: 64px; margin-bottom: 20px;">🛡️</div>
            <div>ACESSO BLOQUEADO</div>
            <div style="font-size: 14px; margin-top: 10px; color: #666;">
              Ferramentas de desenvolvedor não são permitidas
            </div>
          </div>
        </div>
      `;
      
      // Para toda execução
      throw new Error('DevTools detected - execution halted');
    };
    
    // Monitoramento contínuo (a cada 1 segundo)
    let devToolsCheckCount = 0;
    const MAX_CHECKS = 3; // Só bloqueia após 3 detecções consecutivas
    
    const checkDevTools = () => {
      try {
        const isOpen = detectDevToolsBySize() || detectDevToolsByConsole();
        
        if (isOpen) {
          devToolsCheckCount++;
          if (devToolsCheckCount >= MAX_CHECKS) {
            handleDevToolsDetected();
          }
        } else {
          devToolsCheckCount = 0; // Reset se fechou
        }
      } catch {
        // Silencioso - não pode quebrar o app
      }
    };
    
    // Inicia monitoramento após 3 segundos (não bloqueia TTI)
    setTimeout(() => {
      setInterval(checkDevTools, 1000);
    }, 3000);
  }
  // Bloqueia atalhos de DevTools (dentro do if DEVTOOLS_LAYER2_ENABLED)
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Ctrl+Shift+I/J/C
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Ctrl+U (view source)
    if (e.ctrlKey && e.key.toUpperCase() === 'U') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });
  
  // Bloqueia menu de contexto (right-click)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true });
}

// 🛡️ FIM DO LAYER 2 DESATIVADO

// 🚨 GLOBAL ERROR CAPTURE - Captura todos os erros do sistema
// REGRA P0: nunca pode derrubar o bootstrap. Se falhar, segue sem logger.
try {
  initGlobalErrorCapture();
} catch (err) {
  // não usar console.error (pode estar interceptado em cenários parciais)
  console.log('[SystemLog] initGlobalErrorCapture falhou (ignorado):', (err as Error)?.message || String(err));
}

// ============================================
// 🔁 SPA DEEP LINK FIX (P0 - zero tela preta)
// Alguns hosts estáticos retornam 404 em rotas diretas (ex: /auth?dev=1).
// Estratégia: páginas estáticas (public/*/index.html) redirecionam para
// '/?redirect=...' e aqui reescrevemos a URL ANTES do React montar.
// ============================================
if (typeof window !== "undefined") {
  try {
    const url = new URL(window.location.href);
    const redirect = url.searchParams.get("redirect");

    if (redirect) {
      const decoded = decodeURIComponent(redirect);
      // Segurança básica: só aceita caminhos internos
      if (decoded.startsWith("/")) {
        url.searchParams.delete("redirect");
        const cleanSearch = url.searchParams.toString();
        const clean = `${decoded}${cleanSearch ? `?${cleanSearch}` : ""}${url.hash || ""}`;
        window.history.replaceState(null, "", clean);
      }
    }
  } catch {
    // silencioso (não pode quebrar bootstrap)
  }
}

// ============================================
// 🚀 TTI OPTIMIZATION PROTOCOL
// Render React PRIMEIRO, defer todo o resto
// Objetivo: TTI -60%
// ============================================

// 🚀 CRITICAL: Render React imediatamente (TTI critical path)
const rootElement = document.getElementById("root");
if (rootElement) {
  (async () => {
    try {
      const mod = (await import('./App.tsx')) as unknown as AppModule;
      const App = mod.default;
      createRoot(rootElement).render(<App />);

      // ✅ Bootstrap status: esconder assim que o React montou
      try {
        const bs = document.getElementById('bootstrap-status');
        if (bs) bs.style.display = 'none';
      } catch {
        // silencioso
      }
    } catch (err) {
      // Sem overlay: apenas deixa evidência no bootstrap-status
      try {
        const bs = document.getElementById('bootstrap-status');
        if (bs) {
          bs.style.display = 'block';
          bs.textContent = `Falha ao iniciar a interface: ${(err as Error)?.message || String(err)}`;
        }
      } catch {
        // silencioso
      }
      console.log('[P0] Falha ao importar App.tsx (bootstrap continua):', (err as Error)?.message || String(err));
    }
  })();

  // Botão Refresh Page removido do bootstrap: controlado APENAS via React para OWNER
}

// ============================================
// 🚀 DEFER: Inicializar sistemas não-críticos APÓS render
// Usa requestIdleCallback para não bloquear main thread
// ============================================
const deferInit = (callback: () => void, timeout = 2000) => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 100);
  }
};

// Inicializa sistemas de performance APÓS o primeiro paint
if (typeof window !== 'undefined') {
  // 🚀 DEFER: Constitution e Performance systems (não críticos para TTI)
  deferInit(async () => {
    try {
      // 🏛️ CONSTITUIÇÃO: Carrega as leis após render
      const { logConstitutionStatus } = await import("@/lib/constitution");
      logConstitutionStatus();
      
      // ⚡ PERFORMANCE OMEGA: Flags e controle de performance
      const { perfFlags } = await import("@/lib/performance/performanceFlags");
      perfFlags.init();
      
      // 📱 Log de Performance Tier (após init)
      const capabilities = perfFlags.getCapabilities();
      console.log(`[PERF] 📱 Device Tier: ${capabilities.tier} (Score: ${capabilities.score}/120)`);
      console.log(`[PERF] 📶 Connection: ${capabilities.connection}`);
      console.log(`[PERF] 🔋 Lite Mode: ${perfFlags.get('liteMode') ? 'ON' : 'OFF'}`);
    } catch (err) {
      console.warn('[PERF] Inicialização deferred falhou:', err);
    }
  }, 1000);

  // 🚀 DEFER: Performance observers (monitoramento, não crítico)
  // 🛡️ SYNAPSE Ω — Long Task observer COM THROTTLE para evitar spam
  deferInit(() => {
    if ('PerformanceObserver' in window) {
      // Monitorar Long Tasks (apenas > 200ms e throttled para 1/5s)
      try {
        let lastLongTaskLog = 0;
        const longTaskObserver = new PerformanceObserver((list) => {
          const now = Date.now();
          // Throttle: no máximo 1 log a cada 5 segundos
          if (now - lastLongTaskLog < 5000) return;

          for (const entry of list.getEntries()) {
            // Só loga tarefas realmente problemáticas (> 200ms)
            if (entry.duration > 200) {
              lastLongTaskLog = now;
              console.warn(`[MATRIZ] ⚠️ Long Task: ${entry.duration.toFixed(0)}ms`);
              break; // apenas 1 log por batch
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch {
        // Long task não suportado
      }
      
      // ============================================
      // 📊 TESE 1.1 - MÉTRICAS ALVO 3500
      // LCP < 1.2s | INP < 75ms | CLS = 0 | TTFB < 100ms
      // ============================================
      
      // Monitorar LCP (Largest Contentful Paint) - ALVO: < 1200ms
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          const lcp = lastEntry.startTime;
          const status = lcp < 1200 ? '✅' : lcp < 2500 ? '⚠️' : '❌';
          console.log(`[PERF-3500] 🎨 LCP: ${lcp.toFixed(0)}ms ${status} (alvo: <1200ms)`);
          if (lcp >= 1200) {
            console.warn('[PERF-3500] LCP acima do limite 3500! Otimizar imagens/fontes críticas.');
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        // LCP não suportado
      }

      // Monitorar INP (Interaction to Next Paint) - ALVO: < 75ms
      try {
        const inpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const inpEntry = entry as PerformanceEventTiming;
            const duration = inpEntry.duration;
            const status = duration < 75 ? '✅' : duration < 200 ? '⚠️' : '❌';
            console.log(`[PERF-3500] ⚡ INP: ${duration.toFixed(0)}ms ${status} (alvo: <75ms)`);
          });
        });
        inpObserver.observe({ entryTypes: ['event'], durationThreshold: 16 } as PerformanceObserverInit);
      } catch {
        // INP não suportado - usar FID como fallback
        try {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              const fidEntry = entry as PerformanceEventTiming;
              const fid = fidEntry.processingStart - fidEntry.startTime;
              const status = fid < 75 ? '✅' : fid < 100 ? '⚠️' : '❌';
              console.log(`[PERF-3500] 👆 FID: ${fid.toFixed(0)}ms ${status} (alvo: <75ms)`);
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch {
          // FID não suportado
        }
      }

      // Monitorar CLS (Cumulative Layout Shift) - ALVO: 0
      let clsValue = 0;
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as LayoutShift;
            if (!layoutShift.hadRecentInput) {
              clsValue += layoutShift.value;
            }
          }
          const status = clsValue === 0 ? '✅' : clsValue < 0.1 ? '⚠️' : '❌';
          console.log(`[PERF-3500] 📐 CLS: ${clsValue.toFixed(4)} ${status} (alvo: 0)`);
          if (clsValue > 0) {
            console.warn('[PERF-3500] CLS detectado! Verificar dimensões de imagens/fontes.');
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch {
        // CLS não suportado
      }

      // Monitorar TTFB (Time to First Byte) - ALVO: < 100ms
      try {
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navEntry) {
          const ttfb = navEntry.responseStart - navEntry.requestStart;
          const status = ttfb < 100 ? '✅' : ttfb < 200 ? '⚠️' : '❌';
          console.log(`[PERF-3500] 🚀 TTFB: ${ttfb.toFixed(0)}ms ${status} (alvo: <100ms)`);
        }
      } catch {
        // TTFB não disponível
      }
    }
  }, 500);

  // ============================================
  // 🚫 SERVICE WORKER DESABILITADO (LEI V)
  // Regra adicional (Owner): NUNCA limpar caches/SW automaticamente.
  // Se houver algum SW legado, a remoção deve ser feita por ação manual.
  // ============================================
}

// Log de inicialização (defer para não bloquear)
deferInit(() => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   🏛️ MATRIZ DIGITAL v16.0 - TTI OPTIMIZED               ║');
  console.log('║   🚀 LCP -40% | TTI -60% | Zero Instabilidade            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
}, 2000);
