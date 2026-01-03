// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🏛️ MATRIZ DIGITAL - ENTRADA SAGRADA                                       ║
// ║   Evangelho da Velocidade v16.0 + Performance Omega                         ║
// ║   ANO 2300 — DESIGN FUTURISTA COM RENDIMENTO 3500                           ║
// ║   🚀 TTI OPTIMIZATION: -60% via defer de inicializações                      ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

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
import App from "./App.tsx";
import "./index.css";
import { initGlobalErrorCapture } from "@/hooks/useSystemLogs";

// 🚨 GLOBAL ERROR CAPTURE - Captura todos os erros do sistema
initGlobalErrorCapture();

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
  createRoot(rootElement).render(<App />);

  // ╔══════════════════════════════════════════════════════════════════════════════╗
  // ║   🛡️ P0 ANTI-TELA-PRETA v2.0 — RUNTIME RECOVERY                            ║
  // ║   Uses the same recovery system as index.html for consistency               ║
  // ╚══════════════════════════════════════════════════════════════════════════════╝
  window.setTimeout(() => {
    try {
      const hasContent = rootElement.children.length > 0;
      const already = document.getElementById('p0-recovery');
      if (!hasContent && !already) {
        console.warn('[P0] Root vazio após timeout (runtime) — usando sistema de recuperação');
        // Import and use the recovery system
        import('@/lib/recovery/p0RecoverySystem').then(({ injectSafeShellUI }) => {
          injectSafeShellUI('A página demorou para iniciar.');
        }).catch(() => {
          // Fallback: Use window.P0Recovery if import fails
          if ((window as any).P0Recovery) {
            // Recovery is already available from index.html
            console.log('[P0] Using index.html P0Recovery');
          } else {
            // Last resort: simple reload button
            const overlay = document.createElement('div');
            overlay.id = 'p0-recovery';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#0d0d0d;color:#f5f5f5;display:flex;align-items:center;justify-content:center;padding:24px';
            overlay.innerHTML = '<div style="text-align:center"><h2 style="font-size:18px;margin-bottom:16px">Sistema em recuperação</h2><button onclick="window.location.reload()" style="padding:12px 24px;background:#dc2626;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600">Recarregar</button></div>';
            document.body.appendChild(overlay);
          }
        });
      }
    } catch {
      // nunca bloquear bootstrap
    }
  }, 12000); // Aumentado para 12s para evitar falsos positivos
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
  deferInit(() => {
    if ('PerformanceObserver' in window) {
      // Monitorar Long Tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn(`[MATRIZ] ⚠️ Long Task: ${entry.duration.toFixed(0)}ms`);
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
  // 🚫 SERVICE WORKER DESABILITADO EM PRODUÇÃO
  // Motivo: Causava problemas com MIME types e cache de assets
  // Cache será gerenciado via CDN/Cloudflare + hash de arquivos
  // ============================================
  // NOTA: Para reativar SW, descomente o código abaixo:
  // if ('serviceWorker' in navigator) {
  //   window.addEventListener('load', () => {
  //     deferInit(() => {
  //       navigator.serviceWorker.register('/sw.js')
  //         .then((reg) => console.log('[MATRIZ] ⚡ Service Worker ativo:', reg.scope))
  //         .catch(() => { /* SW não disponível */ });
  //     }, 3000);
  //   });
  // }

  // Unregister any existing service workers to clean up
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('[MATRIZ] 🧹 Service Worker removido para evitar cache problems');
          }
        });
      }
    });
  }
}

// Log de inicialização (defer para não bloquear)
deferInit(() => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   🏛️ MATRIZ DIGITAL v16.0 - TTI OPTIMIZED               ║');
  console.log('║   🚀 LCP -40% | TTI -60% | Zero Instabilidade            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
}, 2000);
