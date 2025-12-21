// ============================================
// ⚡ MATRIZ DIGITAL - ENTRADA SAGRADA ⚡
// Evangelho da Velocidade Inicializado
// ============================================

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ⚡ DOGMA X: Inicializar sistema de performance antes de tudo
import { initEvangelhoCompleto } from "@/lib/performance";

// Inicializa o Evangelho da Velocidade
if (typeof window !== 'undefined') {
  // Performance observer para métricas críticas
  if ('PerformanceObserver' in window) {
    // Monitorar Long Tasks (DOGMA IX)
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`[MATRIZ] ⚠️ Long Task: ${entry.duration.toFixed(0)}ms`);
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task não suportado
    }
  }

  // Registrar Service Worker (DOGMA VII)
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
console.log('║      ⚡ MATRIZ DIGITAL v10.3 - EVANGELHO ATIVO ⚡         ║');
console.log('╚══════════════════════════════════════════════════════════╝');
