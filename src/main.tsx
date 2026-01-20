import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ============================================
// 🚀 MAIN.TSX v5.0 - LIMPO + P0 RECOVERY
// ============================================
// Simplificado para garantir que o React funcione
// Proteções de segurança desabilitadas temporariamente
// P0 Recovery System ativo para diagnóstico

// 🛡️ P0 RECOVERY: Limpar caches legados que causam problemas
if (typeof window !== 'undefined') {
  // Limpar service workers órfãos
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((r) => r.unregister());
    });
  }
  
  // Limpar caches problemáticos do CacheStorage
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.includes('workbox') || name.includes('sw-')) {
          caches.delete(name);
        }
      });
    });
  }

  // 🛡️ P0 RECOVERY: Expor funções de emergência no window
  (window as any).__P0_RECOVERY__ = {
    softReload: () => window.location.reload(),
    hardReload: () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/auth';
    },
    clearSession: () => {
      ['matriz_session_token', 'matriz_device_fingerprint', 'matriz_trusted_device', 
       'mfa_trust_cache', 'matriz_device_server_hash', 'matriz_is_owner_cache'].forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      console.log('[P0] Session cleared');
    }
  };
  
  console.log('[P0] Recovery system ready. Use __P0_RECOVERY__.hardReload() if stuck.');
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
