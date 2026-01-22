# 📦 BACKUP COMPLETO - CÓDIGO FONTE
## Plataforma Moisés Medeiros - Curso de Química
### Data: 16/12/2024 - Versão 9.0 (SYNAPSE v14.0)

---

## 📋 ÍNDICE

1. [Estrutura do Projeto](#estrutura-do-projeto)
2. [Configurações Principais](#configurações-principais)
3. [App Principal](#app-principal)
4. [Sistema de Autenticação](#sistema-de-autenticação)
5. [Sistema de Permissões](#sistema-de-permissões)
6. [Layout e Navegação](#layout-e-navegação)
7. [Design System](#design-system)
8. [Páginas Principais](#páginas-principais)
9. [Componentes UI](#componentes-ui)
10. [Hooks Personalizados](#hooks-personalizados)
11. [Edge Functions](#edge-functions)
12. [Banco de Dados](#banco-de-dados)

---

## 📁 ESTRUTURA DO PROJETO

```
├── src/
│   ├── App.tsx                    # Aplicação principal
│   ├── main.tsx                   # Ponto de entrada
│   ├── index.css                  # Design System CSS
│   ├── assets/                    # Imagens e recursos
│   ├── components/
│   │   ├── layout/                # AppLayout, AppSidebar, ProtectedRoute
│   │   ├── ui/                    # Componentes Shadcn/UI
│   │   ├── dashboard/             # Widgets do Dashboard
│   │   ├── auth/                  # Componentes de autenticação
│   │   ├── editor/                # Modo Deus / Editor Visual
│   │   ├── employees/             # Gestão de funcionários
│   │   ├── finance/               # Componentes financeiros
│   │   ├── lms/                   # Sistema de cursos
│   │   ├── marketing/             # Marketing e campanhas
│   │   ├── gamification/          # Sistema de XP/Badges
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.tsx            # Autenticação
│   │   ├── useAdminCheck.tsx      # Verificação de permissões
│   │   └── ...
│   ├── pages/                     # Todas as páginas
│   ├── contexts/                  # Contextos React
│   ├── lib/                       # Utilitários
│   └── integrations/supabase/     # Cliente Supabase
├── supabase/
│   ├── config.toml
│   └── functions/                 # Edge Functions
├── tailwind.config.ts
├── vite.config.ts
└── index.html
```

---

## ⚙️ CONFIGURAÇÕES PRINCIPAIS

### vite.config.ts
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
}));
```

### tailwind.config.ts
```typescript
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
        'spider': '0 0 30px hsl(345 85% 50% / 0.3), 0 0 60px hsl(220 70% 50% / 0.15)',
        'wine': '0 0 40px hsl(345 80% 40% / 0.3)',
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
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(var(--primary) / 0.5)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-up": "fade-up 0.6s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
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
```

---

## 🚀 APP PRINCIPAL

### src/App.tsx
```typescript
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GodModeProvider } from "@/contexts/GodModeContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { GodModePanel } from "@/components/editor/GodModePanel";
import { VisualEditMode } from "@/components/editor/VisualEditMode";
import { SessionTracker } from "@/components/SessionTracker";
import { KeyboardShortcutsOverlay } from "@/components/onboarding/KeyboardShortcutsOverlay";
import { Suspense, lazy, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Funcionarios = lazy(() => import("./pages/Funcionarios"));
const FinancasPessoais = lazy(() => import("./pages/FinancasPessoais"));
const FinancasEmpresa = lazy(() => import("./pages/FinancasEmpresa"));
const Entradas = lazy(() => import("./pages/Entradas"));
const Afiliados = lazy(() => import("./pages/Afiliados"));
const Alunos = lazy(() => import("./pages/Alunos"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const GestaoEquipe = lazy(() => import("./pages/GestaoEquipe"));
const Guia = lazy(() => import("./pages/Guia"));
const Calendario = lazy(() => import("./pages/Calendario"));
const Pagamentos = lazy(() => import("./pages/Pagamentos"));
const Contabilidade = lazy(() => import("./pages/Contabilidade"));
const GestaoSite = lazy(() => import("./pages/GestaoSite"));
const AreaProfessor = lazy(() => import("./pages/AreaProfessor"));
const PortalAluno = lazy(() => import("./pages/PortalAluno"));
const Integracoes = lazy(() => import("./pages/Integracoes"));
const Permissoes = lazy(() => import("./pages/Permissoes"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const Cursos = lazy(() => import("./pages/Cursos"));
const CursoDetalhe = lazy(() => import("./pages/CursoDetalhe"));
const Aula = lazy(() => import("./pages/Aula"));
const Marketing = lazy(() => import("./pages/Marketing"));
const Lancamento = lazy(() => import("./pages/Lancamento"));
const Metricas = lazy(() => import("./pages/Metricas"));
const Arquivos = lazy(() => import("./pages/Arquivos"));
const PlanejamentoAula = lazy(() => import("./pages/PlanejamentoAula"));
const TurmasOnline = lazy(() => import("./pages/TurmasOnline"));
const TurmasPresenciais = lazy(() => import("./pages/TurmasPresenciais"));
const SiteProgramador = lazy(() => import("./pages/SiteProgramador"));
const Pessoal = lazy(() => import("./pages/Pessoal"));
const DashboardExecutivo = lazy(() => import("./pages/DashboardExecutivo"));
const Monitoramento = lazy(() => import("./pages/Monitoramento"));
const Simulados = lazy(() => import("./pages/Simulados"));
const Laboratorio = lazy(() => import("./pages/Laboratorio"));
const VidaPessoal = lazy(() => import("./pages/VidaPessoal"));
const Tarefas = lazy(() => import("./pages/Tarefas"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Protected route wrapper component
const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

// Global keyboard shortcuts overlay hook
function useGlobalShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}

// App wrapper with shortcuts overlay
function AppContent() {
  const { isOpen, setIsOpen } = useGlobalShortcutsOverlay();

  return (
    <>
      <SessionTracker />
      <GodModePanel />
      <VisualEditMode />
      <KeyboardShortcutsOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/site" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/termos" element={<TermosDeUso />} />
          <Route path="/privacidade" element={<PoliticaPrivacidade />} />
          
          {/* Protected routes with layout */}
          <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
          <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
          <Route path="/funcionarios" element={<ProtectedPage><Funcionarios /></ProtectedPage>} />
          <Route path="/financas-pessoais" element={<ProtectedPage><FinancasPessoais /></ProtectedPage>} />
          <Route path="/financas-empresa" element={<ProtectedPage><FinancasEmpresa /></ProtectedPage>} />
          <Route path="/entradas" element={<ProtectedPage><Entradas /></ProtectedPage>} />
          <Route path="/afiliados" element={<ProtectedPage><Afiliados /></ProtectedPage>} />
          <Route path="/alunos" element={<ProtectedPage><Alunos /></ProtectedPage>} />
          <Route path="/relatorios" element={<ProtectedPage><Relatorios /></ProtectedPage>} />
          <Route path="/configuracoes" element={<ProtectedPage><Configuracoes /></ProtectedPage>} />
          <Route path="/gestao-equipe" element={<ProtectedPage><GestaoEquipe /></ProtectedPage>} />
          <Route path="/guia" element={<ProtectedPage><Guia /></ProtectedPage>} />
          <Route path="/calendario" element={<ProtectedPage><Calendario /></ProtectedPage>} />
          <Route path="/pagamentos" element={<ProtectedPage><Pagamentos /></ProtectedPage>} />
          <Route path="/contabilidade" element={<ProtectedPage><Contabilidade /></ProtectedPage>} />
          <Route path="/gestao-site" element={<ProtectedPage><GestaoSite /></ProtectedPage>} />
          <Route path="/area-professor" element={<ProtectedPage><AreaProfessor /></ProtectedPage>} />
          <Route path="/portal-aluno" element={<ProtectedPage><PortalAluno /></ProtectedPage>} />
          <Route path="/integracoes" element={<ProtectedPage><Integracoes /></ProtectedPage>} />
          <Route path="/permissoes" element={<ProtectedPage><Permissoes /></ProtectedPage>} />
          <Route path="/cursos" element={<ProtectedPage><Cursos /></ProtectedPage>} />
          <Route path="/cursos/:courseId" element={<ProtectedPage><CursoDetalhe /></ProtectedPage>} />
          <Route path="/cursos/:courseId/aula/:lessonId" element={<ProtectedPage><Aula /></ProtectedPage>} />
          <Route path="/marketing" element={<ProtectedPage><Marketing /></ProtectedPage>} />
          <Route path="/lancamento" element={<ProtectedPage><Lancamento /></ProtectedPage>} />
          <Route path="/metricas" element={<ProtectedPage><Metricas /></ProtectedPage>} />
          <Route path="/arquivos" element={<ProtectedPage><Arquivos /></ProtectedPage>} />
          <Route path="/planejamento-aula" element={<ProtectedPage><PlanejamentoAula /></ProtectedPage>} />
          <Route path="/turmas-online" element={<ProtectedPage><TurmasOnline /></ProtectedPage>} />
          <Route path="/turmas-presenciais" element={<ProtectedPage><TurmasPresenciais /></ProtectedPage>} />
          <Route path="/site-programador" element={<ProtectedPage><SiteProgramador /></ProtectedPage>} />
          <Route path="/pessoal" element={<ProtectedPage><Pessoal /></ProtectedPage>} />
          <Route path="/dashboard-executivo" element={<ProtectedPage><DashboardExecutivo /></ProtectedPage>} />
          <Route path="/monitoramento" element={<ProtectedPage><Monitoramento /></ProtectedPage>} />
          <Route path="/simulados" element={<ProtectedPage><Simulados /></ProtectedPage>} />
          <Route path="/laboratorio" element={<ProtectedPage><Laboratorio /></ProtectedPage>} />
          <Route path="/vida-pessoal" element={<ProtectedPage><VidaPessoal /></ProtectedPage>} />
          <Route path="/tarefas" element={<ProtectedPage><Tarefas /></ProtectedPage>} />
          
          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GodModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </GodModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
```

---

## 🔐 SISTEMA DE AUTENTICAÇÃO

### src/hooks/useAuth.tsx
```typescript
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session, Provider } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "owner" | "admin" | "employee";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: Provider) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching role:", error);
        return;
      }
      
      setRole(data?.role as AppRole ?? null);
    } catch (err) {
      console.error("Error fetching role:", err);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome },
      },
    });
    return { error };
  };

  const signInWithProvider = async (provider: Provider) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?reset=true`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      role, 
      isLoading, 
      signIn, 
      signUp, 
      signInWithProvider,
      signOut,
      resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

---

## 🛡️ SISTEMA DE PERMISSÕES

### src/hooks/useAdminCheck.tsx
```typescript
// ============================================
// MOISÉS MEDEIROS v9.0 - ADMIN CHECK HOOK
// Verificação de Permissões Owner/Admin
// MODO DEUS: Exclusivo para moisesblank@gmail.com
// ============================================

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "owner" | "admin" | "employee";

interface AdminCheckResult {
  isOwner: boolean;
  isAdmin: boolean;
  isAdminOrOwner: boolean;
  isEmployee: boolean;
  role: AppRole | null;
  isLoading: boolean;
  canEdit: boolean;
  isGodMode: boolean;
  userEmail: string | null;
}

const OWNER_EMAIL = "moisesblank@gmail.com";

export function useAdminCheck(): AdminCheckResult {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Erro ao buscar role:", error);
          setRole(null);
        } else {
          setRole(data?.role as AppRole);
        }
      } catch (err) {
        console.error("Erro ao verificar permissões:", err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, [user]);

  const userEmail = user?.email || null;
  
  // Verificação dupla de owner (role + email exato)
  const isOwner = role === "owner" && userEmail === OWNER_EMAIL;
  const isAdmin = role === "admin";
  const isAdminOrOwner = isOwner || isAdmin;
  const isEmployee = role === "employee";
  
  // MODO DEUS: Verificação tripla (role + email + hardcoded)
  const isGodMode = isOwner && userEmail === OWNER_EMAIL;
  
  // Apenas owner pode editar campos críticos
  const canEdit = isGodMode;

  return {
    isOwner,
    isAdmin,
    isAdminOrOwner,
    isEmployee,
    role,
    isLoading,
    canEdit,
    isGodMode,
    userEmail
  };
}
```

---

## 🧭 LAYOUT E NAVEGAÇÃO

### src/components/layout/ProtectedRoute.tsx
```typescript
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
```

---

## 🎨 DESIGN SYSTEM

### src/index.css (Variáveis CSS Principais)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================
   MOISÉS MEDEIROS CURSO - Design System v7.0
   Spider-Man Theme: Vermelho Vinho + Azul + Preto
   Premium Dark Theme
   ============================================ */

@layer base {
  :root {
    /* UPGRADE v10 - TEMA ESCURO VERMELHO PROFISSIONAL */
    --background: 0 0% 7%;
    --foreground: 0 0% 95%;
    
    --card: 0 0% 10%;
    --card-foreground: 0 0% 95%;
    --card-hover: 0 0% 12%;
    
    --popover: 0 0% 10%;
    --popover-foreground: 0 0% 95%;
    
    --primary: 0 84% 50%;
    --primary-foreground: 0 0% 100%;
    --primary-hover: 0 84% 45%;
    --primary-glow: 0 84% 60%;
    
    --secondary: 0 0% 15%;
    --secondary-foreground: 0 0% 95%;
    
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 65%;
    
    --accent: 0 70% 45%;
    --accent-foreground: 0 0% 100%;
    
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    
    --success: 142 71% 45%;
    --success-foreground: 0 0% 100%;
    
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 0%;
    
    --info: 199 89% 48%;
    --info-foreground: 0 0% 100%;
    
    --border: 0 0% 18%;
    --input: 0 0% 18%;
    --ring: 0 84% 50%;
    --radius: 0.75rem;
    
    /* Status colors */
    --status-active: 142 71% 45%;
    --status-vacation: 220 60% 50%;
    --status-away: 38 92% 50%;
    --status-inactive: 0 0% 46%;
    --status-online: 142 76% 36%;
    --status-offline: 0 0% 40%;
    --status-recent: 158 64% 40%;
    
    /* Stats colors */
    --stats-red: 0 84% 50%;
    --stats-green: 142 71% 45%;
    --stats-blue: 220 70% 50%;
    --stats-purple: 270 80% 55%;
    --stats-gold: 43 74% 49%;
    --stats-cyan: 180 100% 40%;
    --stats-wine: 0 70% 40%;
    
    /* Glow colors */
    --glow-red: 0 84% 55%;
    --glow-green: 142 71% 45%;
    --glow-blue: 220 70% 55%;
    --glow-purple: 270 80% 60%;
    --glow-gold: 43 74% 60%;
    --glow-cyan: 180 100% 45%;
    --glow-wine: 0 70% 50%;
    
    /* Sidebar - Dark Theme */
    --sidebar-background: 0 0% 5%;
    --sidebar-foreground: 0 0% 95%;
    --sidebar-primary: 0 84% 50%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 0 0% 12%;
    --sidebar-accent-foreground: 0 0% 95%;
    --sidebar-border: 0 0% 15%;
    --sidebar-ring: 0 84% 50%;
    
    /* Chart colors */
    --chart-1: 0 84% 50%;
    --chart-2: 220 70% 50%;
    --chart-3: 142 71% 45%;
    --chart-4: 270 80% 55%;
    --chart-5: 43 74% 49%;
    
    /* God Mode */
    --god-mode-purple: 280 80% 60%;
    --god-mode-pink: 328 100% 60%;
  }

  .dark {
    /* Dark mode - Spider-Man Theme */
    --background: 220 40% 6%;
    --foreground: 0 0% 98%;
    
    --card: 220 35% 10%;
    --card-foreground: 0 0% 98%;
    --card-hover: 220 35% 14%;
    
    --primary: 345 85% 50%;
    --primary-hover: 345 85% 55%;
    --primary-glow: 345 85% 60%;
    
    --secondary: 220 60% 35%;
    --secondary-foreground: 0 0% 98%;
    
    --accent: 345 90% 55%;
    
    --sidebar-background: 220 40% 5%;
    --sidebar-primary: 345 85% 50%;
  }
}
```

---

## 📊 INFORMAÇÕES DO BANCO DE DADOS

### Tabelas Principais:
- `profiles` - Perfis de usuários
- `user_roles` - Roles de usuários (owner, admin, employee)
- `employees` - Funcionários
- `employee_compensation` - Salários (protegido)
- `income` - Entradas financeiras
- `company_fixed_expenses` - Despesas fixas empresa
- `company_extra_expenses` - Despesas extras empresa
- `personal_fixed_expenses` - Despesas fixas pessoais
- `affiliates` - Afiliados
- `courses` - Cursos
- `lessons` - Aulas
- `enrollments` - Matrículas
- `calendar_tasks` - Tarefas do calendário
- `marketing_campaigns` - Campanhas de marketing
- `contabilidade` - Registros contábeis
- `financial_goals` - Metas financeiras
- `user_sessions` - Sessões de usuários
- `activity_log` - Log de atividades

### Funções do Banco:
- `is_owner()` - Verifica se é owner
- `can_use_god_mode()` - Permissão Modo Deus
- `can_edit_content()` - Permissão edição
- `has_role()` - Verifica role específica
- `is_admin_or_owner()` - Admin ou Owner
- `register_user_login()` - Registra login
- `register_user_logout()` - Registra logout
- `add_user_xp()` - Adiciona XP gamificação
- `update_user_streak()` - Atualiza streak

---

## 🔌 EDGE FUNCTIONS

### Funções Disponíveis:
1. `ai-assistant` - Assistente IA
2. `ai-tutor` - Tutor IA para estudos
3. `backup-data` - Backup de dados
4. `google-calendar` - Integração Google Calendar
5. `invite-employee` - Convite funcionários
6. `send-2fa-code` - Envio código 2FA
7. `verify-2fa-code` - Verificação 2FA
8. `send-notification-email` - Notificações email
9. `send-report` - Envio relatórios
10. `social-media-stats` - Stats redes sociais
11. `youtube-api` - Integração YouTube
12. `webhook-curso-quimica` - Webhook Hotmart

---

## 📝 NOTAS IMPORTANTES

### Segurança:
- RLS (Row Level Security) ativo em todas as tabelas
- Owner email hardcoded: `moisesblank@gmail.com`
- 2FA por email obrigatório no login
- Verificação tripla para Modo Deus

### Roles do Sistema:
1. **owner** - Acesso total, Modo Deus
2. **admin** - Gestão administrativa
3. **employee** - Acesso limitado por setor

### Backup:
- Conecte ao GitHub para backup automático em tempo real
- Settings → GitHub → Connect to GitHub

---

## 🔄 COMO RESTAURAR

1. Crie um novo projeto Lovable
2. Copie os arquivos de configuração (vite.config.ts, tailwind.config.ts)
3. Copie o index.css para o design system
4. Copie o App.tsx e configure as rotas
5. Instale as dependências necessárias
6. Conecte ao Supabase com as mesmas credenciais
7. Execute as migrations do banco

---

**Gerado em:** 16/12/2024
**Versão:** 9.0 (SYNAPSE v14.0)
**Autor:** Sistema Lovable AI
