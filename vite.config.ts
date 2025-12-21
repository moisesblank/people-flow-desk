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
  
  // ⚡ DOGMA II + VIII: Build otimizado
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: true,
    
    // ⚡ Limites de chunk para performance
    chunkSizeWarningLimit: 500,
    
    rollupOptions: {
      output: {
        // ⚡ DOGMA VIII: Manual chunks para code splitting otimizado
        manualChunks: {
          // Vendor principal - React core
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          
          // UI Components - Radix
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-popover",
          ],
          
          // Data & State
          "vendor-data": ["@tanstack/react-query", "zustand"],
          
          // Animation
          "vendor-motion": ["framer-motion"],
          
          // Charts
          "vendor-charts": ["recharts"],
          
          // Forms
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          
          // Utilities
          "vendor-utils": ["date-fns", "clsx", "tailwind-merge"],
        },
        
        // ⚡ Naming otimizado com hash para cache
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId || "";
          if (facadeModuleId.includes("node_modules")) {
            return "assets/vendor-[name]-[hash].js";
          }
          return "assets/[name]-[hash].js";
        },
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split(".").pop() || "";
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif/i.test(extType)) {
            return "assets/images/[name]-[hash][extname]";
          }
          if (/woff2?|eot|ttf|otf/i.test(extType)) {
            return "assets/fonts/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  
  // ⚡ DOGMA IX: Definições para otimização
  define: {
    __DEV__: mode === "development",
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  
  // ⚡ Otimização de CSS
  css: {
    devSourcemap: false,
  },
  
  // ⚡ Preview config
  preview: {
    port: 8080,
    strictPort: true,
  },
  
  // ⚡ Esbuild config
  esbuild: {
    legalComments: "none",
    treeShaking: true,
    minifyIdentifiers: mode === "production",
    minifySyntax: mode === "production",
    minifyWhitespace: mode === "production",
  },
}));
