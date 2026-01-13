import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Satoshi', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
        },
        status: {
          active: "hsl(var(--status-active))",
          vacation: "hsl(var(--status-vacation))",
          away: "hsl(var(--status-away))",
          inactive: "hsl(var(--status-inactive))",
        },
        stats: {
          red: "hsl(var(--stats-red))",
          green: "hsl(var(--stats-green))",
          blue: "hsl(var(--stats-blue))",
          purple: "hsl(var(--stats-purple))",
          gold: "hsl(var(--stats-gold))",
          cyan: "hsl(var(--stats-cyan))",
          wine: "hsl(var(--stats-wine))",
        },
        glow: {
          red: "hsl(var(--glow-red))",
          green: "hsl(var(--glow-green))",
          blue: "hsl(var(--glow-blue))",
          purple: "hsl(var(--glow-purple))",
          gold: "hsl(var(--glow-gold))",
          cyan: "hsl(var(--glow-cyan))",
          wine: "hsl(var(--glow-wine))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        holo: {
          cyan: "hsl(var(--holo-cyan))",
          purple: "hsl(var(--holo-purple))",
          pink: "hsl(var(--holo-pink))",
          blue: "hsl(var(--holo-blue))",
          green: "hsl(var(--holo-green))",
        },
        ai: {
          glow: "hsl(var(--ai-glow))",
          accent: "hsl(var(--ai-accent))",
          surface: "hsl(var(--ai-surface))",
          "surface-hover": "hsl(var(--ai-surface-hover))",
          border: "hsl(var(--ai-border))",
        },
        role: {
          owner: "hsl(var(--role-owner))",
          admin: "hsl(var(--role-admin))",
          coordenacao: "hsl(var(--role-coordenacao))",
          suporte: "hsl(var(--role-suporte))",
          monitoria: "hsl(var(--role-monitoria))",
          afiliado: "hsl(var(--role-afiliado))",
          marketing: "hsl(var(--role-marketing))",
          contabilidade: "hsl(var(--role-contabilidade))",
          employee: "hsl(var(--role-employee))",
          beta: "hsl(var(--role-beta))",
          aluno: "hsl(var(--role-aluno))",
        },
        rarity: {
          common: "hsl(var(--rarity-common))",
          rare: "hsl(var(--rarity-rare))",
          epic: "hsl(var(--rarity-epic))",
          legendary: "hsl(var(--rarity-legendary))",
        },
        // ============================================
        // SURFACE TOKENS - Substituem cores hardcoded
        // Use bg-surface-* ao invés de bg-zinc-*, bg-slate-*
        // ============================================
        surface: {
          inset: "hsl(var(--surface-inset))",
          raised: "hsl(var(--surface-raised))",
          overlay: "hsl(var(--surface-overlay))",
          subtle: "hsl(var(--surface-subtle))",
        },
        // ============================================
        // TEXT SEMANTIC TOKENS
        // ============================================
        text: {
          primary: "hsl(var(--text-primary))",
          secondary: "hsl(var(--text-secondary))",
          tertiary: "hsl(var(--text-tertiary))",
          inverse: "hsl(var(--text-inverse))",
        },
        // ============================================
        // BORDER SEMANTIC TOKENS
        // ============================================
        "border-semantic": {
          subtle: "hsl(var(--border-subtle))",
          strong: "hsl(var(--border-strong))",
          focus: "hsl(var(--border-focus))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        'glow': '0 0 40px hsl(var(--primary) / 0.3)',
        'glow-sm': '0 0 20px hsl(var(--primary) / 0.2)',
        'glow-lg': '0 0 60px hsl(var(--primary) / 0.4)',
        'spider': '0 0 30px hsl(var(--primary) / 0.3), 0 0 60px hsl(var(--stats-blue) / 0.15)',
        'wine': '0 0 40px hsl(var(--stats-wine) / 0.3)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-down": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.95)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(var(--primary) / 0.5)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shimmer": {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        "web-swing": {
          "0%, 100%": { transform: "rotate(-5deg)" },
          "50%": { transform: "rotate(5deg)" },
        },
        "dash": {
          to: { strokeDashoffset: "0" },
        },
        // 2300 Microinteractions - GPU only (transform/opacity)
        "holo-pulse": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.02)" },
        },
        "holo-glow": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
        "success-pop": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "error-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-4px)" },
          "40%, 80%": { transform: "translateX(4px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.1)" },
        },
        "ping-slow": {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "75%, 100%": { transform: "scale(1.5)", opacity: "0" },
        },
        "ping-slower": {
          "0%": { transform: "scale(1)", opacity: "0.5" },
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        "border-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        // 2300 UPGRADE - Header & Cards microinteractions
        "header-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
        "card-lift": {
          "0%": { transform: "translateY(0) scale(1)" },
          "100%": { transform: "translateY(-2px) scale(1.005)" },
        },
        "border-shimmer": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "scan": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "fade-up": "fade-up 0.4s ease-out",
        "fade-down": "fade-down 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out forwards",
        "scale-out": "scale-out 0.2s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "web-swing": "web-swing 3s ease-in-out infinite",
        "dash": "dash 3s ease-in-out forwards",
        // 2300 Animations
        "holo-pulse": "holo-pulse 3s ease-in-out infinite",
        "holo-glow": "holo-glow 2s ease-in-out infinite",
        "success-pop": "success-pop 0.4s ease-out forwards",
        "error-shake": "error-shake 0.4s ease-out",
        "spin-slow": "spin-slow 15s linear infinite",
        "gradient-x": "gradient-x 3s ease infinite",
        "pulse-slow": "pulse-slow 4s ease-in-out infinite",
        "ping-slow": "ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "ping-slower": "ping-slower 3s cubic-bezier(0, 0, 0.2, 1) infinite",
        "border-flow": "border-flow 3s linear infinite",
        // 2300 UPGRADE animations
        "header-glow": "header-glow 4s ease-in-out infinite",
        "border-shimmer": "border-shimmer 4s ease infinite",
        "scan": "scan 2s linear infinite",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover)))',
        'gradient-hero': 'linear-gradient(180deg, hsl(220 40% 6%) 0%, hsl(220 35% 12%) 100%)',
        'gradient-spider': 'linear-gradient(135deg, hsl(345 85% 45%) 0%, hsl(220 70% 45%) 100%)',
        'gradient-wine': 'linear-gradient(135deg, hsl(345 80% 40%) 0%, hsl(345 80% 30%) 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;