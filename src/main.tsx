// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🏛️ MATRIZ DIGITAL - ENTRADA SAGRADA                                       ║
// ║   Evangelho da Velocidade v15.0 + Performance Omega                         ║
// ║   ANO 2300 — DESIGN FUTURISTA COM RENDIMENTO 3500                           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

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
    
    // Monitorar LCP (Largest Contentful Paint)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`[PERF] 🎨 LCP: ${lastEntry.startTime.toFixed(0)}ms`);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      // LCP não suportado
    }

    // Monitorar FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          console.log(`[PERF] 👆 FID: ${(fidEntry.processingStart - fidEntry.startTime).toFixed(0)}ms`);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch {
      // FID não suportado
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
