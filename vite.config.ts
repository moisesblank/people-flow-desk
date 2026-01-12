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
  
  // ⚡ DOGMA II + VIII: Build otimizado + ☢️ NUCLEAR SHIELD
  build: {
    target: "esnext",
    minify: "esbuild",
    // ☢️ SOURCE MAPS PERMANENTEMENTE DESABILITADOS
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: true,
    
    // ⚡ Limites de chunk para performance
    chunkSizeWarningLimit: 500,
    
    rollupOptions: {
      output: {
        // ⚠️ ESTABILIDADE DE PRODUÇÃO (ANTI-DEPLOY-RASGADO)
        // Em produção, evitamos manualChunks agressivo para reduzir risco de
        // interdependências entre muitos vendor chunks (e erros tipo "Cannot access 'w'").
        // Em desenvolvimento mantemos o split granular para debug/perf.
        manualChunks:
          mode === "production"
            ? undefined
            : (id) => {
                // React core - crítico, carrega primeiro
                if (
                  id.includes("node_modules/react/") ||
                  id.includes("node_modules/react-dom/") ||
                  id.includes("node_modules/scheduler/")
                ) {
                  return "vendor-react-core";
                }

                // React Router - necessário para navegação inicial
                if (id.includes("react-router")) {
                  return "vendor-react-router";
                }

                // Radix UI - dividir por uso
                if (
                  id.includes("@radix-ui/react-dialog") ||
                  id.includes("@radix-ui/react-dropdown-menu") ||
                  id.includes("@radix-ui/react-popover")
                ) {
                  return "vendor-ui-overlays";
                }

                if (
                  id.includes("@radix-ui/react-tooltip") ||
                  id.includes("@radix-ui/react-slot") ||
                  id.includes("@radix-ui/react-primitive")
                ) {
                  return "vendor-ui-primitives";
                }

                if (id.includes("@radix-ui/")) {
                  return "vendor-ui-radix";
                }

                // React Query - defer até necessário
                if (id.includes("@tanstack/react-query")) {
                  return "vendor-query";
                }

                // Zustand - leve, pode ficar junto
                if (id.includes("zustand")) {
                  return "vendor-state";
                }

                // Framer Motion - pesado, defer
                if (id.includes("framer-motion")) {
                  return "vendor-motion";
                }

                // Charts - muito pesado, sempre lazy
                if (id.includes("recharts") || id.includes("d3-")) {
                  return "vendor-charts";
                }

                // Forms - defer
                if (
                  id.includes("react-hook-form") ||
                  id.includes("@hookform/") ||
                  id.includes("zod")
                ) {
                  return "vendor-forms";
                }

                // Date utilities
                if (id.includes("date-fns")) {
                  return "vendor-date";
                }

                // Supabase
                if (id.includes("@supabase/")) {
                  return "vendor-supabase";
                }

                // PDF generation - muito pesado
                if (id.includes("jspdf")) {
                  return "vendor-pdf";
                }

                // Outras utilidades
                if (
                  id.includes("clsx") ||
                  id.includes("tailwind-merge") ||
                  id.includes("class-variance-authority")
                ) {
                  return "vendor-css-utils";
                }

                // Lucide icons - grande bundle
                if (id.includes("lucide-react")) {
                  return "vendor-icons";
                }

                return undefined;
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
  
  // ⚡ Esbuild config + ☢️ NUCLEAR SHIELD: Drop console e debugger em produção
  esbuild: {
    legalComments: "none",
    treeShaking: true,
    minifyIdentifiers: mode === "production",
    minifySyntax: mode === "production",
    minifyWhitespace: mode === "production",
    // ☢️ REMOVER console.log e debugger em produção
    drop: mode === "production" ? ["console", "debugger"] : [],
    // ☢️ Mangle de nomes para ofuscação
    mangleProps: mode === "production" ? /^_/ : undefined,
  },
}));
