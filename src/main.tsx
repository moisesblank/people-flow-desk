// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🏛️ MATRIZ DIGITAL - ENTRADA SAGRADA                                       ║
// ║   Evangelho da Velocidade v15.0 + Performance Omega                         ║
// ║   ANO 2300 — DESIGN FUTURISTA COM RENDIMENTO 3500                           ║
// ║   TESE 1: PROTOCOLO GÊNESIS DE CARREGAMENTO                                 ║
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

// 🏛️ CONSTITUIÇÃO: Carrega as leis ANTES de tudo
import { logConstitutionStatus } from "@/lib/constitution";

// ⚡ DOGMA X: Inicializar sistema de performance
import { initEvangelhoCompleto } from "@/lib/performance";

// ⚡ PERFORMANCE OMEGA: Flags e controle de performance
import { perfFlags } from "@/lib/performance/performanceFlags";

// ⚡ PERFORMANCE OMEGA: Inicializar sistema de flags (detecta device e rede)
perfFlags.init();

// Inicializa o sistema
if (typeof window !== 'undefined') {
  // 🏛️ Log da Constituição
  logConstitutionStatus();
  
  // 📱 Log de Performance Tier
  const capabilities = perfFlags.getCapabilities();
  console.log(`[PERF] 📱 Device Tier: ${capabilities.tier} (Score: ${capabilities.score}/120)`);
  console.log(`[PERF] 📶 Connection: ${capabilities.connection}`);
  console.log(`[PERF] 🔋 Lite Mode: ${perfFlags.get('liteMode') ? 'ON' : 'OFF'}`);
  
  // Performance observer para métricas críticas
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

  // Registrar Service Worker (Artigo 13-15)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('[MATRIZ] ⚡ Service Worker ativo:', reg.scope))
        .catch((err) => console.warn('[MATRIZ] SW erro:', err));
    });
  }
}

// Render com prioridade máxima
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}

// Log de inicialização
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   🏛️ MATRIZ DIGITAL v15.0 - PERFORMANCE OMEGA           ║');
console.log('║   LEI I: Performance (43 Artigos) - ENFORCED            ║');
console.log('╚══════════════════════════════════════════════════════════╝');
