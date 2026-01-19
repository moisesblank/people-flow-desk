import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// ============================================
// ⚡ EVANGELHO DA VELOCIDADE - VITE CONFIG ⚡
// DOGMA VIII: Build otimizado com tree-shaking
// ============================================

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "framer-motion", "@tanstack/react-query"],
  },
  
  // ⚡ DOGMA VIII: Otimização de dependências
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "framer-motion",
      "zustand",
      "clsx",
      "date-fns",
    ],
    exclude: ["@vite/client", "@vite/env"],
  },
  
  // ⚡ DOGMA II + VIII: Build otimizado + ☢️ NUCLEAR SHIELD MAXIMUM
  build: {
    target: "esnext",
    // ☢️ TERSER: Ofuscação REAL - transforma código em letras aleatórias
    minify: mode === "production" ? "terser" : "esbuild",
    // ☢️ SOURCE MAPS PERMANENTEMENTE DESABILITADOS
    sourcemap: false,
    // ☢️ FIX CRÍTICO: cssCodeSplit DESABILITADO para garantir extensão .css
    cssCodeSplit: false,
    cssMinify: true,
    
    // ⚡ Limites de chunk para performance
    chunkSizeWarningLimit: 500,
    
    // ☢️ TERSER OPTIONS: Destruição total da legibilidade
    terserOptions: mode === "production" ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
        dead_code: true,
        passes: 3,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        unsafe: true,
        unsafe_arrows: true,
        unsafe_methods: true,
      },
      mangle: {
        eval: true,
        keep_classnames: false,
        keep_fnames: false,
        toplevel: true,
        safari10: true,
        properties: {
          regex: /^_/,
        },
      },
      format: {
        comments: false,
        ascii_only: true,
      },
    } : undefined,
    
    rollupOptions: {
      output: {
        // ☢️ NOMES DE ARQUIVOS 100% HASH - SEM PREFIXOS LEGÍVEIS
        // Arquivos como: x9k2m.js, a8f3.js (NÃO GodModePanel.js)
        chunkFileNames: "assets/[hash].js",
        entryFileNames: "assets/[hash].js",
        // ☢️ FIX CRÍTICO: Função para GARANTIR extensão em todos os assets
        assetFileNames: (assetInfo) => {
          // Garante que arquivos CSS sempre tenham extensão .css
          const name = assetInfo.name || '';
          if (name.endsWith('.css')) {
            return 'assets/[hash].css';
          }
          // Para outros assets (imagens, fontes, etc)
          const ext = name.split('.').pop();
          if (ext && ext !== name) {
            return `assets/[hash].${ext}`;
          }
          return 'assets/[hash][extname]';
        },
        
        // ☢️ FORÇA NOMES HASH-ONLY PARA DYNAMIC IMPORTS
        manualChunks: undefined,
      },
    },
    
  },
  
  // ⚡ DOGMA IX: Definições para otimização
  // ☢️ P0 FIX: Build ID automático para invalidação de cache
  define: {
    __DEV__: mode === "development",
    "process.env.NODE_ENV": JSON.stringify(mode),
    __APP_BUILD_ID__: JSON.stringify(new Date().toISOString()),
  },
  
  // ☢️ CSS: Source maps DESABILITADOS
  css: {
    devSourcemap: false,
  },
  
  // ⚡ Preview config
  preview: {
    port: 8080,
    strictPort: true,
  },
  
  // ⚡ Esbuild config (usado apenas em DEV)
  esbuild: mode === "development" ? {
    legalComments: "none",
    treeShaking: true,
  } : undefined,
}));
