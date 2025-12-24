// ============================================
// ⚡ MATRIZ DIGITAL - ENTRADA SAGRADA ⚡
// Evangelho da Velocidade v15.0 + SYNAPSE v7.0
// ANO 2300 — DESIGN FUTURISTA COM RENDIMENTO 3500
// ============================================

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ⚡ DOGMA X: Inicializar sistema de performance antes de tudo
import { initEvangelhoCompleto } from "@/lib/performance";

// ⚡ PERFORMANCE OMEGA: Flags e controle de performance
import { perfFlags } from "@/lib/performance/performanceFlags";

// ⚡ SYNAPSE v7.0: SW cleanup (LEI V - Anti Tela Preta)
import { registerServiceWorker } from "@/lib/registerSW";

// ============================================
// ⚡ SYNAPSE v7.0 BOOTSTRAP
// Limpa SW/caches legados ANTES do render
// para evitar HTML preso/antigo (tela preta)
// ============================================
async function bootstrap() {
  // v7.0: Limpar SW/caches legados ANTES de qualquer render
  // Isso previne "tela preta" por cache de versão antiga
  await registerServiceWorker();

  // ⚡ PERFORMANCE OMEGA: Inicializar sistema de flags (detecta device e rede)
  perfFlags.init();

  // Inicializa o Evangelho da Velocidade
  if (typeof window !== "undefined") {
    const capabilities = perfFlags.getCapabilities();
    console.log(`[PERF] 📱 Device Tier: ${capabilities.tier} (Score: ${capabilities.score}/120)`);
    console.log(`[PERF] 📶 Connection: ${capabilities.connection}`);
    console.log(`[PERF] 🔋 Lite Mode: ${perfFlags.get("liteMode") ? "ON" : "OFF"}`);

    // Performance observer para métricas críticas
    if ("PerformanceObserver" in window) {
      // Monitorar Long Tasks (DOGMA IX)
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn(`[MATRIZ] ⚠️ Long Task: ${entry.duration.toFixed(0)}ms`);
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ["longtask"] });
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
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch {
        // LCP não suportado
      }

      // Monitorar FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: PerformanceEventTiming) => {
            console.log(`[PERF] 👆 FID: ${entry.processingStart - entry.startTime}ms`);
          });
        });
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch {
        // FID não suportado
      }
    }
  }

  // Render com prioridade máxima
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(<App />);
  }

  // Log de inicialização
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║      ⚡ MATRIZ DIGITAL v10.3 - SYNAPSE v7.0 ATIVO ⚡      ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
}

// Iniciar bootstrap
bootstrap();
