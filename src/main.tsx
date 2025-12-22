// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🏛️ MATRIZ DIGITAL - ENTRADA SAGRADA                                       ║
// ║   Constituição SYNAPSE Enforced                                             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// 🏛️ CONSTITUIÇÃO: Carrega as leis ANTES de tudo
import { logConstitutionStatus } from "@/lib/constitution";

// ⚡ DOGMA X: Inicializar sistema de performance
import { initEvangelhoCompleto } from "@/lib/performance";

// Inicializa o sistema
if (typeof window !== 'undefined') {
  // 🏛️ Log da Constituição
  logConstitutionStatus();
  
  // Performance observer para métricas críticas
  if ('PerformanceObserver' in window) {
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
console.log('║   🏛️ MATRIZ DIGITAL v10.4 - CONSTITUIÇÃO ATIVA          ║');
console.log('║   LEI I: Performance (43 Artigos) - ENFORCED            ║');
console.log('╚══════════════════════════════════════════════════════════╝');
